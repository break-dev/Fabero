import { ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export const RefreshButton = ({
  onClick,
  loading,
  disabled,
  label = "Recargar",
}: RefreshButtonProps) => (
  <Tooltip label={label} withArrow>
    <ActionIcon
      variant="light"
      color="zinc"
      radius="xl"
      size="lg"
      onClick={onClick}
      loading={loading}
      disabled={disabled || loading}
      aria-label={label}
      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
    >
      <IconRefresh size={18} stroke={1.8} />
    </ActionIcon>
  </Tooltip>
);
