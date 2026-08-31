import { api } from "../../../service/_api";
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
  observacion?: string;
  motivo?: string;
  evidencias?: File[];
}

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
    const { data } = await api.post("/programar-recepcion", payload);
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
    return data.data;
  },
};
