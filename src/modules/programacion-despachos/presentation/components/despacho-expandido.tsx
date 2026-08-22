import { useEffect } from "react";
import { Stack, Text, Badge, Group, Button } from "@mantine/core";
import {
  IconPlus,
  IconPackage,
  IconBan,
  IconTruck,
} from "@tabler/icons-react";
import type {
  DespachoDetalleItem,
  DistribucionItem as DistribucionItemFull,
} from "../../service/programacion-despachos.responses";
import { useDespachoDetalle } from "../../hooks/useDespachoDetalle";
import { DistribucionExpandida } from "./distribucion-expandida";

interface Props {
  idDespacho: number;
  onAgregarDistribucion: (idDespacho: number, detalles: DespachoDetalleItem[]) => void;
  onConfirmarDistribucion: (id: number) => void;
  onRegistrarSalida: (id: number) => void;
  onRegistrarLlegada: (id: number) => void;
  onAnularDespacho: (id: number) => void;
  onVerLog: (dist: DistribucionItemFull) => void;
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

export const DespachoExpandido = ({
  idDespacho,
  onAgregarDistribucion,
  onConfirmarDistribucion,
  onRegistrarSalida,
  onRegistrarLlegada,
  onAnularDespacho,
  onVerLog,
  togglingIds,
}: Props) => {
  const { detalle, loading, refrescar } = useDespachoDetalle(idDespacho);

  useEffect(() => {
    refrescar();
  }, [idDespacho, refrescar]);

  if (loading && !detalle) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">Cargando detalle...</div>
    );
  }

  if (!detalle) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">No se pudo cargar el detalle.</div>
    );
  }

  const detallesPendientes = detalle.detalles.filter((d) => d.peso_actual > 0);
  const distribuciones = detalle.distribuciones;
  const despachoAnulado = detalle.cabecera.es_anulado;

  const totalPeso = detalle.detalles.reduce((acc, d) => acc + (d.peso_tomado ?? 0), 0);
  const totalPendiente = detalle.detalles.reduce((acc, d) => acc + (d.peso_actual ?? 0), 0);
  const totalDistribuido = distribuciones.reduce(
    (acc, d) => acc + d.detalles.reduce((a, dd) => a + (dd.peso_tomado ?? 0), 0),
    0,
  );

  return (
    <Stack gap="md" p="md">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
        <Group justify="space-between" wrap="wrap">
          <Group gap="md">
            <Text size="sm" fw={700} className="text-zinc-100">
              {detalle.cabecera.correlativo}
            </Text>
            <Text size="xs" className="text-zinc-400">
              Planta:{" "}
              <strong className="text-zinc-200">
                {detalle.cabecera.planta_destino_razon_social}
              </strong>{" "}
              ({detalle.cabecera.planta_destino_ruc})
            </Text>
            {despachoAnulado && (
              <Badge color="red" variant="filled" radius="md" size="sm">
                Anulado
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {!despachoAnulado && distribuciones.every((d) => d.estado === "En Espera") && distribuciones.length > 0 && (
              <Button
                leftSection={<IconBan size={14} />}
                size="xs"
                radius="lg"
                color="red"
                variant="light"
                disabled={!!togglingIds[detalle.cabecera.id]}
                loading={!!togglingIds[detalle.cabecera.id]}
                onClick={() => onAnularDespacho(detalle.cabecera.id)}
                className="bg-red-500/10! hover:bg-red-500/20! text-red-400! border-red-500/20!"
              >
                Anular despacho
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={14} />}
              size="xs"
              radius="lg"
              disabled={despachoAnulado || detallesPendientes.length === 0}
              onClick={() => onAgregarDistribucion(detalle.cabecera.id, detallesPendientes)}
              className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20!"
            >
              Agregar distribución
            </Button>
          </Group>
        </Group>
        <Group gap="md" wrap="wrap">
          <Text size="xs" className="text-zinc-400">
            Registrado el{" "}
            <strong className="text-zinc-200">{formatFecha(detalle.cabecera.created_at)}</strong>
            {" por "}
            <strong className="text-zinc-200">
              {detalle.cabecera.empleado_registro_nombre ?? "—"}
            </strong>
          </Text>
          <Text size="xs" className="text-zinc-400">
            Tomado:{" "}
            <strong className="text-zinc-200 font-mono">{totalPeso.toFixed(3)} TN</strong>
          </Text>
          <Text size="xs" className="text-zinc-400">
            Pendiente:{" "}
            <strong className="text-amber-400 font-mono">{totalPendiente.toFixed(3)} TN</strong>
          </Text>
          <Text size="xs" className="text-zinc-400">
            Distribuido:{" "}
            <strong className="text-emerald-400 font-mono">{totalDistribuido.toFixed(3)} TN</strong>
          </Text>
        </Group>
      </div>

      <div>
        <Group gap={6} mb={6}>
          <IconPackage size={14} className="text-zinc-400" />
          <Text size="xs" fw={700} className="text-zinc-300">
            Detalle del despacho ({detalle.detalles.length})
          </Text>
        </Group>
        <div className="rounded-xl border border-zinc-800/70 overflow-hidden">
          {detalle.detalles.length === 0 ? (
            <div className="px-3 py-4 text-center text-zinc-500 text-xs">
              Este despacho no tiene items.
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-900/60 font-bold border-b border-zinc-800/70">
              <span>Tipo</span>
              <span>Correlativo / Proveedor</span>
              <span className="text-right">Peso Tomado</span>
              <span className="text-right">Peso Pendiente</span>
              <span className="text-right">% Distribuido</span>
            </div>
          )}
          {detalle.detalles.map((d) => {
            const total = d.peso_tomado ?? 0;
            const pend = d.peso_actual ?? 0;
            const dist = total - pend;
            const pct = total > 0 ? (dist / total) * 100 : 0;
            return (
              <div
                key={d.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-xs items-center border-t border-zinc-800/60"
              >
                <Badge color="violet" variant="light" radius="md" size="xs">
                  {d.id_blending ? "BLENDING" : "LOTE"}
                </Badge>
                <Text size="xs" className="text-zinc-300">
                  <span className="font-mono">{d.lote_correlativo ?? d.blending_correlativo}</span>
                  {d.proveedor_razon_social ? (
                    <span className="text-zinc-500 ml-2">· {d.proveedor_razon_social}</span>
                  ) : null}
                </Text>
                <Text size="xs" className="text-zinc-200 font-mono text-right w-24">
                  {(d.peso_tomado ?? 0).toFixed(3)} TN
                </Text>
                <Text
                  size="xs"
                  className={`font-mono text-right w-24 ${pend > 0 ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {pend.toFixed(3)} TN
                </Text>
                <Text
                  size="xs"
                  className={`font-mono text-right w-24 ${pct >= 99.99 ? "text-emerald-400" : "text-zinc-300"}`}
                >
                  {pct.toFixed(1)}%
                </Text>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Group gap={6} mb={6}>
          <IconTruck size={14} className="text-zinc-400" />
          <Text size="xs" fw={700} className="text-zinc-300">
            Distribuciones ({distribuciones.length})
          </Text>
        </Group>
        {distribuciones.length === 0 ? (
          <div className="px-3 py-4 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
            Aún no se han registrado distribuciones.
          </div>
        ) : (
          <Stack gap="xs">
            {distribuciones.map((d) => (
              <DistribucionExpandida
                key={d.id}
                distribucion={d}
                onConfirmar={onConfirmarDistribucion}
                onRegistrarSalida={onRegistrarSalida}
                onRegistrarLlegada={onRegistrarLlegada}
                onVerLog={onVerLog}
                togglingIds={togglingIds}
              />
            ))}
          </Stack>
        )}
      </div>
    </Stack>
  );
};