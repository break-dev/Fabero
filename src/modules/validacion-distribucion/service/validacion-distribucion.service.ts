import { api } from "../../../service/_api";
import type {
  DTO_CrearParticion,
  DTO_PesoInicialParticion,
  DTO_PesoFinalParticion,
  DTO_UpdateParticion,
  DTO_UpdateCapacidadVehiculo,
} from "./validacion-distribucion.requests";
import type {
  RES_LotePendiente,
  RES_ValidarLote,
  RES_Particion,
  RES_CerrarParticion,
} from "./validacion-distribucion.responses";
import type { RES_TicketBalanzaData } from "../../recepcion-mineral/service/recepcion-mineral.responses";

const PATH = "/validacion-distribucion";
const AUX_PATH = "/aux";

export interface FiltrosLotesPendientes {
  id_sucursal?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export const ValidacionDistribucionService = {
  getLotesPendientes: async (
    filtros: FiltrosLotesPendientes
  ): Promise<RES_LotePendiente[]> => {
    const { data } = await api.get(`${PATH}/lotes-pendientes`, {
      params: {
        id_sucursal: filtros.id_sucursal ?? undefined,
        fecha_inicio: filtros.fecha_inicio ?? undefined,
        fecha_fin: filtros.fecha_fin ?? undefined,
      },
    });
    return data.data;
  },

  getValidarLote: async (idLote: number): Promise<RES_ValidarLote> => {
    const { data } = await api.get(`${PATH}/lotes/${idLote}/validar`);
    return data.data;
  },

  getParticiones: async (idLote: number): Promise<RES_Particion[]> => {
    const { data } = await api.get(`${PATH}/lotes/${idLote}/particiones`);
    return data.data;
  },

  getTicketBalanza: async (
    idParticion: number
  ): Promise<RES_TicketBalanzaData> => {
    const { data } = await api.get(`${PATH}/particiones/${idParticion}/ticket-balanza`);
    return data.data;
  },

  getTicketBalanzaLote: async (
    idLote: number
  ): Promise<RES_TicketBalanzaData> => {
    const { data } = await api.get(`${PATH}/lotes/${idLote}/ticket-balanza`);
    return data.data;
  },

  crearParticion: async (
    idLote: number,
    payload: DTO_CrearParticion
  ): Promise<RES_Particion> => {
    const { data } = await api.post(`${PATH}/lotes/${idLote}/particiones`, payload);
    return data.data;
  },

  updateParticion: async (
    idParticion: number,
    payload: DTO_UpdateParticion
  ): Promise<RES_Particion[]> => {
    const { data } = await api.put(`${PATH}/particiones/${idParticion}`, payload);
    return data.data;
  },

  registrarPesoInicial: async (
    idParticion: number,
    payload: DTO_PesoInicialParticion
  ): Promise<RES_Particion> => {
    const { data } = await api.post(
      `${PATH}/particiones/${idParticion}/peso-inicial`,
      payload
    );
    return data.data;
  },

  registrarPesoFinal: async (
    idParticion: number,
    payload: DTO_PesoFinalParticion
  ): Promise<RES_Particion> => {
    const { data } = await api.post(
      `${PATH}/particiones/${idParticion}/peso-final`,
      payload
    );
    return data.data;
  },

  cerrarParticion: async (idLote: number): Promise<RES_CerrarParticion> => {
    const { data } = await api.post(`${PATH}/lotes/${idLote}/cerrar`);
    return data.data;
  },

  updateCapacidadVehiculo: async (
    idVehiculo: number,
    payload: DTO_UpdateCapacidadVehiculo
  ): Promise<{ id: number; placa: string; capacidad: number }> => {
    const { data } = await api.patch(
      `${AUX_PATH}/vehiculos/${idVehiculo}/capacidad`,
      payload
    );
    return data.data;
  },
};

export const AuxPathService = {
  updateCapacidadVehiculo: ValidacionDistribucionService.updateCapacidadVehiculo,
};
