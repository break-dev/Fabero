import { useState, useEffect } from "react";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import type { RecepcionMineralResponse } from "../service/recepcion-mineral.responses";
import type { DTO_PesoInicial, DTO_PesoFinal } from "../service/recepcion-mineral.requests";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

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
  const [creatingLoteId, setCreatingLoteId] = useState<number | null>(null);
  const [deletingLoteId, setDeletingLoteId] = useState<number | null>(null);
  const [closingProcesoId, setClosingProcesoId] = useState<number | null>(null);

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
    try {
      const res = await RecepcionMineralService.iniciar_pesaje(id);
      notifySuccess("Proceso de pesaje iniciado correctamente");
      await loadRecepciones();
      
      // Auto-seleccionar la unidad ahora en la vista de procesos activos
      const updated = enProcesoList.find((r) => r.id === id) || res;
      setSelectedRecepcion(updated);
    } catch (e: unknown) {
      console.error(e);
      notifyError("No se pudo iniciar el proceso de pesaje");
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

  const crearLote = async (id: number, condicionIngreso: CondicionIngreso, idEmpresa: number) => {
    setCreatingLoteId(id);
    try {
      const nuevoLote = await RecepcionMineralService.crear_lote(id, condicionIngreso, idEmpresa);
      notifySuccess("Lote generado correctamente: " + nuevoLote.correlativo);

      setEnProcesoList((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const lotes = [...(r.lotes || []), nuevoLote];
            return { ...r, lotes };
          }
          return r;
        })
      );

      if (selectedRecepcion?.id === id) {
        setSelectedRecepcion((prev) => {
          if (!prev) return null;
          return { ...prev, lotes: [...(prev.lotes || []), nuevoLote] };
        });
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError("No se pudo generar el lote");
    } finally {
      setCreatingLoteId(null);
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
    setClosingProcesoId(id);
    try {
      await RecepcionMineralService.cerrar_proceso(id);
      notifySuccess("Proceso de balanza cerrado correctamente");
      setSelectedRecepcion(null);
      await loadRecepciones();
    } catch (e: unknown) {
      console.error(e);
      const axiosError = e as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "No se pudo cerrar el proceso de balanza";
      notifyError(msg);
    } finally {
      setClosingProcesoId(null);
    }
  };

  const crearUnidadFicticia = async (fechaHoraIngreso?: string | null) => {
    if (!idSucursal) {
      notifyError("Debe seleccionar una sucursal en el encabezado");
      return;
    }
    try {
      const ficticia = await RecepcionMineralService.crear_unidad_ficticia(
        idSucursal,
        fechaHoraIngreso
      );
      notifySuccess("Unidad ficticia creada correctamente");
      await loadRecepciones();
      setSelectedRecepcion(ficticia);
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al crear la unidad ficticia");
    }
  };

  return {
    sinPesarList,
    enProcesoList,
    loading,
    selectedRecepcion,
    setSelectedRecepcion,
    validatingField,
    creatingLoteId,
    deletingLoteId,
    closingProcesoId,
    loadRecepciones,
    iniciarProceso,
    validarCampo,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    cerrarProceso,
    crearUnidadFicticia,
  };
};
