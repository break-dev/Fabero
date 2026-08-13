import { useCallback, useState } from "react";
import { IAService } from "../../service/ia/ia.service";
import type {
  IAIChatResponse,
  IAIMessage,
  IAISchema,
} from "../../service/ia/ia.types";

interface UseAIStructuredReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  analyze: (args: {
    messages: IAIMessage[];
    schema: IAISchema;
    temperature?: number;
  }) => Promise<T | null>;
  reset: () => void;
}

export const useAIStructured = <T = unknown>(): UseAIStructuredReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const analyze = useCallback(
    async (args: {
      messages: IAIMessage[];
      schema: IAISchema;
      temperature?: number;
    }): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const response: IAIChatResponse<T> = await IAService.chatStructured<T>({
          messages: args.messages,
          schema: args.schema,
          ...(args.temperature !== undefined
            ? { temperature: args.temperature }
            : {}),
        });
        const result = response.structured ?? null;
        setData(result);
        return result;
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
    [],
  );

  return { data, loading, error, analyze, reset };
};