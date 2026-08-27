import { api } from "../../../service/_api";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "./guias-primer-tramo.requests";
import type {
  RES_ConcesionPorProveedor,
  RES_FiltrosMetadataGuia,
  RES_GuiaPrimerTramo,
  RES_ItemMineralDisponible,
} from "./guias-primer-tramo.responses";

const PATH = "/guias-primer-tramo";

const appendIfPresent = (formData: FormData, key: string, value: string | number | null | undefined): void => {
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

export const GuiasPrimerTramoService = {
  /**
   * Listar guías filtradas por sucursal.
   */
  get_guias: async (filters: {
    id_sucursal: number;
    id_proveedor?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    guia_remitente?: string;
  }): Promise<RES_GuiaPrimerTramo[]> => {
    const { data } = await api.get(PATH, { params: filters });
    return data.data;
  },

  /**
   * Obtener una guía por id.
   */
  get_guia_by_id: async (id: number): Promise<RES_GuiaPrimerTramo> => {
    const { data } = await api.get(`${PATH}/${id}`);
    return data.data;
  },

  /**
   * Obtener metadatos para los filtros.
   */
  get_filtros_metadata: async (
    idSucursal: number,
  ): Promise<RES_FiltrosMetadataGuia> => {
    const { data } = await api.get(`${PATH}/filtros-metadata`, {
      params: { id_sucursal: idSucursal },
    });
    return data.data;
  },

  /**
   * Crear una guía de primer tramo (multipart con documentos + items).
   */
  crear_guia: async (dto: DTO_CrearGuiaPrimerTramo): Promise<RES_GuiaPrimerTramo> => {
    const formData = new FormData();

    appendIfPresent(formData, "id_sucursal", dto.id_sucursal);
    appendIfPresent(formData, "id_proveedor", dto.id_proveedor);
    appendIfPresent(formData, "id_concesion", dto.id_concesion);
    appendIfPresent(formData, "id_conductor", dto.id_conductor);
    appendIfPresent(formData, "id_vehiculo", dto.id_vehiculo);
    appendIfPresent(formData, "id_empresa_transporte", dto.id_empresa_transporte);
    appendIfPresent(formData, "id_vehiculo_carreta", dto.id_vehiculo_carreta);
    appendIfPresent(formData, "id_empresa_transporte_carreta", dto.id_empresa_transporte_carreta);
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "condicion_ingreso", dto.condicion_ingreso);
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

    formData.append("lotes", JSON.stringify(dto.lotes));

    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post(PATH, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Actualizar una guía de primer tramo (multipart con documentos + items).
   */
  actualizar_guia: async (
    id: number,
    dto: DTO_ActualizarGuiaPrimerTramo,
  ): Promise<RES_GuiaPrimerTramo> => {
    const formData = new FormData();

    appendIfPresent(formData, "id_sucursal", dto.id_sucursal);
    appendIfPresent(formData, "id_proveedor", dto.id_proveedor);
    appendIfPresent(formData, "id_concesion", dto.id_concesion);
    appendIfPresent(formData, "id_conductor", dto.id_conductor);
    appendIfPresent(formData, "id_vehiculo", dto.id_vehiculo);
    appendIfPresent(formData, "id_empresa_transporte", dto.id_empresa_transporte);
    appendIfPresent(formData, "id_vehiculo_carreta", dto.id_vehiculo_carreta);
    appendIfPresent(formData, "id_empresa_transporte_carreta", dto.id_empresa_transporte_carreta);
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "condicion_ingreso", dto.condicion_ingreso);
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

    formData.append("lotes", JSON.stringify(dto.lotes));

    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post(`${PATH}/${id}/update`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Anular una guía de primer tramo.
   */
  anular_guia: async (id: number): Promise<void> => {
    await api.patch(`${PATH}/${id}/anular`);
  },
};

/**
 * Servicio para items de mineral disponibles (lotes sin particiones y particiones).
 */
export const ItemsMineralService = {
  get_items_disponibles: async (
    idSucursal: number,
    idProveedor?: number | null,
    fechaInicio?: string | null,
    fechaFin?: string | null,
  ): Promise<RES_ItemMineralDisponible[]> => {
    const { data } = await api.get(`/aux/lotes-mineral-disponibles`, {
      params: {
        id_sucursal: idSucursal,
        id_proveedor: idProveedor ?? undefined,
        fecha_inicio: fechaInicio ?? undefined,
        fecha_fin: fechaFin ?? undefined,
      },
    });
    return data.data;
  },
};

/**
 * Servicio para concesiones por proveedor.
 */
export const ConcesionesPorProveedorService = {
  get_concesiones_by_proveedor: async (
    idProveedor: number,
  ): Promise<RES_ConcesionPorProveedor[]> => {
    const { data } = await api.get(`/concesiones/por-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data.data;
  },
};
