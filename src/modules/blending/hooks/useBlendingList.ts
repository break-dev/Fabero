import { useState, useCallback, useEffect } from "react";
import { BlendingService } from "../service/blending.service";
import type { BlendingResponse } from "../service/blending.responses";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

export const useBlendingList = () => {
  const [blendings, setBlendings] = useState<BlendingResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const { notifyError } = useNotify();

  const fetchBlendings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BlendingService.get_blendings({
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      setBlendings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar la lista de blendings.";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, notifyError]);

  useEffect(() => {
    fetchBlendings();
  }, [fetchBlendings]);

  return {
    blendings,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    refetch: fetchBlendings,
  };
};
