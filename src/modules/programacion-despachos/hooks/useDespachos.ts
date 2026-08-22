import { useCallback, useEffect, useMemo, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { DespachoFiltros } from "../service/programacion-despachos.requests";
import type { DespachoListItem } from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";
import { formatLocalDate } from "../../../presentation/utils/local-date";

const hoyLocal = (): string => formatLocalDate(new Date());

const filtrosIniciales = (): DespachoFiltros => ({
  id_planta_destino: undefined,
  fecha_inicio: hoyLocal(),
  fecha_fin: hoyLocal(),
});

export const useDespachos = () => {
  const [filtros, setFiltros] = useState<DespachoFiltros>(filtrosIniciales);
  const [despachos, setDespachos] = useState<DespachoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  const fetchDespachos = useCallback(
    async (f: DespachoFiltros) => {
      setLoading(true);
      try {
        const data = await ProgramacionDespachosService.getDespachos(f);
        setDespachos(data);
      } catch (e) {
        console.error(e);
        notifyError("Error al cargar los despachos");
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  // Auto-fetch cuando cambian los filtros (con debounce de 300ms para no spamear la API).
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDespachos(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros, fetchDespachos]);

  const limpiarFiltros = useCallback(() => {
    setFiltros(filtrosIniciales());
  }, []);

  const upsertDespacho = useCallback((nuevo: DespachoListItem) => {
    setDespachos((prev) => {
      const idx = prev.findIndex((d) => d.id === nuevo.id);
      if (idx === -1) return [nuevo, ...prev];
      const copia = [...prev];
      copia[idx] = nuevo;
      return copia;
    });
  }, []);

  const reemplazarDespacho = useCallback(
    (
      full:
        | { cabecera: { id: number; correlativo: string; numero_correlativo: number; id_planta_destino: number; planta_destino_razon_social: string; planta_destino_ruc: string; id_empleado_registro: number; empleado_registro_nombre: string | null; id_empleado_anulacion: number | null; fecha_hora_anulacion: string | null; es_anulado: boolean; created_at: string } }
        | DespachoListItem,
    ) => {
      if ("cabecera" in full) {
        const c = full.cabecera;
        const despachoListo: DespachoListItem = {
          id: c.id,
          id_planta_destino: c.id_planta_destino,
          planta_destino_razon_social: c.planta_destino_razon_social,
          planta_destino_ruc: c.planta_destino_ruc,
          id_empleado_registro: c.id_empleado_registro,
          empleado_registro_nombre: c.empleado_registro_nombre,
          id_empleado_anulacion: c.id_empleado_anulacion,
          fecha_hora_anulacion: c.fecha_hora_anulacion,
          correlativo: c.correlativo,
          numero_correlativo: c.numero_correlativo,
          es_anulado: c.es_anulado,
          created_at: c.created_at,
          total_distribuciones: 0,
          peso_total_tomado: 0,
          peso_total_pendiente: 0,
        };
        upsertDespacho(despachoListo);
      } else {
        upsertDespacho(full);
      }
    },
    [upsertDespacho],
  );

  const recargar = useCallback(() => {
    fetchDespachos(filtros);
  }, [fetchDespachos, filtros]);

  const despachoCount = useMemo(() => despachos.length, [despachos]);

  return {
    filtros,
    setFiltros,
    limpiarFiltros,
    despachos,
    despachoCount,
    loading,
    recargar,
    upsertDespacho,
    reemplazarDespacho,
  };
};