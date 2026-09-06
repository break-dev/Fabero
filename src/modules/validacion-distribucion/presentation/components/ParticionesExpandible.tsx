import { useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconClock,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconPrinter,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react";
import {
  useParticionesLote,
  type PesoField,
} from "../../hooks/useParticionesLote";
import { formatDateTime, formatTn } from "../utils/format-units";
import type { RES_Particion } from "../../service/validacion-distribucion.responses";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ModalValidacion } from "../../../../presentation/utils/modal-validacion";
import { EdicionParticionModal } from "./EdicionParticionModal";
import { FechaHoraModal } from "./FechaHoraModal";
import { usePrint } from "../../../../hooks/usePrint";
import { useNotify } from "../../../../hooks/useNotify";
import { TicketBalanzaPdf } from "../../../../presentation/utils/ticket-balanza-pdf";
import { ValidacionDistribucionService } from "../../service/validacion-distribucion.service";
import {
  etiquetaCampoFaltante,
  evaluarLote,
  evaluarParticion,
} from "../utils/evaluador-validacion";

interface Props {
  lote: { id_lote_mineral: number; lote_peso_neto: number };
}

export const ParticionesExpandible = ({ lote }: Props) => {
  const hooks = useParticionesLote(lote.id_lote_mineral, lote.lote_peso_neto);
  const { print, prepare } = usePrint();
  const { notifyError } = useNotify();
  const [printingId, setPrintingId] = useState<number | null>(null);

  const handlePrintTicketParticion = async (p: RES_Particion) => {
    setPrintingId(p.id);
    try {
      const ticketData = await ValidacionDistribucionService.getTicketBalanza(p.id);
      const targetId = `ticket-balanza-particion-${p.id}`;
      prepare(targetId);

      print(
        <TicketBalanzaPdf data={ticketData} />,
        {
          documentTitle: `Ticket Balanza ${ticketData.correlativo || p.correlativo}`,
          target: targetId,
        }
      );
    } catch {
      notifyError("No se pudo obtener la información para el ticket de balanza.");
    } finally {
      setPrintingId(null);
    }
  };

  const [edicionModal, setEdicionModal] = useState<{
    open: boolean;
    particion: RES_Particion | null;
  }>({ open: false, particion: null });

  const [fechaModal, setFechaModal] = useState<{
    open: boolean;
    idParticion: number;
    campo: "fecha_hora_peso_inicial" | "fecha_hora_peso_final";
    value: string | null;
  } | null>(null);

  const [confirmEliminar, setConfirmEliminar] = useState<RES_Particion | null>(
    null
  );

  // Evaluacion derivada para el lote completo. Se recomputa cuando cambian
  // particiones o pesos, sin pegarle a la API.
  const evalLote = useMemo(
    () => evaluarLote(hooks.particiones, lote.lote_peso_neto),
    [hooks.particiones, lote.lote_peso_neto]
  );

  // Modal de validacion: una sola instancia, alterna entre modo confirmar / pendientes.
  const [modalValidacion, setModalValidacion] = useState<{
    open: boolean;
    modo: "confirmar" | "pendientes";
    particion: RES_Particion | null;
  }>({ open: false, modo: "confirmar", particion: null });

  const handleClickValidar = (p: RES_Particion) => {
    const evalPart = evaluarParticion(p);
    const puedeValidar = evalPart.cumple && evalLote.cumple_suma;

    if (p.esta_validado) {
      // Ya validada: no se hace nada (no hay des-validacion en este modulo).
      return;
    }

    if (puedeValidar) {
      setModalValidacion({
        open: true,
        modo: "confirmar",
        particion: p,
      });
    } else {
      setModalValidacion({
        open: true,
        modo: "pendientes",
        particion: p,
      });
    }
  };

  const handleConfirmarValidacion = () => {
    if (!modalValidacion.particion) return;
    // Cierre optimista: el modal desaparece de inmediato, el toast de
    // exito/error lo dispara el hook useParticionesLote.validarParticion.
    setModalValidacion({ open: false, modo: "confirmar", particion: null });
    void hooks.validarParticion(modalValidacion.particion.id);
  };

  const handleCloseModalValidacion = () => {
    setModalValidacion({ open: false, modo: "confirmar", particion: null });
  };

  const pendientesDelModal = useMemo(() => {
    if (!modalValidacion.particion) return [];
    const p = modalValidacion.particion;
    const evalPart = evaluarParticion(p);
    if (evalPart.cumple && evalLote.cumple_suma) return [];

    const items: { titulo: string; campos_faltantes: string[] }[] = [];
    if (!evalPart.cumple) {
      items.push({
        titulo: `Partición ${p.particion} (${p.correlativo})`,
        campos_faltantes: evalPart.campos_faltantes.map(etiquetaCampoFaltante),
      });
    }
    if (!evalLote.cumple_suma) {
      items.push({
        titulo: "Suma de pesos netos del lote",
        campos_faltantes: [
          `Suma particiones = ${evalLote.suma_pesos_netos.toFixed(2)} · Lote padre = ${lote.lote_peso_neto.toFixed(2)} · Diferencia = ${evalLote.diferencia_suma.toFixed(2)}`,
        ],
      });
    }
    return items;
  }, [modalValidacion.particion, evalLote, lote.lote_peso_neto]);

  const handleConfirmEliminar = async () => {
    if (!confirmEliminar) return;
    await hooks.eliminar(confirmEliminar);
    setConfirmEliminar(null);
  };

  return (
    <Stack gap="xs" p="xs">
      {hooks.particiones.length === 0 ? (
        <Text c="dimmed" size="xs">
          Aún no se ha creado ninguna partición.
        </Text>
      ) : (
        <Table withTableBorder striped highlightOnHover verticalSpacing="2xs">
          <Table.Thead>
            <Table.Tr className="text-[11px] uppercase tracking-wider text-zinc-400">
              <Table.Th ta="center" style={{ fontSize: 11, padding: "6px 8px" }}>Partición</Table.Th>
              <Table.Th ta="center" style={{ fontSize: 11, padding: "6px 8px" }}>Ticket</Table.Th>
              <Table.Th ta="center" style={{ fontSize: 11, padding: "6px 8px" }}>Vehículo (Capacidad)</Table.Th>
              <Table.Th ta="center" style={{ minWidth: 140, fontSize: 11, padding: "6px 8px" }}>P. Inicial</Table.Th>
              <Table.Th ta="center" style={{ fontSize: 11, padding: "6px 8px" }}>F. inicial</Table.Th>
              <Table.Th ta="center" style={{ minWidth: 140, fontSize: 11, padding: "6px 8px" }}>P. Final</Table.Th>
              <Table.Th ta="center" style={{ fontSize: 11, padding: "6px 8px" }}>F. final</Table.Th>
              <Table.Th ta="center" style={{ minWidth: 110, fontSize: 11, padding: "6px 8px" }}>
                P. Neto
              </Table.Th>
              <Table.Th ta="center" style={{ width: 150, fontSize: 11, padding: "6px 8px" }}>
                Acciones
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {hooks.particiones.map((p) => {
              const consistente = hooks.esConsistente(p);
              const eliminada = hooks.isEliminada(p);
              const yaValidada = p.esta_validado === true;
              const diferencia = round2(
                (p.peso_inicial ?? 0) -
                  (p.peso_final ?? 0) -
                  (p.peso_neto ?? 0)
              );
              return (
                <Table.Tr
                  key={p.id}
                  style={
                    eliminada
                      ? {
                          opacity: 0.5,
                          textDecoration: "line-through",
                          backgroundColor: "rgba(239, 68, 68, 0.05)",
                        }
                      : !consistente
                      ? {
                          boxShadow: "inset 0 0 0 1px rgba(234, 179, 8, 0.5)",
                        }
                      : undefined
                  }
                >
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <Text fw={700} className="text-[13px] font-mono text-center">
                      {p.correlativo}
                    </Text>
                    <Group gap={4} wrap="nowrap" align="center" justify="center">
                      <Text fw={500} className="text-[11px] text-zinc-400">
                        {p.particion}
                      </Text>
                      {!consistente && !eliminada && (
                        <Tooltip
                          label={`Pesos no cuadran: P.Inicial - P.Final ≠ P.Neto (${diferencia >= 0 ? "+" : ""}${diferencia})`}
                          withArrow
                        >
                          <Text className="text-[10px]" c="yellow">
                            ⚠
                          </Text>
                        </Tooltip>
                      )}
                      {eliminada && (
                        <Tooltip label="Partición eliminada" withArrow>
                          <Text className="text-[10px]" c="red">
                            🗑
                          </Text>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <Group gap={4} wrap="nowrap" align="center" justify="center">
                      {p.ticket_correlativo ? (
                        <>
                          <Text className="text-[10px] font-mono">
                            {p.ticket_correlativo}
                          </Text>
                          <Tooltip label="Imprimir ticket de balanza" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              size="xs"
                              onClick={() => void handlePrintTicketParticion(p)}
                              loading={printingId === p.id}
                              disabled={eliminada}
                            >
                              <IconPrinter size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip
                          label="Pendiente: se genera al validar la partición."
                          withArrow
                        >
                          <Text className="text-[10px] font-mono text-zinc-500">
                            —
                          </Text>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <Group gap={4} wrap="nowrap" align="center" justify="center">
                      <Text className="text-[11px]">{p.vehiculo_placa ?? "FICTICIA"}</Text>
                      {p.vehiculo_capacidad != null ? (
                        <Text className="text-[10px] text-zinc-400">
                          ({formatTn(p.vehiculo_capacidad)})
                        </Text>
                      ) : null}
                      <Tooltip label="Editar recepción" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="indigo"
                          size="xs"
                          onClick={() =>
                            setEdicionModal({ open: true, particion: p })
                          }
                          disabled={eliminada || yaValidada}
                        >
                          <IconPencil size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <div className="flex justify-center">
                      <PesoInput
                        partition={p}
                        field="peso_inicial"
                        onAutoAdjust={(field, value) =>
                          hooks.ajustarPeso(p.id, field, value)
                        }
                        disabled={eliminada || p.es_bloqueado || yaValidada}
                      />
                    </div>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <Group gap={4} align="center" justify="center" wrap="nowrap">
                      <Text className="text-[10px] font-mono text-zinc-300">
                        {formatDateTime(p.fecha_hora_peso_inicial)}
                      </Text>
                      <Tooltip label="Cambiar fecha" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() =>
                            setFechaModal({
                              open: true,
                              idParticion: p.id,
                              campo: "fecha_hora_peso_inicial",
                              value: p.fecha_hora_peso_inicial,
                            })
                          }
                          disabled={eliminada || p.es_bloqueado || yaValidada}
                        >
                          <IconClock size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <div className="flex justify-center">
                      <PesoInput
                        partition={p}
                        field="peso_final"
                        onAutoAdjust={(field, value) =>
                          hooks.ajustarPeso(p.id, field, value)
                        }
                        disabled={eliminada || p.es_bloqueado || yaValidada}
                      />
                    </div>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <Group gap={4} align="center" justify="center" wrap="nowrap">
                      <Text className="text-[10px] font-mono text-zinc-300">
                        {formatDateTime(p.fecha_hora_peso_final)}
                      </Text>
                      <Tooltip label="Cambiar fecha" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={() =>
                            setFechaModal({
                              open: true,
                              idParticion: p.id,
                              campo: "fecha_hora_peso_final",
                              value: p.fecha_hora_peso_final,
                            })
                          }
                          disabled={eliminada || p.es_bloqueado || yaValidada}
                        >
                          <IconClock size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                    <div className="flex justify-center">
                      <PesoInput
                        partition={p}
                        field="peso_neto"
                        onAutoAdjust={(field, value) =>
                          hooks.ajustarPeso(p.id, field, value)
                        }
                        disabled={eliminada || p.es_bloqueado || yaValidada}
                        max={lote.lote_peso_neto}
                      />
                    </div>
                  </Table.Td>
                  <Table.Td ta="center" style={{ padding: "4px 8px" }}>
                      {(() => {
                      const evalPart = evaluarParticion(p);
                      const puedeValidar =
                        !eliminada && evalPart.cumple && evalLote.cumple_suma;
                      const isValidating =
                        hooks.validatingIds?.[p.id] === true;
                      const color: "green" | "yellow" | "gray" = yaValidada
                        ? "green"
                        : puedeValidar
                          ? "green"
                          : "yellow";
                      const tooltip = yaValidada
                        ? "Partición ya validada"
                        : puedeValidar
                          ? "Validar partición"
                          : "Hay campos pendientes. Click para ver detalle.";
                      const disabled =
                        eliminada || isValidating || yaValidada;
                      const tooltipBloquear = yaValidada
                        ? "Partición validada: no se puede modificar el bloqueo"
                        : p.es_bloqueado
                          ? "Desbloquear"
                          : "Bloquear";
                      const tooltipEliminar = yaValidada
                        ? "Partición validada: no se puede eliminar"
                        : "Eliminar";
                      return (
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Tooltip label={tooltip} withArrow>
                            <ActionIcon
                              variant={puedeValidar || yaValidada ? "light" : "outline"}
                              color={color}
                              size="xs"
                              radius="md"
                              loading={isValidating}
                              disabled={disabled}
                              onClick={() => handleClickValidar(p)}
                              aria-label="Validar partición"
                            >
                              <IconShieldCheck size={13} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={tooltipBloquear} withArrow>
                            <ActionIcon
                              color={p.es_bloqueado ? "yellow" : "gray"}
                              variant="subtle"
                              size="xs"
                              onClick={() => hooks.toggleBloqueo(p)}
                              disabled={eliminada || yaValidada}
                              aria-label="Bloquear"
                            >
                              {p.es_bloqueado ? (
                                <IconLock size={13} />
                              ) : (
                                <IconLockOpen size={13} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={tooltipEliminar} withArrow>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              size="xs"
                              onClick={() => setConfirmEliminar(p)}
                              disabled={eliminada || yaValidada}
                              aria-label="Eliminar"
                            >
                              <IconTrash size={13} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      );
                    })()}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      {edicionModal.open && edicionModal.particion && (
        <EdicionParticionModal
          opened={edicionModal.open}
          onClose={() => setEdicionModal({ open: false, particion: null })}
          particion={edicionModal.particion}
          onSaved={(actualizadas) => {
            hooks.reemplazarParticiones(actualizadas);
          }}
        />
      )}

      {fechaModal && (() => {
        const particionEnModal = hooks.particiones.find(
          (p) => p.id === fechaModal.idParticion
        );

        const fechaIngresoBase = particionEnModal?.fecha_hora_ingreso
          ? new Date(particionEnModal.fecha_hora_ingreso)
          : new Date();

        const defaultFechaInicial = new Date(
          fechaIngresoBase.getTime() + 30 * 60 * 1000
        );

        const fechaInicialBase = particionEnModal?.fecha_hora_peso_inicial
          ? new Date(particionEnModal.fecha_hora_peso_inicial)
          : defaultFechaInicial;

        const defaultFechaFinal = new Date(
          fechaInicialBase.getTime() + 30 * 60 * 1000
        );

        const defaultValue =
          fechaModal.campo === "fecha_hora_peso_inicial"
            ? defaultFechaInicial
            : defaultFechaFinal;
        return (
          <FechaHoraModal
            opened={fechaModal.open}
            onClose={() => setFechaModal(null)}
            value={fechaModal.value}
            defaultValue={fechaModal.value ? null : defaultValue}
            title={
              fechaModal.campo === "fecha_hora_peso_inicial"
                ? "Fecha/hora peso inicial"
                : "Fecha/hora peso final"
            }
            onConfirm={(iso) => {
              void hooks.cambiarFecha(
                fechaModal.idParticion,
                fechaModal.campo,
                iso
              );
              setFechaModal(null);
            }}
          />
        );
      })()}

      {confirmEliminar && (
        <ModalEstandar
          opened
          close={() => setConfirmEliminar(null)}
          title="Eliminar partición"
          size="sm"
          validateClose
          closeConfirmationTitle="¿Cancelar eliminación?"
        >
          <Stack gap="md">
            <Text size="sm">
              ¿Eliminar la partición <b>{confirmEliminar.particion}</b>? Esta
              acción marca la partición como eliminada pero no la borra de la
              base de datos.
            </Text>
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setConfirmEliminar(null)}
                radius="lg"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                color="red"
                onClick={() => void handleConfirmEliminar()}
                loading={Boolean(hooks.savingIds[confirmEliminar.id])}
                radius="lg"
                size="sm"
              >
                Eliminar
              </Button>
            </Group>
          </Stack>
        </ModalEstandar>
      )}

      {modalValidacion.particion && (
        <ModalValidacion
          opened={modalValidacion.open}
          onClose={handleCloseModalValidacion}
          modo={modalValidacion.modo}
          subtitulo={
            modalValidacion.modo === "confirmar"
              ? `Se marcará la partición ${modalValidacion.particion.particion} (${modalValidacion.particion.correlativo}) como validada. Esta acción no se puede revertir desde este módulo.`
              : undefined
          }
          pendientes={pendientesDelModal}
          onConfirm={() => void handleConfirmarValidacion()}
        />
      )}
    </Stack>
  );
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface PesoInputProps {
  partition: RES_Particion;
  field: PesoField;
  onAutoAdjust: (field: PesoField, value: number) => void;
  disabled?: boolean;
  max?: number;
}

const PesoInput = ({
  partition,
  field,
  onAutoAdjust,
  disabled,
  max,
}: PesoInputProps) => {
  const propVal = partition[field] ?? 0;
  const [localVal, setLocalVal] = useState(propVal);
  const [isFocused, setIsFocused] = useState(false);

  const [prevPropVal, setPrevPropVal] = useState(propVal);
  if (propVal !== prevPropVal) {
    setPrevPropVal(propVal);
    if (!isFocused) {
      setLocalVal(propVal);
    }
  }

  const currentValue = isFocused ? localVal : propVal;

  return (
    <NumberInput
      value={currentValue}
      onChange={(v) => {
        let parsed = typeof v === "number" ? v : parseFloat(String(v));
        if (!Number.isFinite(parsed)) return;
        if (max != null && parsed > max) {
          parsed = max;
        }
        setLocalVal(parsed);
        onAutoAdjust(field, parsed);
      }}
      onFocus={() => {
        setLocalVal(propVal);
        setIsFocused(true);
      }}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      min={0}
      max={max}
      clampBehavior="strict"
      decimalScale={2}
      fixedDecimalScale
      hideControls
      radius="lg"
      size="xs"
      style={{ width: 95 }}
      classNames={{
        input: "text-[11px] h-7 px-2 font-mono text-center bg-zinc-900/60 border-zinc-800",
      }}
    />
  );
};

