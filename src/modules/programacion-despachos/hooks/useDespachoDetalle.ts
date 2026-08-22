import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import { useNotify } from "../../../hooks/useNotify";
import { useDespachoDetalleStore } from "../stores/despacho-detalle.store";

export const useDespachoDetalle = (idDespacho: number | null) => {
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  // Suscripcion al store: re-render cuando cambie cualquier parte del state.
  // Para saber si cambio algo del id actual, comparamos el detalle cacheado.
  const detalle =
    idDespacho !== null
      ? (useDespachoDetalleStore((s) => s.byId[idDespacho])?.detalle ?? null)
      : null;

  const fetchDetalle = useCallback(async () => {
    if (idDespacho === null) return;
    // Si ya hay cache para este despacho, no fetcheamos de nuevo.
    if (useDespachoDetalleStore.getState().byId[idDespacho]) return;
    setLoading(true);
    try {
      const data = await ProgramacionDespachosService.getDespacho(idDespacho);
      useDespachoDetalleStore.getState().setDetalle(idDespacho, data);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar el detalle del despacho");
    } finally {
      setLoading(false);
    }
  }, [idDespacho, notifyError]);

  useEffect(() => {
    fetchDetalle();
  }, [fetchDetalle]);

  // Refrescar = invalidar cache y volver a fetchear (forzado, ignora el cache existente).
  const refrescar = useCallback(() => {
    if (idDespacho === null) return;
    useDespachoDetalleStore.getState().invalidar(idDespacho);
    fetchDetalle();
  }, [idDespacho, fetchDetalle]);

  return { detalle, loading, refrescar };
};
