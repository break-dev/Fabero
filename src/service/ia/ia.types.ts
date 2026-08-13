export type AIRole = "system" | "user" | "assistant";

export interface IAIAttachment {
  mime: string;
  base64?: string;
  url?: string;
}

export interface IAIAttachmentMeta {
  name: string;
  mime: string;
  size: number;
}

export interface IAIMessage {
  role: AIRole;
  content: string;
  attachments?: IAIAttachment[];
  attachmentMeta?: IAIAttachmentMeta[];
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