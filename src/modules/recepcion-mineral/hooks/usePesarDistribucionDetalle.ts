import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../../programacion-despachos/service/programacion-despachos.service";
import type { DistribucionDetalleItem } from "../../programacion-despachos/service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

interface UsePesarDistribucionDetalleArgs {
  detalle: DistribucionDetalleItem | null;
  idLoteMineralParaTicket: number | null;
  onSaved?: (detalleActualizado: DistribucionDetalleItem, advertencias: string[]) => void;
  onPrintTicket?: () => void;
}

export const usePesarDistribucionDetalle = ({
  detalle,
  idLoteMineralParaTicket,
  onSaved,
  onPrintTicket,
}: UsePesarDistribucionDetalleArgs) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();

  const [pesoTara, setPesoTara] = useState<string | number>("");
  const [pesoBruto, setPesoBruto] = useState<string | number>("");
  const [loadingTara, setLoadingTara] = useState(false);
  const [loadingBruto, setLoadingBruto] = useState(false);
  const [ultimasAdvertencias, setUltimasAdvertencias] = useState<string[]>([]);

  useEffect(() => {
    if (detalle) {
      setPesoTara(detalle.peso_tara ?? "");
      setPesoBruto(detalle.peso_bruto ?? "");
      setUltimasAdvertencias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalle?.id]);

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
   */
  const advertenciaMermaSeca: string | null = (() => {
    if (!detalle) return null;
    const humedad = detalle.lote_ley_humedad ?? 0;
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

  const guardar = useCallback(
    async (
      campo: "peso_tara" | "peso_bruto",
      valor: number,
      setLoadingFlag: (b: boolean) => void,
    ): Promise<boolean> => {
      if (!detalle) return false;
      if (valor <= 0) {
        notifyError(`El ${campo === "peso_tara" ? "tara" : "bruto"} debe ser mayor a 0.`);
        return false;
      }

      setLoadingFlag(true);
      try {
        const payload: { peso_tara?: number | null; peso_bruto?: number | null } = {};
        payload[campo] = valor;

        const result = await ProgramacionDespachosService.pesarDistribucionDetalle(
          detalle.id_distribucion,
          detalle.id,
          payload,
        );

        if (result.advertencias && result.advertencias.length > 0) {
          setUltimasAdvertencias(result.advertencias);
          result.advertencias.forEach((msg) => notifyWarning(msg));
        } else {
          setUltimasAdvertencias([]);
          notifySuccess("Pesaje registrado correctamente");
        }

        // Auto-imprimir ticket (primer pesaje = ticket generado, segundo = reusa el mismo).
        if (idLoteMineralParaTicket !== null) {
          onPrintTicket?.();
        }

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
    [detalle, idLoteMineralParaTicket, notifyError, notifySuccess, notifyWarning, onSaved, onPrintTicket],
  );

  const guardarTara = useCallback(
    (valor?: number) => guardar("peso_tara", valor ?? taraNum, setLoadingTara),
    [guardar, taraNum],
  );

  const guardarBruto = useCallback(
    (valor?: number) => guardar("peso_bruto", valor ?? brutoNum, setLoadingBruto),
    [guardar, brutoNum],
  );

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
    guardarTara,
    guardarBruto,
    advertenciaMermaSeca,
    ultimasAdvertencias,
    reset,
  };
};
