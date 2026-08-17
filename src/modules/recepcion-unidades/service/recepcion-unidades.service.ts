import { api } from "../../../service/_api";
import type {
  ConfirmarVisitaPayload,
  CrearRecepcionRequest,
  CrearVisitaVehiculoRequest,
  ProgramarRecepcionRequest,
  RecepcionFilters,
} from "./recepcion-unidades.requests";
import type {
  ProgramacionVisitaPayload,
  RecepcionUnidadResponse,
  VisitaVehiculoResponse,
} from "./recepcion-unidades.responses";
import type { IRespuesta } from "../../../shared/interfaces/_response";

const appendIfDefined = (fd: FormData, key: string, value: unknown): void => {
  if (value === null || value === undefined || value === "") return;
  fd.append(key, String(value));
};

export const RecepcionUnidadesService = {
  /**
   * Obtener listado de recepciones filtradas
   */
  getRecepciones: async (
    filters?: RecepcionFilters,
  ): Promise<RecepcionUnidadResponse[]> => {
    const { data } = await api.get("/recepcion-unidades", { params: filters });
    return data.data;
  },

  /**
   * Registrar un nuevo ingreso de unidad con sus evidencias físicas
   */
  crearRecepcion: async (
    payload: CrearRecepcionRequest,
  ): Promise<RecepcionUnidadResponse> => {
    const formData = new FormData();
    appendIfDefined(formData, "id_vehiculo", payload.id_vehiculo);
    appendIfDefined(formData, "placa", payload.placa);
    appendIfDefined(formData, "id_empresa_transporte", payload.id_empresa_transporte);
    appendIfDefined(formData, "id_tipo_vehiculo", payload.id_tipo_vehiculo);
    appendIfDefined(formData, "id_conductor", payload.id_conductor);
    appendIfDefined(formData, "id_proveedor_minero", payload.id_proveedor_minero);
    appendIfDefined(formData, "tipo_ingreso", payload.tipo_ingreso);
    appendIfDefined(formData, "id_sucursal", payload.id_sucursal);
    appendIfDefined(formData, "segunda_placa", payload.segunda_placa);
    appendIfDefined(formData, "observacion", payload.observacion);
    appendIfDefined(formData, "guia_remitente", payload.guia_remitente);
    appendIfDefined(formData, "guia_transportista", payload.guia_transportista);
    appendIfDefined(formData, "id_motivo_ingreso", payload.id_motivo_ingreso);

    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => formData.append("evidencias[]", file));
    }

    if (payload.vehiculos && payload.vehiculos.length > 0) {
      payload.vehiculos.forEach((veh, index) => {
        if (veh.id) appendIfDefined(formData, `vehiculos[${index}][id]`, veh.id);
        appendIfDefined(formData, `vehiculos[${index}][placa]`, veh.placa);
        appendIfDefined(formData, `vehiculos[${index}][cantidad_personas]`, veh.cantidad_personas);
        if (veh.archivos && veh.archivos.length > 0) {
          veh.archivos.forEach((file) => {
            formData.append(`vehiculos[${index}][archivos][]`, file);
          });
        }
      });
    }

    if (payload.visitantes && payload.visitantes.length > 0) {
      payload.visitantes.forEach((v, index) => {
        formData.append(`visitantes[${index}][nombre]`, v.nombre);
        appendIfDefined(formData, `visitantes[${index}][apellido]`, v.apellido);
        appendIfDefined(formData, `visitantes[${index}][dni]`, v.dni);
        appendIfDefined(formData, `visitantes[${index}][telefono]`, v.telefono);
        appendIfDefined(formData, `visitantes[${index}][es_conductor]`, v.es_conductor ? 1 : 0);
        appendIfDefined(formData, `visitantes[${index}][id_visita_vehiculo]`, v.id_visita_vehiculo);
        if (v.foto_documento && v.foto_documento.length > 0) {
          v.foto_documento.forEach((file) => {
            formData.append(`visitantes[${index}][foto_documento][]`, file);
          });
        }
      });
    }

    const { data } = await api.post("/recepcion-unidades", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Registrar la salida de una unidad
   */
  registrarSalida: async (
    id: number,
    payload: { estado_salida: string; observacion_salida: string; evidencias?: File[] },
  ): Promise<RecepcionUnidadResponse> => {
    if (payload.evidencias && payload.evidencias.length > 0) {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("estado_salida", payload.estado_salida);
      formData.append("observacion_salida", payload.observacion_salida || "");
      payload.evidencias.forEach((f) => {
        formData.append("evidencias[]", f);
      });

      const { data } = await api.post(`/recepcion-unidades/${id}/salida`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    }

    const { data } = await api.put(`/recepcion-unidades/${id}/salida`, {
      estado_salida: payload.estado_salida,
      observacion_salida: payload.observacion_salida,
    });
    return data.data;
  },

  /**
   * Listar programaciones (opcionalmente solo pendientes).
   */
  getProgramaciones: async (soloPendientes = true): Promise<RecepcionUnidadResponse[]> => {
    const { data } = await api.get("/recepcion-unidades/programaciones/listado", {
      params: { solo_pendientes: soloPendientes ? 1 : 0 },
    });
    return data.data;
  },

  /**
   * Detalle completo de una programación + visita + vehículos + visitantes.
   */
  getProgramacion: async (id: number): Promise<RecepcionUnidadResponse> => {
    const { data } = await api.get(`/recepcion-unidades/programaciones/${id}`);
    return data.data;
  },

  /**
   * Crear una nueva programación de recepción.
   */
  crearProgramacion: async (
    payload: ProgramarRecepcionRequest,
  ): Promise<RecepcionUnidadResponse> => {
    const { data } = await api.post("/recepcion-unidades/programaciones", payload);
    return data.data;
  },

  /**
   * Confirmar una programación (la marca como 'En Planta').
   */
  confirmarProgramacion: async (
    id: number,
    payload?: {
      id_vehiculo?: number;
      id_tipo_vehiculo?: number;
      id_sucursal?: number;
      id_conductor?: number;
      id_proveedor_minero?: number;
      id_empresa_transporte?: number;
      guia_remitente?: string;
      guia_transportista?: string;
    },
  ): Promise<RecepcionUnidadResponse> => {
    const { data } = await api.post(`/recepcion-unidades/programaciones/${id}/confirmar`, payload);
    return data.data;
  },

  /**
   * Crear la visita (cabecera + detalle) de una programación.
   */
  crearVisitaParaProgramacion: async (
    payload: ConfirmarVisitaPayload,
  ): Promise<ProgramacionVisitaPayload> => {
    const formData = new FormData();
    appendIfDefined(formData, "id_recepcion_unidad", payload.id_recepcion_unidad);
    appendIfDefined(formData, "id_motivo_ingreso", payload.id_motivo_ingreso);
    appendIfDefined(formData, "observacion", payload.observacion);

    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    if (payload.vehiculos && payload.vehiculos.length > 0) {
      payload.vehiculos.forEach((veh, index) => {
        if (veh.id) appendIfDefined(formData, `vehiculos[${index}][id]`, veh.id);
        appendIfDefined(formData, `vehiculos[${index}][placa]`, veh.placa);
        appendIfDefined(formData, `vehiculos[${index}][cantidad_personas]`, veh.cantidad_personas);
        if (veh.archivos && veh.archivos.length > 0) {
          veh.archivos.forEach((file) => {
            formData.append(`vehiculos[${index}][archivos][]`, file);
          });
        }
      });
    }

    payload.visitantes.forEach((v, index) => {
      formData.append(`visitantes[${index}][nombre]`, v.nombre);
      appendIfDefined(formData, `visitantes[${index}][apellido]`, v.apellido);
      appendIfDefined(formData, `visitantes[${index}][dni]`, v.dni);
      appendIfDefined(formData, `visitantes[${index}][telefono]`, v.telefono);
      appendIfDefined(formData, `visitantes[${index}][es_conductor]`, v.es_conductor ? 1 : 0);
      appendIfDefined(formData, `visitantes[${index}][id_visita_vehiculo]`, v.id_visita_vehiculo);
      if (v.foto_documento && v.foto_documento.length > 0) {
        v.foto_documento.forEach((file) => {
          formData.append(`visitantes[${index}][foto_documento][]`, file);
        });
      }
    });

    const { data } = await api.post("/recepcion-visitas/por-programacion", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Agregar un vehículo acompañante (visita_vehiculo) a la visita en construcción.
   */
  agregarVehiculoVisitado: async (
    payload: CrearVisitaVehiculoRequest,
  ): Promise<VisitaVehiculoResponse> => {
    const formData = new FormData();
    appendIfDefined(formData, "id_recepcion_visita", payload.id_recepcion_visita);
    appendIfDefined(formData, "placa", payload.placa);
    appendIfDefined(formData, "cantidad_personas", payload.cantidad_personas);

    if (payload.archivos && payload.archivos.length > 0) {
      payload.archivos.forEach((file) => formData.append("archivos[]", file));
    }

    const { data } = await api.post("/visitas-vehiculo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Eliminar un vehículo acompañante (cascade a sus detalles).
   */
  eliminarVehiculoVisitado: async (id: number): Promise<IRespuesta<null>> => {
    const { data } = await api.delete(`/visitas-vehiculo/${id}`);
    return data;
  },
};
