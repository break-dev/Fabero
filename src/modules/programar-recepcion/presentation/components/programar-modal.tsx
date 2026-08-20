import {
  Stack,
  Group,
  Select,
  TextInput,
  Button,
  Loader,
  Grid,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import "@mantine/dates/styles.css";
import {
  IconBuildingFactory,
  IconTruck,
  IconUser,
  IconArrowsUpDown,
  IconCalendarTime,
  IconPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { formatLocalDate, parseLocalDate } from "../../../../presentation/utils/local-date";
import { useProgramarForm } from "../../hooks/useProgramarForm";
import type { ProgramacionDetail } from "../../service/programar-recepcion.responses";
import { TipoIngreso } from "../../../../shared/enums/_generic/tipo-ingreso";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: (nueva: ProgramacionDetail) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

const tipoIngresoData = [
  { value: TipoIngreso.RecepcionMineral, label: "Recepción de Mineral" },
  { value: TipoIngreso.DespachoMineral, label: "Despacho de Mineral" },
];

export const ProgramarRecepcionModal = ({ opened, onClose, onSuccess }: Props) => {
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [openVehiculoModal, setOpenVehiculoModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);

  const ctrl = useProgramarForm((nueva) => {
    onSuccess(nueva);
    onClose();
  });

  const {
    form,
    setField,
    submit,
    loading,
    empresas,
    vehiculos,
    proveedores,
    loadingEmpresas,
    loadingVehiculos,
    loadingProveedores,
    cargarCatalogos,
    reset,
    handleEmpresaCreada,
    handleVehiculoCreado,
    handleProveedorCreado,
  } = ctrl;

  useEffect(() => {
    if (opened) cargarCatalogos();
    else reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const empresasData = (empresas ?? []).map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));

  const vehiculosData = (vehiculos ?? []).map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa || `Vehículo #${v.id_vehiculo}`,
  }));

  const proveedoresData = (proveedores ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title="Programar Recepción de Unidad"
        size="lg"
      >
        <Stack gap="md">
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Empresa de Transporte"
                  placeholder={loadingEmpresas ? "Cargando..." : "Seleccione la empresa"}
                  data={empresasData}
                  value={form.id_empresa_transporte ? String(form.id_empresa_transporte) : null}
                  onChange={(val) => setField("id_empresa_transporte", val ? Number(val) : 0)}
                  leftSection={<IconBuildingFactory className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
                  radius="xl"
                  disabled={loadingEmpresas || loading}
                  rightSection={loadingEmpresas ? <Loader size={16} /> : undefined}
                  classNames={fieldClasses}
                  className="flex-1"
                />
                <Tooltip label="Nueva empresa de transporte">
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="xl"
                    size="lg"
                    disabled={loading}
                    onClick={() => setOpenEmpresaModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Tipo de Ingreso"
                placeholder="Seleccione el tipo"
                data={tipoIngresoData}
                value={form.tipo_ingreso ?? null}
                onChange={(val) => setField("tipo_ingreso", val || undefined)}
                leftSection={<IconArrowsUpDown className="w-4 h-4 text-zinc-500" />}
                radius="xl"
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Vehículo"
                  placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione (opcional)"}
                  data={vehiculosData}
                  value={form.id_vehiculo ? String(form.id_vehiculo) : null}
                  onChange={(val) => setField("id_vehiculo", val ? Number(val) : undefined)}
                  leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  clearable
                  radius="xl"
                  disabled={loadingVehiculos || loading}
                  rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                  classNames={fieldClasses}
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo vehículo">
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="xl"
                    size="lg"
                    disabled={loading}
                    onClick={() => setOpenVehiculoModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Proveedor Minero"
                  placeholder={loadingProveedores ? "Cargando proveedores..." : "Seleccione (opcional)"}
                  data={proveedoresData}
                  value={form.id_proveedor_minero ? String(form.id_proveedor_minero) : null}
                  onChange={(val) => setField("id_proveedor_minero", val ? Number(val) : undefined)}
                  leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                  searchable
                  clearable
                  radius="xl"
                  disabled={loadingProveedores || loading}
                  rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
                  classNames={fieldClasses}
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo proveedor minero">
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="zinc"
                    radius="xl"
                    size="lg"
                    disabled={loading}
                    onClick={() => setOpenProveedorModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                  >
                    <IconPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <CustomDatePicker
                label="Fecha Estimada de Llegada"
                placeholder="Seleccione fecha (opcional)"
                value={form.fecha_estimada_llegada ? parseLocalDate(form.fecha_estimada_llegada) : null}
                onChange={(val: unknown) => {
                  if (!val) {
                    setField("fecha_estimada_llegada", undefined);
                    return;
                  }
                  const d = typeof val === "string" ? new Date(val) : (val as Date);
                  setField("fecha_estimada_llegada", formatLocalDate(d));
                }}
                disabled={loading}
                clearable
                radius="xl"
                size="sm"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 6 }}>
              <TextInput
                label="Guía Remitente"
                placeholder="Ej. 001-123456"
                radius="xl"
                value={form.guia_remitente ?? ""}
                onChange={(e) => setField("guia_remitente", e.target.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 6 }}>
              <TextInput
                label="Guía Transportista"
                placeholder="Ej. 001-123456"
                radius="xl"
                value={form.guia_transportista ?? ""}
                onChange={(e) => setField("guia_transportista", e.target.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" gap="md" mt="xl">
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={loading}
              radius="xl"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              Cancelar
            </Button>
            <Button
              loading={loading}
              onClick={submit}
              radius="xl"
              size="sm"
              leftSection={<IconCalendarTime size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
            >
              Programar Recepción
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      <ModalEstandar
        opened={openEmpresaModal}
        close={() => setOpenEmpresaModal(false)}
        title="Nueva Empresa de Transporte"
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenEmpresaModal(false)}
          onSuccess={(nueva) => {
            handleEmpresaCreada(nueva);
            setOpenEmpresaModal(false);
          }}
        />
      </ModalEstandar>

      <ModalEstandar
        opened={openVehiculoModal}
        close={() => setOpenVehiculoModal(false)}
        title="Registrar Nuevo Vehículo"
        size="md"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={form.id_empresa_transporte || null}
          idTipoVehiculo={null}
          onCancel={() => setOpenVehiculoModal(false)}
          onSuccess={(nuevo) => {
            handleVehiculoCreado(nuevo);
            setOpenVehiculoModal(false);
          }}
        />
      </ModalEstandar>

      <ModalRegistroProveedor
        opened={openProveedorModal}
        onClose={() => setOpenProveedorModal(false)}
        onSuccess={(nuevo) => {
          handleProveedorCreado(nuevo);
        }}
      />
    </>
  );
};
