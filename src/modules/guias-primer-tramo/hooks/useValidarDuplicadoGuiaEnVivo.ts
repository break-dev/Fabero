import { useEffect, useState } from "react";
import { GuiasPrimerTramoService } from "../service/guias-primer-tramo.service";
import type { RES_ValidarDuplicadoGuia } from "../service/guias-primer-tramo.responses";

export interface UseValidarDuplicadoArgs {
  id_sucursal: number;
  guia_remitente: string;
  guia_transportista: string;
  sin_guia_transportista: boolean;
  id_excluir?: number | null;
  enabled: boolean;
  debounce_ms?: number;
}

export interface UseValidarDuplicadoResult {
  /** True mientras hay un request en vuelo (post-debounce). */
  validating: boolean;
  /**
   * `true` si hay CUALQUIER conflicto. `false` si no hay ninguno. `null` si
   * aún no se consultó (input vacío, modal cerrado o request abortado).
   */
  existe: boolean | null;
  /** Combinacion exacta (remitente + transportista / sin_transportista) duplicada. */
  existe_combinacion: boolean;
  /** Mismo `guia_remitente` usado por otra guia activa. */
  existe_remitente: boolean;
  /** Mismo `guia_transportista` usado por otra guia activa (no aplica si sinGuia). */
  existe_transportista: boolean;
  /** Mensajes legibles del backend, indexados por tipo de conflicto. */
  messages: RES_ValidarDuplicadoGuia["messages"];
  /** IDs de las guias existentes que generan cada conflicto. */
  id_guia_combinacion: number | null;
  id_guia_remitente: number | null;
  id_guia_transportista: number | null;
}

const EMPTY_MESSAGES: RES_ValidarDuplicadoGuia["messages"] = {};

const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Hook de validación EN VIVO de duplicados para Guías de Primer Tramo.
 *
 * - Dispara `POST /api/guias-primer-tramo/validar-duplicado` con debounce
 *   cuando cambian `guia_remitente` / `guia_transportista` / `sin_guia_transportista`.
 * - Cancela el request en vuelo con AbortController si los inputs vuelven a
 *   cambiar antes de que termine (evita race conditions y resultados viejos).
 * - NO muestra notificaciones en caso de error de red: el submit sigue
 *   contando con la red de seguridad pre-submit ya implementada.
 */
export const useValidarDuplicadoGuiaEnVivo = (
  args: UseValidarDuplicadoArgs,
): UseValidarDuplicadoResult => {
  const {
    id_sucursal,
    guia_remitente: guiaRemitente,
    guia_transportista: guiaTransportista,
    sin_guia_transportista: sinGuiaTransportista,
    id_excluir: idExcluir,
    enabled,
  } = args;
  const debounceMs = args.debounce_ms ?? DEFAULT_DEBOUNCE_MS;

  const [validating, setValidating] = useState(false);
  const [existe, setExiste] = useState<boolean | null>(null);
  const [existeCombinacion, setExisteCombinacion] = useState(false);
  const [existeRemitente, setExisteRemitente] = useState(false);
  const [existeTransportista, setExisteTransportista] = useState(false);
  const [messages, setMessages] = useState<RES_ValidarDuplicadoGuia["messages"]>(EMPTY_MESSAGES);
  const [idGuiaCombinacion, setIdGuiaCombinacion] = useState<number | null>(null);
  const [idGuiaRemitente, setIdGuiaRemitente] = useState<number | null>(null);
  const [idGuiaTransportista, setIdGuiaTransportista] = useState<number | null>(null);

  useEffect(() => {
    // Sin modal abierto o sin guia_remitente -> estado neutro.
    if (!enabled || guiaRemitente.trim() === "") {
      setExiste(null);
      setExisteCombinacion(false);
      setExisteRemitente(false);
      setExisteTransportista(false);
      setMessages(EMPTY_MESSAGES);
      setIdGuiaCombinacion(null);
      setIdGuiaRemitente(null);
      setIdGuiaTransportista(null);
      setValidating(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const ejecutar = async () => {
        setValidating(true);
        try {
          const res = await GuiasPrimerTramoService.validar_duplicado({
            id_sucursal,
            guia_remitente: guiaRemitente.trim(),
            guia_transportista: sinGuiaTransportista
              ? null
              : guiaTransportista.trim() || null,
            sin_guia_transportista: sinGuiaTransportista,
            id_excluir: idExcluir ?? null,
          });
          if (controller.signal.aborted) return;
          setExiste(res.existe);
          setExisteCombinacion(res.existe_combinacion);
          setExisteRemitente(res.existe_remitente);
          setExisteTransportista(res.existe_transportista);
          setMessages(res.messages ?? EMPTY_MESSAGES);
          setIdGuiaCombinacion(res.id_guia_combinacion ?? null);
          setIdGuiaRemitente(res.id_guia_remitente ?? null);
          setIdGuiaTransportista(res.id_guia_transportista ?? null);
        } catch (e) {
          if (controller.signal.aborted) return;
          console.error("Validación en vivo de duplicado de guía falló:", e);
          // No spamear al usuario: el submit mantiene su red de seguridad.
          setExiste(null);
          setExisteCombinacion(false);
          setExisteRemitente(false);
          setExisteTransportista(false);
          setMessages(EMPTY_MESSAGES);
          setIdGuiaCombinacion(null);
          setIdGuiaRemitente(null);
          setIdGuiaTransportista(null);
        } finally {
          if (!controller.signal.aborted) {
            setValidating(false);
          }
        }
      };

      void ejecutar();
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    id_sucursal,
    guiaRemitente,
    guiaTransportista,
    sinGuiaTransportista,
    idExcluir,
    enabled,
    debounceMs,
  ]);

  return {
    validating,
    existe,
    existe_combinacion: existeCombinacion,
    existe_remitente: existeRemitente,
    existe_transportista: existeTransportista,
    messages,
    id_guia_combinacion: idGuiaCombinacion,
    id_guia_remitente: idGuiaRemitente,
    id_guia_transportista: idGuiaTransportista,
  };
};
