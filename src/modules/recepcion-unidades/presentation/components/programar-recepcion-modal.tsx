import {
  Stack,
  Group,
  Select,
  TextInput,
  Button,
  Loader,
  Grid,
  Text,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import {
  IconBuildingFactory,
  IconTruck,
  IconUser,
  IconFileText,
  IconCalendarTime,
  IconArrowsUpDown,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useProgramarRecepcion } from "../../hooks/useProgramarRecepcion";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { TipoIngreso } from "../../../../shared/enums/_generic/tipo-ingreso";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: (nueva: RecepcionUnidadResponse) => void;
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
  const ctrl = useProgramarRecepcion((nueva) => {
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
    label:
      v.placa ??
      (v.serie_placa ? `${v.serie_placa}-${v.numero_placa}` : v.numero_placa ?? `Vehículo #${v.id_vehiculo}`),
  }));

  const proveedoresData = (proveedores ?? []).map((p) => ({
    value: String(p.id_proveedor),
    label: p.razon_social,
  }));

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Programar Recepción de Unidad"
      size="lg"
    >
      <Stack gap="md">
        <Grid gutter="sm">
          <Grid.Col span={{ base: 12, sm: 6 }}>
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
            />
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
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
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
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <DateTimePicker
              label="Fecha Estimada de Llegada"
              placeholder="Seleccione fecha y hora (opcional)"
              value={form.fecha_estimada_llegada ? new Date(form.fecha_estimada_llegada.replace(" ", "T")) : null}
              onChange={(val) => {
                const date = val as Date | string | null;
                if (!date) {
                  setField("fecha_estimada_llegada", undefined);
                  return;
                }
                const d = typeof date === "string" ? new Date(date) : date;
                const formatted = d.toISOString().slice(0, 19).replace("T", " ");
                setField("fecha_estimada_llegada", formatted);
              }}
              disabled={loading}
              radius="xl"
              size="sm"
              valueFormat="YYYY-MM-DD HH:mm"
              leftSection={<IconCalendarTime size={16} className="text-zinc-500" />}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
                label: "text-zinc-300 mb-1 font-medium text-xs",
              }}
            />
          </Grid.Col>
        </Grid>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <Group gap="xs">
            <IconFileText className="w-4 h-4 text-indigo-400" />
            <Text size="sm" fw={600} className="text-zinc-200">
              Guías (opcional)
            </Text>
          </Group>
          <Grid gutter="sm">
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Serie Remitente"
                placeholder="Ej. 001"
                radius="xl"
                value={form.serie_guia_remitente ?? ""}
                onChange={(e) => setField("serie_guia_remitente", e.target.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Nro. Remitente"
                placeholder="Ej. 123456"
                radius="xl"
                value={form.numero_guia_remitente ?? ""}
                onChange={(e) => setField("numero_guia_remitente", e.target.value)}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Serie Transportista"
                placeholder="Ej. 001"
                radius="xl"
                value={form.serie_guia_transportista ?? ""}
                onChange={(e) => setField("serie_guia_transportista", e.target.value.toUpperCase())}
                disabled={loading}
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Nro. Transportista"
                placeholder="Ej. 123456"
                radius="xl"
                value={form.numero_guia_transportista ?? ""}
                onChange={(e) => setField("numero_guia_transportista", e.target.value)}
                disabled={loading}
                classNames={fieldClasses}
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
  );
};
