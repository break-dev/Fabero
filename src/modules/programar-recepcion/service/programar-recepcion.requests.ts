import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";

export interface CrearProgramacionRequest {
  id_empresa_transporte: number;
  id_vehiculo?: number;
  id_tipo_vehiculo?: number;
  id_conductor?: number;
  id_proveedor_minero?: number;
  id_sucursal?: number;
  fecha_estimada_llegada?: string;
  guia_remitente?: string;
  guia_transportista?: string;
  observacion?: string;
  tipo_ingreso?: TipoIngreso | string;
}

export interface ProgramacionFilters {
  solo_pendientes?: boolean;
}
