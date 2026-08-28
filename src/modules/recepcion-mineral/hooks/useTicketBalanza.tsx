import { useCallback, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { TicketBalanzaPdf } from "../presentation/components/ticket-balanza-pdf";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_TicketBalanzaData } from "../service/recepcion-mineral.responses";

export type LoteBalanzaInput = number | { id?: number; id_lote?: number; correlativo?: string };

/**
 * Hook exclusivo para imprimir el ticket de balanza vertical (67 x 247 mm).
 *
 * Genera el PDF con @react-pdf/renderer directamente en este hook (sin pasar
 * por PrinterStore ni portal global) para tener control total sobre los errores
 * y ofrecer un fallback cuando el navegador bloquea el popup.
 */
export const useTicketBalanza = () => {
  const { notifyError, notifySuccess } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);

  const printTicketBalanza = useCallback(
    async (loteInput: LoteBalanzaInput) => {
      const loteId =
        typeof loteInput === "number" ? loteInput : loteInput.id || loteInput.id_lote;
      if (!loteId) return;

      setLoadingTicket(true);
      try {
        console.log("[Ticket] Iniciando print para loteId=", loteId);
        const ticketData: RES_TicketBalanzaData =
          await RecepcionMineralService.obtener_ticket_balanza(loteId);
        console.log(
          "[Ticket] Datos recibidos:",
          ticketData.correlativo,
          "tara=",
          ticketData.peso_tara,
          "bruto=",
          ticketData.peso_bruto,
        );

        const blob = await pdf(
          <TicketBalanzaPdf data={ticketData} />,
        ).toBlob();
        console.log("[Ticket] PDF blob generado:", blob.size, "bytes");

        const url = URL.createObjectURL(blob);
        console.log("[Ticket] Blob URL:", url);

        // Usamos "_blank" para forzar siempre una nueva pestaña y evitar
        // que el navegador reutilice una ventana con el mismo target name,
        // que era el origen de la pantalla en negro.
        const win = window.open(url, "_blank");
        console.log("[Ticket] window.open result:", win);

        if (!win) {
          // Popup bloqueado: fallback a descarga directa.
          const a = document.createElement("a");
          a.href = url;
          a.download = `ticket-balanza-${ticketData.correlativo || loteId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          notifyError(
            "El navegador bloque\u00f3 la ventana del ticket. Se descarg\u00f3 como PDF; \u00e1brelo manualmente.",
          );
        } else {
          notifySuccess("Ticket generado. Revisa la nueva ventana del navegador.");
        }

        // Libera el blob URL despu\u00e9s de 30s para dar tiempo al navegador a cargarlo.
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        notifyError(`Error al imprimir el ticket: ${message}`);
        console.error("[Ticket] Error:", error);
      } finally {
        setLoadingTicket(false);
      }
    },
    [notifyError, notifySuccess],
  );

  return useMemo(
    () => ({
      printTicketBalanza,
      loadingTicket,
    }),
    [printTicketBalanza, loadingTicket],
  );
};
