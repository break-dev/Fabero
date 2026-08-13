import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useIAStore } from "../../../../stores/ia.store";
import {
  getRegisteredAIContexts,
  type AIContextFn,
} from "../../../../hooks/ia/module-ai-registry";

/**
 * Componente invisible que sincroniza el contexto del módulo activo al store.
 * Se monta una sola vez en AuthLayout.
 */
export const ModuleAIContextBridge = () => {
  const { pathname } = useLocation();
  const setContextoModulo = useIAStore((s) => s.setContextoModulo);

  const registry = useMemo(() => getRegisteredAIContexts(), []);

  useEffect(() => {
    let matchedFn: AIContextFn | null = null;
    let matchedKey = "";

    for (const [prefix, fn] of registry) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (matchedKey === "" || prefix.length > matchedKey.length) {
          matchedFn = fn;
          matchedKey = prefix;
        }
      }
    }

    const ctx = matchedFn ? matchedFn() : null;
    setContextoModulo(ctx);
  }, [pathname, registry, setContextoModulo]);

  return null;
};