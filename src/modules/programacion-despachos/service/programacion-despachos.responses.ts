import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface DespachoListItem {
  id: number;
  id_planta_destino: number;
  planta_destino_razon_social: string;
  planta_destino_ruc: string;
  id_empleado_registro: number;
  empleado_registro_nombre: string | null;
  id_empleado_anulacion: number | null;
  fecha_hora_anulacion: string | null;
  correlativo: string;
  numero_correlativo: number;
  es_anulado: boolean;
  created_at: string;
  total_distribuciones: number;
  peso_total_tomado: number;
  peso_total_pendiente: number;
}

export interface DespachoDetalleItem {
  id: number;
  id_despacho: number;
  id_blending: number | null;
  id_lote_mineral: number | null;
  peso_tomado: number;
  peso_actual: number;
  blending_correlativo: string | null;
  blending_peso_neto: number | null;
  lote_correlativo: string | null;
  lote_peso_neto: number | null;
  lote_tipo_producto: string | null;
  lote_tipo_mineral: string | null;
  proveedor_razon_social: string | null;
}

export interface DistribucionDetalleItem {
  id: number;
  id_distribucion: number;
  id_despacho_detalle: number;
  numero_particion: number | null;
  peso_tomado: number;
  id_ticket_balanza: number | null;
  ticket_correlativo: string | null;
  peso_tara: number | null;
  fecha_hora_peso_tara: string | null;
  peso_bruto: number | null;
  fecha_hora_peso_bruto: string | null;
  peso_neto: number | null;
  peso_tara_confirmado: boolean | null;
  peso_bruto_confirmado: boolean | null;
  detalle_id_lote_mineral: number | null;
  detalle_id_blending: number | null;
  lote_correlativo: string | null;
  lote_ley_humedad: number | null;
  blending_correlativo: string | null;
  blending_ley_humedad: number | null;
  proveedor_razon_social: string | null;
  despacho_correlativo: string | null;
}

export interface DistribucionItem {
  id: number;
  id_despacho: number;
  id_sucursal: number | null;
  sucursal_nombre: string | null;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  id_vehiculo: number;
  vehiculo_placa: string;
  id_empresa_transporte_carreta: number | null;
  empresa_transporte_carreta_razon_social: string | null;
  id_vehiculo_carreta: number | null;
  vehiculo_carreta_placa: string | null;
  id_empleado_registro: number;
  empleado_registro_nombre: string | null;
  fecha_estimada_llegada: string | null;
  log_cambios: RES_CambiosLog[] | null;
  estado: string;
  created_at: string;
  id_recepcion_unidad: number | null;
  recepcion_estado: string | null;
  recepcion_estado_pesaje: string | null;
  recepcion_estado_salida: string | null;
  recepcion_fecha_hora_ingreso: string | null;
  recepcion_fecha_hora_salida: string | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  capacidad_vehiculo: number | null;
  detalles: DistribucionDetalleItem[];
  guia_segundo_tramo: GuiaSegundoTramo | null;
}

export interface DespachoDetalle {
  cabecera: DespachoCabecera;
  detalles: DespachoDetalleItem[];
  distribuciones: DistribucionItem[];
}

export interface DespachoCabecera {
  id: number;
  id_planta_destino: number;
  planta_destino_razon_social: string;
  planta_destino_ruc: string;
  id_empleado_registro: number;
  empleado_registro_nombre: string | null;
  id_empleado_anulacion: number | null;
  empleado_anulacion_nombre: string | null;
  fecha_hora_anulacion: string | null;
  correlativo: string;
  numero_correlativo: number;
  es_anulado: boolean;
  created_at: string;
}

export interface ItemDisponibleDespacho {
  tipo_item: "LOTE" | "BLENDING";
  id: number;
  id_lote_mineral: number | null;
  id_blending: number | null;
  correlativo: string;
  numero_correlativo: number;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  peso_neto: number;
  peso_actual: number;
  created_at: string;
  proveedor_razon_social: string | null;
}

export interface CrearDistribucionResult {
  despacho: DespachoDetalle;
  id_distribucion: number;
  id_recepcion_unidad: number | null;
  advertencias: string[];
}

export interface GuiaSegundoTramoDocumento {
  url: string;
  path_relativo: string;
  nombre_original: string | null;
  extension: string | null;
}

export interface GuiaSegundoTramoDocumentos {
  guia_remitente: GuiaSegundoTramoDocumento | null;
  guia_transportista: GuiaSegundoTramoDocumento | null;
}

export interface GuiaSegundoTramo {
  id: number;
  id_distribucion: number;
  id_empleado_registro: number | null;
  empleado_registro_nombre: string | null;
  motivo_traslado: MotivoTraslado | string | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_transportista: string | null;
  guia_remitente: string | null;
  sin_guia_transportista: boolean;
  log_cambios: RES_CambiosLog[] | null;
  documentos: GuiaSegundoTramoDocumentos | null;
  estado: EstadoBase | string;
  created_at: string;
}