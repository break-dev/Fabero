import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Button,
  Text,
  Textarea,
  TextInput,
  Loader,
  Badge,
} from "@mantine/core";
import { IconDeviceFloppy, IconNote, IconTruck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { RecepcionUnidadesService } from "../../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
  onGuardada: (actualizada: RecepcionUnidadResponse) => void;
}

export const ModalEditarObservacionEvidencias = ({
  opened,
  recepcion,
  onClose,
  onGuardada,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [observacion, setObservacion] = useState<string>("");
  const [observacionSalida, setObservacionSalida] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [evidenciasArchivos, setEvidenciasArchivos] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>([]);
  const [initializedId, setInitializedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recepcion === null) {
      return;
    }
    if (initializedId !== recepcion.id) {
      setObservacion(recepcion.observacion ?? "");
      setObservacionSalida(recepcion.observacion_salida ?? "");
      setMotivo("");
      setEvidenciasArchivos([]);
      setEvidenciasExistentes(
        Array.isArray(recepcion.evidencias) ? recepcion.evidencias : [],
      );
      setInitializedId(recepcion.id);
    }
  }, [recepcion, initializedId]);

  useEffect(() => {
    if (!opened) {
      setInitializedId(null);
    }
  }, [opened]);

  const handleRemoveExisting = (pathRelativo: string) => {
    setEvidenciasExistentes((prev) =>
      prev.filter((a) => a.path_relativo !== pathRelativo),
    );
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const hayCambios = (() => {
    if (recepcion === null) return false;
    const obsOriginal = recepcion.observacion ?? "";
    if ((observacion ?? "") !== obsOriginal) return true;
    const obsSalidaOriginal = recepcion.observacion_salida ?? "";
    if ((observacionSalida ?? "") !== obsSalidaOriginal) return true;
    if (motivo.trim().length > 0) return true;
    if (evidenciasArchivos.length > 0) return true;
    const evidenciasOriginales = Array.isArray(recepcion.evidencias)
      ? recepcion.evidencias
      : [];
    if (evidenciasExistentes.length !== evidenciasOriginales.length) return true;
    return false;
  })();

  const handleGuardar = async () => {
    if (!recepcion) return;
    setLoading(true);
    try {
      const actualizada = await RecepcionUnidadesService.actualizarObservacionEvidencias(
        recepcion.id,
        {
          observacion: observacion.trim().length > 0 ? observacion : null,
          observacion_salida: observacionSalida.trim().length > 0 ? observacionSalida : null,
          motivo: motivo.trim().length > 0 ? motivo.trim() : null,
          evidencias_existentes: evidenciasExistentes,
          evidencias: evidenciasArchivos,
        },
      );
      notifySuccess("Observaciones y evidencias actualizadas");
      onGuardada(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      notifyError("No se pudo actualizar las observaciones y evidencias");
    } finally {
      setLoading(false);
    }
  };

  const totalEvidencias = evidenciasExistentes.length + evidenciasArchivos.length;

  return (
    <ModalEstandar
      opened={opened && recepcion !== null}
      close={handleClose}
      title={`Editar Observaciones y Evidencias — Recepción #${recepcion?.id ?? ""}`}
      size="xl"
      validateClose={hayCambios}
      closeConfirmationTitle="Cerrar sin guardar"
      closeConfirmationMessage={
        <>
          Tienes cambios sin guardar en las observaciones o las evidencias.
          ¿Estás seguro que deseas cerrar? Se perderán los cambios pendientes.
        </>
      }
    >
      {!recepcion ? (
        <div className="py-8 text-center">
          <Loader size="sm" color="indigo" />
        </div>
      ) : (
        <Stack gap="md">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
            <Group justify="space-between" wrap="wrap">
              <Group gap="xs">
                <IconNote className="w-4 h-4 text-indigo-400" />
                <Text size="xs" fw={700} className="text-zinc-300 uppercase tracking-wider">
                  Observación
                </Text>
              </Group>
              <Group gap="xs">
                {recepcion.vehiculo_placa ? (
                  <Badge variant="subtle" color="zinc" size="xs" radius="md">
                    Placa: {recepcion.vehiculo_placa}
                  </Badge>
                ) : null}
                {recepcion.estado ? (
                  <Badge variant="subtle" color="indigo" size="xs" radius="md">
                    {recepcion.estado}
                  </Badge>
                ) : null}
              </Group>
            </Group>

            <Textarea
              placeholder="Escribe una observación (opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.currentTarget.value)}
              minRows={3}
              maxRows={8}
              autosize
              disabled={loading}
              radius="lg"
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
              }}
            />

            {recepcion.fecha_hora_salida && (
              <div className="mt-2 pt-4 border-t border-zinc-800">
                <Group gap="xs" mb="xs">
                  <IconTruck className="w-4 h-4 text-amber-400" />
                  <Text
                    size="xs"
                    fw={700}
                    className="text-zinc-300 uppercase tracking-wider"
                  >
                    Observación de Salida
                  </Text>
                </Group>
                <Textarea
                  placeholder="Escribe una observación para la salida (opcional)"
                  value={observacionSalida}
                  onChange={(e) => setObservacionSalida(e.currentTarget.value)}
                  minRows={3}
                  maxRows={8}
                  autosize
                  disabled={loading}
                  radius="lg"
                  classNames={{
                    input:
                      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
                  }}
                />
              </div>
            )}

            <TextInput
              label="Motivo del cambio"
              description="Se registra en el historial de cambios. Ej. 'Corrección solicitada por balanza'."
              placeholder="Describe brevemente el motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.currentTarget.value)}
              disabled={loading}
              radius="lg"
              size="sm"
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
                label: "text-zinc-300 mb-1 font-medium text-xs",
              }}
            />
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
            <MultiFilePicker
              files={evidenciasArchivos}
              onFilesChange={setEvidenciasArchivos}
              existingFiles={evidenciasExistentes}
              onRemoveExisting={handleRemoveExisting}
              label="Evidencias de la Recepción"
              description="Fotografías de la unidad, guía de remisión o documentos adjuntos. Puedes agregar o quitar archivos."
            />
            {totalEvidencias === 0 && (
              <Text size="xs" c="dimmed" fs="italic" mt="xs">
                No hay evidencias adjuntas.
              </Text>
            )}
          </div>

          <Group justify="flex-end" gap="md" mt="xl">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
              radius="xl"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              Cancelar
            </Button>
            <Button
              loading={loading}
              onClick={handleGuardar}
              radius="xl"
              size="sm"
              leftSection={<IconDeviceFloppy size={16} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      )}
    </ModalEstandar>
  );
};