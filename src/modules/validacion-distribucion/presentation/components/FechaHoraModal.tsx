import { useEffect, useState } from "react";
import { Button, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface Props {
  opened: boolean;
  onClose: () => void;
  value: string | null;
  onConfirm: (iso: string | null) => void;
  title?: string;
  label?: string;
}

const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const FechaHoraModal = ({
  opened,
  onClose,
  value,
  onConfirm,
  title = "Seleccionar fecha y hora",
  label = "Fecha y hora",
}: Props) => {
  const [local, setLocal] = useState<Date | null>(toDate(value));

  useEffect(() => {
    if (opened) {
      setLocal(toDate(value));
    }
  }, [opened, value]);

  const handleConfirm = () => {
    if (local) {
      onConfirm(local.toISOString());
    } else {
      onConfirm(null);
    }
    onClose();
  };

  return (
    <ModalEstandar opened={opened} close={onClose} title={title} size="sm">
      <Group gap="sm" align="flex-end">
        <DateTimePicker
          label={label}
          value={local}
          onChange={(v) => setLocal(v ? new Date(v) : null)}
          valueFormat="DD/MM/YYYY HH:mm"
          radius="lg"
          size="sm"
          style={{ flex: 1 }}
        />
        <Button size="sm" radius="lg" onClick={handleConfirm}>
          Aceptar
        </Button>
      </Group>
    </ModalEstandar>
  );
};
