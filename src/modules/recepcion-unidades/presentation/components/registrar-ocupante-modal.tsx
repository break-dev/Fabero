import { useState } from "react";
import {
  Stack,
  Group,
  Button,
  Checkbox,
  Text,
} from "@mantine/core";
import { FileButton } from "@mantine/core";
import { IconFileUpload, IconUserCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { SelectVisitante } from "../../../../presentation/utils/select-visitante";

export interface DatosOcupanteSlot {
  nombre: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  es_conductor?: boolean;
  foto_documento?: File[];
  id_visitante?: number;
}

interface Props {
  opened: boolean;
  placaVehiculo?: string;
  numeroSlot?: number;
  datosIniciales?: DatosOcupanteSlot | null;
  onClose: () => void;
  onGuardar: (datos: DatosOcupanteSlot) => void;
}

export const RegistrarOcupanteModal = ({
  opened,
  placaVehiculo,
  numeroSlot,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [apellido, setApellido] = useState(datosIniciales?.apellido ?? "");
  const [dni, setDni] = useState(datosIniciales?.dni ?? "");
  const [telefono, setTelefono] = useState(datosIniciales?.telefono ?? "");
  const [esConductor, setEsConductor] = useState(Boolean(datosIniciales?.es_conductor));
  const [fotos, setFotos] = useState<File[]>(datosIniciales?.foto_documento ?? []);
  const [idVisitante, setIdVisitante] = useState<number | undefined>(
    datosIniciales?.id_visitante,
  );

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (prevProps.datosIniciales !== datosIniciales || prevProps.opened !== opened) {
    setPrevProps({ datosIniciales, opened });
    setNombre(datosIniciales?.nombre ?? "");
    setApellido(datosIniciales?.apellido ?? "");
    setDni(datosIniciales?.dni ?? "");
    setTelefono(datosIniciales?.telefono ?? "");
    setEsConductor(Boolean(datosIniciales?.es_conductor));
    setFotos(datosIniciales?.foto_documento ?? []);
    setIdVisitante(datosIniciales?.id_visitante);
  }

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onGuardar({
      nombre: nombre.trim() || "VISITANTE",
      apellido: apellido.trim() || undefined,
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      es_conductor: esConductor,
      foto_documento: fotos,
      id_visitante: idVisitante,
    });

    handleClose();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={`Ocupante #${numeroSlot ?? 1} - Vehículo ${placaVehiculo ?? ""}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="xs" c="zinc.5">
            Completa la información del ocupante de este vehículo acompañante.
          </Text>

          <SelectVisitante
            label="Visitante"
            placeholder="Buscar por nombre o DNI..."
            value={idVisitante ?? null}
            onChange={(v) => {
              setIdVisitante(v.id_visitante);
              setNombre(v.nombre);
              setApellido(v.apellido);
              setDni(v.dni);
              setTelefono(v.telefono ?? "");
            }}
          />

          <Checkbox
            label="¿Es Conductor de este Vehículo Acompañante?"
            checked={esConductor}
            onChange={(e) => setEsConductor(e.currentTarget.checked)}
            color="indigo"
            classNames={{
              label: "text-zinc-300 text-xs font-medium cursor-pointer",
            }}
          />

          <Group align="center" justify="space-between" className="pt-2 border-t border-zinc-800">
            <FileButton
              multiple
              accept="image/*"
              onChange={(files) => setFotos(files ?? [])}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  radius="xl"
                  size="xs"
                  leftSection={<IconFileUpload size={14} />}
                  className="bg-zinc-800! text-zinc-300! border-zinc-700!"
                >
                  {fotos.length > 0 ? `${fotos.length} foto(s) seleccionada(s)` : "Adjuntar Foto / Doc."}
                </Button>
              )}
            </FileButton>

            <Group gap="sm">
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
                leftSection={<IconUserCheck size={14} />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Guardar Ocupante
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </ModalEstandar>
  );
};
