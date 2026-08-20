import { Text, Badge } from "@mantine/core";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import type { ProgramacionListItem } from "../../service/programar-recepcion.responses";

interface Props {
  programaciones: ProgramacionListItem[];
  loading: boolean;
}

const formatFecha = (fechaStr: string | null | undefined) => {
  if (!fechaStr) return "—";
  try {
    const date = new Date(fechaStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return fechaStr;

    const pad = (num: number) => num.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return fechaStr;
  }
};

export const TablaProgramaciones = ({ programaciones, loading }: Props) => {
  return (
    <DataTableEstandar
      idAccessor="id"
      records={programaciones}
      loading={loading}
      columns={[
        {
          accessor: "fecha_estimada_llegada",
          title: "Fecha Estimada",
          width: 180,
          render: (r: ProgramacionListItem) => (
            <div>
              <Text size="sm" className="text-zinc-200" fw={500}>
                {formatFecha(r.fecha_estimada_llegada)}
              </Text>
              <Text size="xs" className="text-zinc-500">
                Autorizó: {r.empleado_autoriza_nombre ?? "—"}
              </Text>
            </div>
          ),
        },
        {
          accessor: "empresa_transporte_razon_social",
          title: "Transportista",
          width: 220,
          render: (r: ProgramacionListItem) => (
            <Text
              size="sm"
              className="text-zinc-200"
              truncate
              title={r.empresa_transporte_razon_social}
            >
              {r.empresa_transporte_razon_social}
            </Text>
          ),
        },
        {
          accessor: "vehiculo_placa",
          title: "Vehículo",
          width: 160,
          render: (r: ProgramacionListItem) => {
            if (!r.vehiculo_placa) {
              return (
                <Text size="xs" className="text-zinc-500 italic">
                  (sin asignar)
                </Text>
              );
            }
            return (
              <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                {r.vehiculo_placa}
              </div>
            );
          },
        },
        {
          accessor: "conductor_nombre_completo",
          title: "Conductor",
          width: 200,
          render: (r: ProgramacionListItem) => (
            <Text size="sm" className="text-zinc-200" fw={500}>
              {r.conductor_nombre_completo ?? "—"}
            </Text>
          ),
        },
        {
          accessor: "proveedor_razon_social",
          title: "Proveedor",
          width: 200,
          render: (r: ProgramacionListItem) => (
            <Text
              size="sm"
              className="text-zinc-200"
              truncate
              title={r.proveedor_razon_social ?? ""}
            >
              {r.proveedor_razon_social ?? "—"}
            </Text>
          ),
        },
        {
          accessor: "guia_remitente",
          title: "Guías",
          width: 200,
          render: (r: ProgramacionListItem) => (
            <div>
              <Text size="xs" className="text-zinc-300">
                Remitente: <strong className="text-indigo-400">{r.guia_remitente ?? "—"}</strong>
              </Text>
              <Text size="xs" className="text-zinc-500">
                Transportista: {r.guia_transportista ?? "—"}
              </Text>
            </div>
          ),
        },
        {
          accessor: "estado",
          title: "Estado",
          width: 130,
          render: (r: ProgramacionListItem) =>
            r.id_empleado_recepcion ? (
              <Badge color="indigo" variant="light" radius="md" size="sm">
                Confirmada
              </Badge>
            ) : (
              <Badge color="yellow" variant="light" radius="md" size="sm">
                Pendiente
              </Badge>
            ),
        },
      ]}
    />
  );
};
