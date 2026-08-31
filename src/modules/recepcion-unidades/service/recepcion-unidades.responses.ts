import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { EstadoUnidad } from "../../../shared/enums/_generic/estado-unidad";
import type { EstadoSalida } from "../../../shared/enums/_generic/estado-salida";
import type { EstadoPesaje } from "../../../shared/enums/_generic/estado-pesaje";

export interface RecepcionUnidadResponse {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  conductor_numero_licencia: string | null;
  tipo_ingreso: TipoIngreso | string | null;
  segunda_placa: string | null;
  fecha_hora_ingreso: string | null;
  evidencias: IArchivo[];
  observacion: string | null;
  estado: EstadoUnidad | string | null;
  estado_salida: EstadoSalida | string | null;
  fecha_hora_salida: string | null;
  observacion_salida: string | null;
  id_sucursal?: number | null;
  fecha_hora_inicio_pesaje?: string | null;
  fecha_hora_final_pesaje?: string | null;
  estado_pesaje: EstadoPesaje | string | null;
  id_proveedor_minero: number | null;
  proveedor_razon_social: string | null;
  id_empleado_autoriza: number | null;
  empleado_autoriza_nombre: string | null;
  id_empleado_recepcion: number | null;
  empleado_recepcion_nombre: string | null;
  es_programacion: boolean;
  fecha_estimada_llegada: string | null;
  guia_remitente: string | null;
  guia_transportista: string | null;
  es_recepcion_ficticia: boolean;
  visita?: ProgramacionVisitaPayload | null;
  log_cambios?: RES_CambiosLog[] | null;
}

export interface ProgramacionVisitaPayload {
  id_recepcion_visita: number;
  id_motivo_ingreso: number | null;
  motivo_ingreso_nombre: string | null;
  fecha_hora_ingreso: string | null;
  observacion: string | null;
  estado: string | null;
  vehiculos?: VisitaVehiculoResponse[];
  detalles?: VisitaDetalleResponse[];
}

export interface VisitaVehiculoResponse {
  id: number;
  id_recepcion_visita: number;
  placa: string;
  cantidad_personas: number;
  url_foto: string[] | null;
  created_at?: string;
}

export interface VisitaDetalleResponse {
  id_detalle: number;
  id_visitante: number;
  id_visita_vehiculo: number | null;
  es_conductor: boolean;
  estado: string;
  visitante_nombre: string;
  visitante_apellido: string | null;
  visitante_dni: string | null;
  visitante_telefono: string | null;
  url_foto_documento: string[] | null;
}
