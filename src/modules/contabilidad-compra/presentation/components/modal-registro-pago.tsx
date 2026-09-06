import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconArrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { MedioPagoComprobante } from "../../../../shared/enums/contabilidad-compra/medio-pago-comprobante";
import type { REQ_RegistrarPago } from "../../service/contabilidad-compra.requests";
import type { RES_ComprobanteCompra } from "../../service/contabilidad-compra.responses";

interface ModalRegistroPagoProps {
  opened: boolean;
  onClose: () => void;
  comprobante: RES_ComprobanteCompra;
  onSubmit: (payload: REQ_RegistrarPago) => Promise<RES_ComprobanteCompra | null>;
  submitting: boolean;
}

interface CuentaOption {
  id_cuenta_bancaria: number;
  banco: string;
  banco_abv: string;
  id_banco: number;
  numero_cuenta: string;
  moneda: string;
  es_para_detraccion?: boolean;
}

const isMonedaSoles = (moneda: string): boolean => {
  if (!moneda) return false;
  const m = moneda.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return m === "SOLES" || m === "SOL" || m === "PEN" || m === "S/" || m === "S/.";
};

const isMonedaDolares = (moneda: string): boolean => {
  if (!moneda) return false;
  const m = moneda.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return m === "DOLARES" || m === "DOLAR" || m === "USD" || m === "$" || m === "US$";
};

export const ModalRegistroPago = ({
  opened,
  onClose,
  comprobante,
  onSubmit,
  submitting,
}: ModalRegistroPagoProps) => {
  const { notifyError } = useNotify();

  const [esParaDetraccion, setEsParaDetraccion] = useState(() => {
    const netoSaldadoInit =
      (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
    const detraccionSaldadaInit =
      (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;
    if (netoSaldadoInit && !detraccionSaldadaInit) return true;
    if (detraccionSaldadaInit && !netoSaldadoInit) return false;
    return false;
  });
  const [fechaPago, setFechaPago] = useState<Date | null>(new Date());
  const [medioPago, setMedioPago] = useState<MedioPagoComprobante>(MedioPagoComprobante.Transferencia);
  const [monto, setMonto] = useState<number | string>("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [observacion, setObservacion] = useState("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const [cuentasEmpresa, setCuentasEmpresa] = useState<CuentaOption[]>([]);
  const [loadingCuentasEmpresa, setLoadingCuentasEmpresa] = useState(false);
  const [idBancoEmpresa, setIdBancoEmpresa] = useState<string | null>(null);
  const [idCuentaEmpresa, setIdCuentaEmpresa] = useState<string | null>(null);

  const [cuentasProveedor, setCuentasProveedor] = useState<CuentaOption[]>([]);
  const [loadingCuentasProveedor, setLoadingCuentasProveedor] = useState(false);
  const [idBancoProveedor, setIdBancoProveedor] = useState<string | null>(null);
  const [idCuentaProveedor, setIdCuentaProveedor] = useState<string | null>(null);

  const calcPorPagar = useCallback(
    (esDetraccion: boolean): number =>
      Math.max(
        esDetraccion
          ? comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion
          : comprobante.monto_neto - comprobante.avance_pago_neto,
        0,
      ),
    [
      comprobante.monto_detraccion_soles,
      comprobante.avance_pago_detraccion,
      comprobante.monto_neto,
      comprobante.avance_pago_neto,
    ],
  );

  const toDateTimeString = (value: Date | null) => {
    if (!value) return null;
    const d = dayjs(value);
    if (!d.isValid()) return null;
    return d.format("YYYY-MM-DD HH:mm:ss");
  };

  const wasOpenedRef = useRef(false);

  useEffect(() => {
    if (!opened) {
      wasOpenedRef.current = false;
      return;
    }
    if (!wasOpenedRef.current) {
      wasOpenedRef.current = true;
      queueMicrotask(() => {
        const netoSaldadoInit =
          (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
        const detraccionSaldadaInit =
          (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;
        const initDetraccion = netoSaldadoInit && !detraccionSaldadaInit;

        setEsParaDetraccion(initDetraccion);
        setFechaPago(new Date());
        setMedioPago(MedioPagoComprobante.Transferencia);
        setMonto(calcPorPagar(initDetraccion));
        setNumeroOperacion("");
        setObservacion("");
        setEvidencias([]);
        setIdBancoEmpresa(null);
        setIdCuentaEmpresa(null);
        setIdBancoProveedor(null);
        setIdCuentaProveedor(null);
      });
    }
  }, [
    opened,
    calcPorPagar,
    comprobante.monto_neto,
    comprobante.avance_pago_neto,
    comprobante.monto_detraccion_soles,
    comprobante.avance_pago_detraccion,
  ]);

  useEffect(() => {
    if (!opened) return;
    queueMicrotask(() => {
      setMonto(calcPorPagar(esParaDetraccion));
      setIdBancoEmpresa(null);
      setIdCuentaEmpresa(null);
      setIdBancoProveedor(null);
      setIdCuentaProveedor(null);
    });
  }, [esParaDetraccion, opened, calcPorPagar]);

  // Cargar cuentas empresa filtradas por moneda
  useEffect(() => {
    if (!opened) return;
    const moneda = esParaDetraccion ? "Soles" : "Dólares";
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoadingCuentasEmpresa(true);
    });
    AuxService.get_cuentas_bancarias_empresa_por_moneda(moneda, esParaDetraccion)
      .then((res) => {
        if (cancelled) return;
        setCuentasEmpresa(Array.isArray(res) ? res : []);
      })
      .catch((e: unknown) => console.error("Error cuentas empresa:", e))
      .finally(() => {
        if (!cancelled) setLoadingCuentasEmpresa(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esParaDetraccion, opened]);

  // Cargar cuentas proveedor del proveedor del comprobante
  useEffect(() => {
    if (!opened || !comprobante?.id_proveedor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoadingCuentasProveedor(true);
    });
    AuxService.get_cuentas_bancarias_proveedor(comprobante.id_proveedor)
      .then((res) => {
        if (cancelled) return;
        const lista = Array.isArray(res) ? res : [];
        setCuentasProveedor(
          lista.map((c) => ({
            id_cuenta_bancaria: c.id,
            banco: c.banco_nombre ?? "",
            banco_abv: "",
            id_banco: Number(c.id_banco),
            numero_cuenta: c.numero_cuenta,
            moneda: c.moneda,
            es_para_detraccion: Boolean(c.es_para_detraccion),
          })),
        );
      })
      .catch((e: unknown) => console.error("Error cuentas proveedor:", e))
      .finally(() => {
        if (!cancelled) setLoadingCuentasProveedor(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opened, comprobante?.id_proveedor]);

  const cuentasEmpresaMoneda = useMemo(() => {
    if (!esParaDetraccion) {
      return cuentasEmpresa.filter((c) => isMonedaDolares(c.moneda));
    }
    return cuentasEmpresa.filter((c) => isMonedaSoles(c.moneda));
  }, [cuentasEmpresa, esParaDetraccion]);

  const cuentasProveedorMoneda = useMemo(() => {
    if (!esParaDetraccion) {
      return cuentasProveedor.filter((c) => isMonedaDolares(c.moneda) && !c.es_para_detraccion);
    }
    return cuentasProveedor.filter((c) => isMonedaSoles(c.moneda) || c.es_para_detraccion);
  }, [cuentasProveedor, esParaDetraccion]);

  const bancosEmpresa = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
    cuentasEmpresaMoneda.forEach((c) => {
      const idBancoNum = Number(c.id_banco);
      if (!map.has(idBancoNum)) {
        map.set(idBancoNum, { id: idBancoNum, nombre: c.banco });
      }
    });
    return Array.from(map.values());
  }, [cuentasEmpresaMoneda]);

  const bancosProveedor = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
    cuentasProveedorMoneda.forEach((c) => {
      const idBancoNum = Number(c.id_banco);
      if (!map.has(idBancoNum)) {
        map.set(idBancoNum, { id: idBancoNum, nombre: c.banco || "Banco" });
      }
    });
    return Array.from(map.values());
  }, [cuentasProveedorMoneda]);

  const cuentasEmpresaFiltradas = useMemo(
    () => cuentasEmpresaMoneda.filter((c) => !idBancoEmpresa || Number(c.id_banco) === Number(idBancoEmpresa)),
    [cuentasEmpresaMoneda, idBancoEmpresa],
  );

  const cuentasProveedorFiltradas = useMemo(
    () => cuentasProveedorMoneda.filter((c) => !idBancoProveedor || Number(c.id_banco) === Number(idBancoProveedor)),
    [cuentasProveedorMoneda, idBancoProveedor],
  );

  const porPagar = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto);

  const equivSoles = esParaDetraccion
    ? (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion)
    : (comprobante.monto_neto - comprobante.avance_pago_neto) * comprobante.tipo_cambio_venta;

  const netoSaldado =
    (comprobante.monto_neto - comprobante.avance_pago_neto) <= 0.01;
  const detraccionSaldada =
    (comprobante.monto_detraccion_soles - comprobante.avance_pago_detraccion) <= 0.01;
  const switchForzado = netoSaldado || detraccionSaldada;

  useEffect(() => {
    if (!opened) return;
    if (netoSaldado && detraccionSaldada) return;
    queueMicrotask(() => {
      if (netoSaldado && !detraccionSaldada) {
        setEsParaDetraccion(true);
        setIdBancoEmpresa(null);
        setIdCuentaEmpresa(null);
        setIdBancoProveedor(null);
        setIdCuentaProveedor(null);
      } else if (detraccionSaldada && !netoSaldado) {
        setEsParaDetraccion(false);
        setIdBancoEmpresa(null);
        setIdCuentaEmpresa(null);
        setIdBancoProveedor(null);
        setIdCuentaProveedor(null);
      }
    });
  }, [opened, netoSaldado, detraccionSaldada]);

  const handleSubmit = async () => {
    if (submitting) return;
    const montoNum = typeof monto === "number" ? monto : Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      notifyError("El monto pagado debe ser mayor a 0.");
      return;
    }
    if (montoNum > porPagar + 0.0001) {
      notifyError(`El monto excede el saldo pendiente (${porPagar.toFixed(2)}).`);
      return;
    }
    if (medioPago !== MedioPagoComprobante.Efectivo && numeroOperacion.trim().length === 0) {
      notifyError("El número de operación es obligatorio para Transferencia/Depósito.");
      return;
    }

    const fechaHora = toDateTimeString(fechaPago);

    const actualizado = await onSubmit({
      id_cuenta_bancaria_empresa: idCuentaEmpresa ? Number(idCuentaEmpresa) : null,
      id_cuenta_bancaria_proveedor: idCuentaProveedor ? Number(idCuentaProveedor) : null,
      es_para_detraccion: esParaDetraccion,
      medio_pago: medioPago,
      monto_pagado: montoNum,
      fecha_hora_pago: fechaHora ?? undefined,
      numero_operacion: numeroOperacion.trim() || null,
      observacion: observacion.trim() || null,
      evidencias: evidencias.length > 0 ? evidencias : undefined,
    });

    if (actualizado) {
      const todoSaldado =
        (actualizado.monto_neto - actualizado.avance_pago_neto) <= 0.01 &&
        (actualizado.monto_detraccion_soles - actualizado.avance_pago_detraccion) <= 0.01;
      if (todoSaldado) {
        onClose();
      } else {
        setNumeroOperacion("");
        setObservacion("");
        setEvidencias([]);
        setIdBancoEmpresa(null);
        setIdCuentaEmpresa(null);
        setIdBancoProveedor(null);
        setIdCuentaProveedor(null);
      }
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Nuevo Pago — ${comprobante.codigo_completo}`}
      rightSection={
        <Switch
          label={esParaDetraccion ? "Pago de Detracción" : "Pago de Neto"}
          checked={esParaDetraccion}
          disabled={switchForzado}
          onChange={(e) => setEsParaDetraccion(e.currentTarget.checked)}
          color="yellow"
          size="xs"
          styles={{
            label: { color: "#e4e4e7", fontWeight: 600, fontSize: 12 },
          }}
        />
      }
      size="xl"
    >
      <Stack gap="md">
        {/* Cuentas Origen -> Destino */}
        <Group align="center" wrap="nowrap" gap="xs">
          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80 flex-1">
            <Stack gap="xs">
              <Text fz={11} fw={700} tt="uppercase" c="indigo.4" className="tracking-wider">
                Cuenta Origen (Empresa)
              </Text>
              <Select
                label="Banco"
                placeholder={loadingCuentasEmpresa ? "Cargando..." : "Elija una opción..."}
                data={bancosEmpresa.map((b) => ({ value: String(b.id), label: b.nombre }))}
                value={idBancoEmpresa}
                onChange={setIdBancoEmpresa}
                disabled={loadingCuentasEmpresa || bancosEmpresa.length === 0}
                rightSection={loadingCuentasEmpresa ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label="Cuenta"
                placeholder={
                  !idBancoEmpresa
                    ? "Seleccione banco"
                    : cuentasEmpresaFiltradas.length === 0
                      ? esParaDetraccion
                        ? "Sin cuentas en soles"
                        : "Sin cuentas en dólares"
                      : "Seleccione cuenta"
                }
                data={cuentasEmpresaFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} — ${c.moneda}`,
                }))}
                value={idCuentaEmpresa}
                onChange={setIdCuentaEmpresa}
                disabled={!idBancoEmpresa || cuentasEmpresaFiltradas.length === 0}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
            </Stack>
          </Paper>

          <div className="flex items-center justify-center p-1">
            <IconArrowRight size={22} className="text-indigo-400 opacity-80" />
          </div>

          <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80 flex-1">
            <Stack gap="xs">
              <Text fz={11} fw={700} tt="uppercase" c="amber.4" className="tracking-wider">
                Cuenta Destino (Proveedor)
              </Text>
              <Select
                label="Banco"
                placeholder={loadingCuentasProveedor ? "Cargando..." : "Elija una opción..."}
                data={bancosProveedor.map((b) => ({ value: String(b.id), label: b.nombre }))}
                value={idBancoProveedor}
                onChange={setIdBancoProveedor}
                disabled={loadingCuentasProveedor || bancosProveedor.length === 0}
                rightSection={loadingCuentasProveedor ? <Loader size={16} /> : undefined}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label="Cuenta"
                placeholder={
                  !idBancoProveedor
                    ? "Seleccione banco"
                    : cuentasProveedorFiltradas.length === 0
                      ? esParaDetraccion
                        ? "Sin cuentas en soles"
                        : "Sin cuentas en dólares"
                      : "Seleccione cuenta"
                }
                data={cuentasProveedorFiltradas.map((c) => ({
                  value: String(c.id_cuenta_bancaria),
                  label: `${c.numero_cuenta} — ${c.moneda}`,
                }))}
                value={idCuentaProveedor}
                onChange={setIdCuentaProveedor}
                disabled={!idBancoProveedor || cuentasProveedorFiltradas.length === 0}
                searchable
                clearable
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
              />
            </Stack>
          </Paper>
        </Group>

        {/* Detalles del Pago */}
        <Paper p="sm" radius="lg" className="bg-zinc-900/40 border border-zinc-800/80">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text fz={11} fw={700} tt="uppercase" c="dimmed" className="tracking-wider">
                Detalles de la Operación
              </Text>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <Text fz={10} c="dimmed" fw={700}>PENDIENTE:</Text>
                <Text fz={12} fw={800} c={esParaDetraccion ? "yellow.4" : "emerald.4"}>
                  {esParaDetraccion ? `S/ ${porPagar.toFixed(2)}` : `$ ${porPagar.toFixed(2)}`}
                </Text>
                {!esParaDetraccion && (
                  <Text fz={10} c="dimmed">(Equiv. S/ {equivSoles.toFixed(2)})</Text>
                )}
              </div>
            </Group>

            <Group grow align="flex-start" gap="md">
              <DateTimePicker
                label="Fecha Pago"
                value={fechaPago}
                onChange={(v) => setFechaPago(v as Date | null)}
                valueFormat="DD/MM/YYYY HH:mm"
                size="xs"
                radius="md"
              />
              <Select
                label="Medio Pago *"
                data={Object.values(MedioPagoComprobante).map((v) => ({ value: v, label: v }))}
                value={medioPago}
                onChange={(v) => v && setMedioPago(v as MedioPagoComprobante)}
                size="xs"
                radius="md"
                comboboxProps={{ withinPortal: true }}
                required
              />
              <TextInput
                label="Nro. Operación"
                placeholder={medioPago === MedioPagoComprobante.Efectivo ? "Opcional" : "Ej: 123456"}
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.currentTarget.value.replace(/\D/g, ""))}
                size="xs"
                radius="md"
              />
              <NumberInput
                label={`Monto a Pagar (${esParaDetraccion ? "S/" : "$"}) *`}
                placeholder="0.00"
                prefix={esParaDetraccion ? "S/ " : "$ "}
                decimalScale={2}
                fixedDecimalScale
                min={0.01}
                max={porPagar}
                value={monto}
                onChange={setMonto}
                disabled={submitting}
                size="xs"
                radius="md"
              />
            </Group>
          </Stack>
        </Paper>

        {/* Evidencia y Observaciones */}
        <MultiFilePicker
          label="Evidencia"
          files={evidencias}
          onFilesChange={setEvidencias}
        />

        <Textarea
          label="Observación"
          autosize
          minRows={2}
          value={observacion}
          onChange={(e) => setObservacion(e.currentTarget.value)}
          size="xs"
          radius="md"
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} radius="lg" size="xs" disabled={submitting}>
            Cerrar
          </Button>
          <Button
            color="indigo"
            onClick={handleSubmit}
            loading={submitting}
            radius="lg"
            size="xs"
            disabled={submitting || !monto || porPagar <= 0}
          >
            Confirmar Pago
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};