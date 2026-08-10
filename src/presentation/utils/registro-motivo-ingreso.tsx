import { useState } from "react";
import { TextInput, Button, Alert } from "@mantine/core";
import { IconExclamationCircle } from "@tabler/icons-react";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_MotivoIngreso } from "../../service/responses/auxiliar-visitas";
import z from "zod";

interface Props {
  onCancel: () => void;
  onSuccess: (motivo: RES_MotivoIngreso) => void;
  defaultEsRecepcionUnidad?: boolean;
}

/**
 * Componente global para registrar motivos de ingreso en la tabla `motivo_ingreso`.
 */
export const RegistroMotivoIngreso = ({
  onCancel,
  onSuccess,
  defaultEsRecepcionUnidad = false,
}: Props) => {
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
      .min(1, "El nombre del motivo es requerido")
      .max(100, "El nombre no debe superar los 100 caracteres")
      .safeParse(nombre.trim());

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await AuxService.crear_motivo_ingreso({
        nombre: validation.data,
        es_recepcion_unidad: defaultEsRecepcionUnidad,
      });

      if (res.success && res.data) {
        notifySuccess("Motivo de ingreso registrado exitosamente");
        setNombre("");
        onSuccess(res.data);
      } else {
        setError(res.message || "No se pudo registrar el motivo de ingreso.");
      }
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosError.response?.data?.message || axiosError.message || "Error al registrar el motivo de ingreso";
      notifyError(msg);
      setError(msg);
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
        label="Nombre del Motivo"
        placeholder="Ej. Inspección Técnica, Reunión Comercial, Proveedor"
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
          disabled={loading}
          classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          radius="lg"
          size="xs"
          loading={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4"
        >
          Guardar Motivo
        </Button>
      </div>
    </form>
  );
};
