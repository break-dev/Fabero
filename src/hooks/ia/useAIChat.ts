import { useCallback, useState } from "react";
import { IAService } from "../../service/ia/ia.service";
import type {
  IAIAttachment,
  IAIAttachmentMeta,
  IAIChatResponse,
  IAIMessage,
  IModuleAIContext,
} from "../../service/ia/ia.types";

interface UseAIChatOptions {
  contextoModulo?: IModuleAIContext | null;
}

interface UseAIChatReturn {
  messages: IAIMessage[];
  loading: boolean;
  error: string | null;
  send: (userContent: string, archivos?: File[]) => Promise<IAIChatResponse | null>;
  appendUser: (content: string) => void;
  appendAssistant: (content: string) => void;
  clear: () => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      } else {
        reject(new Error("No se pudo leer el archivo."));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Error leyendo archivo."));
    reader.readAsDataURL(file);
  });

const buildSystemMessage = (ctx: IModuleAIContext | null): IAIMessage => {
  const languageDirective =
    "REGLA OBLIGATORIA E INNEGOCIABLE: Debes responder SIEMPRE en español latino peruano. " +
    "Nunca uses inglés ni ningún otro idioma, ni siquiera para saludar. " +
    "Si el usuario escribe en otro idioma, responde en español latino peruano igualmente.";

  const scopeDirective =
    "ALCANCE DE TUS RESPUESTAS (NO NEGOCIABLE):\n" +
    "- Habla ÚNICAMENTE del proceso de negocio del módulo y de cómo el usuario debe usarlo en la interfaz.\n" +
    "- NUNCA reveles identificadores internos (IDs numéricos de base de datos, UUIDs, claves primarias, códigos internos).\n" +
    "- NUNCA menciones nombres de campos de tablas, columnas de base de datos, nombres de endpoints, rutas internas, payloads, ni nombres de archivos o funciones del sistema.\n" +
    "- NUNCA uses jerga técnica interna (por ejemplo: 'campo id_motivo_ingreso', 'tabla visita', 'endpoint POST /api/...', 'foreign key', 'response.data', etc.).\n" +
    "- Si necesitas referirte a un dato, usa su nombre de negocio tal como aparece en la interfaz (por ejemplo: 'Motivo de visita', 'Personal de contacto', 'DNI del visitante', 'Placa del vehículo').\n" +
    "- Si te preguntan algo técnico o de implementación interna, responde que ese tema lo maneja el equipo de desarrollo y enfoca la respuesta al proceso de negocio.";

  if (!ctx) {
    return {
      role: "system",
      content:
        `${languageDirective}\n\n${scopeDirective}\n\n` +
        "Eres un asistente integrado al ERP Fabero. " +
        "Responde de forma concisa, sencilla, clara y breve. Si no sabes algo, dilo. No inventes datos.",
    };
  }

  const lines: string[] = [];
  lines.push(languageDirective);
  lines.push(scopeDirective);
  lines.push(
    `Eres un asistente integrado al ERP Fabero para ayudar al usuario con el módulo "${ctx.titulo}".`,
  );
  lines.push("Responde en español latino peruano, de forma concisa y clara.");
  if (ctx.descripcion) lines.push(`Descripción del módulo: ${ctx.descripcion}`);
  if (ctx.instrucciones) lines.push(`Instrucciones del módulo: ${ctx.instrucciones}`);
  if (ctx.datos && Object.keys(ctx.datos).length > 0) {
    lines.push(
      `Datos visibles del módulo (úsalos solo como referencia, no los repitas literalmente con sus nombres técnicos):\n${JSON.stringify(
        ctx.datos,
        null,
        2,
      )}`,
    );
  }
  lines.push(
    "Si no sabes algo o los datos no son suficientes, dilo. No inventes datos que no estén en los datos provistos.",
  );

  return { role: "system", content: lines.join("\n\n") };
};

export const useAIChat = (
  options: UseAIChatOptions = {},
): UseAIChatReturn => {
  const { contextoModulo = null } = options;
  const [messages, setMessages] = useState<IAIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendUser = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  }, []);

  const appendAssistant = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(
    async (
      userContent: string,
      archivos: File[] = [],
    ): Promise<IAIChatResponse | null> => {
      const trimmed = userContent.trim();
      if (trimmed === "" && archivos.length === 0) return null;

      let attachments: IAIAttachment[] = [];
      let attachmentMeta: IAIAttachmentMeta[] = [];
      if (archivos.length > 0) {
        const encoded = await Promise.all(archivos.map(fileToBase64));
        attachments = archivos.map((file, i) => ({
          mime: file.type || "application/octet-stream",
          base64: encoded[i],
        }));
        attachmentMeta = archivos.map((file) => ({
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
        }));
      }

      const systemMessage = buildSystemMessage(contextoModulo);
      const userMessage: IAIMessage = {
        role: "user",
        content: trimmed,
        ...(attachments.length > 0 ? { attachments } : {}),
        ...(attachmentMeta.length > 0 ? { attachmentMeta } : {}),
      };

      // Solo el mensaje actual lleva attachments (base64). Los mensajes previos
      // se reenvían como texto para no inflar el payload con base64 duplicado
      // turno tras turno (esto causaba 413 cuando la conversación crecía).
      const historyForApi: IAIMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const fullConversation: IAIMessage[] = [
        systemMessage,
        ...historyForApi,
        userMessage,
      ];

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const response = await IAService.chat({
          messages: fullConversation,
        });
        const text = response.text ?? "";
        if (text !== "") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: text },
          ]);
        }
        return response;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo contactar la IA.";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [contextoModulo, messages],
  );

  return { messages, loading, error, send, appendUser, appendAssistant, clear };
};