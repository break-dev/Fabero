import { useCallback, useState } from "react";
import { useNotify } from "../useNotify";
import { IAService } from "../../service/ia/ia.service";
import type {
  IAIChatResponse,
  IAISchema,
} from "../../service/ia/ia.types";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface UseAIFileAnalysisReturn<T> {
  result: IAIChatResponse<T> | null;
  loading: boolean;
  error: string | null;
  analyze: (args: {
    archivos: File[];
    prompt: string;
    schema?: IAISchema;
    temperature?: number;
  }) => Promise<IAIChatResponse<T> | null>;
  reset: () => void;
}

const validateFiles = (archivos: File[]): string | null => {
  if (archivos.length === 0) return "Adjunta al menos un archivo.";
  for (const file of archivos) {
    if (file.size > MAX_BYTES) {
      return `El archivo "${file.name}" supera el límite de 8 MB.`;
    }
    const mime = file.type || "";
    if (!ALLOWED_MIME.has(mime)) {
      return `El archivo "${file.name}" no es una imagen JPG, PNG o WEBP.`;
    }
  }
  return null;
};

export const useAIFileAnalysis = <T = unknown>(): UseAIFileAnalysisReturn<T> => {
  const [result, setResult] = useState<IAIChatResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifyError } = useNotify();

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const analyze = useCallback(
    async (args: {
      archivos: File[];
      prompt: string;
      schema?: IAISchema;
      temperature?: number;
    }): Promise<IAIChatResponse<T> | null> => {
      const validationError = validateFiles(args.archivos);
      if (validationError) {
        notifyError(validationError);
        setError(validationError);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await IAService.analyzeFile<T>(args);
        setResult(response);
        return response;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo analizar el archivo con IA.";
        setError(message);
        notifyError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  return { result, loading, error, analyze, reset };
};