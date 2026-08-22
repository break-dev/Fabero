import { create } from "zustand";
import type { DespachoDetalle } from "../service/programacion-despachos.responses";

interface DespachoDetalleCacheEntry {
  detalle: DespachoDetalle;
  fetchedAt: number;
}

interface DespachoDetalleState {
  byId: Record<number, DespachoDetalleCacheEntry>;
  setDetalle: (id: number, detalle: DespachoDetalle) => void;
  getDetalle: (id: number) => DespachoDetalle | undefined;
  invalidar: (id: number) => void;
  invalidarTodos: () => void;
}

/**
 * Cache de `getDespacho` por id_despacho. Permite que el detalle sobreviva a
 * colapsa/expande del row (cada expand monta de cero el componente, pero el
 * cache persiste). Tambien permite invalidar desde fuera (ej. despues de
 * crear una distribucion) para forzar un fetch fresco.
 */
export const useDespachoDetalleStore = create<DespachoDetalleState>((set, get) => ({
  byId: {},

  setDetalle: (id, detalle) => {
    set((prev) => ({
      byId: {
        ...prev.byId,
        [id]: { detalle, fetchedAt: Date.now() },
      },
    }));
  },

  getDetalle: (id) => {
    const entry = get().byId[id];
    return entry?.detalle;
  },

  invalidar: (id) => {
    set((prev) => {
      const next = { ...prev.byId };
      delete next[id];
      return { byId: next };
    });
  },

  invalidarTodos: () => {
    set({ byId: {} });
  },
}));
