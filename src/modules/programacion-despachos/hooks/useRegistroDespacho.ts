import { useCallback, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { CrearDespachoRequest } from "../service/programacion-despachos.requests";
import type { DespachoDetalle } from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

interface ItemForm {
  uid: number;
  id_lote_mineral: number | null;
  id_blending: number | null;
  peso_tomado: number;
}

const initialItems = (): ItemForm[] => [];

export const useRegistroDespacho = (
  onSuccess: (despacho: DespachoDetalle) => void,
) => {
  const { notifySuccess, notifyError } = useNotify();
  const [idPlantaDestino, setIdPlantaDestino] = useState<number | null>(null);
  const [items, setItems] = useState<ItemForm[]>(initialItems());
  const [loading, setLoading] = useState(false);

  const agregarItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { uid: Date.now() + Math.random(), id_lote_mineral: null, id_blending: null, peso_tomado: 0 },
    ]);
  }, []);

  const eliminarItem = useCallback((uid: number) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  }, []);

  const actualizarItem = useCallback(
    (uid: number, patch: Partial<Omit<ItemForm, "uid">>) => {
      setItems((prev) =>
        prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setIdPlantaDestino(null);
    setItems([]);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (loading) {
      return false;
    }

    if (!idPlantaDestino) {
      notifyError("Debe seleccionar la planta de destino.");
      return false;
    }

    if (items.length === 0) {
      notifyError("Debe agregar al menos un item al despacho.");
      return false;
    }

    const payloadDetalles = items
      .filter((it) => (it.id_lote_mineral ?? null) || (it.id_blending ?? null))
      .map((it) => ({
        id_lote_mineral: it.id_lote_mineral,
        id_blending: it.id_blending,
        peso_tomado: it.peso_tomado,
      }));

    if (payloadDetalles.length === 0) {
      notifyError("Cada item debe tener un lote o blending asignado.");
      return false;
    }

    const payload: CrearDespachoRequest = {
      id_planta_destino: idPlantaDestino,
      detalles: payloadDetalles,
    };

    setLoading(true);
    try {
      const nuevo = await ProgramacionDespachosService.crearDespacho(payload);
      notifySuccess("Despacho registrado correctamente");
      onSuccess(nuevo);
      reset();
      return true;
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar el despacho");
      return false;
    } finally {
      setLoading(false);
    }
  }, [idPlantaDestino, items, notifyError, notifySuccess, onSuccess, reset]);

  return {
    idPlantaDestino,
    setIdPlantaDestino,
    items,
    agregarItem,
    eliminarItem,
    actualizarItem,
    submit,
    reset,
    loading,
  };
};