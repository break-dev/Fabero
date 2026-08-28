import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  CrearDespachoRequest,
  CrearDistribucionRequest,
  DespachoFiltros,
  PesarDistribucionDetalleRequest,
} from "./programacion-despachos.requests";
import type {
  CrearDistribucionResult,
  DespachoDetalle,
  DespachoListItem,
  DistribucionDetalleItem,
  ItemDisponibleDespacho,
} from "./programacion-despachos.responses";

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
};