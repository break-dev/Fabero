import {
  Stack,
  Group,
  Select,
  TextInput,
  Button,
  Loader,
  Grid,
  ActionIcon,
  Tooltip
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
  IconLock
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
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";

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
            {/* Fila 1: Empresa + Tipo de Ingreso (bloqueado) */}
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
                placeholder="Tipo de ingreso"
                data={[{ value: TipoIngreso.RecepcionMineral, label: TipoIngreso.RecepcionMineral }]}
                value={TipoIngreso.RecepcionMineral}
                leftSection={<IconArrowsUpDown className="w-4 h-4 text-zinc-500" />}
                radius="xl"
                disabled
                readOnly
                rightSection={<IconLock size={14} className="text-zinc-500" />}
                classNames={fieldClasses}
              />
            </Grid.Col>

            {/* Fila 2: Vehículo + Proveedor */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Vehículo"
                  placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione el vehículo"}
                  data={vehiculosData}
                  value={form.id_vehiculo ? String(form.id_vehiculo) : null}
                  onChange={(val) => setField("id_vehiculo", val ? Number(val) : undefined)}
                  leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
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
                  placeholder={loadingProveedores ? "Cargando proveedores..." : "Seleccione el proveedor"}
                  data={proveedoresData}
                  value={form.id_proveedor_minero ? String(form.id_proveedor_minero) : null}
                  onChange={(val) => setField("id_proveedor_minero", val ? Number(val) : undefined)}
                  leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
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

            {/* Fila 3: Fecha (ocupa media fila) */}
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

            <Grid.Col span={{ base: 12, sm: 6 }}>
              {/* Columna vacía para balancear la fila 3 */}
            </Grid.Col>

            {/* Fila 4: Guías (TextInputs serie-numero) */}
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Guía Remitente (serie-número)"
                placeholder="Ej. 001-123456"
                radius="xl"
                value={form.guia_remitente ?? ""}
                onChange={(e) => setField("guia_remitente", e.currentTarget.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Guía Transportista (serie-número)"
                placeholder="Ej. 001-123456"
                radius="xl"
                value={form.guia_transportista ?? ""}
                onChange={(e) => setField("guia_transportista", e.currentTarget.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>
          </Grid>

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <Grid gutter="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <MultiFilePicker
                  label="Archivo Guía Remitente"
                  description="1 archivo (PDF o imagen)."
                  files={form.guia_remitente_file ? [form.guia_remitente_file] : []}
                  onFilesChange={(files) =>
                    setField("guia_remitente_file", files[0] ?? null)
                  }
                  existingFiles={form.documentos_programacion_existentes?.guia_remitente
                    ? [form.documentos_programacion_existentes.guia_remitente]
                    : []}
                  onRemoveExisting={() => {
                    const prev = form.documentos_programacion_existentes ?? {
                      guia_remitente: null,
                      guia_transportista: null,
                    };
                    setField("documentos_programacion_existentes", {
                      ...prev,
                      guia_remitente: null,
                    });
                  }}
                  multiple={false}
                  maxFiles={1}
                  accept="application/pdf,image/*"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <MultiFilePicker
                  label="Archivo Guía Transportista"
                  description="1 archivo (PDF o imagen)."
                  files={form.guia_transportista_file ? [form.guia_transportista_file] : []}
                  onFilesChange={(files) =>
                    setField("guia_transportista_file", files[0] ?? null)
                  }
                  existingFiles={form.documentos_programacion_existentes?.guia_transportista
                    ? [form.documentos_programacion_existentes.guia_transportista]
                    : []}
                  onRemoveExisting={() => {
                    const prev = form.documentos_programacion_existentes ?? {
                      guia_remitente: null,
                      guia_transportista: null,
                    };
                    setField("documentos_programacion_existentes", {
                      ...prev,
                      guia_transportista: null,
                    });
                  }}
                  multiple={false}
                  maxFiles={1}
                  accept="application/pdf,image/*"
                />
              </Grid.Col>
            </Grid>
          </div>

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
