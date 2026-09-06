import { Grid, Select, Loader, ActionIcon } from "@mantine/core";
import { IconBuildingFactory, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { DateRangeFilter } from "../../../../presentation/utils/filtro-rango-fechas";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import type { DespachoFiltros } from "../../service/programacion-despachos.requests";

interface Props {
  filtros: DespachoFiltros;
  setFiltros: (f: DespachoFiltros) => void;
  onLimpiar: () => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

interface PlantaItem {
  id: number;
  razon_social: string;
  ruc: string;
}

export const FiltrosDespachos = ({ filtros, setFiltros, onLimpiar }: Props) => {
  const { notifyError } = useNotify();
  const [plantas, setPlantas] = useState<PlantaItem[]>([]);
  const [loadingPlantas, setLoadingPlantas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingPlantas(true);
    AuxService.get_plantas_despachable()
      .then((data) => {
        if (!cancelled) setPlantas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar las plantas destino");
      })
      .finally(() => {
        if (!cancelled) setLoadingPlantas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  const plantasData = plantas.map((p) => ({
    value: String(p.id),
    label: p.ruc ? `${p.razon_social} (${p.ruc})` : p.razon_social,
  }));

  return (
    <Grid gutter="sm" align="end">
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Select
          label="Planta Destino"
          placeholder={loadingPlantas ? "Cargando plantas..." : "Todas las plantas"}
          data={plantasData}
          value={filtros.id_planta_destino ? String(filtros.id_planta_destino) : null}
          onChange={(val) =>
            setFiltros({ ...filtros, id_planta_destino: val ? Number(val) : undefined })
          }
          leftSection={<IconBuildingFactory className="w-4 h-4 text-zinc-500" />}
          clearable
          searchable
          radius="lg"
          disabled={loadingPlantas}
          rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
          classNames={fieldClasses}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <DateRangeFilter
          fechaInicio={filtros.fecha_inicio ?? null}
          fechaFin={filtros.fecha_fin ?? null}
          onFechaInicioChange={(v) => setFiltros({ ...filtros, fecha_inicio: v })}
          onFechaFinChange={(v) => setFiltros({ ...filtros, fecha_fin: v })}
          showClearButton={false}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 1 }}>
        <div className="flex justify-end">
          <ActionIcon
            type="button"
            variant="light"
            color="zinc"
            radius="xl"
            size="lg"
            onClick={onLimpiar}
            title="Limpiar todos los filtros"
            className="bg-zinc-800! hover:bg-zinc-700! text-zinc-300! border-zinc-700!"
          >
            <IconX size={16} />
          </ActionIcon>
        </div>
      </Grid.Col>
    </Grid>
  );
};