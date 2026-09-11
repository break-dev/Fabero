import { useState, useEffect } from "react";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import type {
  RecepcionMineralResponse,
  RES_LoteMineral,
} from "../service/recepcion-mineral.responses";
import type { DTO_PesoInicial, DTO_PesoFinal } from "../service/recepcion-mineral.requests";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";
import type { DistribucionDetalleItem } from "../../programacion-despachos/service/programacion-despachos.responses";

export const useRecepcionMineral = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal || null;

  const [sinPesarList, setSinPesarList] = useState<RecepcionMineralResponse[]>([]);
  const [enProcesoList, setEnProcesoList] = useState<RecepcionMineralResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionMineralResponse | null>(null);

  // Loading states granulares por fila / campo / accion
  const [validatingField, setValidatingField] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [deletingLoteId, setDeletingLoteId] = useState<number | null>(null);
  const [closingProcesoId, setClosingProcesoId] = useState<number | null>(null);

  const TEMP_LOTE_CORRELATIVO = "···";

  const { notifySuccess, notifyError } = useNotify();

  const loadRecepciones = async () => {
    if (!idSucursal) {
      setSinPesarList([]);
      setEnProcesoList([]);
      return;
    }

    setLoading(true);
    try {
      // Obtenemos todas las recepciones activas en planta de esta sucursal
      const data = await RecepcionMineralService.get_recepciones_mineral(idSucursal);
      
      const sinPesar = data.filter((r) => r.estado_pesaje === "Sin Pesar");
      const enProceso = data.filter((r) => r.estado_pesaje === "En Proceso");

      setSinPesarList(sinPesar);
      setEnProcesoList(enProceso);

      // Mantener seleccionada la unidad si sigue estando en la lista de datos actualizados
      if (selectedRecepcion) {
        const found = data.find((r) => r.id === selectedRecepcion.id);
        if (found) {
          setSelectedRecepcion(found);
        } else {
          setSelectedRecepcion(null);
        }
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las recepciones de unidades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecepciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  const iniciarProceso = async (id: number) => {
    const original = sinPesarList.find((r) => r.id === id);
    if (!original) return;

    const optimista: RecepcionMineralResponse = {
      ...original,
      estado_pesaje: "En Proceso",
    };

    setSinPesarList((prev) => prev.filter((r) => r.id !== id));
    setEnProcesoList((prev) =>
      prev.some((r) => r.id === id) ? prev : [optimista, ...prev],
    );
    setSelectedRecepcion(optimista);

    try {
      const res = await RecepcionMineralService.iniciar_pesaje(id);
      notifySuccess("Proceso de pesaje iniciado correctamente");
      setEnProcesoList((prev) => prev.map((r) => (r.id === id ? res : r)));
      if (selectedRecepcion?.id === id) setSelectedRecepcion(res);
    } catch (e: unknown) {
      console.error(e);
      notifyError("No se pudo iniciar el proceso de pesaje");
      setSinPesarList((prev) =>
        prev.some((r) => r.id === id) ? prev : [original, ...prev],
      );
      setEnProcesoList((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecepcion((prev) => (prev?.id === id ? null : prev));
    }
  };

  const validarCampo = async (id: number, field: string, value: unknown) => {
    setValidatingField({ id, field });
    try {
      const res = await RecepcionMineralService.validar_campo(id, field, value);
      notifySuccess("Dato validado correctamente");

      setEnProcesoList((prev) => prev.map((r) => (r.id === id ? res : r)));
      if (selectedRecepcion?.id === id) {
        setSelectedRecepcion(res);
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al validar el dato");
    } finally {
      setValidatingField(null);
    }
  };

  const crearLote = async (
    id: number,
    condicionIngreso: CondicionIngreso,
    idEmpresa: number,
    codigoManual?: { conCodigoManual: boolean; codigoManual?: string },
  ) => {
    const tempId = -Date.now();
    const tempLote: RES_LoteMineral = {
      id: tempId,
      id_recepcion_unidad: id,
      id_empleado_registro: 0,
      id_empresa: idEmpresa,
      id_proveedor_minero: null,
      id_proveedor_minero_recepcion: null,
      id_zona_origen: null,
      correlativo: TEMP_LOTE_CORRELATIVO,
      numero_correlativo: null,
      con_codigo_manual: codigoManual?.conCodigoManual ?? false,
      numero_contacto: null,
      tipo_producto: null,
      tipo_mineral: null,
      condicion_ingreso: condicionIngreso,
      estado: "Activo",
      log_cambios: null,
      evidencias: null,
      peso_inicial: null,
      fecha_hora_peso_inicial: null,
      observacion_peso_inicial: null,
      peso_final: null,
      fecha_hora_peso_final: null,
      observacion_peso_final: null,
      peso_neto: null,
      peso_actual: null,
      id_vehiculo: null,
      vehiculo_placa: null,
      id_empresa_transporte: null,
      empresa_transporte_razon_social: null,
      id_tipo_vehiculo: null,
      tipo_vehiculo_nombre: null,
      id_conductor: null,
      conductor_nombre_completo: null,
      conductor_dni: null,
      created_at: new Date().toISOString(),
    };

    setEnProcesoList((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, lotes: [...(r.lotes || []), tempLote] }
          : r,
      ),
    );
    setSelectedRecepcion((prev) =>
      prev?.id === id
        ? { ...prev, lotes: [...(prev.lotes || []), tempLote] }
        : prev,
    );

    try {
      const nuevoLote = await RecepcionMineralService.crear_lote(id, {
        condicion_ingreso: condicionIngreso,
        id_empresa: idEmpresa,
        con_codigo_manual: codigoManual?.conCodigoManual ?? false,
        codigo_manual: codigoManual?.codigoManual,
      });
      notifySuccess("Lote generado correctamente: " + nuevoLote.correlativo);

      const replaceTemp = (lotes: RES_LoteMineral[]) =>
        lotes.map((l) => (l.id === tempId ? nuevoLote : l));
      setEnProcesoList((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, lotes: replaceTemp(r.lotes || []) } : r,
        ),
      );
      setSelectedRecepcion((prev) =>
        prev?.id === id
          ? { ...prev, lotes: replaceTemp(prev.lotes || []) }
          : prev,
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError("No se pudo generar el lote");
      const removeTemp = (lotes: RES_LoteMineral[]) =>
        lotes.filter((l) => l.id !== tempId);
      setEnProcesoList((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, lotes: removeTemp(r.lotes || []) } : r,
        ),
      );
      setSelectedRecepcion((prev) =>
        prev?.id === id
          ? { ...prev, lotes: removeTemp(prev.lotes || []) }
          : prev,
      );
    }
  };

  const eliminarLote = (recepcionId: number, loteId: number) => {
    mostrarConfirmacion({
      title: "Eliminar Lote",
      message: "¿Está seguro de que desea eliminar este lote de mineral? Se perderán todos los datos y pesajes asociados.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tipo: "peligro",
      onConfirm: async () => {
        setDeletingLoteId(loteId);
        try {
          await RecepcionMineralService.eliminar_lote(loteId);
          notifySuccess("Lote eliminado correctamente");

          setEnProcesoList((prev) =>
            prev.map((r) => {
              if (r.id === recepcionId) {
                const lotes = (r.lotes || []).filter((l) => l.id !== loteId);
                return { ...r, lotes };
              }
              return r;
            })
          );

          if (selectedRecepcion?.id === recepcionId) {
            setSelectedRecepcion((prev) => {
              if (!prev) return null;
              return { ...prev, lotes: (prev.lotes || []).filter((l) => l.id !== loteId) };
            });
          }
        } catch (e: unknown) {
          console.error(e);
          notifyError("No se pudo eliminar el lote");
        } finally {
          setDeletingLoteId(null);
        }
      },
    });
  };

  const actualizarDetalleDistribucion = (
    recepcionId: number,
    detalleActualizado: DistribucionDetalleItem,
  ) => {
    const replaceDetalle = (detalles: DistribucionDetalleItem[] | undefined) =>
      (detalles ?? []).map((d) =>
        d.id === detalleActualizado.id ? detalleActualizado : d,
      );

    setEnProcesoList((prev) =>
      prev.map((r) =>
        r.id === recepcionId
          ? { ...r, distribucion_detalles: replaceDetalle(r.distribucion_detalles) }
          : r,
      ),
    );

    if (selectedRecepcion?.id === recepcionId) {
      setSelectedRecepcion((prev) =>
        prev
          ? { ...prev, distribucion_detalles: replaceDetalle(prev.distribucion_detalles) }
          : prev,
      );
    }
  };

  const registrarPesoInicial = async (recepcionId: number, loteId: number, dto: DTO_PesoInicial) => {
    try {
      const loteActualizado = await RecepcionMineralService.registrar_peso_inicial(loteId, dto);
      notifySuccess("Peso inicial registrado correctamente");

      setEnProcesoList((prev) =>
        prev.map((r) => {
          if (r.id === recepcionId) {
            const lotes = (r.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l));
            return { ...r, lotes };
          }
          return r;
        })
      );

      if (selectedRecepcion?.id === recepcionId) {
        setSelectedRecepcion((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lotes: (prev.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l)),
          };
        });
      }
      return loteActualizado;
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al registrar el peso inicial");
      return null;
    }
  };

  const registrarPesoFinal = async (recepcionId: number, loteId: number, dto: DTO_PesoFinal) => {
    try {
      const loteActualizado = await RecepcionMineralService.registrar_peso_final(loteId, dto);
      notifySuccess("Peso final y neto registrado correctamente");

      setEnProcesoList((prev) =>
        prev.map((r) => {
          if (r.id === recepcionId) {
            const lotes = (r.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l));
            return { ...r, lotes };
          }
          return r;
        })
      );

      if (selectedRecepcion?.id === recepcionId) {
        setSelectedRecepcion((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lotes: (prev.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l)),
          };
        });
      }
      return loteActualizado;
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al registrar el peso final");
      return null;
    }
  };

  const cerrarProceso = async (id: number) => {
    const original = enProcesoList.find((r) => r.id === id);
    if (!original) return;

    setEnProcesoList((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecepcion?.id === id) setSelectedRecepcion(null);

    setClosingProcesoId(id);
    try {
      await RecepcionMineralService.cerrar_proceso(id);
      notifySuccess("Proceso de balanza cerrado correctamente");
    } catch (e: unknown) {
      console.error(e);
      setEnProcesoList((prev) =>
        prev.some((r) => r.id === id) ? prev : [original, ...prev],
      );
      const axiosError = e as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "No se pudo cerrar el proceso de balanza";
      notifyError(msg);
    } finally {
      setClosingProcesoId(null);
    }
  };

  return {
    sinPesarList,
    enProcesoList,
    loading,
    selectedRecepcion,
    setSelectedRecepcion,
    validatingField,
    deletingLoteId,
    closingProcesoId,
    loadRecepciones,
    iniciarProceso,
    validarCampo,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    actualizarDetalleDistribucion,
    cerrarProceso,
  };
};
