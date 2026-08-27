import { Box, TextInput, ActionIcon } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  fechaInicio: string;
  setFechaInicio: (value: string) => void;
  fechaFin: string;
  setFechaFin: (value: string) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
  section: "text-zinc-500 transition-colors",
};

export const FiltrosProgramaciones = ({
  searchQuery,
  onSearchChange,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
}: Props) => {
  return (
    <div className="flex flex-wrap items-end gap-3 animate-fadeIn">
      <Box className="w-44">
        <CustomDatePicker
          label="Fecha Inicio"
          placeholder="Seleccionar"
          value={fechaInicio || null}
          onChange={(val) =>
            setFechaInicio(val ? dayjs(val).format("YYYY-MM-DD") : "")
          }
          classNames={fieldClasses}
        />
      </Box>

      <Box className="w-44">
        <CustomDatePicker
          label="Fecha Fin"
          placeholder="Seleccionar"
          value={fechaFin || null}
          onChange={(val) =>
            setFechaFin(val ? dayjs(val).format("YYYY-MM-DD") : "")
          }
          classNames={fieldClasses}
        />
      </Box>

      <Box className="w-56">
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
      </Box>
    </div>
  );
};
