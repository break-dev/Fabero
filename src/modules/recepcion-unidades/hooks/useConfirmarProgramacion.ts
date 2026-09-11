import { useState, useCallback, useEffect } from "react";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import {
  ProgramarRecepcionService,
} from "../../programar-recepcion/service/programar-recepcion.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { ConfirmarVisitaPayload } from "../service/recepcion-unidades.requests";
import type {
  ProgramacionVisitaPayload,
  RecepcionUnidadResponse,
  VisitaDetalleResponse,
  VisitaVehiculoResponse,
} from "../service/recepcion-unidades.responses";
import type { ProgramacionDetail } from "../../programar-recepcion/service/programar-recepcion.responses";
import type { RES_MotivoIngreso } from "../../../service/responses/auxiliar-visitas";
import type { IDocumentoProgramacion } from "../../../shared/interfaces/documentos-programacion";
import { useNotify } from "../../../hooks/useNotify";

import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { EmpresaTransporteResponse } from "../../empresas-transporte/service/empresas-transporte.responses";
import type { ProveedorResponse } from "../../proveedores-mineros/service/proveedores.responses";
import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
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

  const [idSucursal, setIdSucursal] = useState<number | null>(
    programacion?.id_sucursal ?? useUIStore.getState().sucursal_elegida?.id_sucursal ?? useUIStore.getState().sucursales[0]?.id_sucursal ?? null,
  );
  const [idConductor, setIdConductor] = useState<number | null>(
    programacion?.id_conductor ?? null,
  );
  const [idEmpresaTransporteEditado, setIdEmpresaTransporteEditado] = useState<number | null>(null);
  const [idVehiculoEditado, setIdVehiculoEditado] = useState<number | null>(null);
  const [idProveedorMineroEditado, setIdProveedorMineroEditado] = useState<number | null>(null);
  const [idTipoVehiculoEditado, setIdTipoVehiculoEditado] = useState<number | null>(null);

  const [idMotivoIngreso, setIdMotivoIngreso] = useState<number | null>(
    programacion?.visita?.id_motivo_ingreso ?? null,
  );
  const [observacion, setObservacion] = useState<string>(
    programacion?.visita?.observacion ?? programacion?.observacion ?? "",
  );

  const [guiaRemitente, setGuiaRemitente] = useState<string>(
    programacion?.guia_remitente ?? "",
  );
  const [guiaTransportista, setGuiaTransportista] = useState<string>(
    programacion?.guia_transportista ?? "",
  );

  const lockedConductor = Boolean(programacion?.id_conductor);

  useEffect(() => {
    if (opened) {
      setEvidencias([]);
      setIdEmpresaTransporteEditado(null);
      setIdVehiculoEditado(null);
      setIdProveedorMineroEditado(null);
      setIdTipoVehiculoEditado(null);
      setIdConductor(programacion?.id_conductor ?? null);
      setIdMotivoIngreso(programacion?.visita?.id_motivo_ingreso ?? null);
      setObservacion(programacion?.visita?.observacion ?? programacion?.observacion ?? "");
      setGuiaRemitente(programacion?.guia_remitente ?? "");
      setGuiaTransportista(programacion?.guia_transportista ?? "");
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
    }
  }, [programacion?.id, opened]);

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
  }, [opened]);

  useEffect(() => {
    if (programacion?.id_tipo_vehiculo) return;
    if (idVehiculoEditado == null) {
      setIdTipoVehiculoEditado(null);
      return;
    }
    const vFound = vehiculosCatalog.find((v) => v.id_vehiculo === idVehiculoEditado);
    setIdTipoVehiculoEditado(vFound?.id_tipo_vehiculo ?? null);
  }, [idVehiculoEditado, vehiculosCatalog, programacion?.id_tipo_vehiculo]);

  const handleConductorCreado = useCallback((c: RES_Conductor) => {
    setConductoresCatalog((prev) => [c, ...prev]);
    if (!programacion?.id_conductor) {
      setIdConductor(c.id_conductor);
    }
    notifySuccess(`Conductor ${c.nombre_completo} registrado`);
  }, [notifySuccess, programacion?.id_conductor]);

  const handleVehiculoCreado = useCallback((v: RES_Vehiculo) => {
    setVehiculosCatalog((prev) => [v, ...prev]);
    if (!programacion?.id_vehiculo) {
      setIdVehiculoEditado(v.id_vehiculo);
    }
    notifySuccess(`Vehículo registrado`);
  }, [notifySuccess, programacion?.id_vehiculo]);

  const handleTipoVehiculoCreado = useCallback(
    async (idTipo?: number) => {
      try {
        const tps = await AuxService.get_tipos_vehiculo();
        if (Array.isArray(tps)) {
          setTiposVehiculoCatalog(tps);
        }
        if (idTipo && !programacion?.id_tipo_vehiculo) {
          setIdTipoVehiculoEditado(idTipo);
        }
        notifySuccess(`Tipo de vehículo registrado`);
      } catch (e) {
        console.error(e);
      }
    },
    [notifySuccess, programacion?.id_tipo_vehiculo],
  );

  const handleEmpresaCreada = useCallback((nueva: EmpresaTransporteResponse) => {
    const resEmp: RES_EmpresaTransporte = {
      id_empresa_transporte: nueva.id,
      ruc: nueva.ruc,
      razon_social: nueva.razon_social,
      estado: nueva.estado,
    };
    setEmpresasCatalog((prev) => [resEmp, ...prev.filter((e) => e.id_empresa_transporte !== nueva.id)]);
    if (!programacion?.id_empresa_transporte) {
      setIdEmpresaTransporteEditado(nueva.id);
    }
    notifySuccess(`Empresa ${nueva.razon_social} registrada`);
  }, [notifySuccess, programacion?.id_empresa_transporte]);

  const handleProveedorCreado = useCallback((nuevo: ProveedorResponse) => {
    const resProv: RES_Proveedor = {
      id_proveedor: nuevo.id_proveedor,
      razon_social: nuevo.razon_social,
      direccion: nuevo.direccion,
      documento: nuevo.ruc || nuevo.dni || null,
      telefono: nuevo.telefono,
    };
    setProveedoresCatalog((prev) => [resProv, ...prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor)]);
    if (!programacion?.id_proveedor_minero) {
      setIdProveedorMineroEditado(nuevo.id_proveedor);
    }
    notifySuccess(`Proveedor ${nuevo.razon_social} registrado`);
  }, [notifySuccess, programacion?.id_proveedor_minero]);

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
      id_visitante?: number;
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
          id_visitante: datos.id_visitante,
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
    const idEmp = programacion?.id_empresa_transporte ?? idEmpresaTransporteEditado ?? null;
    const idVeh = programacion?.id_vehiculo ?? idVehiculoEditado ?? null;
    const idTip = programacion?.id_tipo_vehiculo ?? idTipoVehiculoEditado ?? null;
    const idProv = programacion?.id_proveedor_minero ?? idProveedorMineroEditado ?? null;
    const gRemitente = programacion?.guia_remitente ?? guiaRemitente ?? "";
    const gTransportista = programacion?.guia_transportista ?? guiaTransportista ?? "";

    if (idVeh && idTip != null) {
      const vFound = vehiculosCatalog.find((v) => v.id_vehiculo === idVeh);
      if (vFound && vFound.id_tipo_vehiculo !== idTip) {
        try {
          await AuxService.editar_vehiculo(idVeh, {
            id_empresa_transporte: vFound.id_empresa_transporte,
            id_tipo_vehiculo: idTip,
          });
        } catch (e) {
          console.error("No se pudo actualizar el tipo de vehículo:", e);
        }
      }
    }

    if (!idEmp) {
      notifyError("Debe seleccionar la Empresa de Transporte");
      return null;
    }
    if (!idVeh) {
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
        const updated: ProgramacionDetail = await ProgramarRecepcionService.confirmarProgramacion(programacion.id, {
          id_empresa_transporte: idEmp ?? undefined,
          id_vehiculo: idVeh ?? undefined,
          id_tipo_vehiculo: idTip ?? undefined,
          id_sucursal: idSucursal ?? undefined,
          id_conductor: idConductor ?? undefined,
          id_proveedor_minero: idProv ?? undefined,
          guia_remitente: gRemitente || undefined,
          guia_transportista: gTransportista || undefined,
          observacion: observacion || undefined,
          motivo: 'Confirmación inicial',
          evidencias: evidencias.length > 0 ? evidencias : undefined,
        });

        const updatedRecepcion: RecepcionUnidadResponse = {
          ...programacion,
          id_vehiculo: updated.id_vehiculo,
          vehiculo_placa: updated.vehiculo_placa,
          id_tipo_vehiculo: updated.id_tipo_vehiculo,
          tipo_vehiculo_nombre: updated.tipo_vehiculo_nombre,
          id_conductor: updated.id_conductor,
          conductor_nombre_completo: updated.conductor_nombre_completo,
          conductor_dni: updated.conductor_dni,
          conductor_numero_licencia: updated.conductor_numero_licencia,
          id_sucursal: updated.id_sucursal,
          fecha_hora_inicio_pesaje: updated.fecha_hora_inicio_pesaje,
          fecha_hora_final_pesaje: updated.fecha_hora_final_pesaje,
          estado: updated.estado,
          fecha_hora_ingreso: updated.fecha_hora_ingreso,
          id_empleado_registro: updated.id_empleado_registro,
          empleado_registro_nombre: updated.empleado_registro_nombre ?? "",
          empresa_transporte_razon_social: updated.empresa_transporte_razon_social,
          id_proveedor_minero: updated.id_proveedor_minero,
          proveedor_razon_social: updated.proveedor_razon_social,
          id_empleado_autoriza: updated.id_empleado_autoriza,
          empleado_autoriza_nombre: updated.empleado_autoriza_nombre,
          id_empleado_recepcion: updated.id_empleado_recepcion,
          empleado_recepcion_nombre: updated.empleado_recepcion_nombre,
          tipo_ingreso: updated.tipo_ingreso,
          id_vehiculo_carreta: updated.id_vehiculo_carreta,
          vehiculo_carreta_placa: updated.vehiculo_carreta_placa,
          evidencias: [],
          observacion: updated.observacion,
          estado_salida: updated.estado_salida,
          fecha_hora_salida: updated.fecha_hora_salida,
          observacion_salida: updated.observacion_salida,
          estado_pesaje: updated.estado_pesaje,
          es_programacion: updated.es_programacion,
          fecha_estimada_llegada: updated.fecha_estimada_llegada,
          guia_remitente: updated.guia_remitente,
          guia_transportista: updated.guia_transportista,
          documentos_programacion: (updated.documentos_programacion as IDocumentoProgramacion | null) ?? programacion.documentos_programacion ?? null,
          es_recepcion_ficticia: updated.es_recepcion_ficticia,
          visita: updated.visita as RecepcionUnidadResponse["visita"],
        };

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
        setEvidencias([]);
        return { visita, updatedRecepcion };
      } else {
        // MODO 2: Registro Directo de Recepción (No Programada)
        const vehiculoSel = vehiculosCatalog.find((v) => v.id_vehiculo === idVeh);
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
          id_vehiculo: idVeh,
          placa: placa || undefined,
          id_empresa_transporte: idEmp,
          id_tipo_vehiculo: idTip || undefined,
          id_conductor: idConductor,
          id_proveedor_minero: idProv || undefined,
          id_sucursal: sucursalTarget,
          tipo_ingreso: TipoIngreso.RecepcionMineral,
          guia_remitente: gRemitente || undefined,
          guia_transportista: gTransportista || undefined,
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
        setEvidencias([]);
        return { updatedRecepcion: created };
      }
    } catch (e) {
      console.error(e);
      const axiosLike = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const backendMsg = axiosLike?.response?.data?.message;
      const fallback =
        e instanceof Error && e.message
          ? e.message
          : "Error al procesar la recepción de unidad";
      notifyError(backendMsg || fallback);
      return null;
    } finally {
      setLoadingConfirmar(false);
    }
  };

  return {
    programacion,
    motivos,
    loadingMotivos,
    empresasCatalog,
    vehiculosCatalog,
    conductoresCatalog,
    proveedoresCatalog,
    loadingCatalogos,
    tiposVehiculoCatalog,
    idSucursal,
    setIdSucursal,
    idConductor,
    setIdConductor,
    lockedConductor,
    idEmpresaTransporteEditado,
    setIdEmpresaTransporteEditado,
    idVehiculoEditado,
    setIdVehiculoEditado,
    idProveedorMineroEditado,
    setIdProveedorMineroEditado,
    idTipoVehiculoEditado,
    setIdTipoVehiculoEditado,
    idMotivoIngreso,
    setIdMotivoIngreso,
    observacion,
    setObservacion,
    guiaRemitente,
    setGuiaRemitente,
    guiaTransportista,
    setGuiaTransportista,
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
