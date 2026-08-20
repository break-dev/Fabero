import { useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconPrinter, IconSearch, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { CustomDatePicker } from "../../../presentation/utils/date-picker-input";
import { useLotesPendientes, getTodayString } from "../hooks/useLotesPendientes";
import {
  ParticionesExpandible,
  type ParticionesExpandibleRef,
} from "./components/ParticionesExpandible";
import { formatTn, formatDateTime } from "./utils/format-units";
import type { RES_LotePendiente } from "../service/validacion-distribucion.responses";
import { ValidacionDistribucionService } from "../service/validacion-distribucion.service";
import { TicketBalanzaPdf } from "../../recepcion-mineral/presentation/components/ticket-balanza-pdf";

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
    cargar,
    resetFilters,
  } = useLotesPendientes();
  const { notifyError } = useNotify();
  const { print, prepare } = usePrint();
  const [creatingParticionId, setCreatingParticionId] = useState<number | null>(
    null
  );
  const [printingLoteId, setPrintingLoteId] = useState<number | null>(null);
  const expandibleRefs = useRef<Map<number, ParticionesExpandibleRef>>(new Map());

  const [placa, setPlaca] = useState("");
  const [soloExcedente, setSoloExcedente] = useState(false);
  const [estadoParticion, setEstadoParticion] = useState<EstadoParticion>("TODOS");

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

  const todayStr = getTodayString();
  const hasActiveFilters =
    fechaInicio !== todayStr ||
    fechaFin !== todayStr ||
    !!placa ||
    soloExcedente ||
    estadoParticion !== "TODOS";

  const handleLimpiar = () => {
    resetFilters();
    setPlaca("");
    setSoloExcedente(false);
    setEstadoParticion("TODOS");
  };

  const handleCrearParticion = async (idLote: number) => {
    const ref = expandibleRefs.current.get(idLote);
    if (!ref) return;
    setCreatingParticionId(idLote);
    try {
      await ref.crearParticion();
      cargar();
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
    <Container fluid py="md">
      <Stack gap="md">
        {/* Cabecera de Filtros */}
        <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
          <div className="flex flex-wrap items-end gap-3 animate-fadeIn">
            <Box className="w-44">
              <CustomDatePicker
                label="Fecha Inicio"
                placeholder="Seleccionar"
                value={fechaInicio || null}
                onChange={(val) =>
                  setFechaInicio(val ? dayjs(val).format("YYYY-MM-DD") : "")
                }
              />
            </Box>

            <Box className="w-44">
              <CustomDatePicker
                label="Fecha Fin"
                placeholder="Seleccionar"
                value={fechaFin || null}
                onChange={(val) =>
                  setFechaFin(val ? dayjs(val).format("YYYY-MM-DD") : "")
                }
              />
            </Box>

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
        </div>

        <DataTableEstandar
          records={recordsFiltrados}
          idAccessor="id_lote_mineral"
          loading={loading}
          noRecordsText={noRecordsText}
          renderExpandedRow={(r: Row) => (
            <ParticionesExpandible
              ref={(instance) => {
                if (instance) {
                  expandibleRefs.current.set(r.id_lote_mineral, instance);
                } else {
                  expandibleRefs.current.delete(r.id_lote_mineral);
                }
              }}
              lote={r}
            />
          )}
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
              render: (r: Row) => (
                <Button
                  size="xs"
                  radius="lg"
                  loading={creatingParticionId === r.id_lote_mineral}
                  disabled={creatingParticionId !== null}
                  onClick={() => void handleCrearParticion(r.id_lote_mineral)}
                >
                  + Nueva partición
                </Button>
              ),
            },
          ]}
        />
      </Stack>
    </Container>
  );
};
