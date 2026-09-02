import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { IDocumentoProgramacion } from "../../../shared/interfaces/documentos-programacion";

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
  guia_remitente_file?: File | null;
  guia_transportista_file?: File | null;
  documentos_programacion_existentes?: IDocumentoProgramacion | null;
  observacion?: string;
  tipo_ingreso?: TipoIngreso | string;
}

export interface ProgramacionFilters {
  estado_confirmacion?: "todos" | "pendientes" | "confirmadas";
  solo_pendientes?: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}
