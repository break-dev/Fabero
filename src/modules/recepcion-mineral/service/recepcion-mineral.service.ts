import { api } from "../../../service/_api";
import type { DTO_PesoInicial, DTO_PesoFinal } from "./recepcion-mineral.requests";
import type { RecepcionMineralResponse, RES_LoteMineral, RES_TicketBalanzaData } from "./recepcion-mineral.responses";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

const PATH = "/recepcion-mineral";

export const RecepcionMineralService = {
  /**
   * Obtener recepciones de mineral filtradas por sucursal y estado de pesaje
   */
  get_recepciones_mineral: async (
    idSucursal: number,
    estadoPesaje?: string
  ): Promise<RecepcionMineralResponse[]> => {
    const { data } = await api.get(PATH, {
      params: { id_sucursal: idSucursal, estado_pesaje: estadoPesaje },
    });
    return data.data;
  },

  /**
   * Crear unidad ficticia
   */
  crear_unidad_ficticia: async (
    idSucursal: number,
    fechaHoraIngreso?: string | null
  ): Promise<RecepcionMineralResponse> => {
    const body: { id_sucursal: number; fecha_hora_ingreso?: string } = {
      id_sucursal: idSucursal,
    };
    if (fechaHoraIngreso) {
      body.fecha_hora_ingreso = fechaHoraIngreso;
    }
    const { data } = await api.post(`${PATH}/ficticio`, body);
    return data.data;
  },

  /**
   * Iniciar proceso de pesaje para una unidad
   */
  iniciar_pesaje: async (id: number): Promise<RecepcionMineralResponse> => {
    const { data } = await api.put(`${PATH}/${id}/iniciar`);
    return data.data;
  },

  /**
   * Validar y actualizar un campo específico paso a paso
   */
  validar_campo: async (
    id: number,
    field: string,
    value: unknown
  ): Promise<RecepcionMineralResponse> => {
    const { data } = await api.put(`${PATH}/${id}/validar`, { field, value });
    return data.data;
  },

  crear_lote: async (
    id: number,
    condicion_ingreso: CondicionIngreso,
    id_empresa: number,
  ): Promise<RES_LoteMineral> => {
    const { data } = await api.post(`${PATH}/${id}/lotes`, {
      condicion_ingreso,
      id_empresa,
    });
    return data.data;
  },

  /**
   * Eliminar un lote vacío o incompleto
   */
  eliminar_lote: async (loteId: number): Promise<void> => {
    await api.delete(`${PATH}/lotes/${loteId}`);
  },

  /**
   * Registrar peso inicial de un lote (con subida de evidencias)
   */
  registrar_peso_inicial: async (
    loteId: number,
    dto: DTO_PesoInicial
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_encargado_muestra !== null && dto.id_encargado_muestra !== undefined) {
      formData.append("id_encargado_muestra", String(dto.id_encargado_muestra));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    formData.append("numero_contacto", dto.numero_contacto || "");
    formData.append("tipo_carga", dto.tipo_carga);
    formData.append("tipo_producto", dto.tipo_producto);
    formData.append("tipo_mineral", dto.tipo_mineral);
    formData.append("peso_inicial", String(dto.peso_inicial));
    if (dto.observacion_peso_inicial) {
      formData.append("observacion_peso_inicial", dto.observacion_peso_inicial);
    }

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post(`${PATH}/lotes/${loteId}/peso-inicial`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.data;
  },

  /**
   * Registrar peso final de un lote (con subida de evidencias adicionales)
   */
  registrar_peso_final: async (
    loteId: number,
    dto: DTO_PesoFinal
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    formData.append("peso_final", String(dto.peso_final));
    if (dto.observacion_peso_final) {
      formData.append("observacion_peso_final", dto.observacion_peso_final);
    }

    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_encargado_muestra !== null && dto.id_encargado_muestra !== undefined) {
      formData.append("id_encargado_muestra", String(dto.id_encargado_muestra));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    if (dto.numero_contacto !== undefined) {
      formData.append("numero_contacto", dto.numero_contacto);
    }
    if (dto.tipo_carga !== undefined) {
      formData.append("tipo_carga", dto.tipo_carga);
    }
    if (dto.tipo_producto !== undefined) {
      formData.append("tipo_producto", dto.tipo_producto);
    }
    if (dto.tipo_mineral !== undefined) {
      formData.append("tipo_mineral", dto.tipo_mineral);
    }
    if (dto.peso_inicial !== undefined) {
      formData.append("peso_inicial", String(dto.peso_inicial));
    }
    if (dto.observacion_peso_inicial !== undefined) {
      formData.append("observacion_peso_inicial", dto.observacion_peso_inicial);
    }
    if (dto.id_vehiculo !== null && dto.id_vehiculo !== undefined) {
      formData.append("id_vehiculo", String(dto.id_vehiculo));
    }
    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (dto.id_tipo_vehiculo !== null && dto.id_tipo_vehiculo !== undefined) {
      formData.append("id_tipo_vehiculo", String(dto.id_tipo_vehiculo));
    }
    if (dto.id_conductor !== null && dto.id_conductor !== undefined) {
      formData.append("id_conductor", String(dto.id_conductor));
    }

    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post(`${PATH}/lotes/${loteId}/peso-final`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.data;
  },

  /**
   * Actualizar lote completo (desde Resumen de Balanza)
   */
  actualizar_lote: async (
    loteId: number,
    dto: DTO_PesoFinal
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    if (dto.peso_final !== undefined && dto.peso_final !== null) {
      formData.append("peso_final", String(dto.peso_final));
    }
    if (dto.observacion_peso_final !== undefined) {
      formData.append("observacion_peso_final", dto.observacion_peso_final);
    }
    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_encargado_muestra !== null && dto.id_encargado_muestra !== undefined) {
      formData.append("id_encargado_muestra", String(dto.id_encargado_muestra));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    if (dto.numero_contacto !== undefined) {
      formData.append("numero_contacto", dto.numero_contacto);
    }
    if (dto.tipo_carga !== undefined) {
      formData.append("tipo_carga", dto.tipo_carga);
    }
    if (dto.tipo_producto !== undefined) {
      formData.append("tipo_producto", dto.tipo_producto);
    }
    if (dto.tipo_mineral !== undefined) {
      formData.append("tipo_mineral", dto.tipo_mineral);
    }
    if (dto.peso_inicial !== undefined && dto.peso_inicial !== null) {
      formData.append("peso_inicial", String(dto.peso_inicial));
    }
    if (dto.observacion_peso_inicial !== undefined) {
      formData.append("observacion_peso_inicial", dto.observacion_peso_inicial);
    }
    if (dto.id_vehiculo !== null && dto.id_vehiculo !== undefined) {
      formData.append("id_vehiculo", String(dto.id_vehiculo));
    }
    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (dto.id_conductor !== null && dto.id_conductor !== undefined) {
      formData.append("id_conductor", String(dto.id_conductor));
    }
    if (dto.condicion_ingreso !== undefined && dto.condicion_ingreso !== null) {
      formData.append("condicion_ingreso", dto.condicion_ingreso);
    }
    if (dto.motivo !== undefined && dto.motivo !== null) {
      formData.append("motivo", dto.motivo);
    }

    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post(`${PATH}/lotes/${loteId}/actualizar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.data;
  },

  /**
   * Cerrar el proceso de balanza de una recepción
   */
  cerrar_proceso: async (id: number): Promise<void> => {
    await api.put(`${PATH}/${id}/cerrar`);
  },

  /**
   * Obtener datos del Ticket de Balanza en formato completo para impresión PDF
   */
  obtener_ticket_balanza: async (loteId: number): Promise<RES_TicketBalanzaData> => {
    const { data } = await api.get(`${PATH}/lotes/${loteId}/ticket-balanza`);
    return data.data;
  },
};

