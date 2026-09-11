import { useState } from "react";
import {
  Group,
  Button,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Paper,
  Table,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconPencil,
  IconPaperclip,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconHistory,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import { useBlendingList } from "../hooks/useBlendingList";
import type { BlendingResponse } from "../service/blending.responses";
import { ModalCrearBlending } from "./components/modal-crear-blending";
import { ModalEditarBlending } from "./components/modal-editar-blending";
import { ModalHistorialBlending } from "./components/modal-historial-blending";
import {
  DateRangeFilter,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { formatNumber } from "../../../shared/functions/formatNumber";
import { RefreshButton } from "../../../presentation/utils/refresh-button";

export const BlendingPage = () => {
  useTitlePage("Blending", true);

  const {
    blendings,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    refetch,
  } = useBlendingList();

  const [modalCrearAbierto, setModalCrearAbierto] = useState<boolean>(false);
  const [blendingEditar, setBlendingEditar] = useState<BlendingResponse | null>(null);
  const [blendingHistorial, setBlendingHistorial] = useState<BlendingResponse | null>(null);
  const [evidenciasModal, setEvidenciasModal] = useState<IArchivo[] | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const today = defaultFechaFin();
  const hasActiveFilters = fechaInicio !== today || fechaFin !== today;

  const clearFilters = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  const columns = [
    {
      accessor: "expand",
      title: "",
      width: 40,
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <ActionIcon
          size="sm"
          variant="subtle"
          color="zinc"
          onClick={() => toggleExpand(r.id)}
        >
          {expandedRowIds.includes(r.id) ? (
            <IconChevronDown size={16} />
          ) : (
            <IconChevronRight size={16} />
          )}
        </ActionIcon>
      ),
    },
    {
      accessor: "index",
      title: "#",
      textAlign: "center" as const,
      width: 50,
    },
    {
      accessor: "correlativo",
      title: "Correlativo",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fw={700} fz="xs" c="emerald.4">
          {r.correlativo}
        </Text>
      ),
    },
    {
      accessor: "fecha_hora_blending",
      title: "Fecha / Hora",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fz="xs" c="zinc.3">
          {r.fecha_hora_blending ? new Date(r.fecha_hora_blending).toLocaleString("es-PE") : "-"}
        </Text>
      ),
    },
    {
      accessor: "peso_neto",
      title: "Peso Neto (TMH kg)",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fw={600} fz="xs" c="blue.4">
          {formatNumber(r.peso_neto, 2)}
        </Text>
      ),
    },
    {
      accessor: "peso_actual",
      title: "Peso Actual (kg)",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fw={700} fz="xs" c="emerald.3">
          {formatNumber(r.peso_actual, 2)}
        </Text>
      ),
    },
    {
      accessor: "ley_oro",
      title: "Ley Au (Oro)",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Group justify="center">
          <Badge color="amber" variant="light" size="sm">
            {formatNumber(r.ley_oro, 3)}
          </Badge>
        </Group>
      ),
    },
    {
      accessor: "ley_plata",
      title: "Ley Ag (Plata)",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Group justify="center">
          <Badge color="gray" variant="light" size="sm">
            {formatNumber(r.ley_plata, 3)}
          </Badge>
        </Group>
      ),
    },
    {
      accessor: "ley_humedad",
      title: "Humedad %",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fz="xs" c="cyan.4">
          {formatNumber(r.ley_humedad, 3)}%
        </Text>
      ),
    },
    {
      accessor: "empleado_registro_nombre",
      title: "Registrado Por",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Text fz="xs" c="zinc.4">
          {r.empleado_registro_nombre || "Sistema"}
        </Text>
      ),
    },
    {
      accessor: "acciones",
      title: "Acciones",
      textAlign: "center" as const,
      render: (r: BlendingResponse) => (
        <Group justify="center" gap={6}>
          <Tooltip label="Editar Blending / Agregar peso">
            <ActionIcon
              size="sm"
              color="amber"
              variant="light"
              onClick={() => setBlendingEditar(r)}
            >
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          {r.evidencias && r.evidencias.length > 0 && (
            <Tooltip label="Ver Evidencias">
              <ActionIcon
                size="sm"
                color="blue"
                variant="light"
                onClick={() => {
                  setEvidenciasModal(r.evidencias || []);
                }}
              >
                <IconPaperclip size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Historial de Modificaciones">
            <ActionIcon
              size="sm"
              color="purple"
              variant="light"
              onClick={() => setBlendingHistorial(r)}
            >
              <IconHistory size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex flex-wrap items-end gap-3 flex-1 w-full">
          <DateRangeFilter
            fechaInicio={fechaInicio || null}
            fechaFin={fechaFin || null}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              radius="lg"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={clearFilters}
              className="text-red-400 hover:bg-red-500/10 transition-colors h-9.5"
            >
              Limpiar
            </Button>
          )}

          <RefreshButton onClick={() => void refetch()} loading={loading} label="Recargar blendings" />

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={() => setModalCrearAbierto(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nuevo Blending
          </Button>
        </div>
      </div>

      {/* Tabla Maestra con Desplegable de Detalles */}
      <DataTableEstandar
        idAccessor="id"
        columns={columns}
        records={blendings}
        loading={loading}
        rowExpansion={{
          allowMultiple: true,
          expanded: { recordIds: expandedRowIds },
          onExpandedChange: () => {},
          content: ({ record }: { record: BlendingResponse }) => (
            <Box className="p-3 bg-zinc-900/90 border-t border-b border-zinc-800">
              <Text fw={700} fz="xs" c="emerald.4" className="mb-2 uppercase tracking-wider">
                Lotes y Mezclas Combinados en este Blending ({record.detalles?.length || 0}):
              </Text>
              <Paper className="bg-zinc-950/60 border border-zinc-800 rounded-lg overflow-hidden">
                <Table striped>
                  <Table.Thead className="bg-zinc-900 text-zinc-300">
                    <Table.Tr>
                      <Table.Th className="text-center">Código</Table.Th>
                      <Table.Th className="text-center">Origen / Proveedor</Table.Th>
                      <Table.Th className="text-center">Peso Anterior (kg)</Table.Th>
                      <Table.Th className="text-center">Peso Tomado (TMH kg)</Table.Th>
                      <Table.Th className="text-center">Peso Seco (TMS kg)</Table.Th>
                      <Table.Th className="text-center">Ley Au</Table.Th>
                      <Table.Th className="text-center">Ley Ag</Table.Th>
                      <Table.Th className="text-center">Humedad %</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {record.detalles && record.detalles.length > 0 ? (
                      record.detalles.map((d, i) => (
                        <Table.Tr key={i}>
                          <Table.Td className="text-center font-bold text-zinc-100">
                            {d.codigo}
                          </Table.Td>
                          <Table.Td className="text-center text-zinc-300">
                            {d.id_reblending ? "Blending" : d.proveedor_nombre}
                          </Table.Td>
                          <Table.Td className="text-center text-zinc-400">
                            {formatNumber(d.peso_actual, 2)}
                          </Table.Td>
                          <Table.Td className="text-center font-bold text-blue-400">
                            {formatNumber(d.peso_tomado, 2)}
                          </Table.Td>
                          <Table.Td className="text-center font-bold text-emerald-400">
                            {formatNumber(d.tms_tomado, 2)}
                          </Table.Td>
                          <Table.Td className="text-center text-amber-300 font-medium">
                            {formatNumber(d.ley_oro, 3)}
                          </Table.Td>
                          <Table.Td className="text-center text-zinc-300">
                            {formatNumber(d.ley_plata, 3)}
                          </Table.Td>
                          <Table.Td className="text-center text-cyan-400">
                            {formatNumber(d.ley_humedad, 3)}%
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={8} className="text-center py-2 text-zinc-500">
                          Sin detalles registrados.
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          ),
        }}
      />

      {/* Modal Crear */}
      <ModalCrearBlending
        opened={modalCrearAbierto}
        close={() => setModalCrearAbierto(false)}
        onSuccess={refetch}
      />

      {/* Modal Editar */}
      <ModalEditarBlending
        blending={blendingEditar}
        opened={blendingEditar !== null}
        close={() => setBlendingEditar(null)}
        onSuccess={refetch}
      />

      {/* Modal Historial */}
      <ModalHistorialBlending
        blending={blendingHistorial}
        opened={blendingHistorial !== null}
        onClose={() => setBlendingHistorial(null)}
      />

      {/* Modal: Evidencias Registradas */}
      <ModalEstandar
        opened={evidenciasModal !== null}
        close={() => setEvidenciasModal(null)}
        title="Evidencias del Blending"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {evidenciasModal?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>
    </div>
  );
};

export default BlendingPage;