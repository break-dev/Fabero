import { useState, useEffect, useMemo } from "react";
import { ProgramarRecepcionService } from "../service/programar-recepcion.service";
import type { ProgramacionListItem } from "../service/programar-recepcion.responses";
import { useNotify } from "../../../hooks/useNotify";

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export { getTodayString };

export const useProgramaciones = () => {
  const [programaciones, setProgramaciones] = useState<ProgramacionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>(getTodayString());
  const [fechaFin, setFechaFin] = useState<string>(getTodayString());
  const { notifyError } = useNotify();

  const fetchProgramaciones = async () => {
    setLoading(true);
    try {
      const data = await ProgramarRecepcionService.getProgramaciones({
        solo_pendientes: true,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      setProgramaciones(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las programaciones");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch reactivo al cambiar fechas.
  useEffect(() => {
    void fetchProgramaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  const programacionesFiltradas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return programaciones;
    return programaciones.filter(
      (p) =>
        p.empresa_transporte_razon_social.toLowerCase().includes(q) ||
        (p.vehiculo_placa ?? "").toLowerCase().includes(q) ||
        (p.conductor_nombre_completo ?? "").toLowerCase().includes(q) ||
        (p.proveedor_razon_social ?? "").toLowerCase().includes(q) ||
        (p.guia_remitente ?? "").toLowerCase().includes(q) ||
        (p.guia_transportista ?? "").toLowerCase().includes(q),
    );
  }, [programaciones, searchQuery]);

  const resetFilters = () => {
    setSearchQuery("");
    setFechaInicio(getTodayString());
    setFechaFin(getTodayString());
  };

  const insertProgramacion = (p: ProgramacionListItem) => {
    setProgramaciones((prev) => {
      const exists = prev.some((item) => item.id === p.id);
      if (exists) {
        return prev.map((item) => (item.id === p.id ? p : item));
      }
      return [p, ...prev];
    });
  };

  return {
    programaciones: programacionesFiltradas,
    loading,
    searchQuery,
    setSearchQuery,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetFilters,
    fetchProgramaciones,
    insertProgramacion,
  };
};
