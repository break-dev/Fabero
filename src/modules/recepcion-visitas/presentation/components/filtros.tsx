import { Grid } from "@mantine/core";
import type { RecepcionVisitaFilters } from "../../service/recepcion-visitas.requests";
import { DateRangeFilter } from "../../../../presentation/utils/filtro-rango-fechas";

interface Props {
  filters: RecepcionVisitaFilters;
  handleFilterChange: <K extends keyof RecepcionVisitaFilters>(key: K, value: RecepcionVisitaFilters[K]) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all h-[38px]",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
  section: "text-zinc-500 transition-colors",
};

export const Filtros = ({
  filters,
  handleFilterChange,
}: Props) => {
  return (
    <div className="animate-fadeIn w-full">
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <DateRangeFilter
            fechaInicio={filters.fecha_inicio ?? null}
            fechaFin={filters.fecha_fin ?? null}
            onFechaInicioChange={(v) => handleFilterChange("fecha_inicio", v || undefined)}
            onFechaFinChange={(v) => handleFilterChange("fecha_fin", v || undefined)}
            classNames={fieldClasses}
          />
        </Grid.Col>
      </Grid>
    </div>
  );
};