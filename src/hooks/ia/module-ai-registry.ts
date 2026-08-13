import type { IModuleAIContext } from "../../service/ia/ia.types";

export type AIContextFn = () => IModuleAIContext | null;

const registry = new Map<string, AIContextFn>();

export const registerModuleAIContext = (
  routePrefix: string,
  fn: AIContextFn,
): void => {
  registry.set(routePrefix, fn);
};

export const getRegisteredAIContexts = (): Map<string, AIContextFn> => {
  return registry;
};