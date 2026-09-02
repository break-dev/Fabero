import { useState } from "react";
import { Text, Button, Select, Textarea, Badge, Group, ActionIcon, Tooltip, Stack } from "@mantine/core";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import { IconPaperclip, IconClipboardCheck, IconPencil, IconHistory, IconTruck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import { useNotify } from "../../../../hooks/useNotify";
import { EstadoSalida } from "../../../../shared/enums/_generic/estado-salida";

interface Props {
  recepciones: RecepcionUnidadResponse[];
  loading: boolean;
  onUpdateRecepcion: (r: RecepcionUnidadResponse) => void;
  onConfirmarProgramacion: (r: RecepcionUnidadResponse) => void;
  onEditarObservacionEvidencias: (r: RecepcionUnidadResponse) => void;
  onVerHistorial: (r: RecepcionUnidadResponse) => void;
}

export const TablaRecepciones = ({
  recepciones,
  loading,
  onUpdateRecepcion,
  onConfirmarProgramacion,
  onEditarObservacionEvidencias,
  onVerHistorial,
}: Props) => {
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [exitRecord, setExitRecord] = useState<RecepcionUnidadResponse | null>(null);
  const [estadoSalida, setEstadoSalida] = useState<EstadoSalida | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [evidenciasSalida, setEvidenciasSalida] = useState<File[]>([]);
  const [savingExit, setSavingExit] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const handleOpenEvidencias = (evidencias: IArchivo[]) => {
    setSelectedEvidencias(evidencias);
    setModalOpen(true);
  };

  const formatFecha = (fechaStr: string | null | undefined) => {
    if (!fechaStr) return "—";
    try {
      const date = new Date(fechaStr.replace(" ", "T"));
      if (isNaN(date.getTime())) return fechaStr;

      const pad = (num: number) => num.toString().padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  const handleSaveExit = async () => {
    if (!exitRecord) return;
    if (!estadoSalida) {
      notifyError("Debe seleccionar el estado de la unidad.");
      return;
    }

    setSavingExit(true);
    try {
      const updated = await RecepcionUnidadesService.registrarSalida(exitRecord.id, {
        estado_salida: estadoSalida,
        observacion_salida: observacionSalida,
        evidencias: evidenciasSalida,
      });
      notifySuccess("Salida de unidad registrada correctamente");
      onUpdateRecepcion(updated);
      setExitRecord(null);
      setEstadoSalida(null);
      setObservacionSalida("");
      setEvidenciasSalida([]);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al registrar la salida");
    } finally {
      setSavingExit(false);
    }
  };

  return (
    <>
      <DataTableEstandar
        idAccessor="id"
        records={recepciones}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
          },
          {
            accessor: "acciones",
            title: "Acciones",
            textAlign: "center",
            width: 110,
            render: (r: RecepcionUnidadResponse) => {
              const tieneObservacionoEvidencias =
                (r.observacion !== null && r.observacion.trim().length > 0) ||
                (Array.isArray(r.evidencias) && r.evidencias.length > 0);

              const noConfirmada = r.es_programacion && !r.id_empleado_recepcion;
              const disabledReason = "Confirme la programación para habilitar";

              return (
                <Group gap={6} wrap="nowrap" justify="center">
                  <Tooltip
                    label={
                      Array.isArray(r.evidencias) && r.evidencias.length > 0
                        ? `Ver ${r.evidencias.length} evidencia(s)`
                        : "Sin evidencias"
                    }
                    withArrow
                  >
                    <ActionIcon
                      variant="light"
                      color="indigo"
                      radius="xl"
                      size="md"
                      disabled={
                        !Array.isArray(r.evidencias) || r.evidencias.length === 0
                      }
                      onClick={() => handleOpenEvidencias(r.evidencias)}
                      className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/10 disabled:opacity-40"
                    >
                      <IconPaperclip size={16} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip
                    label={
                      noConfirmada ? disabledReason : "Ver historial de cambios"
                    }
                    withArrow
                  >
                    <ActionIcon
                      variant="light"
                      color="gray"
                      radius="xl"
                      size="md"
                      disabled={noConfirmada}
                      onClick={() => onVerHistorial(r)}
                      className="bg-zinc-700/10 hover:bg-zinc-700/20 text-zinc-400 border border-zinc-500/10 disabled:opacity-40"
                    >
                      <IconHistory size={16} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip
                    label={
                      noConfirmada
                        ? disabledReason
                        : tieneObservacionoEvidencias
                          ? "Editar observación y evidencias"
                          : "Agregar observación y evidencias"
                    }
                    withArrow
                  >
                    <ActionIcon
                      variant="light"
                      color="indigo"
                      radius="xl"
                      size="md"
                      disabled={noConfirmada}
                      onClick={() => onEditarObservacionEvidencias(r)}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 disabled:opacity-40"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              );
            },
          },
          {
            accessor: "tipo",
            title: "Tipo",
            width: 170,
            textAlign: "center",
            render: (r: RecepcionUnidadResponse) => {
              const esProgramacionSinConfirmar =
                r.es_programacion && !r.id_empleado_recepcion;

              const badge = (() => {
                if (esProgramacionSinConfirmar) {
                  return (
                    <Badge color="yellow" variant="light" radius="md" size="sm">
                      Programación
                    </Badge>
                  );
                }
                if (r.es_programacion && r.id_empleado_recepcion) {
                  return (
                    <Badge color="indigo" variant="light" radius="md" size="sm">
                      Confirmada
                    </Badge>
                  );
                }
                return (
                  <Badge color="gray" variant="light" radius="md" size="sm">
                    Directa
                  </Badge>
                );
              })();

              return (
                <Group gap={6} wrap="nowrap" justify="center">
                  {badge}
                  {esProgramacionSinConfirmar && (
                    <Tooltip label="Confirmar información" withArrow>
                      <ActionIcon
                        variant="filled"
                        color="indigo"
                        radius="xl"
                        size="md"
                        onClick={() => onConfirmarProgramacion(r)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        <IconClipboardCheck size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              );
            },
          },
          {
            accessor: "vehiculo_placa",
            title: "Vehículo",
            textAlign: "center",
            width: 170,
            render: (r: RecepcionUnidadResponse) => {
              if (!r.vehiculo_placa) {
                return (
                  <Text size="xs" className="text-zinc-500 italic">
                    (sin asignar)
                  </Text>
                );
              }
              return (
                <div className="flex flex-col gap-1.5 items-center">
                  <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                    {r.vehiculo_placa}
                  </div>
                  <Text size="xs" className="text-zinc-500 italic">
                    {r.tipo_vehiculo_nombre ?? ""}
                  </Text>
                </div>
              );
            },
          },
          {
            accessor: "empresa_transporte_razon_social",
            title: "Transportista",
            textAlign: "center",
            width: 200,
            render: (r: RecepcionUnidadResponse) => (
              <div>
                <Text size="sm" className="text-zinc-200 max-w-47.5" truncate title={r.empresa_transporte_razon_social}>
                  {r.empresa_transporte_razon_social}
                </Text>
              </div>
            ),
          },
          {
            accessor: "fecha_hora_ingreso",
            title: "Fecha Ingreso",
            textAlign: "center",
            width: 180,
            render: (r: RecepcionUnidadResponse) => (
              <div>
                <Text size="sm" className="text-zinc-200" fw={500}>
                  {formatFecha(r.fecha_hora_ingreso)}
                </Text>
                {r.fecha_hora_ingreso && (
                  <Text size="xs" className="text-zinc-500">
                    Por: {r.empleado_recepcion_nombre ?? r.empleado_registro_nombre ?? "—"}
                  </Text>
                )}
              </div>
            ),
          },
          {
            accessor: "fecha_estimada_llegada",
            title: "F. Est. Llegada",
            textAlign: "center",
            width: 180,
            render: (r: RecepcionUnidadResponse) => (
              <div>
                <Text size="sm" className="text-zinc-200" fw={500}>
                  {r.fecha_estimada_llegada ?? "—"}
                </Text>
                {r.fecha_estimada_llegada && (
                  <Text size="xs" className="text-zinc-500">
                    Autorizó: {r.empleado_autoriza_nombre ?? "—"}
                  </Text>
                )}
              </div>
            ),
          },
          {
            accessor: "fecha_hora_salida",
            title: "Salida",
            textAlign: "center",
            width: 170,
            render: (r: RecepcionUnidadResponse) => (
              <Stack gap={4} align="center">
                {r.fecha_hora_salida ? (
                  <Text size="sm" className="text-zinc-200" fw={500}>
                    {formatFecha(r.fecha_hora_salida)}
                  </Text>
                ) : (
                  !(r.es_programacion && !r.id_empleado_recepcion) && (
                    <Button
                      size="compact-xs"
                      color="red"
                      radius="lg"
                      leftSection={<IconTruck size={12} />}
                      onClick={() => {
                        setExitRecord(r);
                        setEstadoSalida(null);
                        setObservacionSalida("");
                        setEvidenciasSalida([]);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold h-6 px-2.5"
                    >
                      Registrar Salida
                    </Button>
                  )
                )}
              </Stack>
            ),
          },
          {
            accessor: "conductor_nombre_completo",
            title: "Conductor",
            textAlign: "center",
            width: 200,
            render: (r: RecepcionUnidadResponse) => (
              <div>
                <Text size="sm" className="text-zinc-200" fw={500}>
                  {r.conductor_nombre_completo ?? "—"}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  Licencia: {r.conductor_numero_licencia ?? "—"}
                </Text>
              </div>
            ),
          },
          {
            accessor: "observacion",
            title: "Observación",
            textAlign: "center",
            width: 200,
            render: (r: RecepcionUnidadResponse) => {
              if (!r.observacion) {
                return <Text size="xs" className="text-zinc-500 italic max-w-45">—</Text>;
              }
              return (
                <Tooltip label={r.observacion} multiline w={320} withArrow>
                  <Text size="xs" className="text-zinc-400 italic max-w-45 truncate">
                    {r.observacion}
                  </Text>
                </Tooltip>
              );
            },
          },
          {
            accessor: "estado_salida",
            title: "Estado Unidad",
            textAlign: "center",
            width: 150,
            render: (r: RecepcionUnidadResponse) => (
              <Group gap="xs" justify="center">
                <Text size="sm" className="text-zinc-200">
                  {r.estado_salida ?? r.estado ?? "—"}
                </Text>
              </Group>
            ),
          },
          {
            accessor: "observacion_salida",
            title: "Observación Salida",
            textAlign: "center",
            width: 200,
            render: (r: RecepcionUnidadResponse) => {
              if (!r.observacion_salida) {
                return <Text size="xs" className="text-zinc-500 italic max-w-45">—</Text>;
              }
              return (
                <Tooltip label={r.observacion_salida} multiline w={320} withArrow>
                  <Text size="xs" className="text-zinc-400 italic max-w-45 truncate">
                    {r.observacion_salida}
                  </Text>
                </Tooltip>
              );
            },
          },
        ]}
      />

      <ModalEstandar
        opened={modalOpen}
        close={() => {
          setModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Evidencias Registradas"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>

      <ModalEstandar
        opened={!!exitRecord}
        close={() => setExitRecord(null)}
        title="Registro de Salida"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Estado Unidad"
            placeholder="Elija una opción..."
            data={[
              { value: EstadoSalida.ConCarga, label: EstadoSalida.ConCarga },
              { value: EstadoSalida.Vacio, label: EstadoSalida.Vacio },
            ]}
            value={estadoSalida}
            onChange={(val) => setEstadoSalida(val as EstadoSalida)}
            required
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <Textarea
            label="Observación"
            placeholder="Escriba alguna observación de salida..."
            value={observacionSalida}
            onChange={(e) => setObservacionSalida(e.target.value)}
            minRows={3}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <MultiFilePicker
            label="Evidencias de Salida"
            files={evidenciasSalida}
            onFilesChange={setEvidenciasSalida}
          />
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => setExitRecord(null)}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExit}
              loading={savingExit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
            >
              Grabar
            </Button>
          </div>
        </div>
      </ModalEstandar>
    </>
  );
};
