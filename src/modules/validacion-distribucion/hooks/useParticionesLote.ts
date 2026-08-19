import { useCallback, useEffect, useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import type { DTO_UpdateParticion } from "../service/validacion-distribucion.requests";
import type { RES_Particion } from "../service/validacion-distribucion.responses";

export type PesoField = "peso_inicial" | "peso_final" | "peso_neto";

export interface Snapshot {
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const snapshotFrom = (p: RES_Particion): Snapshot => ({
  peso_inicial: p.peso_inicial,
  peso_final: p.peso_final,
  peso_neto: p.peso_neto,
});

export const snapshotEqual = (a: Snapshot, b: Snapshot): boolean =>
  a.peso_inicial === b.peso_inicial &&
  a.peso_final === b.peso_final &&
  a.peso_neto === b.peso_neto;

/**
 * Reparte el peso neto del lote entre las particiones NO bloqueadas,
 * asignando el mismo share a cada una. Las bloqueadas conservan sus
 * pesos actuales.
 *
 * Reglas verificadas con casos de prueba:
 * - 1 particion, total=15, sin locked → share=15
 * - 2 particiones, total=15, sin locked → share=7.5
 * - 3 particiones, total=15, sin locked → share=5
 * - 3 particiones, 1 bloqueada con 7.5 → restantes=(15-7.5)/2=3.75
 */
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

  const lockedSum = normalized
    .filter((p) => p.es_bloqueado)
    .reduce((s, p) => s + (p.peso_neto ?? 0), 0);

  const unlocked = normalized.filter((p) => !p.es_bloqueado);
  if (unlocked.length === 0) return normalized;

  const unlockedWithWeight = unlocked.filter((p) => (p.peso_neto ?? 0) > 0);
  const unlockedZero = unlocked.filter((p) => (p.peso_neto ?? 0) === 0);

  if (unlockedZero.length > 0 && unlockedWithWeight.length > 0) {
    const fixedSum =
      lockedSum +
      unlockedWithWeight.reduce((s, p) => s + (p.peso_neto ?? 0), 0);
    const remanente = round2(Math.max(0, total - fixedSum));
    const baseShare = round2(remanente / unlockedZero.length);

    let currentSum = 0;
    const zeroMapped = new Map<number, RES_Particion>();
    unlockedZero.forEach((p, idx) => {
      let share: number;
      if (idx === unlockedZero.length - 1) {
        share = round2(remanente - currentSum);
      } else {
        share = baseShare;
        currentSum = round2(currentSum + share);
      }
      const pesoFinal = p.peso_final ?? 0;
      const pesoInicial = round2(share + pesoFinal);
      zeroMapped.set(p.id, {
        ...p,
        peso_inicial: pesoInicial,
        peso_final: pesoFinal,
        peso_neto: share,
      });
    });

    return normalized.map((p) => zeroMapped.get(p.id) ?? p);
  }

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

/**
 * Aplica la regla intra-particion cuando se edita un campo de peso:
 * - editar peso_inicial → peso_final = peso_inicial - peso_neto
 * - editar peso_final → peso_inicial = peso_final + peso_neto
 * - editar peso_neto → mantiene el ratio previo entre inicial y neto
 */
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

export const useParticionesLote = (
  idLote: number,
  lotePesoNeto: number
) => {
  const [particiones, setParticiones] = useState<RES_Particion[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, Snapshot>>({});
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const rawData = await ValidacionDistribucionService.getParticiones(idLote);
      const data = rawData.map(normalizeParticion);
      setSnapshots((prev) => {
        const next = { ...prev };
        for (const p of data) {
          if (!next[p.id]) next[p.id] = snapshotFrom(p);
        }
        return next;
      });

      const total = Number(lotePesoNeto) || 0;
      const hasZeroPartitions = data.some((p) => (p.peso_neto ?? 0) === 0);
      if (data.length > 0 && hasZeroPartitions && total > 0) {
        setParticiones(computeRebalance(data, total));
      } else {
        setParticiones(data);
      }
    } catch {
      notifyError("No se pudo cargar el detalle del lote.");
    } finally {
      setLoading(false);
    }
  }, [idLote, lotePesoNeto, notifyError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crearParticion = useCallback(async () => {
    setCreating(true);
    try {
      await ValidacionDistribucionService.crearParticion(idLote, {});
      const rawExistentes = await ValidacionDistribucionService.getParticiones(idLote);
      const existentes = rawExistentes.map(normalizeParticion);
      setSnapshots((prev) => {
        const next = { ...prev };
        for (const p of existentes) {
          if (!next[p.id]) next[p.id] = snapshotFrom(p);
        }
        return next;
      });

      const total = Number(lotePesoNeto) || 0;
      const rebalanced = computeRebalance(existentes, total);
      setParticiones(rebalanced);
      notifySuccess(`Partición creada correctamente.`);
    } catch {
      notifyError("No se pudo crear la partición.");
    } finally {
      setCreating(false);
    }
  }, [idLote, lotePesoNeto, notifyError, notifySuccess]);

  const ajustarPeso = useCallback(
    (id: number, field: PesoField, value: number) => {
      const total = Number(lotePesoNeto) || 0;
      setParticiones((prev) => {
        const updated = prev.map((p) =>
          p.id !== id ? p : applyWithinRule(p, field, value)
        );
        if (field === "peso_neto") {
          const lockedSum = updated
            .filter((p) => p.es_bloqueado || p.id === id)
            .reduce((s, p) => s + (p.peso_neto ?? 0), 0);
          const others = updated.filter(
            (p) => p.id !== id && !p.es_bloqueado
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
        const rawActualizadas = await ValidacionDistribucionService.updateParticion(
          id,
          payload
        );
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
        const hasZeroPartitions = data.some((p) => (p.peso_neto ?? 0) === 0);
        if (data.length > 0 && hasZeroPartitions && total > 0) {
          setParticiones(computeRebalance(data, total));
        } else {
          setParticiones(data);
        }

        if (successMsg) notifySuccess(successMsg);
        return data;
      } catch {
        notifyError(errorMsg);
        await cargar();
        return null;
      } finally {
        setSavingIds((s) => ({ ...s, [id]: false }));
      }
    },
    [cargar, lotePesoNeto, notifyError, notifySuccess]
  );

  const guardar = useCallback(
    async (id: number) => {
      const p = particiones.find((x) => x.id === id);
      if (!p) return;
      const snap = snapshots[id];
      if (snap && snapshotEqual(snap, snapshotFrom(p))) return;
      await persistOne(
        id,
        {
          peso_inicial: p.peso_inicial,
          peso_final: p.peso_final,
          peso_neto: p.peso_neto,
        },
        `Partición ${p.particion} guardada.`,
        "No se pudo guardar la partición."
      );
    },
    [particiones, snapshots, persistOne]
  );

  const eliminar = useCallback(
    async (p: RES_Particion) => {
      await persistOne(
        p.id,
        { estado: "Eliminado" },
        `Partición ${p.particion} eliminada.`,
        "No se pudo eliminar la partición."
      );
    },
    [persistOne]
  );

  const toggleBloqueo = useCallback(
    async (p: RES_Particion) => {
      const nuevoEstado = !p.es_bloqueado;
      const total = Number(lotePesoNeto) || 0;
      setParticiones((prev) => {
        const nextArr = prev.map((x) =>
          x.id === p.id ? { ...x, es_bloqueado: nuevoEstado } : x
        );
        return computeRebalance(nextArr, total);
      });
      try {
        await ValidacionDistribucionService.updateParticion(p.id, {
          es_bloqueado: nuevoEstado,
        });
        notifySuccess(
          nuevoEstado
            ? `Partición ${p.particion} bloqueada.`
            : `Partición ${p.particion} desbloqueada.`
        );
      } catch {
        setParticiones((prev) => {
          const reverted = prev.map((x) =>
            x.id === p.id ? { ...x, es_bloqueado: !nuevoEstado } : x
          );
          return computeRebalance(reverted, total);
        });
        notifyError("No se pudo actualizar el estado de bloqueo.");
      }
    },
    [lotePesoNeto, notifyError, notifySuccess]
  );

  const cambiarFecha = useCallback(
    async (
      idParticion: number,
      campo: "fecha_hora_peso_inicial" | "fecha_hora_peso_final",
      iso: string | null
    ) => {
      setParticiones((prev) =>
        prev.map((p) => (p.id === idParticion ? { ...p, [campo]: iso } : p))
      );
      await persistOne(
        idParticion,
        { [campo]: iso } as DTO_UpdateParticion,
        "",
        "No se pudo guardar la fecha."
      );
    },
    [persistOne]
  );

  const reemplazarParticiones = useCallback(
    (arr: RES_Particion[]) => {
      const data = arr.map(normalizeParticion);
      setSnapshots((prev) => {
        const next = { ...prev };
        for (const p of data) {
          if (!next[p.id]) next[p.id] = snapshotFrom(p);
        }
        return next;
      });

      const total = Number(lotePesoNeto) || 0;
      const hasZeroPartitions = data.some((p) => (p.peso_neto ?? 0) === 0);
      if (data.length > 0 && hasZeroPartitions && total > 0) {
        setParticiones(computeRebalance(data, total));
      } else {
        setParticiones(data);
      }
    },
    [lotePesoNeto]
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

  const isDirty = (p: RES_Particion): boolean => {
    const snap = snapshots[p.id];
    if (!snap) return false;
    return !snapshotEqual(snap, snapshotFrom(p));
  };

  return {
    particiones,
    snapshots,
    savingIds,
    loading,
    creating,
    cargar,
    crearParticion,
    ajustarPeso,
    guardar,
    eliminar,
    toggleBloqueo,
    cambiarFecha,
    reemplazarParticiones,
    actualizarCapacidadLocal,
    esConsistente,
    isEliminada,
    isDirty,
  };
};

export type UseParticionesLoteReturn = ReturnType<typeof useParticionesLote>;