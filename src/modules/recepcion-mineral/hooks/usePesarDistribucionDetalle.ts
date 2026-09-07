import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../../programacion-despachos/service/programacion-despachos.service";
import type { DistribucionDetalleItem } from "../../programacion-despachos/service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

interface UsePesarDistribucionDetalleArgs {
  detalle: DistribucionDetalleItem | null;
  onSaved?: (detalleActualizado: DistribucionDetalleItem, advertencias: string[]) => void;
  onPrintTicket?: () => void;
}

export const usePesarDistribucionDetalle = ({
  detalle,
  onSaved,
  onPrintTicket,
}: UsePesarDistribucionDetalleArgs) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();

  const [pesoTara, setPesoTara] = useState<string | number>("");
  const [pesoBruto, setPesoBruto] = useState<string | number>("");
  const [loadingTara, setLoadingTara] = useState(false);
  const [loadingBruto, setLoadingBruto] = useState(false);
  const [ultimasAdvertencias, setUltimasAdvertencias] = useState<string[]>([]);

  // Flags de confirmación sincronizados con el backend.
  // Inicializan en base al detalle que viene de la BD y se mantienen
  // en sync tras cada operación de pesaje/confirmación.
  const [taraConfirmada, setTaraConfirmada] = useState(false);
  const [brutoConfirmado, setBrutoConfirmado] = useState(false);

  useEffect(() => {
    if (detalle) {
      setPesoTara(detalle.peso_tara ?? "");
      setPesoBruto(detalle.peso_bruto ?? "");
      setTaraConfirmada(!!detalle.peso_tara_confirmado);
      setBrutoConfirmado(!!detalle.peso_bruto_confirmado);
      setUltimasAdvertencias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    detalle?.id,
    detalle?.peso_tara,
    detalle?.peso_bruto,
    detalle?.peso_tara_confirmado,
    detalle?.peso_bruto_confirmado,
  ]);

  const reset = useCallback(() => {
    setPesoTara("");
    setPesoBruto("");
  }, []);

  const taraNum = typeof pesoTara === "number" ? pesoTara : parseFloat(String(pesoTara)) || 0;
  const brutoNum = typeof pesoBruto === "number" ? pesoBruto : parseFloat(String(pesoBruto)) || 0;
  const netoNum = brutoNum > 0 && taraNum >= 0 ? Math.max(0, brutoNum - taraNum) : 0;

  const taraValido = taraNum > 0;
  const brutoValido = brutoNum > 0;
  const taraMenorBruto = taraValido && brutoValido && taraNum < brutoNum;

  /**
   * Advertencia de merma/excedente calculada en tiempo real comparando
   * peso_neto_real (peso_bruto - peso_tara) en peso seco vs peso_tomado en peso seco.
   *
   * La humedad proviene del origen del detalle:
   *   - Si el detalle es de un blending → blending_ley_humedad
   *   - Si el detalle es de un lote → lote_ley_humedad
   */
  const advertenciaMermaSeca: string | null = (() => {
    if (!detalle) return null;
    const esBlending =
      detalle.detalle_id_blending !== null && detalle.detalle_id_blending !== undefined;
    const humedad = esBlending
      ? (detalle.blending_ley_humedad ?? 0)
      : (detalle.lote_ley_humedad ?? 0);
    const pesoTomadoHumedo = detalle.peso_tomado ?? 0;
    if (humedad <= 0 || pesoTomadoHumedo <= 0 || netoNum <= 0) return null;

    const factorSeco = 1 - humedad / 100;
    const pesoTomadoSeco = pesoTomadoHumedo * factorSeco;
    const pesoNetoRealSeco = netoNum * factorSeco;
    const diferenciaSeca = pesoNetoRealSeco - pesoTomadoSeco;
    const absDiff = Math.abs(diferenciaSeca);
    const mermaPct = (absDiff / pesoTomadoSeco) * 100;

    if (mermaPct <= 1.0) return null;

    if (diferenciaSeca < 0) {
      return `Falta peso vs P.Seco distribuido (Merma: ${absDiff.toFixed(2)} Kg, -${mermaPct.toFixed(2)}%)`;
    }
    return `Sobra peso vs P.Seco distribuido (Excedente: ${absDiff.toFixed(2)} Kg, +${mermaPct.toFixed(2)}%)`;
  })();

  /**
   * Guardar un peso y (opcional) confirmar. Centraliza el manejo de errores y
   * la sincronización del flag de confirmación local.
   */
  const guardar = useCallback(
    async (
      campo: "peso_tara" | "peso_bruto",
      valor: number,
      setLoadingFlag: (b: boolean) => void,
      confirmar: boolean,
    ): Promise<boolean> => {
      if (!detalle) return false;
      if (valor <= 0) {
        notifyError(`El ${campo === "peso_tara" ? "tara" : "bruto"} debe ser mayor a 0.`);
        return false;
      }

      setLoadingFlag(true);
      try {
        const payload: {
          peso_tara?: number | null;
          peso_bruto?: number | null;
          confirmar_tara?: boolean | null;
          confirmar_bruto?: boolean | null;
        } = {};
        payload[campo] = valor;
        if (campo === "peso_tara") {
          payload.confirmar_tara = confirmar;
        } else {
          payload.confirmar_bruto = confirmar;
        }

        const result = await ProgramacionDespachosService.pesarDistribucionDetalle(
          detalle.id_distribucion,
          detalle.id,
          payload,
        );

        // Sincronizar flags locales con lo que devolvió el backend.
        if (result.detalle) {
          setTaraConfirmada(!!result.detalle.peso_tara_confirmado);
          setBrutoConfirmado(!!result.detalle.peso_bruto_confirmado);
          if (result.detalle.peso_tara !== null && result.detalle.peso_tara !== undefined) {
            setPesoTara(result.detalle.peso_tara);
          }
          if (result.detalle.peso_bruto !== null && result.detalle.peso_bruto !== undefined) {
            setPesoBruto(result.detalle.peso_bruto);
          }
        }

        if (result.advertencias && result.advertencias.length > 0) {
          setUltimasAdvertencias(result.advertencias);
          result.advertencias.forEach((msg) => notifyWarning(msg));
        } else {
          setUltimasAdvertencias([]);
          notifySuccess("Pesaje registrado correctamente");
        }

        // Imprimir el ticket después de cada pesaje/confirmación. La ventana
        // target (basada en el id) se reutiliza, así que pesar tara y luego bruto
        // solo REFRESCA la misma ventana con los pesos actualizados.
        onPrintTicket?.();

        onSaved?.(result.detalle as DistribucionDetalleItem, result.advertencias ?? []);
        return true;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error al registrar el pesaje";
        notifyError(message);
        return false;
      } finally {
        setLoadingFlag(false);
      }
    },
    [detalle, notifyError, notifySuccess, notifyWarning, onSaved, onPrintTicket],
  );

  /**
   * Confirmar tara: persiste el valor + marca como confirmada (cascada al
   * bruto si cambió de valor).
   */
  const confirmarTara = useCallback(
    (valor?: number) => guardar("peso_tara", valor ?? taraNum, setLoadingTara, true),
    [guardar, taraNum],
  );

  /**
   * Confirmar bruto: persiste el valor + marca como confirmado.
   */
  const confirmarBruto = useCallback(
    (valor?: number) => guardar("peso_bruto", valor ?? brutoNum, setLoadingBruto, true),
    [guardar, brutoNum],
  );

  /**
   * Desbloquear tara: el backend resetea el bruto + desmarca ambos confirmados.
   * El frontend limpia el input de bruto localmente.
   */
  const desbloquearTara = useCallback(async (): Promise<boolean> => {
    if (!detalle) return false;
    setLoadingTara(true);
    try {
      const result = await ProgramacionDespachosService.pesarDistribucionDetalle(
        detalle.id_distribucion,
        detalle.id,
        { confirmar_tara: false },
      );
      if (result.detalle) {
        setTaraConfirmada(!!result.detalle.peso_tara_confirmado);
        setBrutoConfirmado(!!result.detalle.peso_bruto_confirmado);
        setPesoTara(result.detalle.peso_tara ?? "");
        setPesoBruto(result.detalle.peso_bruto ?? "");
      }
      notifySuccess("Tara desbloqueada. Debe volver a pesar tara y bruto.");
      onSaved?.(result.detalle as DistribucionDetalleItem, []);
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al desbloquear la tara";
      notifyError(message);
      return false;
    } finally {
      setLoadingTara(false);
    }
  }, [detalle, notifyError, notifySuccess, onSaved]);

  /**
   * Desbloquear bruto: el backend desmarca confirmado (sin cascade).
   */
  const desbloquearBruto = useCallback(async (): Promise<boolean> => {
    if (!detalle) return false;
    setLoadingBruto(true);
    try {
      const result = await ProgramacionDespachosService.pesarDistribucionDetalle(
        detalle.id_distribucion,
        detalle.id,
        { confirmar_bruto: false },
      );
      if (result.detalle) {
        setBrutoConfirmado(!!result.detalle.peso_bruto_confirmado);
        setTaraConfirmada(!!result.detalle.peso_tara_confirmado);
        setPesoTara(result.detalle.peso_tara ?? "");
        setPesoBruto(result.detalle.peso_bruto ?? "");
      }
      notifySuccess("Bruto desbloqueado. Puede corregir el valor.");
      onSaved?.(result.detalle as DistribucionDetalleItem, []);
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al desbloquear el bruto";
      notifyError(message);
      return false;
    } finally {
      setLoadingBruto(false);
    }
  }, [detalle, notifyError, notifySuccess, onSaved]);

  return {
    pesoTara,
    setPesoTara,
    pesoBruto,
    setPesoBruto,
    taraNum,
    brutoNum,
    netoNum,
    taraValido,
    brutoValido,
    taraMenorBruto,
    loadingTara,
    loadingBruto,
    taraConfirmada,
    brutoConfirmado,
    confirmarTara,
    confirmarBruto,
    desbloquearTara,
    desbloquearBruto,
    advertenciaMermaSeca,
    ultimasAdvertencias,
    reset,
  };
};
