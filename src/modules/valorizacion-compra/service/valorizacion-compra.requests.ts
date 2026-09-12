import type { TipoPagoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface REQ_FiltroValorizaciones {
  id_proveedor?: number;
}

export interface REQ_ValorizacionDetalleItem {
  id_lote_guia: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  id_condicion_comercial?: number | null;
  id_valor_elemento_quimico?: number | null;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor?: number;
  penalidad?: number;
  flete?: number;
}

export interface REQ_ValorizacionAnticipoItem {
  id_anticipo_proveedor: number;
  monto_retirado: number;
  factura?: string;
}

export interface REQ_CrearValorizacion {
  id_proveedor_minero: number;
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_EditarValorizacion {
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  motivo_edicion?: string;
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_AnularValorizacion {
  motivo_anulacion: string;
  tipo_eliminacion: "logica" | "fisica";
  evidencias_anulacion?: File[];
}
