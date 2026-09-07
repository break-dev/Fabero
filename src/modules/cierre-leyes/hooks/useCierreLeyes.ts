import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { CierreLeyesService } from "../service/cierre-leyes.service";
import { GestionLeyesService } from "../../gestion-leyes/service/gestion-leyes.service";
import type { LoteSugeridoResponse, LoteCierreResponse } from "../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse } from "../../gestion-leyes/service/gestion-leyes.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { FiltrosLotesSugeridos, GuardarValorPayload } from "../service/cierre-leyes.service";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export type CierreValidacion = { ok: boolean; motivo?: string };

/**
 * Clave estable para identificar una celda (input) y deduplicar saves concurrentes.
 */
const cellKey = (p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) =>
  `${p.id_lote_mineral}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

export const useCierreLeyes = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [lotes, setLotes] = useState<LoteCierreResponse[]>([]);
  const [lotesSugeridos, setLotesSugeridos] = useState<LoteSugeridoResponse[]>([]);
  const [grupos, setGrupos] = useState<GrupoAnalisisResponse[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSugeridos, setLoadingSugeridos] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [guardandoValorPorLote, setGuardandoValorPorLote] = useState<Record<number, boolean>>({});
  const [agregandoAnalisisPorLote, setAgregandoAnalisisPorLote] = useState<Record<number, boolean>>({});
  const [confirmandoLote, setConfirmandoLote] = useState<Record<number, boolean>>({});
  const [iniciandoLoteSugeridoId, setIniciandoLoteSugeridoId] = useState<number | null>(null);

  // Set de claves de celda actualmente guardando, para spinner per-cell.
  const [guardandoCelda, setGuardandoCelda] = useState<Set<string>>(new Set());

  // Ref espejo de `lotes` para snapshots / deduplicacion sin causar renders.
  const lotesRef = useRef(lotes);
  useEffect(() => {
    lotesRef.current = lotes;
  }, [lotes]);

  const cargarLotes = useCallback(async (filtros?: FiltrosLotesSugeridos) => {
    setLoading(true);
    try {
      const data = await CierreLeyesService.getLotesCierre(filtros);
      setLotes((data ?? []).filter((l): l is LoteCierreResponse => l != null && l.id != null));
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes de cierre");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const cargarLotesSugeridos = useCallback(async () => {
    setLoadingSugeridos(true);
    try {
      const data = await CierreLeyesService.getLotesSugeridos();
      setLotesSugeridos(data);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes sugeridos");
    } finally {
      setLoadingSugeridos(false);
    }
  }, [notifyError]);

  const cargarGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      const data = await GestionLeyesService.getGrupos();
      setGrupos(data.filter((g) => g.estado === "Activo"));
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los grupos de análisis");
    } finally {
      setLoadingGrupos(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargarGrupos();
  }, [cargarGrupos]);

  const iniciarLote = async (idLote: number): Promise<boolean> => {
    setIniciandoLoteSugeridoId(idLote);
    try {
      const nuevoLoteCierre = await CierreLeyesService.iniciarLote(idLote);
      if (!nuevoLoteCierre || nuevoLoteCierre.id == null) {
        notifyError("La respuesta del servidor no contiene el lote iniciado.");
        return false;
      }
      setLotes((prev) => [nuevoLoteCierre, ...prev]);
      setLotesSugeridos((prev) => prev.filter((l) => l.id !== idLote));
      notifySuccess("Lote seleccionado e iniciado correctamente");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("No se pudo iniciar el análisis del lote seleccionado");
      return false;
    } finally {
      setIniciandoLoteSugeridoId(null);
    }
  };

  /**
   * Guarda un valor de ley.
   *
   * Estrategia:
   *  1) Mutacion OPTIMISTA local: el cambio se refleja inmediatamente en la UI
   *     sin esperar al servidor.
   *  2) POST en background.
   *  3) Si la respuesta trae un `id` para una fila nueva, lo reconcilia localmente.
   *  4) Si falla, revierte la mutacion local usando snapshot y muestra error.
   *  5) Flag per-cell (`guardandoCelda`) para spinner fino, no global.
   */
  const guardarValor = async (payload: GuardarValorPayload): Promise<boolean> => {
    if (payload.esta_confirmada && payload.ley <= 0) {
      notifyError("No se puede confirmar un análisis sin un valor mayor a cero.");
      return false;
    }

    const key = cellKey(payload);

    setGuardandoValorPorLote((prev) => ({ ...prev, [payload.id_lote_mineral]: true }));
    setGuardandoCelda((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // Snapshot para revertir en error
    const snapshot: LoteCierreResponse | undefined = lotesRef.current.find(
      (l) => l != null && l.id === payload.id_lote_mineral,
    );

    // Mutacion optimista local
    setLotes((prev) =>
      prev.map((l) => {
        if (!l || l.id !== payload.id_lote_mineral) return l;
        return {
          ...l,
          analisis: l.analisis.map((a) => {
            const matchesById = payload.id != null && a.id === payload.id;
            const matchesByKey =
              a.id_grupo_analisis_detalle === payload.id_grupo_analisis_detalle &&
              a.uuid_fila === payload.uuid_fila &&
              a.tipo_origen === payload.tipo_origen;
            if (!matchesById && !matchesByKey) return a;
            return { ...a, ley: payload.ley, esta_confirmada: payload.esta_confirmada };
          }),
        };
      }),
    );

    try {
      const servidor = await CierreLeyesService.guardarValorLey(payload);
      if (!servidor || servidor.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        if (snapshot) {
          setLotes((prev) => prev.map((l) => (l && l.id === snapshot.id ? snapshot : l)));
        }
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === servidor.id ? servidor : l)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al guardar el valor de la ley");
      if (snapshot) {
        setLotes((prev) => prev.map((l) => (l && l.id === snapshot.id ? snapshot : l)));
      }
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[payload.id_lote_mineral];
        return copy;
      });
      setGuardandoCelda((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const agregarAnalisis = async (idLoteMineral: number): Promise<boolean> => {
    setAgregandoAnalisisPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.agregarAnalisis(idLoteMineral);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess("Nuevo análisis agregado");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al agregar el análisis");
      return false;
    } finally {
      setAgregandoAnalisisPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const eliminarFila = async (idLoteMineral: number, uuidFila: string): Promise<boolean> => {
    setGuardandoValorPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.eliminarFila(idLoteMineral, uuidFila);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess("Fila de análisis eliminada");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al eliminar la fila de análisis");
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const confirmarLote = async (idLoteMineral: number, conValorComercial: boolean): Promise<boolean> => {
    setConfirmandoLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.confirmarLoteLeyes(idLoteMineral, conValorComercial);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess(
        `Lote confirmado ${conValorComercial ? "Con Valor Comercial" : "Sin Valor Comercial"} correctamente`,
      );
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al confirmar el cierre del lote");
      return false;
    } finally {
      setConfirmandoLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const actualizarOrigenFila = async (
    idLoteMineral: number,
    uuidFila: string,
    tipoOrigen: TipoOrigen | null,
  ): Promise<boolean> => {
    setGuardandoValorPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.actualizarOrigenFila(idLoteMineral, uuidFila, tipoOrigen);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al actualizar el origen de la corrida");
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const validarCierre = useCallback(
    (lote: LoteCierreResponse, gruposAnalisis: GrupoAnalisisResponse[]): CierreValidacion => {
      if (!lote.analisis || lote.analisis.length === 0) {
        return {
          ok: false,
          motivo: "El lote no tiene registros de análisis.",
        };
      }

      for (const g of gruposAnalisis) {
        for (const a of g.analitos) {
          const valOro = a.para_valorizacion_oro as unknown;
          const valPlata = a.para_valorizacion_plata as unknown;
          const valHumedad = a.para_valorizacion_humedad as unknown;
          const valRec = a.para_valorizacion_recuperacion as unknown;

          const esParaValorizar =
            valOro === true || valOro === 1 || valOro === "1" ||
            valPlata === true || valPlata === 1 || valPlata === "1" ||
            valHumedad === true || valHumedad === 1 || valHumedad === "1" ||
            valRec === true || valRec === 1 || valRec === "1";

          if (!esParaValorizar) continue;

          const tieneConfirmadoValido = lote.analisis.some((item) => {
            const sameDetalle = Number(item.id_grupo_analisis_detalle) === Number(a.detalle_id);
            const rawConf = item.esta_confirmada as unknown;
            const isConfirmed = rawConf === true || rawConf === 1 || rawConf === "1";
            const hasValidValue = item.ley !== null && item.ley !== undefined && Number(item.ley) > 0;
            return sameDetalle && isConfirmed && hasValidValue;
          });

          if (!tieneConfirmadoValido) {
            return {
              ok: false,
              motivo: `El analito "${a.nombre}" requiere al menos un análisis confirmado con un valor mayor a cero.`,
            };
          }
        }
      }

      return { ok: true };
    },
    [],
  );

  const validacionCierrePorLote = useMemo(() => {
    const out: Record<number, CierreValidacion> = {};
    for (const l of lotes) {
      if (!l || l.id == null) continue;
      out[l.id] = validarCierre(l, grupos);
    }
    return out;
  }, [lotes, grupos, validarCierre]);

  const guardarCeldaSet = useMemo(() => guardandoCelda, [guardandoCelda]);

  const isGuardandoCelda = useCallback(
    (key: string) => guardarCeldaSet.has(key),
    [guardarCeldaSet],
  );

  return {
    lotes,
    lotesSugeridos,
    grupos,
    loading: loading || loadingGrupos,
    loadingSugeridos,
    guardandoValorPorLote,
    agregandoAnalisisPorLote,
    confirmandoLote,
    validacionCierrePorLote,
    iniciandoLoteSugeridoId,
    isGuardandoCelda,
    cellKey,
    cargarLotes,
    cargarLotesSugeridos,
    iniciarLote,
    guardarValor,
    agregarAnalisis,
    eliminarFila,
    confirmarLote,
    actualizarOrigenFila,
  };
};
