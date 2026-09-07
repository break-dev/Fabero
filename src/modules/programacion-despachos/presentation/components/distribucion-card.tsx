import { Text, Badge, Group, ActionIcon, Tooltip, Divider } from "@mantine/core";
import { IconHistory, IconScale } from "@tabler/icons-react";
import { EstadoDistribucion } from "../../../../shared/enums/programacion-despachos/estado-distribucion";
import { EstadoPesaje } from "../../../../shared/enums/_generic/estado-pesaje";
import type { DistribucionItem } from "../../service/programacion-despachos.responses";

interface Props {
  distribucion: DistribucionItem;
  onVerLog: (dist: DistribucionItem) => void;
}

const formatFecha = (f: string | null | undefined) => {
  if (!f) return "—";
  try {
    const d = new Date(f.replace(" ", "T"));
    if (isNaN(d.getTime())) return f;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return f;
  }
};

const estadoDistribucionBadge = (estado: string) => {
  switch (estado) {
    case EstadoDistribucion.EnEspera:
      return <Badge color="yellow" variant="filled" radius="md" size="sm">En Espera</Badge>;
    case EstadoDistribucion.EnPlanta:
      return <Badge color="teal" variant="filled" radius="md" size="sm">En Planta</Badge>;
    case EstadoDistribucion.SalioDePlanta:
      return <Badge color="blue" variant="filled" radius="md" size="sm">Salió de Planta</Badge>;
    case EstadoDistribucion.LlegoAlCliente:
      return <Badge color="green" variant="filled" radius="md" size="sm">Llegó al Cliente</Badge>;
    default:
      return <Badge color="gray" variant="filled" radius="md" size="sm">{estado}</Badge>;
  }
};

const estadoPesajeBadge = (estado: string | null) => {
  if (!estado) {
    return (
      <Badge color="gray" variant="outline" radius="md" size="sm">
        Sin Pesar
      </Badge>
    );
  }
  switch (estado) {
    case EstadoPesaje.SinPesar:
      return (
        <Badge color="zinc" variant="outline" radius="md" size="sm">
          Sin Pesar
        </Badge>
      );
    case EstadoPesaje.EnProceso:
      return (
        <Badge color="yellow" variant="filled" radius="md" size="sm">
          En Proceso
        </Badge>
      );
    case EstadoPesaje.Pesado:
      return (
        <Badge color="emerald" variant="filled" radius="md" size="sm">
          Pesado
        </Badge>
      );
    default:
      return (
        <Badge color="gray" variant="outline" radius="md" size="sm">
          {estado}
        </Badge>
      );
  }
};

export const DistribucionCard = ({ distribucion, onVerLog }: Props) => {
  const totalPeso = distribucion.detalles.reduce(
    (acc, d) => acc + (d.peso_tomado ?? 0),
    0
  );
  const itemsCount = distribucion.detalles.length;

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 bg-zinc-900/60 border-b border-zinc-800/70">
        <div className="flex items-center gap-2 shrink-0">
          <IconScale size={16} className="text-indigo-400" />
          {estadoDistribucionBadge(distribucion.estado)}
        </div>
        <Divider orientation="vertical" className="hidden md:block" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Sucursal
            </Text>
            <Text size="xs" fw={600} className="text-zinc-200">
              {distribucion.sucursal_nombre ?? "—"}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Transp.
            </Text>
            <Text size="xs" fw={600} className="text-zinc-200">
              {distribucion.empresa_transporte_razon_social}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Veh
            </Text>
            <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono text-[11px]">
              {distribucion.vehiculo_placa}
            </span>
            {distribucion.vehiculo_carreta_placa && (
              <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono text-[11px] ml-1">
                + {distribucion.vehiculo_carreta_placa}
              </span>
            )}
            <Divider orientation="vertical" className="hidden md:block" />
            {estadoPesajeBadge(distribucion.recepcion_estado_pesaje)}
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Cond.
            </Text>
            <Text size="xs" fw={600} className="text-zinc-200">
              {distribucion.conductor_nombre_completo ?? "—"}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              F. est.
            </Text>
            <Text size="xs" fw={600} className="text-zinc-200">
              {formatFecha(distribucion.fecha_estimada_llegada)}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Total
            </Text>
            <Text size="xs" fw={700} className="text-indigo-400 font-mono">
              {totalPeso.toFixed(3)} KG
            </Text>
          </div>
        </div>
        <Tooltip label="Ver historial" withArrow>
          <ActionIcon
            type="button"
            color="zinc"
            variant="light"
            radius="xl"
            size="sm"
            onClick={() => onVerLog(distribucion)}
            className="bg-zinc-500/10! hover:bg-zinc-500/20! text-zinc-300! border-zinc-500/20! shrink-0"
          >
            <IconHistory size={14} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Items */}
      {itemsCount > 0 && (
        <div className="overflow-hidden">
          <div
            className="grid items-center gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/40 font-bold border-b border-zinc-800/60"
            style={{ gridTemplateColumns: "2fr 80px 2fr 120px" }}
          >
            <span className="text-center">Item</span>
            <span className="text-center">Parte</span>
            <span className="text-center">Proveedor</span>
            <span className="text-center">Peso (KG)</span>
          </div>
          {distribucion.detalles.map((det) => {
            const esLote = det.lote_correlativo !== null;
            const correlativo =
              det.lote_correlativo ??
              det.blending_correlativo ??
              "—";
            return (
              <div
                key={det.id}
                className="grid items-center gap-4 px-4 py-2 text-xs border-t border-zinc-800/60 hover:bg-zinc-900/30 transition-colors"
                style={{ gridTemplateColumns: "2fr 80px 2fr 120px" }}
              >
                <Group gap={6} wrap="nowrap" className="min-w-0 justify-center">
                  <Badge
                    color={esLote ? "yellow" : "gray"}
                    variant="filled"
                    size="xs"
                    fw={700}
                    radius="md"
                  >
                    {esLote ? "LOTE" : "BLEND"}
                  </Badge>
                  <Text size="xs" c="white" className="font-mono truncate">
                    {correlativo}
                  </Text>
                </Group>
                <Text size="xs" className="text-zinc-400 font-mono text-center">
                  {det.numero_particion !== null ? `P${det.numero_particion}` : "—"}
                </Text>
                <Text size="xs" c="dimmed" className="truncate text-center">
                  {det.proveedor_razon_social ?? "—"}
                </Text>
                <Text size="xs" className="text-zinc-200 font-mono tabular-nums text-center">
                  {(det.peso_tomado ?? 0).toFixed(3)}
                </Text>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
