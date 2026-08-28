export interface RES_MotivoIngreso {
  id_motivo_ingreso: number;
  nombre: string;
  es_recepcion_unidad?: boolean;
}

export interface RES_Visitante {
  id_visitante: number;
  nombre: string;
  apellido: string | null;
  dni: string | null;
  telefono: string | null;
}
