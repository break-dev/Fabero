import { useCallback, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type {
  DespachoDetalle,
  DistribucionItem,
} from "../service/programacion-despachos.responses";
import { EstadoDistribucion } from "../../../shared/enums/programacion-despachos/estado-distribucion";
import { useNotify } from "../../../hooks/useNotify";

export const useDistribucionActions = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

  const setLoading = (id: number, on: boolean) =>
    setTogglingIds((prev) => ({ ...prev, [id]: on }));

  const actualizarDistribucionEnDespacho = (
    despacho: DespachoDetalle | null,
    distribucionActualizada: DistribucionItem,
  ): DespachoDetalle | null => {
    if (!despacho) return despacho;
    return {
      ...despacho,
      distribuciones: despacho.distribuciones.map((d) =>
        d.id === distribucionActualizada.id
          ? {
              ...d,
              estado: distribucionActualizada.estado,
              log_cambios: distribucionActualizada.log_cambios ?? d.log_cambios,
              id_recepcion_unidad:
                distribucionActualizada.id_recepcion_unidad ?? d.id_recepcion_unidad,
              recepcion_estado:
                distribucionActualizada.recepcion_estado ?? d.recepcion_estado,
              recepcion_estado_salida:
                distribucionActualizada.recepcion_estado_salida ?? d.recepcion_estado_salida,
              recepcion_fecha_hora_ingreso:
                distribucionActualizada.recepcion_fecha_hora_ingreso ??
                d.recepcion_fecha_hora_ingreso,
              recepcion_fecha_hora_salida:
                distribucionActualizada.recepcion_fecha_hora_salida ??
                d.recepcion_fecha_hora_salida,
            }
          : d,
      ),
    };
  };

  const confirmar = useCallback(
    async (
      distribucion: DistribucionItem,
      onLocalUpdate: (despacho: DespachoDetalle | null) => void,
    ) => {
      setLoading(distribucion.id, true);
      try {
        const actualizada = await ProgramacionDespachosService.confirmarDistribucion(distribucion.id);
        onLocalUpdate(actualizada as unknown as DespachoDetalle);
        notifySuccess("Distribución confirmada");
      } catch (e) {
        console.error(e);
        notifyError("Error al confirmar la distribución");
      } finally {
        setLoading(distribucion.id, false);
      }
    },
    [notifyError, notifySuccess],
  );

  const registrarSalida = useCallback(
    async (
      distribucion: DistribucionItem,
      observacion: string | undefined,
      onLocalUpdate: (despacho: DespachoDetalle | null) => void,
    ) => {
      setLoading(distribucion.id, true);
      try {
        const actualizada = await ProgramacionDespachosService.registrarSalida(distribucion.id, {
          observacion,
        });
        onLocalUpdate(actualizada as unknown as DespachoDetalle);
        notifySuccess("Salida de planta registrada");
      } catch (e) {
        console.error(e);
        notifyError("Error al registrar la salida");
      } finally {
        setLoading(distribucion.id, false);
      }
    },
    [notifyError, notifySuccess],
  );

  const registrarLlegada = useCallback(
    async (
      distribucion: DistribucionItem,
      onLocalUpdate: (despacho: DespachoDetalle | null) => void,
    ) => {
      setLoading(distribucion.id, true);
      try {
        const actualizada = await ProgramacionDespachosService.registrarLlegada(distribucion.id);
        onLocalUpdate(actualizada as unknown as DespachoDetalle);
        notifySuccess("Llegada al cliente registrada");
      } catch (e) {
        console.error(e);
        notifyError("Error al registrar la llegada");
      } finally {
        setLoading(distribucion.id, false);
      }
    },
    [notifyError, notifySuccess],
  );

  const anularDespacho = useCallback(
    async (
      id: number,
      onLocalUpdate: (despacho: DespachoDetalle) => void,
    ) => {
      setLoading(id, true);
      try {
        const actualizado = await ProgramacionDespachosService.anularDespacho(id);
        onLocalUpdate(actualizado);
        notifySuccess("Despacho anulado");
      } catch (e) {
        console.error(e);
        notifyError("Error al anular el despacho");
      } finally {
        setLoading(id, false);
      }
    },
    [notifyError, notifySuccess],
  );

  return {
    togglingIds,
    confirmar,
    registrarSalida,
    registrarLlegada,
    anularDespacho,
    actualizarDistribucionEnDespacho,
    ESTADOS: EstadoDistribucion,
  };
};