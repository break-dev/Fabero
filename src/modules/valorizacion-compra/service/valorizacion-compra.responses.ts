import type { EstadoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import type { TipoPagoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { EstadoTransaccionAnticipo } from "../../../shared/enums/valorizacion-compra/estado-transaccion-anticipo";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_ValorizacionCompraDetalle {
  id: number;
  id_valorizacion_compra: number;
  id_lote_guia: number;
  id_condicion_comercial: number | null;
  id_valor_elemento_quimico: number | null;
  elemento_quimico: ElementoQuimicoValorizacion;
  numero_correlativo: number | null;
  lote_correlativo: string | null;
  grr: string | null;
  grt: string | null;
  fecha_ingreso: string | null;
  tmh: number;
  ley_humedad: number;
  tms: number;
  ley: number;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor: number;
  precio_por_tonelada: number;
  subtotal: number;
  penalidad?: number;
  flete?: number;
  log_cambios?: Record<string, unknown>[];
}

export interface RES_TransaccionAnticipoValorizacion {
  id: number;
  id_anticipo_proveedor: number;
  id_valorizacion_compra: number;
  factura: string | null;
  monto_retirado: number;
  saldo_actual: number;
  estado: EstadoTransaccionAnticipo;
  created_at: string;
  log_cambios?: Record<string, unknown>[];
}

export interface RES_ValorizacionCompra {
  id: number;
  numero_correlativo: string;
  correlativo: string | null;
  id_proveedor_minero: number;
  proveedor_nombre: string | null;
  proveedor_ruc: string | null;
  id_concesion: number;
  concesion_nombre: string | null;
  id_cuenta_bancaria: number | null;
  cuenta_bancaria_info: string | null;
  id_cuenta_detraccion: number | null;
  cuenta_detraccion_info: string | null;
  tipo_pago: TipoPagoValorizacionCompra;
  estado: EstadoValorizacionCompra;
  created_at: string;
  fecha_hora_aprobacion: string | null;
  fecha_hora_anulacion?: string | null;
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
  id_empleado_anulacion?: number | null;
  empleado_registro: string | null;
  empleado_aprobacion: string | null;
  empleado_anulacion?: string | null;
  motivo_anulacion?: string | null;
  evidencias_anulacion?: (IArchivo | string)[];
  total_subtotal: number;
  total_anticipos: number;
  monto_transferencia: number;
  evidencias?: (IArchivo | string)[];
  log_cambios?: Record<string, unknown>[];
  detalles: RES_ValorizacionCompraDetalle[];
  transacciones_anticipo: RES_TransaccionAnticipoValorizacion[];
}
