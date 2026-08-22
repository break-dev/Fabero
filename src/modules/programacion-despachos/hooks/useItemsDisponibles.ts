import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { ItemDisponibleDespacho } from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";

export const useItemsDisponibles = () => {
  const [items, setItems] = useState<ItemDisponibleDespacho[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useNotify();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProgramacionDespachosService.getItemsDisponibles();
      setItems(data);
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los items disponibles para despacho");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refrescar: fetchItems };
};