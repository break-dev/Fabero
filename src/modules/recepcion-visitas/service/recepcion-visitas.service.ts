import { api } from "../../../service/_api";
import type { CrearRecepcionVisitaRequest, RecepcionVisitaFilters } from "./recepcion-visitas.requests";
import type { RecepcionVisitaResponse } from "./recepcion-visitas.responses";

export const RecepcionVisitasService = {
  /**
   * Obtener listado de recepciones de visitas filtradas
   */
  getRecepciones: async (
    filters?: RecepcionVisitaFilters
  ): Promise<RecepcionVisitaResponse[]> => {
    const { data } = await api.get("/recepcion-visitas", {
      params: filters,
    });
    return data.data;
  },

  /**
   * Registrar una nueva recepción de visita (incluyendo visitantes, vehículos acompañantes y evidencias)
   */
  crearRecepcion: async (
    payload: CrearRecepcionVisitaRequest
  ): Promise<RecepcionVisitaResponse> => {
    const formData = new FormData();
    if (payload.id_empleado_contacto) {
      formData.append("id_empleado_contacto", String(payload.id_empleado_contacto));
    }
    if (payload.id_empleado_autoriza) {
      formData.append("id_empleado_autoriza", String(payload.id_empleado_autoriza));
    }
    formData.append("id_motivo_ingreso", String(payload.id_motivo_ingreso));
    formData.append("con_vehiculo", payload.con_vehiculo ? "1" : "0");

    if (payload.observacion) {
      formData.append("observacion", payload.observacion);
    }

    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => formData.append("evidencias[]", file));
    }

    if (payload.con_vehiculo && payload.placa) {
      formData.append("placa", payload.placa);
    }

    // Vehículos acompañantes
    if (payload.vehiculos && payload.vehiculos.length > 0) {
      payload.vehiculos.forEach((veh, vIdx) => {
        const idVal = veh.id ?? veh.temp_id;
        if (idVal) {
          formData.append(`vehiculos[${vIdx}][id]`, String(idVal));
        }
        formData.append(`vehiculos[${vIdx}][placa]`, veh.placa);
        formData.append(`vehiculos[${vIdx}][cantidad_personas]`, String(veh.cantidad_personas));
        if (veh.archivos && veh.archivos.length > 0) {
          veh.archivos.forEach((file) => {
            formData.append(`vehiculos[${vIdx}][archivos][]`, file);
          });
        }
      });
    }

    // Visitantes
    payload.visitantes.forEach((v, index) => {
      if (v.id_visitante) {
        formData.append(`visitantes[${index}][id_visitante]`, String(v.id_visitante));
      }
      if (v.id_visita_vehiculo) {
        formData.append(`visitantes[${index}][id_visita_vehiculo]`, String(v.id_visita_vehiculo));
      }
      if (v.es_conductor !== undefined) {
        formData.append(`visitantes[${index}][es_conductor]`, v.es_conductor ? "1" : "0");
      }

      if (v.nombre) formData.append(`visitantes[${index}][nombre]`, v.nombre);
      if (v.apellido) formData.append(`visitantes[${index}][apellido]`, v.apellido);
      if (v.dni) formData.append(`visitantes[${index}][dni]`, v.dni);
      if (v.telefono) {
        formData.append(`visitantes[${index}][telefono]`, v.telefono);
      }

      if (v.foto_documento && v.foto_documento.length > 0) {
        v.foto_documento.forEach((file) => {
          formData.append(`visitantes[${index}][foto_documento][]`, file);
        });
      }
    });

    const { data } = await api.post("/recepcion-visitas", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!data.success) {
      throw new Error(data.message || "Error al crear la recepción de visita");
    }
    return data.data;
  },

  /**
   * Registrar la salida de una visita
   */
  registrarSalida: async (
    id: number,
    payload: { observacion_salida?: string; evidencias?: File[] }
  ): Promise<RecepcionVisitaResponse> => {
    if (payload.evidencias && payload.evidencias.length > 0) {
      const formData = new FormData();
      formData.append("_method", "PUT");
      if (payload.observacion_salida) {
        formData.append("observacion_salida", payload.observacion_salida);
      }
      payload.evidencias.forEach((f) => {
        formData.append("evidencias[]", f);
      });

      const { data } = await api.post(`/recepcion-visitas/${id}/salida`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data.success) {
        throw new Error(data.message || "Error al registrar la salida");
      }
      return data.data;
    }

    const { data } = await api.put(`/recepcion-visitas/${id}/salida`, payload);
    if (!data.success) {
      throw new Error(data.message || "Error al registrar la salida");
    }
    return data.data;
  },

  /**
   * Registrar salida general de la cabecera recepcion_visita (marcando salida a todos los visitantes)
   * Guardando las evidencias únicamente en la tabla recepcion_visita.evidencias_salida.
   */
  registrarSalidaGeneral: async (
    id: number,
    payload: { observacion_salida?: string; evidencias_salida?: File[] }
  ): Promise<RecepcionVisitaResponse> => {
    const formData = new FormData();
    if (payload.observacion_salida) {
      formData.append("observacion_salida", payload.observacion_salida);
    }
    if (payload.evidencias_salida && payload.evidencias_salida.length > 0) {
      payload.evidencias_salida.forEach((f) => {
        formData.append("evidencias_salida[]", f);
      });
    }

    const { data } = await api.post(`/recepcion-visitas/${id}/salida-general`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!data.success) {
      throw new Error(data.message || "Error al registrar la salida general");
    }
    return data.data;
  },
};
