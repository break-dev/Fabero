import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Select,
  Textarea,
  Alert,
  ActionIcon,
  Text,
  Loader,
  Group,
  Stack,
  Badge,
  TextInput,
  NumberInput,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconExclamationCircle,
  IconTrash,
  IconEdit,
  IconUserPlus,
  IconTruck,
  IconUserCheck,
  IconPhoto,
  IconSearch,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { useRegistroVisita, type VisitanteFormItem } from "../../hooks/useRegistroVisita";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroMotivoIngreso } from "../../../../presentation/utils/registro-motivo-ingreso";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { useAIFileAnalysis } from "../../../../hooks/ia/useAIFileAnalysis";
import {
  isCompleteDatos,
  visitanteIAPrompt,
  visitanteIASchema,
  type IDatosVisitanteExtraidos,
} from "../../service/visitante.ia.schema";
import { useRecepcionVisitasContextStore } from "../../stores/recepcion-visitas-context.store";
import type { RecepcionVisitaResponse } from "../../service/recepcion-visitas.responses";

interface Props {
  onCancel: () => void;
  onSuccess: (r: RecepcionVisitaResponse) => void;
}

const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const RegistroVisita = ({ onCancel, onSuccess }: Props) => {
  const {
    payload,
    handleChange,
    vehiculos,
    visitantes,
    setVisitantes,
    evidencias,
    setEvidencias,
    loadingVehiculo,
    agregarVehiculoConSlots,
    editarVehiculoConSlots,
    eliminarVehiculo,
    marcarConductorVehiculo,
    handleAgregarVisitanteIndividual,
    handleActualizarVisitante,
    handleRemoverVisitante,
    submit,
    loading,
    error,
    empleados,
    motivos,
    loadingCatalogos,
    handleMotivoCreado,
  } = useRegistroVisita(onSuccess);

  // Sub-modales
  const [openModalMotivo, setOpenModalMotivo] = useState(false);
  const [openModalVehiculo, setOpenModalVehiculo] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<{
    id: number;
    datos: { placa: string; fotos?: File[]; cantidadPersonas: number };
  } | null>(null);

  const [openModalAcompanante, setOpenModalAcompanante] = useState(false);
  const [editingAcompanante, setEditingAcompanante] = useState<{
    index: number;
    datos: {
      nombre: string;
      apellido: string;
      dni: string;
      telefono: string;
      foto_documento: File[];
    };
  } | null>(null);

  const [visualizarFotos, setVisualizarFotos] = useState<{
    title: string;
    fotosNuevas?: File[];
    fotosExistentes?: string[];
  } | null>(null);

  // Form local para nuevo vehículo
  const [formVehiculo, setFormVehiculo] = useState<{
    placa: string;
    cantidadPersonas: number;
    fotos: File[];
  }>({
    placa: "",
    cantidadPersonas: 1,
    fotos: [],
  });

  // Form local para visitante / acompañante
  const [visitorForm, setVisitorForm] = useState<{
    id_visitante?: number;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    fotos_documento: File[];
  }>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    fotos_documento: [],
  });

  const [searchingDni, setSearchingDni] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  const { notifySuccess, notifyInfo, notifyError } = useNotify();
  const { analyze: analyzeDocumentoIA, loading: loadingIA, reset: resetIA } =
    useAIFileAnalysis<IDatosVisitanteExtraidos>();

  const setFormEnCurso = useRecepcionVisitasContextStore(
    (s) => s.setFormEnCurso,
  );

  useEffect(() => {
    const motivo =
      motivos.find((m) => m.id_motivo_ingreso === payload.id_motivo_ingreso)
        ?.nombre ?? null;
    const empleado =
      empleados.find((e) => e.id_empleado === payload.id_empleado_contacto)
        ?.nombre_completo ?? null;

    setFormEnCurso({
      motivo_ingreso: motivo,
      empleado_contacto: empleado,
      observacion: payload.observacion ?? "",
      total_visitantes_en_formulario: visitantes.length,
      visitante_en_edicion: openModalAcompanante
        ? {
            dni: visitorForm.dni,
            nombre: visitorForm.nombre,
            apellido: visitorForm.apellido,
            telefono: visitorForm.telefono,
            total_fotos: visitorForm.fotos_documento.length,
          }
        : null,
      vehiculo_en_edicion: openModalVehiculo
        ? {
            placa: formVehiculo.placa,
            cantidad_personas: formVehiculo.cantidadPersonas,
            total_fotos: formVehiculo.fotos.length,
          }
        : null,
    });
  }, [
    payload.id_motivo_ingreso,
    payload.id_empleado_contacto,
    payload.observacion,
    visitantes.length,
    openModalAcompanante,
    visitorForm,
    openModalVehiculo,
    formVehiculo,
    motivos,
    empleados,
    setFormEnCurso,
  ]);

  const handleExtraerDatosIA = async () => {
    if (visitorForm.fotos_documento.length === 0) {
      notifyError("Adjunta al menos una foto del documento de identidad.");
      return;
    }
    resetIA();
    const response = await analyzeDocumentoIA({
      archivos: visitorForm.fotos_documento,
      prompt: visitanteIAPrompt,
      schema: visitanteIASchema,
      temperature: 0,
    });

    const datos = response?.structured ?? null;

    if (isCompleteDatos(datos)) {
      setVisitorForm((prev) => ({
        ...prev,
        dni: datos.dni,
        nombre: datos.nombre,
        apellido: datos.apellido,
      }));
      notifySuccess(
        "Datos extraídos del documento. Verifica antes de continuar.",
      );
      return;
    }

    if (datos && (datos.dni || datos.nombre || datos.apellido)) {
      setVisitorForm((prev) => ({
        ...prev,
        dni: datos.dni ?? prev.dni,
        nombre: datos.nombre ?? prev.nombre,
        apellido: datos.apellido ?? prev.apellido,
      }));
      notifyInfo(
        "La IA extrajo algunos datos. Completa los campos faltantes manualmente.",
      );
      return;
    }

    notifyError(
      "No se pudo leer el documento. Verifica que la foto sea clara y vuelve a intentar.",
    );
  };

  const getEmpleadosDropdown = () =>
    empleados.map((e) => ({
      value: String(e.id_empleado),
      label: e.nombre_completo,
    }));

  const getMotivosDropdown = () =>
    motivos.map((m) => ({
      value: String(m.id_motivo_ingreso),
      label: m.nombre,
    }));

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-medium text-xs mb-1.5",
  };

  const handleDniChange = async (val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(0, 8);
    setVisitorForm((prev) => ({ ...prev, dni: cleanVal }));
    setVisitorError(null);

    if (cleanVal.length === 8) {
      setSearchingDni(true);
      try {
        const res = await AuxService.buscar_visitante_por_dni(cleanVal);
        if (res.success && res.data) {
          setVisitorForm((prev) => ({
            ...prev,
            id_visitante: res.data.id_visitante,
            nombre: res.data.nombre,
            apellido: res.data.apellido,
            telefono: res.data.telefono || "",
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingDni(false);
      }
    }
  };

  // Guardar vehículo acompañante (crear o editar)
  const handleSaveVehiculo = async () => {
    if (!formVehiculo.placa.trim()) {
      setVisitorError("Debe ingresar la placa del vehículo.");
      return;
    }
    if (editingVehiculo) {
      const ok = await editarVehiculoConSlots(
        editingVehiculo.id,
        formVehiculo.placa,
        formVehiculo.fotos,
        formVehiculo.cantidadPersonas,
      );
      if (ok) {
        setEditingVehiculo(null);
        setOpenModalVehiculo(false);
      }
    } else {
      const ok = await agregarVehiculoConSlots(
        formVehiculo.placa,
        formVehiculo.fotos,
        formVehiculo.cantidadPersonas,
      );
      if (ok) {
        setFormVehiculo({ placa: "", cantidadPersonas: 1, fotos: [] });
        setOpenModalVehiculo(false);
      }
    }
  };

  // Guardar visitante individual o slot de vehículo
  const handleSaveVisitor = () => {
    setVisitorError(null);

    const nombreFinal = visitorForm.nombre.trim() || "VISITANTE";
    const apellidoFinal = visitorForm.apellido.trim();

    if (editingAcompanante !== null) {
      const actual = visitantes[editingAcompanante.index];
      const actualizado: VisitanteFormItem = {
        ...actual,
        id_visitante: visitorForm.id_visitante,
        nombre: nombreFinal,
        apellido: apellidoFinal,
        dni: visitorForm.dni,
        telefono: visitorForm.telefono,
        foto_documento: visitorForm.fotos_documento,
      };
      const ok = handleActualizarVisitante(editingAcompanante.index, actualizado);
      if (ok) {
        setEditingAcompanante(null);
        setOpenModalAcompanante(false);
      }
    } else {
      const nuevo: VisitanteFormItem = {
        id_visitante: visitorForm.id_visitante,
        nombre: nombreFinal,
        apellido: apellidoFinal,
        dni: visitorForm.dni,
        telefono: visitorForm.telefono,
        foto_documento: visitorForm.fotos_documento,
        es_conductor: false,
      };
      const ok = handleAgregarVisitanteIndividual(nuevo);
      if (ok) {
        setVisitorForm({ dni: "", nombre: "", apellido: "", telefono: "", fotos_documento: [] });
        setOpenModalAcompanante(false);
      }
    }
  };

  const visitantesPeatonales = visitantes.filter((v) => !v.id_visita_vehiculo);

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-6">
        {error && (
          <Alert
            icon={<IconExclamationCircle size={16} />}
            color="red"
            variant="filled"
            radius="lg"
          >
            {error}
          </Alert>
        )}

        <Grid gutter="md">
          {/* Motivo Visita */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Motivo Visita"
                  placeholder={loadingCatalogos ? "Cargando..." : "Elija una opción..."}
                  searchable
                  withAsterisk
                  radius="lg"
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={getMotivosDropdown()}
                  value={payload.id_motivo_ingreso ? String(payload.id_motivo_ingreso) : null}
                  onChange={(val) => handleChange("id_motivo_ingreso", val ? Number(val) : 0)}
                  classNames={fieldClasses}
                />
              </div>
              <ActionIcon
                type="button"
                variant="filled"
                color="zinc"
                radius="xl"
                size="lg"
                onClick={() => setOpenModalMotivo(true)}
                title="Registrar nuevo motivo de ingreso"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 mb-0.5 shrink-0"
              >
                <IconPlus size={18} />
              </ActionIcon>
            </div>
          </Grid.Col>

          {/* Personal Contacto */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Personal Contacto (Persona que Autoriza)"
              placeholder={loadingCatalogos ? "Cargando..." : "Elija una opción..."}
              searchable
              withAsterisk
              radius="lg"
              disabled={loadingCatalogos}
              rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
              data={getEmpleadosDropdown()}
              value={payload.id_empleado_contacto ? String(payload.id_empleado_contacto) : null}
              onChange={(val) => handleChange("id_empleado_contacto", val ? Number(val) : 0)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Observaciones */}
          <Grid.Col span={12}>
            <Textarea
              label="Observación"
              placeholder="Escriba alguna observación adicional sobre el ingreso..."
              radius="lg"
              minRows={3}
              value={payload.observacion || ""}
              onChange={(e) => handleChange("observacion", e.target.value)}
              classNames={fieldClasses}
            />
          </Grid.Col>

          {/* Evidencias de Ingreso */}
          <Grid.Col span={12}>
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
              <MultiFilePicker
                files={evidencias}
                onFilesChange={setEvidencias}
                label="Evidencias de Ingreso"
                description="Fotografías del pase de ingreso, vehículo o documentos adjuntos"
              />
            </div>
          </Grid.Col>
        </Grid>

        {/* Sección: Acompañantes y Vehículos de la Visita */}
        <div className="space-y-4 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative bg-zinc-950 px-4 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              ACOMPAÑANTES Y VEHÍCULOS DE LA VISITA
            </div>
          </div>

          <Group justify="center" gap="sm">
            <Button
              radius="xl"
              variant="default"
              size="sm"
              leftSection={<IconUserPlus size={18} className="text-indigo-400" />}
              onClick={() => {
                setVisitorForm({ dni: "", nombre: "", apellido: "", telefono: "", fotos_documento: [] });
                setEditingAcompanante(null);
                setVisitorError(null);
                setOpenModalAcompanante(true);
              }}
              disabled={loading}
              className="bg-zinc-800/80! hover:bg-zinc-700/80! text-zinc-200! border-zinc-700! shadow-sm py-2"
            >
              + Agregar Visitante
            </Button>

            <Button
              radius="xl"
              variant="default"
              size="sm"
              leftSection={<IconTruck size={18} className="text-indigo-400" />}
              onClick={() => {
                setFormVehiculo({ placa: "", cantidadPersonas: 1, fotos: [] });
                setEditingVehiculo(null);
                setVisitorError(null);
                setOpenModalVehiculo(true);
              }}
              disabled={loading}
              className="bg-zinc-800/80! hover:bg-zinc-700/80! text-zinc-200! border-zinc-700! shadow-sm py-2"
            >
              + Agregar Vehículo Acompañante
            </Button>
          </Group>

          {/* Lista de Visitantes Peatonales */}
          {visitantesPeatonales.length > 0 && (
            <div className="space-y-2">
              <Text size="xs" fw={700} className="text-zinc-400 uppercase tracking-wider">
                Visitantes Peatonales / Individuales ({visitantesPeatonales.length})
              </Text>
              <Stack gap="xs">
                {visitantes.map((v, index) => {
                  if (v.id_visita_vehiculo) return null;
                  return (
                    <div
                      key={`peatonal-${index}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                    >
                      <Group gap="sm">
                        <IconUserCheck className="w-5 h-5 text-indigo-400" />
                        <div>
                          <Group gap="xs">
                            <Text size="sm" fw={600} className="text-zinc-100">
                              {v.nombre} {v.apellido ?? ""}
                            </Text>
                            <Badge color="blue" variant="light" size="xs">
                              Peatonal
                            </Badge>
                          </Group>
                          <Text size="xs" c="zinc.5">
                            {v.dni ? `DNI: ${v.dni}` : "Sin DNI"}{" "}
                            {v.telefono ? `• Tel: ${v.telefono}` : ""}
                          </Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        {(v.foto_documento?.length ?? 0) > 0 ? (
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            color="blue"
                            leftSection={<IconPhoto size={12} />}
                            onClick={() =>
                              setVisualizarFotos({
                                title: `Fotos de ${v.nombre}`,
                                fotosNuevas: v.foto_documento,
                              })
                            }
                          >
                            Ver {v.foto_documento.length} foto(s)
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
                          onClick={() => {
                            setEditingAcompanante({
                              index,
                              datos: {
                                nombre: v.nombre,
                                apellido: v.apellido,
                                dni: v.dni,
                                telefono: v.telefono,
                                foto_documento: v.foto_documento,
                              },
                            });
                            setVisitorForm({
                              id_visitante: v.id_visitante,
                              nombre: v.nombre,
                              apellido: v.apellido,
                              dni: v.dni,
                              telefono: v.telefono,
                              fotos_documento: v.foto_documento,
                            });
                            setOpenModalAcompanante(true);
                          }}
                        >
                          Editar
                        </Button>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleRemoverVisitante(index)}
                          disabled={loading}
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

          {/* Lista de Vehículos Acompañantes y sus Ocupantes */}
          {vehiculos.length > 0 && (
            <div className="space-y-3">
              <Text size="xs" fw={700} className="text-zinc-400 uppercase tracking-wider">
                Vehículos Acompañantes ({vehiculos.length})
              </Text>
              <Stack gap="sm">
                {vehiculos.map((v) => {
                  const ocupantesDeVeh = visitantes.filter((vis) => vis.id_visita_vehiculo === v.id);
                  const fotosLocalesVeh = v.archivos ?? [];
                  const totalFotosVeh = fotosLocalesVeh.length;
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
                            onClick={() => {
                              setEditingVehiculo({
                                id: v.id,
                                datos: {
                                  placa: v.placa,
                                  fotos: v.archivos,
                                  cantidadPersonas: v.cantidad_personas ?? ocupantesDeVeh.length,
                                },
                              });
                              setFormVehiculo({
                                placa: v.placa,
                                cantidadPersonas: v.cantidad_personas ?? ocupantesDeVeh.length,
                                fotos: v.archivos ?? [],
                              });
                              setOpenModalVehiculo(true);
                            }}
                          >
                            Editar
                          </Button>
                        </Group>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => eliminarVehiculo(v.id)}
                          disabled={loadingVehiculo || loading}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </div>

                      {ocupantesDeVeh.length > 0 && (
                        <div className="space-y-2 pl-2">
                          {ocupantesDeVeh.map((oc, slotIdx) => {
                            const idxOriginal = visitantes.findIndex((vis) => vis === oc);
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
                                      <Badge color="indigo" variant="light" size="xs" className="cursor-default">
                                        Conductor Vehículo
                                      </Badge>
                                    ) : (
                                      <Badge
                                        color="gray"
                                        variant="subtle"
                                        size="xs"
                                        className="cursor-pointer hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                                        onClick={() => marcarConductorVehiculo(v.id, idxOriginal)}
                                      >
                                        Hacer Conductor
                                      </Badge>
                                    )}
                                    {(oc.foto_documento?.length ?? 0) > 0 ? (
                                      <Button
                                        variant="subtle"
                                        size="compact-xs"
                                        color="blue"
                                        leftSection={<IconPhoto size={12} />}
                                        onClick={() =>
                                          setVisualizarFotos({
                                            title: `Fotos de ${oc.nombre}`,
                                            fotosNuevas: oc.foto_documento,
                                          })
                                        }
                                      >
                                        Ver {oc.foto_documento.length} foto(s)
                                      </Button>
                                    ) : (
                                      <Text size="xs" c="zinc.6" fs="italic">
                                        Sin foto
                                      </Text>
                                    )}
                                  </Group>
                                ) : (
                                  <Group gap="xs">
                                    <Badge color="dark" variant="outline" size="xs">
                                      Slot #{slotIdx + 1}
                                    </Badge>
                                    <Text size="xs" c="zinc.5" fs="italic">
                                      {oc.es_conductor
                                        ? "Conductor (Sin registrar datos)"
                                        : "Acompañante sin registrar datos (no se guardará)"}
                                    </Text>
                                  </Group>
                                )}

                                <Group gap="xs">
                                  <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    color="indigo"
                                    leftSection={<IconEdit size={12} />}
                                    onClick={() => {
                                      setEditingAcompanante({
                                        index: idxOriginal,
                                        datos: {
                                          nombre: oc.nombre,
                                          apellido: oc.apellido,
                                          dni: oc.dni,
                                          telefono: oc.telefono,
                                          foto_documento: oc.foto_documento,
                                        },
                                      });
                                      setVisitorForm({
                                        id_visitante: oc.id_visitante,
                                        nombre: oc.nombre,
                                        apellido: oc.apellido,
                                        dni: oc.dni,
                                        telefono: oc.telefono,
                                        fotos_documento: oc.foto_documento,
                                      });
                                      setOpenModalAcompanante(true);
                                    }}
                                  >
                                    {tieneDatos ? "Editar" : "Llenar Datos"}
                                  </Button>
                                  {tieneDatos && (
                                    <ActionIcon
                                      variant="subtle"
                                      color="gray"
                                      size="sm"
                                      onClick={() => {
                                        setVisitantes((prev) =>
                                          prev.map((vis, i) =>
                                            i === idxOriginal
                                              ? {
                                                  ...vis,
                                                  nombre: "",
                                                  apellido: "",
                                                  dni: "",
                                                  telefono: "",
                                                  foto_documento: [],
                                                }
                                              : vis,
                                          ),
                                        );
                                      }}
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  )}
                                </Group>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Stack>
            </div>
          )}
        </div>

        {/* Botones del formulario */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onCancel}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            type="submit"
            loading={loading}
            radius="lg"
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            Confirmar y Registrar Visita
          </Button>
        </div>
      </form>

      {/* Sub-modal: Agregar / Editar Vehículo Acompañante */}
      <ModalEstandar
        opened={openModalVehiculo}
        close={() => setOpenModalVehiculo(false)}
        title={editingVehiculo ? "Editar Vehículo Acompañante" : "Agregar Vehículo Acompañante"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {visitorError && (
            <Alert icon={<IconExclamationCircle size={16} />} color="red" variant="filled" radius="lg">
              {visitorError}
            </Alert>
          )}

          <TextInput
            label="Placa del Vehículo"
            placeholder="Ej. F1B-890"
            required
            maxLength={7}
            radius="lg"
            value={formVehiculo.placa}
            onChange={(e) =>
              setFormVehiculo((prev) => ({ ...prev, placa: formatPlaca(e.target.value) }))
            }
            classNames={fieldClasses}
          />

          <NumberInput
            label="Cantidad de Personas (Ocupantes)"
            placeholder="1"
            min={1}
            required
            radius="lg"
            value={formVehiculo.cantidadPersonas}
            onChange={(val) =>
              setFormVehiculo((prev) => ({
                ...prev,
                cantidadPersonas: typeof val === "number" ? Math.max(1, val) : 1,
              }))
            }
            classNames={fieldClasses}
          />

          <MultiFilePicker
            files={formVehiculo.fotos}
            onFilesChange={(files) => setFormVehiculo((prev) => ({ ...prev, fotos: files }))}
            label="Fotografía del Vehículo (Opcional)"
            description="Adjunte imágenes del vehículo o placa"
          />

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
            <Button variant="subtle" color="gray" radius="lg" onClick={() => setOpenModalVehiculo(false)}>
              Cancelar
            </Button>
            <Button
              radius="lg"
              loading={loadingVehiculo}
              onClick={handleSaveVehiculo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Guardar Vehículo
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Sub-modal: Agregar / Editar Visitante */}
      <ModalEstandar
        opened={openModalAcompanante}
        close={() => setOpenModalAcompanante(false)}
        title={editingAcompanante !== null ? "Editar Datos del Visitante" : "Agregar Visitante"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {visitorError && (
            <Alert icon={<IconExclamationCircle size={16} />} color="red" variant="filled" radius="lg">
              {visitorError}
            </Alert>
          )}

          <TextInput
            label="DNI (8 dígitos)"
            placeholder="Ingrese DNI..."
            radius="lg"
            value={visitorForm.dni}
            onChange={(e) => handleDniChange(e.target.value)}
            rightSection={searchingDni ? <Loader size={16} /> : <IconSearch size={16} className="text-zinc-500" />}
            classNames={fieldClasses}
          />

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <TextInput
                label="Nombres (Opcional)"
                placeholder="Nombre(s)"
                radius="lg"
                value={visitorForm.nombre}
                onChange={(e) => setVisitorForm((prev) => ({ ...prev, nombre: e.target.value }))}
                classNames={fieldClasses}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Apellidos (Opcional)"
                placeholder="Apellido(s)"
                radius="lg"
                value={visitorForm.apellido}
                onChange={(e) => setVisitorForm((prev) => ({ ...prev, apellido: e.target.value }))}
                classNames={fieldClasses}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Teléfono / Celular (Opcional)"
            placeholder="987654321"
            radius="lg"
            value={visitorForm.telefono}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, telefono: e.target.value }))}
            classNames={fieldClasses}
          />

          <MultiFilePicker
            files={visitorForm.fotos_documento}
            onFilesChange={(files) => setVisitorForm((prev) => ({ ...prev, fotos_documento: files }))}
            label="Foto del Documento de Identidad"
            description="Suba fotografías legibles del DNI o carné"
          />

          <div className="flex justify-end">
            <Button
              type="button"
              size="xs"
              radius="lg"
              variant="light"
              color="violet"
              leftSection={
                loadingIA ? (
                  <Loader size={14} color="violet" />
                ) : (
                  <IconSparkles size={14} />
                )
              }
              onClick={handleExtraerDatosIA}
              loading={loadingIA}
              disabled={loadingIA || visitorForm.fotos_documento.length === 0}
              className="bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 border border-violet-500/30 font-bold"
            >
              {loadingIA ? "Leyendo documento..." : "Extraer datos con IA"}
            </Button>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
            <Button variant="subtle" color="gray" radius="lg" onClick={() => setOpenModalAcompanante(false)}>
              Cancelar
            </Button>
            <Button radius="lg" onClick={handleSaveVisitor} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Guardar Datos
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal: Visualizar Fotografías */}
      <ModalEstandar
        opened={!!visualizarFotos}
        close={() => setVisualizarFotos(null)}
        title={visualizarFotos?.title || "Fotografías Adjuntas"}
        size="md"
      >
        <div className="space-y-4">
          {visualizarFotos?.fotosNuevas && visualizarFotos.fotosNuevas.length > 0 && (
            <div>
              <Text size="xs" fw={700} className="text-zinc-400 mb-2 uppercase">
                Archivos Locales Cargados:
              </Text>
              <div className="flex flex-col gap-2">
                {visualizarFotos.fotosNuevas.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
                    <IconPhoto size={16} className="text-indigo-400 shrink-0" />
                    <Text size="xs" c="zinc.3" className="truncate font-mono">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visualizarFotos?.fotosExistentes && visualizarFotos.fotosExistentes.length > 0 && (
            <div>
              <Text size="xs" fw={700} className="text-zinc-400 mb-2 uppercase">
                Archivos en Servidor:
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {visualizarFotos.fotosExistentes.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 hover:border-indigo-500 transition-all"
                  >
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-32 object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <Button variant="subtle" color="gray" radius="lg" onClick={() => setVisualizarFotos(null)}>
              Cerrar
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal: Registrar Nuevo Motivo de Ingreso */}
      <ModalEstandar
        opened={openModalMotivo}
        close={() => setOpenModalMotivo(false)}
        title="Registrar Nuevo Motivo de Ingreso"
        size="md"
      >
        <RegistroMotivoIngreso
          onCancel={() => setOpenModalMotivo(false)}
          onSuccess={(nuevoMotivo) => {
            handleMotivoCreado(nuevoMotivo);
            setOpenModalMotivo(false);
          }}
        />
      </ModalEstandar>
    </>
  );
};
