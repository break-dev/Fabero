/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { usePrinterStore, type PrintJob } from "../../../stores/printer.store";
import { useNotify } from "../../../hooks/useNotify";

const PrintJobRunner = ({ job }: { job: PrintJob }) => {
  const dequeueJob = usePrinterStore((s) => s.dequeueJob);
  const { notifyError } = useNotify();

  useEffect(() => {
    let cancelled = false;
    let win: Window | null = null;
    let revokeFn: (() => void) | null = null;

    const run = async () => {
      try {
        const blob = await pdf(job.document as any).toBlob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        win = window.open(url, job.config.target || "_blank");

        if (!win) {
          notifyError(
            "El navegador bloqueó la ventana del ticket. Habilita las ventanas emergentes para este sitio.",
          );
          URL.revokeObjectURL(url);
        } else {
          revokeFn = () => URL.revokeObjectURL(url);
          if (!job.config.target) {
            win.addEventListener("load", revokeFn, { once: true });
          } else {
            setTimeout(() => revokeFn?.(), 30_000);
          }
        }
      } catch (err) {
        console.error("Error al generar el PDF:", err);
        const detail = err instanceof Error ? err.message : "";
        notifyError(
          detail
            ? `Error al generar el PDF del ticket: ${detail}`
            : "Error al generar el PDF del ticket. Revisa la consola.",
        );
      } finally {
        if (!cancelled) {
          await job.config.onAfterPrint?.();
          dequeueJob(job.id);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [dequeueJob, job.document, job.id, job.config.target, notifyError, job.config]);

  return null;
};

/** Montar una sola vez en AuthLayout. Procesa la cola de trabajos de impresión. */
export const GlobalPrinterPortal = () => {
  const jobs = usePrinterStore((s) => s.jobs);
  return (
    <>
      {jobs.map((job) => (
        <PrintJobRunner key={job.id} job={job} />
      ))}
    </>
  );
};
