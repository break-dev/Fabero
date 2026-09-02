import { Box, TextInput, ActionIcon, Select } from "@mantine/core";
import { IconSearch, IconX, IconFilter } from "@tabler/icons-react";
import { DateRangeFilter } from "../../../../presentation/utils/filtro-rango-fechas";

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  estadoConfirmacion: "todos" | "pendientes" | "confirmadas";
  setEstadoConfirmacion: (value: "todos" | "pendientes" | "confirmadas") => void;
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
  estadoConfirmacion,
  setEstadoConfirmacion,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
}: Props) => {
  return (
    <div className="flex flex-wrap items-end gap-3 animate-fadeIn">
      <Box className="w-44">
        <Select
          label="Estado"
          data={[
            { value: "todos", label: "Todas" },
            { value: "pendientes", label: "Sin confirmar" },
            { value: "confirmadas", label: "Confirmadas" },
          ]}
          value={estadoConfirmacion}
          onChange={(val) =>
            setEstadoConfirmacion((val as "todos" | "pendientes" | "confirmadas") || "todos")
          }
          leftSection={<IconFilter size={14} className="text-zinc-500" />}
          radius="lg"
          classNames={fieldClasses}
        />
      </Box>

      <DateRangeFilter
        fechaInicio={fechaInicio || null}
        fechaFin={fechaFin || null}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        classNames={fieldClasses}
        showClearButton={false}
      />

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
