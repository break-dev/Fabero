import { TextInput, Button, Alert } from "@mantine/core";
import { IconTruck, IconExclamationCircle } from "@tabler/icons-react";
import { useRegistroVehiculoSimple } from "../../hooks/useRegistroVehiculoSimple";
import type { RES_Vehiculo } from "../../service/responses/vehiculo";

interface Props {
  idEmpresaTransporte: number | null;
  idTipoVehiculo: number | null;
  onCancel: () => void;
  onSuccess: (vehiculo: RES_Vehiculo) => void;
}

/**
 * Modal de registro rápido de vehículo.
 * Solo expone los inputs serie_placa y numero_placa — los demás campos del
 * schema de la tabla (FKs requeridas, marca, MTC, pesos, dimensiones) se
 * completan con nulos o defaults válidos a nivel de backend.
 *
 * Las FKs (id_empresa_transporte, id_tipo_vehiculo) deben provenir del
 * contexto del modal padre.
 */
const formatPlaca = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`.slice(0, 7);
};

export const RegistroVehiculoSimple = ({
  idEmpresaTransporte,
  idTipoVehiculo,
  onCancel,
  onSuccess,
}: Props) => {
  const { payload, handleChange, submit, loading, error } = useRegistroVehiculoSimple(
    (vehiculo: RES_Vehiculo) => {
      onSuccess(vehiculo);
    },
    idEmpresaTransporte,
    idTipoVehiculo,
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

      <TextInput
        label="Placa del Vehículo"
        placeholder="Ej. F1B-890"
        radius="lg"
        size="xs"
        required
        maxLength={7}
        value={payload.placa}
        onChange={(e) => handleChange("placa", formatPlaca(e.currentTarget.value))}
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
          Registrar Vehículo
        </Button>
      </div>
    </form>
  );
};