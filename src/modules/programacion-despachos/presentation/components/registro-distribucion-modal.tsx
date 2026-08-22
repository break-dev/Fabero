import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBuilding,
  IconPlus,
  IconTruck,
  IconUser,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { AuxService } from "../../../../service/auxiliar.service";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { useNotify } from "../../../../hooks/useNotify";
import { useRegistroDistribucion } from "../../hooks/useRegistroDistribucion";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
} from "../../service/programacion-despachos.responses";
import {
  formatLocalDate,
  parseLocalDate,
} from "../../../../presentation/utils/local-date";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import type {
  RES_EmpresaTransporte,
} from "../../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_Sucursal } from "../../../../service/responses/sucursal";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { EmpresaTransporteResponse } from "../../../empresas-transporte/service/empresas-transporte.responses";
import type { EstadoBase } from "../../../../shared/enums/_generic/estado-base";

interface Props {
  opened: boolean;
  onClose: () => void;
  idDespacho: number;
  detallesDespacho: DespachoDetalleItem[];
  onSuccess: (result: CrearDistribucionResult) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export const RegistroDistribucionModal = ({
  opened,
  onClose,
  idDespacho,
  detallesDespacho,
  onSuccess,
}: Props) => {
  const { notifyError } = useNotify();
  const ctrl = useRegistroDistribucion(
    idDespacho,
    detallesDespacho,
    (result) => {
      onSuccess(result);
      onClose();
    },
  );

  const [sucursales, setSucursales] = useState<RES_Sucursal[]>([]);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

  // Estado de modales anidados para crear nuevos registros.
  const [modalCrearEmpresa, setModalCrearEmpresa] = useState(false);
  const [modalCrearTipoVehiculo, setModalCrearTipoVehiculo] = useState(false);
  const [modalCrearVehiculo, setModalCrearVehiculo] = useState(false);
  const [modalCrearConductor, setModalCrearConductor] = useState(false);

  useEffect(() => {
    if (!opened) {
      ctrl.reset();
      return;
    }
    let cancelled = false;
    ctrl.inicializarDetalles();

    setLoadingSucursales(true);
    setLoadingEmpresas(true);
    setLoadingVehiculos(true);
    setLoadingTipos(true);
    setLoadingConductores(true);

    AuxService.get_sucursales()
      .then((data) => {
        if (!cancelled) setSucursales(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar sucursales");
      })
      .finally(() => {
        if (!cancelled) setLoadingSucursales(false);
      });

    AuxService.get_empresas_transporte()
      .then((data) => {
        if (!cancelled) setEmpresas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar empresas de transporte");
      })
      .finally(() => {
        if (!cancelled) setLoadingEmpresas(false);
      });

    AuxService.get_vehiculos()
      .then((data) => {
        if (!cancelled) setVehiculos(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar vehículos");
      })
      .finally(() => {
        if (!cancelled) setLoadingVehiculos(false);
      });

    AuxService.get_tipos_vehiculo()
      .then((data) => {
        if (!cancelled) setTiposVehiculo(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar tipos de vehículo");
      })
      .finally(() => {
        if (!cancelled) setLoadingTipos(false);
      });

    AuxService.get_conductores()
      .then((data) => {
        if (!cancelled) setConductores(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar conductores");
      })
      .finally(() => {
        if (!cancelled) setLoadingConductores(false);
      });

    return () => {
      cancelled = true;
    };
  }, [opened]);

  const sucursalesData = sucursales.map((s) => ({ value: String(s.id_sucursal), label: s.nombre }));
  const empresasData = empresas.map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));
  const vehiculosData = vehiculos.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa ? `${v.placa}${v.tipo_vehiculo_nombre ? ` · ${v.tipo_vehiculo_nombre}` : ""}` : `Vehículo #${v.id_vehiculo}`,
  }));
  const tiposVehiculoData = tiposVehiculo.map((t) => ({
    value: String(t.id_tipo_vehiculo),
    label: t.nombre,
  }));
  const conductoresData = conductores.map((c) => ({
    value: String(c.id_conductor),
    label: c.nombre_completo,
  }));

  // Helpers para crear nuevos registros.
  const handleEmpresaCreada = (nueva: EmpresaTransporteResponse) => {
    const adapt: RES_EmpresaTransporte = {
      id_empresa_transporte: nueva.id,
      ruc: nueva.ruc,
      razon_social: nueva.razon_social,
      estado: nueva.estado,
    };
    setEmpresas((prev) => [...prev, adapt]);
    ctrl.setField("id_empresa_transporte", adapt.id_empresa_transporte);
    setModalCrearEmpresa(false);
  };
  const handleTipoVehiculoCreado = (nuevo: { id_tipo_vehiculo: number; nombre: string; estado: EstadoBase }) => {
    const adapt: RES_TipoVehiculo = {
      id_tipo_vehiculo: nuevo.id_tipo_vehiculo,
      nombre: nuevo.nombre,
      tiene_carreta: false,
      es_carreta: false,
      estado: nuevo.estado,
    };
    setTiposVehiculo((prev) => [...prev, adapt]);
    ctrl.setField("id_tipo_vehiculo", adapt.id_tipo_vehiculo);
    setModalCrearTipoVehiculo(false);
  };
  const handleVehiculoCreado = (nuevo: RES_Vehiculo) => {
    setVehiculos((prev) => [...prev, nuevo]);
    ctrl.setField("id_vehiculo", nuevo.id_vehiculo);
    setModalCrearVehiculo(false);
  };
  const handleConductorCreado = (nuevo: { id_conductor: number; nombre_completo: string; dni: string; numero_licencia?: string | null }) => {
    const adapt: RES_Conductor = {
      id_conductor: nuevo.id_conductor,
      dni: nuevo.dni,
      nombre_completo: nuevo.nombre_completo,
      numero_licencia: nuevo.numero_licencia ?? null,
    };
    setConductores((prev) => [...prev, adapt]);
    ctrl.setField("id_conductor", adapt.id_conductor);
    setModalCrearConductor(false);
  };

  // Vehículo requiere empresa y tipo ya elegidos (FKs).
  const vehiculoFormReady =
    ctrl.form.id_empresa_transporte > 0 && ctrl.form.id_tipo_vehiculo > 0;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Registrar Distribución"
      size="xl"
      validateClose={
        ctrl.form.detalles.some((d) => d.peso_tomado > 0) ||
        ctrl.form.id_sucursal > 0
      }
      closeConfirmationTitle="¿Cerrar sin guardar?"
    >
      <Stack gap="md">
        {ctrl.advertencias.length > 0 && (
          <Alert
            color="yellow"
            radius="lg"
            icon={<IconAlertTriangle size={16} />}
            title="Advertencias"
            classNames={{
              root: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200",
              title: "text-yellow-300 font-semibold",
              message: "text-yellow-200/90",
              icon: "text-yellow-400",
            }}
          >
            <Stack gap={4} mt={4}>
              {ctrl.advertencias.map((msg, idx) => (
                <Text key={idx} size="xs">
                  • {msg}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        <Grid gutter="sm">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Sucursal"
              placeholder={loadingSucursales ? "Cargando sucursales..." : "Seleccione la sucursal"}
              data={sucursalesData}
              value={ctrl.form.id_sucursal ? String(ctrl.form.id_sucursal) : null}
              onChange={(val) => ctrl.setField("id_sucursal", val ? Number(val) : 0)}
              leftSection={<IconBuilding className="w-4 h-4 text-zinc-500" />}
              withAsterisk
              required
              searchable
              radius="lg"
              disabled={loadingSucursales || ctrl.loading}
              rightSection={loadingSucursales ? <Loader size={16} /> : undefined}
              classNames={fieldClasses}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Empresa de Transporte"
                placeholder={loadingEmpresas ? "Cargando..." : "Seleccione"}
                data={empresasData}
                value={ctrl.form.id_empresa_transporte ? String(ctrl.form.id_empresa_transporte) : null}
                onChange={(val) => ctrl.setField("id_empresa_transporte", val ? Number(val) : 0)}
                leftSection={<IconTruckDelivery className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingEmpresas || ctrl.loading}
                rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nueva empresa de transporte" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearEmpresa(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nueva empresa de transporte"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Vehículo"
                placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione"}
                data={vehiculosData}
                value={ctrl.form.id_vehiculo ? String(ctrl.form.id_vehiculo) : null}
                onChange={(val) => {
                  ctrl.setField("id_vehiculo", val ? Number(val) : 0);
                  if (val) {
                    const v = vehiculos.find((x) => x.id_vehiculo === Number(val));
                    if (v?.id_tipo_vehiculo) {
                      ctrl.setField("id_tipo_vehiculo", v.id_tipo_vehiculo);
                    }
                  }
                }}
                leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingVehiculos || ctrl.loading}
                rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip
                label={
                  vehiculoFormReady
                    ? "Registrar nuevo vehículo"
                    : "Selecciona primero la empresa y el tipo de vehículo"
                }
                withArrow
              >
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearVehiculo(true)}
                  disabled={ctrl.loading || !vehiculoFormReady}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5 disabled:opacity-50"
                  aria-label="Nuevo vehículo"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Tipo de Vehículo"
                placeholder={loadingTipos ? "Cargando tipos..." : "Seleccione"}
                data={tiposVehiculoData}
                value={ctrl.form.id_tipo_vehiculo ? String(ctrl.form.id_tipo_vehiculo) : null}
                onChange={(val) => ctrl.setField("id_tipo_vehiculo", val ? Number(val) : 0)}
                leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingTipos || ctrl.loading}
                rightSection={loadingTipos ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nuevo tipo de vehículo" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearTipoVehiculo(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nuevo tipo de vehículo"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group gap={6} align="end" wrap="nowrap">
              <Select
                label="Conductor"
                placeholder={loadingConductores ? "Cargando conductores..." : "Seleccione"}
                data={conductoresData}
                value={ctrl.form.id_conductor ? String(ctrl.form.id_conductor) : null}
                onChange={(val) => ctrl.setField("id_conductor", val ? Number(val) : 0)}
                leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                withAsterisk
                required
                searchable
                clearable
                radius="lg"
                disabled={loadingConductores || ctrl.loading}
                rightSection={loadingConductores ? <Loader size={16} /> : undefined}
                classNames={{ ...fieldClasses, root: "flex-1" }}
                style={{ minWidth: 0 }}
              />
              <Tooltip label="Registrar nuevo conductor" withArrow>
                <ActionIcon
                  type="button"
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="md"
                  onClick={() => setModalCrearConductor(true)}
                  disabled={ctrl.loading}
                  className="bg-indigo-500/10! hover:bg-indigo-500/20! text-indigo-400! border-indigo-500/20! mb-0.5"
                  aria-label="Nuevo conductor"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <CustomDatePicker
              label="Fecha Estimada de Llegada"
              placeholder="Seleccione fecha (opcional)"
              value={
                ctrl.form.fecha_estimada_llegada
                  ? parseLocalDate(ctrl.form.fecha_estimada_llegada)
                  : null
              }
              onChange={(val: unknown) => {
                if (!val) {
                  ctrl.setField("fecha_estimada_llegada", "");
                  return;
                }
                const d = typeof val === "string" ? new Date(val) : (val as Date);
                ctrl.setField("fecha_estimada_llegada", formatLocalDate(d));
              }}
              disabled={ctrl.loading}
              clearable
              radius="lg"
              size="sm"
            />
          </Grid.Col>
        </Grid>

        <Divider
          label="Items del despacho a distribuir"
          labelPosition="left"
          classNames={{ label: "text-zinc-400 text-xs uppercase tracking-wider" }}
        />

        <Stack gap="xs">
          {ctrl.form.detalles.length === 0 ? (
            <Box className="text-center py-6 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
              Este despacho no tiene items con peso pendiente.
            </Box>
          ) : (
            ctrl.form.detalles.map((d) => {
              const detalleDespacho = detallesDespacho.find(
                (dd) => dd.id === d.id_despacho_detalle,
              );
              const max = detalleDespacho?.peso_actual ?? null;
              const seleccionado = (d.peso_tomado ?? 0) > 0;
              const excedido = max !== null && d.peso_tomado > max + 0.0001;
              const esLote = Boolean(detalleDespacho?.lote_correlativo);
              const labelTipo = esLote ? "Lote" : "Blending";
              const correlativo =
                detalleDespacho?.lote_correlativo ??
                detalleDespacho?.blending_correlativo ??
                `Detalle #${d.id_despacho_detalle}`;
              return (
                <Box
                  key={d.id_despacho_detalle}
                  className={`rounded-lg border p-3 transition-opacity ${
                    excedido
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-zinc-800 bg-zinc-900/30"
                  } ${seleccionado ? "" : "opacity-50"}`}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Checkbox
                        checked={seleccionado}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          ctrl.setDetallePeso(
                            d.id_despacho_detalle,
                            checked ? (max ?? 0) : 0,
                          );
                        }}
                        disabled={ctrl.loading}
                        size="md"
                        color="indigo"
                      />
                      <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                        <Group gap={6} wrap="nowrap">
                          <Badge
                            color={esLote ? "yellow" : "gray"}
                            variant="filled"
                            size="xs"
                            fw={700}
                          >
                            {labelTipo}
                          </Badge>
                          <Text fw={700} fz="xs" c="white" className="font-mono truncate">
                            {correlativo}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="wrap">
                          {detalleDespacho?.proveedor_razon_social && (
                            <Text fz={10} c="dimmed">
                              {detalleDespacho.proveedor_razon_social}
                            </Text>
                          )}
                          {max !== null && (
                            <Text fz={10} c="indigo.4" fw={600}>
                              Pendiente: {max.toFixed(3)} TN
                            </Text>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                    <NumberInput
                      label="Peso Tomado (TN)"
                      placeholder="0.000"
                      min={0}
                      max={max ?? undefined}
                      decimalScale={3}
                      fixedDecimalScale
                      hideControls
                      value={d.peso_tomado || ""}
                      onChange={(val) => {
                        const n = typeof val === "number" ? val : Number(val);
                        ctrl.setDetallePeso(d.id_despacho_detalle, isNaN(n) ? 0 : n);
                      }}
                      disabled={ctrl.loading || !seleccionado}
                      error={excedido ? "Supera el peso pendiente" : undefined}
                      radius="lg"
                      classNames={{
                        ...fieldClasses,
                        root: "w-44",
                        error: "text-red-400 text-xs",
                      }}
                    />
                  </Group>
                </Box>
              );
            })
          )}
        </Stack>

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={ctrl.loading}
            radius="xl"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            Cancelar
          </Button>
          <Button
            loading={ctrl.loading}
            disabled={ctrl.loading}
            onClick={() => ctrl.submit()}
            radius="xl"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
          >
            Registrar Distribución
          </Button>
        </Group>
      </Stack>

      {/* Modales anidados para crear nuevos registros */}
      <ModalEstandar
        opened={modalCrearEmpresa}
        close={() => setModalCrearEmpresa(false)}
        title="Nueva Empresa de Transporte"
        size="md"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setModalCrearEmpresa(false)}
          onSuccess={handleEmpresaCreada}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearTipoVehiculo}
        close={() => setModalCrearTipoVehiculo(false)}
        title="Nuevo Tipo de Vehículo"
        size="sm"
      >
        <RegistroTipoVehiculoSimple
          onCancel={() => setModalCrearTipoVehiculo(false)}
          onSuccess={handleTipoVehiculoCreado}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearVehiculo}
        close={() => setModalCrearVehiculo(false)}
        title="Nuevo Vehículo"
        size="sm"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={ctrl.form.id_empresa_transporte || null}
          idTipoVehiculo={ctrl.form.id_tipo_vehiculo || null}
          onCancel={() => setModalCrearVehiculo(false)}
          onSuccess={handleVehiculoCreado}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={modalCrearConductor}
        close={() => setModalCrearConductor(false)}
        title="Nuevo Conductor"
        size="sm"
      >
        <RegistroConductor
          onCancel={() => setModalCrearConductor(false)}
          onSuccess={handleConductorCreado}
        />
      </ModalEstandar>
    </ModalEstandar>
  );
};
