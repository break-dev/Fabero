import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Text,
  Textarea,
  Tooltip,
  Title,
} from "@mantine/core";
import {
  IconFile,
  IconGripVertical,
  IconPaperclip,
  IconRefresh,
  IconSend2,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useAIChat } from "../../../../hooks/ia/useAIChat";
import { useIAStore } from "../../../../stores/ia.store";
import { useNotify } from "../../../../hooks/useNotify";
import { Markdown } from "./markdown";
import type { IAIAttachmentMeta } from "../../../../service/ia/ia.types";

const DEFAULT_DRAWER_WIDTH = 480;
const MIN_DRAWER_WIDTH = 320;
const MAX_DRAWER_WIDTH = 960;
const LS_WIDTH_KEY = "fabero-ia-drawer-width";

const formatRole = (role: "user" | "assistant" | "system"): string => {
  if (role === "user") return "Tú";
  if (role === "assistant") return "Asistente";
  return "Sistema";
};

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "text/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/json",
  "application/csv",
]);

const isAllowedMime = (mime: string): boolean => {
  if (!mime) return false;
  if (ALLOWED_MIME_EXACT.has(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FileChip = ({
  meta,
  onRemove,
  variant = "pending",
}: {
  meta: IAIAttachmentMeta;
  onRemove?: () => void;
  variant?: "pending" | "sent";
}) => {
  const isPending = variant === "pending";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${
        isPending
          ? "bg-zinc-900/80 border-zinc-700 text-zinc-200"
          : "bg-indigo-700/30 border-indigo-500/40 text-white"
      }`}
    >
      <IconFile size={14} className={isPending ? "text-violet-300" : "text-indigo-200"} />
      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium max-w-[180px]">{meta.name}</span>
        <span className="text-[10px] opacity-70 font-mono">
          {formatBytes(meta.size)}
        </span>
      </div>
      {onRemove && (
        <ActionIcon
          type="button"
          variant="subtle"
          color="gray"
          size="xs"
          radius="xl"
          onClick={onRemove}
          aria-label={`Quitar ${meta.name}`}
          className="text-zinc-400 hover:text-white"
        >
          <IconX size={12} />
        </ActionIcon>
      )}
    </div>
  );
};

export const AIAssistantPanel = () => {
  const panelOpen = useIAStore((s) => s.panelOpen);
  const closePanel = useIAStore((s) => s.closePanel);
  const contextoModulo = useIAStore((s) => s.contextoModulo);
  const clearConversacion = useIAStore((s) => s.clearConversacion);

  const { messages, loading, error, send } = useAIChat({ contextoModulo });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_DRAWER_WIDTH;
    const raw = window.localStorage.getItem(LS_WIDTH_KEY);
    if (!raw) return DEFAULT_DRAWER_WIDTH;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_DRAWER_WIDTH;
    return Math.max(MIN_DRAWER_WIDTH, Math.min(MAX_DRAWER_WIDTH, parsed));
  });
  const resizeStateRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

  const { notifyError } = useNotify();

  const titulo = useMemo(
    () => contextoModulo?.titulo ?? "Asistente IA",
    [contextoModulo?.titulo],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, loading]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (file.size > MAX_BYTES) {
        notifyError(`El archivo "${file.name}" supera el límite de 8 MB.`);
        continue;
      }
      if (!isAllowedMime(file.type)) {
        notifyError(
          `El archivo "${file.name}" no es un formato soportado (imágenes, PDF, texto, CSV o JSON).`,
        );
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length > 0) {
      setAdjuntos((prev) => [...prev, ...accepted].slice(0, 10));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAdjunto = (index: number) => {
    setAdjuntos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const ta = inputRef.current;
    if (!ta) return;
    const value = ta.value.trim();
    if ((value === "" && adjuntos.length === 0) || loading) return;
    ta.value = "";
    const archivosToSend = adjuntos;
    setAdjuntos([]);
    await send(value, archivosToSend);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      handleFilesSelected(files);
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    resizeStateRef.current = {
      startX: e.clientX,
      startWidth: drawerWidth,
    };
    const handleMove = (ev: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const delta = state.startX - ev.clientX;
      const next = Math.max(
        MIN_DRAWER_WIDTH,
        Math.min(MAX_DRAWER_WIDTH, state.startWidth + delta),
      );
      setDrawerWidth(next);
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const finalWidth = resizeStateRef.current
        ? Math.max(
            MIN_DRAWER_WIDTH,
            Math.min(
              MAX_DRAWER_WIDTH,
              resizeStateRef.current.startWidth +
                (resizeStateRef.current.startX -
                  (resizeStateRef.current as { startX: number }).startX),
            ),
          )
        : null;
      resizeStateRef.current = null;
      if (finalWidth !== null && typeof window !== "undefined") {
        window.localStorage.setItem(LS_WIDTH_KEY, String(finalWidth));
      }
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_WIDTH_KEY, String(drawerWidth));
  }, [drawerWidth]);

  return (
    <Drawer
      opened={panelOpen}
      onClose={closePanel}
      position="right"
      size={drawerWidth}
      withCloseButton
      title={
        <Group gap="xs">
          <IconSparkles size={18} className="text-violet-300" />
          <Title order={5} className="text-zinc-100">
            {titulo}
          </Title>
        </Group>
      }
      classNames={{
        content:
          "bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 relative",
        header: "bg-zinc-950/95 border-b border-zinc-800",
        title: "text-zinc-100",
        body: "p-0 flex flex-col",
      }}
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
    >
      <div
        role="separator"
        aria-label="Redimensionar panel"
        aria-orientation="vertical"
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-30 group/resize"
      >
        <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800 group-hover/resize:bg-violet-500/60 transition-colors" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/resize:opacity-100 transition-opacity">
          <div className="bg-zinc-900 border border-zinc-700 rounded-md p-0.5 text-zinc-400">
            <IconGripVertical size={12} />
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
          <Text size="xs" c="zinc.5" fs="italic">
            {contextoModulo
              ? "El asistente conoce el contexto del módulo activo."
              : "Sin contexto de módulo. Tus respuestas serán genéricas."}
          </Text>
          <Button
            type="button"
            variant="subtle"
            color="gray"
            size="xs"
            radius="lg"
            leftSection={<IconTrash size={14} />}
            onClick={clearConversacion}
            disabled={messages.length === 0}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Limpiar
          </Button>
        </div>

        <ScrollArea
          viewportRef={scrollRef}
          className="flex-1 px-4 py-3"
          type="auto"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-zinc-500">
              <IconSparkles size={32} className="text-violet-400/70" />
              <Text size="sm" fw={600} className="text-zinc-400">
                {`Pregúntale lo que quieras sobre ${titulo}.`}
              </Text>
              <Text size="xs" c="zinc.6">
                Enter envía. Shift+Enter nueva línea. Pega archivos con Ctrl/Cmd + V.
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages
                .filter((m) => m.role !== "system")
                .map((m, idx) => {
                  const isUser = m.role === "user";
                  const adjuntosMeta = m.attachmentMeta ?? [];
                  return (
                    <div
                      key={`${m.role}-${idx}`}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-md ${
                          isUser
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-900/80 border border-zinc-800 text-zinc-200"
                        }`}
                      >
                        <Text
                          size="xs"
                          fw={800}
                          className={`uppercase tracking-widest mb-1 ${
                            isUser ? "text-indigo-100" : "text-violet-300"
                          }`}
                        >
                          {formatRole(m.role)}
                        </Text>
                        {isUser ? (
                          <>
                            {m.content !== "" && (
                              <span className="whitespace-pre-wrap break-words">
                                {m.content}
                              </span>
                            )}
                            {adjuntosMeta.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {adjuntosMeta.map((meta, i) => (
                                  <FileChip
                                    key={`${meta.name}-${i}`}
                                    meta={meta}
                                    variant="sent"
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Markdown content={m.content} />
                        )}
                      </div>
                    </div>
                  );
                })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl px-3 py-2 flex items-center gap-2 text-zinc-300">
                    <Loader size={14} color="violet" />
                    <Text size="sm">Pensando…</Text>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {error && (
          <div className="px-4 py-2 border-t border-red-900/40 bg-red-950/30">
            <Text size="xs" c="red.3">
              {error}
            </Text>
          </div>
        )}

        <div className="border-t border-zinc-800 p-3 flex flex-col gap-2">
          {adjuntos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {adjuntos.map((file, i) => (
                <FileChip
                  key={`${file.name}-${i}`}
                  meta={{ name: file.name, mime: file.type, size: file.size }}
                  variant="pending"
                  onRemove={() => handleRemoveAdjunto(i)}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={inputRef}
              placeholder="Escribe tu pregunta…"
              radius="lg"
              autosize
              minRows={2}
              maxRows={6}
              disabled={loading}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all pr-12",
              }}
            />
            <Tooltip
              label="Adjuntar archivo (imagen, PDF, texto, CSV o JSON, máx 8 MB)"
              withArrow
              position="top"
            >
              <ActionIcon
                type="button"
                variant="subtle"
                color="violet"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label="Adjuntar archivo"
                className="absolute bottom-1.5 right-1.5 text-zinc-400 hover:text-violet-300 hover:bg-zinc-800"
              >
                <IconPaperclip size={18} />
              </ActionIcon>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,text/*,text/csv,application/json"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="subtle"
              size="xs"
              color="gray"
              leftSection={<IconRefresh size={14} />}
              onClick={clearConversacion}
              disabled={messages.length === 0 || loading}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Nueva conversación
            </Button>
            <Button
              type="button"
              size="xs"
              radius="lg"
              leftSection={<IconSend2 size={14} />}
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-900/30"
            >
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};