import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_ResumenBalanzaItem {
  id_lote: number;
  id_recepcion_unidad: number;
  lote_correlativo: string;
  lote_numero_correlativo: number;
  lote_tipo_carga: string;
  lote_numero_contacto: string | null;
  lote_tipo_producto: string;
  lote_tipo_mineral: string;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  observacion_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  observacion_peso_final: string | null;
  peso_neto: number | null;
  lote_fecha_creacion: string;
  lote_evidencias: IArchivo[];
  lote_condicion_ingreso: string | null;
  lote_log_cambios?: RES_CambiosLog[] | null;
  tipo_ingreso: string;
  fecha_hora_ingreso: string;
  fecha_hora_salida: string | null;
  segunda_placa: string | null;
  estado_pesaje: string;
  id_vehiculo: number | null;
  vehiculo_serie: string | null;
  vehiculo_placa: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_proveedor: number | null;
  proveedor_razon_social: string | null;
  id_zona_origen: number | null;
  zona_origen_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  conductor_licencia: string | null;
  empleado_registro_nombre: string;
}

export interface RES_ResumenBalanzaFiltrosMetadata {
  lotes: { id: number; correlativo: string }[];
  vehiculos: { id: number; placa?: string }[];
  condiciones_ingreso: string[];
}
