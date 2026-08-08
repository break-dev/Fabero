import { useState } from "react";
import { TextInput, Button, Alert } from "@mantine/core";
import { IconTruck, IconExclamationCircle } from "@tabler/icons-react";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_TipoVehiculo } from "../../service/responses/tipo-vehiculo";
import z from "zod";

interface Props {
  onCancel: () => void;
  onSuccess: (tipoVehiculo: RES_TipoVehiculo) => void;
}

/**
 * Componente de registro simple de Tipo de Vehículo.
 * Permite registrar rápidamente un tipo de vehículo ingresando solo su nombre.
 */
export const RegistroTipoVehiculoSimple = ({ onCancel, onSuccess }: Props) => {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = z
      .string()
      .min(1, "El nombre del tipo de vehículo es requerido")
      .max(100, "El nombre no debe superar los 100 caracteres")
      .safeParse(nombre.trim());

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const created = await AuxService.crear_tipo_vehiculo(validation.data, false, false);
      notifySuccess("Tipo de vehículo registrado exitosamente");
      setNombre("");
      onSuccess(created);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosError.response?.data?.message || axiosError.message || "Error al registrar el tipo de vehículo";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      <TextInput
        label="Nombre del Tipo de Vehículo"
        placeholder="Ej. Semirremolque, Camioneta, Furgón"
        radius="lg"
        size="xs"
        required
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          if (error) setError(null);
        }}
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
          leftSection={<IconTruck size={16} />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
        >
          Registrar Tipo
        </Button>
      </div>
    </form>
  );
};
