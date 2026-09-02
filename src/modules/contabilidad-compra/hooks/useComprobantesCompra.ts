import { useState, useEffect, useCallback } from "react";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type {
  REQ_AnularComprobante,
  REQ_AprobarComprobante,
  REQ_CrearComprobante,
  REQ_FiltroComprobantes,
} from "../service/contabilidad-compra.requests";
import type { RES_ComprobanteCompra } from "../service/contabilidad-compra.responses";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

export const useComprobantesCompra = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idProveedorFiltro, setIdProveedorFiltro] = useState<number | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("Todos");
  const [fechaInicio, setFechaInicio] = useState<string | null>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string | null>(defaultFechaFin());

  const [comprobantes, setComprobantes] = useState<RES_ComprobanteCompra[]>([]);
  const [loading, setLoading] = useState(false);

  const [aprobandoId, setAprobandoId] = useState<Record<number, TipoAprobacionComprobante | null>>({});
  const [anulandoId, setAnulandoId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cargarComprobantes = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const filters: REQ_FiltroComprobantes = {};
        if (idProveedorFiltro !== null) filters.id_proveedor = idProveedorFiltro;
        if (estadoFiltro !== "Todos") filters.estado = estadoFiltro;
        if (fechaInicio) filters.fecha_inicio = fechaInicio;
        if (fechaFin) filters.fecha_fin = fechaFin;

        const res = await ContabilidadCompraService.listarComprobantes(filters);
        if (res.success && res.data) {
          setComprobantes(res.data);
        } else if (res.success) {
          setComprobantes([]);
        }
      } catch (err) {
        console.error("Error al cargar comprobantes:", err);
        notifyError("Ocurrió un error al cargar la lista de comprobantes.");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [idProveedorFiltro, estadoFiltro, fechaInicio, fechaFin, notifyError],
  );

  useEffect(() => {
    cargarComprobantes();
  }, [cargarComprobantes]);

  const crearComprobante = async (
    payload: REQ_CrearComprobante,
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await ContabilidadCompraService.crearComprobante(payload);
      if (res.success) {
        notifySuccess("Comprobante creado correctamente");
        await cargarComprobantes(false);
        return true;
      }
      notifyError(res.message || "Error al crear el comprobante");
      return false;
    } catch (err) {
      console.error("Error al crear comprobante:", err);
      notifyError("Ocurrió un error al crear el comprobante.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const aprobarComprobante = async (
    id: number,
    payload: REQ_AprobarComprobante,
  ): Promise<boolean> => {
    setAprobandoId((prev) => ({ ...prev, [id]: payload.tipo }));
    try {
      const res = await ContabilidadCompraService.aprobarComprobante(id, payload);
      if (res.success && res.data) {
        notifySuccess("Aprobación registrada correctamente");
        setComprobantes((prev) =>
          prev.map((item) => (item.id === id ? res.data : item)),
        );
        return true;
      }
      notifyError(res.message || "Error al aprobar");
      return false;
    } catch (err) {
      console.error("Error al aprobar:", err);
      notifyError("Ocurrió un error al aprobar el comprobante.");
      return false;
    } finally {
      setAprobandoId((prev) => ({ ...prev, [id]: null }));
    }
  };

  const anularComprobante = async (
    id: number,
    payload: REQ_AnularComprobante,
  ): Promise<boolean> => {
    setAnulandoId(id);
    try {
      const res = await ContabilidadCompraService.anularComprobante(id, payload);
      if (res.success && res.data) {
        notifySuccess("Comprobante anulado (cascada aplicada a sus pagos)");
        setComprobantes((prev) =>
          prev.map((item) => (item.id === id ? res.data : item)),
        );
        return true;
      }
      notifyError(res.message || "Error al anular");
      return false;
    } catch (err) {
      console.error("Error al anular:", err);
      notifyError("Ocurrió un error al anular el comprobante.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    idProveedorFiltro,
    setIdProveedorFiltro,
    estadoFiltro,
    setEstadoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    loading,
    comprobantes,
    aprobandoId,
    anulandoId,
    submitting,
    cargarComprobantes,
    crearComprobante,
    aprobarComprobante,
    anularComprobante,
  };
};