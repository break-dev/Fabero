import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import type { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

export interface DTO_ItemGuiaInput {
  id_lote_mineral?: number | null;
  id_particion_lote_mineral?: number | null;
}

export interface DTO_CrearGuiaPrimerTramo {
  id_sucursal: number;
  id_proveedor: number;
  id_concesion: number;
  id_conductor: number;
  id_vehiculo: number;
  id_empresa_transporte: number | null;
  id_vehiculo_carreta: number | null;
  id_empresa_transporte_carreta: number | null;
  motivo_traslado: MotivoTraslado | string;
  condicion_ingreso: CondicionIngreso | string | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_remitente: string | null;
  guia_transportista: string | null;
  sin_guia_transportista: boolean;
  lotes: DTO_ItemGuiaInput[];
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
}

export interface DTO_ActualizarGuiaPrimerTramo extends Omit<DTO_CrearGuiaPrimerTramo, "documento_guia_remitente" | "documento_guia_transportista"> {
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
  motivo: string | null;
}
