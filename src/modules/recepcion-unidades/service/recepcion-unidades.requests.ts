import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";

export interface DTO_EditarObservacionEvidencias {
  observacion?: string | null;
  observacion_salida?: string | null;
  motivo?: string | null;
  evidencias_existentes?: IArchivo[];
  evidencias?: File[];
}

export interface CrearRecepcionRequest {
  id_vehiculo?: number;
  placa?: string;
  id_empresa_transporte: number;
  id_tipo_vehiculo?: number;
  id_conductor: number;
  id_proveedor_minero?: number;
  tipo_ingreso?: TipoIngreso;
  segunda_placa?: string;
  observacion?: string;
  evidencias?: File[];
  id_sucursal?: number;
  guia_remitente?: string;
  guia_transportista?: string;
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
