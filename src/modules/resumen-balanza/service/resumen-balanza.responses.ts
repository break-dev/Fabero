import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

/**
 * Discriminador del tipo de fila:
 * - `LOTE_RECEPCION` → fila de `lote_mineral` pesado en una recepción (Bloque A).
 * - `DISTRIBUCION_DETALLE` → fila de `distribucion_detalle` pesada en un despacho (Bloque B).
 */
export type TipoPesajeResumenBalanza = "LOTE_RECEPCION" | "DISTRIBUCION_DETALLE";

/** Origen del despacho_detalle (sólo aplica al Bloque B). */
export type OrigenTipoResumenBalanza = "LOTE" | "BLENDING" | null;

export interface RES_ResumenBalanzaItem {
  /** Identificador sintético único para la fila ("L-<id_lote>" | "D-<id_dd>"). */
  id_row: string;

  /** Discriminador del tipo de fila. */
  tipo_pesaje: TipoPesajeResumenBalanza;

  /** Origen del item despachado. Siempre `LOTE` en filas LOTE_RECEPCION; `LOTE` o `BLENDING` en DISTRIBUCION_DETALLE. */
  origen_tipo: OrigenTipoResumenBalanza;

  // ── Identificación primaria ──
  id_recepcion_unidad: number;

  /** Presente sólo en filas LOTE_RECEPCION. */
  id_lote?: number | null;
  lote_correlativo?: string | null;
  lote_numero_correlativo?: number | null;

  /** Presentes sólo en filas DISTRIBUCION_DETALLE. */
  id_distribucion_detalle?: number | null;
  id_distribucion?: number | null;
  id_despacho?: number | null;
  id_despacho_detalle?: number | null;
  despacho_correlativo?: string | null;
  numero_particion?: number | null;
  /** Correlativo del lote origen (FB-...) o del blending origen (FBL-YY-NNN). */
  origen_correlativo?: string | null;
  id_lote_origen?: number | null;
  id_blending_origen?: number | null;

  // ── Datos de lote (sólo Bloque A) ──
  lote_numero_contacto?: string | null;
  lote_tipo_producto?: string;
  lote_tipo_mineral?: string;
  lote_condicion_ingreso?: string | null;
  lote_evidencias?: IArchivo[] | null;
  lote_log_cambios?: RES_CambiosLog[] | null;
  lote_fecha_creacion?: string;

  // ── Pesos crudos ──
  /** Tara registrada en este pesaje (independiente del tipo de fila). */
  peso_tara?: number | null;
  /** Bruto registrado en este pesaje (independiente del tipo de fila). */
  peso_bruto?: number | null;
  /** Timestamp del pesaje TARA. Para LOTE (Recepción) = 2da pesada; para DESPACHO = 1ra pesada. */
  fecha_hora_peso_tara?: string | null;
  /** Timestamp del pesaje BRUTO. Para LOTE (Recepción) = 1ra pesada; para DESPACHO = 2da pesada. */
  fecha_hora_peso_bruto?: string | null;
  /** Neto (Bruto − Tara). Siempre presente cuando hay pesos. */
  peso_neto: number | null;

  /**
   * Aliases canónicos con el orden semántico de cada flujo.
   * - `peso_inicial`/`fecha_hora_peso_inicial` = la PRIMERA pesada del flujo (TARA en despacho, BRUTO en recepción).
   * - `peso_final`/`fecha_hora_peso_final` = la SEGUNDA pesada del flujo (BRUTO en despacho, TARA en recepción).
   * Mantener por compatibilidad con consumidores que asumen este orden.
   */
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;

  /** Ticket de balanza asociado a esta fila (lote o distribucion_detalle). */
  id_ticket_balanza: number | null;

  // ── Tipo / estado ──
  tipo_ingreso: string;
  fecha_hora_ingreso: string;
  fecha_hora_salida: string | null;
  segunda_placa: string | null;
  estado_pesaje: string;

  // ── Vehículo / Transporte ──
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;

  // ── Proveedor / Zona ──
  /** Bloque A: del lote. Bloque B: del lote origen (si existe; null si viene de BLENDING). */
  id_proveedor: number | null;
  proveedor_razon_social: string | null;
  id_zona_origen: number | null;
  zona_origen_nombre: string | null;

  // ── Conductor / Operador ──
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  conductor_licencia: string | null;
  empleado_registro_nombre: string;

  // ── Observaciones (Bloque A) ──
  observacion_peso_inicial?: string | null;
  observacion_peso_final?: string | null;
}

export interface RES_ResumenBalanzaFiltrosMetadata {
  lotes: { id: number; correlativo: string }[];
  vehiculos: { id: number; placa?: string }[];
  condiciones_ingreso: string[];
}
