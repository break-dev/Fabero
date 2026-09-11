import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendar,
  IconInfoCircle,
  IconPackage,
  IconPlus,
  IconTruck,
  IconTruckDelivery,
  IconUser,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
  DistribucionItem,
  GuiaSegundoTramo,
} from "../../service/programacion-despachos.responses";
import { useDespachoDetalle } from "../../hooks/useDespachoDetalle";
import { DistribucionCard } from "./distribucion-card";
import { RegistroDistribucionModal } from "./registro-distribucion-modal";
import { ModalGuiaSegundoTramo } from "./modal-guia-segundo-tramo";

interface Props {
  opened: boolean;
  idDespacho: number | null;
  onClose: () => void;
  onDistribucionCreada: (result: CrearDistribucionResult) => void;
  onVerLog: (dist: DistribucionItem) => void;
}

const formatFechaHora = (f: string | null | undefined) => {
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

export const ModalDetalleDespacho = ({
  opened,
  idDespacho,
  onClose,
  onDistribucionCreada,
  onVerLog,
}: Props) => {
  const { detalle, loading, refrescar } = useDespachoDetalle(idDespacho);

  const [modalDistribucionAbierto, setModalDistribucionAbierto] =
    useState(false);
  const [detallesParaDistribuir, setDetallesParaDistribuir] = useState<
    DespachoDetalleItem[]
  >([]);

  // ---- modal de Guia Segundo Tramo: una sola instancia, se reabre apuntando
  //      a la distribucion seleccionada desde la card.
  const [modalGuiaAbierto, setModalGuiaAbierto] = useState(false);
  const [guiaDistribucionSeleccionada, setGuiaDistribucionSeleccionada] =
    useState<DistribucionItem | null>(null);

  useEffect(() => {
    if (opened && idDespacho !== null) {
      refrescar();
    }
  }, [opened, idDespacho, refrescar]);

  const cabecera = detalle?.cabecera ?? null;
  const detalles = detalle?.detalles ?? [];
  const distribuciones = detalle?.distribuciones ?? [];
  const pesoTotalTomado = detalles.reduce((acc, d) => acc + (d.peso_tomado ?? 0), 0);
  const pesoTotalPendiente = detalles.reduce(
    (acc, d) => acc + (d.peso_actual ?? 0),
    0
  );
  const pesoDistribuido = Math.max(pesoTotalTomado - pesoTotalPendiente, 0);

  const handleClose = () => {
    onClose();
  };

  const abrirModalDistribucion = () => {
    if (!detalle) return;
    const pendientes = detalles.filter((d) => d.peso_actual > 0);
    if (pendientes.length === 0) return;
    setDetallesParaDistribuir(pendientes);
    setModalDistribucionAbierto(true);
  };

  const onDistribucionSuccess = (result: CrearDistribucionResult) => {
    setModalDistribucionAbierto(false);
    setDetallesParaDistribuir([]);
    onDistribucionCreada(result);
    refrescar();
  };

  const abrirGuiaSegundoTramo = (dist: DistribucionItem) => {
    setGuiaDistribucionSeleccionada(dist);
    setModalGuiaAbierto(true);
  };

  const cerrarGuiaSegundoTramo = () => {
    setModalGuiaAbierto(false);
    setGuiaDistribucionSeleccionada(null);
  };

  /**
   * Tras guardar/actualizar la guia, refrescar el detalle del despacho para
   * que DistribucionItem.guia_segundo_tramo se actualice y la card muestre el
   * estado correcto (tooltip "Editar" en vez de "Registrar").
   * La guia retornada por el modal ya viene persistida en backend; no la
   * inspeccionamos aca — el cache del detalle se reconstruye via `refrescar()`.
   */
  const handleGuiaSaved = (guia: GuiaSegundoTramo): void => {
    void guia;
    cerrarGuiaSegundoTramo();
    refrescar();
  };

  const renderCabecera = (cab: typeof cabecera) => {
    if (!cab) return null;
    return (
      <Box className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <IconTruckDelivery size={20} className="text-indigo-400" />
            <Text fw={800} size="lg" c="white" className="font-mono tracking-wider">
              {cab.correlativo}
            </Text>
          </div>
          <Divider orientation="vertical" className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Planta Destino
            </Text>
            <Text size="sm" fw={700} c="white">
              {cab.planta_destino_razon_social}
            </Text>
            <Text size="11px" c="dimmed" className="font-mono">
              {cab.planta_destino_ruc}
            </Text>
          </div>
          <Divider orientation="vertical" className="hidden md:block" />
          <div className="flex items-center gap-2">
            <IconCalendar size={14} className="text-zinc-400" />
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Registrado
            </Text>
            <Text size="xs" c="zinc.2">
              {formatFechaHora(cab.created_at)}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <IconUser size={14} className="text-zinc-400" />
            <Text size="10px" c="dimmed" className="uppercase tracking-wider">
              Por
            </Text>
            <Text size="xs" c="zinc.2">
              {cab.empleado_registro_nombre ?? "—"}
            </Text>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {cab.es_anulado ? (
              <Badge color="red" variant="filled" radius="md" size="lg">
                ANULADO
              </Badge>
            ) : (
              <Badge color="indigo" variant="filled" radius="md" size="lg">
                ACTIVO
              </Badge>
            )}
          </div>
        </div>
      </Box>
    );
  };

  const renderItems = () => {
    if (detalles.length === 0) {
      return (
        <Box className="px-4 py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <IconInfoCircle size={20} className="mx-auto text-zinc-600 mb-2" />
          <Text size="xs" c="dimmed">
            Este despacho no tiene items asociados.
          </Text>
        </Box>
      );
    }
    return (
      <Box className="rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950/40">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/70 font-bold border-b border-zinc-800/80">
              <th className="py-2.5 px-3 text-center font-bold">Correlativo / Proveedor</th>
              <th className="py-2.5 px-3 text-center font-bold">Tipo</th>
              <th className="py-2.5 px-3 text-center font-bold">Peso Tomado (KG)</th>
              <th className="py-2.5 px-3 text-center font-bold">Peso Pendiente (KG)</th>
              <th className="py-2.5 px-3 text-center font-bold">% Distribuido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {detalles.map((d) => {
              const total = d.peso_tomado ?? 0;
              const pend = d.peso_actual ?? 0;
              const dist = Math.max(total - pend, 0);
              const pct = total > 0 ? (dist / total) * 100 : 0;
              const esLote = d.lote_correlativo !== null;
              const correlativo =
                d.lote_correlativo ?? d.blending_correlativo ?? "—";
              return (
                <tr key={d.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-2.5 px-3 text-center align-middle">
                    <Text size="xs" className="text-zinc-200 font-mono">
                      {correlativo}
                    </Text>
                    {d.proveedor_razon_social && (
                      <Text size="10px" c="dimmed" className="truncate max-w-[180px] mx-auto">
                        {d.proveedor_razon_social}
                      </Text>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    <Badge
                      color={esLote ? "yellow" : "gray"}
                      variant="filled"
                      size="xs"
                      fw={700}
                      radius="md"
                    >
                      {esLote ? "LOTE" : "BLEND"}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    <Text size="xs" fw={600} className="text-zinc-200 font-mono">
                      {total.toFixed(3)}
                    </Text>
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    <Text
                      size="xs"
                      fw={600}
                      className={`font-mono ${
                        pend > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {pend.toFixed(3)}
                    </Text>
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    <div className="flex flex-col items-center gap-1">
                      <Text
                        size="xs"
                        fw={700}
                        className={`font-mono ${
                          pct >= 99.99 ? "text-emerald-400" : "text-zinc-300"
                        }`}
                      >
                        {pct.toFixed(1)}%
                      </Text>
                      <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            pct >= 99.99 ? "bg-emerald-400" : "bg-indigo-400"
                          } transition-all`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-zinc-900/70 border-t-2 border-zinc-700 font-bold">
              <td colSpan={2} className="py-2 px-3 text-right text-[10px] uppercase tracking-wider text-zinc-400">
                Totales
              </td>
              <td className="py-2 px-3 text-center text-xs text-zinc-100 font-mono">
                {pesoTotalTomado.toFixed(3)}
              </td>
              <td
                className={`py-2 px-3 text-center text-xs font-mono ${
                  pesoTotalPendiente > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {pesoTotalPendiente.toFixed(3)}
              </td>
              <td
                className={`py-2 px-3 text-center text-xs font-mono ${
                  pesoTotalPendiente <= 0 ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {pesoTotalTomado > 0
                  ? (((pesoDistribuido / pesoTotalTomado) * 100).toFixed(1))
                  : "0.0"}
                %
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    );
  };

  const renderDistribuciones = () => {
    if (distribuciones.length === 0) {
      return (
        <Box className="px-4 py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <IconInfoCircle size={20} className="mx-auto text-zinc-600 mb-2" />
          <Text size="xs" c="dimmed">
            Aún no se han registrado distribuciones para este despacho.
          </Text>
        </Box>
      );
    }
    return (
      <Stack gap="sm">
        {distribuciones.map((d) => (
          <DistribucionCard
            key={d.id}
            distribucion={d}
            onVerLog={onVerLog}
            onAbrirGuiaSegundoTramo={abrirGuiaSegundoTramo}
          />
        ))}
      </Stack>
    );
  };

  const puedeAgregarDistribucion =
    cabecera !== null &&
    !cabecera.es_anulado &&
    pesoTotalPendiente > 0;

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleClose}
        title={
          <Group gap="xs">
            <IconTruck size={20} className="text-indigo-400" />
            <Text fw={700} fz="md" c="white">
              Detalle del Despacho
            </Text>
          </Group>
        }
        size="90%"
      >
        <ScrollArea h="calc(90vh - 160px)" type="auto" offsetScrollbars>
          <Stack gap="lg" p="md">
            {loading && !detalle ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader size="md" color="indigo" />
                <Text size="xs" c="dimmed">
                  Cargando detalle del despacho...
                </Text>
              </div>
            ) : !detalle || !cabecera ? (
              <Box className="px-4 py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <IconAlertCircle
                  size={28}
                  className="mx-auto text-zinc-600 mb-2"
                />
                <Text size="sm" c="dimmed">
                  No se pudo cargar el detalle del despacho.
                </Text>
              </Box>
            ) : (
              <>
                {renderCabecera(cabecera)}

                {/* Items del despacho */}
                <Stack gap="xs">
                  <Group gap={6}>
                    <IconPackage size={16} className="text-amber-400" />
                    <Text size="sm" fw={700} c="zinc.2">
                      Items del Despacho
                    </Text>
                    <Badge variant="light" color="amber" size="sm" radius="md">
                      {detalles.length}
                    </Badge>
                  </Group>
                  {renderItems()}
                </Stack>

                {/* Distribuciones */}
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={6}>
                      <IconTruck size={16} className="text-indigo-400" />
                      <Text size="sm" fw={700} c="zinc.2">
                        Distribuciones
                      </Text>
                      <Badge variant="light" color="indigo" size="sm" radius="md">
                        {distribuciones.length}
                      </Badge>
                    </Group>
                    <Tooltip
                      label={
                        puedeAgregarDistribucion
                          ? "Agregar nueva distribución"
                          : cabecera?.es_anulado
                          ? "El despacho está anulado"
                          : "No hay peso pendiente"
                      }
                      withArrow
                    >
                      <span>
                        <Button
                          size="xs"
                          radius="lg"
                          variant="filled"
                          color="indigo"
                          leftSection={<IconPlus size={14} />}
                          onClick={abrirModalDistribucion}
                          disabled={!puedeAgregarDistribucion}
                          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20"
                        >
                          Agregar Distribución
                        </Button>
                      </span>
                    </Tooltip>
                  </Group>
                  {renderDistribuciones()}
                </Stack>
              </>
            )}
          </Stack>
        </ScrollArea>
      </ModalEstandar>

      {modalDistribucionAbierto && idDespacho !== null && (
        <RegistroDistribucionModal
          opened={modalDistribucionAbierto}
          onClose={() => setModalDistribucionAbierto(false)}
          idDespacho={idDespacho}
          detallesDespacho={detallesParaDistribuir}
          onSuccess={onDistribucionSuccess}
        />
      )}

      {modalGuiaAbierto && guiaDistribucionSeleccionada !== null && (
        <ModalGuiaSegundoTramo
          opened={modalGuiaAbierto}
          idDistribucion={guiaDistribucionSeleccionada.id}
          guia={guiaDistribucionSeleccionada.guia_segundo_tramo ?? null}
          contexto={{
            distribucionId: guiaDistribucionSeleccionada.id,
            vehiculoPlaca: guiaDistribucionSeleccionada.vehiculo_placa,
            sucursalNombre: guiaDistribucionSeleccionada.sucursal_nombre,
          }}
          onClose={cerrarGuiaSegundoTramo}
          onSaved={handleGuiaSaved}
        />
      )}
    </>
  );
};
