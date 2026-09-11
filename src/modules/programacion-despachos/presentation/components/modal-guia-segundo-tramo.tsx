import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  FileButton,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconFileText,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { MOTIVO_TRASLADO_OPTIONS } from "../../../../shared/enums/_generic/motivo-traslado";
import type { MotivoTraslado } from "../../../../shared/enums/_generic/motivo-traslado";
import { useGuiaSegundoTramo } from "../../hooks/useGuiaSegundoTramo";
import type {
  GuiaSegundoTramo,
  GuiaSegundoTramoDocumento,
} from "../../service/programacion-despachos.responses";

interface Props {
  opened: boolean;
  idDistribucion: number;
  /** Guia existente si la distribucion ya tiene una. Si es null, modo "registrar". */
  guia: GuiaSegundoTramo | null;
  /** Correlativo/distribucion info para mostrar en el modal. */
  contexto?: {
    distribucionId: number;
    vehiculoPlaca?: string | null;
    sucursalNombre?: string | null;
  } | null;
  onClose: () => void;
  /**
   * Callback al guardar (crear o actualizar). El padre refresca el detalle del
   * despacho y/o invalida caches.
   */
  onSaved: (guia: GuiaSegundoTramo) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
  label: "text-zinc-400 font-medium text-xs mb-1 whitespace-nowrap",
};

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isoToDateInput = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  // Acepta "YYYY-MM-DD" o "YYYY-MM-DD HH:mm:ss" o ISO completo
  if (iso.length >= 10) return iso.slice(0, 10);
  return null;
};

const dateInputToIsoDateTime = (
  currentVal: string | null,
  originalVal: string | null | undefined,
): string | null => {
  if (!currentVal) return null;
  // Si el original ya empezaba con currentVal, mantener la hora del original
  if (originalVal && originalVal.startsWith(currentVal)) {
    return originalVal;
  }
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  return `${currentVal} ${hrs}:${mins}:${secs}`;
};

const dateInputToIsoDate = (
  currentVal: string | null,
  originalVal: string | null | undefined,
): string | null => {
  if (!currentVal) return null;
  if (originalVal && originalVal.length >= 10 && originalVal.startsWith(currentVal)) {
    return originalVal;
  }
  return currentVal;
};

export const ModalGuiaSegundoTramo = ({
  opened,
  idDistribucion,
  guia,
  contexto,
  onClose,
  onSaved,
}: Props) => {
  const { getGuia, crearGuia, actualizarGuia } = useGuiaSegundoTramo();

  // ---- estado del formulario
  const [motivoTraslado, setMotivoTraslado] = useState<string | null>(null);
  const [fechaInicioTraslado, setFechaInicioTraslado] = useState<string | null>(null);
  const [fechaEmision, setFechaEmision] = useState<string | null>(null);
  const [fechaEnPlanta, setFechaEnPlanta] = useState<string | null>(null);
  const [guiaRemitente, setGuiaRemitente] = useState("");
  const [guiaTransportista, setGuiaTransportista] = useState("");
  const [sinGuiaTransportista, setSinGuiaTransportista] = useState(false);

  // ---- documentos: archivos nuevos seleccionados por el usuario
  const [documentoRemitente, setDocumentoRemitente] = useState<File | null>(null);
  const [documentoTransportista, setDocumentoTransportista] = useState<File | null>(null);

  // ---- archivos existentes traidos del backend (se descargan al abrir en modo edicion)
  const [archivoRemitenteExistente, setArchivoRemitenteExistente] =
    useState<GuiaSegundoTramoDocumento | null>(null);
  const [archivoTransportistaExistente, setArchivoTransportistaExistente] =
    useState<GuiaSegundoTramoDocumento | null>(null);

  // ---- control: archivo existente marcado para eliminar al guardar
  const [remitenteEliminado, setRemitenteEliminado] = useState(false);
  const [transportistaEliminado, setTransportistaEliminado] = useState(false);

  // ---- nombre del archivo nuevo que se persistira (para trazabilidad log_cambios)
  const [nombresArchivosNuevos, setNombresArchivosNuevos] = useState<string[]>([]);
  const [nombresArchivosEliminados, setNombresArchivosEliminados] = useState<string[]>([]);

  const [cargandoInicial, setCargandoInicial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---- edicion: se determino al cargar; true si hay guia existente.
  const [esEdicion, setEsEdicion] = useState(false);

  /**
   * Carga inicial del modal: si `guia` no viene seteada, intenta buscarla al
   * backend para soportar el flujo "abrir modal siempre muestra lo guardado".
   * Si ya viene por prop, la usa directamente sin re-fetch.
   */
  useEffect(() => {
    if (!opened) return;

    let cancelled = false;
    const cargar = async () => {
      // reset de control de cambios
      setRemitenteEliminado(false);
      setTransportistaEliminado(false);
      setNombresArchivosNuevos([]);
      setNombresArchivosEliminados([]);
      setDocumentoRemitente(null);
      setDocumentoTransportista(null);

      // 1) resolver guia
      let guiaActual: GuiaSegundoTramo | null = guia ?? null;
      if (!guiaActual) {
        setCargandoInicial(true);
        try {
          guiaActual = await getGuia(idDistribucion);
        } finally {
          if (!cancelled) setCargandoInicial(false);
        }
      }

      if (cancelled) return;

      if (guiaActual) {
        setEsEdicion(true);
        setMotivoTraslado(guiaActual.motivo_traslado ?? null);
        setFechaInicioTraslado(
          isoToDateInput(guiaActual.fecha_inicio_traslado),
        );
        setFechaEmision(isoToDateInput(guiaActual.fecha_emision));
        setFechaEnPlanta(isoToDateInput(guiaActual.fecha_en_planta));
        setGuiaRemitente(guiaActual.guia_remitente ?? "");
        setGuiaTransportista(guiaActual.guia_transportista ?? "");
        setSinGuiaTransportista(!!guiaActual.sin_guia_transportista);
        setArchivoRemitenteExistente(
          guiaActual.documentos?.guia_remitente ?? null,
        );
        setArchivoTransportistaExistente(
          guiaActual.documentos?.guia_transportista ?? null,
        );
      } else {
        setEsEdicion(false);
        setMotivoTraslado(null);
        setFechaInicioTraslado(todayIso());
        setFechaEmision(todayIso());
        setFechaEnPlanta(todayIso());
        setGuiaRemitente("");
        setGuiaTransportista("");
        setSinGuiaTransportista(false);
        setArchivoRemitenteExistente(null);
        setArchivoTransportistaExistente(null);
      }
    };

    void cargar();

    return () => {
      cancelled = true;
    };
    // Solo re-ejecutar al abrir o cuando cambia la guia externa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, idDistribucion, guia?.id]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  /**
   * Handler cuando el usuario selecciona un archivo en uno de los slots.
   * Si ya hay un archivo existente, abre confirmacion antes de sobrescribirlo.
   * Si no hay, lo asigna directo.
   */
  const handleArchivoSeleccionado = (
    field: "remitente" | "transportista",
    file: File,
  ) => {
    const existente =
      field === "remitente"
        ? archivoRemitenteExistente
        : archivoTransportistaExistente;

    if (existente && !remitenteEliminado && !transportistaEliminado) {
      mostrarConfirmacion({
        title: "¿Reemplazar archivo adjunto?",
        message: (
          <span>
            Ya existe un archivo adjunto (
            <strong>{existente.nombre_original ?? "sin nombre"}</strong>) para
            la guía {field === "remitente" ? "remitente" : "transportista"}.
            Si continúas, se reemplazará al guardar.
          </span>
        ),
        confirmLabel: "Sí, reemplazar",
        cancelLabel: "Cancelar",
        tipo: "peligro",
        onConfirm: () => {
          // Marcar el existente como eliminado y registrar el nombre del nuevo
          if (field === "remitente") {
            if (!remitenteEliminado && archivoRemitenteExistente?.nombre_original) {
              setNombresArchivosEliminados((prev) => [
                ...prev,
                archivoRemitenteExistente.nombre_original as string,
              ]);
            }
            setRemitenteEliminado(true);
            setDocumentoRemitente(file);
            setNombresArchivosNuevos((prev) => {
              if (prev.includes(file.name)) return prev;
              return [...prev, file.name];
            });
          } else {
            if (!transportistaEliminado && archivoTransportistaExistente?.nombre_original) {
              setNombresArchivosEliminados((prev) => [
                ...prev,
                archivoTransportistaExistente.nombre_original as string,
              ]);
            }
            setTransportistaEliminado(true);
            setDocumentoTransportista(file);
            setNombresArchivosNuevos((prev) => {
              if (prev.includes(file.name)) return prev;
              return [...prev, file.name];
            });
          }
        },
      });
      return;
    }

    // Sin archivo existente: agregar directo
    if (field === "remitente") {
      setDocumentoRemitente(file);
      setNombresArchivosNuevos((prev) =>
        prev.includes(file.name) ? prev : [...prev, file.name],
      );
    } else {
      setDocumentoTransportista(file);
      setNombresArchivosNuevos((prev) =>
        prev.includes(file.name) ? prev : [...prev, file.name],
      );
    }
  };

  const handleQuitarExistente = (field: "remitente" | "transportista") => {
    mostrarConfirmacion({
      title: "¿Quitar archivo adjunto?",
      message: (
        <span>
          El archivo se eliminará al guardar la guía. Esta acción no se puede
          deshacer.
        </span>
      ),
      confirmLabel: "Sí, quitar",
      cancelLabel: "Cancelar",
      tipo: "peligro",
      onConfirm: () => {
        if (field === "remitente") {
          if (
            !remitenteEliminado &&
            archivoRemitenteExistente?.nombre_original
          ) {
            setNombresArchivosEliminados((prev) => [
              ...prev,
              archivoRemitenteExistente.nombre_original as string,
            ]);
          }
          setRemitenteEliminado(true);
        } else {
          if (
            !transportistaEliminado &&
            archivoTransportistaExistente?.nombre_original
          ) {
            setNombresArchivosEliminados((prev) => [
              ...prev,
              archivoTransportistaExistente.nombre_original as string,
            ]);
          }
          setTransportistaEliminado(true);
        }
      },
    });
  };

  const handleQuitarNuevo = (field: "remitente" | "transportista") => {
    if (field === "remitente") {
      const nombre = documentoRemitente?.name;
      setDocumentoRemitente(null);
      if (nombre) {
        setNombresArchivosNuevos((prev) => prev.filter((n) => n !== nombre));
      }
    } else {
      const nombre = documentoTransportista?.name;
      setDocumentoTransportista(null);
      if (nombre) {
        setNombresArchivosNuevos((prev) => prev.filter((n) => n !== nombre));
      }
    }
  };

  /**
   * Construye un objeto IArchivo sintetico a partir de un File local,
   * para reutilizar `ArchivoCard` y mostrar preview / nombre / extension.
   * La URL no es la del backend (es un object URL local) — sirve solo
   * para vista previa en el modal.
   */
  const fileToIArchivoLocal = (file: File): IArchivo => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return {
      url: URL.createObjectURL(file),
      path_relativo: "",
      nombre_original: file.name,
      extension: ext || null,
    };
  };

  const handleSubmit = async () => {
    if (!motivoTraslado) return;
    if (!guiaRemitente.trim()) return;

    const guiaRemitenteTrim = guiaRemitente.trim();
    const numeroGuiaTransportista = sinGuiaTransportista
      ? null
      : guiaTransportista.trim() || null;

    if (!sinGuiaTransportista && !numeroGuiaTransportista) {
      // Si el usuario no marco "sin guia transportista" y dejo vacio, abortar.
      return;
    }

    setSubmitting(true);
    try {
      if (esEdicion && guia) {
        const actualizada = await actualizarGuia(idDistribucion, guia.id, {
          motivo_traslado: motivoTraslado as MotivoTraslado,
          fecha_inicio_traslado: dateInputToIsoDate(
            fechaInicioTraslado,
            guia.fecha_inicio_traslado,
          ),
          fecha_emision: dateInputToIsoDateTime(fechaEmision, guia.fecha_emision),
          fecha_en_planta: dateInputToIsoDateTime(fechaEnPlanta, guia.fecha_en_planta),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          documento_guia_remitente: documentoRemitente,
          documento_guia_transportista: sinGuiaTransportista
            ? null
            : documentoTransportista,
          motivo: null,
          nombres_evidencias_nuevas:
            nombresArchivosNuevos.length > 0 ? nombresArchivosNuevos : null,
          nombres_evidencias_eliminadas:
            nombresArchivosEliminados.length > 0
              ? nombresArchivosEliminados
              : null,
        });
        onSaved(actualizada);
      } else {
        const creada = await crearGuia(idDistribucion, {
          motivo_traslado: motivoTraslado as MotivoTraslado,
          fecha_inicio_traslado: dateInputToIsoDate(fechaInicioTraslado, null),
          fecha_emision: dateInputToIsoDateTime(fechaEmision, null),
          fecha_en_planta: dateInputToIsoDateTime(fechaEnPlanta, null),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          documento_guia_remitente: documentoRemitente,
          documento_guia_transportista: sinGuiaTransportista
            ? null
            : documentoTransportista,
        });
        onSaved(creada);
      }
    } catch {
      // useGuiaSegundoTramo ya notifica el error; mantener el modal abierto.
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    cargandoInicial ||
    !motivoTraslado ||
    !guiaRemitente.trim() ||
    (!sinGuiaTransportista && !guiaTransportista.trim());

  const titulo = esEdicion
    ? `Editar Guía de Segundo Tramo — Distribución #${contexto?.distribucionId ?? idDistribucion}`
    : `Registrar Guía de Segundo Tramo — Distribución #${contexto?.distribucionId ?? idDistribucion}`;

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={titulo}
      size="70%"
      rightSection={
        contexto ? (
          <Group gap={6}>
            {contexto.sucursalNombre && (
              <Badge color="indigo" variant="light" size="sm" radius="md">
                {contexto.sucursalNombre}
              </Badge>
            )}
            {contexto.vehiculoPlaca && (
              <Badge color="zinc" variant="light" size="sm" radius="md">
                {contexto.vehiculoPlaca}
              </Badge>
            )}
          </Group>
        ) : undefined
      }
    >
      <Stack gap="md" className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {cargandoInicial ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader size="md" color="indigo" />
            <Text size="xs" c="dimmed">
              Cargando datos de la guía de segundo tramo...
            </Text>
          </div>
        ) : (
          <>
            {/* ========== 1. Fechas (3 en la misma fila) ========== */}
            <Grid gutter="sm">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha Inicio Traslado:"
                  value={fechaInicioTraslado ?? ""}
                  onChange={(e) =>
                    setFechaInicioTraslado(e.currentTarget.value || null)
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  leftSection={<IconCalendar size={14} />}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha Emisión:"
                  value={fechaEmision ?? ""}
                  onChange={(e) =>
                    setFechaEmision(e.currentTarget.value || null)
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  leftSection={<IconCalendar size={14} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha En Planta:"
                  value={fechaEnPlanta ?? ""}
                  onChange={(e) =>
                    setFechaEnPlanta(e.currentTarget.value || null)
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  leftSection={<IconCalendar size={14} />}
                />
              </Grid.Col>
            </Grid>

            <Divider className="border-zinc-800/80" />

            {/* ========== 2. Motivo + guías (misma fila) ========== */}
            <Grid gutter="sm">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Motivo de traslado:"
                  placeholder="Seleccione"
                  data={MOTIVO_TRASLADO_OPTIONS.map((m) => ({
                    value: m,
                    label: m,
                  }))}
                  value={motivoTraslado}
                  onChange={setMotivoTraslado}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="N° Guía Remitente:"
                  placeholder="Ej. 001-12345"
                  value={guiaRemitente}
                  onChange={(e) =>
                    setGuiaRemitente(e.currentTarget.value.toUpperCase())
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  maxLength={20}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="N° Guía Transportista:"
                  placeholder={
                    sinGuiaTransportista ? "Sin guía transportista" : "Ej. 001-12345"
                  }
                  value={guiaTransportista}
                  onChange={(e) =>
                    setGuiaTransportista(e.currentTarget.value.toUpperCase())
                  }
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  maxLength={20}
                  disabled={sinGuiaTransportista}
                  rightSection={
                    <Switch
                      size="xs"
                      color="indigo"
                      checked={sinGuiaTransportista}
                      onChange={(e) =>
                        setSinGuiaTransportista(e.currentTarget.checked)
                      }
                      onLabel="SIN"
                      offLabel="CON"
                      className="mr-1"
                    />
                  }
                />
              </Grid.Col>
            </Grid>

            <Divider className="border-zinc-800/80" />

            {/* ========== 3. Documentos adjuntos ========== */}
            <DocumentoSlot
              label="Documento Guía Remitente"
              archivoExistente={
                remitenteEliminado ? null : archivoRemitenteExistente
              }
              archivoNuevo={documentoRemitente}
              onPick={(f) => handleArchivoSeleccionado("remitente", f)}
              onQuitarExistente={() => handleQuitarExistente("remitente")}
              onQuitarNuevo={() => handleQuitarNuevo("remitente")}
              fileToIArchivoLocal={fileToIArchivoLocal}
            />

            {!sinGuiaTransportista && (
              <DocumentoSlot
                label="Documento Guía Transportista"
                archivoExistente={
                  transportistaEliminado ? null : archivoTransportistaExistente
                }
                archivoNuevo={documentoTransportista}
                onPick={(f) => handleArchivoSeleccionado("transportista", f)}
                onQuitarExistente={() => handleQuitarExistente("transportista")}
                onQuitarNuevo={() => handleQuitarNuevo("transportista")}
                fileToIArchivoLocal={fileToIArchivoLocal}
              />
            )}
          </>
        )}

        {/* ========== 4. Acciones ========== */}
        <Box className="flex justify-end gap-3 pt-2 border-t border-zinc-900/60">
          <Button
            variant="default"
            radius="lg"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
            className="bg-zinc-800! text-zinc-300! border-zinc-700!"
          >
            Cancelar
          </Button>
          <Button
            radius="lg"
            size="sm"
            color="indigo"
            loading={submitting}
            disabled={submitDisabled}
            onClick={() => void handleSubmit()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30"
          >
            {esEdicion ? "Guardar cambios" : "Registrar guía"}
          </Button>
        </Box>
      </Stack>
    </ModalEstandar>
  );
};

// ---- subcomponente para slot de documento (existente + nuevo)
interface DocumentoSlotProps {
  label: string;
  archivoExistente: GuiaSegundoTramoDocumento | null;
  archivoNuevo: File | null;
  onPick: (file: File) => void;
  onQuitarExistente: () => void;
  onQuitarNuevo: () => void;
  fileToIArchivoLocal: (file: File) => IArchivo;
}

const DocumentoSlot = ({
  label,
  archivoExistente,
  archivoNuevo,
  onPick,
  onQuitarExistente,
  onQuitarNuevo,
  fileToIArchivoLocal,
}: DocumentoSlotProps) => {
  const tieneAlgo = !!archivoExistente || !!archivoNuevo;

  return (
    <Box>
      <Group justify="space-between" align="flex-end" mb={6}>
        <Text size="xs" fw={800} className="text-zinc-100 uppercase tracking-widest">
          {label}
        </Text>
        <FileButton onChange={(f) => f && onPick(f)} accept="*">
          {(props) => (
            <Button
              {...props}
              variant="light"
              color="indigo"
              size="xs"
              radius="md"
              leftSection={<IconUpload size={14} />}
              className="font-bold border border-indigo-500/20 shadow-sm"
            >
              {tieneAlgo ? "Reemplazar" : "Adjuntar"}
            </Button>
          )}
        </FileButton>
      </Group>

      {archivoExistente ? (
        <Group gap="xs" wrap="nowrap" align="stretch">
          <div className="flex-1 min-w-0">
            <ArchivoCard
              archivo={archivoExistente as unknown as IArchivo}
              className="h-full"
            />
          </div>
          <Tooltip label="Quitar archivo" withArrow>
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              radius="md"
              onClick={onQuitarExistente}
              className="bg-red-500/5 hover:bg-red-500/10 self-center"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ) : null}

      {archivoNuevo ? (
        <Group gap="xs" wrap="nowrap" align="stretch">
          <div className="flex-1 min-w-0">
            <ArchivoCard
              archivo={fileToIArchivoLocal(archivoNuevo)}
              className="h-full"
            />
          </div>
          <Tooltip label="Quitar archivo nuevo" withArrow>
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              radius="md"
              onClick={onQuitarNuevo}
              className="bg-red-500/5 hover:bg-red-500/10 self-center"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ) : null}

      {!archivoExistente && !archivoNuevo && (
        <Paper
          p="xs"
          radius="lg"
          className="bg-zinc-900/20 border border-dashed border-zinc-800/80"
        >
          <Group justify="center" gap="xs">
            <IconFileText size={16} className="text-zinc-600" />
            <Text size="xs" c="zinc.5" fw={600} fs="italic">
              Sin archivo adjunto.
            </Text>
          </Group>
        </Paper>
      )}
    </Box>
  );
};
