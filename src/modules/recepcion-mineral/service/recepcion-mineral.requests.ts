import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface DTO_PesoInicial {
  id_proveedor_minero: number | null;
  id_zona_origen: number | null;
  numero_contacto: string;
  tipo_carga: string;
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
  tipo_carga?: string;
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
