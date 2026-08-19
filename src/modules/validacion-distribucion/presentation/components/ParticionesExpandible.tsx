import { forwardRef, useImperativeHandle, useState } from "react";
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
  IconDeviceFloppy,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconPrinter,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import {
  useParticionesLote,
  type PesoField,
} from "../../hooks/useParticionesLote";
import { formatDateTime, formatTn } from "../utils/format-units";
import type { RES_Particion } from "../../service/validacion-distribucion.responses";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CapacidadVehiculoModal } from "./CapacidadVehiculoModal";
import { EdicionParticionModal } from "./EdicionParticionModal";
import { FechaHoraModal } from "./FechaHoraModal";
import { usePrint } from "../../../../hooks/usePrint";
import { useNotify } from "../../../../hooks/useNotify";
import { TicketBalanzaPdf } from "../../../recepcion-mineral/presentation/components/ticket-balanza-pdf";
import { ValidacionDistribucionService } from "../../service/validacion-distribucion.service";

interface Props {
  lote: { id_lote_mineral: number; lote_peso_neto: number };
}

export interface ParticionesExpandibleRef {
  crearParticion: () => Promise<void>;
  loading: boolean;
  creating: boolean;
}

export const ParticionesExpandible = forwardRef<
  ParticionesExpandibleRef,
  Props
>(function ParticionesExpandible({ lote }, ref) {
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

  useImperativeHandle(
    ref,
    () => ({
      crearParticion: hooks.crearParticion,
      loading: hooks.loading,
      creating: hooks.creating,
    }),
    [hooks.crearParticion, hooks.loading, hooks.creating]
  );

  const [edicionModal, setEdicionModal] = useState<{
    open: boolean;
    particion: RES_Particion | null;
  }>({ open: false, particion: null });

  const [capacidadModal, setCapacidadModal] = useState<{
    open: boolean;
    idVehiculo: number | null;
    capacidad: number | null;
    placa: string | null;
  }>({ open: false, idVehiculo: null, capacidad: null, placa: null });

  const [fechaModal, setFechaModal] = useState<{
    open: boolean;
    idParticion: number;
    campo: "fecha_hora_peso_inicial" | "fecha_hora_peso_final";
    value: string | null;
  } | null>(null);

  const [confirmEliminar, setConfirmEliminar] = useState<RES_Particion | null>(
    null
  );

  const handleConfirmEliminar = async () => {
    if (!confirmEliminar) return;
    await hooks.eliminar(confirmEliminar);
    setConfirmEliminar(null);
  };

  return (
    <Stack gap="md" p="xs">
      {hooks.particiones.length === 0 ? (
        <Text c="dimmed" size="xs">
          Aún no se ha creado ninguna partición.
        </Text>
      ) : (
        <Table withTableBorder striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Partición</Table.Th>
              <Table.Th>Ticket</Table.Th>
              <Table.Th>Vehículo (Capacidad)</Table.Th>
              <Table.Th style={{ minWidth: 180 }}>P. Inicial</Table.Th>
              <Table.Th>F. inicial</Table.Th>
              <Table.Th style={{ minWidth: 180 }}>P. Final</Table.Th>
              <Table.Th>F. final</Table.Th>
              <Table.Th ta="right" style={{ minWidth: 130 }}>
                P. Neto
              </Table.Th>
              <Table.Th ta="right" style={{ width: 150 }}>
                Acciones
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {hooks.particiones.map((p) => {
              const saving = Boolean(hooks.savingIds[p.id]);
              const consistente = hooks.esConsistente(p);
              const eliminada = hooks.isEliminada(p);
              const hasChanges = hooks.isDirty(p);
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
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" align="center">
                      <Text fw={600} size="xs">
                        {p.particion}
                      </Text>
                      {hasChanges && (
                        <Tooltip label="Cambios sin guardar" withArrow>
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        </Tooltip>
                      )}
                      {!consistente && !eliminada && (
                        <Tooltip
                          label={`Pesos no cuadran: P.Inicial - P.Final ≠ P.Neto (${diferencia >= 0 ? "+" : ""}${diferencia})`}
                          withArrow
                        >
                          <Text size="xs" c="yellow">
                            ⚠
                          </Text>
                        </Tooltip>
                      )}
                      {eliminada && (
                        <Tooltip label="Partición eliminada" withArrow>
                          <Text size="xs" c="red">
                            🗑
                          </Text>
                        </Tooltip>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {p.correlativo}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" align="center">
                      <Text size="xs" ff="monospace">
                        {p.ticket_correlativo ?? "—"}
                      </Text>
                      {p.ticket_correlativo && (
                        <Tooltip label="Imprimir ticket de balanza" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="teal"
                            size="xs"
                            onClick={() => void handlePrintTicketParticion(p)}
                            loading={printingId === p.id}
                            disabled={eliminada}
                          >
                            <IconPrinter size={13} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap" align="center">
                      <Text size="xs">{p.vehiculo_placa ?? "FICTICIA"}</Text>
                      {p.vehiculo_capacidad != null ? (
                        <Text size="xs" c="dimmed">
                          ({formatTn(p.vehiculo_capacidad)})
                        </Text>
                      ) : null}
                      {p.id_vehiculo != null && (
                        <Tooltip label="Actualizar capacidad" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() =>
                              setCapacidadModal({
                                open: true,
                                idVehiculo: p.id_vehiculo ?? null,
                                capacidad: p.vehiculo_capacidad ?? null,
                                placa: p.vehiculo_placa ?? null,
                              })
                            }
                          >
                            <IconSettings size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Editar recepción" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="indigo"
                          size="sm"
                          onClick={() =>
                            setEdicionModal({ open: true, particion: p })
                          }
                          disabled={eliminada}
                        >
                          <IconPencil size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} align="center" wrap="nowrap">
                      <PesoInput
                        partition={p}
                        field="peso_inicial"
                        onAutoAdjust={(field, value) =>
                          hooks.ajustarPeso(p.id, field, value)
                        }
                        disabled={saving || eliminada || p.es_bloqueado}
                      />
                      <Tooltip label="Cambiar fecha" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() =>
                            setFechaModal({
                              open: true,
                              idParticion: p.id,
                              campo: "fecha_hora_peso_inicial",
                              value: p.fecha_hora_peso_inicial,
                            })
                          }
                          disabled={eliminada || p.es_bloqueado}
                        >
                          <IconClock size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" className="font-mono">
                      {formatDateTime(p.fecha_hora_peso_inicial)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} align="center" wrap="nowrap">
                      <PesoInput
                        partition={p}
                        field="peso_final"
                        onAutoAdjust={(field, value) =>
                          hooks.ajustarPeso(p.id, field, value)
                        }
                        disabled={saving || eliminada || p.es_bloqueado}
                      />
                      <Tooltip label="Cambiar fecha" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() =>
                            setFechaModal({
                              open: true,
                              idParticion: p.id,
                              campo: "fecha_hora_peso_final",
                              value: p.fecha_hora_peso_final,
                            })
                          }
                          disabled={eliminada || p.es_bloqueado}
                        >
                          <IconClock size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" className="font-mono">
                      {formatDateTime(p.fecha_hora_peso_final)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <PesoInput
                      partition={p}
                      field="peso_neto"
                      onAutoAdjust={(field, value) =>
                        hooks.ajustarPeso(p.id, field, value)
                      }
                      disabled={saving || eliminada || p.es_bloqueado}
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Tooltip label="Ver / Imprimir Ticket de Balanza">
                        <ActionIcon
                          color="teal"
                          variant="subtle"
                          onClick={() => void handlePrintTicketParticion(p)}
                          loading={printingId === p.id}
                          disabled={eliminada}
                          aria-label="Ver Ticket"
                        >
                          <IconPrinter size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Guardar pesos">
                        <ActionIcon
                          color="indigo"
                          variant="subtle"
                          onClick={() => void hooks.guardar(p.id)}
                          loading={saving}
                          disabled={!hasChanges || eliminada}
                          aria-label="Guardar"
                        >
                          <IconDeviceFloppy size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={p.es_bloqueado ? "Desbloquear" : "Bloquear"}>
                        <ActionIcon
                          color={p.es_bloqueado ? "yellow" : "gray"}
                          variant="subtle"
                          onClick={() => void hooks.toggleBloqueo(p)}
                          loading={saving}
                          disabled={eliminada}
                          aria-label="Bloquear"
                        >
                          {p.es_bloqueado ? (
                            <IconLock size={16} />
                          ) : (
                            <IconLockOpen size={16} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => setConfirmEliminar(p)}
                          disabled={eliminada}
                          aria-label="Eliminar"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
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

      {capacidadModal.open && capacidadModal.idVehiculo != null && (
        <CapacidadVehiculoModal
          opened={capacidadModal.open}
          onClose={() =>
            setCapacidadModal({
              open: false,
              idVehiculo: null,
              capacidad: null,
              placa: null,
            })
          }
          idVehiculo={capacidadModal.idVehiculo}
          placa={capacidadModal.placa}
          capacidadInicial={capacidadModal.capacidad}
          onUpdated={(nueva) => {
            if (capacidadModal.idVehiculo != null) {
              hooks.actualizarCapacidadLocal(
                capacidadModal.idVehiculo,
                nueva
              );
            }
          }}
        />
      )}

      {fechaModal && (
        <FechaHoraModal
          opened={fechaModal.open}
          onClose={() => setFechaModal(null)}
          value={fechaModal.value}
          title={
            fechaModal.campo === "fecha_hora_peso_inicial"
              ? "Fecha/hora peso inicial"
              : "Fecha/hora peso final"
          }
          onConfirm={(iso) => {
            void hooks.cambiarFecha(fechaModal.idParticion, fechaModal.campo, iso);
            setFechaModal(null);
          }}
        />
      )}

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
    </Stack>
  );
});

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface PesoInputProps {
  partition: RES_Particion;
  field: PesoField;
  onAutoAdjust: (field: PesoField, value: number) => void;
  disabled?: boolean;
}

const PesoInput = ({
  partition,
  field,
  onAutoAdjust,
  disabled,
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
        const parsed = typeof v === "number" ? v : parseFloat(String(v));
        if (!Number.isFinite(parsed)) return;
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
      decimalScale={2}
      fixedDecimalScale
      hideControls
      radius="lg"
      size="xs"
      style={{ width: 110 }}
    />
  );
};

