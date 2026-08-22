import { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Loader,
  Badge,
  Box,
} from "@mantine/core";
import { IconFileText, IconCoins, IconCheck } from "@tabler/icons-react";
import { ElementoQuimicoValorizacion } from "../../../../shared/enums/_generic/elemento-quimico-valorizacion";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import type { REQ_ValorizacionDetalleItem } from "../../service/valorizacion-compra.requests";
import type { RES_ValorizacionCompraDetalle } from "../../service/valorizacion-compra.responses";

interface LoteDisponible {
  id_lote_guia: number;
  id_lote_mineral: number;
  numero_correlativo: number | null;
  correlativo_lote: string;
  grr: string;
  grt: string;
  fecha_en_planta: string;
  tmh: number;
  ley_humedad: number;
  tms: number;
  ley_oro: number;
  ley_plata: number;
  es_valorizado_oro?: boolean;
  es_valorizado_plata?: boolean;
  condicion_oro: {
    id_condicion_comercial: number;
    recuperacion: number;
    maquila: number;
    consumo: number;
  } | null;
  condicion_plata: {
    id_condicion_comercial: number;
    recuperacion: number;
    maquila: number;
    consumo: number;
  } | null;
}

interface ExistingDetalleItem {
  id_lote_guia: number;
  elemento_quimico: ElementoQuimicoValorizacion;
}

interface DetalleEditar {
  req: REQ_ValorizacionDetalleItem;
  display: RES_ValorizacionCompraDetalle;
  index: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  idProveedor: number | null;
  idValorizacionEdicion?: number;
  existingDetalles?: ExistingDetalleItem[];
  detalleEditar?: DetalleEditar | null;
  onAgregarLote: (
    det: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => void;
  onEditarLote?: (
    index: number,
    det: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => void;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ModalAgregarLote = ({
  opened,
  onClose,
  idProveedor,
  idValorizacionEdicion,
  existingDetalles = [],
  detalleEditar = null,
  onAgregarLote,
  onEditarLote,
}: Props) => {
  const { notifyError, notifyWarning } = useNotify();

  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotes, setLotes] = useState<LoteDisponible[]>([]);

  const [selectedLoteGuiaId, setSelectedLoteGuiaId] = useState<string | null>(null);
  const [elemento, setElemento] = useState<ElementoQuimicoValorizacion | null>(
    ElementoQuimicoValorizacion.Oro,
  );

  const [recuperacion, setRecuperacion] = useState<number | string>(0);
  const [inter, setInter] = useState<number | string>(0);
  const [desInter, setDesInter] = useState<number | string>(0);
  const [maquila, setMaquila] = useState<number | string>(0);
  const [consumo, setConsumo] = useState<number | string>(0);
  const [factor, setFactor] = useState<number | string>(1.1023);

  useEffect(() => {
    if (!opened) {
      setLotes([]);
      setSelectedLoteGuiaId(null);
      return;
    }

    if (detalleEditar) {
      setLotes([]);
      setLoadingLotes(false);
      return;
    }

    if (!idProveedor) {
      setLotes([]);
      setSelectedLoteGuiaId(null);
      return;
    }

    const cargar = async () => {
      setLoadingLotes(true);
      try {
        const data = await AuxService.get_lotes_disponibles_valorizacion(
          idProveedor,
          idValorizacionEdicion,
        );
        // Excluir lote solo si YA fue valorizado para AMBOS elementos (Oro y Plata)
        const disponibles = data.filter((l) => {
          const tieneOro =
            l.es_valorizado_oro ||
            existingDetalles.some(
              (d) =>
                d.id_lote_guia === l.id_lote_guia &&
                d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
            );
          const tienePlata =
            l.es_valorizado_plata ||
            existingDetalles.some(
              (d) =>
                d.id_lote_guia === l.id_lote_guia &&
                d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
            );
          return !(tieneOro && tienePlata);
        });
        setLotes(disponibles);
      } catch (err) {
        notifyError(
          err instanceof Error ? err.message : "Error al cargar lotes disponibles",
        );
      } finally {
        setLoadingLotes(false);
      }
    };

    cargar();
  }, [opened, idProveedor, idValorizacionEdicion, existingDetalles, detalleEditar, notifyError]);

  useEffect(() => {
    if (!detalleEditar) return;
    const { req } = detalleEditar;
    setSelectedLoteGuiaId(String(req.id_lote_guia));
    setElemento(req.elemento_quimico);
    setInter(req.inter);
    setDesInter(req.des_inter);
    setRecuperacion(req.recuperacion);
    setMaquila(req.maquila);
    setConsumo(req.consumo);
    setFactor(req.factor ?? 1.1023);
  }, [detalleEditar]);

  const loteEnEdicion = useMemo<LoteDisponible | null>(() => {
    if (!detalleEditar) return null;
    const { display, req } = detalleEditar;
    const esOro = display.elemento_quimico === ElementoQuimicoValorizacion.Oro;
    const condicion = req.id_condicion_comercial
      ? {
          id_condicion_comercial: req.id_condicion_comercial,
          recuperacion: display.recuperacion,
          maquila: display.maquila,
          consumo: display.consumo,
        }
      : null;
    return {
      id_lote_guia: display.id_lote_guia,
      id_lote_mineral: 0,
      numero_correlativo: display.numero_correlativo ?? null,
      correlativo_lote: display.lote_correlativo || "",
      grr: display.grr || "",
      grt: display.grt || "",
      fecha_en_planta: display.fecha_ingreso || "",
      tmh: display.tmh,
      ley_humedad: display.ley_humedad,
      tms: display.tms,
      ley_oro: esOro ? display.ley : 0,
      ley_plata: !esOro ? display.ley : 0,
      condicion_oro: esOro ? condicion : null,
      condicion_plata: !esOro ? condicion : null,
    };
  }, [detalleEditar]);

  const loteSeleccionado = useMemo(() => {
    if (loteEnEdicion) return loteEnEdicion;
    if (!selectedLoteGuiaId) return null;
    return lotes.find((l) => String(l.id_lote_guia) === selectedLoteGuiaId) || null;
  }, [selectedLoteGuiaId, lotes, loteEnEdicion]);

  // Opciones de elemento dinámicas según lo que ya se haya valorizado para el lote seleccionado
  const opcionesElementos = useMemo(() => {
    if (detalleEditar) {
      const label =
        detalleEditar.display.elemento_quimico === ElementoQuimicoValorizacion.Oro
          ? "Oro (Au)"
          : "Plata (Ag)";
      return [{ value: detalleEditar.display.elemento_quimico, label }];
    }

    if (!loteSeleccionado) {
      return [
        { value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" },
        { value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" },
      ];
    }

    const tieneOro =
      Boolean(loteSeleccionado.es_valorizado_oro) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
      );
    const tienePlata =
      Boolean(loteSeleccionado.es_valorizado_plata) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
      );

    const list = [];
    if (!tieneOro) {
      list.push({ value: ElementoQuimicoValorizacion.Oro, label: "Oro (Au)" });
    }
    if (!tienePlata) {
      list.push({ value: ElementoQuimicoValorizacion.Plata, label: "Plata (Ag)" });
    }
    return list;
  }, [loteSeleccionado, existingDetalles, detalleEditar]);

  // Ajustar automáticamente el elemento seleccionado si ya tiene uno de los dos
  useEffect(() => {
    if (detalleEditar) return;
    if (!loteSeleccionado) return;

    const tieneOro =
      Boolean(loteSeleccionado.es_valorizado_oro) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Oro,
      );
    const tienePlata =
      Boolean(loteSeleccionado.es_valorizado_plata) ||
      existingDetalles.some(
        (d) =>
          d.id_lote_guia === loteSeleccionado.id_lote_guia &&
          d.elemento_quimico === ElementoQuimicoValorizacion.Plata,
      );

    if (tieneOro && !tienePlata) {
      setElemento(ElementoQuimicoValorizacion.Plata);
    } else if (tienePlata && !tieneOro) {
      setElemento(ElementoQuimicoValorizacion.Oro);
    } else if (
      !elemento ||
      (elemento === ElementoQuimicoValorizacion.Oro && tieneOro) ||
      (elemento === ElementoQuimicoValorizacion.Plata && tienePlata)
    ) {
      if (!tieneOro) setElemento(ElementoQuimicoValorizacion.Oro);
      else if (!tienePlata) setElemento(ElementoQuimicoValorizacion.Plata);
    }
  }, [loteSeleccionado, existingDetalles, elemento, detalleEditar]);

  // Precargar condiciones comerciales al cambiar lote o elemento
  useEffect(() => {
    if (detalleEditar) return;
    if (!loteSeleccionado || !elemento) {
      setRecuperacion(0);
      setMaquila(0);
      setConsumo(0);
      return;
    }

    const cond =
      elemento === ElementoQuimicoValorizacion.Oro
        ? loteSeleccionado.condicion_oro
        : loteSeleccionado.condicion_plata;

    if (cond) {
      setRecuperacion(cond.recuperacion);
      setMaquila(cond.maquila);
      setConsumo(cond.consumo);
    } else {
      setRecuperacion(0);
      setMaquila(0);
      setConsumo(0);
    }
  }, [loteSeleccionado, elemento, detalleEditar]);

  const ley = useMemo(() => {
    if (!loteSeleccionado || !elemento) return 0;
    return elemento === ElementoQuimicoValorizacion.Oro
      ? loteSeleccionado.ley_oro
      : loteSeleccionado.ley_plata;
  }, [loteSeleccionado, elemento]);

  const ptn = useMemo(() => {
    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numRea = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;

    const res = ((numInter - numDes) * ley * (numRec / 100) - numMaq - numRea) * numFac;
    return res;
  }, [inter, desInter, ley, recuperacion, maquila, consumo, factor]);

  const totalItem = useMemo(() => {
    if (!loteSeleccionado) return 0;
    const tms = loteSeleccionado.tms;
    return (ptn * tms) / 1000;
  }, [ptn, loteSeleccionado]);

  const handleAgregar = () => {
    if (!loteSeleccionado) {
      notifyWarning("Debe seleccionar un lote");
      return;
    }
    if (!elemento) {
      notifyWarning("Debe seleccionar un elemento químico");
      return;
    }

    const numRec = typeof recuperacion === "number" ? recuperacion : parseFloat(String(recuperacion)) || 0;
    const numInter = typeof inter === "number" ? inter : parseFloat(String(inter)) || 0;
    const numDes = typeof desInter === "number" ? desInter : parseFloat(String(desInter)) || 0;
    const numMaq = typeof maquila === "number" ? maquila : parseFloat(String(maquila)) || 0;
    const numRea = typeof consumo === "number" ? consumo : parseFloat(String(consumo)) || 0;
    const numFac = typeof factor === "number" ? factor : parseFloat(String(factor)) || 1.1023;

    const cond =
      elemento === ElementoQuimicoValorizacion.Oro
        ? loteSeleccionado.condicion_oro
        : loteSeleccionado.condicion_plata;

    const reqItem: REQ_ValorizacionDetalleItem = {
      id_lote_guia: loteSeleccionado.id_lote_guia,
      elemento_quimico: elemento,
      id_condicion_comercial: cond ? cond.id_condicion_comercial : null,
      inter: numInter,
      des_inter: numDes,
      recuperacion: numRec,
      maquila: numMaq,
      consumo: numRea,
      factor: numFac,
    };

    const displayItem: RES_ValorizacionCompraDetalle = {
      id: detalleEditar ? detalleEditar.display.id : 0,
      id_valorizacion_compra: detalleEditar ? detalleEditar.display.id_valorizacion_compra : 0,
      id_lote_guia: loteSeleccionado.id_lote_guia,
      id_condicion_comercial: cond ? cond.id_condicion_comercial : null,
      elemento_quimico: elemento,
      numero_correlativo: loteSeleccionado.numero_correlativo,
      lote_correlativo: loteSeleccionado.correlativo_lote,
      grr: loteSeleccionado.grr,
      grt: loteSeleccionado.grt,
      fecha_ingreso: loteSeleccionado.fecha_en_planta,
      tmh: loteSeleccionado.tmh,
      ley_humedad: loteSeleccionado.ley_humedad,
      tms: loteSeleccionado.tms,
      ley,
      inter: numInter,
      des_inter: numDes,
      recuperacion: numRec,
      maquila: numMaq,
      consumo: numRea,
      factor: numFac,
      precio_por_tonelada: Number(ptn.toFixed(2)),
      subtotal: Number(totalItem.toFixed(2)),
    };

    if (detalleEditar) {
      onEditarLote?.(detalleEditar.index, reqItem, displayItem);
    } else {
      onAgregarLote(reqItem, displayItem);
    }

    // reset campos y cerrar
    setSelectedLoteGuiaId(null);
    setInter(0);
    setDesInter(0);
    setFactor(1.1023);
    onClose();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={detalleEditar ? "Editar Condiciones del Lote" : "Agregar Lote a Valorización"}
      size="lg"
    >
      <Stack gap="sm" mt="xs">
        {/* Selección de Lote y Elemento */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <Select
              label="Lote Disponible:"
              placeholder={loadingLotes ? "Cargando..." : "[Seleccione Lote]"}
              disabled={loadingLotes || !!detalleEditar}
              rightSection={loadingLotes ? <Loader size={16} /> : undefined}
              data={
                detalleEditar
                  ? [
                      {
                        value: String(detalleEditar.display.id_lote_guia),
                        label:
                          detalleEditar.display.lote_correlativo ||
                          "-",
                      },
                    ]
                  : lotes.map((l) => ({
                      value: String(l.id_lote_guia),
                      label: l.correlativo_lote,
                    }))
              }
              value={selectedLoteGuiaId}
              onChange={(val) => setSelectedLoteGuiaId(val)}
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Elemento:"
              placeholder="[Seleccione]"
              disabled={!!detalleEditar}
              data={opcionesElementos}
              value={elemento}
              onChange={(val) => setElemento(val as ElementoQuimicoValorizacion)}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
            />
          </Grid.Col>
        </Grid>

        {/* Card de Información del Lote Seleccionado (Sin Inputs Deshabilitados) */}
        {loteSeleccionado ? (
          <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80 space-y-2">
            <Group justify="space-between" align="center">
              <Group gap={6}>
                <IconFileText size={16} className="text-amber-400" />
                <Text fw={700} fz="xs" c="white">
                  Lote: {loteSeleccionado.correlativo_lote}
                </Text>
              </Group>
              <Group gap={6}>
                <Badge variant="outline" color="blue" size="xs">
                  G.R.R: {loteSeleccionado.grr || "-"}
                </Badge>
                <Badge variant="outline" color="indigo" size="xs">
                  G.R.T: {loteSeleccionado.grt || "-"}
                </Badge>
                <Badge variant="filled" color="dark" size="xs">
                  {loteSeleccionado.fecha_en_planta ? loteSeleccionado.fecha_en_planta.split(" ")[0] : "-"}
                </Badge>
              </Group>
            </Group>

            <Grid gutter="xs" pt={4}>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMH (t)
                  </Text>
                  <Text fz="xs" fw={700} c="cyan.3">
                    {(loteSeleccionado.tmh / 1000).toFixed(3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    % H2O
                  </Text>
                  <Text fz="xs" fw={700} c="amber.3">
                    {loteSeleccionado.ley_humedad.toFixed(2)}%
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    TMS (t)
                  </Text>
                  <Text fz="xs" fw={700} c="emerald.3">
                    {(loteSeleccionado.tms / 1000).toFixed(3)}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box p="xs" bg="#27272a" className="rounded-lg text-center border border-zinc-800">
                  <Text fz={10} c="zinc.4" tt="uppercase" fw={600}>
                    Ley ({elemento})
                  </Text>
                  <Text fz="xs" fw={700} c="yellow.3">
                    {ley.toFixed(4)} oz/tc
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>
        ) : (
          <Box p="sm" bg="#18181b" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5">
              Seleccione un lote para visualizar su información y balances.
            </Text>
          </Box>
        )}

        {/* Inputs de Condiciones de Valorización */}
        <Paper p="sm" radius="md" bg="#18181b" className="border border-zinc-800/80">
          <Text fw={600} fz="xs" c="amber.4" mb="xs" className="flex items-center gap-1.5">
            <IconCoins size={14} /> Condiciones Comerciales y Valorización
          </Text>
          
          <Grid gutter="xs">
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="INTER ($/oz):"
                value={inter}
                onChange={(val) => setInter(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="DES. INTER ($/oz):"
                value={desInter}
                onChange={(val) => setDesInter(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="RECUPERACIÓN (%):"
                value={recuperacion}
                onChange={(val) => setRecuperacion(val ?? 0)}
                min={0}
                max={100}
                decimalScale={2}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="MAQUILA ($/tc):"
                value={maquila}
                onChange={(val) => setMaquila(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="REACT ($/tc):"
                value={consumo}
                onChange={(val) => setConsumo(val ?? 0)}
                min={0}
                decimalScale={2}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 4 }}>
              <NumberInput
                label="FACTOR:"
                value={factor}
                onChange={(val) => setFactor(val ?? 1.1023)}
                min={0}
                step={0.0001}
                decimalScale={4}
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Resumen Final Resultante */}
        <Paper p="xs" radius="md" bg="#14532d/20" className="border border-emerald-800/60">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                Precio * Tonelada:
              </Text>
              <Text fz="sm" fw={700} c="white">
                $ {ptn.toFixed(2)} / TN
              </Text>
            </Stack>

            <Stack gap={2} align="end">
              <Text fz={11} c="emerald.4" fw={600} tt="uppercase">
                Subtotal Lote:
              </Text>
              <Text fz="md" fw={800} c="emerald.3">
                $ {totalItem.toFixed(2)}
              </Text>
            </Stack>
          </Group>
        </Paper>

        {/* Acciones */}
        <Group justify="end" gap="xs" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose} radius="lg" size="xs">
            Cancelar
          </Button>
          <Button
            color="indigo"
            onClick={handleAgregar}
            radius="lg"
            size="xs"
            leftSection={<IconCheck size={16} />}
            disabled={!loteSeleccionado}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {detalleEditar ? "Guardar Cambios" : "Agregar Lote"}
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
