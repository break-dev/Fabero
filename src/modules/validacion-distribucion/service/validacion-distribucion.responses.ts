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
  // Estado de validación del lote.
  lote_esta_validado?: boolean;
  lote_id_empleado_valida?: number | null;
  lote_fecha_hora_validacion?: string | null;
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
  // Estado de validación de la partición.
  esta_validado?: boolean;
  id_empleado_valida?: number | null;
  fecha_hora_validacion?: string | null;
}

export interface RES_CerrarParticion {
  id_lote_mineral: number;
  cantidad_particiones: number;
  suma_peso_neto: number;
  peso_lote: number;
}

// --- Validación ---

export interface RES_EvaluacionParticion {
  id: number;
  particion: string;
  estado: string;
  cumple_pesos: boolean;
  cumple_fechas: boolean;
  cumple_recepcion: boolean;
  cumple: boolean;
  campos_faltantes: string[];
}

export interface RES_EvaluacionLote {
  lote_correlativo: string | null;
  peso_neto_lote: number;
  suma_pesos_netos: number;
  diferencia_suma: number;
  cumple_suma: boolean;
  particiones: Record<string, RES_EvaluacionParticion>;
  lote_cumple: boolean;
}

export interface RES_ResultadoValidarParticion {
  id: number;
  esta_validado: boolean;
  id_empleado_valida: number;
  fecha_hora_validacion: string;
  // Tras la nueva regla: si la particion era B+ sin ticket, el backend
  // devuelve la particion hidratada con id_ticket_balanza y ticket_correlativo
  // ya asignados para que la UI muestre el ticket sin un fetch extra.
  id_ticket_balanza?: number | null;
  ticket_correlativo?: string | null;
  // Bloqueo automatico al validar: si la particion no estaba bloqueada,
  // el backend la marca como bloqueada para preservar pesos definitivos.
  es_bloqueado?: boolean;
}

export interface RES_ResultadoValidarLote {
  id_lote_mineral: number;
  evaluacion: RES_EvaluacionLote;
  // Lista de particiones hidratadas con ticket_correlativo tras la
  // asignacion automatica de tickets a las B+ que no tenian.
  particiones?: RES_Particion[];
}

export interface RES_LoteOmitido {
  id_lote_mineral: number;
  lote_correlativo: string | null;
  razones: string[];
}

export interface RES_ResultadoValidarLotes {
  validados: number[];
  omitidos: RES_LoteOmitido[];
  // Mapa id_particion => ticket_correlativo para los tickets nuevos
  // generados para particiones B+ dentro de los lotes validados.
  tickets_asignados?: Record<string, string | null>;
}
