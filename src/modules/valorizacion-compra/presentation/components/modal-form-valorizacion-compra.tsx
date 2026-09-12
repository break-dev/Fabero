import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Badge,
  ActionIcon,
  Loader,
  Box,
  Tooltip,
  ThemeIcon,
  NumberInput,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash, IconFileText, IconCoins, IconBuildingBank, IconCheck, IconX, IconPencil, IconPaperclip, IconCalendar } from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { useFormValorizacionCompra } from "../../hooks/useFormValorizacionCompra";
import { ModalAgregarLote } from "./modal-agregar-lote";
import { ModalSeleccionarAnticipos } from "./modal-seleccionar-anticipos";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";
import type { RES_ValorizacionCompra, RES_ValorizacionCompraDetalle } from "../../service/valorizacion-compra.responses";
import type { REQ_ValorizacionDetalleItem } from "../../service/valorizacion-compra.requests";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";

interface Props {
  opened: boolean;
  onClose: () => void;
  valorizacionEditar?: RES_ValorizacionCompra | null;
  onSuccess: () => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalFormValorizacionCompra = ({
  opened,
  onClose,
  valorizacionEditar,
  onSuccess,
}: Props) => {
  const [modalMotivoOpened, setModalMotivoOpened] = useState(false);
  const [motivoEdicion, setMotivoEdicion] = useState("");
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const handlePresionarGuardar = () => {
    if (isEdit) {
      setMotivoEdicion("");
      setModalMotivoOpened(true);
    } else {
      handleSubmit();
    }
  };

  const handleConfirmarMotivo = async () => {
    setModalMotivoOpened(false);
    await handleSubmit(motivoEdicion);
  };
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [detalleEditando, setDetalleEditando] = useState<{
    req: REQ_ValorizacionDetalleItem;
    display: RES_ValorizacionCompraDetalle;
    index: number;
  } | null>(null);

  const {
    loadingSubmit,
    loadingCatalogo,
    idProveedor,
    setIdProveedor,
    idConcesion,
    setIdConcesion,
    idCuentaBancaria,
    setIdCuentaBancaria,
    idCuentaDetraccion,
    setIdCuentaDetraccion,
    detalles,
    anticipos,
    concesiones,
    cuentasBancarias,
    cuentasDetraccion,
    anticiposCatalog,
    anticipoSaldoEfectivoMap,
    concesionSeleccionada,
    totalSubtotal,
    totalAnticipos,
    montoTransferencia,
    tipoPago,
    evidencias,
    setEvidencias,
    evidenciasExistentes,
    setEvidenciasExistentes,
    fechaHoraValorizacion,
    setFechaHoraValorizacion,
    montoPenalidad,
    setMontoPenalidad,
    montoFlete,
    setMontoFlete,
    modalLoteOpened,
    setModalLoteOpened,
    modalAnticiposOpened,
    setModalAnticiposOpened,
    handleAgregarDetalle,
    handleEditarDetalle,
    handleEliminarDetalle,
    handleConfirmarAnticipos,
    handleLimpiarAnticipos,
    handleSubmit,
  } = useFormValorizacionCompra({
    opened,
    valorizacionEditar,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (!opened) return;

    const cargarProv = async () => {
      setLoadingProveedores(true);
      try {
        if (valorizacionEditar) {
          const res = await AuxService.get_proveedores({ estado: EstadoBase.Activo });
          if (res.success && res.data) {
            setProveedores(res.data);
          }
        } else {
          const data = await AuxService.get_proveedores_valorizacion();
          setProveedores(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProveedores(false);
      }
    };

    cargarProv();
  }, [opened, valorizacionEditar]);

  const isEdit = !!valorizacionEditar;

  const tipoPagoMostrar = useMemo(() => {
    if (totalSubtotal <= 0) return null;
    return tipoPago;
  }, [totalSubtotal, tipoPago]);

  const anticipoSaldoMap = anticipoSaldoEfectivoMap;

  const anticipoExcedeSaldo = useMemo(() => {
    return anticipos.some((a) => {
      const saldo = anticipoSaldoMap.get(a.id_anticipo_proveedor);
      if (saldo === undefined) return false;
      return a.monto_retirado > saldo + 0.0001;
    });
  }, [anticipos, anticipoSaldoMap]);

  const handleAnticipoMontoChange = (index: number, value: number | string) => {
    const numVal = typeof value === "number" ? value : parseFloat(String(value)) || 0;
    const next = anticipos.map((a, idx) =>
      idx === index ? { ...a, monto_retirado: numVal } : a,
    );
    handleConfirmarAnticipos(next);
  };

  const modalTitle = (
    <Group gap="xs">
      <Text fw={700} fz="sm" c="white">
        {isEdit
          ? `Editar Valorización: N° ${valorizacionEditar.numero_correlativo} | ${valorizacionEditar.proveedor_nombre}`
          : "Nueva Valorización de Compra"}
      </Text>
    </Group>
  );

  const modalHeaderRight = (
    <Group gap="md" wrap="nowrap" align="center">
      <Select
        placeholder={loadingProveedores ? "Cargando..." : "[Seleccione Proveedor]"}
        disabled={loadingProveedores || isEdit}
        rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
        data={proveedores.map((p) => {
          const idVal = p.id_proveedor ?? (p as unknown as { id: number }).id;
          const doc = p.documento || (p as unknown as { ruc?: string }).ruc || "";
          return {
            value: String(idVal),
            label: doc ? `${doc} - ${p.razon_social}` : p.razon_social,
          };
        })}
        value={idProveedor ? String(idProveedor) : null}
        onChange={(val) => setIdProveedor(val ? Number(val) : null)}
        searchable
        size="xs"
        radius="lg"
        w={260}
        classNames={{
          ...fieldClasses,
          label: "text-zinc-400 mb-1 font-medium text-[10px] ml-1",
          input: "h-8 text-xs",
        }}
        comboboxProps={{ withinPortal: true }}
      />
      <Badge
        color="indigo"
        variant="filled"
        size="lg"
        radius="lg"
        className="h-8 px-3 text-xs font-bold uppercase tracking-wide"
      >
        {tipoPagoMostrar ? tipoPagoMostrar.toUpperCase() : "NINGUNO"}
      </Badge>
    </Group>
  );

  return (
    <>
      <ModalEstandar
      opened={opened}
      close={onClose}
      title={modalTitle}
      size="1250px"
      rightSection={modalHeaderRight}
    >
      <Stack gap="sm" mt="xs" pb="md">
        {/* 3 Paneles Separados: Concesión, Cuentas Bancarias, Anticipos y Pago */}
        <Grid gutter="sm">
          {/* Panel 1: Información Concesión */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
              <Stack gap="xs">
                <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                  <IconBuildingBank size={15} /> Información Concesión
                </Text>
                <Select
                  label="Concesión:"
                  placeholder={
                    loadingCatalogo ? "Cargando..." : "[Seleccione Concesión]"
                  }
                  disabled={loadingCatalogo || !idProveedor}
                  rightSection={loadingCatalogo ? <Loader size={16} /> : undefined}
                  data={concesiones.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  value={idConcesion ? String(idConcesion) : null}
                  onChange={(val) => setIdConcesion(val ? Number(val) : null)}
                  searchable
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                />

                {concesionSeleccionada ? (
                  <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-1">
                    <Group justify="space-between">
                      <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Código Único:</Text>
                      <Badge color="cyan" variant="outline" size="xs">
                        {concesionSeleccionada.codigo_reinfo || "-"}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>Procedencia:</Text>
                      <Text fz={11} c="white" fw={600}>
                        {concesionSeleccionada.procedencia || "-"}
                      </Text>
                    </Group>
                  </Box>
                ) : (
                  <Box p="xs" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center">
                    <Text fz={11} c="zinc.5">Sin concesión seleccionada</Text>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Panel 2: Cuentas Bancarias */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
              <Stack gap="xs">
                <Text fw={700} fz="xs" c="amber.4" className="flex items-center gap-1.5">
                  <IconBuildingBank size={15} /> Cuentas Bancarias
                </Text>
                <Select
                  label="Cuenta Bancaria (Soles/Dólares):"
                  placeholder="[Seleccione Cuenta]"
                  disabled={!idProveedor}
                  data={cuentasBancarias.map((cb) => ({
                    value: String(cb.id),
                    label: `${cb.banco_nombre} (${cb.moneda}) | N° ${cb.numero_cuenta}`,
                  }))}
                  value={idCuentaBancaria ? String(idCuentaBancaria) : null}
                  onChange={(val) =>
                    setIdCuentaBancaria(val ? Number(val) : null)
                  }
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                />
                <Select
                  label="Cuenta Detracción (Banco Nación):"
                  placeholder="[Seleccione Detracción]"
                  disabled={!idProveedor}
                  data={cuentasDetraccion.map((cd) => ({
                    value: String(cd.id),
                    label: `N° ${cd.numero_cuenta}`,
                  }))}
                  value={idCuentaDetraccion ? String(idCuentaDetraccion) : null}
                  onChange={(val) =>
                    setIdCuentaDetraccion(val ? Number(val) : null)
                  }
                  size="xs"
                  radius="lg"
                  classNames={fieldClasses}
                />

                {/* Card Resumen Monto a Transferir debajo de cuentas */}
                <Box p="xs" bg="#14532d/30" className="rounded-lg border border-emerald-800/80 mt-1">
                  <Group justify="space-between" align="center">
                    <Text fz={9} c="emerald.4" tt="uppercase" fw={700} className="tracking-tight">
                      Monto a Transferir:
                    </Text>
                    <Text fz="xs" fw={800} c="emerald.3" className="font-mono text-sm">
                      $ {montoTransferencia.toFixed(2)}
                    </Text>
                  </Group>
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Panel 3: Gestión de Anticipos */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 h-full flex flex-col justify-between">
              <Stack gap="xs" className="flex-1 flex flex-col">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap" className="min-w-0">
                    <IconCoins size={16} className="text-amber-400 shrink-0" />
                    <Text fw={700} fz="xs" c="amber.4" className="truncate">
                      Anticipos Relacionados ({anticipos.length})
                    </Text>
                  </Group>
                  <Group gap={4} wrap="nowrap" className="shrink-0">
                    <Tooltip
                      label={
                        !idProveedor
                          ? "Seleccione un proveedor primero"
                          : detalles.length === 0
                          ? "Debe agregar al menos un lote para aplicar anticipos"
                          : ""
                      }
                      disabled={!!idProveedor && detalles.length > 0}
                      withArrow
                    >
                      <Button
                        variant="light"
                        color="blue"
                        size="xs"
                        radius="lg"
                        disabled={!idProveedor || detalles.length === 0}
                        onClick={() => setModalAnticiposOpened(true)}
                        className="h-7 text-[11px] px-2.5 font-bold"
                      >
                        Seleccionar
                      </Button>
                    </Tooltip>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      radius="lg"
                      onClick={handleLimpiarAnticipos}
                      disabled={anticipos.length === 0}
                      className="h-7 text-[11px] px-2"
                    >
                      Limpiar
                    </Button>
                  </Group>
                </Group>

                <Box p="xs" bg="#27272a" className="rounded-lg border border-zinc-800 space-y-2 flex-1 flex flex-col">
                  <Group justify="space-between" align="center">
                    <Text fz={11} c="zinc.4" fw={700} className="uppercase tracking-wider">
                      Anticipos Aplicados:
                    </Text>
                    <Badge color="blue" size="sm" variant="filled" className="font-mono font-bold">
                      ${totalAnticipos.toFixed(2)}
                    </Badge>
                  </Group>

                  {anticipos.length > 0 ? (
                    <Stack gap="xs" className="max-h-56 overflow-y-auto pr-1 my-1">
                      {anticipos.map((ant, i) => {
                        const itemCatalog = anticiposCatalog.find(
                          (a) => a.id === ant.id_anticipo_proveedor,
                        );
                        const saldo = anticipoSaldoMap.get(ant.id_anticipo_proveedor);
                        const excede =
                          saldo !== undefined && ant.monto_retirado > saldo + 0.0001;
                        const facturaTitle =
                          ant.factura || itemCatalog?.factura || `Anticipo #${ant.id_anticipo_proveedor}`;

                        return (
                          <Paper
                            key={i}
                            p="xs"
                            radius="md"
                            className={`bg-zinc-900/80 border transition-all duration-200 shadow-sm ${
                              excede
                                ? "border-red-500/80 bg-red-950/20"
                                : "border-zinc-800 hover:border-zinc-700"
                            }`}
                          >
                            <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                              {/* Info de la Factura y Saldo */}
                              <Stack gap={2} className="min-w-0 flex-1">
                                <Group gap={6} wrap="nowrap" align="center">
                                  <ThemeIcon size={20} variant="light" color="amber" radius="sm" className="shrink-0">
                                    <IconCoins size={12} />
                                  </ThemeIcon>
                                  <Text fw={700} fz="xs" c="white" className="truncate font-mono">
                                    {facturaTitle}
                                  </Text>
                                </Group>
                                {saldo !== undefined ? (
                                  <Group gap={4} align="center">
                                    <Text fz={10} c="dimmed" fw={600}>
                                      Saldo disp:
                                    </Text>
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color={excede ? "red" : "emerald"}
                                      className="font-mono h-4 px-1.5"
                                    >
                                      ${saldo.toFixed(2)}
                                    </Badge>
                                  </Group>
                                ) : (
                                  <Text fz={10} c="dimmed" fw={500}>
                                    Monto aplicado a esta valorización
                                  </Text>
                                )}
                              </Stack>

                              {/* Input y Botón Eliminar */}
                              <Group gap={6} wrap="nowrap" align="center" className="shrink-0">
                                <Stack gap={2} align="end">
                                  <Text fz={9} c="dimmed" fw={700} className="uppercase tracking-widest">
                                    Monto ($)
                                  </Text>
                                  <NumberInput
                                    value={ant.monto_retirado}
                                    onChange={(val) => handleAnticipoMontoChange(i, val ?? 0)}
                                    min={0}
                                    max={saldo !== undefined ? saldo : undefined}
                                    prefix="$ "
                                    decimalScale={2}
                                    size="xs"
                                    radius="md"
                                    hideControls
                                    w={105}
                                    aria-label={`Monto del anticipo ${facturaTitle}`}
                                    classNames={{
                                      input: excede
                                        ? "border-red-500/80 focus:border-red-500 bg-zinc-950 text-red-300 font-mono font-bold text-xs h-7 text-right"
                                        : "bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white font-mono font-semibold text-xs h-7 text-right",
                                    }}
                                  />
                                </Stack>
                                <Tooltip label="Quitar anticipo" withArrow>
                                  <ActionIcon
                                    size="md"
                                    color="red"
                                    variant="light"
                                    radius="md"
                                    mt={14}
                                    onClick={() => {
                                      const next = anticipos.filter((_, idx) => idx !== i);
                                      handleConfirmarAnticipos(next);
                                    }}
                                    aria-label={`Quitar anticipo ${facturaTitle}`}
                                    className="hover:bg-red-500/20"
                                  >
                                    <IconX size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Group>
                            {excede && (
                              <Text fz={10} c="red.4" fw={600} mt={4} className="text-right">
                                ⚠️ El monto excede el saldo disponible (${saldo.toFixed(2)})
                              </Text>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Box p="md" bg="#18181b" className="rounded-lg border border-dashed border-zinc-800 text-center my-auto py-6">
                      <Group justify="center" gap="xs">
                        <IconCoins size={18} className="text-zinc-600" />
                        <Text fz="xs" c="zinc.5" fs="italic" fw={500}>
                          Sin anticipos aplicados.
                        </Text>
                      </Group>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Lotes Valorizados (Grid de Cards Compactas Mejoradas) */}
        <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 space-y-3">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconFileText size={16} className="text-amber-400" />
              <Text fw={700} fz="xs" c="white">
                Lotes Valorizados ({detalles.length})
              </Text>
            </Group>
            <Group gap="md" align="center" wrap="nowrap">
              <Group gap={6} wrap="nowrap" align="center">
                <IconCalendar size={14} className="text-zinc-500" />
                <Text fz={10} fw={600} c="zinc.500" tt="uppercase" lts="0.04em">
                  Fecha Valorización:
                </Text>
                <CustomDatePicker
                  value={fechaHoraValorizacion ?? undefined}
                  onChange={(d) => {
                    if (!d) {
                      setFechaHoraValorizacion(null);
                      return;
                    }
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    const now = new Date();
                    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                    setFechaHoraValorizacion(iso);
                  }}
                  placeholder="DD/MM/YYYY"
                  style={{ width: 150 }}
                />
              </Group>
              <Button
                leftSection={<IconPlus size={16} />}
                color="indigo"
                size="xs"
                radius="lg"
                disabled={!idProveedor}
                onClick={() => setModalLoteOpened(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
              >
                Nuevo Lote
              </Button>
            </Group>
          </Group>

          {detalles.length === 0 ? (
            <Box p="md" bg="#27272a" className="rounded-lg border border-dashed border-zinc-800 text-center">
              <Text fz="xs" c="zinc.4">
                No hay lotes agregados a la valorización. Haga clic en "+ Nuevo Lote" para comenzar.
              </Text>
            </Box>
          ) : (
            <Stack gap="xs" className="max-h-95 overflow-y-auto pr-1">
              {detalles.map((d, idx) => {
                const esOro = d.display.elemento_quimico === "Oro";
                const accentBorder = esOro ? "border-l-yellow-500/70" : "border-l-slate-400/70";
                return (
                  <Paper
                    key={idx}
                    p="xs"
                    radius="md"
                    bg="#18181b"
                    className={`border border-zinc-800 border-l-2 ${accentBorder} hover:border-indigo-500/60 transition-all duration-200`}
                  >
                    {/* Header del Lote */}
                    <Group justify="space-between" align="center" pb="xs">
                      <Group gap="xs" wrap="nowrap" className="min-w-0">
                        <Badge
                          color={esOro ? "yellow" : "gray"}
                          variant="filled"
                          size="xs"
                          fw={700}
                        >
                          {d.display.elemento_quimico}
                        </Badge>
                        <Text fw={700} fz="xs" c="white" className="font-mono truncate">
                          Lote: {d.display.lote_correlativo || "-"}
                        </Text>
                        {d.display.grr && (
                          <Badge variant="outline" color="cyan" size="xs">
                            G.R.R: {d.display.grr}
                          </Badge>
                        )}
                        {d.display.grt && (
                          <Badge variant="outline" color="indigo" size="xs">
                            G.R.T: {d.display.grt}
                          </Badge>
                        )}
                        {d.display.fecha_ingreso && (
                          <Text fz={10} c="dimmed" className="shrink-0">
                            | Ingreso: {d.display.fecha_ingreso}
                          </Text>
                        )}
                      </Group>

                      <Group gap={4} wrap="nowrap" className="shrink-0">
                        <Tooltip label="Editar condiciones">
                          <ActionIcon
                            color="cyan"
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                              setDetalleEditando({
                                req: d.req,
                                display: d.display,
                                index: idx,
                              });
                              setModalLoteOpened(true);
                            }}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar Lote">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            size="xs"
                            onClick={() => handleEliminarDetalle(idx)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    {/* Grid Estructurada de Métricas del Lote */}
                    <Grid pt="xs" gutter="xs" align="center">
                      {/* TMH, H2O, TMS */}
                      <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                        <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>TMH (t):</Text>
                            <Text fz={11} fw={700} c="white">{(d.display.tmh / 1000).toFixed(3)}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>% H2O:</Text>
                            <Text fz={11} fw={700} c="cyan.3">{d.display.ley_humedad.toFixed(2)}%</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>TMS (t):</Text>
                            <Text fz={11} fw={700} c="emerald.3">{(d.display.tms / 1000).toFixed(3)}</Text>
                          </Group>
                        </Box>
                      </Grid.Col>

                      {/* Ley y Recuperación */}
                      <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                        <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Ley (oz/tc):</Text>
                            <Text fz={11} fw={700} c="yellow.3">{d.display.ley.toFixed(4)}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>REC (%):</Text>
                            <Text fz={11} fw={700} c="amber.3">{d.display.recuperacion.toFixed(2)}%</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Factor:</Text>
                            <Text fz={11} fw={700} c="white">{d.display.factor.toFixed(4)}</Text>
                          </Group>
                        </Box>
                      </Grid.Col>

                      {/* Deducciones y Maquila */}
                      <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                        <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 space-y-0.5">
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Inter / Des.Inter:</Text>
                            <Text fz={11} fw={700} c="white">${d.display.inter.toFixed(2)} / ${d.display.des_inter.toFixed(2)}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text fz={9} c="zinc.5" tt="uppercase" fw={600}>Maquila / React:</Text>
                            <Text fz={11} fw={700} c="white">${d.display.maquila.toFixed(2)} / ${d.display.consumo.toFixed(2)}</Text>
                          </Group>
                        </Box>
                      </Grid.Col>

                      {/* Precios y Subtotal */}
                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <Group justify="end" gap="xs">
                          <Box p="xs" bg="#0f0f12" className="rounded border border-zinc-800 text-right flex-1">
                            <Text fz={9} c="zinc.4" tt="uppercase" fw={600}>Precio / TN</Text>
                            <Text fz="xs" fw={700} c="white">$ {d.display.precio_por_tonelada.toFixed(2)}</Text>
                          </Box>
                          <Box p="xs" bg="#14532d/40" className="rounded border border-emerald-800/80 text-right flex-1">
                            <Text fz={9} c="emerald.4" tt="uppercase" fw={700}>Subtotal Lote</Text>
                            <Text fz="sm" fw={800} c="emerald.3">$ {d.display.subtotal.toFixed(2)}</Text>
                          </Box>
                        </Group>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* Footer Total General */}
          <Group justify="space-between" align="center" pt="xs" className="border-t border-zinc-800">
            <Text fz="xs" c="zinc.4">
              Total Lotes: <span className="text-white font-semibold">{detalles.length}</span>
            </Text>
            <Group gap="md" align="center" wrap="wrap">
              <Group gap={6} align="center" wrap="nowrap">
                <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                  Subtotal:
                </Text>
                <Text fz="xs" fw={700} c="white" className="font-mono">
                  ${totalSubtotal.toFixed(2)}
                </Text>
              </Group>
              <Group gap={4} align="center" wrap="nowrap">
                <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                  Penalidad:
                </Text>
                <NumberInput
                  value={montoPenalidad}
                  onChange={(val) =>
                    setMontoPenalidad(
                      typeof val === "number" ? val : parseFloat(String(val)) || 0,
                    )
                  }
                  min={0}
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  hideControls
                  size="xs"
                  radius="md"
                  w={130}
                  disabled={loadingSubmit}
                  classNames={{
                    input:
                      "bg-zinc-950 border-zinc-800 focus:border-amber-500 text-amber-400 font-mono font-semibold text-xs h-7 text-right",
                  }}
                />
              </Group>
              <Group gap={4} align="center" wrap="nowrap">
                <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                  Flete:
                </Text>
                <NumberInput
                  value={montoFlete}
                  onChange={(val) =>
                    setMontoFlete(
                      typeof val === "number" ? val : parseFloat(String(val)) || 0,
                    )
                  }
                  min={0}
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  hideControls
                  size="xs"
                  radius="md"
                  w={130}
                  disabled={loadingSubmit}
                  classNames={{
                    input:
                      "bg-zinc-950 border-zinc-800 focus:border-cyan-500 text-cyan-400 font-mono font-semibold text-xs h-7 text-right",
                  }}
                />
              </Group>
              <Group gap={6} align="center" wrap="nowrap">
                <Text fz={10} c="zinc.5" tt="uppercase" fw={700}>
                  Total Valorización:
                </Text>
                <Text fz="sm" fw={800} c="emerald.4" className="font-mono">
                  ${(totalSubtotal - montoPenalidad - montoFlete).toFixed(2)}
                </Text>
              </Group>
            </Group>
          </Group>
        </Paper>

        {/* Evidencias */}
        <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800 space-y-3">
          <Group gap="xs">
            <IconPaperclip size={16} className="text-amber-400" />
            <Text fw={700} fz="xs" c="white">
              Evidencias ({evidencias.length + evidenciasExistentes.length})
            </Text>
          </Group>
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            existingFiles={evidenciasExistentes}
            onRemoveExisting={(path: string) =>
              setEvidenciasExistentes((prev) =>
                prev.filter((e) => e.path_relativo !== path),
              )
            }
            label="Adjuntar evidencias / comprobantes (Opcional)"
          />
        </Paper>

          {/* Botones de Acción Formulario */}
          <Group justify="end" gap="xs" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              onClick={onClose}
              disabled={loadingSubmit}
              radius="lg"
              size="xs"
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              onClick={handlePresionarGuardar}
              loading={loadingSubmit}
              disabled={
                loadingSubmit ||
                !idProveedor ||
                detalles.length === 0 ||
                anticipoExcedeSaldo
              }
              radius="lg"
              size="xs"
              leftSection={<IconCheck size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-6"
            >
              {isEdit ? "Guardar Cambios" : "Registrar Valorización"}
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Motivo de Edición */}
      <ModalEstandar
        opened={modalMotivoOpened}
        close={() => setModalMotivoOpened(false)}
        title="Motivo de la Modificación"
        size="sm"
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Ingrese un motivo u observación para esta modificación (Opcional). Si lo deja en blanco, se guardará con la descripción por defecto.
          </Text>
          <TextInput
            label="Motivo o Justificación del Cambio"
            placeholder="Ej: Corrección de cuenta bancaria / actualización de parámetros..."
            value={motivoEdicion}
            onChange={(e) => setMotivoEdicion(e.currentTarget.value)}
            classNames={fieldClasses}
            data-autofocus
          />
          <Group justify="end" gap="xs" mt="xs">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setModalMotivoOpened(false)}
              size="xs"
              radius="lg"
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              onClick={handleConfirmarMotivo}
              loading={loadingSubmit}
              size="xs"
              radius="lg"
              leftSection={<IconCheck size={14} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Confirmar y Guardar
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Agregar Lote */}
      <ModalAgregarLote
        opened={modalLoteOpened}
        onClose={() => {
          setModalLoteOpened(false);
          setDetalleEditando(null);
        }}
        idProveedor={idProveedor}
        idValorizacionEdicion={valorizacionEditar?.id}
        existingDetalles={detalles.map((d) => ({
          id_lote_guia: d.req.id_lote_guia,
          elemento_quimico: d.req.elemento_quimico,
        }))}
        detalleEditar={detalleEditando}
        onAgregarLote={handleAgregarDetalle}
        onEditarLote={handleEditarDetalle}
        fechaHoraValorizacion={fechaHoraValorizacion}
      />

      {/* Modal Seleccionar Anticipos */}
      <ModalSeleccionarAnticipos
        opened={modalAnticiposOpened}
        onClose={() => setModalAnticiposOpened(false)}
        idProveedor={idProveedor}
        montoACubrir={totalSubtotal}
        selectedAnticipos={anticipos}
        anticipoSaldoEfectivoMap={anticipoSaldoEfectivoMap}
        onConfirmarAnticipos={handleConfirmarAnticipos}
      />
    </>
  );
};