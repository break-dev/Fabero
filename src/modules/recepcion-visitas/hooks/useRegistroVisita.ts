import { useState, useEffect, useCallback } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { RecepcionVisitasService } from "../service/recepcion-visitas.service";
import type { CrearRecepcionVisitaRequest, VisitorPayload, VehiculoAcompananteRequest } from "../service/recepcion-visitas.requests";
import type { RecepcionVisitaResponse } from "../service/recepcion-visitas.responses";
import type { RES_Empleado } from "../../../service/responses/empleado";
import type { RES_MotivoIngreso } from "../../../service/responses/auxiliar-visitas";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface VehiculoAcompananteItem {
  id: number;
  id_recepcion_visita?: number;
  placa: string;
  cantidad_personas: number;
  url_foto?: string[];
  archivos?: File[];
}

export interface VisitanteFormItem {
  id_visitante?: number;
  id_visita_vehiculo?: number | null;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  es_conductor?: boolean;
  foto_documento: File[];
  foto_documento_existente?: string[] | null;
}

export const useRegistroVisita = (onSuccess: (r: RecepcionVisitaResponse) => void) => {
  const { notifyError, notifySuccess } = useNotify();

  const [payload, setPayload] = useState<Omit<CrearRecepcionVisitaRequest, "visitantes" | "vehiculos" | "con_vehiculo">>({
    id_empleado_contacto: 0,
    id_motivo_ingreso: 0,
    observacion: "",
    placa: "",
  });

  const [vehiculos, setVehiculos] = useState<VehiculoAcompananteItem[]>([]);
  const [visitantes, setVisitantes] = useState<VisitanteFormItem[]>([]);
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [empleados, setEmpleados] = useState<RES_Empleado[]>([]);
  const [motivos, setMotivos] = useState<RES_MotivoIngreso[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  useEffect(() => {
    const fetchCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        const [empRes, motRes] = await Promise.all([
          AuxService.get_empleados({ estado: EstadoBase.Activo }),
          AuxService.get_motivos_ingreso(),
        ]);
        if (empRes.success) setEmpleados(empRes.data);
        if (motRes.success) setMotivos(motRes.data);
      } catch (e: unknown) {
        console.error(e);
        notifyError("Error al cargar empleados o motivos de ingreso.");
      } finally {
        setLoadingCatalogos(false);
      }
    };
    fetchCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof Omit<CrearRecepcionVisitaRequest, "visitantes" | "vehiculos" | "con_vehiculo">>(
    field: K,
    value: Omit<CrearRecepcionVisitaRequest, "visitantes" | "vehiculos" | "con_vehiculo">[K]
  ) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
  };

  // --- Manejo de Vehículos Acompañantes y Slots ---
  const agregarVehiculoConSlots = useCallback(
    async (placa: string, archivosVehiculo: File[], cantidadPersonas: number) => {
      setLoadingVehiculo(true);
      try {
        const vehiculoObj: VehiculoAcompananteItem = {
          id: Date.now(),
          placa,
          cantidad_personas: Math.max(1, cantidadPersonas),
          url_foto: [],
          archivos: archivosVehiculo,
        };

        setVehiculos((prev) => [...prev, vehiculoObj]);

        const nuevosVisitantes: VisitanteFormItem[] = Array.from(
          { length: Math.max(1, cantidadPersonas) },
          (_, i) => ({
            id_visita_vehiculo: vehiculoObj.id,
            nombre: "",
            apellido: "",
            dni: "",
            telefono: "",
            es_conductor: i === 0,
            foto_documento: [],
            foto_documento_existente: null,
          }),
        );

        setVisitantes((prev) => [...prev, ...nuevosVisitantes]);
        notifySuccess(`Vehículo ${placa} agregado con ${cantidadPersonas} ocupante(s)`);
        return true;
      } catch (e) {
        console.error(e);
        notifyError("Error al agregar el vehículo");
        return false;
      } finally {
        setLoadingVehiculo(false);
      }
    },
    [notifyError, notifySuccess],
  );

  const editarVehiculoConSlots = useCallback(
    async (vehiculoId: number, nuevaPlaca: string, nuevosArchivos: File[], nuevaCantidad: number) => {
      setLoadingVehiculo(true);
      try {
        setVehiculos((prev) =>
          prev.map((v) =>
            v.id === vehiculoId
              ? {
                  ...v,
                  placa: nuevaPlaca,
                  cantidad_personas: nuevaCantidad,
                  archivos: nuevosArchivos.length > 0 ? nuevosArchivos : v.archivos,
                }
              : v,
          ),
        );

        setVisitantes((prev) => {
          const actualesDelVehiculo = prev.filter((vis) => vis.id_visita_vehiculo === vehiculoId);
          const otrosVisitantes = prev.filter((vis) => vis.id_visita_vehiculo !== vehiculoId);

          let ajustados = [...actualesDelVehiculo];
          if (nuevaCantidad > actualesDelVehiculo.length) {
            const extraCount = nuevaCantidad - actualesDelVehiculo.length;
            const extras: VisitanteFormItem[] = Array.from({ length: extraCount }, (_, i) => ({
              id_visita_vehiculo: vehiculoId,
              nombre: "",
              apellido: "",
              dni: "",
              telefono: "",
              es_conductor: actualesDelVehiculo.length === 0 && i === 0,
              foto_documento: [],
              foto_documento_existente: null,
            }));
            ajustados = [...ajustados, ...extras];
          } else if (nuevaCantidad < actualesDelVehiculo.length) {
            ajustados = ajustados.slice(0, nuevaCantidad);
          }

          if (ajustados.length > 0 && !ajustados.some((vis) => vis.es_conductor)) {
            ajustados[0].es_conductor = true;
          }

          return [...otrosVisitantes, ...ajustados];
        });

        notifySuccess("Vehículo actualizado");
        return true;
      } catch (e) {
        console.error(e);
        notifyError("Error al editar el vehículo");
        return false;
      } finally {
        setLoadingVehiculo(false);
      }
    },
    [notifyError, notifySuccess],
  );

  const eliminarVehiculo = useCallback(
    (vehiculoId: number) => {
      setVehiculos((prev) => prev.filter((v) => v.id !== vehiculoId));
      setVisitantes((prev) => prev.filter((v) => v.id_visita_vehiculo !== vehiculoId));
      notifySuccess("Vehículo y sus ocupantes eliminados");
    },
    [notifySuccess],
  );

  const agregarOcupanteAVehiculo = useCallback(
    (vehiculoId: number) => {
      setVehiculos((prev) =>
        prev.map((v) => (v.id === vehiculoId ? { ...v, cantidad_personas: v.cantidad_personas + 1 } : v)),
      );

      setVisitantes((prev) => {
        const ocupantesExistentes = prev.filter((vis) => vis.id_visita_vehiculo === vehiculoId);
        const nuevoSlot: VisitanteFormItem = {
          id_visita_vehiculo: vehiculoId,
          nombre: "",
          apellido: "",
          dni: "",
          telefono: "",
          es_conductor: ocupantesExistentes.length === 0,
          foto_documento: [],
          foto_documento_existente: null,
        };
        return [...prev, nuevoSlot];
      });

      notifySuccess("Nuevo slot de ocupante agregado al vehículo");
    },
    [notifySuccess],
  );

  const marcarConductorVehiculo = useCallback(
    (vehiculoId: number, targetIndex: number) => {
      setVisitantes((prev) =>
        prev.map((vis, idx) => {
          if (vis.id_visita_vehiculo !== vehiculoId) return vis;
          return {
            ...vis,
            es_conductor: idx === targetIndex,
          };
        }),
      );
    },
    [],
  );

  // --- Manejo de Visitantes Peatonales / Individuales ---
  const handleAgregarVisitanteIndividual = (nuevoVisitante: VisitanteFormItem): boolean => {
    if (nuevoVisitante.dni && visitantes.some((v) => v.dni && v.dni === nuevoVisitante.dni)) {
      notifyError("Este visitante ya ha sido agregado a la lista.");
      return false;
    }
    setVisitantes((prev) => [...prev, { ...nuevoVisitante, id_visita_vehiculo: null, es_conductor: false }]);
    return true;
  };

  const handleActualizarVisitante = (index: number, visitanteActualizado: VisitanteFormItem): boolean => {
    if (visitanteActualizado.dni && visitantes.some((v, i) => i !== index && v.dni && v.dni === visitanteActualizado.dni)) {
      notifyError("Este DNI ya pertenece a otro visitante en la lista.");
      return false;
    }
    setVisitantes((prev) => prev.map((v, i) => (i === index ? visitanteActualizado : v)));
    return true;
  };

  const handleRemoverVisitante = (index: number) => {
    setVisitantes((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = useCallback(() => {
    setPayload({
      id_empleado_contacto: 0,
      id_empleado_autoriza: 0,
      id_motivo_ingreso: 0,
      observacion: "",
      placa: "",
    });
    setVisitantes([]);
    setVehiculos([]);
    setEvidencias([]);
    setError(null);
  }, []);

  // --- Envío del Formulario ---
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!payload.id_motivo_ingreso || payload.id_motivo_ingreso <= 0) {
      setError("Debe seleccionar el motivo de ingreso.");
      return;
    }

    // Si la lista de visitantes viene vacía, instanciar al menos 1 por defecto
    const listaAEnviar =
      visitantes.length > 0
        ? visitantes
        : [
            {
              id_visitante: undefined,
              id_visita_vehiculo: undefined,
              es_conductor: true,
              nombre: "VISITANTE",
              apellido: "",
              dni: "",
              telefono: "",
              foto_documento: [],
            },
          ];

    const conVehiculo = vehiculos.length > 0 || Boolean(payload.placa);

    setLoading(true);

    try {
      const vehiculosPayload: VehiculoAcompananteRequest[] = vehiculos.map((veh) => ({
        temp_id: veh.id,
        placa: veh.placa,
        cantidad_personas: veh.cantidad_personas,
        archivos: veh.archivos,
      }));

      const visitantesPayload: VisitorPayload[] = listaAEnviar.map((v) => ({
        id_visitante: v.id_visitante,
        id_visita_vehiculo: v.id_visita_vehiculo ?? undefined,
        es_conductor: v.es_conductor,
        nombre: v.nombre,
        apellido: v.apellido,
        dni: v.dni,
        telefono: v.telefono,
        foto_documento: v.foto_documento,
      }));

      const requestPayload: CrearRecepcionVisitaRequest = {
        id_empleado_contacto: payload.id_empleado_contacto,
        id_empleado_autoriza: payload.id_empleado_contacto,
        id_motivo_ingreso: payload.id_motivo_ingreso,
        observacion: payload.observacion,
        con_vehiculo: conVehiculo,
        placa: payload.placa,
        evidencias,
        vehiculos: vehiculosPayload,
        visitantes: visitantesPayload,
      };

      const response = await RecepcionVisitasService.crearRecepcion(requestPayload);
      notifySuccess("Visita registrada correctamente");
      resetForm();
      onSuccess(response);
    } catch (err: unknown) {
      console.error(err);

      const errorWithResponse = err as { response?: { data?: { message?: string } }; message?: string };
      let rawMsg = "Ocurrió un error inesperado al registrar la visita.";
      if (errorWithResponse.response?.data?.message) {
        rawMsg = errorWithResponse.response.data.message;
      } else if (errorWithResponse.message) {
        rawMsg = errorWithResponse.message;
      }

      let sanitizedMsg = rawMsg;
      const lower = rawMsg ? rawMsg.toLowerCase() : "";
      if (
        lower.includes("sqlstate") ||
        lower.includes("database") ||
        lower.includes("column") ||
        lower.includes("table not found") ||
        lower.includes("unknown column") ||
        lower.includes("500") ||
        lower.includes("incorrect integer value")
      ) {
        sanitizedMsg = "Ocurrió un error interno en el servidor.";
      }

      setError(sanitizedMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    payload,
    handleChange,
    vehiculos,
    visitantes,
    setVisitantes,
    evidencias,
    setEvidencias,
    loadingVehiculo,
    agregarVehiculoConSlots,
    editarVehiculoConSlots,
    eliminarVehiculo,
    agregarOcupanteAVehiculo,
    marcarConductorVehiculo,
    handleAgregarVisitanteIndividual,
    handleActualizarVisitante,
    handleRemoverVisitante,
    resetForm,
    submit,
    loading,
    error,
    empleados,
    motivos,
    setMotivos,
    loadingCatalogos,
    handleMotivoCreado: useCallback((nuevoMotivo: RES_MotivoIngreso) => {
      setMotivos((prev) => {
        if (prev.some((m) => m.id_motivo_ingreso === nuevoMotivo.id_motivo_ingreso)) {
          return prev;
        }
        return [...prev, nuevoMotivo].sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      setPayload((prev) => ({ ...prev, id_motivo_ingreso: nuevoMotivo.id_motivo_ingreso }));
    }, []),
  };
};
