export interface CrearDespachoRequest {
  id_planta_destino: number;
  detalles: CrearDespachoDetalleRequest[];
}

export interface CrearDespachoDetalleRequest {
  id_lote_mineral?: number | null;
  id_blending?: number | null;
  peso_tomado: number;
}

export interface CrearDistribucionRequest {
  id_sucursal: number;
  id_empresa_transporte: number;
  id_vehiculo: number;
  id_empresa_transporte_carreta?: number | null;
  id_vehiculo_carreta?: number | null;
  id_tipo_vehiculo: number;
  id_conductor: number;
  fecha_estimada_llegada?: string | null;
  detalles: CrearDistribucionDetalleRequest[];
}

export interface CrearDistribucionDetalleRequest {
  id_despacho_detalle: number;
  peso_tomado: number;
}

export interface PesarDistribucionDetalleRequest {
  peso_tara?: number | null;
  peso_bruto?: number | null;
  /** true = bloquear tara, false = desbloquear (cascade reset del bruto) */
  confirmar_tara?: boolean | null;
  /** true = bloquear bruto, false = desbloquear (sin cascade) */
  confirmar_bruto?: boolean | null;
}

export interface DespachoFiltros {
  id_planta_destino?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}