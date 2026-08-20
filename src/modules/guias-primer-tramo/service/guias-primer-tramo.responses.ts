import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import type { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_ConcesionPorProveedor {
  id_concesion: number;
  id_departamento: number | null;
  departamento: string | null;
  id_provincia: number | null;
  provincia: string | null;
  id_distrito: number | null;
  distrito: string | null;
  nombre: string;
  codigo_reinfo: string | null;
  estado: string | null;
  id_concesion_proveedor: number;
}

import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";

export type TipoItem = "LOTE" | "PARTICION";

export interface RES_LoteGuia {
  id: number;
  id_guia_primer_tramo: number;
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
  tipo_item: TipoItem;
  correlativo: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  created_at: string | null;
}

export interface RES_DocumentoGuia {
  url: string;
  path_relativo: string;
  nombre_original: string;
  extension: string;
}

export interface RES_GuiaDocumentos {
  guia_remitente: RES_DocumentoGuia | null;
  guia_transportista: RES_DocumentoGuia | null;
}

export interface RES_GuiaPrimerTramo {
  id: number;
  id_sucursal: number;
  sucursal_nombre?: string;
  id_proveedor: number;
  proveedor_razon_social?: string;
  proveedor_documento?: string | null;
  id_concesion: number;
  concesion_nombre?: string | null;
  id_conductor: number;
  conductor_nombre?: string;
  conductor_dni?: string;
  conductor_licencia?: string | null;
  id_vehiculo: number;
  vehiculo_serie?: string | null;
  vehiculo_placa?: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social?: string | null;
  id_vehiculo_carreta: number | null;
  vehiculo_carreta_serie?: string | null;
  vehiculo_carreta_placa?: string | null;
  id_empresa_transporte_carreta: number | null;
  empresa_transporte_carreta_razon_social?: string | null;
  motivo_traslado: MotivoTraslado | string | null;
  condicion_ingreso: CondicionIngreso | string | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_remitente: string | null;
  guia_transportista: string | null;
  sin_guia_transportista: boolean;
  documentos: RES_GuiaDocumentos | null;
  id_empleado_registro: number | null;
  log_cambios: RES_CambiosLog[] | null;
  estado: EstadoBase;
  created_at: string;
  lotes: RES_LoteGuia[];
}

export interface RES_ItemMineralDisponible {
  id: number;
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
  id_recepcion_unidad: number;
  id_proveedor_minero: number | null;
  tipo_item: TipoItem;
  correlativo: string;
  numero_correlativo: number;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  created_at: string;
  proveedor_nombre: string | null;
  vehiculo_placa?: string | null;
  vehiculo_serie?: string | null;
  en_guia: boolean;
}

export interface RES_FiltrosMetadataGuia {
  proveedores: Array<{ id: number; razon_social: string }>;
}
