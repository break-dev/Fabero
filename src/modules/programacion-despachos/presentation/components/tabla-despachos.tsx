import { Text, Badge, Group, ActionIcon, Tooltip } from "@mantine/core";
import type { ReactNode } from "react";
import { IconPlus, IconBan } from "@tabler/icons-react";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import type {
  DespachoListItem,
} from "../../service/programacion-despachos.responses";

interface Props {
  despachos: DespachoListItem[];
  loading: boolean;
  onRowClick?: (record: DespachoListItem) => void;
  renderExpandedRow?: (record: DespachoListItem) => ReactNode;
  onAgregarDistribucion: (idDespacho: number) => void;
  onAnularDespacho: (idDespacho: number) => void;
  togglingIds: Record<number, boolean>;
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

export const TablaDespachos = ({
  despachos,
  loading,
  onRowClick,
  renderExpandedRow,
  onAgregarDistribucion,
  onAnularDespacho,
  togglingIds,
}: Props) => {
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
          textAlign: "center",
          render: (r: DespachoListItem) => (
            <span className="inline-flex items-center justify-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider font-mono">
              {r.correlativo}
            </span>
          ),
        },
        {
          accessor: "planta_destino_razon_social",
          title: "Planta Destino",
          width: 240,
          textAlign: "center",
          render: (r: DespachoListItem) => (
            <div className="flex flex-col items-center gap-0.5 w-full text-center">
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
          width: 170,
          textAlign: "center",
          render: (r: DespachoListItem) => {
            const tomado = r.peso_total_tomado ?? 0;
            const pendiente = r.peso_total_pendiente ?? 0;
            const distribuido = Math.max(tomado - pendiente, 0);
            return (
              <div className="flex flex-col items-center gap-0.5 w-full text-center font-mono">
                <Text size="sm" className="text-zinc-200" fw={600}>
                  {tomado.toFixed(3)} KG
                </Text>
                <Text size="11px" className="text-zinc-500">
                  Pendiente: <span className="text-amber-400">{pendiente.toFixed(3)} KG</span>
                </Text>
                <Text size="11px" className="text-emerald-400">
                  Distribuido: {distribuido.toFixed(3)} KG
                </Text>
              </div>
            );
          },
        },
        {
          accessor: "total_distribuciones",
          title: "Distribuciones",
          width: 130,
          textAlign: "center",
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
          textAlign: "center",
          render: (r: DespachoListItem) => (
            <div className="flex flex-col items-center gap-0.5 w-full text-center">
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
          width: 110,
          textAlign: "center",
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
        {
          accessor: "acciones",
          title: "Acciones",
          width: 130,
          textAlign: "center",
          render: (r: DespachoListItem) => (
            <Group gap={6} justify="center" wrap="nowrap">
              <Tooltip label="Anular despacho" withArrow>
                <ActionIcon
                  variant="light"
                  color="red"
                  radius="lg"
                  size="md"
                  disabled={r.es_anulado || (r.total_distribuciones ?? 0) === 0}
                  loading={!!togglingIds[r.id]}
                  onClick={() => onAnularDespacho(r.id)}
                >
                  <IconBan size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Agregar distribución" withArrow>
                <ActionIcon
                  variant="light"
                  color="indigo"
                  radius="lg"
                  size="md"
                  disabled={r.es_anulado || (r.peso_total_pendiente ?? 0) <= 0}
                  onClick={() => onAgregarDistribucion(r.id)}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ),
        },
      ]}
    />
  );
};