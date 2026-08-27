import { IconSearch, IconCalendar, IconTruck, IconX } from "@tabler/icons-react";
import { TextInput, Select, Grid, ActionIcon } from "@mantine/core";
import type { RecepcionFilters } from "../../service/recepcion-unidades.requests";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";

interface Props {
  filters: RecepcionFilters;
  handleFilterChange: <K extends keyof RecepcionFilters>(key: K, value: RecepcionFilters[K]) => void;
  handleSearch?: () => void;
  empresas: RES_EmpresaTransporte[];
  onClearTextFilter: (key: "placa") => void;
}

export const Filtros = ({
  filters,
  handleFilterChange,
  empresas,
  onClearTextFilter,
}: Props) => {
  const getEmpresasData = () => {
    return empresas.map((e) => ({
      value: String(e.id_empresa_transporte),
      label: e.razon_social,
    }));
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
    section: "text-zinc-500 transition-colors",
  };

  return (
    <div className="animate-fadeIn w-full">
      <Grid gutter="md">
        {/* Fecha Inicio */}
        <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
          <TextInput
            type="date"
            label="Fecha Inicio"
            radius="lg"
            leftSection={<IconCalendar size={16} className={filters.fecha_inicio ? "text-indigo-400" : "text-zinc-500"} />}
            value={filters.fecha_inicio || ""}
            onChange={(e) => handleFilterChange("fecha_inicio", e.target.value)}
            classNames={fieldClasses}
            style={{ colorScheme: "dark" }}
          />
        </Grid.Col>

        {/* Fecha Fin */}
        <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
          <TextInput
            type="date"
            label="Fecha Fin"
            radius="lg"
            leftSection={<IconCalendar size={16} className={filters.fecha_fin ? "text-indigo-400" : "text-zinc-500"} />}
            value={filters.fecha_fin || ""}
            onChange={(e) => handleFilterChange("fecha_fin", e.target.value)}
            classNames={fieldClasses}
            style={{ colorScheme: "dark" }}
          />
        </Grid.Col>

        {/* Placa */}
        <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
          <TextInput
            label="Placa"
            placeholder="Ej: ABC-123"
            maxLength={8}
            radius="lg"
            leftSection={<IconSearch size={16} className={filters.placa ? "text-indigo-400" : "text-zinc-500"} />}
            value={filters.placa || ""}
            onChange={(e) => {
              const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              const formatted = raw.length <= 3 ? raw : `${raw.slice(0, 3)}-${raw.slice(3, 7)}`;
              handleFilterChange("placa", formatted);
              if (formatted === "") {
                onClearTextFilter("placa");
              }
            }}
            rightSection={
              filters.placa ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => onClearTextFilter("placa")}
                  title="Limpiar"
                  className="text-zinc-400 hover:text-white mr-1"
                >
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
            classNames={fieldClasses}
          />
        </Grid.Col>

        {/* Transportista */}
        <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
          <Select
            label="Transportista"
            placeholder="Seleccione"
            searchable
            clearable
            radius="lg"
            leftSection={<IconTruck size={16} className={filters.id_empresa_transporte ? "text-indigo-400" : "text-zinc-500"} />}
            data={getEmpresasData()}
            value={filters.id_empresa_transporte ? String(filters.id_empresa_transporte) : null}
            onChange={(val) => handleFilterChange("id_empresa_transporte", val ? Number(val) : undefined)}
            comboboxProps={{
              transitionProps: { transition: "pop-top-left", duration: 150 },
              dropdownPadding: 6,
              shadow: "md",
            }}
            classNames={{
              ...fieldClasses,
              dropdown: "bg-zinc-950 border-zinc-800 text-white rounded-lg shadow-2xl",
              option: "hover:bg-zinc-900 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors py-2 px-3 data-[selected]:bg-indigo-600 data-[selected]:text-white",
            }}
          />
        </Grid.Col>

        </Grid>
    </div>
  );
};
