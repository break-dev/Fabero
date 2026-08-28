import {
  Paper,
  Text,
  Group,
  Button,
  NumberInput,
  ActionIcon,
  Badge,
  Tooltip,
  Stack,
  Alert,
  Grid,
} from "@mantine/core";
import {
  IconScale,
  IconBarcode,
  IconCheck,
  IconX,
  IconDroplet,
  IconSun,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type {
  RecepcionMineralResponse,
} from "../../service/recepcion-mineral.responses";
import type {
  DistribucionDetalleItem,
} from "../../../programacion-despachos/service/programacion-despachos.responses";
import { usePesarDistribucionDetalle } from "../../hooks/usePesarDistribucionDetalle";
import { useTicketBalanza } from "../../hooks/useTicketBalanza";
import { useNotify } from "../../../../hooks/useNotify";

interface CardDistribucionBalanzaProps {
  ru: RecepcionMineralResponse;
  onDetalleUpdated: (detalleActualizado: DistribucionDetalleItem) => void;
  cerrarProceso: (recepcionId: number) => Promise<void>;
  closingProcesoId: number | null;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[30px] text-xs",
  label: "text-zinc-500 mb-0.5 font-medium text-[10px] ml-0.5",
};

const formatPlacaInput = (val: string): string => {
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
};

/**
 * Formato compacto: 12000.000 -> "12000", 12000.500 -> "12000.5"
 */
const formatPeso = (n: unknown): string => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  // Redondear a 3 decimales, luego quitar ceros finales.
  const rounded = Math.round(num * 1000) / 1000;
  const s = rounded.toFixed(3);
  return s.replace(/\.?0+$/, "") || "0";
};

const DataRow = ({ label, value }: { label: string; value: string }) => (
  <Group gap={6} wrap="nowrap" align="baseline">
    <Text size="10px" c="dimmed" className="uppercase font-semibold shrink-0 min-w-20">
      {label}
    </Text>
    <Text size="11px" fw={600} c="zinc.100" className="truncate">
      {value}
    </Text>
  </Group>
);

interface DetallePesajeItemProps {
  detalle: DistribucionDetalleItem;
  onSaved: (detalleActualizado: DistribucionDetalleItem) => void;
}

const DetallePesajeItem = ({ detalle, onSaved }: DetallePesajeItemProps) => {
  const { printTicketBalanza, loadingTicket } = useTicketBalanza();
  const ctrl = usePesarDistribucionDetalle({
    detalle,
    onSaved,
    idLoteMineralParaTicket: detalle.detalle_id_lote_mineral,
    onPrintTicket: () => {
      if (detalle.detalle_id_lote_mineral) {
        printTicketBalanza(detalle.detalle_id_lote_mineral);
      }
    },
  });

  const pesado = detalle.peso_neto !== null && detalle.peso_neto > 0;
  const taraMenorBruto =
    ctrl.taraNum > 0 && ctrl.brutoNum > 0 && ctrl.taraNum < ctrl.brutoNum;

  const humedad = Number(detalle.lote_ley_humedad) || 0;
  const pesoHumedo = Number(detalle.peso_tomado) || 0;
  const pesoSeco = pesoHumedo * (1 - humedad / 100);

  return (
    <Paper
      radius="md"
      p="xs"
      className="bg-zinc-950/30 border border-zinc-800/80"
    >
      <Group justify="space-between" align="center" mb={4} wrap="nowrap">
        <Group gap={3} wrap="nowrap">
          <Badge
            variant="light"
            color="indigo"
            size="sm"
            radius="sm"
            className="font-mono font-bold text-[9px]"
          >
            {detalle.lote_correlativo ?? `Detalle #${detalle.id}`}
          </Badge>
          {detalle.numero_particion !== null && (
            <Badge
              variant="light"
              color="zinc"
              size="sm"
              radius="sm"
              className="font-mono text-[9px]"
            >
              P-{detalle.numero_particion}
            </Badge>
          )}
          <Badge
            variant="light"
            color="cyan"
            size="sm"
            radius="sm"
            leftSection={<IconDroplet size={10} />}
            className="font-mono text-[9px]"
          >
            {formatPeso(pesoHumedo)} Kg
          </Badge>
          <Badge
            variant="light"
            color="orange"
            size="sm"
            radius="sm"
            leftSection={<IconSun size={10} />}
            className="font-mono text-[9px]"
          >
            {formatPeso(pesoSeco)} Kg
          </Badge>
        </Group>
        <Group gap={3} wrap="nowrap">
          {pesado && (
            <Tooltip label="Reimprimir ticket" withArrow>
              <ActionIcon
                type="button"
                variant="light"
                color="indigo"
                radius="sm"
                size="sm"
                onClick={() => {
                  if (detalle.detalle_id_lote_mineral) {
                    printTicketBalanza(detalle.detalle_id_lote_mineral);
                  }
                }}
                loading={loadingTicket}
                disabled={!detalle.detalle_id_lote_mineral}
                className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20!"
                aria-label="Imprimir ticket"
              >
                <IconBarcode size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Grid gutter={4}>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Group gap={4} wrap="nowrap" align="center">
            <NumberInput
              label="Tara"
              placeholder="0"
              min={0}
              decimalScale={3}
              hideControls
              value={pesado ? (Number(detalle.peso_tara) || 0).toFixed(3) : ctrl.pesoTara}
              onChange={(val) => ctrl.setPesoTara(val ?? "")}
              disabled={ctrl.loadingTara || ctrl.loadingBruto}
              size="xs"
              radius="md"
              classNames={fieldClasses}
              style={{ flex: 1 }}
            />
            <Tooltip label="Guardar tara e imprimir ticket" withArrow>
              <ActionIcon
                type="button"
                variant="filled"
                radius="md"
                size="md"
                onClick={() => ctrl.guardarTara()}
                loading={ctrl.loadingTara}
                disabled={!ctrl.taraValido || ctrl.loadingBruto}
                style={{ alignSelf: "center", marginTop: 20 }}
                className={
                  taraMenorBruto || !ctrl.brutoNum
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                aria-label="Guardar tara"
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Group gap={4} wrap="nowrap" align="center">
            <NumberInput
              label="Bruto"
              placeholder="0"
              min={0}
              decimalScale={3}
              hideControls
              value={pesado ? (Number(detalle.peso_bruto) || 0).toFixed(3) : ctrl.pesoBruto}
              onChange={(val) => ctrl.setPesoBruto(val ?? "")}
              disabled={ctrl.loadingTara || ctrl.loadingBruto}
              size="xs"
              radius="md"
              classNames={fieldClasses}
              style={{ flex: 1 }}
            />
            <Tooltip label="Guardar bruto e imprimir ticket" withArrow>
              <ActionIcon
                type="button"
                variant="filled"
                radius="md"
                size="md"
                onClick={() => ctrl.guardarBruto()}
                loading={ctrl.loadingBruto}
                disabled={!ctrl.brutoValido || ctrl.loadingTara}
                style={{ alignSelf: "center", marginTop: 20 }}
                className={
                  taraMenorBruto
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                aria-label="Guardar bruto"
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <NumberInput
            label="Neto"
            placeholder="0"
            decimalScale={3}
            hideControls
            value={ctrl.netoNum > 0 ? Number(ctrl.netoNum.toFixed(3)) : ""}
            readOnly
            disabled
            size="xs"
            radius="md"
            classNames={{
              ...fieldClasses,
              input: `${fieldClasses.input} bg-zinc-800/40 text-emerald-300 font-bold`,
            }}
          />
        </Grid.Col>
      </Grid>

      {ctrl.advertenciaMermaSeca && (
        <Alert
          color="yellow"
          radius="sm"
          icon={<IconAlertTriangle size={12} />}
          classNames={{
            root: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200 py-1.5 mt-2",
            icon: "text-yellow-400",
            message: "text-yellow-200 text-[10px]",
          }}
        >
          {ctrl.advertenciaMermaSeca}
        </Alert>
      )}

      {!pesado && !taraMenorBruto && (ctrl.taraNum > 0 || ctrl.brutoNum > 0) && (
        <Alert
          color="red"
          radius="sm"
          icon={<IconX size={12} />}
          classNames={{
            root: "bg-red-500/10 border-red-500/30 text-red-300 py-1 mt-2",
            icon: "text-red-400",
            message: "text-red-300 text-[10px]",
          }}
        >
          Tara debe ser menor que bruto.
        </Alert>
      )}
    </Paper>
  );
};

export const CardDistribucionBalanza = ({
  ru,
  onDetalleUpdated,
  cerrarProceso,
  closingProcesoId,
}: CardDistribucionBalanzaProps) => {
  const { notifyError } = useNotify();

  const detalles = ru.distribucion_detalles ?? [];
  const todosPesados =
    detalles.length > 0 && detalles.every((d) => d.peso_neto !== null && d.peso_neto > 0);

  const despachoCorrelativo = detalles[0]?.despacho_correlativo ?? null;

  return (
    <Paper
      radius="md"
      p="sm"
      className="bg-zinc-950/40 border border-zinc-800/80 shadow-lg flex flex-col gap-2"
    >
      {/* Layout 2 columnas */}
      <Grid columns={24} gutter="xs">
        {/* === Columna Izquierda: Datos de la unidad (sólo lectura compacta para despacho) === */}
        <Grid.Col span={{ base: 24, md: 6 }}>
          <Paper
            radius="md"
            p="xs"
            className="bg-zinc-900/30 border border-zinc-800/80 h-full"
          >
            <Group justify="space-between" align="center" className="px-1 mb-2">
              <Group gap={6} align="center">
                <div className="w-2 h-2 rounded-full animate-pulse bg-yellow-400 shadow-[0_0_6px_#facc15]" />
                <Text size="10px" fw={700} className="text-indigo-400 uppercase tracking-wider">
                  Unidad
                </Text>
                <Text size="12px" fw={700} className="text-zinc-500 font-mono">
                  {formatPlacaInput(ru.vehiculo_placa || "")}
                </Text>
              </Group>
              <Text size="10px" c="dimmed" className="font-mono">
                {ru.fecha_hora_ingreso}
              </Text>
            </Group>

            <Stack gap={4} className="px-1">
              <DataRow label="Condición" value={ru.tipo_ingreso || "—"} />
              <DataRow label="Vehículo" value={ru.vehiculo_placa || "—"} />
              <DataRow label="Empresa" value={ru.empresa_transporte_razon_social || "—"} />
              <DataRow label="Tipo" value={ru.tipo_vehiculo_nombre || "—"} />
              <DataRow label="Placa Acople" value={ru.segunda_placa || "—"} />
              <DataRow
                label="Conductor"
                value={
                  ru.conductor_nombre_completo
                    ? `${ru.conductor_nombre_completo}${ru.conductor_dni ? ` (${ru.conductor_dni})` : ""}`
                    : "—"
                }
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* === Columna Derecha: Detalles a Distribuir === */}
        <Grid.Col span={{ base: 24, md: 18 }}>
          <Paper
            radius="md"
            p="xs"
            className="bg-zinc-900/30 border border-zinc-800/80 h-full"
          >
            <Group justify="space-between" mb="xs" className="px-1" wrap="nowrap">
              <Group gap={4} wrap="nowrap">
                <IconScale size={12} className="text-indigo-400" />
                <Text
                  size="10px"
                  fw={700}
                  className="text-indigo-400 uppercase tracking-wider"
                >
                  Detalles a distribuir ({detalles.length})
                </Text>
                {despachoCorrelativo && (
                  <Badge
                    size="xs"
                    variant="filled"
                    color="indigo"
                    radius="sm"
                    className="font-mono"
                  >
                    {despachoCorrelativo}
                  </Badge>
                )}
              </Group>
              <Button
                type="button"
                radius="md"
                disabled={!todosPesados}
                loading={closingProcesoId === ru.id}
                onClick={() => {
                  cerrarProceso(ru.id).catch((e: unknown) => {
                    const message =
                      e instanceof Error
                        ? e.message
                        : "Error al cerrar el proceso";
                    notifyError(message);
                  });
                }}
                size="compact-xs"
                leftSection={<IconCheck size={12} />}
                className={`font-semibold h-6 px-2.5 text-[11px] ${
                  todosPesados
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                }`}
              >
                Cerrar Proceso
              </Button>
            </Group>

            {detalles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center gap-1">
                <IconScale size={20} className="text-zinc-600" />
                <Text size="10px" c="dimmed">
                  Sin detalles asociados.
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {detalles.map((detalle) => (
                  <DetallePesajeItem
                    key={detalle.id}
                    detalle={detalle}
                    onSaved={onDetalleUpdated}
                  />
                ))}
              </div>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

