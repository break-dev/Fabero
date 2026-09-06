import { Grid } from "@mantine/core";
import type { RecepcionVisitaFilters } from "../../service/recepcion-visitas.requests";
import { DateRangeFilter } from "../../../../presentation/utils/filtro-rango-fechas";

interface Props {
  filters: RecepcionVisitaFilters;
  handleFilterChange: <K extends keyof RecepcionVisitaFilters>(key: K, value: RecepcionVisitaFilters[K]) => void;
}

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
          />
        </Grid.Col>
      </Grid>
    </div>
  );
};