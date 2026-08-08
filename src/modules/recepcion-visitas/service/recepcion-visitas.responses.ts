export interface RecepcionVisitaDetalleResponse {
  id_detalle: number;
  id_visitante: number;
  id_visita_vehiculo?: number | null;
  vehiculo_placa?: string | null;
  es_conductor?: boolean;
  visitante_nombre: string;
  visitante_apellido: string;
  visitante_dni: string;
  visitante_telefono: string | null;
  url_foto_documento: string[];
  fecha_hora_salida: string | null;
  observacion_salida: string | null;
  evidencias_salida?: string[] | null;
  estado: string;
}

export interface RecepcionVisitaResponse {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  id_empleado_contacto: number;
  empleado_contacto_nombre: string;
  id_motivo_ingreso: number;
  motivo_ingreso_nombre: string;
  fecha_hora_ingreso: string;
  observacion: string | null;
  con_vehiculo: boolean;
  serie_placa: string | null;
  numero_placa: string | null;
  visitantes: RecepcionVisitaDetalleResponse[];
  vehiculos?: { id: number; placa: string; cantidad_personas: number; url_foto?: string[] }[];
}
