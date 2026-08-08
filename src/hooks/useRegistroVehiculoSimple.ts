import { useState } from "react";
import { useNotify } from "./useNotify";
import { AuxService } from "../service/auxiliar.service";
import type { RES_Vehiculo } from "../service/responses/vehiculo";
import z from "zod";

/**
 * Hook para registrar un vehículo de forma simplificada (solo serie y placa).
 * Las FKs requeridas por el backend (id_empresa_transporte, id_tipo_vehiculo)
 * se reciben desde el contexto del modal padre para mantener este formulario
 * minimalista en sus inputs visibles.
 */
export const useRegistroVehiculoSimple = (
  onSuccess: (vehiculo: RES_Vehiculo) => void,
  idEmpresaTransporte: number | null,
  idTipoVehiculo: number | null,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<{
    placa: string;
  }>({
    placa: "",
  });

  const handleChange = (field: "placa", value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value.toUpperCase() }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = z
      .object({
        placa: z
          .string()
          .min(1, "La placa es requerida")
          .max(20, "La placa no debe superar los 20 caracteres"),
      })
      .safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await AuxService.crear_vehiculo({
        placa: validation.data.placa.trim(),
        numero_placa: validation.data.placa.trim(),
        serie_placa: null,
        id_empresa_transporte: idEmpresaTransporte,
        id_tipo_vehiculo: idTipoVehiculo,
      });
      if (response.ya_existia) {
        notifySuccess("El vehículo ya se encontraba registrado. Seleccionado automáticamente.");
      } else {
        notifySuccess("Vehículo registrado exitosamente");
      }
      setPayload({ placa: "" });
      onSuccess(response);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosError.response?.data?.message || axiosError.message || "Error al registrar vehículo";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};