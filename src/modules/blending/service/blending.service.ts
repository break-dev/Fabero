import { api } from "../../../service/_api";
import type { CrearBlendingPayload, EditarBlendingPayload } from "./blending.requests";
import type { BlendingResponse, ItemDisponibleResponse } from "./blending.responses";

const PATH = "/blending";

export const BlendingService = {
  /**
   * Obtener lotes y blendings disponibles para mezclar.
   */
  get_disponibles: async (idProveedor?: number, idEmpresa?: number): Promise<ItemDisponibleResponse[]> => {
    const params: Record<string, number> = {};
    if (idProveedor) params.id_proveedor = idProveedor;
    if (idEmpresa) params.id_empresa = idEmpresa;
    const { data } = await api.get(`${PATH}/disponibles`, { params });
    return data.data;
  },

  /**
   * Listar todos los blendings registrados.
   */
  get_blendings: async (filters?: {
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<BlendingResponse[]> => {
    const { data } = await api.get(PATH, { params: filters });
    return data.data;
  },

  /**
   * Obtener un blending por ID.
   */
  get_blending_by_id: async (id: number): Promise<BlendingResponse> => {
    const { data } = await api.get(`${PATH}/${id}`);
    return data.data;
  },

  /**
   * Crear un nuevo blending (multipart con evidencias + detalles JSON).
   */
  crear_blending: async (payload: CrearBlendingPayload): Promise<BlendingResponse> => {
    const formData = new FormData();
    if (payload.fecha_hora_blending) formData.append("fecha_hora_blending", payload.fecha_hora_blending);
    if (payload.observacion) formData.append("observacion", payload.observacion);
    formData.append("detalles", JSON.stringify(payload.detalles));

    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post(PATH, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Editar metadata o incrementar pesos/lotes de un blending (multipart con evidencias + adiciones JSON).
   */
  editar_blending: async (id: number, payload: EditarBlendingPayload): Promise<BlendingResponse> => {
    const formData = new FormData();
    if (payload.fecha_hora_blending) formData.append("fecha_hora_blending", payload.fecha_hora_blending);
    if (payload.observacion !== undefined && payload.observacion !== null) {
      formData.append("observacion", payload.observacion);
    }
    if (payload.evidencias_existentes) {
      formData.append("evidencias_existentes", JSON.stringify(payload.evidencias_existentes));
    }
    if (payload.nombres_evidencias_nuevas) {
      formData.append("nombres_evidencias_nuevas", JSON.stringify(payload.nombres_evidencias_nuevas));
    }
    if (payload.nombres_evidencias_eliminadas) {
      formData.append("nombres_evidencias_eliminadas", JSON.stringify(payload.nombres_evidencias_eliminadas));
    }
    if (payload.adiciones) {
      formData.append("adiciones", JSON.stringify(payload.adiciones));
    }

    if (payload.evidencias_nuevas && payload.evidencias_nuevas.length > 0) {
      payload.evidencias_nuevas.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post(`${PATH}/${id}/update`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};
