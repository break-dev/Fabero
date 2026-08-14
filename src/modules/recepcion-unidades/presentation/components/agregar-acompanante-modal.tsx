import { useState } from "react";
import { Stack, Group, Button, TextInput } from "@mantine/core";
import { FileButton } from "@mantine/core";
import { IconFileUpload, IconUserCheck } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export interface DatosAcompananteForm {
  nombre: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  es_conductor?: boolean;
  foto_documento?: File[];
}

interface Props {
  opened: boolean;
  datosIniciales?: DatosAcompananteForm | null;
  onClose: () => void;
  onGuardar: (datos: DatosAcompananteForm) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

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
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

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
    setErrorNombre(null);
  }

  const handleClose = () => {
    setErrorNombre(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorNombre("El nombre es obligatorio.");
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      dni: dni.trim() || undefined,
      telefono: telefono.trim() || undefined,
      es_conductor: false,
      foto_documento: fotos,
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
          <TextInput
            label="Nombre"
            placeholder="Nombre completo o primer nombre"
            required
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorNombre) setErrorNombre(null);
            }}
            error={errorNombre}
            radius="xl"
            classNames={fieldClasses}
          />

          <TextInput
            label="Apellido"
            placeholder="Apellidos (opcional)"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            radius="xl"
            classNames={fieldClasses}
          />

          <Group grow wrap="nowrap">
            <TextInput
              label="DNI / Documento"
              placeholder="Ej. 12345678"
              maxLength={8}
              value={dni}
              onChange={(e) =>
                setDni(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              radius="xl"
              classNames={fieldClasses}
            />

            <TextInput
              label="Teléfono"
              placeholder="Ej. 987654321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              radius="xl"
              classNames={fieldClasses}
            />
          </Group>

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
