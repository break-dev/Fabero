import { ActionIcon, Tooltip } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useIAStore } from "../../../../stores/ia.store";

export const HeaderAIAssistant = () => {
  const togglePanel = useIAStore((s) => s.togglePanel);

  return (
    <Tooltip label="Asistente IA" withArrow position="bottom">
      <ActionIcon
        variant="subtle"
        color="violet"
        radius="xl"
        size="md"
        onClick={togglePanel}
        aria-label="Abrir asistente IA"
        className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/10 transition-all"
      >
        <IconSparkles size={18} />
      </ActionIcon>
    </Tooltip>
  );
};