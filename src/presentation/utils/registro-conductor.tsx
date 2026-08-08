import { TextInput, Button, Alert, SimpleGrid } from "@mantine/core";
import { IconUser, IconExclamationCircle } from "@tabler/icons-react";
import { useRegistroConductor } from "../../hooks/useRegistroConductor";
import type { RES_Conductor } from "../../service/responses/conductor";

interface Props {
  onCancel: () => void;
  onSuccess: (conductor: RES_Conductor) => void;
}

export const RegistroConductor = ({ onCancel, onSuccess }: Props) => {
  const { payload, handleChange, submit, loading, error } = useRegistroConductor(
    (conductor: RES_Conductor) => {
      onSuccess(conductor);
    },
  );

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && (
        <Alert
          icon={<IconExclamationCircle size={16} />}
          color="red"
          variant="filled"
          radius="lg"
        >
          {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Nombres"
          placeholder="Ej. Juan"
          radius="lg"
          size="xs"
          required
          value={payload.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          classNames={fieldClasses}
        />
        <TextInput
          label="Apellidos"
          placeholder="Ej. Pérez"
          radius="lg"
          size="xs"
          required
          value={payload.apellido}
          onChange={(e) => handleChange("apellido", e.target.value)}
          classNames={fieldClasses}
        />
      </SimpleGrid>

      <TextInput
        label="DNI"
        placeholder="Ej. 12345678"
        radius="lg"
        size="xs"
        required
        maxLength={8}
        value={payload.dni}
        onChange={(e) => {
          const cleanVal = e.target.value.replace(/\D/g, "").slice(0, 8);
          handleChange("dni", cleanVal);
        }}
        classNames={fieldClasses}
      />

      <TextInput
        label="Nro. Licencia de Conducir"
        placeholder="Ej. Q12345678"
        radius="lg"
        size="xs"
        required
        value={payload.numero_licencia}
        onChange={(e) => handleChange("numero_licencia", e.target.value)}
        classNames={fieldClasses}
      />

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
        <Button
          variant="subtle"
          color="gray"
          radius="lg"
          size="xs"
          onClick={onCancel}
          classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          radius="lg"
          size="xs"
          leftSection={<IconUser size={16} />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
        >
          Registrar Conductor
        </Button>
      </div>
    </form>
  );
};
