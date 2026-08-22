import { Text, Badge, Group, Stack, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconHistory,
  IconCheck,
  IconDoorExit,
  IconFlag,
} from "@tabler/icons-react";
import { EstadoDistribucion } from "../../../../shared/enums/programacion-despachos/estado-distribucion";
import type { DistribucionItem } from "../../service/programacion-despachos.responses";

interface Props {
  distribucion: DistribucionItem;
  onConfirmar: (id: number) => void;
  onRegistrarSalida: (id: number, observacion: string | undefined) => void;
  onRegistrarLlegada: (id: number) => void;
  onVerLog: (dist: DistribucionItem) => void;
  togglingIds: Record<number, boolean>;
}

const formatFecha = (f: string | null | undefined) => {
  if (!f) return "—";
  try {
    const d = new Date(f.replace(" ", "T"));
    if (isNaN(d.getTime())) return f;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  onConfirmar,
  onRegistrarSalida,
  onRegistrarLlegada,
  onVerLog,
  togglingIds,
}: Props) => {
  const loading = !!togglingIds[distribucion.id];
  const totalPeso = distribucion.detalles.reduce((acc, d) => acc + (d.peso_tomado ?? 0), 0);

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-2">
      <Group justify="space-between" wrap="wrap">
        <Group gap="sm" wrap="wrap">
          <Text size="sm" fw={600} className="text-zinc-100">
            Distribución #{distribucion.id}
          </Text>
          {estadoBadge(distribucion.estado)}
        </Group>
        <Group gap={4}>
          {distribucion.estado === EstadoDistribucion.EnEspera && (
            <Tooltip label="Confirmar (En Espera → En Planta)">
              <ActionIcon
                type="button"
                color="teal"
                variant="light"
                radius="xl"
                size="lg"
                loading={loading}
                disabled={loading}
                onClick={() => onConfirmar(distribucion.id)}
                className="bg-teal-500/10! hover:bg-teal-500/20! text-teal-400! border-teal-500/20!"
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {distribucion.estado === EstadoDistribucion.EnPlanta && (
            <Tooltip label="Registrar salida de planta">
              <ActionIcon
                type="button"
                color="blue"
                variant="light"
                radius="xl"
                size="lg"
                loading={loading}
                disabled={loading}
                onClick={() => onRegistrarSalida(distribucion.id, undefined)}
                className="bg-blue-500/10! hover:bg-blue-500/20! text-blue-400! border-blue-500/20!"
              >
                <IconDoorExit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {distribucion.estado === EstadoDistribucion.SalioDePlanta && (
            <Tooltip label="Registrar llegada al cliente">
              <ActionIcon
                type="button"
                color="green"
                variant="light"
                radius="xl"
                size="lg"
                loading={loading}
                disabled={loading}
                onClick={() => onRegistrarLlegada(distribucion.id)}
                className="bg-green-500/10! hover:bg-green-500/20! text-green-400! border-green-500/20!"
              >
                <IconFlag size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Ver historial">
            <ActionIcon
              type="button"
              color="zinc"
              variant="light"
              radius="xl"
              size="lg"
              onClick={() => onVerLog(distribucion)}
              className="bg-zinc-500/10! hover:bg-zinc-500/20! text-zinc-300! border-zinc-500/20!"
            >
              <IconHistory size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Group gap="md" wrap="wrap">
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Sucursal: </span>
          <strong className="text-zinc-200">{distribucion.sucursal_nombre ?? "—"}</strong>
        </Text>
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Transportista: </span>
          <strong className="text-zinc-200">{distribucion.empresa_transporte_razon_social}</strong>
        </Text>
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Vehículo: </span>
          <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold text-xs font-mono">
            {distribucion.vehiculo_placa}
          </span>
          {distribucion.vehiculo_carreta_placa && (
            <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold text-xs font-mono ml-1">
              + {distribucion.vehiculo_carreta_placa}
            </span>
          )}
        </Text>
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Conductor: </span>
          <strong className="text-zinc-200">{distribucion.conductor_nombre_completo ?? "—"}</strong>
        </Text>
      </Group>

      <Group gap="md" wrap="wrap">
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Fecha estimada: </span>
          <strong className="text-zinc-200">{formatFecha(distribucion.fecha_estimada_llegada)}</strong>
        </Text>
        <Text size="xs" className="text-zinc-300">
          <span className="text-zinc-500">Total peso: </span>
          <strong className="text-indigo-400 font-mono">{totalPeso.toFixed(3)} TN</strong>
        </Text>
        {distribucion.capacidad_vehiculo !== null && (
          <Text size="xs" className="text-zinc-400">
            Capacidad vehículo: {distribucion.capacidad_vehiculo.toFixed(3)} TN
          </Text>
        )}
      </Group>

      {distribucion.detalles.length > 0 && (
        <div className="rounded-lg border border-zinc-800/70 overflow-hidden mt-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-900/60 font-bold">
            <span>Item de despacho</span>
            <span className="text-center">Partición</span>
            <span className="text-center">Peso (TN)</span>
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
                className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-xs border-t border-zinc-800/60 items-center"
              >
                <Stack gap={2} className="min-w-0">
                  <Group gap={6} wrap="nowrap">
                    <Badge
                      color={esLote ? "yellow" : "gray"}
                      variant="filled"
                      size="xs"
                      fw={700}
                    >
                      {esLote ? "Lote" : "Blending"}
                    </Badge>
                    <Text size="xs" c="white" className="font-mono truncate">
                      {correlativo}
                    </Text>
                    {det.proveedor_razon_social && (
                      <Text size="10px" c="dimmed" className="truncate">
                        · {det.proveedor_razon_social}
                      </Text>
                    )}
                  </Group>
                  <Text size="10px" c="zinc.6" className="font-mono">
                    Detalle despacho #{det.id_despacho_detalle}
                  </Text>
                </Stack>
                <Text size="xs" className="text-zinc-400 text-center w-16">
                  {det.numero_particion === null ? "—" : det.numero_particion}
                </Text>
                <Text size="xs" className="text-zinc-200 font-mono text-center w-24">
                  {(det.peso_tomado ?? 0).toFixed(3)}
                </Text>
              </div>
            );
          })}
        </div>
      )}

      {distribucion.log_cambios && distribucion.log_cambios.length > 0 && (
        <Group gap={4} mt={2}>
          <IconHistory size={12} className="text-zinc-500" />
          <Text size="11px" className="text-zinc-500">
            {distribucion.log_cambios.length} cambio(s) registrado(s)
          </Text>
        </Group>
      )}
    </div>
  );
};