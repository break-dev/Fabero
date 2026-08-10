import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { TipoCarga } from "../../../shared/enums/_generic/tipo-carga";

export interface CrearRecepcionRequest {
  id_vehiculo?: number;
  placa?: string;
  serie_placa?: string;
  numero_placa?: string;
  id_empresa_transporte: number;
  id_tipo_vehiculo?: number;
  id_conductor: number;
  id_proveedor_minero?: number;
  tipo_ingreso?: TipoIngreso;
  tipo_carga?: TipoCarga;
  segunda_placa?: string;
  observacion?: string;
  evidencias?: File[];
  id_sucursal?: number;
  serie_guia_remitente?: string;
  numero_guia_remitente?: string;
  serie_guia_transportista?: string;
  numero_guia_transportista?: string;
  id_motivo_ingreso?: number;
  vehiculos?: {
    id?: number;
    placa: string;
    cantidad_personas: number;
    archivos?: File[];
  }[];
  visitantes?: {
    nombre: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
    es_conductor?: boolean;
    id_visita_vehiculo?: number;
    foto_documento?: File[];
  }[];
}

export interface RecepcionFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  placa?: string;
  id_empresa_transporte?: number;
  tipo_ingreso?: string;
}

export interface ProgramarRecepcionRequest {
  id_empresa_transporte: number;
  id_vehiculo?: number;
  id_tipo_vehiculo?: number;
  id_conductor?: number;
  id_proveedor_minero?: number;
  id_sucursal?: number;
  fecha_estimada_llegada?: string;
  serie_guia_remitente?: string;
  numero_guia_remitente?: string;
  serie_guia_transportista?: string;
  numero_guia_transportista?: string;
  observacion?: string;
  tipo_ingreso?: TipoIngreso | string;
}

export interface CrearVisitaVehiculoRequest {
  id_recepcion_visita: number;
  placa: string;
  cantidad_personas: number;
  archivos?: File[];
}

export interface ConfirmarVisitaPayload {
  id_recepcion_unidad: number;
  id_motivo_ingreso: number;
  observacion?: string;
  evidencias?: File[];
  vehiculos?: {
    id?: number;
    placa: string;
    cantidad_personas: number;
    archivos?: File[];
  }[];
  visitantes: {
    nombre: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
    es_conductor?: boolean;
    id_visita_vehiculo?: number;
    foto_documento?: File[];
  }[];
}
