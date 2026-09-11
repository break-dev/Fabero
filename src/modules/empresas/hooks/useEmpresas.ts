import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useNotify } from "../../../hooks/useNotify";
import { EmpresasService } from "../service/empresas.service";
import type { RES_Empresa } from "../../../service/responses/empresa";
import { AuxService } from "../../../service/auxiliar.service";

export const useEmpresas = () => {
  const { notify } = useNotify();

  // Estados de la lista
  const [empresas, setEmpresas] = useState<RES_Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Modales
  const [openedCreate, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);

  const listar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AuxService.get_empresas();
      if (result.success) {
        setEmpresas(result.data);
      } else {
        notify({ type: "error", content: result.message });
      }
    } catch (error) {
      notify({ type: "error", content: "Error al cargar las empresas" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    listar();
  }, [listar]);

  const empresasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return empresas.filter(
      (emp) =>
        !q ||
        emp.razon_social.toLowerCase().includes(q) ||
        emp.ruc.includes(q),
    );
  }, [empresas, busqueda]);

  const handleUpdateLogo = async (id: number, file: File) => {
    try {
      const result = await EmpresasService.actualizar_logo(id, file);
      if (result.success) {
        setEmpresas((prev) =>
          prev.map((emp) => (emp.id_empresa === id ? result.data : emp)),
        );
        notify({
          type: "success",
          content: "Logo de empresa actualizado correctamente",
        });
        return true;
      } else {
        notify({ type: "error", content: result.message });
        return false;
      }
    } catch (error) {
      notify({ type: "error", content: "Error al actualizar el logo" });
      console.error(error);
      return false;
    }
  };

  const handleEmpresaActualizada = (actualizada: RES_Empresa) => {
    setEmpresas((prev) =>
      prev.map((emp) =>
        emp.id_empresa === actualizada.id_empresa ? actualizada : emp,
      ),
    );
  };

  const onEmpresaCreada = (nueva: RES_Empresa) => {
    setEmpresas((prev) => [nueva, ...prev]);
  };

  const actualizarCantidadCuentasEmpresa = (
    id_empresa: number,
    count: number,
  ) => {
    setEmpresas((prev) =>
      prev.map((emp) =>
        emp.id_empresa === id_empresa
          ? { ...emp, cantidad_cuentas_bancarias: count }
          : emp,
      ),
    );
  };

  return {
    empresas,
    loading,
    busqueda,
    setBusqueda,
    empresasFiltradas,

    // Modales
    openedCreate,
    openCreate,
    closeCreate,

    // Handlers
    onEmpresaCreada,
    onEmpresaActualizada: handleEmpresaActualizada,
    handleUpdateLogo,
    actualizarCantidadCuentasEmpresa,
    recargar: listar,
  };
};
