import { useState } from "react";
import { TextInput, Button, Alert, SimpleGrid } from "@mantine/core";
import { IconUser, IconExclamationCircle } from "@tabler/icons-react";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_Proveedor } from "../../service/responses/proveedor";
import z from "zod";

interface Props {
  onCancel: () => void;
  onSuccess: (proveedor: RES_Proveedor) => void;
}

const Schema_CrearProveedor = z.object({
  razon_social: z
    .string()
    .min(1, "La razón social es requerida")
    .max(255, "La razón social no debe superar los 255 caracteres"),
  documento: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(20).optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
});

export const RegistroProveedorMineroSimple = ({ onCancel, onSuccess }: Props) => {
  const [razonSocial, setRazonSocial] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
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

    const validation = Schema_CrearProveedor.safeParse({
      razon_social: razonSocial.trim(),
      documento: documento.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipo_entidad: "Juridica",
        razon_social: validation.data.razon_social,
        ruc: validation.data.documento || undefined,
        telefono: validation.data.telefono || undefined,
        direccion: validation.data.direccion || undefined,
      };
      const created = await AuxService.crear_proveedor(payload);
      notifySuccess("Proveedor registrado exitosamente");
      onSuccess(created);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Error al registrar el proveedor";
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
        label="Razón Social"
        placeholder="Ej. Minera XYZ S.A.C."
        radius="lg"
        size="xs"
        required
        value={razonSocial}
        onChange={(e) => {
          setRazonSocial(e.target.value);
          if (error) setError(null);
        }}
        classNames={fieldClasses}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="RUC / Documento"
          placeholder="Ej. 20345678901"
          radius="lg"
          size="xs"
          maxLength={11}
          value={documento}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setDocumento(val);
          }}
          classNames={fieldClasses}
        />
        <TextInput
          label="Teléfono"
          placeholder="Ej. 987654321"
          radius="lg"
          size="xs"
          maxLength={20}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          classNames={fieldClasses}
        />
      </SimpleGrid>

      <TextInput
        label="Dirección"
        placeholder="Ej. Av. Principal 123, Lima"
        radius="lg"
        size="xs"
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
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
          Registrar Proveedor
        </Button>
      </div>
    </form>
  );
};
