export interface RES_TicketBalanzaData {
  id_lote: number;
  correlativo?: string | null;
  ticket_numero: number | null;
  ticket_correlativo?: string | null;
  fecha_impresion: string | null;
  placa: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  guia_remision: string | null;
  ruc_proveedor: string | null;
  proveedor: string | null;
  conductor: string | null;
  licencia_conductor: string | null;
  empresa_transporte: string | null;
  guia_transporte: string | null;
  nombre_sucursal?: string | null;
  direccion_sucursal: string | null;
  departamento_sucursal: string | null;
  provincia_sucursal: string | null;
  distrito_sucursal: string | null;
  nombre_concesion?: string | null;
  codigo_reinfo_concesion: string | null;
  departamento_concesion: string | null;
  provincia_concesion: string | null;
  distrito_concesion: string | null;
  zona_origen_nombre?: string | null;
  observacion_peso_inicial: string | null;
  observacion_peso_final: string | null;
  /** Timestamp del pesaje BRUTO. Para LOTE (Recepción) suele ser la 1ra pesada; para DESPACHO suele ser la 2da. */
  fecha_hora_peso_bruto: string | null;
  peso_bruto: number | null;
  /** Timestamp del pesaje TARA. Para LOTE (Recepción) suele ser la 2da pesada; para DESPACHO suele ser la 1ra. */
  fecha_hora_peso_tara: string | null;
  peso_tara: number | null;
  peso_neto: number | null;
  /** Indica si el ticket proviene de un despacho (flujo TARA→BRUTO) o de una recepción (flujo BRUTO→TARA). */
  es_despacho?: boolean | null;
  despacho_correlativo?: string | null;
  planta_destino_nombre?: string | null;
  operador: string | null;
  dni_operador: string | null;
  cargo_operador: string | null;
}