import { useEffect, useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { useUIStore } from "../../../stores/ui.store";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import type { RES_LotePendiente } from "../service/validacion-distribucion.responses";

export const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useLotesPendientes = () => {
  const sucursal = useUIStore((s) => s.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal ?? null;

  const [fechaInicio, setFechaInicio] = useState<string>(getTodayString());
  const [fechaFin, setFechaFin] = useState<string>(getTodayString());

  const [records, setRecords] = useState<RES_LotePendiente[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await ValidacionDistribucionService.getLotesPendientes({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      setRecords(data);
    } catch {
      notifyError("No se pudieron cargar los lotes pendientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal, fechaInicio, fechaFin]);

  const resetFilters = () => {
    setFechaInicio(getTodayString());
    setFechaFin(getTodayString());
  };

  return {
    records,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    cargar,
    resetFilters,
  };
};
