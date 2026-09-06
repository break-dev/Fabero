import { useState } from "react";
import {
  Stack,
  Text,
  Textarea,
  Group,
  Button,
  Alert,
  SegmentedControl,
  Box,
} from "@mantine/core";
import { IconAlertTriangle, IconTrash, IconBan } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { RES_ValorizacionCompra } from "../../service/valorizacion-compra.responses";
import type { REQ_AnularValorizacion } from "../../service/valorizacion-compra.requests";

interface Props {
  opened: boolean;
  close: () => void;
  valorizacion: RES_ValorizacionCompra | null;
  onConfirm: (payload: REQ_AnularValorizacion) => Promise<void>;
  loading?: boolean;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all text-xs",
  label: "text-zinc-300 mb-1 font-medium text-xs flex items-center gap-1.5",
};

export const ModalAnularValorizacion = ({
  opened,
  close,
  valorizacion,
  onConfirm,
  loading = false,
}: Props) => {
  const [tipoEliminacion, setTipoEliminacion] = useState<"logica" | "fisica">("logica");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [evidenciasFiles, setEvidenciasFiles] = useState<File[]>([]);
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [prevOpened, setPrevOpened] = useState(false);

  if (opened !== prevOpened) {
    setPrevOpened(opened);
    if (opened) {
      setTipoEliminacion("logica");
      setMotivoAnulacion("");
      setEvidenciasFiles([]);
      setErrorMotivo(null);
    }
  }

  const codigoCorrelativo =
    valorizacion?.correlativo ||
    (valorizacion?.numero_correlativo ? `VAL-${valorizacion.numero_correlativo}` : "-");

  const handleSubmit = async () => {
    if (!motivoAnulacion.trim()) {
      setErrorMotivo("El motivo de anulación es obligatorio.");
      return;
    }
    if (motivoAnulacion.trim().length < 3) {
      setErrorMotivo("El motivo debe contener al menos 3 caracteres.");
      return;
    }

    setErrorMotivo(null);
    await onConfirm({
      motivo_anulacion: motivoAnulacion.trim(),
      tipo_eliminacion: tipoEliminacion,
      evidencias_anulacion: evidenciasFiles,
    });
  };

  return (
    <ModalEstandar
      opened={opened}
      close={close}
      title={
        <Group gap={8} align="center" wrap="nowrap">
          <IconBan size={18} className="text-amber-400 shrink-0" />
          <Text fw={700} fz="sm" c="white">
            Anular / Eliminar Valorización
          </Text>
          <Text fw={700} fz="xs" c="cyan.4" className="font-mono">
            {codigoCorrelativo}
          </Text>
        </Group>
      }
      rightSection={
        <SegmentedControl
          size="xs"
          radius="lg"
          value={tipoEliminacion}
          onChange={(val) => setTipoEliminacion(val as "logica" | "fisica")}
          data={[
            {
              label: (
                <Group gap={4} wrap="nowrap" justify="center">
                  <IconBan size={12} />
                  <span>Lógica</span>
                </Group>
              ),
              value: "logica",
            },
            {
              label: (
                <Group gap={4} wrap="nowrap" justify="center">
                  <IconTrash size={12} />
                  <span>Física</span>
                </Group>
              ),
              value: "fisica",
            },
          ]}
          color={tipoEliminacion === "fisica" ? "red" : "yellow"}
          bg="zinc.9"
          styles={{
            root: { minWidth: 180 },
            label: { paddingLeft: 10, paddingRight: 10 },
          }}
        />
      }
      size="lg"
      validateClose={false}
    >
      <Stack gap="md">

        {tipoEliminacion === "logica" ? (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            color="yellow"
            variant="light"
            radius="lg"
            title="Anulación Lógica"
          >
            <Text fz="xs">
              La valorización cambiará su estado a <strong>Anulado</strong> y mantendrá el historial de auditoría con la fecha, empleado y motivo. Si estaba aprobada, los saldos de anticipos serán restituidos automáticamente.
            </Text>
          </Alert>
        ) : (
          <Alert
            icon={<IconTrash size={18} />}
            color="red"
            variant="filled"
            radius="lg"
            title="Eliminación Física Definitiva"
          >
            <Text fz="xs" c="white">
              ¡ATENCIÓN! Se eliminará <strong>permanentemente</strong> el registro de la valorización y sus lotes valorizados de la base de datos. Esta acción no se puede deshacer.
            </Text>
          </Alert>
        )}

        <Textarea
          label="Motivo de Anulación / Eliminación *"
          placeholder="Ingrese detalladamente el motivo de la anulación u orden de eliminación..."
          value={motivoAnulacion}
          onChange={(e) => {
            setMotivoAnulacion(e.currentTarget.value);
            if (errorMotivo) setErrorMotivo(null);
          }}
          error={errorMotivo}
          required
          rows={3}
          size="xs"
          radius="lg"
          classNames={fieldClasses}
        />

        <Box>
          <Text fz="xs" fw={600} c="zinc.3" mb={4}>
            Evidencias Multimedia (Opcional)
          </Text>
          <MultiFilePicker
            files={evidenciasFiles}
            onFilesChange={setEvidenciasFiles}
            maxFiles={5}
          />
        </Box>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button
            variant="light"
            color="gray"
            size="xs"
            radius="lg"
            onClick={close}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            color={tipoEliminacion === "fisica" ? "red" : "orange"}
            size="xs"
            radius="lg"
            leftSection={
              tipoEliminacion === "fisica" ? (
                <IconTrash size={14} />
              ) : (
                <IconBan size={14} />
              )
            }
            loading={loading}
            onClick={handleSubmit}
          >
            {tipoEliminacion === "fisica"
              ? "Confirmar Eliminación Física"
              : "Confirmar Anulación Lógica"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
