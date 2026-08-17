import { useState, useEffect } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_MotivoIngreso } from "../../../service/responses/auxiliar-visitas";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";
import type { CrearRecepcionRequest } from "../service/recepcion-unidades.requests";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import { useNotify } from "../../../hooks/useNotify";
import { useUIStore } from "../../../stores/ui.store";
import type { VisitanteFormItem, VehiculoAcompananteItem } from "./useConfirmarProgramacion";

export const useRegistroRecepcion = (
  onSuccess: (r: RecepcionUnidadResponse) => void
) => {
  const sucursal_elegida = useUIStore((state) => state.sucursal_elegida);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  // Catálogos para los selects
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [motivos, setMotivos] = useState<RES_MotivoIngreso[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Búsqueda de placa (Serie y Número o Placa Única)
  const [placaBusqueda, setPlacaBusqueda] = useState("");
  const [serieBusqueda, setSerieBusqueda] = useState("");
  const [numeroBusqueda, setNumeroBusqueda] = useState("");
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(false);
  const [vehiculoOriginal, setVehiculoOriginal] = useState<RES_Vehiculo | null>(null);
  const [nombreVehiculoEncontrado, setNombreVehiculoEncontrado] = useState("");

  // Estado del formulario de recepción
  const [payload, setPayload] = useState<CrearRecepcionRequest>({
    id_vehiculo: 0,
    id_empresa_transporte: 0,
    id_tipo_vehiculo: 0,
    id_conductor: 0,
    id_proveedor_minero: undefined,
    tipo_ingreso: TipoIngreso.RecepcionMineral,
    segunda_placa: "",
    observacion: "",
    evidencias: [],
    guia_remitente: "",
    guia_transportista: "",
    id_motivo_ingreso: undefined,
  });

  // Acompañantes y vehículos acompañantes
  const [visitantes, setVisitantes] = useState<VisitanteFormItem[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoAcompananteItem[]>([]);

  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [conds, emps, tps, provsRes, motsRes] = await Promise.all([
        AuxService.get_conductores(),
        AuxService.get_empresas_transporte(),
        AuxService.get_tipos_vehiculo(),
        AuxService.get_proveedores(),
        AuxService.get_motivos_ingreso(true),
      ]);

      setConductores(Array.isArray(conds) ? conds : []);
      setEmpresas(Array.isArray(emps) ? emps : []);
      setTiposVehiculo(Array.isArray(tps) ? tps : []);

      if (provsRes && provsRes.data && Array.isArray(provsRes.data)) {
        setProveedores(provsRes.data);
      } else if (Array.isArray(provsRes)) {
        setProveedores(provsRes as unknown as RES_Proveedor[]);
      }

      if (motsRes && motsRes.data && Array.isArray(motsRes.data)) {
        setMotivos(motsRes.data);
      } else if (Array.isArray(motsRes)) {
        setMotivos(motsRes as unknown as RES_MotivoIngreso[]);
      }
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los catálogos auxiliares.");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda automática al escribir placa
  useEffect(() => {
    const placaLimpia = placaBusqueda.trim().toUpperCase();

    if (placaLimpia === "" || placaLimpia === "-") {
      setVehiculoEncontrado(false);
      setVehiculoOriginal(null);
      setNombreVehiculoEncontrado("");
      setPayload((prev) => ({
        ...prev,
        id_vehiculo: 0,
      }));
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleBuscarVehiculo(placaLimpia);
    }, 450);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placaBusqueda]);

  const handleBuscarVehiculo = async (placa: string) => {
    const placaLimpia = placa ? placa.trim().toUpperCase() : "";

    if (placaLimpia === "") return;

    setLoading(true);
    try {
      const vResult = await AuxService.get_vehiculos({
        placa: placaLimpia,
      });
      if (vResult && vResult.length > 0) {
        const found = vResult[0];
        setVehiculoEncontrado(true);
        setVehiculoOriginal(found);
        setNombreVehiculoEncontrado(`${found.placa} (${found.tipo_vehiculo_nombre})`);

        setPayload((prev) => ({
          ...prev,
          id_vehiculo: found.id_vehiculo,
          id_empresa_transporte: found.id_empresa_transporte,
          id_tipo_vehiculo: found.id_tipo_vehiculo,
          id_conductor: found.last_id_conductor || prev.id_conductor || 0,
        }));
        notifySuccess("Vehículo localizado correctamente");
      } else {
        setVehiculoEncontrado(false);
        setVehiculoOriginal(null);
        setNombreVehiculoEncontrado("");
        setPayload((prev) => ({
          ...prev,
          id_vehiculo: 0,
        }));
      }
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al realizar la búsqueda del vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof CrearRecepcionRequest>(
    field: K,
    value: CrearRecepcionRequest[K]
  ) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleConductorCreado = (nuevoConductor: RES_Conductor) => {
    if (!nuevoConductor || !nuevoConductor.id_conductor) return;
    setConductores((prev) => [...prev, nuevoConductor]);
    handleChange("id_conductor", nuevoConductor.id_conductor);
  };

  // --- MÉTODOS DE ACOMPAÑANTES Y VEHÍCULOS ACOMPAÑANTES ---
  const agregarAcompananteUnidad = (datos: {
    nombre: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
    es_conductor?: boolean;
    foto_documento?: File[];
  }) => {
    setVisitantes((prev) => [
      ...prev,
      {
        id_visita_vehiculo: null,
        nombre: datos.nombre,
        apellido: datos.apellido ?? "",
        dni: datos.dni ?? "",
        telefono: datos.telefono ?? "",
        es_conductor: datos.es_conductor ?? false,
        foto_documento: datos.foto_documento ?? [],
        foto_documento_existente: null,
      },
    ]);
  };

  const setVisitante = (index: number, parcial: Partial<VisitanteFormItem>) => {
    setVisitantes((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], ...parcial };
      return copia;
    });
  };

  const eliminarVisitante = (index: number) => {
    setVisitantes((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarVehiculoConSlots = (
    placa: string,
    archivosVehiculo: File[],
    cantidadPersonas: number
  ) => {
    const tempId = Date.now();
    const vehiculoObj: VehiculoAcompananteItem = {
      id: tempId,
      id_recepcion_visita: 0,
      placa: placa.toUpperCase(),
      cantidad_personas: Math.max(1, cantidadPersonas),
      url_foto: [],
      archivos: archivosVehiculo,
    };

    setVehiculos((prev) => [...prev, vehiculoObj]);

    const nuevosVisitantes: VisitanteFormItem[] = [];
    for (let i = 0; i < cantidadPersonas; i++) {
      nuevosVisitantes.push({
        id_visita_vehiculo: tempId,
        nombre: `${i === 0 ? "Conductor" : "Ocupante " + (i + 1)} (${placa.toUpperCase()})`,
        apellido: "",
        dni: "",
        telefono: "",
        es_conductor: i === 0,
        foto_documento: [],
        foto_documento_existente: null,
      });
    }

    setVisitantes((prev) => [...prev, ...nuevosVisitantes]);
  };

  const editarVehiculoConSlots = (
    idVehiculo: number,
    placa: string,
    archivosVehiculo: File[],
    cantidadPersonas: number
  ) => {
    setVehiculos((prev) =>
      prev.map((v) =>
        v.id === idVehiculo
          ? {
              ...v,
              placa: placa.toUpperCase(),
              cantidad_personas: cantidadPersonas,
              archivos: archivosVehiculo.length > 0 ? archivosVehiculo : v.archivos,
            }
          : v
      )
    );
  };

  const eliminarVehiculoAcompanante = (idVehiculo: number) => {
    setVehiculos((prev) => prev.filter((v) => v.id !== idVehiculo));
    setVisitantes((prev) => prev.filter((v) => v.id_visita_vehiculo !== idVehiculo));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const placaBusquedaTarget = (placaBusqueda || `${serieBusqueda}-${numeroBusqueda}`).trim().toUpperCase();
    if (!placaBusquedaTarget || placaBusquedaTarget === "-") {
      setError("La placa del vehículo es obligatoria.");
      return;
    }
    if (!payload.id_empresa_transporte) {
      setError("El transportista es obligatorio.");
      return;
    }
    if (!payload.id_tipo_vehiculo) {
      setError("El tipo de vehículo es obligatorio.");
      return;
    }
    if (!payload.id_conductor) {
      setError("El conductor es obligatorio.");
      return;
    }

    const sucursalTarget =
      sucursal_elegida?.id_sucursal
        ? sucursal_elegida
        : useUIStore.getState().sucursales[0];

    if (!sucursalTarget || !sucursalTarget.id_sucursal) {
      setError("Debe seleccionar una sucursal antes de registrar el ingreso.");
      return;
    }

    setLoading(true);
    try {
      let finalVehiculoId = payload.id_vehiculo;

      // 1. Si el vehículo no existe en catálogo, se crea automáticamente
      if (!vehiculoEncontrado) {
        const placaTarget = (placaBusqueda || `${serieBusqueda}-${numeroBusqueda}`).trim().toUpperCase();
        const nuevoVehiculo = await AuxService.crear_vehiculo({
          placa: placaTarget,
          id_empresa_transporte: payload.id_empresa_transporte,
          id_tipo_vehiculo: payload.id_tipo_vehiculo,
        });
        finalVehiculoId = nuevoVehiculo.id_vehiculo;
        if (nuevoVehiculo.ya_existia) {
          notifySuccess("El vehículo ya se encontraba registrado. Seleccionado automáticamente.");
        }
      }
      // 2. Si existe pero cambió transportista o tipo de vehículo, se actualiza
      else if (
        vehiculoOriginal &&
        (vehiculoOriginal.id_empresa_transporte !== payload.id_empresa_transporte ||
          vehiculoOriginal.id_tipo_vehiculo !== payload.id_tipo_vehiculo)
      ) {
        await AuxService.editar_vehiculo(payload.id_vehiculo!, {
          id_empresa_transporte: payload.id_empresa_transporte,
          id_tipo_vehiculo: payload.id_tipo_vehiculo,
        });
      }

      // 3. Crear el registro de recepción final con visita y vehículos acompañantes
      const visitantesValidos = visitantes
        .filter((v) => Boolean((v.nombre && v.nombre.trim()) || (v.dni && v.dni.trim())))
        .map((v) => ({
          nombre: v.nombre,
          apellido: v.apellido || undefined,
          dni: v.dni || undefined,
          telefono: v.telefono || undefined,
          es_conductor: v.es_conductor,
          id_visita_vehiculo: v.id_visita_vehiculo ?? undefined,
          foto_documento: v.foto_documento,
        }));

      const hasVisitaInfo = visitantesValidos.length > 0 || vehiculos.length > 0;

      const finalPayload: CrearRecepcionRequest = {
        ...payload,
        id_vehiculo: finalVehiculoId,
        id_sucursal: sucursalTarget.id_sucursal,
        placa: (placaBusqueda || `${serieBusqueda}-${numeroBusqueda}`).trim().toUpperCase(),
        id_motivo_ingreso: hasVisitaInfo ? payload.id_motivo_ingreso : undefined,
        vehiculos: vehiculos.map((v) => ({
          id: v.id,
          placa: v.placa,
          cantidad_personas: v.cantidad_personas,
          archivos: v.archivos,
        })),
        visitantes: visitantesValidos,
      };

      const created = await RecepcionUnidadesService.crearRecepcion(finalPayload);
      notifySuccess("Recepción de unidad registrada correctamente");
      onSuccess(created);
    } catch (err: unknown) {
      console.error("Error al registrar la recepción de unidad:", err);
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const rawMsg = axiosError.response?.data?.message;

      const isInternalError =
        status === 500 ||
        (rawMsg && (rawMsg.includes("SQLSTATE") || rawMsg.includes("database") || rawMsg.includes("column")));
      const msg = isInternalError
        ? "Ocurrió un error en el servidor al registrar la recepción de unidad."
        : rawMsg || "Ocurrió un error al registrar la recepción.";

      notifyError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    payload,
    handleChange,
    submit,
    loading,
    error,
    conductores,
    empresas,
    tiposVehiculo,
    proveedores,
    motivos,
    loadingCatalogos,
    placaBusqueda,
    setPlacaBusqueda,
    serieBusqueda,
    setSerieBusqueda,
    numeroBusqueda,
    setNumeroBusqueda,
    vehiculoEncontrado,
    nombreVehiculoEncontrado,
    handleBuscarVehiculo,
    handleConductorCreado,
    visitantes,
    vehiculos,
    agregarAcompananteUnidad,
    setVisitante,
    eliminarVisitante,
    agregarVehiculoConSlots,
    editarVehiculoConSlots,
    eliminarVehiculoAcompanante,
  };
};
