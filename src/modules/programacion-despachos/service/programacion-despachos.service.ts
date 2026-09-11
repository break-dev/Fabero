import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  CrearDespachoRequest,
  CrearDistribucionRequest,
  DespachoFiltros,
  DTO_ActualizarGuiaSegundoTramo,
  DTO_CrearGuiaSegundoTramo,
  PesarDistribucionDetalleRequest,
} from "./programacion-despachos.requests";
import type {
  CrearDistribucionResult,
  DespachoDetalle,
  DespachoListItem,
  DistribucionDetalleItem,
  GuiaSegundoTramo,
  ItemDisponibleDespacho,
} from "./programacion-despachos.responses";

const appendIfPresent = (
  formData: FormData,
  key: string,
  value: string | number | null | undefined,
): void => {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, String(value));
};

const appendDocumento = (
  formData: FormData,
  key: string,
  file: File | null,
): void => {
  if (file) {
    formData.append(key, file);
  }
};

export const ProgramacionDespachosService = {
  getDespachos: async (
    filtros: DespachoFiltros = {},
  ): Promise<DespachoListItem[]> => {
    const { data } = await api.get<IRespuesta<DespachoListItem[]>>(
      "/programacion-despachos",
      { params: filtros },
    );
    return data.data;
  },

  getDespacho: async (id: number): Promise<DespachoDetalle> => {
    const { data } = await api.get<IRespuesta<DespachoDetalle>>(
      `/programacion-despachos/${id}`,
    );
    return data.data;
  },

  getItemsDisponibles: async (): Promise<ItemDisponibleDespacho[]> => {
    const { data } = await api.get<IRespuesta<ItemDisponibleDespacho[]>>(
      "/programacion-despachos/items-disponibles",
    );
    return data.data;
  },

  crearDespacho: async (
    payload: CrearDespachoRequest,
  ): Promise<DespachoDetalle> => {
    const { data } = await api.post<IRespuesta<DespachoDetalle>>(
      "/programacion-despachos",
      payload,
    );
    return data.data;
  },

  anularDespacho: async (id: number): Promise<DespachoDetalle> => {
    const { data } = await api.patch<IRespuesta<DespachoDetalle>>(
      `/programacion-despachos/${id}/anular`,
    );
    return data.data;
  },

  crearDistribucion: async (
    idDespacho: number,
    payload: CrearDistribucionRequest,
  ): Promise<CrearDistribucionResult> => {
    const { data } = await api.post<IRespuesta<CrearDistribucionResult>>(
      `/programacion-despachos/${idDespacho}/distribuciones`,
      payload,
    );
    return data.data;
  },

  pesarDistribucionDetalle: async (
    idDistribucion: number,
    idDetalle: number,
    payload: PesarDistribucionDetalleRequest,
  ): Promise<{ detalle: DistribucionDetalleItem; id_ticket_balanza: number; peso_neto: number; advertencias: string[] }> => {
    const { data } = await api.post<
      IRespuesta<{ detalle: DistribucionDetalleItem; id_ticket_balanza: number; peso_neto: number; advertencias: string[] }>
    >(
      `/programacion-despachos/distribuciones/${idDistribucion}/detalles/${idDetalle}/pesar`,
      payload,
    );
    return data.data;
  },

  getGuiaSegundoTramo: async (
    idDistribucion: number,
  ): Promise<GuiaSegundoTramo | null> => {
    const { data } = await api.get<IRespuesta<GuiaSegundoTramo | null>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo`,
    );
    return data.data;
  },

  crearGuiaSegundoTramo: async (
    idDistribucion: number,
    dto: DTO_CrearGuiaSegundoTramo,
  ): Promise<GuiaSegundoTramo> => {
    const formData = new FormData();
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "fecha_inicio_traslado", dto.fecha_inicio_traslado);
    appendIfPresent(formData, "fecha_emision", dto.fecha_emision);
    appendIfPresent(formData, "fecha_en_planta", dto.fecha_en_planta);
    appendIfPresent(formData, "guia_remitente", dto.guia_remitente);
    if (dto.sin_guia_transportista) {
      formData.append("sin_guia_transportista", "1");
    } else {
      formData.append("sin_guia_transportista", "0");
      appendIfPresent(formData, "guia_transportista", dto.guia_transportista);
    }
    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post<IRespuesta<GuiaSegundoTramo>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  actualizarGuiaSegundoTramo: async (
    idDistribucion: number,
    idGuia: number,
    dto: DTO_ActualizarGuiaSegundoTramo,
  ): Promise<GuiaSegundoTramo> => {
    const formData = new FormData();
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "fecha_inicio_traslado", dto.fecha_inicio_traslado);
    appendIfPresent(formData, "fecha_emision", dto.fecha_emision);
    appendIfPresent(formData, "fecha_en_planta", dto.fecha_en_planta);
    appendIfPresent(formData, "guia_remitente", dto.guia_remitente);
    if (dto.sin_guia_transportista) {
      formData.append("sin_guia_transportista", "1");
    } else {
      formData.append("sin_guia_transportista", "0");
      appendIfPresent(formData, "guia_transportista", dto.guia_transportista);
    }
    appendIfPresent(formData, "motivo", dto.motivo);
    if (dto.nombres_evidencias_nuevas && dto.nombres_evidencias_nuevas.length > 0) {
      formData.append(
        "nombres_evidencias_nuevas",
        JSON.stringify(dto.nombres_evidencias_nuevas),
      );
    }
    if (dto.nombres_evidencias_eliminadas && dto.nombres_evidencias_eliminadas.length > 0) {
      formData.append(
        "nombres_evidencias_eliminadas",
        JSON.stringify(dto.nombres_evidencias_eliminadas),
      );
    }
    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post<IRespuesta<GuiaSegundoTramo>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo/${idGuia}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  anularGuiaSegundoTramo: async (
    idDistribucion: number,
    idGuia: number,
  ): Promise<void> => {
    await api.patch(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo/${idGuia}/anular`,
    );
  },
};