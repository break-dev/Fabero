import { api } from "../../../service/_api";
import type { CrearProgramacionRequest } from "./programar-recepcion.requests";
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
}

export const ProgramarRecepcionService = {
  getProgramaciones: async (soloPendientes = true): Promise<ProgramacionListItem[]> => {
    const { data } = await api.get("/programar-recepcion", {
      params: { solo_pendientes: soloPendientes ? 1 : 0 },
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
    const { data } = await api.post(`/programar-recepcion/${id}/confirmar`, payload);
    return data.data;
  },
};
