import { useCallback, useMemo, useState } from "react";
import { TicketBalanzaPdf } from "../../../presentation/utils/ticket-balanza-pdf";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";
import type { RES_TicketBalanzaData } from "../../../service/responses/ticket-balanza";

export type LoteBalanzaInput = number | { id?: number; id_lote?: number; correlativo?: string };

/**
 * Imprime el ticket de balanza partiendo de un id_lote (Bloque A del Resumen).
 */
async function fetchTicketByLote(loteId: number): Promise<RES_TicketBalanzaData> {
  return RecepcionMineralService.obtener_ticket_balanza(loteId);
}

/**
 * Imprime el ticket de balanza partiendo de un id_distribucion_detalle (Bloque B).
 * Soporta orígenes LOTE y BLENDING.
 */
async function fetchTicketByDistribucionDetalle(
  idDistribucionDetalle: number
): Promise<RES_TicketBalanzaData> {
  return RecepcionMineralService.obtener_ticket_balanza_por_distribucion_detalle(
    idDistribucionDetalle
  );
}

/**
 * Hook para imprimir el ticket de balanza vertical (67 x 247 mm).
 *
 * Usa el sistema global de impresión (`usePrint` + `GlobalPrinterPortal`):
 * 1. `prepare(target)` abre una ventana con pantalla de carga premium.
 * 2. `print(<Document />, { target })` encola el job en el store global.
 * 3. El portal global (`GlobalPrinterPortal`) consume la cola, renderiza el PDF
 *    con `@react-pdf/renderer` y lo muestra en la ventana target.
 * 4. Reutilizar el mismo `target` (basado en el id) entre llamadas refresca el
 *    ticket en la misma ventana en vez de abrir una nueva.
 */
export const useTicketBalanza = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);

  /**
   * Lógica común: pre-abre la ventana target, obtiene los datos del ticket y
   * encola el documento PDF en el portal global.
   */
  const printInternal = useCallback(
    async (
      idKey: string,
      fetchData: () => Promise<RES_TicketBalanzaData>,
    ): Promise<void> => {
      setLoadingTicket(true);
      try {
        const target = `ticket-balanza-${idKey}`;
        // 1. Abrir ventana con pantalla de carga (debe ser síncrono al click).
        prepare(target);
        // 2. Obtener datos del backend.
        const ticketData = await fetchData();
        // 3. Encolar PDF. El portal global lo renderiza en la ventana target.
        print(<TicketBalanzaPdf data={ticketData} />, {
          documentTitle: `Ticket ${ticketData.correlativo}`,
          target,
        });
        notifySuccess("Ticket generado. Revisa la nueva ventana del navegador.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al imprimir el ticket: ${message}`);
        console.error("[Ticket] Error:", err);
      } finally {
        setLoadingTicket(false);
      }
    },
    [print, prepare, notifyError, notifySuccess],
  );

  /**
   * Imprime ticket desde id_lote (filas LOTE_RECEPCION del Resumen).
   */
  const printTicketBalanza = useCallback(
    (loteInput: LoteBalanzaInput) => {
      const loteId =
        typeof loteInput === "number" ? loteInput : loteInput.id || loteInput.id_lote;
      if (!loteId) return;
      void printInternal(String(loteId), () => fetchTicketByLote(loteId));
    },
    [printInternal],
  );

  /**
   * Imprime ticket desde id_distribucion_detalle (filas DISTRIBUCION_DETALLE).
   * Soporta orígenes LOTE y BLENDING.
   */
  const printTicketBalanzaByDistribucionDetalle = useCallback(
    (idDistribucionDetalle: number) => {
      if (!idDistribucionDetalle) return;
      void printInternal(
        `distdet-${idDistribucionDetalle}`,
        () => fetchTicketByDistribucionDetalle(idDistribucionDetalle),
      );
    },
    [printInternal],
  );

  return useMemo(
    () => ({
      printTicketBalanza,
      printTicketBalanzaByDistribucionDetalle,
      loadingTicket,
    }),
    [printTicketBalanza, printTicketBalanzaByDistribucionDetalle, loadingTicket],
  );
};
