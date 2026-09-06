import { useEffect, useState } from "react";
import {
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { AuxService } from "../../../../service/auxiliar.service";
import { ValidacionDistribucionService } from "../../service/validacion-distribucion.service";
import type { DTO_UpdateParticion } from "../../service/validacion-distribucion.requests";
import type { RES_Particion } from "../../service/validacion-distribucion.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import { useNotify } from "../../../../hooks/useNotify";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";

interface Props {
  opened: boolean;
  onClose: () => void;
  particion: RES_Particion;
  onSaved: (actualizadas: RES_Particion[]) => void;
}

type SubModal = null | "vehiculo" | "conductor" | "empresa" | "tipo_vehiculo" | "proveedor";

export const EdicionParticionModal = ({
  opened,
  onClose,
  particion,
  onSaved,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [idVehiculo, setIdVehiculo] = useState<string | null>(
    particion.id_vehiculo != null ? String(particion.id_vehiculo) : null
  );
  const [idConductor, setIdConductor] = useState<string | null>(
    particion.id_conductor != null ? String(particion.id_conductor) : null
  );
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(
    particion.id_empresa_transporte != null
      ? String(particion.id_empresa_transporte)
      : null
  );
  const [idTipoVehiculo, setIdTipoVehiculo] = useState<string | null>(
    particion.id_tipo_vehiculo != null ? String(particion.id_tipo_vehiculo) : null
  );
  const [idProveedorMinero, setIdProveedorMinero] = useState<string | null>(
    particion.id_proveedor_minero != null
      ? String(particion.id_proveedor_minero)
      : null
  );
  const [fechaHoraIngreso, setFechaHoraIngreso] = useState<Date | null>(
    () => (particion.fecha_hora_ingreso ? new Date(particion.fecha_hora_ingreso) : new Date())
  );
  const [fechaHoraSalida, setFechaHoraSalida] = useState<Date | null>(() => {
    if (particion.fecha_hora_salida) return new Date(particion.fecha_hora_salida);
    const base = particion.fecha_hora_ingreso ? new Date(particion.fecha_hora_ingreso) : new Date();
    return new Date(base.getTime() + 2 * 60 * 60 * 1000);
  });

  const [capacidadVehiculo, setCapacidadVehiculo] = useState<number | string | null>(
    particion.vehiculo_capacidad ?? null
  );

  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<
    RES_EmpresaTransporte[]
  >([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);
  const [loadingEmpresasTransporte, setLoadingEmpresasTransporte] =
    useState(false);
  const [loadingTiposVehiculo, setLoadingTiposVehiculo] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const catalogsLoading =
    loadingVehiculos ||
    loadingConductores ||
    loadingEmpresasTransporte ||
    loadingTiposVehiculo ||
    loadingProveedores;

  const [subModal, setSubModal] = useState<SubModal>(null);
  const [submitting, setSubmitting] = useState(false);

  const catalogKey = `edicion-particion-${particion.id}`;

  useEffect(() => {
    if (!opened) return;
    setIdVehiculo(particion.id_vehiculo != null ? String(particion.id_vehiculo) : null);
    setCapacidadVehiculo(particion.vehiculo_capacidad ?? null);
    setIdConductor(
      particion.id_conductor != null ? String(particion.id_conductor) : null
    );
    setIdEmpresaTransporte(
      particion.id_empresa_transporte != null
        ? String(particion.id_empresa_transporte)
        : null
    );
    setIdTipoVehiculo(
      particion.id_tipo_vehiculo != null ? String(particion.id_tipo_vehiculo) : null
    );
    setIdProveedorMinero(
      particion.id_proveedor_minero != null
        ? String(particion.id_proveedor_minero)
        : null
    );
    setFechaHoraIngreso(
      particion.fecha_hora_ingreso
        ? new Date(particion.fecha_hora_ingreso)
        : new Date()
    );
    setFechaHoraSalida(() => {
      if (particion.fecha_hora_salida) return new Date(particion.fecha_hora_salida);
      const base = particion.fecha_hora_ingreso ? new Date(particion.fecha_hora_ingreso) : new Date();
      return new Date(base.getTime() + 2 * 60 * 60 * 1000);
    });

    setLoadingVehiculos(true);
    setLoadingConductores(true);
    setLoadingEmpresasTransporte(true);
    setLoadingProveedores(true);
    setLoadingTiposVehiculo(true);

    AuxService.get_vehiculos()
      .then((data) => {
        setVehiculos(data as RES_Vehiculo[]);
      })
      .catch(() => notifyError("No se pudo cargar el catálogo de vehículos."))
      .finally(() => setLoadingVehiculos(false));

    AuxService.get_conductores()
      .then((data) => {
        setConductores(data as RES_Conductor[]);
      })
      .catch(() => notifyError("No se pudo cargar el catálogo de conductores."))
      .finally(() => setLoadingConductores(false));

    AuxService.get_empresas_transporte()
      .then((data) => {
        setEmpresasTransporte(data as RES_EmpresaTransporte[]);
      })
      .catch(() =>
        notifyError("No se pudo cargar el catálogo de empresas de transporte.")
      )
      .finally(() => setLoadingEmpresasTransporte(false));

    AuxService.get_proveedores()
      .then((res) => {
        setProveedores(res.data ?? (res as unknown as RES_Proveedor[]));
      })
      .catch(() => notifyError("No se pudo cargar el catálogo de proveedores."))
      .finally(() => setLoadingProveedores(false));

    AuxService.get_tipos_vehiculo()
      .then((data) => {
        setTiposVehiculo(data as RES_TipoVehiculo[]);
      })
      .catch(() => notifyError("No se pudo cargar el catálogo de tipos de vehículo."))
      .finally(() => setLoadingTiposVehiculo(false));
  }, [opened, particion, catalogKey, notifyError]);

  const refreshCatalog = async (kind: SubModal) => {
    const setLoading = (val: boolean) => {
      if (kind === "vehiculo") setLoadingVehiculos(val);
      else if (kind === "conductor") setLoadingConductores(val);
      else if (kind === "empresa") setLoadingEmpresasTransporte(val);
      else if (kind === "tipo_vehiculo") setLoadingTiposVehiculo(val);
      else if (kind === "proveedor") setLoadingProveedores(val);
    };

    setLoading(true);
    try {
      if (kind === "vehiculo") {
        const data = await AuxService.get_vehiculos();
        setVehiculos(data as RES_Vehiculo[]);
      } else if (kind === "conductor") {
        const data = await AuxService.get_conductores();
        setConductores(data as RES_Conductor[]);
      } else if (kind === "empresa") {
        const data = await AuxService.get_empresas_transporte();
        setEmpresasTransporte(data as RES_EmpresaTransporte[]);
      } else if (kind === "tipo_vehiculo") {
        const data = await AuxService.get_tipos_vehiculo();
        setTiposVehiculo(data as RES_TipoVehiculo[]);
      } else if (kind === "proveedor") {
        const res = await AuxService.get_proveedores();
        setProveedores(res.data ?? (res as unknown as RES_Proveedor[]));
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleVehiculoChange = (val: string | null) => {
    setIdVehiculo(val);
    if (val) {
      const vehiculo = vehiculos.find((v) => String(v.id_vehiculo) === val);
      if (vehiculo?.capacidad != null) {
        setCapacidadVehiculo(vehiculo.capacidad);
      }
    }
  };

  const handleGuardar = async () => {
    setSubmitting(true);
    try {
      if (idVehiculo && capacidadVehiculo != null) {
        const capNum = typeof capacidadVehiculo === "number" ? capacidadVehiculo : parseFloat(String(capacidadVehiculo));
        if (Number.isFinite(capNum)) {
          await ValidacionDistribucionService.updateCapacidadVehiculo(Number(idVehiculo), { capacidad: capNum });
        }
      }

      const payload: DTO_UpdateParticion = {
        recepcion: {
          id_vehiculo: idVehiculo ? Number(idVehiculo) : null,
          id_conductor: idConductor ? Number(idConductor) : null,
          id_empresa_transporte: idEmpresaTransporte
            ? Number(idEmpresaTransporte)
            : null,
          id_tipo_vehiculo: idTipoVehiculo ? Number(idTipoVehiculo) : null,
          id_proveedor_minero: idProveedorMinero
            ? Number(idProveedorMinero)
            : null,
          fecha_hora_ingreso: fechaHoraIngreso
            ? fechaHoraIngreso.toISOString()
            : null,
          fecha_hora_salida: fechaHoraSalida
            ? fechaHoraSalida.toISOString()
            : null,
        },
      };

      const actualizadas = await ValidacionDistribucionService.updateParticion(
        particion.id,
        payload
      );
      notifySuccess("Recepción actualizada correctamente.");
      onSaved(actualizadas);
      onClose();
    } catch {
      notifyError("No se pudo actualizar la recepción.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={onClose}
        title={`Recepción de la partición ${particion.particion}`}
        size="lg"
      >
        <Stack gap="sm">
          <Group gap="xs" c="dimmed">
            <Text size="xs">Correlativo: {particion.correlativo}</Text>
            <Text size="xs">· Ticket: {particion.ticket_correlativo ?? "—"}</Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <SelectField
              label="Vehículo"
              data={vehiculos.map((v) => ({
                value: String(v.id_vehiculo),
                label: v.placa,
              }))}
              value={idVehiculo}
              onChange={handleVehiculoChange}
              onPlus={() => setSubModal("vehiculo")}
              loading={loadingVehiculos}
            />
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Capacidad del Vehículo (KG)
              </Text>
              <NumberInput
                placeholder="0.00"
                value={capacidadVehiculo ?? 0}
                onChange={setCapacidadVehiculo}
                min={0}
                decimalScale={2}
                fixedDecimalScale
                hideControls
                radius="lg"
                size="xs"
                disabled={!idVehiculo}
              />
            </Stack>
            <SelectField
              label="Conductor"
              data={conductores.map((c) => ({
                value: String(c.id_conductor),
                label: `${c.nombre_completo} (${c.dni})`,
              }))}
              value={idConductor}
              onChange={setIdConductor}
              onPlus={() => setSubModal("conductor")}
              loading={loadingConductores}
            />
            <SelectField
              label="Empresa de transporte"
              data={empresasTransporte.map((e) => ({
                value: String(e.id_empresa_transporte),
                label: `${e.razon_social}${e.ruc ? ` (${e.ruc})` : ""}`,
              }))}
              value={idEmpresaTransporte}
              onChange={setIdEmpresaTransporte}
              onPlus={() => setSubModal("empresa")}
              loading={loadingEmpresasTransporte}
            />
            <SelectField
              label="Tipo de vehículo"
              data={tiposVehiculo.map((t) => ({
                value: String(t.id_tipo_vehiculo),
                label: t.nombre,
              }))}
              value={idTipoVehiculo}
              onChange={setIdTipoVehiculo}
              onPlus={() => setSubModal("tipo_vehiculo")}
              loading={loadingTiposVehiculo}
            />
            <SelectField
              label="Proveedor minero"
              data={proveedores.map((p) => ({
                value: String(p.id_proveedor),
                label: `${p.razon_social}${p.documento ? ` (${p.documento})` : ""}`,
              }))}
              value={idProveedorMinero}
              onChange={setIdProveedorMinero}
              onPlus={() => setSubModal("proveedor")}
              loading={loadingProveedores}
            />
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Fecha y hora de ingreso
              </Text>
              <DateTimePicker
                value={fechaHoraIngreso}
                onChange={(v) => setFechaHoraIngreso(v ? new Date(v) : null)}
                valueFormat="DD/MM/YYYY HH:mm:ss"
                withSeconds
                radius="lg"
                size="sm"
                popoverProps={{ withinPortal: true }}
              />
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Fecha y hora de salida
              </Text>
              <DateTimePicker
                value={fechaHoraSalida}
                onChange={(v) => setFechaHoraSalida(v ? new Date(v) : null)}
                valueFormat="DD/MM/YYYY HH:mm:ss"
                withSeconds
                radius="lg"
                size="sm"
                popoverProps={{ withinPortal: true }}
              />
            </Stack>
          </SimpleGrid>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} radius="lg" size="sm">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              loading={submitting}
              disabled={catalogsLoading || submitting}
              radius="lg"
              size="sm"
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {subModal === "vehiculo" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar vehículo"
          size="sm"
        >
          <RegistroVehiculoSimple
            idEmpresaTransporte={
              idEmpresaTransporte ? Number(idEmpresaTransporte) : null
            }
            idTipoVehiculo={idTipoVehiculo ? Number(idTipoVehiculo) : null}
            onCancel={() => setSubModal(null)}
            onSuccess={(v) => {
              setIdVehiculo(String(v.id_vehiculo));
              void refreshCatalog("vehiculo");
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "conductor" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar conductor"
          size="sm"
        >
          <RegistroConductor
            onCancel={() => setSubModal(null)}
            onSuccess={(c) => {
              setIdConductor(String(c.id_conductor));
              void refreshCatalog("conductor");
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "empresa" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar empresa de transporte"
          size="md"
        >
          <RegistroEmpresaTransporte
            onCancel={() => setSubModal(null)}
            onSuccess={(e) => {
              setIdEmpresaTransporte(String(e.id));
              void refreshCatalog("empresa");
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "tipo_vehiculo" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar tipo de vehículo"
          size="sm"
        >
          <RegistroTipoVehiculoSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(t) => {
              setIdTipoVehiculo(String(t.id_tipo_vehiculo));
              void refreshCatalog("tipo_vehiculo");
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}

      {subModal === "proveedor" && (
        <ModalEstandar
          opened
          close={() => setSubModal(null)}
          title="Registrar proveedor minero"
          size="sm"
        >
          <RegistroProveedorMineroSimple
            onCancel={() => setSubModal(null)}
            onSuccess={(p) => {
              setIdProveedorMinero(String(p.id_proveedor));
              void refreshCatalog("proveedor");
              setSubModal(null);
            }}
          />
        </ModalEstandar>
      )}
    </>
  );
};

interface SelectFieldProps {
  label: string;
  data: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (v: string | null) => void;
  onPlus: () => void;
  loading: boolean;
}

const SelectField = ({
  label,
  data,
  value,
  onChange,
  onPlus,
  loading,
}: SelectFieldProps) => {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Group gap={4} align="center">
        <Select
          placeholder={loading ? "Cargando..." : "Seleccione"}
          data={data}
          value={value}
          onChange={onChange}
          searchable
          clearable
          radius="lg"
          size="xs"
          style={{ flex: 1 }}
          disabled={loading}
          rightSection={loading ? <Loader size={16} /> : undefined}
          comboboxProps={{ withinPortal: true }}
        />
        <Tooltip label={`Registrar ${label.toLowerCase()}`} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onPlus}
            disabled={loading}
            aria-label={`Agregar ${label}`}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
  );
};
