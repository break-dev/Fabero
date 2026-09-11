import { useState, useCallback, useEffect } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { EmpresasService } from "../service/empresas.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Empresa } from "../../../service/responses/empresa";

interface UseRegistroEmpresaProps {
  onSuccess?: (nueva: RES_Empresa) => void;
  onClose: () => void;
  editingEmpresa?: RES_Empresa | null;
}

export const useRegistroEmpresa = ({
  onSuccess,
  onClose,
  editingEmpresa = null,
}: UseRegistroEmpresaProps) => {
  const { notify } = useNotify();
  const isEdit = editingEmpresa !== null;

  // Estado del formulario
  const [ruc, setRuc] = useState(editingEmpresa?.ruc ?? "");
  const [razonSocial, setRazonSocial] = useState(
    editingEmpresa?.razon_social ?? "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [idDepartamento, setIdDepartamento] = useState<string | null>(
    editingEmpresa?.id_departamento
      ? String(editingEmpresa.id_departamento)
      : null,
  );
  const [idProvincia, setIdProvincia] = useState<string | null>(
    editingEmpresa?.id_provincia ? String(editingEmpresa.id_provincia) : null,
  );
  const [idDistrito, setIdDistrito] = useState<string | null>(
    editingEmpresa?.id_distrito ? String(editingEmpresa.id_distrito) : null,
  );
  const [domicilioFiscal, setDomicilioFiscal] = useState(
    editingEmpresa?.domicilio_fiscal ?? "",
  );

  // Ubigeo (cascading selects)
  const [departamentos, setDepartamentos] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [provincias, setProvincias] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [distritos, setDistritos] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sincronizar el state con el editingEmpresa que llega como prop.
  // useState solo usa el valor inicial; cuando el modal se re-abre con
  // un editingEmpresa distinto (o se pasa de null a un Empresa), el state
  // interno queda stale. Este useEffect lo resincroniza.
  useEffect(() => {
    if (editingEmpresa) {
      setRuc(editingEmpresa.ruc ?? "");
      setRazonSocial(editingEmpresa.razon_social ?? "");
      setIdDepartamento(
        editingEmpresa.id_departamento
          ? String(editingEmpresa.id_departamento)
          : null,
      );
      setIdProvincia(
        editingEmpresa.id_provincia ? String(editingEmpresa.id_provincia) : null,
      );
      setIdDistrito(
        editingEmpresa.id_distrito ? String(editingEmpresa.id_distrito) : null,
      );
      setDomicilioFiscal(editingEmpresa.domicilio_fiscal ?? "");
      setLogoFile(null);
    } else {
      // Reset para modo creación
      setRuc("");
      setRazonSocial("");
      setIdDepartamento(null);
      setIdProvincia(null);
      setIdDistrito(null);
      setDomicilioFiscal("");
      setLogoFile(null);
    }
    setError("");
  }, [editingEmpresa]);

  // Cargar departamentos al montar
  useEffect(() => {
    const fetchDepartamentos = async () => {
      setLoadingDepartamentos(true);
      try {
        const res = await AuxService.get_departamentos();
        if (res.success && Array.isArray(res.data)) {
          setDepartamentos(
            res.data.map((d) => ({ id: d.id, nombre: d.nombre })),
          );
        }
      } catch (e) {
        console.error("Error al cargar departamentos", e);
      } finally {
        setLoadingDepartamentos(false);
      }
    };
    fetchDepartamentos();
  }, []);

  // Cargar provincias cuando cambia departamento
  useEffect(() => {
    if (!idDepartamento) {
      setProvincias([]);
      setIdProvincia(null);
      setDistritos([]);
      setIdDistrito(null);
      return;
    }
    const fetchProvincias = async () => {
      setLoadingProvincias(true);
      try {
        const res = await AuxService.get_provincias(Number(idDepartamento));
        if (res.success && Array.isArray(res.data)) {
          setProvincias(
            res.data.map((p) => ({ id: p.id, nombre: p.nombre })),
          );
        }
      } catch (e) {
        console.error("Error al cargar provincias", e);
      } finally {
        setLoadingProvincias(false);
      }
    };
    fetchProvincias();
  }, [idDepartamento]);

  // Cargar distritos cuando cambia provincia
  useEffect(() => {
    if (!idProvincia) {
      setDistritos([]);
      setIdDistrito(null);
      return;
    }
    const fetchDistritos = async () => {
      setLoadingDistritos(true);
      try {
        const res = await AuxService.get_distritos(Number(idProvincia));
        if (res.success && Array.isArray(res.data)) {
          setDistritos(
            res.data.map((d) => ({ id: d.id, nombre: d.nombre })),
          );
        }
      } catch (e) {
        console.error("Error al cargar distritos", e);
      } finally {
        setLoadingDistritos(false);
      }
    };
    fetchDistritos();
  }, [idProvincia]);

  const reset = useCallback(() => {
    setRuc("");
    setRazonSocial("");
    setLogoFile(null);
    setIdDepartamento(null);
    setIdProvincia(null);
    setIdDistrito(null);
    setDomicilioFiscal("");
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

    setLoading(true);
    try {
      if (isEdit && editingEmpresa) {
        const result = await EmpresasService.actualizar_empresa(
          editingEmpresa.id_empresa,
          {
            ruc,
            razon_social: razonSocial,
            id_departamento: idDepartamento ? Number(idDepartamento) : null,
            id_provincia: idProvincia ? Number(idProvincia) : null,
            id_distrito: idDistrito ? Number(idDistrito) : null,
            domicilio_fiscal: domicilioFiscal || null,
          },
        );
        if (result.success) {
          notify({
            type: "success",
            content: "Empresa actualizada correctamente",
          });
          onSuccess?.(result.data);
          onClose();
        } else {
          setError(result.message);
        }
      } else {
        const formData = new FormData();
        formData.append("ruc", ruc);
        formData.append("razon_social", razonSocial);
        if (idDepartamento) formData.append("id_departamento", idDepartamento);
        if (idProvincia) formData.append("id_provincia", idProvincia);
        if (idDistrito) formData.append("id_distrito", idDistrito);
        if (domicilioFiscal) formData.append("domicilio_fiscal", domicilioFiscal);
        if (logoFile) formData.append("path_logo", logoFile);

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
      }
    } catch (err) {
      setError(
        isEdit
          ? "Error inesperado al actualizar la empresa"
          : "Error inesperado al registrar la empresa",
      );
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
    idDepartamento,
    setIdDepartamento,
    idProvincia,
    setIdProvincia,
    idDistrito,
    setIdDistrito,
    domicilioFiscal,
    setDomicilioFiscal,
    departamentos,
    provincias,
    distritos,
    loadingDepartamentos,
    loadingProvincias,
    loadingDistritos,
    error,
    loading,
    handleGuardar,
    reset,
    isEdit,
  };
};
