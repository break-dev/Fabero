import { useState, useEffect } from "react";
import { RecepcionVisitasService } from "../service/recepcion-visitas.service";
import type { RecepcionVisitaFilters } from "../service/recepcion-visitas.requests";
import type { RecepcionVisitaResponse } from "../service/recepcion-visitas.responses";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

export const useRecepcionVisitas = () => {
  const [recepciones, setRecepciones] = useState<RecepcionVisitaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError, notifySuccess } = useNotify();

  const [filters, setFilters] = useState<RecepcionVisitaFilters>({
    fecha_inicio: defaultFechaInicio(),
    fecha_fin: defaultFechaFin(),
  });

  const fetchRecepciones = async () => {
    setLoading(true);
    try {
      const data = await RecepcionVisitasService.getRecepciones(filters);
      setRecepciones(data);
    } catch (e: unknown) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las recepciones de visitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecepciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fecha_inicio, filters.fecha_fin]);

  const handleFilterChange = <K extends keyof RecepcionVisitaFilters>(
    key: K,
    value: RecepcionVisitaFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const insertRecepcion = (r: RecepcionVisitaResponse) => {
    if (!r) return;
    setRecepciones((prev) => [r, ...prev]);
  };

  const updateRecepcion = (r: RecepcionVisitaResponse) => {
    if (!r) return;
    setRecepciones((prev) => prev.map((item) => (item && item.id === r.id ? r : item)));
  };

  const clearFilters = () => {
    const cleared: RecepcionVisitaFilters = {
      fecha_inicio: defaultFechaInicio(),
      fecha_fin: defaultFechaFin(),
    };
    setFilters(cleared);
  };

  const handleRegistrarSalida = async (id: number, observacionSalida?: string) => {
    try {
      const res = await RecepcionVisitasService.registrarSalida(id, {
        observacion_salida: observacionSalida,
      });
      updateRecepcion(res);
      notifySuccess("Salida de visita registrada correctamente");
    } catch (e: unknown) {
      console.error(e);
      notifyError("Ocurrió un error al registrar la salida de la visita");
    }
  };

  return {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    fetchRecepciones,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
    handleRegistrarSalida,
  };
};
