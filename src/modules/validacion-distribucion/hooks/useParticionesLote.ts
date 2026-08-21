import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNotify } from "../../../hooks/useNotify";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import type { DTO_UpdateParticion } from "../service/validacion-distribucion.requests";
import type { RES_Particion } from "../service/validacion-distribucion.responses";
import { useParticionesLoteStore } from "../../../stores/particiones-lote.store";

export type PesoField = "peso_inicial" | "peso_final" | "peso_neto";

export interface Snapshot {
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  es_bloqueado: boolean;
  fecha_hora_peso_inicial: string | null;
  fecha_hora_peso_final: string | null;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const snapshotFrom = (p: RES_Particion): Snapshot => ({
  peso_inicial: p.peso_inicial,
  peso_final: p.peso_final,
  peso_neto: p.peso_neto,
  es_bloqueado: p.es_bloqueado,
  fecha_hora_peso_inicial: p.fecha_hora_peso_inicial,
  fecha_hora_peso_final: p.fecha_hora_peso_final,
});

export const snapshotEqual = (a: Snapshot, b: Snapshot): boolean =>
  a.peso_inicial === b.peso_inicial &&
  a.peso_final === b.peso_final &&
  a.peso_neto === b.peso_neto &&
  a.es_bloqueado === b.es_bloqueado &&
  a.fecha_hora_peso_inicial === b.fecha_hora_peso_inicial &&
  a.fecha_hora_peso_final === b.fecha_hora_peso_final;

export const normalizeParticion = (p: RES_Particion): RES_Particion => ({
  ...p,
  peso_inicial: p.peso_inicial != null ? Number(p.peso_inicial) : 0,
  peso_final: p.peso_final != null ? Number(p.peso_final) : 0,
  peso_neto: p.peso_neto != null ? Number(p.peso_neto) : 0,
  es_bloqueado: Boolean(p.es_bloqueado),
});

export const computeRebalance = (
  arr: RES_Particion[],
  totalLote: number
): RES_Particion[] => {
  const total = Number(totalLote) || 0;
  const normalized = arr.map(normalizeParticion);
  if (normalized.length === 0) return [];

  const activas = normalized.filter((p) => p.estado !== "Eliminado");
  if (activas.length === 0) return normalized;

  const lockedSum = activas
    .filter((p) => p.es_bloqueado)
    .reduce((s, p) => s + (p.peso_neto ?? 0), 0);

  const unlocked = activas.filter((p) => !p.es_bloqueado);
  if (unlocked.length === 0) return normalized;

  const targetUnlockedSum = round2(Math.max(0, total - lockedSum));
  const baseShare = round2(targetUnlockedSum / unlocked.length);

  let currentSum = 0;
  const unlockedMapped = unlocked.map((p, idx) => {
    let share: number;
    if (idx === unlocked.length - 1) {
      share = round2(targetUnlockedSum - currentSum);
    } else {
      share = baseShare;
      currentSum = round2(currentSum + share);
    }
    const pesoFinal = p.peso_final ?? 0;
    const pesoInicial = round2(share + pesoFinal);
    return {
      ...p,
      peso_inicial: pesoInicial,
      peso_final: pesoFinal,
      peso_neto: share,
    };
  });

  const unlockedMap = new Map(unlockedMapped.map((p) => [p.id, p]));
  return normalized.map((p) => unlockedMap.get(p.id) ?? p);
};

const applyWithinRule = (
  p: RES_Particion,
  field: PesoField,
  value: number
): RES_Particion => {
  const updates: Partial<RES_Particion> = { [field]: value };

  if (field === "peso_inicial") {
    const oldNeto = p.peso_neto ?? 0;
    updates.peso_final = round2(value - oldNeto);
  } else if (field === "peso_final") {
    const oldNeto = p.peso_neto ?? 0;
    updates.peso_inicial = round2(value + oldNeto);
  } else if (field === "peso_neto") {
    const oldNeto = p.peso_neto ?? 0;
    const ratio = oldNeto > 0 ? (p.peso_inicial ?? 0) / oldNeto : 1;
    const newInicial = round2(value * ratio);
    updates.peso_inicial = newInicial;
    updates.peso_final = round2(newInicial - value);
  }

  return { ...p, ...updates };
};

const diffPayload = (
  p: RES_Particion,
  snap: Snapshot
): DTO_UpdateParticion | null => {
  const payload: DTO_UpdateParticion = {};
  if (p.peso_inicial !== snap.peso_inicial) payload.peso_inicial = p.peso_inicial;
  if (p.peso_final !== snap.peso_final) payload.peso_final = p.peso_final;
  if (p.peso_neto !== snap.peso_neto) payload.peso_neto = p.peso_neto;
  if (p.es_bloqueado !== snap.es_bloqueado) payload.es_bloqueado = p.es_bloqueado;
  if (p.fecha_hora_peso_inicial !== snap.fecha_hora_peso_inicial) {
    payload.fecha_hora_peso_inicial = p.fecha_hora_peso_inicial;
  }
  if (p.fecha_hora_peso_final !== snap.fecha_hora_peso_final) {
    payload.fecha_hora_peso_final = p.fecha_hora_peso_final;
  }
  return Object.keys(payload).length === 0 ? null : payload;
};

/**
 * Hidrata el cache de particiones para un lote sin tocar estado de UI.
 * Usa el store con dedupe de requests en vuelo. Skip si cache fresco.
 */
export const prefetchParticiones = async (idLote: number): Promise<void> => {
  const state = useParticionesLoteStore.getState();
  if (state.getCached(idLote) && !state.isStale(idLote)) return;
  try {
    await state.fetchParticiones(idLote, async (id) => {
      const raw = await ValidacionDistribucionService.getParticiones(id);
      return raw.map(normalizeParticion);
    });
  } catch {
    // silencio
  }
};

export const useParticionesLote = (
  idLote: number,
  lotePesoNeto: number
) => {
  const [particiones, setParticiones] = useState<RES_Particion[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, Snapshot>>({});
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [validatingIds, setValidatingIds] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const cacheStore = useParticionesLoteStore;

  // Refs para callbacks inestables (useNotify devuelve arrow functions inline).
  // Permiten que cargar y los effects no se recreen en cada render.
  const notifyErrorRef = useRef(notifyError);
  useEffect(() => {
    notifyErrorRef.current = notifyError;
  }, [notifyError]);

  const mergeSnapshotsFor = useCallback((arr: RES_Particion[]) => {
    setSnapshots((prev) => {
      const next = { ...prev };
      for (const p of arr) {
        if (!next[p.id]) next[p.id] = snapshotFrom(p);
      }
      return next;
    });
  }, []);

  const applyDataToState = useCallback(
    (data: RES_Particion[]) => {
      mergeSnapshotsFor(data);
      const total = Number(lotePesoNeto) || 0;
      const hasZeroPartitions = data
        .filter((p) => p.estado !== "Eliminado")
        .some((p) => (p.peso_neto ?? 0) === 0);
      if (data.length > 0 && hasZeroPartitions && total > 0) {
        setParticiones(computeRebalance(data, total));
      } else {
        setParticiones(data);
      }
    },
    [lotePesoNeto, mergeSnapshotsFor]
  );

  const cargar = useCallback(
    async (forceFetch = false): Promise<void> => {
      if (!forceFetch) {
        const cached = cacheStore.getState().getCached(idLote);
        if (cached && !cacheStore.getState().isStale(idLote)) {
          applyDataToState(cached.data);
          return;
        }
      }

      setLoading(true);
      try {
        const data = await cacheStore.getState().fetchParticiones(
          idLote,
          async (id) => {
            const raw = await ValidacionDistribucionService.getParticiones(id);
            return raw.map(normalizeParticion);
          }
        );
        applyDataToState(data);
      } catch {
        notifyErrorRef.current("No se pudo cargar el detalle del lote.");
      } finally {
        setLoading(false);
      }
    },
    [idLote, cacheStore, applyDataToState]
  );

  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  }, [cargar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Suscripcion al cache: cuando el cache cambia externamente (por ejemplo,
  // tras validar el lote desde `useLotesPendientes`), sincroniza el state local
  // para que las particiones reflejen `esta_validado=true` y demas campos.
  // Skip si hay cambios pendientes (dirtyRef) para no pisar la edicion del usuario.
  const cachedEntry = cacheStore((s) => s.byLote[idLote]);
  useEffect(() => {
    if (!cachedEntry) return;
    if (!cachedEntry.data || cachedEntry.data.length === 0) return;
    if (dirtyRef.current.size > 0) return;

    const data = cachedEntry.data;
    mergeSnapshotsFor(data);

    const total = Number(lotePesoNeto) || 0;
    const hasZeroPartitions = data
      .filter((p) => p.estado !== "Eliminado")
      .some((p) => (p.peso_neto ?? 0) === 0);
    if (data.length > 0 && hasZeroPartitions && total > 0) {
      setParticiones(computeRebalance(data, total));
    } else {
      setParticiones(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedEntry, lotePesoNeto]);

  // Refs espejo para que el flush de unmount use la última versión de estado.
  const particionesRef = useRef<RES_Particion[]>([]);
  const snapshotsRef = useRef<Record<number, Snapshot>>({});
  useEffect(() => {
    particionesRef.current = particiones;
  }, [particiones]);
  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  // Map<id, particion> con los cambios pendientes de autoguardar.
  const dirtyRef = useRef<Map<number, RES_Particion>>(new Map());

  // Detecta cambios contra snapshot extendido y agenda batch debounced (500ms).
  // Deps estables: solo estado que afecta al dirty check. notifyError/cargar via refs.
  useEffect(() => {
    const next = new Map<number, RES_Particion>();
    for (const p of particiones) {
      if (p.estado === "Eliminado") continue;
      const snap = snapshots[p.id];
      if (!snap) continue;
      if (!snapshotEqual(snap, snapshotFrom(p))) {
        next.set(p.id, p);
      }
    }
    dirtyRef.current = next;

    if (next.size === 0) return;

    const items = Array.from(next.values());
    const timer = setTimeout(() => {
      dirtyRef.current = new Map();
      const currentSnapshots = snapshotsRef.current;

      void Promise.allSettled(
        items.map(async (p) => {
          const snap = currentSnapshots[p.id];
          if (!snap) return;
          const payload = diffPayload(p, snap);
          if (!payload) return;
          const data =
            await ValidacionDistribucionService.updateParticion(
              p.id,
              payload
            );
          // Sincroniza snapshots de TODA la respuesta (incluye rebalance del backend).
          setSnapshots((prev) => {
            const nextSnap = { ...prev };
            for (const r of data) {
              nextSnap[r.id] = snapshotFrom(r);
            }
            return nextSnap;
          });
          // Sincroniza el store cache para que `puedeSeleccionarLote` (en la
          // pagina) vea los valores frescos y reflejar autoguardados al re-expandir.
          cacheStore.getState().setParticiones(idLote, data);
        })
      ).then((results) => {
        const someFailed = results.some((r) => r.status === "rejected");
        if (someFailed) {
          notifyErrorRef.current(
            "Algunos cambios no se pudieron guardar. Sincronizando con el servidor."
          );
          void cargarRef.current(true);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [particiones, snapshots, idLote, cacheStore]);

  // Flush al desmontar: evita perder autoguardados si el usuario colapsa el row.
  // Ademas sincroniza el store cache para que al re-expandir se vean los
  // valores guardados y el helper `puedeSeleccionarLote` los vea.
  useEffect(() => {
    return () => {
      const items = Array.from(dirtyRef.current.values());
      if (items.length === 0) return;
      dirtyRef.current = new Map();
      const currentSnapshots = snapshotsRef.current;
      const cacheState = useParticionesLoteStore.getState();
      for (const p of items) {
        const snap = currentSnapshots[p.id];
        if (!snap) continue;
        const payload = diffPayload(p, snap);
        if (!payload) continue;
        void ValidacionDistribucionService.updateParticion(p.id, payload)
          .then((data) => {
            const normalized = data.map(normalizeParticion);
            cacheState.setParticiones(idLote, normalized);
          })
          .catch(() => {
            // Silencio en flush de unmount.
          });
      }
    };
  }, [idLote, cacheStore]);

  const crearParticion = useCallback(
    async (
      onCreated?: (nueva: RES_Particion) => void
    ) => {
      setCreating(true);
      try {
        const nueva = await ValidacionDistribucionService.crearParticion(
          idLote,
          {}
        );
        const normalizada = normalizeParticion(nueva);
        const total = Number(lotePesoNeto) || 0;

        setSnapshots((prev) => {
          const next = { ...prev };
          next[normalizada.id] = snapshotFrom(normalizada);
          return next;
        });

        const cached = cacheStore.getState().getCached(idLote);
        const existentes = cached?.data ?? particionesRef.current;
        const merged = computeRebalance([...existentes, normalizada], total);
        cacheStore.getState().setParticiones(idLote, merged);
        setParticiones(merged);
        onCreated?.(normalizada);
        notifySuccess(`Partición creada correctamente.`);

        // Backend crea ticket_balanza + recepción automáticamente, pero el
        // response del POST no los devuelve consistentes. Refetch silencioso
        // para que la UI muestre el ticket recién creado sin recargar la página.
        try {
          const refreshed =
            await cacheStore.getState().fetchParticiones(idLote, async (id) => {
              const raw = await ValidacionDistribucionService.getParticiones(
                id
              );
              return raw.map(normalizeParticion);
            });
          cacheStore.getState().setParticiones(idLote, refreshed);
          setParticiones(refreshed);
        } catch {
          // silencio: si el refetch falla, los datos quedan con el response del POST.
        }
      } catch {
        notifyError("No se pudo crear la partición.");
      } finally {
        setCreating(false);
      }
    },
    [idLote, lotePesoNeto, notifyError, notifySuccess, cacheStore]
  );

  const ajustarPeso = useCallback(
    (id: number, field: PesoField, value: number) => {
      const total = Number(lotePesoNeto) || 0;
      setParticiones((prev) => {
        const otherLockedSum = prev
          .filter(
            (p) => p.estado !== "Eliminado" && p.id !== id && p.es_bloqueado
          )
          .reduce((s, p) => s + (p.peso_neto ?? 0), 0);

        const maxPermitido = round2(Math.max(0, total - otherLockedSum));

        let finalValue = Math.max(0, value);
        if (field === "peso_neto") {
          finalValue = Math.min(finalValue, maxPermitido);
        }

        const updated = prev.map((p) =>
          p.id !== id || p.estado === "Eliminado"
            ? p
            : applyWithinRule(p, field, finalValue)
        );
        if (field === "peso_neto") {
          const lockedSum = updated
            .filter(
              (p) =>
                p.estado !== "Eliminado" && (p.es_bloqueado || p.id === id)
            )
            .reduce((s, p) => s + (p.peso_neto ?? 0), 0);
          const others = updated.filter(
            (p) => p.estado !== "Eliminado" && p.id !== id && !p.es_bloqueado
          );
          if (others.length === 0) return updated;

          const targetOthersSum = round2(Math.max(0, total - lockedSum));
          const baseOther = round2(targetOthersSum / others.length);

          let sumOthers = 0;
          const othersMapped = new Map<number, RES_Particion>();
          others.forEach((p, idx) => {
            let perOther: number;
            if (idx === others.length - 1) {
              perOther = round2(targetOthersSum - sumOthers);
            } else {
              perOther = baseOther;
              sumOthers = round2(sumOthers + perOther);
            }
            const oldNeto = p.peso_neto ?? 0;
            const ratio = oldNeto > 0 ? (p.peso_inicial ?? 0) / oldNeto : 1;
            const newInicial = round2(perOther * ratio);
            const newFinal = round2(newInicial - perOther);
            othersMapped.set(p.id, {
              ...p,
              peso_neto: perOther,
              peso_inicial: newInicial,
              peso_final: newFinal,
            });
          });

          return updated.map((p) => othersMapped.get(p.id) ?? p);
        }
        return updated;
      });
    },
    [lotePesoNeto]
  );

  const persistOne = useCallback(
    async (
      id: number,
      payload: DTO_UpdateParticion,
      successMsg: string,
      errorMsg: string
    ): Promise<RES_Particion[] | null> => {
      setSavingIds((s) => ({ ...s, [id]: true }));
      try {
        const rawActualizadas =
          await ValidacionDistribucionService.updateParticion(id, payload);
        const data = rawActualizadas.map(normalizeParticion);
        setSnapshots((prev) => {
          const next = { ...prev };
          const refreshed = data.find((p) => p.id === id);
          if (refreshed) {
            next[id] = snapshotFrom(refreshed);
          } else {
            next[id] = snapshotFrom({ ...payload, id } as RES_Particion);
          }
          return next;
        });

        const total = Number(lotePesoNeto) || 0;
        const hasZeroPartitions = data
          .filter((p) => p.estado !== "Eliminado")
          .some((p) => (p.peso_neto ?? 0) === 0);
        if (data.length > 0 && hasZeroPartitions && total > 0) {
          setParticiones(computeRebalance(data, total));
        } else {
          setParticiones(data);
        }

        cacheStore.getState().setParticiones(idLote, data);

        if (successMsg) notifySuccess(successMsg);
        return data;
      } catch {
        notifyError(errorMsg);
        await cargarRef.current(true);
        return null;
      } finally {
        setSavingIds((s) => ({ ...s, [id]: false }));
      }
    },
    [lotePesoNeto, notifyError, notifySuccess, idLote, cacheStore]
  );

  const eliminar = useCallback(
    async (p: RES_Particion) => {
      const total = Number(lotePesoNeto) || 0;
      setParticiones((prev) => {
        const nextArr = prev.map((x) =>
          x.id === p.id ? { ...x, estado: "Eliminado" } : x
        );
        return computeRebalance(nextArr, total);
      });

      setSavingIds((s) => ({ ...s, [p.id]: true }));
      try {
        await persistOne(
          p.id,
          { estado: "Eliminado" },
          `Partición ${p.particion} eliminada.`,
          "No se pudo eliminar la partición."
        );
      } finally {
        setSavingIds((s) => ({ ...s, [p.id]: false }));
      }
    },
    [lotePesoNeto, persistOne]
  );

  const toggleBloqueo = useCallback(
    (p: RES_Particion) => {
      const nuevoEstado = !p.es_bloqueado;
      const total = Number(lotePesoNeto) || 0;

      setParticiones((prev) => {
        const nextArr = prev.map((x) =>
          x.id === p.id ? { ...x, es_bloqueado: nuevoEstado } : x
        );
        return computeRebalance(nextArr, total);
      });

      // Encolado al batch debounced (autoguardado). Sin await, sin spinner.
    },
    [lotePesoNeto]
  );

  const cambiarFecha = useCallback(
    (
      idParticion: number,
      campo: "fecha_hora_peso_inicial" | "fecha_hora_peso_final",
      iso: string | null
    ) => {
      setParticiones((prev) =>
        prev.map((p) => (p.id === idParticion ? { ...p, [campo]: iso } : p))
      );
      // Encolado al batch debounced (autoguardado). Sin await.
    },
    []
  );

  const reemplazarParticiones = useCallback(
    (arr: RES_Particion[]) => {
      const normalized = arr.map(normalizeParticion);
      cacheStore.getState().setParticiones(idLote, normalized);
      applyDataToState(normalized);
    },
    [idLote, cacheStore, applyDataToState]
  );

  const actualizarCapacidadLocal = useCallback(
    (idVehiculo: number, nuevaCapacidad: number) => {
      setParticiones((prev) =>
        prev.map((p) =>
          p.id_vehiculo === idVehiculo
            ? { ...p, vehiculo_capacidad: nuevaCapacidad }
            : p
        )
      );
    },
    []
  );

  const esConsistente = (p: RES_Particion): boolean => {
    const ini = p.peso_inicial ?? 0;
    const fin = p.peso_final ?? 0;
    const neto = p.peso_neto ?? 0;
    return Math.abs(ini - fin - neto) < 0.01;
  };

  const isEliminada = (p: RES_Particion): boolean => p.estado === "Eliminado";

  const isDirty = useCallback(
    (p: RES_Particion): boolean => {
      if (p.estado === "Eliminado") return false;
      const snap = snapshots[p.id];
      if (!snap) return false;
      return !snapshotEqual(snap, snapshotFrom(p));
    },
    [snapshots]
  );

  // Mantiene referencia para usar la funcion cargar sin incluirla en deps.
  const cargarFnRef = useRef(cargar);
  useEffect(() => {
    cargarFnRef.current = cargar;
  }, [cargar]);

  const validarParticion = useCallback(
    async (idParticion: number): Promise<boolean> => {
      setValidatingIds((s) => ({ ...s, [idParticion]: true }));
      try {
        const resultado =
          await ValidacionDistribucionService.validarParticion(idParticion);
        const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
        const updatedFlag = {
          esta_validado: resultado.esta_validado,
          id_empleado_valida: resultado.id_empleado_valida,
          fecha_hora_validacion: resultado.fecha_hora_validacion ?? now,
        };
        setParticiones((prev) =>
          prev.map((p) =>
            p.id === idParticion ? { ...p, ...updatedFlag } : p
          )
        );
        notifySuccess("Partición validada correctamente.");
        return true;
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        const msg =
          axiosErr?.response?.data?.message ??
          "No se pudo validar la partición.";
        notifyError(msg);
        // Refetch defensivo por si el backend rechazo por estado stale.
        void cargarFnRef.current(true);
        return false;
      } finally {
        setValidatingIds((s) => ({ ...s, [idParticion]: false }));
      }
    },
    [notifyError, notifySuccess]
  );

  return {
    particiones,
    snapshots,
    savingIds,
    validatingIds,
    loading,
    creating,
    cargar,
    crearParticion,
    ajustarPeso,
    eliminar,
    toggleBloqueo,
    cambiarFecha,
    reemplazarParticiones,
    actualizarCapacidadLocal,
    esConsistente,
    isEliminada,
    isDirty,
    validarParticion,
  };
};

export type UseParticionesLoteReturn = ReturnType<typeof useParticionesLote>;