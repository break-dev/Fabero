import { useState } from "react";
import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
} from "@tabler/icons-react";
import { ModalEstandar } from "./modal-estandar";

export type ModalValidacionModo = "confirmar" | "pendientes";

export interface ItemPendiente {
  titulo: string;
  campos_faltantes: string[];
}

interface ModalValidacionProps {
  opened: boolean;
  onClose: () => void;
  modo: ModalValidacionModo;
  // Cabecera.
  titulo?: string;
  subtitulo?: React.ReactNode;
  // Modo "confirmar".
  mensajeConfirmar?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  // Modo "pendientes".
  pendientes?: ItemPendiente[];
  pendientesTextoLibre?: string;
}

export const ModalValidacion = ({
  opened,
  onClose,
  modo,
  titulo,
  subtitulo,
  mensajeConfirmar,
  confirmLabel = "Confirmar validación",
  onConfirm,
  pendientes = [],
  pendientesTextoLibre,
}: ModalValidacionProps) => {
  const tituloFinal =
    titulo ??
    (modo === "confirmar"
      ? "Confirmar validación"
      : "Requisitos pendientes");

  // Estado de carga interno para el boton "Confirmar validacion".
  // Evita multiples disparos si el usuario hace doble click rapido.
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={tituloFinal}
      size={modo === "confirmar" ? "md" : "lg"}
    >
      <Stack gap="md">
        {modo === "confirmar" ? (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 shrink-0">
                <IconCircleCheck size={26} stroke={1.6} />
              </div>
              <div className="flex-1 text-sm text-zinc-300 leading-relaxed">
                {mensajeConfirmar ?? (
                  <>
                    Esta acción marca el lote y sus particiones como validados.
                    Los módulos posteriores podrán consumir esta información.
                  </>
                )}
              </div>
            </div>
            <Group justify="flex-end" gap="sm" pt="sm">
              <Button
                variant="default"
                radius="lg"
                size="sm"
                onClick={onClose}
                disabled={confirming}
              >
                Cancelar
              </Button>
              <Button
                radius="lg"
                size="sm"
                color="green"
                leftSection={<IconCheck size={16} />}
                loading={confirming}
                disabled={confirming}
                onClick={() => {
                  void handleConfirm();
                }}
              >
                {confirmLabel}
              </Button>
            </Group>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 shrink-0">
                <IconAlertTriangle size={26} stroke={1.6} />
              </div>
              <div className="flex-1 text-sm text-zinc-300 leading-relaxed">
                {subtitulo ?? (
                  <>
                    No se puede validar porque hay campos pendientes. Complete
                    los requisitos y vuelva a intentarlo.
                  </>
                )}
              </div>
            </div>

            {pendientesTextoLibre && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-100/90 whitespace-pre-line">
                {pendientesTextoLibre}
              </div>
            )}

            {pendientes.length > 0 && (
              <Stack gap="xs" className="max-h-[40vh] overflow-y-auto pr-1">
                {pendientes.map((item, idx) => (
                  <div
                    key={`${item.titulo}-${idx}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
                  >
                    <Text
                      size="xs"
                      fw={700}
                      c="zinc.2"
                      tt="uppercase"
                      className="tracking-wider mb-2"
                    >
                      {item.titulo}
                    </Text>
                    <Group gap={6}>
                      {item.campos_faltantes.map((c, i) => (
                        <Badge
                          key={`${c}-${i}`}
                          size="sm"
                          variant="light"
                          color="yellow"
                          radius="sm"
                        >
                          {c}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                ))}
              </Stack>
            )}

            <Group justify="flex-end" gap="sm" pt="sm">
              <Button
                radius="lg"
                size="sm"
                color="yellow"
                onClick={onClose}
              >
                Entendido
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </ModalEstandar>
  );
};
