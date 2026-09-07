import { ActionIcon, Group } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { CustomDatePicker } from "./date-picker-input";
import { formatLocalDate } from "./local-date";

/**
 * Helper para fecha de inicio por defecto: `daysBack` días antes de hoy (default 7).
 */
export const defaultFechaInicio = (daysBack = 7): string =>
  formatLocalDate(dayjs().subtract(daysBack, "day").toDate());

/**
 * Helper para fecha de fin por defecto: hoy.
 */
export const defaultFechaFin = (): string => formatLocalDate(new Date());

/**
 * Estilo por defecto del filtro de rango de fechas, alineado con
 * `programacion-despachos/components/filtros-despachos.tsx`.
 * Puede ser sobreescrito por el caller mediante la prop `classNames`.
 */
const DEFAULT_CLASSES = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export interface DateRangeFilterProps {
  fechaInicio: string | null;
  fechaFin: string | null;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  defaultDaysBack?: number;
  classNames?: Record<string, string>;
  showClearButton?: boolean;
}

export const DateRangeFilter = ({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  defaultDaysBack,
  classNames,
  showClearButton = true,
}: DateRangeFilterProps) => {
  const effectiveInicio =
    fechaInicio || (defaultDaysBack !== undefined ? defaultFechaInicio(defaultDaysBack) : defaultFechaInicio());
  const effectiveFin = fechaFin || defaultFechaFin();
  const hasActiveFilters = Boolean(fechaInicio) || Boolean(fechaFin);

  const handleClear = () => {
    onFechaInicioChange("");
    onFechaFinChange("");
  };

  const toDate = (s: string | null | undefined): Date | null =>
    s ? dayjs(s).toDate() : null;

  const mergedClasses = {
    input: classNames?.input ?? DEFAULT_CLASSES.input,
    label: classNames?.label ?? DEFAULT_CLASSES.label,
  };

  return (
    <Group gap="xs" align="end" wrap="nowrap">
      <div className="flex-1 min-w-[110px]">
        <CustomDatePicker
          label="Fecha Inicio"
          placeholder="Fecha inicio"
          value={toDate(effectiveInicio)}
          onChange={(val) => onFechaInicioChange(val ? dayjs(val).format("YYYY-MM-DD") : "")}
          radius="lg"
          size="sm"
          clearable
          classNames={mergedClasses}
        />
      </div>
      <div className="flex-1 min-w-[110px]">
        <CustomDatePicker
          label="Fecha Fin"
          placeholder="Fecha fin"
          value={toDate(effectiveFin)}
          onChange={(val) => onFechaFinChange(val ? dayjs(val).format("YYYY-MM-DD") : "")}
          radius="lg"
          size="sm"
          clearable
          classNames={mergedClasses}
        />
      </div>
      {showClearButton && hasActiveFilters && (
        <ActionIcon
          type="button"
          variant="light"
          color="zinc"
          radius="xl"
          size="md"
          onClick={handleClear}
          title="Limpiar rango de fechas"
          className="bg-zinc-800! hover:bg-zinc-700! text-zinc-300! border-zinc-700!"
        >
          <IconX size={16} />
        </ActionIcon>
      )}
    </Group>
  );
};