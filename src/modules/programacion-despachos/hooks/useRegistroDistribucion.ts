import { useCallback, useMemo, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { CrearDistribucionRequest } from "../service/programacion-despachos.requests";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
} from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

export const useRegistroDistribucion = (
  idDespacho: number,
  detallesDespacho: DespachoDetalleItem[],
  onSuccess: (result: CrearDistribucionResult) => void,
) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();

  const [form, setForm] = useState<CrearDistribucionRequest>({
    id_sucursal: 0,
    id_empresa_transporte: 0,
    id_vehiculo: 0,
    id_empresa_transporte_carreta: null,
    id_vehiculo_carreta: null,
    id_tipo_vehiculo: 0,
    id_conductor: 0,
    fecha_estimada_llegada: "",
    detalles: [],
  });

  const [loading, setLoading] = useState(false);
  const [advertencias, setAdvertencias] = useState<string[]>([]);

  const detallesIniciales = useMemo<{ id_despacho_detalle: number; peso_tomado: number }[]>(
    () =>
      detallesDespacho
        .filter((d) => d.peso_actual > 0)
        // Auto-fill: sugerimos todo el peso actual disponible para cada detalle.
        // El operador puede ajustar o desmarcar el checkbox segun necesite.
        .map((d) => ({ id_despacho_detalle: d.id, peso_tomado: d.peso_actual })),
    [detallesDespacho],
  );

  const setField = useCallback(
    <K extends keyof CrearDistribucionRequest>(
      key: K,
      value: CrearDistribucionRequest[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setDetallePeso = useCallback(
    (idDespachoDetalle: number, pesoTomado: number) => {
      setForm((prev) => ({
        ...prev,
        detalles: prev.detalles.map((d) =>
          d.id_despacho_detalle === idDespachoDetalle ? { ...d, peso_tomado: pesoTomado } : d,
        ),
      }));
    },
    [],
  );

  const inicializarDetalles = useCallback(() => {
    setForm((prev) => ({ ...prev, detalles: detallesIniciales }));
    setAdvertencias([]);
  }, [detallesIniciales]);

  const reset = useCallback(() => {
    setForm({
      id_sucursal: 0,
      id_empresa_transporte: 0,
      id_vehiculo: 0,
      id_empresa_transporte_carreta: null,
      id_vehiculo_carreta: null,
      id_tipo_vehiculo: 0,
      id_conductor: 0,
      fecha_estimada_llegada: "",
      detalles: [],
    });
    setAdvertencias([]);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form.id_sucursal) {
      notifyError("Debe seleccionar la sucursal.");
      return false;
    }
    if (!form.id_empresa_transporte) {
      notifyError("Debe seleccionar la empresa de transporte.");
      return false;
    }
    if (!form.id_vehiculo) {
      notifyError("Debe seleccionar el vehículo.");
      return false;
    }
    if (!form.id_tipo_vehiculo) {
      notifyError("Debe seleccionar el tipo de vehículo.");
      return false;
    }
    if (!form.id_conductor) {
      notifyError("Debe seleccionar el conductor.");
      return false;
    }
    if (!form.fecha_estimada_llegada || form.fecha_estimada_llegada.trim() === "") {
      notifyError("Debe indicar la fecha estimada de llegada.");
      return false;
    }
    if (!form.detalles.some((d) => d.peso_tomado > 0)) {
      notifyError("Debe asignar al menos un peso en los detalles.");
      return false;
    }

    const detallesFiltrados = form.detalles
      .filter((d) => d.peso_tomado > 0)
      .map((d) => ({
        id_despacho_detalle: d.id_despacho_detalle,
        peso_tomado: d.peso_tomado,
      }));

    const payload: CrearDistribucionRequest = {
      ...form,
      detalles: detallesFiltrados,
      fecha_estimada_llegada: form.fecha_estimada_llegada || null,
    };

    setLoading(true);
    setAdvertencias([]);
    try {
      const result = await ProgramacionDespachosService.crearDistribucion(idDespacho, payload);
      if (!result) {
        notifyError("No se pudo registrar la distribución. Verifica los datos e inténtalo de nuevo.");
        return false;
      }
      setAdvertencias(result.advertencias ?? []);
      if (result.advertencias && result.advertencias.length > 0) {
        notifyWarning("Distribución registrada con advertencias");
      } else {
        notifySuccess("Distribución registrada correctamente");
      }
      onSuccess(result);
      return true;
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar la distribución");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, idDespacho, notifyError, notifySuccess, notifyWarning, onSuccess]);

  return {
    form,
    setField,
    setDetallePeso,
    inicializarDetalles,
    reset,
    submit,
    loading,
    advertencias,
  };
};