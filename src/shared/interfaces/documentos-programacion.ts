import type { IArchivo } from "./archivo";

export interface IDocumentoProgramacion {
  guia_remitente: IArchivo | null;
  guia_transportista: IArchivo | null;
}