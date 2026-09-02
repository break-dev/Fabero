import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconPrinter,
  IconSearch,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { DateRangeFilter } from "../../../presentation/utils/filtro-rango-fechas";
import { ModalValidacion } from "../../../presentation/utils/modal-validacion";
import { useLotesPendientes } from "../hooks/useLotesPendientes";
import { normalizeParticion } from "../hooks/useParticionesLote";
import { ParticionesExpandible } from "./components/ParticionesExpandible";
import { formatTn, formatDateTime } from "./utils/format-units";
import { etiquetaCampoFaltante, evaluarLote } from "./utils/evaluador-validacion";
import { useParticionesLoteStore } from "../../../stores/particiones-lote.store";
import type { RES_LotePendiente } from "../service/validacion-distribucion.responses";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import type { DTO_CrearParticion } from "../service/validacion-distribucion.requests";
import { TicketBalanzaPdf } from "../../../presentation/utils/ticket-balanza-pdf";
import { useUIStore } from "../../../stores/ui.store";
import { RefreshButton } from "../../../presentation/utils/refresh-button";

type Row = RES_LotePendiente;
type EstadoParticion = "TODOS" | "CON" | "SIN";

export const ValidacionDistribucionPage = () => {
  useTitlePage("Validación y Distribución", true);

  const {
    records,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetFilters,
    updateRecord,
    validarLote,
    validarLotes,
    validatingIds,
    validatingAll,
    cargar,
  } = useLotesPendientes();
  const { notifyError, notifySuccess } = useNotify();
  const { print, prepare } = usePrint();
  const [creatingParticionId, setCreatingParticionId] = useState<number | null>(
    null
  );
  const [printingLoteId, setPrintingLoteId] = useState<number | null>(null);

  // Control imperativo de la fila expandida. Permite auto-expand al crear
  // particiones y elimina la dependencia del forwardRef del sub-componente.
  const [expandedLoteId, setExpandedLoteId] = useState<number | null>(null);

  // Suscripcion al cache de particiones. Re-render cuando los lotes visibles
  // se hidratan (prefetch) o cambian. Permite que los checkboxes se habiliten
  // apenas el cache este listo y refleja autoguardados del usuario.
  const cacheKeys = useParticionesLoteStore((s) => s.byLote);

  const [placa, setPlaca] = useState("");
  const [soloExcedente, setSoloExcedente] = useState(false);
  const [estadoParticion, setEstadoParticion] = useState<EstadoParticion>("TODOS");

  // Selección múltiple de lotes para validación masiva.
  const [selectedLotes, setSelectedLotes] = useState<RES_LotePendiente[]>([]);

  // Flag para evitar que el handler del boton Validar lote se dispare dos
  // veces mientras se hace el fetch del evaluador.
  const [fetchingEvalLoteId, setFetchingEvalLoteId] = useState<number | null>(
    null
  );

  // Modal de validacion: lote individual o multiple.
  const [modalValidacion, setModalValidacion] = useState<{
    open: boolean;
    modo: "confirmar" | "pendientes";
    titulo: string;
    subtitulo?: React.ReactNode;
    pendientesTextoLibre?: string;
    pendientes?: { titulo: string; campos_faltantes: string[] }[];
    context:
      | { tipo: "lote"; idLote: number }
      | { tipo: "multiple"; idLotes: number[] }
      | null;
  }>({
    open: false,
    modo: "confirmar",
    titulo: "",
    context: null,
  });

  // Determina si un lote puede seleccionarse para validación múltiple.
  // Requiere que el cache de particiones este hidratado y que el lote cumpla requisitos.
  // Se recrea cuando cambia `cacheKeys` (cache se hidrata tras prefetch o
  // cambia por autoguardado), para que la disponibilidad del checkbox se actualice.
  const puedeSeleccionarLote = useMemo(() => {
    return (r: Row): boolean => {
      if (r.lote_esta_validado === true) return false;
      const cached = useParticionesLoteStore.getState().getCached(r.id_lote_mineral);
      // Cache no hidratado todavía: deshabilitado hasta que llegue el fetch.
      if (!cached || !cached.data) return false;
      // Delegar al evaluador: un lote con 0 particiones activas es
      // trivialmente valido (no hay requisitos que cumplir).
      return evaluarLote(cached.data, r.lote_peso_neto).cumple;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKeys]);

  // Sincroniza la seleccion cuando el cache cambia: si un lote seleccionado
  // deja de cumplir (por edicion), se quita de la seleccion.
  useEffect(() => {
    if (selectedLotes.length === 0) return;
    setSelectedLotes((prev) => {
      const siguiente = prev.filter((r) => puedeSeleccionarLote(r));
      return siguiente.length === prev.length ? prev : siguiente;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKeys]);

  const recordsFiltrados = useMemo(() => {
    return records.filter((r) => {
      if (placa && !r.vehiculo_placa.toUpperCase().includes(placa.toUpperCase())) {
        return false;
      }
      if (soloExcedente && !(r.excedente != null && r.excedente > 0)) {
        return false;
      }
      if (estadoParticion === "CON" && r.tiene_particion !== 1) {
        return false;
      }
      if (estadoParticion === "SIN" && r.tiene_particion !== 0) {
        return false;
      }
      return true;
    });
  }, [records, placa, soloExcedente, estadoParticion]);

  const hasActiveFilters =
    !!fechaInicio ||
    !!fechaFin ||
    !!placa ||
    soloExcedente ||
    estadoParticion !== "TODOS";

  const handleLimpiar = () => {
    resetFilters();
    setPlaca("");
    setSoloExcedente(false);
    setEstadoParticion("TODOS");
  };

  const closeModalValidacion = () => {
    setModalValidacion({
      open: false,
      modo: "confirmar",
      titulo: "",
      context: null,
    });
  };

  // Click en boton "Validar" de un lote (nivel fila).
  // La evaluacion detallada del lote se hara via cache cuando el usuario
  // expanda el row; aqui solo pedimos la evaluacion al backend cuando
  // expandida, o derivamos de particiones en cache.
  const handleClickValidarLote = async (r: Row) => {
    if (r.lote_esta_validado) return;
    // Evita que un doble click rapido dispare dos fetches y abra dos modales.
    if (fetchingEvalLoteId !== null) return;
    setFetchingEvalLoteId(r.id_lote_mineral);
    try {
      const evalLote = await ValidacionDistribucionService.getEvaluacionValidacionLote(
        r.id_lote_mineral
      );
      if (evalLote.lote_cumple) {
        setModalValidacion({
          open: true,
          modo: "confirmar",
          titulo: "Validar lote",
          subtitulo: (
            <>
              Se marcará el lote <b>{r.lote_correlativo}</b> y todas sus
              particiones activas como validados. Esta acción no se puede
              revertir desde este módulo.
            </>
          ),
          context: { tipo: "lote", idLote: r.id_lote_mineral },
        });
      } else {
        // Deriva razones desde la evaluacion para mostrar modal bloqueante.
        const items: { titulo: string; campos_faltantes: string[] }[] = [];
        if (!evalLote.cumple_suma) {
          items.push({
            titulo: "Suma de pesos netos del lote",
            campos_faltantes: [
              `Suma particiones = ${evalLote.suma_pesos_netos.toFixed(
                2
              )} · Lote padre = ${evalLote.peso_neto_lote.toFixed(
                2
              )} · Diferencia = ${evalLote.diferencia_suma.toFixed(2)}`,
            ],
          });
        }
        for (const [, p] of Object.entries(evalLote.particiones)) {
          if (p.cumple) continue;
          const camposLegible = p.campos_faltantes
            .map(etiquetaCampoFaltante)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          items.push({
            titulo: `Partición ${p.particion}`,
            campos_faltantes: camposLegible,
          });
        }
        setModalValidacion({
          open: true,
          modo: "pendientes",
          titulo: "Requisitos pendientes",
          pendientes: items,
          context: { tipo: "lote", idLote: r.id_lote_mineral },
        });
      }
    } catch {
      notifyError("No se pudo obtener la evaluación del lote.");
    } finally {
      setFetchingEvalLoteId(null);
    }
  };

  // Click en el boton "Validar" de la barra flotante (multiples lotes).
  // El backend persiste en una sola llamada y devuelve validados/omitidos.
  // Mostramos un modal no-bloqueante con el resultado para que el usuario
  // vea que lotes fueron omitidos por requisitos pendientes.
  // Se delega al hook para que setValidatingAll (loading del boton),
  // marcarValidadosOptimista (reflejar filas sin recargar) y
  // refrescarCacheParticiones (sincronizar cache) se ejecuten.
  const handleClickValidarMultiples = async () => {
    if (selectedLotes.length === 0) return;
    const ids = selectedLotes.map((r) => r.id_lote_mineral);
    const resultado = await validarLotes(ids);
    if (!resultado.ok) {
      // El hook ya notifico el error internamente.
      setSelectedLotes([]);
      return;
    }
    const validados = resultado.validados ?? [];
    const omitidos = resultado.omitidos ?? [];

    if (validados.length === 0) {
      notifyError(
        "Ninguno de los lotes seleccionados cumple los requisitos de validación."
      );
      setSelectedLotes([]);
      return;
    }

    const items: { titulo: string; campos_faltantes: string[] }[] = [];
    for (const o of omitidos) {
      items.push({
        titulo: `Lote ${o.lote_correlativo ?? o.id_lote_mineral} (omitido)`,
        campos_faltantes: o.razones,
      });
    }

    if (omitidos.length === 0) {
      notifySuccess(
        `${validados.length} lote${validados.length > 1 ? "s" : ""} validado${
          validados.length > 1 ? "s" : ""
        } correctamente.`
      );
      setSelectedLotes([]);
    } else {
      setModalValidacion({
        open: true,
        modo: "confirmar",
        titulo: "Resultado de validación múltiple",
        subtitulo: (
          <>
            Se validaron <b>{validados.length}</b> de {ids.length} lotes.{" "}
            Los lotes omitidos tienen requisitos pendientes (ver detalle).
            No se incluyen en la selección múltiple según lo acordado.
          </>
        ),
        pendientes: items,
        context: null,
      });
      setSelectedLotes([]);
    }
  };

  const handleConfirmValidacion = () => {
    const ctx = modalValidacion.context;
    if (!ctx) {
      // El modal sin context (resumen multi-lotes) solo se cierra.
      closeModalValidacion();
      return;
    }

    if (ctx.tipo === "lote") {
      // Cierre optimista: el modal desaparece de inmediato, el toast de
      // exito/error lo dispara el hook useLotesPendientes.validarLote.
      closeModalValidacion();
      void validarLote(ctx.idLote);
    }
  };

  // Crear partición SIN depender de un forwardRef. Llama al service directo,
  // sincroniza el cache global y dispara auto-expand. Si el backend es la
  // primera vez (count==0), crea 2 particiones (A con copia ficticia de la
  // recepción original + B vacía con recepción ficticia nueva).
  const handleCrearParticion = async (idLote: number) => {
    setCreatingParticionId(idLote);
    setExpandedLoteId(idLote);
    try {
      // Defensa explicita: una partición pertenece al mismo lote que su padre,
      // por lo tanto hereda la sucursal activa del operador. Esto evita que la
      // recepcion_unidad ficticia quede con id_sucursal = NULL cuando el backend
      // recibe un payload vacio.
      const idSucursal =
        useUIStore.getState().sucursal_elegida?.id_sucursal ?? null;
      const payload: DTO_CrearParticion =
        idSucursal !== null
          ? { recepcion: { id_sucursal: idSucursal } }
          : {};
      const creadas = await ValidacionDistribucionService.crearParticion(
        idLote,
        payload
      );
      if (creadas.length === 0) {
        notifyError("No se pudo crear la partición.");
        return;
      }
      // Optimistic: append inmediato al cache del store. El hook
      // useParticionesLote re-renderiza al toque via la suscripcion
      // cacheStore((s) => s.byLote[idLote]).
      const cacheState = useParticionesLoteStore.getState();
      const cached = cacheState.getCached(idLote);
      const existentes = cached?.data ?? [];
      const normalizadas = creadas.map(normalizeParticion);
      cacheState.setParticiones(idLote, [...existentes, ...normalizadas]);

      // Background: refetch silencioso para que ticket_balanza + recepcion
      // queden consistentes (no se renderiza nada extra, solo pisa el cache).
      void cacheState.fetchParticiones(idLote, async (id) => {
        const raw = await ValidacionDistribucionService.getParticiones(id);
        return raw.map(normalizeParticion);
      });

      updateRecord(idLote, { tiene_particion: 1 });
      notifySuccess(
        creadas.length > 1
          ? `${creadas.length} particiones creadas correctamente.`
          : "Partición creada correctamente."
      );
    } catch {
      notifyError("No se pudo crear la partición.");
    } finally {
      setCreatingParticionId(null);
    }
  };

  const handlePrintTicketLote = async (idLote: number) => {
    setPrintingLoteId(idLote);
    try {
      const ticketData =
        await ValidacionDistribucionService.getTicketBalanzaLote(idLote);
      const targetId = `ticket-balanza-lote-${idLote}`;
      prepare(targetId);
      print(
        <TicketBalanzaPdf data={ticketData} />,
        {
          documentTitle: `Ticket Balanza ${ticketData.correlativo || idLote}`,
          target: targetId,
        }
      );
    } catch {
      notifyError("No se pudo obtener la información para el ticket de balanza.");
    } finally {
      setPrintingLoteId(null);
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
    section: "text-zinc-500 transition-colors",
  };

  const noRecordsText = hasActiveFilters
    ? "No hay lotes pendientes de partición con los filtros aplicados."
    : "No hay lotes pendientes de partición.";

  return (
    <Container fluid>
      <Stack gap="md">
        {/* Cabecera de Filtros */}
        <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
          <div className="flex flex-wrap items-end gap-3 animate-fadeIn">
            <DateRangeFilter
              fechaInicio={fechaInicio || null}
              fechaFin={fechaFin || null}
              onFechaInicioChange={(v) => setFechaInicio(v || "")}
              onFechaFinChange={(v) => setFechaFin(v || "")}
            />

            <Box className="w-44">
              <TextInput
                label="Placa"
                placeholder="ABC-123"
                maxLength={8}
                radius="lg"
                leftSection={
                  <IconSearch
                    size={16}
                    className={placa ? "text-indigo-400" : "text-zinc-500"}
                  />
                }
                value={placa}
                onChange={(e) => {
                  const raw = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  const formatted =
                    raw.length <= 3
                      ? raw
                      : `${raw.slice(0, 3)}-${raw.slice(3, 7)}`;
                  setPlaca(formatted);
                }}
                rightSection={
                  placa ? (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setPlaca("")}
                      title="Limpiar"
                      className="text-zinc-400 hover:text-white mr-1"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
                classNames={fieldClasses}
              />
            </Box>

            <Box className="w-40">
              <Text size="xs" fw={500} className="text-zinc-400 mb-1 ml-1">
                Solo con excedente
              </Text>
              <Switch
                checked={soloExcedente}
                onChange={(e) => setSoloExcedente(e.currentTarget.checked)}
                color="indigo"
              />
            </Box>

            <Box className="w-56">
              <Text size="xs" fw={500} className="text-zinc-400 mb-1 ml-1">
                Estado Partición
              </Text>
              <SegmentedControl
                value={estadoParticion}
                onChange={(v) => setEstadoParticion(v as EstadoParticion)}
                data={[
                  { label: "Todos", value: "TODOS" },
                  { label: "Con", value: "CON" },
                  { label: "Sin", value: "SIN" },
                ]}
                size="xs"
                radius="lg"
                color="indigo"
                fullWidth
              />
            </Box>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              <Button
                variant="subtle"
                color="red"
                radius="lg"
                size="sm"
                leftSection={<IconX size={16} />}
                onClick={handleLimpiar}
                className="text-red-400 hover:bg-red-500/10 transition-colors h-9.5 px-6"
              >
                Limpiar
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            <RefreshButton
              onClick={() => void cargar()}
              loading={loading}
              label="Recargar lotes"
            />
          </div>
        </div>

        <DataTableEstandar
          records={recordsFiltrados}
          idAccessor="id_lote_mineral"
          loading={loading}
          noRecordsText={noRecordsText}
          selectedRecords={selectedLotes}
          onSelectedRecordsChange={setSelectedLotes}
          isRecordSelectable={puedeSeleccionarLote}
          expandedRecordIds={expandedLoteId !== null ? [expandedLoteId] : []}
          onExpandedChange={(ids) =>
            setExpandedLoteId(typeof ids[0] === "number" ? ids[0] : null)
          }
          renderExpandedRow={(r: Row) => <ParticionesExpandible lote={r} />}
          columns={[
            {
              accessor: "lote_correlativo",
              title: "Lote",
              textAlign: "center",
              render: (r: Row) => (
                <span className="font-semibold font-mono text-sm">
                  {r.lote_correlativo}
                </span>
              ),
            },
            {
              accessor: "ticket_correlativo",
              title: "Ticket",
              textAlign: "center",
              render: (r: Row) => (
                <Group gap={4} wrap="nowrap" justify="center" align="center">
                  <Text size="xs" ff="monospace">
                    {r.ticket_correlativo ?? "—"}
                  </Text>
                  {r.ticket_correlativo && (
                    <Tooltip label="Imprimir ticket de balanza" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="teal"
                        size="xs"
                        loading={printingLoteId === r.id_lote_mineral}
                        onClick={() =>
                          void handlePrintTicketLote(r.id_lote_mineral)
                        }
                      >
                        <IconPrinter size={13} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              ),
            },
            {
              accessor: "vehiculo_placa",
              title: "Vehículo",
              textAlign: "center",
            },
            {
              accessor: "vehiculo_capacidad",
              title: "Capacidad",
              textAlign: "center",
              render: (r: Row) => {
                const hasCapacity =
                  r.vehiculo_capacidad != null && r.vehiculo_capacidad > 0;
                const showExcedente =
                  hasCapacity && r.excedente != null && r.excedente > 0;

                if (!hasCapacity) {
                  return <span className="text-xs text-zinc-500">—</span>;
                }

                return (
                  <div className="flex flex-col items-center">
                    <span className="text-sm">
                      {formatTn(r.vehiculo_capacidad)}
                    </span>
                    {showExcedente && (
                      <span className="text-xs text-red-400 mt-0.5">
                        +{formatTn(r.excedente)} excedente
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              accessor: "lote_peso_inicial",
              title: "Peso inicial",
              textAlign: "center",
              render: (r: Row) => formatTn(r.lote_peso_inicial),
            },
            {
              accessor: "lote_fecha_peso_inicial",
              title: "F. peso inicial",
              textAlign: "center",
              render: (r: Row) => formatDateTime(r.lote_fecha_peso_inicial),
            },
            {
              accessor: "lote_peso_final",
              title: "Peso final",
              textAlign: "center",
              render: (r: Row) => formatTn(r.lote_peso_final),
            },
            {
              accessor: "lote_fecha_peso_final",
              title: "F. peso final",
              textAlign: "center",
              render: (r: Row) => formatDateTime(r.lote_fecha_peso_final),
            },
            {
              accessor: "lote_peso_neto",
              title: "Peso neto",
              textAlign: "center",
              render: (r: Row) => formatTn(r.lote_peso_neto),
            },
            {
              accessor: "id_lote_mineral",
              title: "Acciones",
              textAlign: "center",
              render: (r: Row) => {
                const isValidated = r.lote_esta_validado === true;
                const isValidating = validatingIds[r.id_lote_mineral] === true;
                const isFetchingEval =
                  fetchingEvalLoteId === r.id_lote_mineral;
                const isBusy = isValidating || isFetchingEval;
                // Evalua requisitos con el mismo criterio que las particiones:
                // lee el cache de particiones (hidratado por prefetch o autoguardado).
                const cached = useParticionesLoteStore
                  .getState()
                  .getCached(r.id_lote_mineral);
                // Cache no hidratado: false. Si esta hidratado (incluso vacio),
                // delegamos a evaluarLote: 0 particiones = trivialmente valido.
                const evalLoteOk = cached?.data
                  ? evaluarLote(cached.data, r.lote_peso_neto).cumple
                  : false;
                const cumpleRequisitos = !isValidated && evalLoteOk;
                const color: "green" | "yellow" | "gray" = isValidated
                  ? "green"
                  : cumpleRequisitos
                    ? "green"
                    : "yellow";
                const tooltip = isValidated
                  ? "Lote ya validado"
                  : cumpleRequisitos
                    ? "Click para validar lote"
                    : "Hay campos pendientes. Click para ver detalle.";
                return (
                  <Group gap={6} wrap="nowrap" justify="center">
                    <Tooltip label={tooltip} withArrow>
                      <ActionIcon
                        variant={isValidated || cumpleRequisitos ? "light" : "outline"}
                        color={color}
                        size="md"
                        radius="md"
                        loading={isBusy}
                        disabled={isValidated || isBusy}
                        onClick={() => handleClickValidarLote(r)}
                        aria-label="Validar lote"
                      >
                        <IconShieldCheck size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Button
                      size="xs"
                      radius="lg"
                      loading={creatingParticionId === r.id_lote_mineral}
                      disabled={
                        creatingParticionId !== null ||
                        r.lote_esta_validado === true
                      }
                      onClick={() => void handleCrearParticion(r.id_lote_mineral)}
                    >
                      + Nueva partición
                    </Button>
                  </Group>
                );
              },
            },
          ]}
        />
      </Stack>

      {selectedLotes.length > 0 && (
        <Paper
          shadow="xl"
          radius="lg"
          p="sm"
          withBorder
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
            bg-zinc-900/95 border-indigo-500/40 backdrop-blur-md
            flex items-center gap-3 animate-fadeIn"
        >
          <Text size="sm" c="zinc.2" fw={500}>
            {selectedLotes.length} lote{selectedLotes.length > 1 ? "s" : ""} seleccionado
            {selectedLotes.length > 1 ? "s" : ""}
          </Text>
          <Button
            radius="lg"
            size="xs"
            color="indigo"
            loading={validatingAll}
            leftSection={<IconShieldCheck size={14} />}
            onClick={handleClickValidarMultiples}
          >
            Validar
          </Button>
          <Button
            radius="lg"
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => setSelectedLotes([])}
          >
            Limpiar selección
          </Button>
        </Paper>
      )}

      {modalValidacion.context && (
        <ModalValidacion
          opened={modalValidacion.open}
          onClose={closeModalValidacion}
          modo={modalValidacion.modo}
          titulo={modalValidacion.titulo}
          subtitulo={modalValidacion.subtitulo}
          pendientesTextoLibre={modalValidacion.pendientesTextoLibre}
          pendientes={modalValidacion.pendientes}
          confirmLabel={
            modalValidacion.context.tipo === "lote"
              ? "Validar lote"
              : "Confirmar validación"
          }
          onConfirm={() => void handleConfirmValidacion()}
        />
      )}
    </Container>
  );
};
