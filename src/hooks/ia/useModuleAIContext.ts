import type { IModuleAIContext } from "../../service/ia/ia.types";

export type { IModuleAIContext } from "../../service/ia/ia.types";

/**
 * Hook NOOP por defecto. Cada módulo puede sobrescribirlo exportando un
 * `useModuleAIContext` desde su propia carpeta `hooks/`.
 *
 * El bridge (`module-ai-context-bridge.tsx`) lee `getRegisteredAIContexts()`
 * y resuelve el hook cuyo prefijo de ruta coincide con la URL actual.
 */
export const useModuleAIContext = (): IModuleAIContext | null => {
  return null;
};