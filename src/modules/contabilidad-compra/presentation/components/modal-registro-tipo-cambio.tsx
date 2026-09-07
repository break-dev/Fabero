import { useEffect, useState } from "react";
import { Button, Group, NumberInput, Stack, Text } from "@mantine/core";
import { IconCoin, IconExternalLink } from "@tabler/icons-react";
import { z } from "zod";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";

const tipoCambioSchema = z.object({
  valor_compra: z.number({ message: "Ingrese valor de compra." }).positive("Debe ser > 0"),
  valor_venta: z.number({ message: "Ingrese valor de venta." }).positive("Debe ser > 0"),
});

interface ModalRegistroTipoCambioProps {
  opened: boolean;
  onClose: () => void;
  fecha: string;
  onCreated: () => void;
}

export const ModalRegistroTipoCambio = ({
  opened,
  onClose,
  fecha,
  onCreated,
}: ModalRegistroTipoCambioProps) => {
  const { notifySuccess, notifyError } = useNotify();

  const [valorCompra, setValorCompra] = useState<number | string>("");
  const [valorVenta, setValorVenta] = useState<number | string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) {
      setValorCompra("");
      setValorVenta("");
    }
  }, [opened]);

  const handleSubmit = async () => {
    const parsed = tipoCambioSchema.safeParse({
      valor_compra: typeof valorCompra === "number" ? valorCompra : Number(valorCompra),
      valor_venta: typeof valorVenta === "number" ? valorVenta : Number(valorVenta),
    });

    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || "Datos inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await AuxService.crear_tipo_cambio({
        valor_compra: parsed.data.valor_compra,
        valor_venta: parsed.data.valor_venta,
        fecha,
      });
      if (res.success) {
        notifySuccess("Tipo de cambio registrado correctamente");
        onCreated();
        onClose();
      } else {
        notifyError(res.message || "Error al registrar el tipo de cambio");
      }
    } catch (err) {
      console.error("Error al registrar tipo de cambio:", err);
      notifyError("Ocurrió un error al registrar el tipo de cambio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={
        <Group gap={6}>
          <IconCoin size={20} className="text-yellow-400" />
          <Text fw={700} fz="sm" c="white">
            Registrar Tipo de Cambio
          </Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <Text fz="xs" c="dimmed">
          Estás registrando el tipo de cambio para la fecha <b>{fecha}</b>. Solo puede existir un
          registro activo por día.
        </Text>
        <a
          href="https://e-consulta.sunat.gob.pe/cl-at-ittipcam/tcS01Alias"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors text-yellow-300 text-xs"
        >
          <IconExternalLink size={14} />
          <span>
            Consulta los <b>tipos de cambio oficiales</b> publicados por SUNAT.
            Se abrirá en una nueva pestaña.
          </span>
        </a>
        <NumberInput
          label="Valor de Compra"
          decimalScale={3}
          fixedDecimalScale
          min={0.001}
          value={valorCompra}
          onChange={setValorCompra}
          size="xs"
          radius="lg"
        />
        <NumberInput
          label="Valor de Venta"
          decimalScale={3}
          fixedDecimalScale
          min={0.001}
          value={valorVenta}
          onChange={setValorVenta}
          size="xs"
          radius="lg"
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} radius="lg" size="xs" disabled={submitting}>
            Cancelar
          </Button>
          <Button color="indigo" onClick={handleSubmit} loading={submitting} radius="lg" size="xs">
            Registrar
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};