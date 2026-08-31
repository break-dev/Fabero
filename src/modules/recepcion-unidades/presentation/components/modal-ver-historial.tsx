import { Stack, Group, Text, ThemeIcon } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";

interface Props {
  opened: boolean;
  recepcion: RecepcionUnidadResponse | null;
  onClose: () => void;
}

export const ModalVerHistorial = ({ opened, recepcion, onClose }: Props) => {
  const cambiosLog = recepcion?.log_cambios ?? [];
  const tieneCambios = cambiosLog.length > 0;

  return (
    <ModalEstandar
      opened={opened && recepcion !== null}
      close={onClose}
      title={`Historial de cambios — Recepción #${recepcion?.id ?? ""}`}
      size="xl"
    >
      {!recepcion ? (
        <div className="py-8 text-center text-zinc-500 italic text-sm">
          Sin recepción seleccionada.
        </div>
      ) : tieneCambios ? (
        <CambiosLogViewer cambios={cambiosLog} />
      ) : (
        <Stack
          gap="sm"
          align="center"
          justify="center"
          className="py-10 px-4"
        >
          <ThemeIcon
            size={48}
            radius="xl"
            variant="light"
            color="gray"
            className="bg-zinc-800/60 text-zinc-500"
          >
            <IconHistory size={24} stroke={1.5} />
          </ThemeIcon>
          <Group gap={4} justify="center">
            <Text size="sm" fw={700} className="text-zinc-300 uppercase tracking-widest">
              Sin cambios registrados
            </Text>
          </Group>
          <Text size="xs" c="dimmed" fs="italic" className="text-center max-w-md">
            Esta recepción todavía no tiene entradas en el historial. El log se
            completa automáticamente cuando se edita la observación, las
            evidencias, o cuando se confirma una programación.
          </Text>
        </Stack>
      )}
    </ModalEstandar>
  );
};