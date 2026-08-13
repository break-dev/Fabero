import { useEffect, useMemo, useRef } from "react";
import {
  Button,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconRefresh, IconSend2, IconSparkles, IconTrash } from "@tabler/icons-react";
import { useAIChat } from "../../../../hooks/ia/useAIChat";
import { useIAStore } from "../../../../stores/ia.store";

const formatRole = (role: "user" | "assistant" | "system"): string => {
  if (role === "user") return "Tú";
  if (role === "assistant") return "Asistente";
  return "Sistema";
};

export const AIAssistantPanel = () => {
  const panelOpen = useIAStore((s) => s.panelOpen);
  const closePanel = useIAStore((s) => s.closePanel);
  const contextoModulo = useIAStore((s) => s.contextoModulo);
  const clearConversacion = useIAStore((s) => s.clearConversacion);

  const { messages, loading, error, send } = useAIChat({ contextoModulo });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async () => {
    const ta = inputRef.current;
    if (!ta) return;
    const value = ta.value.trim();
    if (value === "" || loading) return;
    ta.value = "";
    await send(value);
  };

  return (
    <Drawer
      opened={panelOpen}
      onClose={closePanel}
      position="right"
      size="md"
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
        content: "bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800",
        header: "bg-zinc-950/95 border-b border-zinc-800",
        title: "text-zinc-100",
        body: "p-0 flex flex-col",
      }}
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
    >
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
                Enter envía. Shift+Enter nueva línea.
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages
                .filter((m) => m.role !== "system")
                .map((m, idx) => {
                  const isUser = m.role === "user";
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
                        {m.content}
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
          <Textarea
            ref={inputRef}
            placeholder="Escribe tu pregunta…"
            radius="lg"
            autosize
            minRows={2}
            maxRows={6}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
            }}
          />
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