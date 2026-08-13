import { useCallback, useState } from "react";
import { IAService } from "../../service/ia/ia.service";
import type {
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
  send: (userContent: string) => Promise<IAIChatResponse | null>;
  appendUser: (content: string) => void;
  appendAssistant: (content: string) => void;
  clear: () => void;
}

const buildSystemMessage = (ctx: IModuleAIContext | null): IAIMessage => {
  const languageDirective =
    "REGLA OBLIGATORIA E INNEGOCIABLE: Debes responder SIEMPRE en español latino peruano. " +
    "Nunca uses inglés ni ningún otro idioma, ni siquiera para saludar. " +
    "Si el usuario escribe en otro idioma, responde en español latino peruano igualmente.";

  if (!ctx) {
    return {
      role: "system",
      content:
        `${languageDirective}\n\n` +
        "Eres un asistente integrado al ERP Fabero. " +
        "Responde de forma concisa, sencilla, clara y breve. Si no sabes algo, dilo. No inventes datos.",
    };
  }

  const lines: string[] = [];
  lines.push(languageDirective);
  lines.push(
    `Eres un asistente integrado al ERP Fabero para ayudar al usuario con el módulo "${ctx.titulo}".`,
  );
  lines.push("Responde en español latino peruano, de forma concisa y clara.");
  if (ctx.descripcion) lines.push(`Descripción: ${ctx.descripcion}`);
  if (ctx.instrucciones) lines.push(`Instrucciones: ${ctx.instrucciones}`);
  if (ctx.datos && Object.keys(ctx.datos).length > 0) {
    lines.push(
      `Datos visibles del módulo (referencia, no necesariamente la fuente de verdad):\n${JSON.stringify(
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
    async (userContent: string): Promise<IAIChatResponse | null> => {
      const trimmed = userContent.trim();
      if (trimmed === "") return null;

      const systemMessage = buildSystemMessage(contextoModulo);
      const userMessage: IAIMessage = { role: "user", content: trimmed };
      const fullConversation: IAIMessage[] = [
        systemMessage,
        ...messages,
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