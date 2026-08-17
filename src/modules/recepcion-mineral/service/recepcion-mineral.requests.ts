import type { IArchivo } from "../../../shared/interfaces/archivo";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

export interface DTO_CrearLote {
  condicion_ingreso: CondicionIngreso;
  id_empresa: number;
  correlativo_manual?: string;
  numero_correlativo_manual?: number;
}

export interface DTO_PesoInicial {
  id_proveedor_minero: number | null;
  id_zona_origen: number | null;
  numero_contacto: string;
  tipo_producto: string;
  tipo_mineral: string;
  peso_inicial: number;
  observacion_peso_inicial?: string;
  evidencias?: File[];
}

export interface DTO_PesoFinal {
  peso_final: number;
  observacion_peso_final?: string;
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  id_proveedor_minero?: number | null;
  id_zona_origen?: number | null;
  numero_contacto?: string;
  tipo_producto?: string;
  tipo_mineral?: string;
  peso_inicial?: number;
  observacion_peso_inicial?: string;
  id_vehiculo?: number | null;
  id_empresa_transporte?: number | null;
  id_tipo_vehiculo?: number | null;
  id_conductor?: number | null;
  condicion_ingreso?: string;
  motivo?: string;
}
