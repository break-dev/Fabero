import { useState, useCallback, useEffect } from "react";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { ConfirmarVisitaPayload } from "../service/recepcion-unidades.requests";
import type {
  ProgramacionVisitaPayload,
  RecepcionUnidadResponse,
  VisitaDetalleResponse,
  VisitaVehiculoResponse,
} from "../service/recepcion-unidades.responses";
import type { RES_MotivoIngreso } from "../../../service/responses/auxiliar-visitas";
import { useNotify } from "../../../hooks/useNotify";

import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { EmpresaTransporteResponse } from "../../empresas-transporte/service/empresas-transporte.responses";
import type { ProveedorResponse } from "../../proveedores-mineros/service/proveedores.responses";
import { useUIStore } from "../../../stores/ui.store";

export interface VisitanteFormItem {
  id_visitante?: number;
  id_visita_vehiculo: number | null;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  es_conductor: boolean;
  foto_documento: File[];
  foto_documento_existente: string[] | null;
}

export interface VehiculoAcompananteItem extends VisitaVehiculoResponse {
  archivos?: File[];
}

import type { CrearRecepcionRequest } from "../service/recepcion-unidades.requests";

interface Props {
  programacion?: RecepcionUnidadResponse | null;
  opened?: boolean;
}

export const useConfirmarProgramacion = ({ programacion, opened = true }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [motivos, setMotivos] = useState<RES_MotivoIngreso[]>([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [evidencias, setEvidencias] = useState<File[]>([]);

  const [empresasCatalog, setEmpresasCatalog] = useState<RES_EmpresaTransporte[]>([]);
  const [vehiculosCatalog, setVehiculosCatalog] = useState<RES_Vehiculo[]>([]);
  const [conductoresCatalog, setConductoresCatalog] = useState<RES_Conductor[]>([]);
  const [proveedoresCatalog, setProveedoresCatalog] = useState<RES_Proveedor[]>([]);
  const [tiposVehiculoCatalog, setTiposVehiculoCatalog] = useState<RES_TipoVehiculo[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<number | null>(
    programacion?.id_empresa_transporte ?? null,
  );
  const [idVehiculo, setIdVehiculo] = useState<number | null>(
    programacion?.id_vehiculo ?? null,
  );
  const [idTipoVehiculo, setIdTipoVehiculo] = useState<number | null>(
    programacion?.id_tipo_vehiculo ?? null,
  );
  const [idSucursal, setIdSucursal] = useState<number | null>(
    programacion?.id_sucursal ?? useUIStore.getState().sucursal_elegida?.id_sucursal ?? useUIStore.getState().sucursales[0]?.id_sucursal ?? null,
  );
  const [idConductor, setIdConductor] = useState<number | null>(
    programacion?.id_conductor ?? null,
  );
  const [idProveedorMinero, setIdProveedorMinero] = useState<number | null>(
    programacion?.id_proveedor_minero ?? null,
  );

  const [serieGuiaRemitente, setSerieGuiaRemitente] = useState<string>(
    programacion?.serie_guia_remitente ?? "",
  );
  const [numeroGuiaRemitente, setNumeroGuiaRemitente] = useState<string>(
    programacion?.numero_guia_remitente ?? "",
  );
  const [serieGuiaTransportista, setSerieGuiaTransportista] = useState<string>(
    programacion?.serie_guia_transportista ?? "",
  );
  const [numeroGuiaTransportista, setNumeroGuiaTransportista] = useState<string>(
    programacion?.numero_guia_transportista ?? "",
  );

  const [idMotivoIngreso, setIdMotivoIngreso] = useState<number | null>(
    programacion?.visita?.id_motivo_ingreso ?? null,
  );
  const [observacion, setObservacion] = useState<string>(
    programacion?.visita?.observacion ?? programacion?.observacion ?? "",
  );

  const lockedEmpresa = Boolean(programacion?.id_empresa_transporte);
  const lockedVehiculo = Boolean(programacion?.id_vehiculo);
  const lockedConductor = Boolean(programacion?.id_conductor);
  const lockedProveedor = Boolean(programacion?.id_proveedor_minero);
  const lockedSerieRemitente = Boolean(programacion?.serie_guia_remitente);
  const lockedNumeroRemitente = Boolean(programacion?.numero_guia_remitente);
  const lockedSerieTransportista = Boolean(programacion?.serie_guia_transportista);
  const lockedNumeroTransportista = Boolean(programacion?.numero_guia_transportista);

  const resetForm = useCallback(() => {
    setIdEmpresaTransporte(programacion?.id_empresa_transporte ?? null);
    setIdVehiculo(programacion?.id_vehiculo ?? null);
    setIdTipoVehiculo(programacion?.id_tipo_vehiculo ?? null);
    setIdConductor(programacion?.id_conductor ?? null);
    setIdProveedorMinero(programacion?.id_proveedor_minero ?? null);
    setSerieGuiaRemitente(programacion?.serie_guia_remitente ?? "");
    setNumeroGuiaRemitente(programacion?.numero_guia_remitente ?? "");
    setSerieGuiaTransportista(programacion?.serie_guia_transportista ?? "");
    setNumeroGuiaTransportista(programacion?.numero_guia_transportista ?? "");
    setIdMotivoIngreso(programacion?.visita?.id_motivo_ingreso ?? null);
    setObservacion(programacion?.visita?.observacion ?? programacion?.observacion ?? "");
    setEvidencias([]);
    setVehiculos(programacion?.visita?.vehiculos ?? []);
    setVisitantes(
      programacion?.visita?.detalles?.map((d: VisitaDetalleResponse) => ({
        id_visitante: d.id_visitante,
        id_visita_vehiculo: d.id_visita_vehiculo,
        nombre: d.visitante_nombre,
        apellido: d.visitante_apellido ?? "",
        dni: d.visitante_dni ?? "",
        telefono: d.visitante_telefono ?? "",
        es_conductor: d.es_conductor,
        foto_documento: [],
        foto_documento_existente: d.url_foto_documento,
      })) ?? [],
    );
  }, [programacion]);

  useEffect(() => {
    if (opened) {
      resetForm();
    }
  }, [programacion, opened, resetForm]);

  const [vehiculos, setVehiculos] = useState<VehiculoAcompananteItem[]>(
    programacion?.visita?.vehiculos ?? [],
  );
  const [visitantes, setVisitantes] = useState<VisitanteFormItem[]>(
    programacion?.visita?.detalles?.map((d: VisitaDetalleResponse) => ({
      id_visitante: d.id_visitante,
      id_visita_vehiculo: d.id_visita_vehiculo,
      nombre: d.visitante_nombre,
      apellido: d.visitante_apellido ?? "",
      dni: d.visitante_dni ?? "",
      telefono: d.visitante_telefono ?? "",
      es_conductor: d.es_conductor,
      foto_documento: [],
      foto_documento_existente: d.url_foto_documento,
    })) ?? [],
  );

  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);

  useEffect(() => {
    const cargarTodo = async () => {
      setLoadingMotivos(true);
      setLoadingCatalogos(true);
      try {
        const [respMotivos, emps, vehs, conds, provs, tps] = await Promise.all([
          AuxService.get_motivos_ingreso(true),
          AuxService.get_empresas_transporte(),
          AuxService.get_vehiculos(),
          AuxService.get_conductores(),
          AuxService.get_proveedores(),
          AuxService.get_tipos_vehiculo(),
        ]);

        let motivosLista: RES_MotivoIngreso[] = [];
        if (respMotivos && respMotivos.data && Array.isArray(respMotivos.data)) {
          motivosLista = respMotivos.data;
        } else if (Array.isArray(respMotivos)) {
          motivosLista = respMotivos;
        }
        setMotivos(motivosLista);

        // Autollenar motivo de ingreso para recepción de unidad
        const motivoAuto =
          motivosLista.find((m: RES_MotivoIngreso) => Boolean(m.es_recepcion_unidad)) ??
          motivosLista[0];
        if (motivoAuto && motivoAuto.id_motivo_ingreso) {
          setIdMotivoIngreso(Number(motivoAuto.id_motivo_ingreso));
        }

        setEmpresasCatalog(Array.isArray(emps) ? emps : []);
        setVehiculosCatalog(Array.isArray(vehs) ? vehs : []);
        setConductoresCatalog(Array.isArray(conds) ? conds : []);
        setTiposVehiculoCatalog(Array.isArray(tps) ? tps : []);
        if (provs && provs.success && Array.isArray(provs.data)) {
          setProveedoresCatalog(provs.data);
        }
      } catch (e) {
        console.error(e);
        notifyError("Error al cargar los catálogos auxiliares");
      } finally {
        setLoadingMotivos(false);
        setLoadingCatalogos(false);
      }
    };
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (idVehiculo && vehiculosCatalog.length > 0) {
      const vFound = vehiculosCatalog.find((v) => v.id_vehiculo === idVehiculo);
      if (vFound?.id_tipo_vehiculo) {
        setIdTipoVehiculo(vFound.id_tipo_vehiculo);
      }
    }
  }, [idVehiculo, vehiculosCatalog]);

  const handleConductorCreado = useCallback((c: RES_Conductor) => {
    setConductoresCatalog((prev) => [c, ...prev]);
    setIdConductor(c.id_conductor);
    notifySuccess(`Conductor ${c.nombre_completo} registrado`);
  }, [notifySuccess]);

  const handleVehiculoCreado = useCallback((v: RES_Vehiculo) => {
    setVehiculosCatalog((prev) => [v, ...prev]);
    setIdVehiculo(v.id_vehiculo);
    notifySuccess(`Vehículo registrado`);
  }, [notifySuccess]);

  const handleTipoVehiculoCreado = useCallback(async (idTipo: number) => {
    try {
      const tps = await AuxService.get_tipos_vehiculo();
      if (Array.isArray(tps)) {
        setTiposVehiculoCatalog(tps);
      }
      setIdTipoVehiculo(idTipo);
      notifySuccess(`Tipo de vehículo seleccionado`);
    } catch (e) {
      console.error(e);
    }
  }, [notifySuccess]);

  const handleEmpresaCreada = useCallback((nueva: EmpresaTransporteResponse) => {
    const resEmp: RES_EmpresaTransporte = {
      id_empresa_transporte: nueva.id,
      ruc: nueva.ruc,
      razon_social: nueva.razon_social,
      estado: nueva.estado,
    };
    setEmpresasCatalog((prev) => [resEmp, ...prev.filter((e) => e.id_empresa_transporte !== nueva.id)]);
    setIdEmpresaTransporte(nueva.id);
    notifySuccess(`Empresa ${nueva.razon_social} registrada`);
  }, [notifySuccess]);

  const handleProveedorCreado = useCallback((nuevo: ProveedorResponse) => {
    const resProv: RES_Proveedor = {
      id_proveedor: nuevo.id_proveedor,
      razon_social: nuevo.razon_social,
      direccion: nuevo.direccion,
      documento: nuevo.ruc || nuevo.dni || null,
      telefono: nuevo.telefono,
    };
    setProveedoresCatalog((prev) => [resProv, ...prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor)]);
    setIdProveedorMinero(nuevo.id_proveedor);
    notifySuccess(`Proveedor ${nuevo.razon_social} registrado`);
  }, [notifySuccess]);

  const eliminarVehiculo = useCallback(
    async (idVehiculoParam: number) => {
      setLoadingVehiculo(true);
      try {
        await RecepcionUnidadesService.eliminarVehiculoVisitado(idVehiculoParam);
        setVehiculos((prev) => prev.filter((v) => v.id !== idVehiculoParam));
        notifySuccess("Vehículo acompañante eliminado");
      } catch (e) {
        console.error(e);
        notifyError("Error al eliminar el vehículo acompañante");
      } finally {
        setLoadingVehiculo(false);
      }
    },
    [notifyError, notifySuccess],
  );

  const actualizarCantidadPersonas = useCallback(
    (idVehiculoParam: number, cantidad: number) => {
      setVehiculos((prev) =>
        prev.map((v) => (v.id === idVehiculoParam ? { ...v, cantidad_personas: cantidad } : v)),
      );
    },
    [],
  );

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

  const agregarAcompananteUnidad = useCallback(
    (datos: {
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
          es_conductor: Boolean(datos.es_conductor),
          foto_documento: datos.foto_documento ?? [],
          foto_documento_existente: null,
        },
      ]);
      notifySuccess("Acompañante de unidad agregado");
    },
    [notifySuccess],
  );

  const agregarVehiculoConSlots = useCallback(
    async (placa: string, archivosVehiculo: File[], cantidadPersonas: number) => {
      setLoadingVehiculo(true);
      try {
        let vehiculoObj: VehiculoAcompananteItem = {
          id: Date.now(),
          id_recepcion_visita: programacion?.visita?.id_recepcion_visita ?? 0,
          placa,
          cantidad_personas: Math.max(1, cantidadPersonas),
          url_foto: [],
          archivos: archivosVehiculo,
        };

        if (programacion?.visita?.id_recepcion_visita) {
          const res = await RecepcionUnidadesService.agregarVehiculoVisitado({
            id_recepcion_visita: programacion.visita.id_recepcion_visita,
            placa,
            cantidad_personas: Math.max(1, cantidadPersonas),
            archivos: archivosVehiculo,
          });
          vehiculoObj = { ...res, archivos: archivosVehiculo };
        }

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
        notifySuccess(`Vehículo acompañante ${placa} registrado (${cantidadPersonas} ocupante(s))`);
        return true;
      } catch (e) {
        console.error(e);
        notifyError("Error al agregar el vehículo acompañante");
        return false;
      } finally {
        setLoadingVehiculo(false);
      }
    },
    [programacion?.visita, notifyError, notifySuccess],
  );

  const editarVehiculoConSlots = useCallback(
    (idVehiculoParam: number, placa: string, archivosVehiculo: File[], nuevaCantidadPersonas: number) => {
      const cantidad = Math.max(1, nuevaCantidadPersonas);
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === idVehiculoParam
            ? {
                ...v,
                placa,
                cantidad_personas: cantidad,
                archivos: archivosVehiculo.length > 0 ? archivosVehiculo : v.archivos,
              }
            : v,
        ),
      );

      setVisitantes((prev) => {
        const ocupantesDeVeh = prev.filter((vis) => vis.id_visita_vehiculo === idVehiculoParam);
        const countActual = ocupantesDeVeh.length;

        if (countActual === cantidad) {
          return prev;
        }

        if (countActual < cantidad) {
          const nuevosSlots: VisitanteFormItem[] = Array.from(
            { length: cantidad - countActual },
            () => ({
              id_visita_vehiculo: idVehiculoParam,
              nombre: "",
              apellido: "",
              dni: "",
              telefono: "",
              es_conductor: false,
              foto_documento: [],
              foto_documento_existente: null,
            }),
          );
          return [...prev, ...nuevosSlots];
        }

        let countEliminados = 0;
        const limiteEliminar = countActual - cantidad;
        return prev.filter((vis) => {
          if (vis.id_visita_vehiculo === idVehiculoParam) {
            if (countEliminados < limiteEliminar) {
              countEliminados++;
              return false;
            }
          }
          return true;
        });
      });

      notifySuccess(`Vehículo ${placa} actualizado`);
    },
    [notifySuccess],
  );

  const confirmar = async (): Promise<{
    visita?: ProgramacionVisitaPayload;
    updatedRecepcion: RecepcionUnidadResponse;
  } | null> => {
    if (!idEmpresaTransporte) {
      notifyError("Debe seleccionar la Empresa de Transporte");
      return null;
    }
    if (!idVehiculo) {
      notifyError("Debe seleccionar el Vehículo");
      return null;
    }
    if (!idConductor) {
      notifyError("Debe seleccionar el Conductor");
      return null;
    }

    setLoadingConfirmar(true);
    try {
      const motivoAuto = motivos.find((m) => Boolean(m.es_recepcion_unidad)) ?? motivos[0];
      const motivoFinal = idMotivoIngreso || (motivoAuto ? Number(motivoAuto.id_motivo_ingreso) : 1);
      const sucursalTarget =
        idSucursal ||
        useUIStore.getState().sucursal_elegida?.id_sucursal ||
        useUIStore.getState().sucursales[0]?.id_sucursal ||
        1;

      if (programacion) {
        // MODO 1: Confirmar Programación existente
        const updatedRecepcion = await RecepcionUnidadesService.confirmarProgramacion(programacion.id, {
          id_empresa_transporte: idEmpresaTransporte ?? undefined,
          id_vehiculo: idVehiculo ?? undefined,
          id_tipo_vehiculo: idTipoVehiculo ?? undefined,
          id_sucursal: idSucursal ?? undefined,
          id_conductor: idConductor ?? undefined,
          id_proveedor_minero: idProveedorMinero ?? undefined,
          serie_guia_remitente: serieGuiaRemitente || undefined,
          numero_guia_remitente: numeroGuiaRemitente || undefined,
          serie_guia_transportista: serieGuiaTransportista || undefined,
          numero_guia_transportista: numeroGuiaTransportista || undefined,
        });

        const visitantesValidos = visitantes
          .filter((v) => Boolean((v.nombre && v.nombre.trim()) || (v.dni && v.dni.trim()) || v.id_visitante))
          .map((v) => ({
            id_visitante: v.id_visitante || undefined,
            nombre: v.nombre?.trim() || "VISITANTE",
            apellido: v.apellido?.trim() || undefined,
            dni: v.dni?.trim() || undefined,
            telefono: v.telefono?.trim() || undefined,
            es_conductor: v.es_conductor,
            id_visita_vehiculo: v.id_visita_vehiculo ?? undefined,
            foto_documento: v.foto_documento,
          }));

        let visita: ProgramacionVisitaPayload | undefined = undefined;
        if (visitantesValidos.length > 0 || vehiculos.length > 0) {
          const payload: ConfirmarVisitaPayload = {
            id_recepcion_unidad: programacion.id,
            id_motivo_ingreso: motivoFinal,
            observacion: observacion || undefined,
            evidencias,
            vehiculos: vehiculos.map((v) => ({
              id: v.id,
              placa: v.placa,
              cantidad_personas: v.cantidad_personas,
              archivos: v.archivos,
            })),
            visitantes: visitantesValidos,
          };
          visita = await RecepcionUnidadesService.crearVisitaParaProgramacion(payload);
        }

        notifySuccess("Recepción confirmada correctamente");
        resetForm();
        return { visita, updatedRecepcion };
      } else {
        // MODO 2: Registro Directo de Recepción (No Programada)
        const vehiculoSel = vehiculosCatalog.find((v) => v.id_vehiculo === idVehiculo);
        const placa = vehiculoSel?.placa || "";

        const visitantesValidos = visitantes
          .filter((v) => Boolean((v.nombre && v.nombre.trim()) || (v.dni && v.dni.trim()) || v.id_visitante))
          .map((v) => ({
            id_visitante: v.id_visitante || undefined,
            nombre: v.nombre?.trim() || "VISITANTE",
            apellido: v.apellido?.trim() || undefined,
            dni: v.dni?.trim() || undefined,
            telefono: v.telefono?.trim() || undefined,
            es_conductor: v.es_conductor,
            id_visita_vehiculo: v.id_visita_vehiculo ?? undefined,
            foto_documento: v.foto_documento,
          }));

        const hasVisitaInfo = visitantesValidos.length > 0 || vehiculos.length > 0;

        const payload: CrearRecepcionRequest = {
          id_vehiculo: idVehiculo,
          placa: placa || undefined,
          id_empresa_transporte: idEmpresaTransporte,
          id_tipo_vehiculo: idTipoVehiculo || undefined,
          id_conductor: idConductor,
          id_proveedor_minero: idProveedorMinero || undefined,
          id_sucursal: sucursalTarget,
          serie_guia_remitente: serieGuiaRemitente || undefined,
          numero_guia_remitente: numeroGuiaRemitente || undefined,
          serie_guia_transportista: serieGuiaTransportista || undefined,
          numero_guia_transportista: numeroGuiaTransportista || undefined,
          id_motivo_ingreso: hasVisitaInfo ? motivoFinal : undefined,
          observacion: observacion || undefined,
          evidencias,
          vehiculos: vehiculos.map((v) => ({
            id: v.id,
            placa: v.placa,
            cantidad_personas: v.cantidad_personas,
            archivos: v.archivos,
          })),
          visitantes: visitantesValidos,
        };

        const created = await RecepcionUnidadesService.crearRecepcion(payload);
        notifySuccess("Recepción de unidad registrada correctamente");
        resetForm();
        return { updatedRecepcion: created };
      }
    } catch (e) {
      console.error(e);
      notifyError("Error al procesar la recepción de unidad");
      return null;
    } finally {
      setLoadingConfirmar(false);
    }
  };

  return {
    motivos,
    loadingMotivos,
    empresasCatalog,
    vehiculosCatalog,
    conductoresCatalog,
    proveedoresCatalog,
    loadingCatalogos,
    idEmpresaTransporte,
    setIdEmpresaTransporte,
    lockedEmpresa,
    idVehiculo,
    setIdVehiculo: (val: number | null) => {
      setIdVehiculo(val);
      if (val) {
        const vFound = vehiculosCatalog.find((v) => v.id_vehiculo === val);
        if (vFound?.id_tipo_vehiculo) {
          setIdTipoVehiculo(vFound.id_tipo_vehiculo);
        }
      }
    },
    lockedVehiculo,
    tiposVehiculoCatalog,
    idTipoVehiculo,
    setIdTipoVehiculo,
    idSucursal,
    setIdSucursal,
    idConductor,
    setIdConductor,
    lockedConductor,
    idProveedorMinero,
    setIdProveedorMinero,
    lockedProveedor,
    serieGuiaRemitente,
    setSerieGuiaRemitente,
    lockedSerieRemitente,
    numeroGuiaRemitente,
    setNumeroGuiaRemitente,
    lockedNumeroRemitente,
    serieGuiaTransportista,
    setSerieGuiaTransportista,
    lockedSerieTransportista,
    numeroGuiaTransportista,
    setNumeroGuiaTransportista,
    lockedNumeroTransportista,
    idMotivoIngreso,
    setIdMotivoIngreso,
    observacion,
    setObservacion,
    evidencias,
    setEvidencias,
    handleConductorCreado,
    handleVehiculoCreado,
    handleTipoVehiculoCreado,
    handleEmpresaCreada,
    handleProveedorCreado,
    vehiculos,
    visitantes,
    setVisitante,
    eliminarVisitante,
    agregarAcompananteUnidad,
    agregarVehiculoConSlots,
    editarVehiculoConSlots,
    eliminarVehiculo,
    actualizarCantidadPersonas,
    confirmar,
    loadingVehiculo,
    loadingConfirmar,
  };
};
