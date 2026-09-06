import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import type { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

export interface DTO_ItemGuiaInput {
  id_lote_mineral?: number | null;
  id_particion_lote_mineral?: number | null;
}

/**
 * Pesos oficiales reportados al registrar/editar una guia para un LOTE
 * sin particiones. El backend persiste estos valores en
 * `lote_mineral.peso_*_oficial` y, si el peso_neto_oficial difiere del
 * peso_neto original, sobrescribe `peso_actual`.
 */
export interface DTO_PesosOficialesLote {
  id_lote_mineral: number;
  peso_inicial_oficial: number;
  peso_final_oficial: number;
  peso_neto_oficial: number;
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
  pesos_oficiales_lotes?: DTO_PesosOficialesLote[] | null;
}

export interface DTO_ActualizarGuiaPrimerTramo extends Omit<DTO_CrearGuiaPrimerTramo, "documento_guia_remitente" | "documento_guia_transportista"> {
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
  motivo: string | null;
  pesos_oficiales_lotes?: DTO_PesosOficialesLote[] | null;
}

/**
 * Payload para `POST /api/guias-primer-tramo/validar-duplicado`. Se invoca
 * antes del submit para advertir al usuario si la combinación
 * (guia_remitente, guia_transportista / sin_guia_transportista) ya existe
 * en una guía activa. En edición, pasar `id_excluir` con el id de la guía
 * actual para no chocar consigo misma.
 */
export interface DTO_ValidarDuplicadoGuia {
  id_sucursal: number;
  guia_remitente: string;
  guia_transportista?: string | null;
  sin_guia_transportista: boolean;
  id_excluir?: number | null;
}
