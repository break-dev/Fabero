import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import { useNotify } from "../../../hooks/useNotify";
import { useDespachoDetalleStore } from "../stores/despacho-detalle.store";

export const useDespachoDetalle = (idDespacho: number | null) => {
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  // Suscripcion al store: re-render cuando cambie cualquier parte del state.
  // Importante: el hook del store debe llamarse INCONDICIONALMENTE para
  // respetar las Rules of Hooks. Si idDespacho es null, el selector retorna
  // undefined y no hay cache; eso es lo esperado.
  const cached = useDespachoDetalleStore((s) =>
    idDespacho !== null ? s.byId[idDespacho] : undefined,
  );
  const detalle = cached?.detalle ?? null;

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
