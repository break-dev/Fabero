import { TextInput, ActionIcon } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export const FiltrosProgramaciones = ({ searchQuery, onSearchChange }: Props) => {
  return (
    <TextInput
      label="Buscar"
      placeholder="Transportista, vehículo, conductor, guía…"
      radius="lg"
      leftSection={
        <IconSearch
          size={16}
          className={searchQuery ? "text-indigo-400" : "text-zinc-500"}
        />
      }
      rightSection={
        searchQuery ? (
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => onSearchChange("")}
            title="Limpiar"
            className="text-zinc-400 hover:text-white mr-1"
          >
            <IconX size={14} />
          </ActionIcon>
        ) : null
      }
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      classNames={fieldClasses}
    />
  );
};
