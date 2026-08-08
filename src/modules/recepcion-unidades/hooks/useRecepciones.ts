import { useState, useEffect } from "react";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import type { RecepcionFilters } from "../service/recepcion-unidades.requests";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import { useNotify } from "../../../hooks/useNotify";

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useRecepciones = () => {
  const [recepciones, setRecepciones] = useState<RecepcionUnidadResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const { notifyError } = useNotify();

  // Estado de filtros del listado
  const [filters, setFilters] = useState<RecepcionFilters>({
    fecha_inicio: getTodayString(),
    fecha_fin: getTodayString(),
    placa: "",
    id_empresa_transporte: undefined,
    tipo_ingreso: "",
  });

  const fetchRecepciones = async () => {
    setLoading(true);
    try {
      const data = await RecepcionUnidadesService.getRecepciones(filters);
      setRecepciones(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las recepciones de unidades");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const data = await AuxService.get_empresas_transporte();
      setEmpresas(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecepciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fecha_inicio, filters.fecha_fin, filters.id_empresa_transporte, filters.tipo_ingreso]);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleSearch = () => {
    fetchRecepciones();
  };

  const handleFilterChange = <K extends keyof RecepcionFilters>(
    key: K,
    value: RecepcionFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearTextFilterAndSearch = (key: "placa") => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: "" };
      setLoading(true);
      RecepcionUnidadesService.getRecepciones(newFilters)
        .then((data) => setRecepciones(data))
        .catch((e) => {
          console.error(e);
          notifyError("Ocurrió un error al cargar las recepciones de unidades");
        })
        .finally(() => setLoading(false));
      return newFilters;
    });
  };

  const insertRecepcion = (r: RecepcionUnidadResponse) => {
    setRecepciones((prev) => [r, ...prev]);
  };

  const updateRecepcion = (r: RecepcionUnidadResponse) => {
    setRecepciones((prev) => prev.map((item) => (item.id === r.id ? r : item)));
  };

  const clearFilters = () => {
    const cleared: RecepcionFilters = {
      fecha_inicio: getTodayString(),
      fecha_fin: getTodayString(),
      placa: "",
      id_empresa_transporte: undefined,
      tipo_ingreso: "",
    };
    setFilters(cleared);
    setLoading(true);
    RecepcionUnidadesService.getRecepciones(cleared)
      .then((data) => setRecepciones(data))
      .catch((e) => {
        console.error(e);
        notifyError("Ocurrió un error al cargar las recepciones de unidades");
      })
      .finally(() => setLoading(false));
  };

  return {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    handleSearch,
    fetchRecepciones,
    insertRecepcion,
    updateRecepcion,
    empresas,
    clearFilters,
    clearTextFilterAndSearch,
  };
};
