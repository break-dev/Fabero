import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Button,
  Grid,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle, IconCoin } from "@tabler/icons-react";
import dayjs from "dayjs";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalRegistroTipoCambio } from "./modal-registro-tipo-cambio";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { REQ_CrearComprobante } from "../../service/contabilidad-compra.requests";

const comprobanteSchema = z.object({
  id_valorizacion_compra: z.number({ message: "Seleccione una valorización." }).min(1),
  serie: z.string().trim().min(1, "La serie es obligatoria."),
  numero: z.string().trim().min(1, "El número es obligatorio."),
  fecha_emision: z.string().min(10, "La fecha de emisión es obligatoria."),
  porcentaje_igv: z.number().min(0).max(1),
  porcentaje_detraccion: z.number().min(0).max(1),
});

/**
 * Serializa la fecha de emisión usando dayjs (la misma lib que usa internamente
 * el DateInput de Mantine v8), evitando los desfases de zona horaria que se
 * producen al extraer año/mes/día con los getters nativos del Date.
 */
const toDateString = (value: unknown): string => {
  if (!value) return "";
  const d = dayjs(value as Date | string);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DD");
};

interface ModalRegistroComprobanteProps {
  opened: boolean;
  onClose: () => void;
  proveedores: RES_Proveedor[];
  loadingProveedores: boolean;
  submitting: boolean;
  onSubmit: (payload: REQ_CrearComprobante) => Promise<boolean>;
}

export const ModalRegistroComprobante = ({
  opened,
  onClose,
  proveedores,
  loadingProveedores,
  submitting,
  onSubmit,
}: ModalRegistroComprobanteProps) => {
  const { notifyError } = useNotify();

  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [valorizaciones, setValorizaciones] = useState<Array<{
    id: number;
    numero_correlativo: string;
    total_dolares: number;
    monto_anticipos: number;
  }>>([]);
  const [loadingValorizaciones, setLoadingValorizaciones] = useState(false);
  const [idValorizacion, setIdValorizacion] = useState<string | null>(null);

  const [serie, setSerie] = useState("");
  const [numero, setNumero] = useState("");
  const [fechaEmision, setFechaEmision] = useState<Date | null>(new Date());
  const [porcentajeIgv, setPorcentajeIgv] = useState<number | string>(18);
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState<number | string>(10);
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const [tipoCambio, setTipoCambio] = useState<{
    id: number;
    valor_venta: number;
  } | null>(null);
  const [loadingTipoCambio, setLoadingTipoCambio] = useState(false);
  const [modalTipoCambioOpened, setModalTipoCambioOpened] = useState(false);

  const fechaEmisionStr = toDateString(fechaEmision);

  useEffect(() => {
    if (!opened) return;
    queueMicrotask(() => {
      setIdProveedor(null);
      setIdValorizacion(null);
      setValorizaciones([]);
      setSerie("");
      setNumero("");
      setFechaEmision(new Date());
      setPorcentajeIgv(18);
      setPorcentajeDetraccion(10);
      setEvidencias([]);
      setTipoCambio(null);
    });
  }, [opened]);

  useEffect(() => {
    if (idProveedor) {
      queueMicrotask(() => setLoadingValorizaciones(true));
      AuxService.get_valorizaciones_aprobadas_por_proveedor(Number(idProveedor))
        .then((res) => {
          if (res.success && res.data) {
            setValorizaciones(res.data);
          } else {
            setValorizaciones([]);
          }
        })
        .catch((e) => console.error("Error valorizaciones:", e))
        .finally(() => setLoadingValorizaciones(false));
    } else {
      queueMicrotask(() => {
        setValorizaciones([]);
        setIdValorizacion(null);
      });
    }
  }, [idProveedor]);

  /**
   * Lookup del Tipo de Cambio por la fecha_emision.
   * - Se dispara al abrir el modal (opened=true) o al cambiar la fecha.
   * - Usa un token de cancelación para evitar race conditions al cambiar rápido la fecha.
   */
  const consultarTipoCambio = useCallback((fechaStr: string) => {
    if (!fechaStr) {
      queueMicrotask(() => setTipoCambio(null));
      return;
    }
    queueMicrotask(() => setLoadingTipoCambio(true));
    let cancelled = false;
    AuxService.get_tipo_cambio_por_fecha(fechaStr)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setTipoCambio({ id: res.data.id, valor_venta: res.data.valor_venta });
        } else {
          setTipoCambio(null);
        }
      })
      .catch((e) => console.error("Error tipo cambio:", e))
      .finally(() => {
        if (!cancelled) setLoadingTipoCambio(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!opened) return;
    if (!fechaEmisionStr) {
      queueMicrotask(() => setTipoCambio(null));
      return;
    }
    const cancel = consultarTipoCambio(fechaEmisionStr);
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [opened, fechaEmisionStr, consultarTipoCambio]);

  const valorizacionSeleccionada = useMemo(
    () => valorizaciones.find((v) => String(v.id) === idValorizacion),
    [valorizaciones, idValorizacion],
  );

  const resumenCalcs = useMemo(() => {
    if (!valorizacionSeleccionada || !tipoCambio) {
      return null;
    }
    const totalDolares = Number(valorizacionSeleccionada.total_dolares);
    const totalAnticipos = Number(valorizacionSeleccionada.monto_anticipos);
    const tcVenta = tipoCambio.valor_venta;
    const totalSoles = totalDolares * tcVenta;
    const baseDetraccion = Math.max(totalDolares - totalAnticipos, 0);
    const montoDetraccion = baseDetraccion * (Number(porcentajeDetraccion) / 100);
    const montoNeto = totalDolares - totalAnticipos - montoDetraccion;

    return {
      totalDolares,
      totalAnticipos,
      tcVenta,
      totalSoles,
      montoDetraccion,
      montoNeto,
    };
  }, [valorizacionSeleccionada, tipoCambio, porcentajeDetraccion]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!idValorizacion || !fechaEmisionStr) {
      notifyError("Complete todos los campos requeridos.");
      return;
    }
    if (!tipoCambio) {
      notifyError("Debe existir un tipo de cambio registrado para la fecha de emisión.");
      return;
    }

    const parsed = comprobanteSchema.safeParse({
      id_valorizacion_compra: Number(idValorizacion),
      serie: serie.trim(),
      numero: numero.trim(),
      fecha_emision: fechaEmisionStr,
      porcentaje_igv: Number(porcentajeIgv) / 100,
      porcentaje_detraccion: Number(porcentajeDetraccion) / 100,
    });

    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || "Datos inválidos");
      return;
    }

    const ok = await onSubmit({
      ...parsed.data,
      evidencias: evidencias.length > 0 ? evidencias : undefined,
    });

    if (ok) {
      handleClose();
    }
  };

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleClose}
        title="Generar Comprobante"
        size="xl"
        validateClose
      >
        <Stack gap="md">
          <Group grow align="end">
            <DateInput
              label="Fecha Emisión"
              value={fechaEmision}
              onChange={(v) => setFechaEmision(v as Date | null)}
              valueFormat="DD/MM/YYYY"
              size="xs"
              radius="lg"
              required
              maxDate={new Date()}
            />
            <TextInput
              label="Serie"
              placeholder="N° SERIE"
              value={serie}
              onChange={(e) => setSerie(e.currentTarget.value.toUpperCase())}
              size="xs"
              radius="lg"
              required
            />
            <TextInput
              label="Número"
              placeholder="N° COMPROBANTE"
              value={numero}
              onChange={(e) => setNumero(e.currentTarget.value)}
              size="xs"
              radius="lg"
              required
            />
          </Group>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Proveedor"
                placeholder={loadingProveedores ? "Cargando..." : "Elija una opción..."}
                data={proveedores.map((p) => ({
                  value: String(p.id_proveedor),
                  label: p.razon_social,
                }))}
                value={idProveedor}
                onChange={setIdProveedor}
                disabled={loadingProveedores}
                rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Valorización"
                placeholder={
                  !idProveedor
                    ? "Seleccione un proveedor primero"
                    : loadingValorizaciones
                      ? "Cargando..."
                      : "Elija opciones..."
                }
                data={valorizaciones.map((v) => ({
                  value: String(v.id),
                  label: `${v.numero_correlativo} — Total $${v.total_dolares.toFixed(2)}`,
                }))}
                value={idValorizacion}
                onChange={setIdValorizacion}
                disabled={!idProveedor || loadingValorizaciones}
                rightSection={loadingValorizaciones ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="lg"
                comboboxProps={{ withinPortal: true }}
                required
              />
            </Grid.Col>
          </Grid>

          <Group grow align="end" wrap="nowrap">
            <NumberInput
              label="% IGV"
              suffix=" %"
              decimalScale={2}
              min={0}
              max={100}
              value={porcentajeIgv}
              onChange={setPorcentajeIgv}
              size="xs"
              radius="lg"
            />
            <NumberInput
              label="% Detracción"
              suffix=" %"
              decimalScale={2}
              min={0}
              max={100}
              value={porcentajeDetraccion}
              onChange={setPorcentajeDetraccion}
              size="xs"
              radius="lg"
            />
            <Group align="end" wrap="nowrap" className="flex-1 min-w-0">
              <NumberInput
                label="Tipo de Cambio (Venta)"
                value={tipoCambio ? tipoCambio.valor_venta : ""}
                readOnly
                decimalScale={3}
                fixedDecimalScale
                size="xs"
                radius="lg"
                className="flex-1"
                rightSection={loadingTipoCambio ? <Loader size={16} /> : undefined}
                placeholder={loadingTipoCambio ? "Buscando..." : "No registra"}
              />
              <Tooltip
                label={
                  tipoCambio
                    ? `Tipo de cambio del ${fechaEmisionStr}`
                    : "Registrar tipo de cambio"
                }
              >
                <ActionIcon
                  size="lg"
                  variant="light"
                  color={tipoCambio ? "teal" : "yellow"}
                  onClick={() => setModalTipoCambioOpened(true)}
                  disabled={!fechaEmisionStr}
                >
                  <IconCoin size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {!tipoCambio && fechaEmisionStr && (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
              No existe tipo de cambio para esta fecha. Usa el botón de moneda para registrar uno.
            </Alert>
          )}

          {resumenCalcs && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
              <div>
                <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Total Comprobante</Text>
                <Text fz="sm" fw={700} c="emerald.4">$ {resumenCalcs.totalDolares.toFixed(2)}</Text>
              </div>
              <div>
                <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Total Soles</Text>
                <Text fz="sm" fw={700} c="cyan.4">S/ {resumenCalcs.totalSoles.toFixed(2)}</Text>
              </div>
              <div>
                <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Anticipos</Text>
                <Text fz="sm" fw={700} c="indigo.4">$ {resumenCalcs.totalAnticipos.toFixed(2)}</Text>
              </div>
              <div>
                <Text fz={10} c="dimmed" tt="uppercase" fw={700}>Neto a Pagar</Text>
                <Text fz="sm" fw={700} c="teal.4">$ {resumenCalcs.montoNeto.toFixed(2)}</Text>
              </div>
            </div>
          )}

          <MultiFilePicker
            label="Evidencias"
            files={evidencias}
            onFilesChange={setEvidencias}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleClose} radius="lg" size="xs" disabled={submitting}>
              Cerrar
            </Button>
            <Button
              color="indigo"
              onClick={handleSubmit}
              loading={submitting}
              radius="lg"
              size="xs"
              disabled={!idProveedor || !idValorizacion || !tipoCambio}
            >
              Grabar Comprobante
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalRegistroTipoCambio
        opened={modalTipoCambioOpened}
        onClose={() => setModalTipoCambioOpened(false)}
        fecha={fechaEmisionStr}
        onCreated={() => {
          AuxService.get_tipo_cambio_por_fecha(fechaEmisionStr).then((res) => {
            if (res.success && res.data) {
              setTipoCambio({ id: res.data.id, valor_venta: res.data.valor_venta });
            }
          });
        }}
      />
    </>
  );
};