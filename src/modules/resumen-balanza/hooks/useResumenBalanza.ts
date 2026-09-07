import { useState, useEffect } from "react";
import { ResumenBalanzaService } from "../service/resumen-balanza.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_ResumenBalanzaItem, RES_ResumenBalanzaFiltrosMetadata } from "../service/resumen-balanza.responses";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

export const useResumenBalanza = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal || null;
  const { notifyError } = useNotify();

  // Estados de los filtros
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const [tipoIngreso, setTipoIngreso] = useState<string | null>(null);
  const [placa, setPlaca] = useState<string | null>(null);
  const [loteCorrelativo, setLoteCorrelativo] = useState<string>("");
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(null);

  // Datos principales
  const [items, setItems] = useState<RES_ResumenBalanzaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Metadatos para selects
  const [metadata, setMetadata] = useState<RES_ResumenBalanzaFiltrosMetadata>({
    lotes: [],
    vehiculos: [],
    condiciones_ingreso: [],
  });
  const [empresasTransporte, setEmpresasTransporte] = useState<RES_EmpresaTransporte[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const loadMetadata = async () => {
    if (!idSucursal) return;
    setLoadingMetadata(true);
    try {
      const [meta, emps] = await Promise.all([
        ResumenBalanzaService.get_resumen_filtros(idSucursal),
        AuxService.get_empresas_transporte(),
      ]);
      setMetadata(meta);
      setEmpresasTransporte(emps);
    } catch (e) {
      console.error("Error al cargar metadatos de filtros", e);
      notifyError("Error al cargar los metadatos de los filtros");
    } finally {
      setLoadingMetadata(false);
    }
  };

  const loadResumen = async () => {
    if (!idSucursal) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const filters = {
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        tipo_ingreso: tipoIngreso || undefined,
        placa: placa || undefined,
        lote_correlativo: loteCorrelativo.trim() || undefined,
        id_empresa_transporte: idEmpresaTransporte ? Number(idEmpresaTransporte) : undefined,
      };

      const data = await ResumenBalanzaService.get_resumen_balanza(filters);
      setItems(data);
    } catch (e) {
      console.error("Error al cargar resumen de balanza", e);
      notifyError("Ocurrió un error al cargar el resumen de balanza");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setTipoIngreso(null);
    setPlaca(null);
    setLoteCorrelativo("");
    setIdEmpresaTransporte(null);
  };

  // Cargar metadatos al cambiar de sucursal
  useEffect(() => {
    loadMetadata();
    resetFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  // Consultar información cada vez que cambian los filtros
  useEffect(() => {
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal, fechaInicio, fechaFin, tipoIngreso, placa, loteCorrelativo, idEmpresaTransporte]);

  return {
    items,
    loading,
    loadingMetadata,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoIngreso,
    setTipoIngreso,
    placa,
    setPlaca,
    loteCorrelativo,
    setLoteCorrelativo,
    idEmpresaTransporte,
    setIdEmpresaTransporte,
    metadata,
    empresasTransporte,
    loadResumen,
    resetFilters,
  };
};
