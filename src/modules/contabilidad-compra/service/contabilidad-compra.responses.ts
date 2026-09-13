import type { EstadoComprobanteCompra } from "../../../shared/enums/contabilidad-compra/estado-comprobante-compra";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_AprobacionComprobante {
  tipo: TipoAprobacionComprobante;
  id_empleado: number | null;
  created_at: string | null;
  esta_aprobado: boolean;
  empleado_registro_nombre?: string | null;
}

export interface RES_LoteValorizadoComprobante {
  id: number;
  id_valorizacion_compra: number;
  id_lote_guia: number;
  elemento_quimico: string;
  subtotal: number;
  precio_por_tonelada: number;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor: number;
  numero_correlativo: number | null;
  lote_correlativo: string | null;
}

export interface RES_PagoComprobante {
  id: number;
  id_comprobante_compra: number;
  id_cuenta_bancaria_empresa: number | null;
  id_cuenta_bancaria_proveedor: number | null;
  id_empleado_registro: number;
  id_empleado_anulacion: number | null;
  es_para_detraccion: boolean;
  medio_pago: string;
  monto_pagado: number;
  fecha_hora_pago: string;
  numero_operacion: string | null;
  observacion: string | null;
  evidencias?: IArchivo[];
  evidencias_anulacion?: IArchivo[];
  fecha_hora_anulacion: string | null;
  motivo_anulacion: string | null;
  es_anulado: boolean;
  created_at: string;
  empleado_registro_nombre: string | null;
  empleado_anulacion_nombre: string | null;
  banco_empresa_nombre: string | null;
  empresa_numero_cuenta: string | null;
  empresa_moneda: string | null;
  banco_proveedor_nombre: string | null;
  proveedor_numero_cuenta: string | null;
  proveedor_moneda: string | null;
}

export interface RES_ComprobanteCompra {
  id: number;
  id_valorizacion_compra: number;
  valorizacion_correlativo: string;
  id_tipo_cambio: number;
  tipo_cambio_fecha: string;
  id_empleado_registro: number;
  id_empleado_anulacion: number | null;
  serie: string;
  numero: string;
  codigo_completo: string;
  fecha_emision: string;
  tipo_cambio_venta: number;
  porcentaje_igv: number;
  porcentaje_detraccion: number;
  total_dolares_antes_descuento: number;
  total_soles_antes_descuento: number;
  descuento: number;
  total_dolares: number;
  total_soles: number;
  monto_igv_soles: number;
  monto_pagado_anticipos: number;
  monto_detraccion: number;
  monto_detraccion_soles: number;
  monto_neto: number;
  avance_pago_neto: number;
  avance_pago_detraccion: number;
  id_cuenta_bancaria_proveedor_sugerida: number | null;
  aprobaciones: RES_AprobacionComprobante[];
  estado: EstadoComprobanteCompra;
  created_at: string;
  fecha_hora_anulacion: string | null;
  motivo_anulacion: string | null;
  id_proveedor: number;
  proveedor_nombre: string;
  proveedor_ruc: string | null;
  concesion_nombre: string | null;
  empleado_registro_nombre: string | null;
  total_pagado_neto: number;
  total_pagado_detraccion: number;
  evidencias?: IArchivo[];
  lotes_valorizados?: RES_LoteValorizadoComprobante[];
  pagos?: RES_PagoComprobante[];
}