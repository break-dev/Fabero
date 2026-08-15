import { useState, useCallback } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { EmpresasService } from "../service/empresas.service";
import type { RES_Empresa } from "../../../service/responses/empresa";

interface UseRegistroEmpresaProps {
  onSuccess?: (nueva: RES_Empresa) => void;
  onClose: () => void;
}

export const useRegistroEmpresa = ({
  onSuccess,
  onClose,
}: UseRegistroEmpresaProps) => {
  const { notify } = useNotify();

  // Estado del formulario
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setRuc("");
    setRazonSocial("");
    setLogoFile(null);
    setError("");
  }, []);

  const handleGuardar = async () => {
    setError("");

    if (!ruc || ruc.length !== 11) {
      setError("El RUC debe tener 11 dígitos");
      return;
    }

    if (!razonSocial) {
      setError("La razón social es obligatoria");
      return;
    }

    const formData = new FormData();
    formData.append("ruc", ruc);
    formData.append("razon_social", razonSocial);

    if (logoFile) {
      formData.append("path_logo", logoFile);
    }

    setLoading(true);
    try {
      const result = await EmpresasService.crear_empresa(formData);
      if (result.success) {
        notify({
          type: "success",
          content: "Empresa registrada correctamente",
        });
        onSuccess?.(result.data);
        onClose();
        reset();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Error inesperado al registrar la empresa");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    ruc,
    setRuc,
    razonSocial,
    setRazonSocial,
    logoFile,
    setLogoFile,
    error,
    loading,
    handleGuardar,
    reset,
  };
};
