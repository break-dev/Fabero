import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import {
  Loader,
  Select,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  NumberInput,
  Stack,
  Text,
  Grid,
  Divider,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconTruckDelivery,
  IconBox,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useNotify } from "../../../../hooks/useNotify";
import { useRegistroDespacho } from "../../hooks/useRegistroDespacho";
import { ProgramacionDespachosService } from "../../service/programacion-despachos.service";
import type {
  DespachoDetalle,
  ItemDisponibleDespacho,
} from "../../service/programacion-despachos.responses";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: (nuevo: DespachoDetalle) => void;
  plantas: Array<{ id: number; ruc: string; razon_social: string }>;
  loadingPlantas: boolean;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
  label: "text-zinc-300 mb-1 font-medium text-xs",
};

export const RegistroDespachoModal = ({
  opened,
  onClose,
  onSuccess,
  plantas,
  loadingPlantas,
}: Props) => {
  const ctrl = useRegistroDespacho((nuevo) => {
    onSuccess(nuevo);
    onClose();
  });
  const { notifyError } = useNotify();

  const [items, setItems] = useState<ItemDisponibleDespacho[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!opened) {
      ctrl.reset();
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoadingItems(true);
    ProgramacionDespachosService.getItemsDisponibles()
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar los items disponibles");
      })
      .finally(() => {
        if (!cancelled) setLoadingItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opened]);

  const plantasData = plantas.map((p) => ({
    value: String(p.id),
    label: p.ruc ? `${p.razon_social} (${p.ruc})` : p.razon_social,
  }));

  const itemsData = items.map((it) => {
    const value = it.id_lote_mineral
      ? `LOTE-${it.id_lote_mineral}`
      : `BLENDING-${it.id_blending}`;
    const label =
      it.tipo_item === "LOTE"
        ? `${it.correlativo} · Lote · ${it.proveedor_razon_social ?? "—"} · ${(it.peso_actual ?? 0).toFixed(3)} KG`
        : `${it.correlativo} · Blending · ${(it.peso_actual ?? 0).toFixed(3)} KG`;
    return { value, label };
  });

  // Dedup: excluimos del dropdown de cada fila los lotes/blendings ya elegidos
  // en OTRAS filas del mismo despacho.
  const itemsDataParaFila = (uidActual: number) => {
    const excluidos = new Set<string>();
    for (const it of ctrl.items) {
      if (it.uid === uidActual) continue;
      if (it.id_lote_mineral) excluidos.add(`LOTE-${it.id_lote_mineral}`);
      if (it.id_blending) excluidos.add(`BLENDING-${it.id_blending}`);
    }
    return itemsData.filter((opt) => !excluidos.has(opt.value));
  };

  const handleItemSelect = (uid: number, value: string | null) => {
    if (!value) {
      ctrl.actualizarItem(uid, {
        id_lote_mineral: null,
        id_blending: null,
        peso_tomado: 0,
        peso_maximo: null,
      });
      return;
    }
    const item = items.find((it) => {
      if (value.startsWith("LOTE-")) {
        return it.id_lote_mineral === Number(value.replace("LOTE-", ""));
      }
      if (value.startsWith("BLENDING-")) {
        return it.id_blending === Number(value.replace("BLENDING-", ""));
      }
      return false;
    });
    const pesoActual = item?.peso_actual ?? 0;
    if (value.startsWith("LOTE-")) {
      const id = Number(value.replace("LOTE-", ""));
      ctrl.actualizarItem(uid, {
        id_lote_mineral: id,
        id_blending: null,
        peso_tomado: pesoActual,
        peso_maximo: pesoActual,
      });
    } else if (value.startsWith("BLENDING-")) {
      const id = Number(value.replace("BLENDING-", ""));
      ctrl.actualizarItem(uid, {
        id_blending: id,
        id_lote_mineral: null,
        peso_tomado: pesoActual,
        peso_maximo: pesoActual,
      });
    }
  };

  const getItemKey = (it: { id_lote_mineral: number | null; id_blending: number | null }) =>
    it.id_lote_mineral ? `LOTE-${it.id_lote_mineral}` : it.id_blending ? `BLENDING-${it.id_blending}` : null;

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Registrar Despacho"
      size="xl"
      validateClose={ctrl.items.length > 0 || ctrl.idPlantaDestino !== null}
      closeConfirmationTitle="¿Cerrar sin guardar?"
    >
      <Stack gap="md">
        <Grid gutter="sm">
          <Grid.Col span={{ base: 12 }}>
            <Select
              label="Planta Destino"
              placeholder={loadingPlantas ? "Cargando plantas..." : "Seleccione la planta destino"}
              data={plantasData}
              value={ctrl.idPlantaDestino ? String(ctrl.idPlantaDestino) : null}
              onChange={(val) => ctrl.setIdPlantaDestino(val ? Number(val) : null)}
              leftSection={<IconTruckDelivery className="w-4 h-4 text-zinc-500" />}
              withAsterisk
              required
              searchable
              clearable
              radius="lg"
              disabled={loadingPlantas || ctrl.loading}
              rightSection={loadingPlantas ? <Loader size={16} /> : undefined}
              classNames={fieldClasses}
            />
          </Grid.Col>
        </Grid>

        <Divider
          label="Items a despachar"
          labelPosition="left"
          classNames={{ label: "text-zinc-400 text-xs uppercase tracking-wider" }}
        />

        <Text size="xs" className="text-zinc-500">
          Seleccione los lotes / blendings y asigne el peso a despachar (KG). Cada item acepta como máximo su peso actual disponible.
        </Text>

        <Stack gap="xs">
          {ctrl.items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
              Aún no hay items. Haz clic en <strong className="text-zinc-300">Agregar item</strong> para empezar.
            </div>
          ) : (
            ctrl.items.map((it) => {
              const key = getItemKey(it);
              const itemSeleccionado = items.find((opt) => {
                const optKey = opt.id_lote_mineral
                  ? `LOTE-${opt.id_lote_mineral}`
                  : `BLENDING-${opt.id_blending}`;
                return optKey === key;
              });
              const maxPeso = itemSeleccionado?.peso_actual ?? null;
              return (
                <div
                  key={it.uid}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 flex items-end gap-3"
                >
                  <Select
                    label="Item"
                    placeholder={loadingItems ? "Cargando items..." : "Seleccione"}
                    data={itemsDataParaFila(it.uid)}
                    value={key}
                    onChange={(val) => handleItemSelect(it.uid, val)}
                    leftSection={<IconBox className="w-4 h-4 text-zinc-500" />}
                    radius="lg"
                    searchable
                    clearable
                    disabled={loadingItems || ctrl.loading}
                    rightSection={loadingItems ? <Loader size={16} /> : undefined}
                    classNames={{ ...fieldClasses, root: "flex-1" }}
                  />
                  <NumberInput
                    label="Peso Tomado (KG)"
                    placeholder="0.000"
                    min={0}
                    max={maxPeso ?? undefined}
                    clampOnBlur
                    decimalScale={3}
                    fixedDecimalScale
                    hideControls
                    value={it.peso_tomado || ""}
                    error={
                      maxPeso !== null && it.peso_tomado > maxPeso
                        ? `Máx ${maxPeso.toFixed(3)} KG`
                        : undefined
                    }
                    onChange={(val) => {
                      let n = typeof val === "number" ? val : Number(val);
                      if (isNaN(n)) n = 0;
                      ctrl.actualizarItem(it.uid, { peso_tomado: n });
                    }}
                    disabled={!key || ctrl.loading}
                    radius="lg"
                    classNames={{ ...fieldClasses, root: "w-44" }}
                  />
                  <Tooltip label="Eliminar item">
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="red"
                      radius="xl"
                      size="lg"
                      disabled={ctrl.loading}
                      onClick={() => {
                        mostrarConfirmacion({
                          title: "¿Eliminar item?",
                          message: "Se quitará esta fila de la lista.",
                          onConfirm: () => ctrl.eliminarItem(it.uid),
                          tipo: "peligro",
                          confirmLabel: "Eliminar",
                        });
                      }}
                      className="bg-red-500/10! hover:bg-red-500/20! text-red-400! border-red-500/20! mb-0.5"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              );
            })
          )}
        </Stack>

        <Group justify="center">
          <Button
            leftSection={<IconPlus size={14} />}
            variant="light"
            size="xs"
            radius="lg"
            disabled={ctrl.loading || loadingItems}
            onClick={() => ctrl.agregarItem()}
            className="bg-indigo-500/10! text-indigo-400! border-indigo-500/20!"
          >
            Agregar item
          </Button>
        </Group>

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={ctrl.loading}
            radius="xl"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            Cancelar
          </Button>
          <Button
            loading={ctrl.loading}
            disabled={ctrl.loading}
            onClick={() => ctrl.submit()}
            radius="xl"
            size="sm"
            leftSection={<IconAlertTriangle size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 px-8"
          >
            Registrar Despacho
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};