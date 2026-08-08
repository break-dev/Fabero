import { useState } from "react";
import {
  Stack,
  Group,
  Button,
  TextInput,
  NumberInput,
  Text,
} from "@mantine/core";
import { FileButton } from "@mantine/core";
import { IconTruck, IconFileUpload } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export interface DatosVehiculoForm {
  placa: string;
  fotos?: File[];
  cantidadPersonas: number;
}

interface Props {
  opened: boolean;
  datosIniciales?: DatosVehiculoForm | null;
  onClose: () => void;
  onGuardar: (
    placa: string,
    archivosVehiculo: File[],
    cantidadPersonas: number,
  ) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const AgregarVehiculoModal = ({
  opened,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [placa, setPlaca] = useState(datosIniciales?.placa ?? "");
  const [fotosVehiculo, setFotosVehiculo] = useState<File[]>(datosIniciales?.fotos ?? []);
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(datosIniciales?.cantidadPersonas ?? 1);
  const [errorPlaca, setErrorPlaca] = useState<string | null>(null);

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (prevProps.datosIniciales !== datosIniciales || prevProps.opened !== opened) {
    setPrevProps({ datosIniciales, opened });
    setPlaca(datosIniciales?.placa ?? "");
    setFotosVehiculo(datosIniciales?.fotos ?? []);
    setCantidadPersonas(datosIniciales?.cantidadPersonas ?? 1);
    setErrorPlaca(null);
  }

  const handleClose = () => {
    setErrorPlaca(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) {
      setErrorPlaca("La placa del vehículo es obligatoria.");
      return;
    }

    onGuardar(formatPlaca(placa), fotosVehiculo, Math.max(1, cantidadPersonas || 1));
    handleClose();
  };

  const isEditing = Boolean(datosIniciales);

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={isEditing ? "Editar Vehículo Acompañante" : "Agregar Vehículo Acompañante"}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="xs" c="zinc.5">
            Ingresa o actualiza la información del vehículo acompañante y la cantidad de personas que viajan en él.
          </Text>

          <TextInput
            label="Placa del Vehículo"
            placeholder="Ej. ABC-123"
            required
            maxLength={7}
            value={placa}
            onChange={(e) => {
              setPlaca(formatPlaca(e.target.value));
              if (errorPlaca) setErrorPlaca(null);
            }}
            error={errorPlaca}
            radius="xl"
            classNames={{
              ...fieldClasses,
              input: `${fieldClasses.input} font-mono uppercase tracking-wider`,
            }}
          />

          <NumberInput
            label="Cantidad de personas en el vehículo"
            min={1}
            max={50}
            radius="xl"
            value={cantidadPersonas}
            onChange={(val) => setCantidadPersonas(typeof val === "number" ? val : 1)}
            classNames={fieldClasses}
          />

          <FileButton
            multiple
            accept="image/*"
            onChange={(files) => setFotosVehiculo(files ?? [])}
          >
            {(props) => (
              <Button
                {...props}
                variant="default"
                radius="xl"
                size="sm"
                leftSection={<IconFileUpload size={16} />}
                className="bg-zinc-800! text-zinc-300! border-zinc-700! w-full"
              >
                {fotosVehiculo.length > 0 ? `${fotosVehiculo.length} foto(s) seleccionada(s)` : "Adjuntar Fotos Vehículo"}
              </Button>
            )}
          </FileButton>

          <Group justify="flex-end" gap="sm" className="pt-2 border-t border-zinc-800">
            <Button
              variant="subtle"
              onClick={handleClose}
              radius="xl"
              size="xs"
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              radius="xl"
              size="xs"
              leftSection={<IconTruck size={14} />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isEditing ? "Actualizar Vehículo" : "Guardar Vehículo"}
            </Button>
          </Group>
        </Stack>
      </form>
    </ModalEstandar>
  );
};
