import type { EstadoBase } from "../../shared/enums/_generic/estado-base";

export interface RES_Vehiculo {
  id_vehiculo: number;
  id_empresa_transporte: number;
  id_tipo_vehiculo: number;
  razon_social: string;
  tipo_vehiculo_nombre: string;
  es_carreta?: boolean;
  placa: string;
  serie_placa?: string | null;
  numero_placa?: string | null;
  estado: EstadoBase;
  last_id_conductor?: number | null;
  ya_existia?: boolean;
}
