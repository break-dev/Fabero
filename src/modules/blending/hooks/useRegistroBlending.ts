import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import type { ItemDisponibleResponse } from "../service/blending.responses";
import type { CrearBlendingPayload } from "../service/blending.requests";
import { BlendingService } from "../service/blending.service";
import { useNotify } from "../../../hooks/useNotify";

export interface ItemSeleccionado {
  item: ItemDisponibleResponse;
  peso_tomado: number;
}

export const useRegistroBlending = (onSuccess?: () => void) => {
  const [seleccionados, setSeleccionados] = useState<ItemSeleccionado[]>([]);
  const [fechaHoraBlending, setFechaHoraBlending] = useState<Date | null>(new Date());
  const [observacion, setObservacion] = useState<string>("");
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [evidenciasFiles, setEvidenciasFiles] = useState<File[]>([]);
  const [precioOro, setPrecioOro] = useState<number>(0);
  const [precioPlata, setPrecioPlata] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const { notifySuccess, notifyError } = useNotify();

  // Agregar un lote/blending a la lista de seleccionados
  const agregarItem = useCallback((item: ItemDisponibleResponse) => {
    setSeleccionados((prev) => {
      // Verificar si ya fue agregado
      const existe = prev.some((s) =>
        item.tipo_origen === "lote"
          ? s.item.id_lote_mineral === item.id_lote_mineral
          : s.item.id_reblending === item.id_reblending
      );
      if (existe) return prev;

      return [
        ...prev,
        {
          item,
          peso_tomado: item.tmh_disponible,
        },
      ];
    });
  }, []);

  // Remover un item de los seleccionados
  const removerItem = useCallback((item: ItemDisponibleResponse) => {
    setSeleccionados((prev) =>
      prev.filter((s) =>
        item.tipo_origen === "lote"
          ? s.item.id_lote_mineral !== item.id_lote_mineral
          : s.item.id_reblending !== item.id_reblending
      )
    );
  }, []);

  // Cambiar peso a tomar de un item seleccionado
  const setPesoTomado = useCallback((item: ItemDisponibleResponse, nuevoPeso: number) => {
    setSeleccionados((prev) =>
      prev.map((s) => {
        const esMismo =
          item.tipo_origen === "lote"
            ? s.item.id_lote_mineral === item.id_lote_mineral
            : s.item.id_reblending === item.id_reblending;

        if (!esMismo) return s;

        const pesoValidado = Math.max(0, Math.min(nuevoPeso, s.item.tmh_disponible));
        return { ...s, peso_tomado: pesoValidado };
      })
    );
  }, []);

  // Limpiar selección
  const resetForm = useCallback(() => {
    setSeleccionados([]);
    setFechaHoraBlending(new Date());
    setObservacion("");
    setEvidencias([]);
    setPrecioOro(0);
    setPrecioPlata(0);
  }, []);

  // Cálculos en tiempo real de Valores Estimados
  const valoresEstimados = useMemo(() => {
    let pesoHumedoTotal = 0;
    let pesoSecoTotal = 0;
    let sumAuTMS = 0;
    let sumAgTMS = 0;
    const humedades: number[] = [];

    seleccionados.forEach(({ item, peso_tomado }) => {
      const tmsTomado = peso_tomado * (1 - item.ley_humedad / 100);
      pesoHumedoTotal += peso_tomado;
      pesoSecoTotal += tmsTomado;
      sumAuTMS += tmsTomado * item.ley_oro;
      sumAgTMS += tmsTomado * item.ley_plata;
      humedades.push(item.ley_humedad);
    });

    const leyOro = pesoSecoTotal > 0 ? sumAuTMS / pesoSecoTotal : 0;
    const leyPlata = pesoSecoTotal > 0 ? sumAgTMS / pesoSecoTotal : 0;
    const leyHumedad = humedades.length > 0 ? humedades.reduce((a, b) => a + b, 0) / humedades.length : 0;

    // Cálculo comercial estimado (Valor Au y Valor Ag en USD)
    const valorAuEstimado = (pesoSecoTotal / 1000) * leyOro * (precioOro || 0);
    const valorAgEstimado = (pesoSecoTotal / 1000) * leyPlata * (precioPlata || 0);
    const valorTotalEstimado = valorAuEstimado + valorAgEstimado;

    return {
      pesoHumedoTotal,
      pesoSecoTotal,
      leyOro,
      leyPlata,
      leyHumedad,
      valorAuEstimado,
      valorAgEstimado,
      valorTotalEstimado,
    };
  }, [seleccionados, precioOro, precioPlata]);

  // Algoritmo de optimización para la "Mejor Combinación" entre los Lotes Seleccionados.
  // Estrategia: greedy por densidad ($/kg TMH), cap por lote configurable, leyes
  // mínimas como restricción dura. El cap (default 80%) fuerza la mezcla: ningun
  // lote puede aportar más de cap% del peso total, garantizando que la
  // selección resultante tenga ≥ ceil(100/cap) lotes cuando hay stock.
  const aplicarMejorCombinacion = useCallback(
    (
      lotesObjetivo: ItemDisponibleResponse[],
      leyMinOro: number,
      leyMinPlata: number,
      pesoMaxResultante: number,
      capMaxPorLotePct: number,
      precioOroOpt?: number,
      precioPlataOpt?: number,
    ) => {
      if (lotesObjetivo.length === 0) {
        notifyError("Agregue al menos 1 lote a 'Lotes Seleccionados' antes de usar la Mejor Combinación.");
        return;
      }
      if (pesoMaxResultante <= 0) {
        notifyError("El peso máximo resultante debe ser mayor a 0.");
        return;
      }

      // 1. Filtrar lotes disponibles con stock > 0
      const conStock = lotesObjetivo.filter((i) => i.tmh_disponible > 0);
      if (conStock.length === 0) {
        notifyError("No hay lotes con stock disponible para mezclar.");
        return;
      }

      // 2. RESTRICCIÓN DURA de leyes mínimas (no se rellena al 70%).
      const candidatos = conStock.filter(
        (i) =>
          (leyMinOro <= 0 || i.ley_oro >= leyMinOro) &&
          (leyMinPlata <= 0 || i.ley_plata >= leyMinPlata),
      );

      if (candidatos.length === 0) {
        notifyError(
          `Ningún lote cumple las leyes mínimas exigidas (Au≥${leyMinOro}, Ag≥${leyMinPlata}). Relájelas para incluir más candidatos.`,
        );
        return;
      }

      // 3. Densidad de rentabilidad por candidato ($/kg TMH).
      //    Misma fórmula que el módulo de valorización comercial estimada:
      //      densidad_i = (1 - humedad_i / 100) / 1000 × (leyOro × precioOro + leyPlata × precioPlata)
      //    Si no hay precios, fallback al score de leyes ponderadas:
      //      densidad_i = (1 - humedad_i / 100) × (leyOro × 2 + leyPlata)
      const usaPrecios =
        (precioOroOpt !== undefined && precioOroOpt > 0) ||
        (precioPlataOpt !== undefined && precioPlataOpt > 0);
      const densidad = (i: ItemDisponibleResponse): number => {
        const humedad = 1 - i.ley_humedad / 100;
        const leyScore = usaPrecios
          ? i.ley_oro * (precioOroOpt ?? 0) + i.ley_plata * (precioPlataOpt ?? 0)
          : i.ley_oro * 2 + i.ley_plata;
        return humedad * leyScore / 1000;
      };

      // 4. Ordenar por densidad descendente (mayor $/kg TMH primero).
      const ordenados = [...candidatos].sort((a, b) => densidad(b) - densidad(a));

      // 5. Greedy fill respetando cap por lote.
      //    cap absoluto = (capMaxPorLotePct / 100) × pesoMaxResultante.
      //    Ningún lote puede aportar más de ese cap; garantiza mezcla cuando hay
      //    más de ceil(100/cap) candidatos disponibles.
      const capAbsoluto = (Math.min(100, Math.max(1, capMaxPorLotePct)) / 100) * pesoMaxResultante;
      let restante = pesoMaxResultante;
      const pesosAsignados = new Map<string, number>();

      for (const item of ordenados) {
        if (restante <= 0.001) break;
        const key = `${item.tipo_origen}-${item.codigo}`;
        const pesoAsignable = Math.min(item.tmh_disponible, restante, capAbsoluto);
        if (pesoAsignable > 0.01) {
          pesosAsignados.set(key, pesoAsignable);
          restante -= pesoAsignable;
        }
      }

      if (pesosAsignados.size === 0) {
        notifyError("No se pudo asignar peso a ningún candidato con los parámetros dados.");
        return;
      }

      // 6. Construir seleccionOptima preservando el orden de densidad.
      const seleccionOptima: ItemSeleccionado[] = ordenados
        .map((item) => {
          const key = `${item.tipo_origen}-${item.codigo}`;
          const peso = pesosAsignados.get(key);
          if (peso === undefined || peso <= 0.01) return null;
          return { item, peso_tomado: Number(peso.toFixed(2)) };
        })
        .filter((x): x is ItemSeleccionado => x !== null);

      setSeleccionados(seleccionOptima);
      notifySuccess(
        `Mejor combinación calculada: ${seleccionOptima.length} lote(s) mezclado(s), `
        + `${(pesoMaxResultante - restante).toFixed(2)}/${pesoMaxResultante.toFixed(2)} kg TMH.`,
      );
    },
    [notifySuccess, notifyError],
  );

  // Enviar submit a la API
  const submit = async () => {
    if (seleccionados.length === 0) {
      notifyError("Debe seleccionar al menos un lote o blending.");
      return;
    }

    const payload: CrearBlendingPayload = {
      fecha_hora_blending: fechaHoraBlending
        ? dayjs(fechaHoraBlending).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      observacion,
      evidencias: evidenciasFiles,
      detalles: seleccionados.map((s) => ({
        id_lote_mineral: s.item.tipo_origen === "lote" ? s.item.id_lote_mineral : null,
        id_reblending: s.item.tipo_origen === "blending" ? s.item.id_reblending : null,
        peso_tomado: s.peso_tomado,
      })),
    };

    setLoading(true);
    try {
      await BlendingService.crear_blending(payload);
      notifySuccess("Blending registrado exitosamente.");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar el blending.";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    seleccionados,
    fechaHoraBlending,
    setFechaHoraBlending,
    observacion,
    setObservacion,
    evidencias,
    setEvidencias,
    evidenciasFiles,
    setEvidenciasFiles,
    precioOro,
    setPrecioOro,
    precioPlata,
    setPrecioPlata,
    valoresEstimados,
    agregarItem,
    removerItem,
    setPesoTomado,
    aplicarMejorCombinacion,
    resetForm,
    submit,
    loading,
  };
};
