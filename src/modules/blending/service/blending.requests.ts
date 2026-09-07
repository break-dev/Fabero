import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface ItemTomadoPayload {
  id_lote_mineral?: number | null;
  id_reblending?: number | null;
  peso_tomado: number;
}

export interface CrearBlendingPayload {
  fecha_hora_blending?: string;
  observacion?: string | null;
  evidencias?: File[];
  detalles: ItemTomadoPayload[];
}

export interface AdicionPesoPayload {
  id_detalle?: number | null;
  id_lote_mineral?: number | null;
  id_reblending?: number | null;
  peso_adicional: number;
}

export interface EditarBlendingPayload {
  fecha_hora_blending?: string;
  observacion?: string | null;
  evidencias_existentes?: IArchivo[];
  evidencias_nuevas?: File[];
  nombres_evidencias_nuevas?: string[];
  nombres_evidencias_eliminadas?: string[];
  adiciones?: AdicionPesoPayload[];
}