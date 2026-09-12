import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Button,
  TextInput,
  NumberInput,
  Text,
  Loader,
} from "@mantine/core";
import { IconCheck, IconCoin } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { useNotify } from "../../../../hooks/useNotify";
import { ValorElementoQuimicoService } from "../../service/valor-elemento-quimico.service";
import type { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";

interface Props {
  opened: boolean;
  onClose: () => void;
  elementoQuimico: ElementoQuimicoValorizacion;
  fecha: string;
  interInicial?: number;
  onRegistrado: (idValorElementoQuimico: number, inter: number) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalRegistrarPrecioInter = ({
  opened,
  onClose,
  elementoQuimico,
  fecha,
  interInicial,
  onRegistrado,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();
  const [loading, setLoading] = useState(false);
  const [inter, setInter] = useState<number | string>(interInicial ?? 0);

  useEffect(() => {
    if (!opened) return;
    setInter(interInicial ?? 0);
  }, [opened, interInicial]);

  const handleGuardar = async () => {
    const numInter =
      typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    if (numInter <= 0) {
      notifyError("El valor INTER debe ser mayor a 0.");
      return;
    }
    if (!fecha) {
      notifyError("Debe seleccionar una fecha en el modal principal.");
      return;
    }

    setLoading(true);
    try {
      const res = await ValorElementoQuimicoService.registrarPrecio({
        elemento_quimico: elementoQuimico,
        fecha,
        inter: numInter,
      });
      if (res.success && res.data) {
        notifySuccess(
          `Precio INTER (${elementoQuimico}) registrado correctamente.`,
        );
        onRegistrado(res.data.id, numInter);
        onClose();
      } else {
        notifyError(res.message || "No se pudo registrar el precio INTER.");
      }
    } catch (err) {
      notifyError(
        err instanceof Error
          ? err.message
          : "Error al registrar el precio INTER.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Registrar Precio INTER - ${elementoQuimico}`}
      size="sm"
    >
      <Stack gap="sm" mt="xs">
        <Text fz="xs" c="dimmed">
          Registra el precio internacional del <b>{elementoQuimico}</b> para la
          fecha <b>{fecha}</b>. Quedara registrado para futuras valorizaciones.
        </Text>

        <TextInput
          label="Fecha:"
          value={fecha}
          disabled
          classNames={fieldClasses}
          size="xs"
          radius="lg"
        />

        <NumberInput
          label="INTER ($/oz):"
          value={inter}
          onChange={(val) => setInter(val ?? 0)}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          hideControls
          leftSection={<IconCoin size={14} />}
          classNames={fieldClasses}
          size="xs"
          radius="lg"
        />

        <Group justify="end" gap="xs" mt="xs">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            radius="lg"
            size="xs"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleGuardar}
            loading={loading}
            disabled={loading}
            radius="lg"
            size="xs"
            leftSection={
              loading ? <Loader size={14} color="white" /> : <IconCheck size={14} />
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Registrar Precio
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
