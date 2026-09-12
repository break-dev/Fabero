import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { RES_ValorizacionCompra } from "./valorizacion-compra.responses";
import type {
  REQ_FiltroValorizaciones,
  REQ_CrearValorizacion,
  REQ_EditarValorizacion,
  REQ_AnularValorizacion,
} from "./valorizacion-compra.requests";

const basePath = "/valorizacion-compra";

export const ValorizacionCompraService = {
  listarValorizaciones: async (
    filters?: REQ_FiltroValorizaciones,
  ): Promise<IRespuesta<RES_ValorizacionCompra[]>> => {
    const { data } = await api.get<IRespuesta<RES_ValorizacionCompra[]>>(
      basePath,
      { params: filters },
    );
    return data;
  },

  obtenerValorizacion: async (
    id: number,
  ): Promise<IRespuesta<RES_ValorizacionCompra>> => {
    const { data } = await api.get<IRespuesta<RES_ValorizacionCompra>>(
      `${basePath}/${id}`,
    );
    return data;
  },

  crearValorizacion: async (
    payload: REQ_CrearValorizacion,
  ): Promise<IRespuesta<{ id_valorizacion: number; numero_correlativo: string }>> => {
    const formData = new FormData();
    formData.append("id_proveedor_minero", String(payload.id_proveedor_minero));
    formData.append("id_concesion", String(payload.id_concesion));
    if (payload.id_cuenta_bancaria != null) {
      formData.append("id_cuenta_bancaria", String(payload.id_cuenta_bancaria));
    }
    if (payload.id_cuenta_detraccion != null) {
      formData.append("id_cuenta_detraccion", String(payload.id_cuenta_detraccion));
    }
    formData.append("tipo_pago", payload.tipo_pago);
    formData.append("detalles", JSON.stringify(payload.detalles));
    formData.append("anticipos", JSON.stringify(payload.anticipos ?? []));
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    if (payload.fecha_hora_valorizacion) {
      formData.append("fecha_hora_valorizacion", payload.fecha_hora_valorizacion);
    }
    if (payload.monto_penalidad != null) {
      formData.append("monto_penalidad", String(payload.monto_penalidad));
    }
    if (payload.monto_flete != null) {
      formData.append("monto_flete", String(payload.monto_flete));
    }
    const { data } = await api.post(`${basePath}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  editarValorizacion: async (
    id: number,
    payload: REQ_EditarValorizacion,
  ): Promise<IRespuesta<void>> => {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("id_concesion", String(payload.id_concesion));
    if (payload.id_cuenta_bancaria != null) {
      formData.append("id_cuenta_bancaria", String(payload.id_cuenta_bancaria));
    }
    if (payload.id_cuenta_detraccion != null) {
      formData.append("id_cuenta_detraccion", String(payload.id_cuenta_detraccion));
    }
    formData.append("tipo_pago", payload.tipo_pago);
    formData.append("detalles", JSON.stringify(payload.detalles));
    formData.append("anticipos", JSON.stringify(payload.anticipos ?? []));
    formData.append(
      "evidencias_existentes",
      JSON.stringify(payload.evidencias_existentes ?? []),
    );
    if (payload.motivo_edicion) {
      formData.append("motivo_edicion", payload.motivo_edicion);
    }
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    if (payload.fecha_hora_valorizacion) {
      formData.append("fecha_hora_valorizacion", payload.fecha_hora_valorizacion);
    }
    if (payload.monto_penalidad != null) {
      formData.append("monto_penalidad", String(payload.monto_penalidad));
    }
    if (payload.monto_flete != null) {
      formData.append("monto_flete", String(payload.monto_flete));
    }
    const { data } = await api.post(`${basePath}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  aprobarValorizacion: async (id: number): Promise<IRespuesta<void>> => {
    const { data } = await api.post(`${basePath}/${id}/aprobar`);
    return data;
  },

  anularValorizacion: async (
    id: number,
    payload: REQ_AnularValorizacion,
  ): Promise<IRespuesta<void>> => {
    const formData = new FormData();
    formData.append("motivo_anulacion", payload.motivo_anulacion);
    formData.append("tipo_eliminacion", payload.tipo_eliminacion);
    if (payload.evidencias_anulacion && payload.evidencias_anulacion.length > 0) {
      payload.evidencias_anulacion.forEach((file) => {
        formData.append("evidencias_anulacion[]", file);
      });
    }
    const { data } = await api.post(`${basePath}/${id}/anular`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
