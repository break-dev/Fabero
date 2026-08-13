import { api } from "../_api";
import type {
  IAIChatRequest,
  IAIChatResponse,
  IAISchema,
} from "./ia.types";

interface IApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

const unwrap = <T>(env: IApiEnvelope<T>): T => {
  if (env?.data !== undefined && env.data !== null) return env.data;
  return env as unknown as T;
};

export const IAService = {
  chat: async (req: IAIChatRequest): Promise<IAIChatResponse> => {
    const { data } = await api.post<IApiEnvelope<IAIChatResponse>>(
      "/ia/chat",
      req,
    );
    return unwrap(data);
  },

  chatStructured: async <T = unknown>(
    req: IAIChatRequest,
  ): Promise<IAIChatResponse<T>> => {
    const { data } = await api.post<IApiEnvelope<IAIChatResponse<T>>>(
      "/ia/chat-structured",
      req,
    );
    return unwrap(data);
  },

  analyzeFile: async <T = unknown>(args: {
    archivos: File[];
    prompt: string;
    schema?: IAISchema;
    temperature?: number;
  }): Promise<IAIChatResponse<T>> => {
    const fd = new FormData();
    args.archivos.forEach((file) => {
      fd.append("archivos[]", file);
    });
    fd.append("prompt", args.prompt);
    if (args.schema) {
      fd.append("schema", JSON.stringify(args.schema));
    }
    if (args.temperature !== undefined) {
      fd.append("temperature", String(args.temperature));
    }

    const { data } = await api.post<IApiEnvelope<IAIChatResponse<T>>>(
      "/ia/analyze-file",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(data);
  },

  health: async (): Promise<boolean> => {
    const { data } = await api.get<IApiEnvelope<{ ok: boolean }>>(
      "/ia/health",
    );
    return Boolean(unwrap(data)?.ok);
  },
};