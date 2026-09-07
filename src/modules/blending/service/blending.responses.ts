import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface ItemDisponibleResponse {
  id_lote_mineral: number | null;
  id_reblending: number | null;
  tipo_origen: "lote" | "blending";
  codigo: string;
  correlativo_origen: string;
  id_empresa?: number | null;
  empresa_nombre?: string | null;
  id_proveedor: number | null;
  proveedor_nombre: string;
  tmh_disponible: number;
  tms_disponible: number;
  ley_humedad: number;
  ley_oro: number;
  ley_plata: number;
}

export interface BlendingDetalleResponse {
  id: number;
  id_blending: number;
  id_lote_mineral: number | null;
  id_reblending: number | null;
  peso_actual: number;
  peso_tomado: number;
  tms_tomado: number;
  created_at: string;
  codigo: string;
  correlativo_origen: string;
  proveedor_nombre: string;
  ley_humedad: number;
  ley_oro: number;
  ley_plata: number;
}

/**
 * Estructura nativa que devuelve el backend en `BlendingResponse.log_cambios`.
 *
 * ⚠️ **Compatibilidad con `RES_CambiosLog`** (`src/service/responses/_generic/cambios-log.ts`):
 * El componente `CambiosLogViewer` espera `RES_CambiosLog[]`. En `modal-historial-blending.tsx`
 * se aplica un mapper local `mapBlendingLogCambioToCambiosLog()` que traduce los campos
 * nativos (`cambios_metadata`, `nuevos_valores`, `adiciones_peso_kg`) al shape `cambios[]`
 * con `campo_bd`, `valor_anterior`, `valor_nuevo`.
 */
export interface BlendingLogCambioItem {
  fecha_hora: string;
  id_empleado?: number;
  accion: string;
  detalles?: Record<string, unknown>;
  /**
   * Metadata de cambios a nivel de campo. Acepta dos shapes:
   *  - `{ campo_bd: { valor_anterior, valor_nuevo } }` (forma plana)
   *  - `{ cambios: [{ campo_bd, valor_anterior, valor_nuevo }] }` (forma anidada)
   */
  cambios_metadata?: Record<string, unknown>;
  adiciones_peso_kg?: number;
  /**
   * Array de strings con formato `"campo_bd: anterior → nuevo"`.
   * Es la forma más flexible/legible que devuelve el backend para listar cambios.
   */
  nuevos_valores?: string[];
}

export interface BlendingResponse {
  id: number;
  id_empleado_registro: number;
  id_empresa: number | null;
  empleado_registro_nombre?: string;
  correlativo: string;
  numero_correlativo: string;
  fecha_hora_blending: string;
  evidencias: IArchivo[];
  observacion: string | null;
  peso_neto: number;
  peso_actual: number;
  ley_oro: number;
  ley_plata: number;
  ley_humedad: number;
  log_cambios: BlendingLogCambioItem[];
  created_at: string;
  detalles: BlendingDetalleResponse[];
}
