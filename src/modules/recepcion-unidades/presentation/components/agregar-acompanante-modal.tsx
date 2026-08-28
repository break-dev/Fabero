import { useState } from "react";
import { Stack, Group, Button } from "@mantine/core";
import { FileButton } from "@mantine/core";
import { IconFileUpload, IconUserCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { SelectVisitante } from "../../../../presentation/utils/select-visitante";

export interface DatosAcompananteForm {
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
  datosIniciales?: DatosAcompananteForm | null;
  onClose: () => void;
  onGuardar: (datos: DatosAcompananteForm) => void;
}

export const AgregarAcompananteModal = ({
  opened,
  datosIniciales,
  onClose,
  onGuardar,
}: Props) => {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [apellido, setApellido] = useState(datosIniciales?.apellido ?? "");
  const [dni, setDni] = useState(datosIniciales?.dni ?? "");
  const [telefono, setTelefono] = useState(datosIniciales?.telefono ?? "");
  const [fotos, setFotos] = useState<File[]>(
    datosIniciales?.foto_documento ?? [],
  );
  const [idVisitante, setIdVisitante] = useState<number | undefined>(
    datosIniciales?.id_visitante,
  );

  const [prevProps, setPrevProps] = useState({ datosIniciales, opened });

  if (
    prevProps.datosIniciales !== datosIniciales ||
    prevProps.opened !== opened
  ) {
    setPrevProps({ datosIniciales, opened });
    setNombre(datosIniciales?.nombre ?? "");
    setApellido(datosIniciales?.apellido ?? "");
    setDni(datosIniciales?.dni ?? "");
    setTelefono(datosIniciales?.telefono ?? "");
    setFotos(datosIniciales?.foto_documento ?? []);
    setIdVisitante(datosIniciales?.id_visitante);
  }

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      es_conductor: false,
      foto_documento: fotos,
      id_visitante: idVisitante,
    });

    handleClose();
  };

  const isEditing = Boolean(datosIniciales);

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title={isEditing ? "Editar Acompañante" : "Agregar Acompañante"}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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

          <Group
            align="center"
            justify="space-between"
            className="pt-2 border-t border-zinc-800"
          >
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
                  {fotos.length > 0
                    ? `${fotos.length} foto(s) seleccionada(s)`
                    : "Adjuntar Foto / Doc."}
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
                {isEditing ? "Actualizar Acompañante" : "Guardar Acompañante"}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </ModalEstandar>
  );
};
