export type AIRole = "system" | "user" | "assistant";

export interface IAIAttachment {
  mime: string;
  base64?: string;
  url?: string;
}

export interface IAIMessage {
  role: AIRole;
  content: string;
  attachments?: IAIAttachment[];
}

export interface IAISchema {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface IAIChatRequest {
  messages: IAIMessage[];
  schema?: IAISchema;
  temperature?: number;
  maxTokens?: number;
}

export interface IAIUsage {
  input: number;
  output: number;
  total: number;
}

export interface IAIChatResponse<T = unknown> {
  text?: string;
  structured?: T;
  usage?: IAIUsage;
}

export interface IModuleAIContext {
  titulo: string;
  descripcion?: string;
  datos?: Record<string, unknown>;
  instrucciones?: string;
}