export interface DTO_ResumenBalanzaFiltros {
  id_sucursal: number;
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
  tipo_ingreso?: string;
  placa?: string;
  /** Correlativo (o fragmento) del lote origen. Para despacho: busca en lote origen O blending origen. */
  lote_correlativo?: string;
  id_empresa_transporte?: number;
}
