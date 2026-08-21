import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNotify } from "../../../hooks/useNotify";
import { useUIStore } from "../../../stores/ui.store";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import type { RES_LotePendiente } from "../service/validacion-distribucion.responses";
import {
  normalizeParticion,
  prefetchParticiones,
} from "./useParticionesLote";
import { useParticionesLoteStore } from "../../../stores/particiones-lote.store";

export const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface ValidarLoteResult {
  ok: boolean;
  validados?: number[];
  omitidos?: { id_lote_mineral: number; lote_correlativo: string | null; razones: string[] }[];
  mensaje?: string;
}

export const useLotesPendientes = () => {
  const sucursal = useUIStore((s) => s.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal ?? null;

  const [fechaInicio, setFechaInicio] = useState<string>(getTodayString());
  const [fechaFin, setFechaFin] = useState<string>(getTodayString());

  const [records, setRecords] = useState<RES_LotePendiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [validatingIds, setValidatingIds] = useState<Record<number, boolean>>({});
  const [validatingAll, setValidatingAll] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  // Ref guard para evitar doble invocación del effect en StrictMode dev.
  // Key por sucursal+filtros: si cambia, refetch.
  const lastFetchKeyRef = useRef<string>("");

  const cargar = async () => {
    if (idSucursal === null) return;
    setLoading(true);
    try {
      const data = await ValidacionDistribucionService.getLotesPendientes({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      setRecords(data);
      // Prefetch paralelo de particiones para cada lote visible.
      // Hidrata el cache; al expandir el row, useParticionesLote lee cache.
      void Promise.allSettled(
        data.map((l) => prefetchParticiones(l.id_lote_mineral))
      );
    } catch {
      notifyError("No se pudieron cargar los lotes pendientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sin sucursal seleccionada no se dispara ninguna request.
    if (idSucursal === null) return;
    const key = `${idSucursal}|${fechaInicio}|${fechaFin}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal, fechaInicio, fechaFin]);

  const updateRecord = useCallback(
    (idLote: number, partial: Partial<RES_LotePendiente>) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id_lote_mineral === idLote ? { ...r, ...partial } : r
        )
      );
    },
    []
  );

  const resetFilters = () => {
    setFechaInicio(getTodayString());
    setFechaFin(getTodayString());
  };

  // Marca multiples lotes como validados en el estado local (optimistic).
  const marcarValidadosOptimista = useCallback(
    (idLotes: number[]) => {
      const nowIso = dayjs().format("YYYY-MM-DD HH:mm:ss");
      setRecords((prev) =>
        prev.map((r) =>
          idLotes.includes(r.id_lote_mineral)
            ? {
                ...r,
                lote_esta_validado: true,
                lote_fecha_hora_validacion: nowIso,
              }
            : r
        )
      );
    },
    []
  );

  // Refresca el cache de particiones para un lote. Tras validar el lote
  // (o multiples) el backend marca las particiones como validadas; este refetch
  // garantiza que `ParticionesExpandible` vea `esta_validado=true` y deshabilite
  // sus botones de accion.
  const refrescarCacheParticiones = useCallback(
    async (idLote: number): Promise<void> => {
      const cacheStore = useParticionesLoteStore.getState();
      await cacheStore.fetchParticiones(idLote, async (id) => {
        const raw = await ValidacionDistribucionService.getParticiones(id);
        return raw.map(normalizeParticion);
      });
    },
    []
  );

  const validarLote = useCallback(
    async (idLote: number): Promise<boolean> => {
      setValidatingIds((s) => ({ ...s, [idLote]: true }));
      try {
        const { id_lote_mineral } =
          await ValidacionDistribucionService.validarLote(idLote);
        const nowIso = dayjs().format("YYYY-MM-DD HH:mm:ss");
        setRecords((prev) =>
          prev.map((r) =>
            r.id_lote_mineral === id_lote_mineral
              ? {
                  ...r,
                  lote_esta_validado: true,
                  lote_fecha_hora_validacion: nowIso,
                }
              : r
          )
        );
        await refrescarCacheParticiones(id_lote_mineral);
        notifySuccess("Lote validado correctamente.");
        return true;
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        const msg =
          axiosErr?.response?.data?.message ??
          "No se pudo validar el lote.";
        notifyError(msg);
        return false;
      } finally {
        setValidatingIds((s) => ({ ...s, [idLote]: false }));
      }
    },
    [notifyError, notifySuccess, refrescarCacheParticiones]
  );

  // Validacion multiple. Devuelve el resultado crudo para que la UI muestre el
  // resumen en un modal post-accion.
  const validarLotes = useCallback(
    async (idLotes: number[]): Promise<ValidarLoteResult> => {
      if (idLotes.length === 0) {
        return { ok: false, mensaje: "No hay lotes para validar." };
      }
      setValidatingAll(true);
      try {
        const resultado =
          await ValidacionDistribucionService.validarLotes(idLotes);
        marcarValidadosOptimista(resultado.validados);
        // Sincroniza el cache de particiones de cada lote efectivamente validado.
        await Promise.allSettled(
          resultado.validados.map((id) => refrescarCacheParticiones(id))
        );
        return {
          ok: true,
          validados: resultado.validados,
          omitidos: resultado.omitidos,
        };
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        const msg =
          axiosErr?.response?.data?.message ??
          "No se pudo completar la validación múltiple.";
        notifyError(msg);
        return { ok: false, mensaje: msg };
      } finally {
        setValidatingAll(false);
      }
    },
    [marcarValidadosOptimista, notifyError, refrescarCacheParticiones]
  );

  return {
    records,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    cargar,
    resetFilters,
    updateRecord,
    validarLote,
    validarLotes,
    validatingIds,
    validatingAll,
  };
};
