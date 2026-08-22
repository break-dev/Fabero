import { Text, Badge } from "@mantine/core";
import type { ReactNode } from "react";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import type {
  DespachoListItem,
} from "../../service/programacion-despachos.responses";

interface Props {
  despachos: DespachoListItem[];
  loading: boolean;
  onRowClick?: (record: DespachoListItem) => void;
  renderExpandedRow?: (record: DespachoListItem) => ReactNode;
}

const formatFecha = (fechaStr: string | null | undefined) => {
  if (!fechaStr) return "—";
  try {
    const date = new Date(fechaStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return fechaStr;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return fechaStr;
  }
};

export const TablaDespachos = ({ despachos, loading, onRowClick, renderExpandedRow }: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={despachos}
      loading={loading}
      onRowClick={onRowClick ? ((record: DespachoListItem) => onRowClick(record)) : undefined}
      renderExpandedRow={renderExpandedRow}
      columns={[
        {
          accessor: "correlativo",
          title: "Correlativo",
          width: 160,
          render: (r: DespachoListItem) => (
            <div className="inline-flex items-center justify-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider font-mono">
              {r.correlativo}
            </div>
          ),
        },
        {
          accessor: "planta_destino_razon_social",
          title: "Planta Destino",
          width: 240,
          render: (r: DespachoListItem) => (
            <div>
              <Text size="sm" className="text-zinc-200" fw={500}>
                {r.planta_destino_razon_social}
              </Text>
              <Text size="xs" className="text-zinc-500">
                {r.planta_destino_ruc}
              </Text>
            </div>
          ),
        },
        {
          accessor: "peso_total_tomado",
          title: "Peso Total",
          width: 130,
          render: (r: DespachoListItem) => (
            <div className="text-right">
              <Text size="sm" className="text-zinc-200 font-mono" fw={600}>
                {(r.peso_total_tomado ?? 0).toFixed(3)} TN
              </Text>
              <Text size="11px" className="text-zinc-500">
                Pendiente: {(r.peso_total_pendiente ?? 0).toFixed(3)} TN
              </Text>
            </div>
          ),
        },
        {
          accessor: "total_distribuciones",
          title: "Distribuciones",
          width: 130,
          render: (r: DespachoListItem) => (
            <Badge color="indigo" variant="light" radius="md" size="sm">
              {r.total_distribuciones ?? 0}
            </Badge>
          ),
        },
        {
          accessor: "created_at",
          title: "Registrado",
          width: 170,
          render: (r: DespachoListItem) => (
            <div>
              <Text size="xs" className="text-zinc-300" fw={500}>
                {formatFecha(r.created_at)}
              </Text>
              <Text size="11px" className="text-zinc-500">
                {r.empleado_registro_nombre ?? "—"}
              </Text>
            </div>
          ),
        },
        {
          accessor: "es_anulado",
          title: "Estado",
          width: 130,
          render: (r: DespachoListItem) =>
            r.es_anulado ? (
              <Badge color="red" variant="light" radius="md" size="sm">
                Anulado
              </Badge>
            ) : (
              <Badge color="indigo" variant="light" radius="md" size="sm">
                Activo
              </Badge>
            ),
        },
      ]}
    />
  );
};