export interface DTO_RecepcionFicticia {
  id_vehiculo?: number | null;
  id_empresa_transporte?: number | null;
  id_tipo_vehiculo?: number | null;
  id_conductor?: number | null;
  id_sucursal?: number | null;
  id_empleado_registro?: number | null;
  id_empleado_autoriza?: number | null;
  id_proveedor_minero?: number | null;
  fecha_hora_ingreso?: string | null;
  segunda_placa?: string | null;
}

export interface DTO_CrearParticion {
  recepcion?: DTO_RecepcionFicticia;
  peso_inicial?: number | null;
  fecha_hora_peso_inicial?: string | null;
  peso_final?: number | null;
  fecha_hora_peso_final?: string | null;
  peso_neto?: number | null;
}

export interface DTO_PesoInicialParticion {
  peso_inicial: number;
  fecha_hora_peso_inicial: string;
}

export interface DTO_PesoFinalParticion {
  peso_final: number;
  fecha_hora_peso_final: string;
}

export interface DTO_UpdateParticion {
  peso_inicial?: number | null;
  peso_final?: number | null;
  peso_neto?: number | null;
  fecha_hora_peso_inicial?: string | null;
  fecha_hora_peso_final?: string | null;
  es_bloqueado?: boolean;
  estado?: string;
  recepcion?: {
    id_vehiculo?: number | null;
    id_conductor?: number | null;
    id_sucursal?: number | null;
    id_empresa_transporte?: number | null;
    id_tipo_vehiculo?: number | null;
    id_proveedor_minero?: number | null;
    fecha_hora_ingreso?: string | null;
  };
}

export interface DTO_UpdateCapacidadVehiculo {
  capacidad: number;
}
