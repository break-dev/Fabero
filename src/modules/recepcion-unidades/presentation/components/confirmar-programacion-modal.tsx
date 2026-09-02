import { useState } from "react";
import {
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  Loader,
  Text,
  ActionIcon,
  Badge,
  Divider,
  Grid,
  Tooltip,
} from "@mantine/core";
import {
  IconTrash,
  IconUserCheck,
  IconTruck,
  IconCheck,
  IconX,
  IconLock,
  IconBuildingFactory,
  IconUser,
  IconFileText,
  IconUserPlus,
  IconEdit,
  IconPhoto,
  IconPlus,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useConfirmarProgramacion } from "../../hooks/useConfirmarProgramacion";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import { AgregarAcompananteModal, type DatosAcompananteForm } from "./agregar-acompanante-modal";
import { AgregarVehiculoModal, type DatosVehiculoForm } from "./agregar-vehiculo-modal";
import { RegistrarOcupanteModal, type DatosOcupanteSlot } from "./registrar-ocupante-modal";
import { VerFotosModal } from "./ver-fotos-modal";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";

interface Props {
  opened: boolean;
  programacion?: RecepcionUnidadResponse | null;
  onClose: () => void;
  onConfirmada: (actualizada: RecepcionUnidadResponse) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export const ConfirmarProgramacionModal = ({
  opened,
  programacion,
  onClose,
  onConfirmada,
}: Props) => {
  const ctrl = useConfirmarProgramacion({ programacion, opened });

  const [openModalAcompanante, setOpenModalAcompanante] = useState(false);
  const [openModalVehiculo, setOpenModalVehiculo] = useState(false);
  const [openConductorModal, setOpenConductorModal] = useState(false);
  const [openVehiculoSimpleModal, setOpenVehiculoSimpleModal] = useState(false);
  const [openTipoVehiculoModal, setOpenTipoVehiculoModal] = useState(false);
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);

  const [editingAcompanante, setEditingAcompanante] = useState<{
    index: number;
    datos: DatosAcompananteForm;
  } | null>(null);
  const [editingVehiculo, setEditingVehiculo] = useState<{
    id: number;
    datos: DatosVehiculoForm;
  } | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    index: number;
    vehiculoPlaca: string;
    slotNum: number;
    datos: DatosOcupanteSlot;
  } | null>(null);
  const [visualizarFotos, setVisualizarFotos] = useState<{
    title: string;
    fotosNuevas?: File[];
    fotosExistentes?: string[];
  } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const empresasOptions = (ctrl.empresasCatalog ?? []).map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.ruc ? `${e.razon_social} (${e.ruc})` : e.razon_social,
  }));

  const vehiculosOptions = (ctrl.vehiculosCatalog ?? []).map((v) => ({
    value: String(v.id_vehiculo),
    label: v.placa || `Vehículo #${v.id_vehiculo}`,
  }));

  const conductoresOptions = (ctrl.conductoresCatalog ?? []).map((c) => ({
    value: String(c.id_conductor),
    label: c.dni ? `${c.nombre_completo} (${c.dni})` : c.nombre_completo,
  }));

const proveedoresOptions = (ctrl.proveedoresCatalog ?? []).map((p) => ({
  value: String(p.id_proveedor),
  label: p.razon_social,
}));

const esDespacho =
  ctrl.programacion?.tipo_ingreso === "Despacho de Mineral";

  const tiposVehiculoOptions = (ctrl.tiposVehiculoCatalog ?? []).map((tv) => ({
    value: String(tv.id_tipo_vehiculo),
    label: tv.nombre,
  }));

  const handleConfirmar = async () => {
    setConfirmando(true);
    const res = await ctrl.confirmar();
    setConfirmando(false);
    if (!res) return;

    const { visita, updatedRecepcion } = res;

    onConfirmada(
      programacion
        ? {
            ...programacion,
            ...updatedRecepcion,
            estado: "En Planta",
            visita,
          }
        : updatedRecepcion,
    );
    onClose();
  };

  const visitantesPrincipal = ctrl.visitantes.filter((v) => !v.id_visita_vehiculo);

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={programacion ? `Confirmar Programación #${programacion.id}` : "Registrar Recepción de Unidad"}
      size="xl"
    >
      <Stack gap="md">
        {/* Datos de la Programación y Unidad */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <Group justify="space-between">
            <Group gap="xs">
              <IconTruck className="w-4 h-4 text-indigo-400" />
              <Text size="xs" fw={700} className="text-zinc-300 uppercase tracking-wider">
                Datos de la Unidad y Transporte
              </Text>
            </Group>
            <Badge variant="subtle" color="zinc" size="xs">
              {programacion
                ? "Los datos previamente ingresados se mantienen bloqueados"
                : "Ingreso directo de unidad a planta"}
            </Badge>
          </Group>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Empresa de Transporte"
                  placeholder={ctrl.loadingCatalogos ? "Cargando..." : "Seleccione la empresa"}
                  data={empresasOptions}
                  value={
                    ctrl.programacion?.id_empresa_transporte
                      ? String(ctrl.programacion.id_empresa_transporte)
                      : ctrl.idEmpresaTransporteEditado
                        ? String(ctrl.idEmpresaTransporteEditado)
                        : null
                  }
                  onChange={(val) => ctrl.setIdEmpresaTransporteEditado(val ? Number(val) : null)}
                  leftSection={<IconBuildingFactory className="w-4 h-4 text-zinc-500" />}
                  searchable
                  withAsterisk
                  required
                  radius="xl"
                  className="flex-1"
                  disabled={confirmando}
                  readOnly={Boolean(ctrl.programacion?.id_empresa_transporte)}
                  rightSection={
                    ctrl.programacion?.id_empresa_transporte ? (
                      <IconLock size={14} className="text-zinc-500" />
                    ) : ctrl.loadingCatalogos ? (
                      <Loader size={16} />
                    ) : undefined
                  }
                  classNames={fieldClasses}
                />
                {!ctrl.programacion?.id_empresa_transporte && (
                  <Tooltip label="Nueva Empresa de Transporte" withArrow>
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={confirmando}
                      onClick={() => setOpenEmpresaModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Vehículo"
                  placeholder={ctrl.loadingCatalogos ? "Cargando..." : "Seleccione vehículo"}
                  data={vehiculosOptions}
                  withAsterisk
                  required
                  value={
                    ctrl.programacion?.id_vehiculo
                      ? String(ctrl.programacion.id_vehiculo)
                      : ctrl.idVehiculoEditado
                        ? String(ctrl.idVehiculoEditado)
                        : null
                  }
                  onChange={(val) => ctrl.setIdVehiculoEditado(val ? Number(val) : null)}
                  leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  radius="xl"
                  className="flex-1"
                  disabled={confirmando}
                  readOnly={Boolean(ctrl.programacion?.id_vehiculo)}
                  rightSection={
                    ctrl.programacion?.id_vehiculo ? (
                      <IconLock size={14} className="text-zinc-500" />
                    ) : ctrl.loadingCatalogos ? (
                      <Loader size={16} />
                    ) : undefined
                  }
                  classNames={fieldClasses}
                />
                {!ctrl.programacion?.id_vehiculo && (
                  <Tooltip label="Registrar Nuevo Vehículo" withArrow>
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={confirmando}
                      onClick={() => setOpenVehiculoSimpleModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Conductor"
                  placeholder={ctrl.loadingCatalogos ? "Cargando..." : "Seleccione conductor"}
                  data={conductoresOptions}
                  value={ctrl.idConductor ? String(ctrl.idConductor) : null}
                  onChange={(val) => ctrl.setIdConductor(val ? Number(val) : null)}
                  leftSection={<IconUserCheck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  clearable={!ctrl.lockedConductor}
                  radius="xl"
                  className="flex-1"
                  disabled={ctrl.lockedConductor || ctrl.loadingCatalogos || confirmando}
                  rightSection={
                    ctrl.lockedConductor ? (
                      <IconLock size={14} className="text-zinc-500" />
                    ) : ctrl.loadingCatalogos ? (
                      <Loader size={16} />
                    ) : undefined
                  }
                  classNames={fieldClasses}
                />
                {!ctrl.lockedConductor && (
                  <Tooltip label="Registrar Nuevo Conductor" withArrow>
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={confirmando}
                      onClick={() => setOpenConductorModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>
            </Grid.Col>

            {!esDespacho && (
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex gap-2 items-end">
                  <Select
                    label="Proveedor Minero"
                    placeholder={ctrl.loadingCatalogos ? "Cargando..." : "Seleccione proveedor"}
                    data={proveedoresOptions}
                    withAsterisk
                    required
                    value={
                      ctrl.programacion?.id_proveedor_minero
                        ? String(ctrl.programacion.id_proveedor_minero)
                        : ctrl.idProveedorMineroEditado
                          ? String(ctrl.idProveedorMineroEditado)
                          : null
                    }
                    onChange={(val) => ctrl.setIdProveedorMineroEditado(val ? Number(val) : null)}
                    leftSection={<IconUser className="w-4 h-4 text-zinc-500" />}
                    searchable
                    radius="xl"
                    className="flex-1"
                    disabled={confirmando}
                    readOnly={Boolean(ctrl.programacion?.id_proveedor_minero)}
                    rightSection={
                      ctrl.programacion?.id_proveedor_minero ? (
                        <IconLock size={14} className="text-zinc-500" />
                      ) : ctrl.loadingCatalogos ? (
                        <Loader size={16} />
                      ) : undefined
                    }
                    classNames={fieldClasses}
                  />
                  {!ctrl.programacion?.id_proveedor_minero && (
                    <Tooltip label="Registrar Nuevo Proveedor Minero" withArrow>
                      <ActionIcon
                        type="button"
                        variant="filled"
                        color="zinc"
                        radius="xl"
                        size="lg"
                        disabled={confirmando}
                        onClick={() => setOpenProveedorModal(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5"
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
              </Grid.Col>
            )}

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex gap-2 items-end">
                <Select
                  label="Tipo de Vehículo"
                  placeholder={ctrl.loadingCatalogos ? "Cargando..." : "Seleccione tipo de vehículo"}
                  data={tiposVehiculoOptions}
                  value={
                    ctrl.programacion?.id_tipo_vehiculo
                      ? String(ctrl.programacion.id_tipo_vehiculo)
                      : ctrl.idTipoVehiculoEditado
                        ? String(ctrl.idTipoVehiculoEditado)
                        : null
                  }
                  onChange={(val) => ctrl.setIdTipoVehiculoEditado(val ? Number(val) : null)}
                  leftSection={<IconTruck className="w-4 h-4 text-zinc-500" />}
                  searchable
                  radius="xl"
                  className="flex-1"
                  disabled={confirmando}
                  readOnly={Boolean(ctrl.programacion?.id_tipo_vehiculo)}
                  rightSection={
                    ctrl.programacion?.id_tipo_vehiculo ? (
                      <IconLock size={14} className="text-zinc-500" />
                    ) : ctrl.loadingCatalogos ? (
                      <Loader size={16} />
                    ) : undefined
                  }
                  classNames={fieldClasses}
                />
                {!ctrl.programacion?.id_tipo_vehiculo && (
                  <Tooltip label="Registrar Tipo de Vehículo" withArrow>
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="zinc"
                      radius="xl"
                      size="lg"
                      disabled={confirmando}
                      onClick={() => setOpenTipoVehiculoModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                    >
                      <IconPlus size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>
            </Grid.Col>
          </Grid>

          {/* Guías */}
          {!esDespacho && (
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <Group gap="xs">
                <IconFileText className="w-4 h-4 text-indigo-400" />
                <Text size="xs" fw={600} className="text-zinc-300">
                  Guías (opcional)
                </Text>
              </Group>
              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Guía Remitente"
                    placeholder="Ej. 001-123456"
                    radius="xl"
                    value={ctrl.programacion?.guia_remitente ?? ctrl.guiaRemitente}
                    onChange={(e) => ctrl.setGuiaRemitente(e.currentTarget.value)}
                    readOnly={Boolean(ctrl.programacion?.guia_remitente)}
                    disabled={confirmando}
                    rightSection={ctrl.programacion?.guia_remitente ? <IconLock size={14} className="text-zinc-500" /> : undefined}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Guía Transportista"
                    placeholder="Ej. 001-123456"
                    radius="xl"
                    value={ctrl.programacion?.guia_transportista ?? ctrl.guiaTransportista}
                    onChange={(e) => ctrl.setGuiaTransportista(e.currentTarget.value)}
                    readOnly={Boolean(ctrl.programacion?.guia_transportista)}
                    disabled={confirmando}
                    rightSection={ctrl.programacion?.guia_transportista ? <IconLock size={14} className="text-zinc-500" /> : undefined}
                    classNames={fieldClasses}
                  />
                </Grid.Col>
              </Grid>

              {/* Documentos de programación (archivos subidos al programar) */}
              {ctrl.programacion?.documentos_programacion && (
                <div className="pt-2 space-y-2">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Text size="10px" fw={700} className="text-zinc-500 uppercase tracking-widest">
                        Guía Remitente
                      </Text>
                      {ctrl.programacion.documentos_programacion.guia_remitente ? (
                        <ArchivoCard
                          archivo={ctrl.programacion.documentos_programacion.guia_remitente}
                        />
                      ) : (
                        <Text size="xs" c="zinc.6" fs="italic">
                          Sin archivo adjunto.
                        </Text>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Text size="10px" fw={700} className="text-zinc-500 uppercase tracking-widest">
                        Guía Transportista
                      </Text>
                      {ctrl.programacion.documentos_programacion.guia_transportista ? (
                        <ArchivoCard
                          archivo={ctrl.programacion.documentos_programacion.guia_transportista}
                        />
                      ) : (
                        <Text size="xs" c="zinc.6" fs="italic">
                          Sin archivo adjunto.
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

         
        </div>

        {/* Evidencias de la Recepción */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
          <MultiFilePicker
            files={ctrl.evidencias}
            onFilesChange={ctrl.setEvidencias}
            label="Evidencias de la Recepción"
            description="Fotografías de la unidad, guía de remisión o documentos adjuntos"
          />
        </div>

        <Divider
          label="Acompañantes y Vehículos de la Recepción"
          labelPosition="left"
          classNames={{ label: "text-zinc-500 font-medium text-xs uppercase tracking-wider" }}
        />

        {/* Botones principales */}
        <Group grow gap="md">
          <Button
            radius="xl"
            variant="default"
            size="sm"
            leftSection={<IconUserPlus size={18} className="text-indigo-400" />}
            onClick={() => setOpenModalAcompanante(true)}
            disabled={confirmando}
            className="bg-zinc-800/80! hover:bg-zinc-700/80! text-zinc-200! border-zinc-700! shadow-sm py-2"
          >
            + Agregar Acompañante de Unidad
          </Button>

          <Button
            radius="xl"
            variant="default"
            size="sm"
            leftSection={<IconTruck size={18} className="text-indigo-400" />}
            onClick={() => setOpenModalVehiculo(true)}
            disabled={confirmando}
            className="bg-zinc-800/80! hover:bg-zinc-700/80! text-zinc-200! border-zinc-700! shadow-sm py-2"
          >
            + Agregar Vehículo Acompañante
          </Button>
        </Group>

        {/* Sección Acompañantes de la Unidad Principal */}
        {visitantesPrincipal.length > 0 && (
          <div className="space-y-2">
            <Text size="xs" fw={700} className="text-zinc-400 uppercase tracking-wider">
              Acompañantes del Vehículo Principal ({visitantesPrincipal.length})
            </Text>
            <Stack gap="xs">
              {ctrl.visitantes.map((v, index) => {
                if (v.id_visita_vehiculo) return null;
                return (
                  <div
                    key={`main-${index}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <Group gap="sm">
                      <IconUserCheck className="w-5 h-5 text-indigo-400" />
                      <div>
                        <Group gap="xs">
                          <Text size="sm" fw={600} className="text-zinc-100">
                            {v.nombre} {v.apellido ?? ""}
                          </Text>
                          <Badge color="indigo" variant="light" size="xs">
                            Acompañante
                          </Badge>
                        </Group>
                        <Text size="xs" c="zinc.5">
                          {v.dni ? `DNI: ${v.dni}` : "Sin DNI"}{" "}
                          {v.telefono ? `• Tel: ${v.telefono}` : ""}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      {(Boolean(v.foto_documento?.length) || Boolean(v.foto_documento_existente)) ? (
                        <Button
                          variant="subtle"
                          size="compact-xs"
                          color="blue"
                          leftSection={<IconPhoto size={12} />}
                          onClick={() =>
                            setVisualizarFotos({
                              title: `Fotos de ${v.nombre}`,
                              fotosNuevas: v.foto_documento,
                              fotosExistentes: typeof v.foto_documento_existente === "string" ? [v.foto_documento_existente] : (Array.isArray(v.foto_documento_existente) ? v.foto_documento_existente : []),
                            })
                          }
                        >
                          Ver {(v.foto_documento?.length ?? 0) + (v.foto_documento_existente ? 1 : 0)} foto(s)
                        </Button>
                      ) : (
                        <Text size="xs" c="zinc.6" fs="italic">
                          Sin fotos
                        </Text>
                      )}
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        color="indigo"
                        leftSection={<IconEdit size={12} />}
                        onClick={() =>
                          setEditingAcompanante({
                            index,
                            datos: {
                              nombre: v.nombre,
                              apellido: v.apellido,
                              dni: v.dni,
                              telefono: v.telefono,
                              foto_documento: v.foto_documento,
                              id_visitante: v.id_visitante,
                            },
                          })
                        }
                      >
                        Editar
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => ctrl.eliminarVisitante(index)}
                        disabled={confirmando}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </div>
                );
              })}
            </Stack>
          </div>
        )}

        {/* Sección Vehículos Acompañantes */}
        {ctrl.vehiculos.length > 0 && (
          <div className="space-y-3">
            <Text size="xs" fw={700} className="text-zinc-400 uppercase tracking-wider">
              Vehículos Acompañantes ({ctrl.vehiculos.length})
            </Text>
            <Stack gap="sm">
              {ctrl.vehiculos.map((v) => {
                const ocupantesDeVeh = ctrl.visitantes.filter((vis) => vis.id_visita_vehiculo === v.id);
                const fotosLocalesVeh = v.archivos ?? [];
                const fotosExistentesVeh = Array.isArray(v.url_foto)
                  ? v.url_foto
                  : v.url_foto
                    ? [String(v.url_foto)]
                    : [];
                const totalFotosVeh = fotosLocalesVeh.length + fotosExistentesVeh.length;
                return (
                  <div
                    key={v.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <Group gap="xs">
                        <IconTruck className="w-5 h-5 text-indigo-400" />
                        <Text size="sm" fw={700} className="text-zinc-100 font-mono uppercase tracking-wider">
                          Placa: {v.placa}
                        </Text>
                        <Badge variant="subtle" color="indigo" size="xs">
                          {ocupantesDeVeh.length} ocupante(s)
                        </Badge>
                        {totalFotosVeh > 0 ? (
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            color="blue"
                            leftSection={<IconPhoto size={12} />}
                            onClick={() =>
                              setVisualizarFotos({
                                title: `Fotos del Vehículo ${v.placa}`,
                                fotosNuevas: fotosLocalesVeh,
                                fotosExistentes: fotosExistentesVeh,
                              })
                            }
                          >
                            Ver {totalFotosVeh} foto(s) vehículo
                          </Button>
                        ) : (
                          <Text size="xs" c="zinc.6" fs="italic">
                            Sin fotos
                          </Text>
                        )}
                        <Button
                          variant="subtle"
                          size="compact-xs"
                          color="indigo"
                          leftSection={<IconEdit size={12} />}
                          onClick={() =>
                            setEditingVehiculo({
                              id: v.id,
                              datos: {
                                placa: v.placa,
                                fotos: v.archivos,
                                cantidadPersonas: v.cantidad_personas ?? ocupantesDeVeh.length,
                              },
                            })
                          }
                        >
                          Editar
                        </Button>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => ctrl.eliminarVehiculo(v.id)}
                        disabled={ctrl.loadingVehiculo || confirmando}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </div>

                    {ocupantesDeVeh.length > 0 ? (
                      <div className="space-y-2 pl-2">
                        {ocupantesDeVeh.map((oc, slotIdx) => {
                          const idxOriginal = ctrl.visitantes.findIndex((vis) => vis === oc);
                          const tieneDatos = Boolean(oc.nombre && oc.nombre.trim());
                          return (
                            <div
                              key={`veh-${v.id}-${idxOriginal}`}
                              className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/60 p-2 px-3"
                            >
                              {tieneDatos ? (
                                <Group gap="xs">
                                  <Text size="xs" className="text-zinc-100 font-semibold">
                                    {oc.nombre} {oc.apellido ?? ""}
                                  </Text>
                                  {oc.dni && (
                                    <Text size="xs" c="zinc.5">
                                      ({oc.dni})
                                    </Text>
                                  )}
                                  {oc.es_conductor ? (
                                    <Badge color="indigo" variant="light" size="xs">
                                      Conductor Vehículo
                                    </Badge>
                                  ) : (
                                    <Badge color="gray" variant="light" size="xs">
                                      Acompañante
                                    </Badge>
                                  )}
                                  {(Boolean(oc.foto_documento?.length) || Boolean(oc.foto_documento_existente)) ? (
                                    <Button
                                      variant="subtle"
                                      size="compact-xs"
                                      color="blue"
                                      leftSection={<IconPhoto size={12} />}
                                      onClick={() =>
                                        setVisualizarFotos({
                                          title: `Fotos de ${oc.nombre}`,
                                          fotosNuevas: oc.foto_documento,
                                          fotosExistentes: typeof oc.foto_documento_existente === "string" ? [oc.foto_documento_existente] : (Array.isArray(oc.foto_documento_existente) ? oc.foto_documento_existente : []),
                                        })
                                      }
                                    >
                                      {(oc.foto_documento?.length ?? 0) + (oc.foto_documento_existente ? 1 : 0)} foto(s)
                                    </Button>
                                  ) : null}
                                </Group>
                              ) : (
                                <Group gap="xs">
                                  <Badge color="yellow" variant="dot" size="xs">
                                    Ocupante #{slotIdx + 1}
                                  </Badge>
                                  <Text size="xs" c="zinc.5">
                                    Sin datos completados
                                  </Text>
                                </Group>
                              )}

                              <Group gap={6}>
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  color={tieneDatos ? "indigo" : "yellow"}
                                  leftSection={tieneDatos ? <IconEdit size={12} /> : <IconUserPlus size={12} />}
                                  onClick={() =>
                                    setEditingSlot({
                                      index: idxOriginal,
                                      vehiculoPlaca: v.placa,
                                      slotNum: slotIdx + 1,
                                      datos: {
                                        nombre: oc.nombre,
                                        apellido: oc.apellido,
                                        dni: oc.dni,
                                        telefono: oc.telefono,
                                        es_conductor: oc.es_conductor,
                                        foto_documento: oc.foto_documento,
                                      },
                                    })
                                  }
                                >
                                  {tieneDatos ? "Editar" : "Completar Datos"}
                                </Button>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="xs"
                                  onClick={() => ctrl.eliminarVisitante(idxOriginal)}
                                  disabled={confirmando}
                                >
                                  <IconX size={14} />
                                </ActionIcon>
                              </Group>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Text size="xs" c="zinc.5" fs="italic">
                        Sin ocupantes registrados para este vehículo.
                      </Text>
                    )}
                  </div>
                );
              })}
            </Stack>
          </div>
        )}

        {/* Modales secundarios */}
        <AgregarAcompananteModal
          opened={openModalAcompanante || Boolean(editingAcompanante)}
          datosIniciales={editingAcompanante?.datos}
          onClose={() => {
            setOpenModalAcompanante(false);
            setEditingAcompanante(null);
          }}
          onGuardar={(datos) => {
            if (editingAcompanante !== null) {
              ctrl.setVisitante(editingAcompanante.index, datos);
              setEditingAcompanante(null);
            } else {
              ctrl.agregarAcompananteUnidad(datos);
            }
          }}
        />

        <AgregarVehiculoModal
          opened={openModalVehiculo || Boolean(editingVehiculo)}
          datosIniciales={editingVehiculo?.datos}
          onClose={() => {
            setOpenModalVehiculo(false);
            setEditingVehiculo(null);
          }}
          onGuardar={(placa, fotos, cantidadPersonas) => {
            if (editingVehiculo !== null) {
              ctrl.editarVehiculoConSlots(editingVehiculo.id, placa, fotos, cantidadPersonas);
              setEditingVehiculo(null);
            } else {
              ctrl.agregarVehiculoConSlots(placa, fotos, cantidadPersonas);
            }
          }}
        />

        <RegistrarOcupanteModal
          opened={Boolean(editingSlot)}
          placaVehiculo={editingSlot?.vehiculoPlaca}
          numeroSlot={editingSlot?.slotNum}
          datosIniciales={editingSlot?.datos}
          onClose={() => setEditingSlot(null)}
          onGuardar={(datos) => {
            if (editingSlot !== null) {
              ctrl.setVisitante(editingSlot.index, datos);
            }
          }}
        />

        <VerFotosModal
          opened={Boolean(visualizarFotos)}
          title={visualizarFotos?.title}
          fotosNuevas={visualizarFotos?.fotosNuevas}
          fotosExistentes={visualizarFotos?.fotosExistentes}
          onClose={() => setVisualizarFotos(null)}
        />

        {/* Modal: Registro de Nuevo Conductor */}
        <ModalEstandar
          opened={openConductorModal}
          close={() => setOpenConductorModal(false)}
          title="Registrar Nuevo Conductor"
          size="md"
        >
          <RegistroConductor
            onCancel={() => setOpenConductorModal(false)}
            onSuccess={(c) => {
              ctrl.handleConductorCreado(c);
              setOpenConductorModal(false);
            }}
          />
        </ModalEstandar>

        {/* Modal: Registro Rápido de Vehículo */}
        <ModalEstandar
          opened={openVehiculoSimpleModal}
          close={() => setOpenVehiculoSimpleModal(false)}
          title="Registrar Nuevo Vehículo"
          size="md"
        >
          <RegistroVehiculoSimple
            idEmpresaTransporte={ctrl.programacion?.id_empresa_transporte ?? ctrl.idEmpresaTransporteEditado ?? null}
            idTipoVehiculo={ctrl.programacion?.id_tipo_vehiculo ?? ctrl.idTipoVehiculoEditado ?? null}
            onCancel={() => setOpenVehiculoSimpleModal(false)}
            onSuccess={(v) => {
              ctrl.handleVehiculoCreado(v);
              if (!ctrl.programacion?.id_vehiculo) {
                ctrl.setIdVehiculoEditado(v.id_vehiculo);
              }
              setOpenVehiculoSimpleModal(false);
            }}
          />
        </ModalEstandar>

        {/* Modal: Registro Rápido de Tipo de Vehículo */}
        <ModalEstandar
          opened={openTipoVehiculoModal}
          close={() => setOpenTipoVehiculoModal(false)}
          title="Registrar Nuevo Tipo de Vehículo"
          size="md"
        >
          <RegistroTipoVehiculoSimple
            onCancel={() => setOpenTipoVehiculoModal(false)}
            onSuccess={(tv) => {
              ctrl.handleTipoVehiculoCreado(tv.id_tipo_vehiculo);
              setOpenTipoVehiculoModal(false);
            }}
          />
        </ModalEstandar>

        {/* Modal: Registro Rápido de Empresa de Transporte */}
        <ModalEstandar
          opened={openEmpresaModal}
          close={() => setOpenEmpresaModal(false)}
          title="Nueva Empresa de Transporte"
          size="lg"
        >
          <RegistroEmpresaTransporte
            onCancel={() => setOpenEmpresaModal(false)}
            onSuccess={(e) => {
              ctrl.handleEmpresaCreada(e);
              setOpenEmpresaModal(false);
            }}
          />
        </ModalEstandar>

        {/* Modal: Registro Rápido de Proveedor Minero */}
        <ModalRegistroProveedor
          opened={openProveedorModal}
          onClose={() => setOpenProveedorModal(false)}
          onSuccess={(p) => {
            ctrl.handleProveedorCreado(p);
            setOpenProveedorModal(false);
          }}
        />

        {/* Acciones */}
        <Group justify="flex-end" gap="md" mt="xl">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={confirmando}
            radius="xl"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            Cancelar
          </Button>
          <Button
            loading={confirmando}
            onClick={handleConfirmar}
            radius="xl"
            size="sm"
            leftSection={<IconCheck size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
          >
            {programacion ? "Confirmar Programación" : "Registrar Recepción"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};




