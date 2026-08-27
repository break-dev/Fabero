import { Text, Badge, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";
import { EstadoDistribucion } from "../../../../shared/enums/programacion-despachos/estado-distribucion";
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

const estadoBadge = (estado: string) => {
  switch (estado) {
    case EstadoDistribucion.EnEspera:
      return <Badge color="yellow" variant="light" radius="md" size="sm">En Espera</Badge>;
    case EstadoDistribucion.EnPlanta:
      return <Badge color="teal" variant="light" radius="md" size="sm">En Planta</Badge>;
    case EstadoDistribucion.SalioDePlanta:
      return <Badge color="blue" variant="light" radius="md" size="sm">Salió de Planta</Badge>;
    case EstadoDistribucion.LlegoAlCliente:
      return <Badge color="green" variant="light" radius="md" size="sm">Llegó al Cliente</Badge>;
    default:
      return <Badge color="gray" variant="light" radius="md" size="sm">{estado}</Badge>;
  }
};

export const DistribucionExpandida = ({
  distribucion,
  onVerLog,
}: Props) => {
  const totalPeso = distribucion.detalles.reduce((acc, d) => acc + (d.peso_tomado ?? 0), 0);

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2 space-y-1">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px]">
        {estadoBadge(distribucion.estado)}
        <span className="text-zinc-500 font-mono shrink-0">{distribucion.sucursal_nombre ?? "—"}</span>
        <span className="text-zinc-300 shrink-0">
          <span className="text-zinc-500">Transp: </span>
          <strong className="text-zinc-200">{distribucion.empresa_transporte_razon_social}</strong>
        </span>
        <span className="text-zinc-300 shrink-0">
          <span className="text-zinc-500">Veh: </span>
          <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
            {distribucion.vehiculo_placa}
          </span>
          {distribucion.vehiculo_carreta_placa && (
            <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono ml-1">
              + {distribucion.vehiculo_carreta_placa}
            </span>
          )}
        </span>
        <span className="text-zinc-300 shrink-0">
          <span className="text-zinc-500">Cond: </span>
          <strong className="text-zinc-200">{distribucion.conductor_nombre_completo ?? "—"}</strong>
        </span>
        <span className="text-zinc-300 shrink-0">
          <span className="text-zinc-500">Fecha est.: </span>
          <strong className="text-zinc-200">{formatFecha(distribucion.fecha_estimada_llegada)}</strong>
        </span>
        <span className="text-zinc-300 shrink-0">
          <span className="text-zinc-500">Total: </span>
          <strong className="text-indigo-400 font-mono">{totalPeso.toFixed(3)} KG</strong>
        </span>
        <Tooltip label="Ver historial">
          <ActionIcon
            type="button"
            color="zinc"
            variant="light"
            radius="xl"
            size="sm"
            onClick={() => onVerLog(distribucion)}
            className="bg-zinc-500/10! hover:bg-zinc-500/20! text-zinc-300! border-zinc-500/20! shrink-0 ml-auto"
          >
            <IconHistory size={12} />
          </ActionIcon>
        </Tooltip>
      </div>

      {distribucion.detalles.length > 0 && (
        <div className="rounded border border-zinc-800/70 overflow-hidden mt-0.5">
          <div className="grid grid-cols-[1fr_auto] gap-2 px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-500 bg-zinc-900/60 font-bold">
            <span>Item</span>
            <span className="text-right w-20">Peso (KG)</span>
          </div>
          {distribucion.detalles.map((det) => {
            const esLote = det.lote_correlativo !== null;
            const correlativo =
              det.lote_correlativo ??
              det.blending_correlativo ??
              `Detalle #${det.id_despacho_detalle}`;
            return (
              <div
                key={det.id}
                className="grid grid-cols-[1fr_auto] gap-2 px-2 py-1 text-[11px] border-t border-zinc-800/60 items-center"
              >
                <Group gap={6} wrap="nowrap" className="min-w-0">
                  <Badge
                    color={esLote ? "yellow" : "gray"}
                    variant="filled"
                    size="xs"
                    fw={700}
                  >
                    {esLote ? "Lote" : "Blend"}
                  </Badge>
                  <Text size="11px" c="white" className="font-mono truncate">
                    {correlativo}
                    {det.numero_particion !== null && (
                      <span className="text-zinc-500"> · P{det.numero_particion}</span>
                    )}
                  </Text>
                  {det.proveedor_razon_social && (
                    <Text size="10px" c="dimmed" className="truncate">
                      · {det.proveedor_razon_social}
                    </Text>
                  )}
                </Group>
                <Text size="11px" className="text-zinc-200 font-mono text-right w-20">
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