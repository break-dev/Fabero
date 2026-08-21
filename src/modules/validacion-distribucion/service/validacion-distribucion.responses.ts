export interface RES_LotePendiente {
  id_lote_mineral: number;
  lote_correlativo: string;
  lote_peso_neto: number;
  lote_peso_final: number;
  lote_peso_inicial: number | null;
  lote_fecha_peso_inicial: string | null;
  lote_fecha_peso_final: string | null;
  tiene_particion: number;
  id_recepcion_unidad: number;
  id_vehiculo: number;
  vehiculo_placa: string;
  vehiculo_capacidad: number;
  excedente: number;
  ticket_correlativo: string | null;
  // Cuando vehiculo_capacidad es NULL, el backend retorna excedente = NULL.
  lote_fecha_creacion: string;
}

export interface RES_ValidarLote {
  id_lote_mineral: number;
  lote_correlativo: string;
  lote_peso_neto: number;
  vehiculo_placa: string;
  vehiculo_capacidad: number;
  excedente: number;
  cantidad_particiones: number;
  suma_peso_neto_particiones: number;
  diferencia: number;
  puede_cerrar: boolean;
}

export interface RES_Particion {
  id: number;
  id_lote_mineral: number;
  id_ticket_balanza: number | null;
  id_recepcion_unidad: number | null;
  correlativo: string;
  particion: string;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  peso_neto: number | null;
  estado: string;
  es_bloqueado: boolean;
  ticket_correlativo?: string | null;
  id_vehiculo?: number | null;
  id_conductor?: number | null;
  id_sucursal?: number | null;
  id_empresa_transporte?: number | null;
  id_tipo_vehiculo?: number | null;
  id_proveedor_minero?: number | null;
  fecha_hora_ingreso?: string | null;
  fecha_hora_salida?: string | null;
  vehiculo_placa?: string | null;
  vehiculo_tara?: number | null;
  vehiculo_capacidad?: number | null;
}

export interface RES_CerrarParticion {
  id_lote_mineral: number;
  cantidad_particiones: number;
  suma_peso_neto: number;
  peso_lote: number;
}
