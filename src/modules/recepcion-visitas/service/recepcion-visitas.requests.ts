export interface VisitorPayload {
  id_visitante?: number;
  id_visita_vehiculo?: number;
  es_conductor?: boolean;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  foto_documento?: File[];
}

export interface VehiculoAcompananteRequest {
  id?: number;
  temp_id?: number;
  placa: string;
  cantidad_personas: number;
  archivos?: File[];
}

export interface CrearRecepcionVisitaRequest {
  id_empleado_contacto?: number;
  id_empleado_autoriza?: number;
  id_motivo_ingreso: number;
  observacion?: string;
  evidencias?: File[];
  con_vehiculo: boolean;
  placa?: string;
  serie_placa?: string;
  numero_placa?: string;
  vehiculos?: VehiculoAcompananteRequest[];
  visitantes: VisitorPayload[];
}

export interface RecepcionVisitaFilters {
  fecha_inicio?: string; // yyyy-mm-dd
  fecha_fin?: string;    // yyyy-mm-dd
}
