import { useState, useCallback, useEffect } from "react";
import { BlendingService } from "../service/blending.service";
import type { ItemDisponibleResponse } from "../service/blending.responses";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_Empresa } from "../../../service/responses/empresa";
import { useNotify } from "../../../hooks/useNotify";

export const useBlendingDisponibles = () => {
  const [disponibles, setDisponibles] = useState<ItemDisponibleResponse[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [empresas, setEmpresas] = useState<RES_Empresa[]>([]);
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number | null>(null);
  const [idEmpresaSeleccionada, setIdEmpresaSeleccionada] = useState<number | null>(null);
  const [loadingDisponibles, setLoadingDisponibles] = useState<boolean>(false);
  const [loadingProveedores, setLoadingProveedores] = useState<boolean>(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState<boolean>(false);
  const { notifyError } = useNotify();

  const fetchCatalogos = useCallback(async () => {
    setLoadingProveedores(true);
    setLoadingEmpresas(true);
    try {
      const [resProv, resEmp] = await Promise.all([
        AuxService.get_proveedores(),
        AuxService.get_empresas(),
      ]);
      setProveedores(resProv.data || []);
      setEmpresas(resEmp.data || []);
    } catch {
      // Ignorar errores menores de catálogo
    } finally {
      setLoadingProveedores(false);
      setLoadingEmpresas(false);
    }
  }, []);

  const fetchDisponibles = useCallback(async () => {
    setLoadingDisponibles(true);
    try {
      const data = await BlendingService.get_disponibles(
        idProveedorSeleccionado ?? undefined,
        idEmpresaSeleccionada ?? undefined
      );
      setDisponibles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar los lotes disponibles.";
      notifyError(message);
    } finally {
      setLoadingDisponibles(false);
    }
  }, [idProveedorSeleccionado, idEmpresaSeleccionada, notifyError]);

  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  const limpiarDisponibles = useCallback(() => {
    setDisponibles([]);
  }, []);

  return {
    disponibles,
    proveedores,
    empresas,
    idProveedorSeleccionado,
    setIdProveedorSeleccionado,
    idEmpresaSeleccionada,
    setIdEmpresaSeleccionada,
    loadingDisponibles,
    loadingProveedores,
    loadingEmpresas,
    refetchDisponibles: fetchDisponibles,
    limpiarDisponibles,
  };
};
