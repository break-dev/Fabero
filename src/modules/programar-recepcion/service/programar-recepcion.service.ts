import { api } from "../../../service/_api";
import type { IDocumentoProgramacion } from "../../../shared/interfaces/documentos-programacion";
import type {
  CrearProgramacionRequest,
  ProgramacionFilters,
} from "./programar-recepcion.requests";
import type { ProgramacionDetail, ProgramacionListItem } from "./programar-recepcion.responses";

export interface ConfirmarProgramacionPayload {
  id_vehiculo?: number;
  id_tipo_vehiculo?: number;
  id_sucursal?: number;
  id_conductor?: number;
  id_proveedor_minero?: number;
  id_empresa_transporte?: number;
  guia_remitente?: string;
  guia_transportista?: string;
  documentos_programacion?: IDocumentoProgramacion | null;
  observacion?: string;
  motivo?: string;
  evidencias?: File[];
}

/**
 * Construye un Error con el message real que devuelve el backend.
 * Los controllers Laravel siempre envuelven en `ApiResponse::success/error`
 * con `success: false` cuando hay conflicto de negocio (HTTP 409) o error
 * controlado (HTTP 4xx). Lanzamos el error para que el `catch` del hook
 * lo reciba y `notifyError` muestre el mensaje exacto al usuario.
 */
const assertBusinessSuccess = (data: { success?: boolean; message?: string | null }): void => {
  if (data.success === false) {
    throw new Error(data.message || "Operación rechazada por el servidor.");
  }
};

export const ProgramarRecepcionService = {
  getProgramaciones: async (
    filtros: ProgramacionFilters = {}
  ): Promise<ProgramacionListItem[]> => {
    const { data } = await api.get("/programar-recepcion", {
      params: {
        estado_confirmacion: filtros.estado_confirmacion ?? undefined,
        solo_pendientes: filtros.solo_pendientes !== undefined ? (filtros.solo_pendientes ? 1 : 0) : undefined,
        fecha_inicio: filtros.fecha_inicio ?? undefined,
        fecha_fin: filtros.fecha_fin ?? undefined,
      },
    });
    return data.data;
  },

  getProgramacion: async (id: number): Promise<ProgramacionDetail> => {
    const { data } = await api.get(`/programar-recepcion/${id}`);
    return data.data;
  },

  crearProgramacion: async (
    payload: CrearProgramacionRequest,
  ): Promise<ProgramacionDetail> => {
    const fd = new FormData();
    const appendIfDefined = (key: string, value: unknown): void => {
      if (value === null || value === undefined || value === "") return;
      fd.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    };
    appendIfDefined("id_empresa_transporte", payload.id_empresa_transporte);
    appendIfDefined("id_vehiculo", payload.id_vehiculo);
    appendIfDefined("id_tipo_vehiculo", payload.id_tipo_vehiculo);
    appendIfDefined("id_conductor", payload.id_conductor);
    appendIfDefined("id_proveedor_minero", payload.id_proveedor_minero);
    appendIfDefined("id_sucursal", payload.id_sucursal);
    appendIfDefined("fecha_estimada_llegada", payload.fecha_estimada_llegada);
    appendIfDefined("guia_remitente", payload.guia_remitente);
    appendIfDefined("guia_transportista", payload.guia_transportista);
    appendIfDefined("observacion", payload.observacion);
    appendIfDefined("tipo_ingreso", payload.tipo_ingreso);
    if (payload.guia_remitente_file instanceof File) {
      fd.append("guia_remitente_file", payload.guia_remitente_file);
    }
    if (payload.guia_transportista_file instanceof File) {
      fd.append("guia_transportista_file", payload.guia_transportista_file);
    }
    if (payload.documentos_programacion_existentes) {
      fd.append(
        "documentos_programacion_existentes",
        JSON.stringify(payload.documentos_programacion_existentes),
      );
    }

    const { data } = await api.post("/programar-recepcion", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    assertBusinessSuccess(data);
    return data.data;
  },

  actualizarProgramacion: async (
    id: number,
    payload: CrearProgramacionRequest,
  ): Promise<ProgramacionDetail> => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    const appendIfDefined = (key: string, value: unknown): void => {
      if (value === null || value === undefined || value === "") return;
      fd.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    };
    appendIfDefined("id_empresa_transporte", payload.id_empresa_transporte);
    appendIfDefined("id_vehiculo", payload.id_vehiculo);
    appendIfDefined("id_tipo_vehiculo", payload.id_tipo_vehiculo);
    appendIfDefined("id_conductor", payload.id_conductor);
    appendIfDefined("id_proveedor_minero", payload.id_proveedor_minero);
    appendIfDefined("id_sucursal", payload.id_sucursal);
    appendIfDefined("fecha_estimada_llegada", payload.fecha_estimada_llegada);
    appendIfDefined("guia_remitente", payload.guia_remitente);
    appendIfDefined("guia_transportista", payload.guia_transportista);
    appendIfDefined("observacion", payload.observacion);
    appendIfDefined("tipo_ingreso", payload.tipo_ingreso);
    if (payload.guia_remitente_file instanceof File) {
      fd.append("guia_remitente_file", payload.guia_remitente_file);
    }
    if (payload.guia_transportista_file instanceof File) {
      fd.append("guia_transportista_file", payload.guia_transportista_file);
    }
    if (payload.documentos_programacion_existentes) {
      fd.append(
        "documentos_programacion_existentes",
        JSON.stringify(payload.documentos_programacion_existentes),
      );
    }

    const { data } = await api.post(`/programar-recepcion/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    assertBusinessSuccess(data);
    return data.data;
  },

  confirmarProgramacion: async (
    id: number,
    payload: ConfirmarProgramacionPayload,
  ): Promise<ProgramacionDetail> => {
    const hayArchivos = (payload.evidencias?.length ?? 0) > 0;
    if (!hayArchivos) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { evidencias: _evidencias, motivo: _motivo, ...json } = payload;
      const { data } = await api.post(`/programar-recepcion/${id}/confirmar`, json);
      assertBusinessSuccess(data);
      return data.data;
    }

    const formData = new FormData();
    const appendIfDefined = (key: string, value: unknown): void => {
      if (value === null || value === undefined || value === "") return;
      formData.append(key, String(value));
    };
    appendIfDefined("id_vehiculo", payload.id_vehiculo);
    appendIfDefined("id_tipo_vehiculo", payload.id_tipo_vehiculo);
    appendIfDefined("id_sucursal", payload.id_sucursal);
    appendIfDefined("id_conductor", payload.id_conductor);
    appendIfDefined("id_proveedor_minero", payload.id_proveedor_minero);
    appendIfDefined("id_empresa_transporte", payload.id_empresa_transporte);
    appendIfDefined("guia_remitente", payload.guia_remitente);
    appendIfDefined("guia_transportista", payload.guia_transportista);
    appendIfDefined("observacion", payload.observacion);
    appendIfDefined("motivo", payload.motivo);
    payload.evidencias?.forEach((file) => formData.append("evidencias[]", file));

    const { data } = await api.post(`/programar-recepcion/${id}/confirmar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    assertBusinessSuccess(data);
    return data.data;
  },
};
