import type { IAISchema } from "../../../service/ia/ia.types";

export interface IDatosVisitanteExtraidos {
  dni?: string;
  nombre?: string;
  apellido?: string;
}

export const visitanteIASchema: IAISchema = {
  name: "datos_visitante_dni",
  description:
    "Extrae los datos visibles del documento de identidad del visitante.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      dni: {
        type: "string",
        pattern: "^\\d{8}$",
        description: "Número de DNI, exactamente 8 dígitos.",
      },
      nombre: {
        type: "string",
        minLength: 1,
        description: "Nombres del visitante tal como aparecen en el documento.",
      },
      apellido: {
        type: "string",
        minLength: 1,
        description:
          "Apellidos del visitante tal como aparecen en el documento.",
      },
    },
    required: ["dni", "nombre", "apellido"],
  },
};

export const visitanteIAPrompt = `Eres un asistente que extrae datos del documento de identidad (DNI peruano) del visitante.

Reglas:
- Devuelve SOLO los campos visibles en el documento.
- "dni" debe contener exactamente 8 dígitos, sin puntos ni guiones.
- "nombre" son los nombres (sin apellidos).
- "apellido" son los apellidos paterno y materno concatenados por un espacio si están disponibles.
- Si un campo no es legible, devuélvelo como cadena vacía "" en lugar de inventarlo.
- No incluyas texto adicional fuera del JSON.`;

export const isCompleteDatos = (
  datos: IDatosVisitanteExtraidos | null | undefined,
): datos is Required<IDatosVisitanteExtraidos> => {
  if (!datos) return false;
  return Boolean(
    datos.dni &&
      datos.nombre &&
      datos.apellido &&
      /^\d{8}$/.test(datos.dni),
  );
};