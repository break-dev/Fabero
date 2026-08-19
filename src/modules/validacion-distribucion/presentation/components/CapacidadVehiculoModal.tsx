import { useEffect, useState } from "react";
import { Button, Group, NumberInput } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ValidacionDistribucionService } from "../../service/validacion-distribucion.service";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  opened: boolean;
  onClose: () => void;
  idVehiculo: number;
  capacidadInicial: number | null;
  placa?: string | null;
  onUpdated: (nuevaCapacidad: number) => void;
}

export const CapacidadVehiculoModal = ({
  opened,
  onClose,
  idVehiculo,
  capacidadInicial,
  placa,
  onUpdated,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();
  const [valor, setValor] = useState<number | string>(capacidadInicial ?? 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) {
      setValor(capacidadInicial ?? 0);
    }
  }, [opened, capacidadInicial]);

  const handleGuardar = async () => {
    const num = typeof valor === "number" ? valor : parseFloat(String(valor));
    if (!Number.isFinite(num) || num < 0) {
      notifyError("Indica una capacidad válida.");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await ValidacionDistribucionService.updateCapacidadVehiculo(
        idVehiculo,
        { capacidad: num }
      );
      notifySuccess(`Capacidad de ${resp.placa} actualizada.`);
      onUpdated(num);
      onClose();
    } catch {
      notifyError("No se pudo actualizar la capacidad.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Capacidad del vehículo${placa ? ` ${placa}` : ""}`}
      size="sm"
    >
      <NumberInput
        label="Capacidad (TN)"
        value={valor}
        onChange={setValor}
        min={0}
        decimalScale={2}
        fixedDecimalScale
        hideControls
        radius="lg"
        size="sm"
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose} radius="lg" size="sm">
          Cancelar
        </Button>
        <Button onClick={handleGuardar} loading={submitting} radius="lg" size="sm">
          Guardar
        </Button>
      </Group>
    </ModalEstandar>
  );
};
