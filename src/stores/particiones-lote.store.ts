import { create } from "zustand";
import type { RES_Particion } from "../modules/validacion-distribucion/service/validacion-distribucion.responses";

interface ParticionesCacheEntry {
  data: RES_Particion[];
  fetchedAt: number;
  stale: boolean;
}

interface ParticionesLoteStore {
  byLote: Record<number, ParticionesCacheEntry>;
  inflight: Record<number, Promise<RES_Particion[]>>;
  setParticiones: (idLote: number, data: RES_Particion[]) => void;
  getCached: (idLote: number) => ParticionesCacheEntry | undefined;
  isStale: (idLote: number) => boolean;
  markStale: (idLote: number) => void;
  invalidate: (idLote: number) => void;
  /**
   * Dispara una única request HTTP por idLote. Si ya hay una en vuelo,
   * devuelve la misma promise (todos los callers esperan el mismo resultado).
   * Actualiza el cache al resolverse. NO consulta cache fresco — esa
   * decisión la toma el caller (getCached + isStale).
   */
  fetchParticiones: (
    idLote: number,
    fetcher: (idLote: number) => Promise<RES_Particion[]>
  ) => Promise<RES_Particion[]>;
}

export const useParticionesLoteStore = create<ParticionesLoteStore>(
  (set, get) => ({
    byLote: {},
    inflight: {},

    setParticiones: (idLote, data) =>
      set((prev) => ({
        byLote: {
          ...prev.byLote,
          [idLote]: { data, fetchedAt: Date.now(), stale: false },
        },
      })),

    getCached: (idLote) => get().byLote[idLote],

    isStale: (idLote) => {
      const entry = get().byLote[idLote];
      if (!entry) return true;
      return entry.stale === true;
    },

    markStale: (idLote) =>
      set((prev) => {
        const entry = prev.byLote[idLote];
        if (!entry) return prev;
        return {
          byLote: {
            ...prev.byLote,
            [idLote]: { ...entry, stale: true },
          },
        };
      }),

    invalidate: (idLote) =>
      set((prev) => {
        if (!prev.byLote[idLote]) return prev;
        const next = { ...prev.byLote };
        delete next[idLote];
        return { byLote: next };
      }),

    fetchParticiones: (idLote, fetcher) => {
      const state = get();

      // Request en vuelo → todos los callers esperan la misma promise.
      const existing = state.inflight[idLote];
      if (existing) return existing;

      const promise = (async () => {
        try {
          const data = await fetcher(idLote);
          set((prev) => {
            const nextInflight = { ...prev.inflight };
            delete nextInflight[idLote];
            return {
              byLote: {
                ...prev.byLote,
                [idLote]: { data, fetchedAt: Date.now(), stale: false },
              },
              inflight: nextInflight,
            };
          });
          return data;
        } catch (e) {
          set((prev) => {
            const nextInflight = { ...prev.inflight };
            delete nextInflight[idLote];
            return { inflight: nextInflight };
          });
          throw e;
        }
      })();

      set((prev) => ({
        inflight: { ...prev.inflight, [idLote]: promise },
      }));

      return promise;
    },
  }),
);