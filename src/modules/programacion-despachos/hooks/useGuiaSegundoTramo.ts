import { useCallback, useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type {
  DTO_ActualizarGuiaSegundoTramo,
  DTO_CrearGuiaSegundoTramo,
} from "../service/programacion-despachos.requests";
import type { GuiaSegundoTramo } from "../service/programacion-despachos.responses";

const extractErrorMessage = (e: unknown, fallback: string): string => {
  const axiosErr = e as { response?: { data?: { message?: string } } };
  if (axiosErr?.response?.data?.message) {
    return axiosErr.response.data.message;
  }
  return fallback;
};

export const useGuiaSegundoTramo = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  /**
   * Obtener la guía de segundo tramo de una distribución.
   *
   * El backend debe devolver `{ data: null }` cuando la distribución aún
   * no tiene guía registrada (en lugar de 404) para que el caller distinga
   * limpiamente "no existe" de "fallo de red".
   */
  const getGuia = useCallback(
    async (idDistribucion: number): Promise<GuiaSegundoTramo | null> => {
      setLoading(true);
      try {
        return await ProgramacionDespachosService.getGuiaSegundoTramo(
          idDistribucion,
        );
      } catch (e: unknown) {
        // Si el backend responde 404 cuando no hay guía, lo tratamos como
        // "no existe" en lugar de error visible.
        const axiosErr = e as { response?: { status?: number } };
        if (axiosErr?.response?.status === 404) {
          return null;
        }
        console.error("Error al cargar guía de segundo tramo", e);
        notifyError(
          extractErrorMessage(
            e,
            "No se pudo cargar la guía de segundo tramo.",
          ),
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  const crearGuia = useCallback(
    async (
      idDistribucion: number,
      dto: DTO_CrearGuiaSegundoTramo,
    ): Promise<GuiaSegundoTramo> => {
      setSubmitting(true);
      try {
        const guia =
          await ProgramacionDespachosService.crearGuiaSegundoTramo(
            idDistribucion,
            dto,
          );
        notifySuccess("Guía de segundo tramo registrada correctamente");
        return guia;
      } catch (e: unknown) {
        console.error("Error al crear guía de segundo tramo", e);
        notifyError(
          extractErrorMessage(
            e,
            "No se pudo registrar la guía de segundo tramo.",
          ),
        );
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [notifySuccess, notifyError],
  );

  const actualizarGuia = useCallback(
    async (
      idDistribucion: number,
      idGuia: number,
      dto: DTO_ActualizarGuiaSegundoTramo,
    ): Promise<GuiaSegundoTramo> => {
      setSubmitting(true);
      try {
        const guia =
          await ProgramacionDespachosService.actualizarGuiaSegundoTramo(
            idDistribucion,
            idGuia,
            dto,
          );
        notifySuccess("Guía de segundo tramo actualizada correctamente");
        return guia;
      } catch (e: unknown) {
        console.error("Error al actualizar guía de segundo tramo", e);
        notifyError(
          extractErrorMessage(
            e,
            "No se pudo actualizar la guía de segundo tramo.",
          ),
        );
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [notifySuccess, notifyError],
  );

  const anularGuia = useCallback(
    async (idDistribucion: number, idGuia: number): Promise<void> => {
      setAnulandoId(idGuia);
      try {
        await ProgramacionDespachosService.anularGuiaSegundoTramo(
          idDistribucion,
          idGuia,
        );
        notifySuccess("Guía de segundo tramo anulada correctamente");
      } catch (e: unknown) {
        console.error("Error al anular guía de segundo tramo", e);
        notifyError(
          extractErrorMessage(
            e,
            "No se pudo anular la guía de segundo tramo.",
          ),
        );
        throw e;
      } finally {
        setAnulandoId(null);
      }
    },
    [notifySuccess, notifyError],
  );

  return {
    loading,
    submitting,
    anulandoId,
    getGuia,
    crearGuia,
    actualizarGuia,
    anularGuia,
  };
};
