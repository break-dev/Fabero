import { useEffect, useState } from "react";
import { Button, Group, Stack, TextInput } from "@mantine/core";
import { IconUserCheck } from "@tabler/icons-react";
import { ModalEstandar } from "./modal-estandar";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_Visitante } from "../../service/responses/auxiliar-visitas";

export interface ModalRegistroVisitanteProps {
  opened: boolean;
  onClose: () => void;
  onCreated: (visitante: RES_Visitante) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

/**
 * Modal para crear un nuevo visitante (nombre, apellido, dni, telefono).
 * Llama a AuxService.crear_visitante y devuelve el visitante creado vía onCreated.
 */
export const ModalRegistroVisitante = ({
  opened,
  onClose,
  onCreated,
}: ModalRegistroVisitanteProps) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    dni?: string;
  }>({});
  const { notifySuccess, notifyError } = useNotify();

  useEffect(() => {
    if (!opened) {
      setNombre("");
      setApellido("");
      setDni("");
      setTelefono("");
      setErrors({});
    }
  }, [opened]);

  const handleGuardar = async () => {
    const newErrors: typeof errors = {};
    if (!nombre.trim()) newErrors.nombre = "Requerido";
    if (dni.trim() && !/^\d{6,8}$/.test(dni.trim())) {
      newErrors.dni = "DNI debe tener 6-8 dígitos";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const resp = await AuxService.crear_visitante({
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        dni: dni.trim() || null,
        telefono: telefono.trim() || null,
      });
      if (resp.success && resp.data) {
        notifySuccess("Visitante registrado correctamente");
        onCreated(resp.data);
      } else {
        notifyError(resp.message || "No se pudo crear el visitante");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al crear el visitante";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Crear Nuevo Visitante"
      size="md"
    >
      <Stack gap="md">
        <Group grow wrap="nowrap">
          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.currentTarget.value);
              if (errors.nombre) setErrors((p) => ({ ...p, nombre: undefined }));
            }}
            error={errors.nombre}
            radius="xl"
            classNames={fieldClasses}
            required
          />
          <TextInput
            label="Apellido"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => {
              setApellido(e.currentTarget.value);
              if (errors.apellido)
                setErrors((p) => ({ ...p, apellido: undefined }));
            }}
            error={errors.apellido}
            radius="xl"
            classNames={fieldClasses}
          />
        </Group>

        <Group grow wrap="nowrap">
          <TextInput
            label="DNI / Documento"
            placeholder="12345678"
            value={dni}
            maxLength={8}
            onChange={(e) => {
              const v = e.currentTarget.value.replace(/\D/g, "").slice(0, 8);
              setDni(v);
              if (errors.dni) setErrors((p) => ({ ...p, dni: undefined }));
            }}
            error={errors.dni}
            radius="xl"
            classNames={fieldClasses}
          />
          <TextInput
            label="Teléfono"
            placeholder="987654321"
            value={telefono}
            onChange={(e) => setTelefono(e.currentTarget.value)}
            radius="xl"
            classNames={fieldClasses}
          />
        </Group>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={onClose}
            radius="xl"
            size="xs"
            className="text-zinc-400 hover:text-white"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            radius="xl"
            size="xs"
            leftSection={<IconUserCheck size={14} />}
            onClick={handleGuardar}
            loading={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Crear Visitante
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
