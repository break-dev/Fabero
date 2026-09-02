import { useState } from "react";
import { Grid, Text, Button, Select, Badge, ActionIcon, Tooltip, Stack, TextInput, Group, Loader } from "@mantine/core";
import { IconNote, IconPaperclip, IconX, IconCalendar, IconPencil, IconBarcode, IconScale, IconHistory } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useResumenBalanza } from "../hooks/useResumenBalanza";
import { useUIStore } from "../../../stores/ui.store";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import type { RES_ResumenBalanzaItem } from "../service/resumen-balanza.responses";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import { ModalEditarResumenLote } from "./components/modal-editar-resumen-lote";
import { useTicketLote } from "../../recepcion-mineral/hooks/useTicketLote";
import { useTicketBalanza } from "../../recepcion-mineral/hooks/useTicketBalanza";
import { CambiosLogViewer } from "../../../presentation/utils/cambios-log-viewer";
import { RefreshButton } from "../../../presentation/utils/refresh-button";

export const ResumenBalanzaPage = () => {
  useTitlePage("Resumen de Balanza", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);

  const { printTicket } = useTicketLote();
  const { printTicketBalanza } = useTicketBalanza();

  const formatFecha = (fechaStr: string | null) => {
    if (!fechaStr) return "—";
    try {
      const date = new Date(fechaStr.replace(" ", "T"));
      if (isNaN(date.getTime())) return fechaStr;

      const pad = (num: number) => num.toString().padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  const {
    items,
    loading,
    loadingMetadata,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoIngreso,
    setTipoIngreso,
    placa,
    setPlaca,
    idLoteMineral,
    setIdLoteMineral,
    idEmpresaTransporte,
    setIdEmpresaTransporte,
    metadata,
    empresasTransporte,
    loadResumen,
    resetFilters,
  } = useResumenBalanza();

  // Estados para visor de evidencias
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estados para edición de lote
  const [editingLote, setEditingLote] = useState<RES_ResumenBalanzaItem | null>(null);

  // Estados para historial de cambios
  const [loteHistorial, setLoteHistorial] = useState<RES_ResumenBalanzaItem | null>(null);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);

  const handleOpenEvidencias = (evidencias: IArchivo[]) => {
    setSelectedEvidencias(evidencias);
    setModalOpen(true);
  };

  // Mapear datos para los selects
  const lotesData = metadata.lotes.map((l) => ({
    value: String(l.id),
    label: l.correlativo,
  }));

  const placasData = metadata.vehiculos.map((v) => {
    const label = v.placa || `Vehículo #${v.id}`;
    return { value: label, label };
  });

  const conditionsData = [
    { value: TipoIngreso.RecepcionMineral, label: "Recepción de Mineral" },
    { value: TipoIngreso.DespachoMineral, label: "Despacho de Mineral" },
  ];

  const empresasData = empresasTransporte.map((e) => ({
    value: String(e.id_empresa_transporte),
    label: e.razon_social,
  }));

  // Clases comunes para matching de diseño con otros inputs
  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
    section: "text-zinc-500 transition-colors",
  };

  const selectComboboxProps = {
    transitionProps: { transition: "pop-top-left" as const, duration: 150 },
    dropdownPadding: 6,
    shadow: "md",
    withinPortal: true,
  };

  const selectClassNames = {
    ...fieldClasses,
    dropdown: "bg-zinc-950 border-zinc-800 text-white rounded-lg shadow-2xl",
    option:
      "hover:bg-zinc-900 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors py-2 px-3 data-[selected]:bg-indigo-600 data-[selected]:text-white",
  };

  const hasActiveFilters =
    !!fechaInicio ||
    !!fechaFin ||
    !!idLoteMineral ||
    !!placa ||
    !!tipoIngreso ||
    !!idEmpresaTransporte;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera de Filtros al estilo Recepción de Unidades */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full animate-fadeIn">
          <Grid gutter="md">
            {/* Fecha Inicio */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <TextInput
                type="date"
                label="Fecha Inicio"
                radius="lg"
                leftSection={<IconCalendar size={16} className={fechaInicio ? "text-indigo-400" : "text-zinc-500"} />}
                value={fechaInicio || ""}
                onChange={(e) => setFechaInicio(e.target.value)}
                classNames={fieldClasses}
                style={{ colorScheme: "dark" }}
              />
            </Grid.Col>

            {/* Fecha Fin */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <TextInput
                type="date"
                label="Fecha Fin"
                radius="lg"
                leftSection={<IconCalendar size={16} className={fechaFin ? "text-indigo-400" : "text-zinc-500"} />}
                value={fechaFin || ""}
                onChange={(e) => setFechaFin(e.target.value)}
                classNames={fieldClasses}
                style={{ colorScheme: "dark" }}
              />
            </Grid.Col>

            {/* Lote */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <Select
                label="Lote Mineral"
                placeholder={loadingMetadata ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                disabled={loadingMetadata}
                rightSection={loadingMetadata ? <Loader size={16} /> : undefined}
                data={lotesData}
                value={idLoteMineral}
                onChange={setIdLoteMineral}
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            {/* Placa */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <Select
                label="Placa Vehículo"
                placeholder={loadingMetadata ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                disabled={loadingMetadata}
                rightSection={loadingMetadata ? <Loader size={16} /> : undefined}
                data={placasData}
                value={placa}
                onChange={setPlaca}
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            {/* Condición Ingreso */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <Select
                label="Condición Ingreso"
                placeholder={loadingMetadata ? "Cargando..." : "Seleccione"}
                clearable
                disabled={loadingMetadata}
                rightSection={loadingMetadata ? <Loader size={16} /> : undefined}
                data={conditionsData}
                value={tipoIngreso}
                onChange={setTipoIngreso}
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>

            {/* Empresa Transporte */}
            <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
              <Select
                label="Empresa Transporte"
                placeholder={loadingMetadata ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                disabled={loadingMetadata}
                rightSection={loadingMetadata ? <Loader size={16} /> : undefined}
                data={empresasData}
                value={idEmpresaTransporte}
                onChange={setIdEmpresaTransporte}
                comboboxProps={selectComboboxProps}
                classNames={selectClassNames}
              />
            </Grid.Col>
          </Grid>
        </div>

        {/* Botón de Recargar a la Derecha */}
        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              radius="lg"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={resetFilters}
              className="text-red-400 hover:bg-red-500/10 transition-colors h-9.5 px-6"
            >
              Limpiar
            </Button>
          )}

          <RefreshButton
            onClick={loadResumen}
            loading={loading}
            label="Recargar resumen"
          />
        </div>
      </div>

      {/* Tabla Resumen al estilo Recepción de Unidades */}
      <Stack gap="md">
        <DataTableEstandar
          idAccessor="id_lote"
          records={items}
          loading={loading}
          noRecordsText={
            sucursal?.id_sucursal
              ? "No se encontraron registros de balanza para los filtros aplicados."
              : "Debe seleccionar una sucursal en la parte superior para visualizar la información."
          }
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlign: "center",
              width: 50,
              render: (_: RES_ResumenBalanzaItem, index: number) => index + 1,
            },
            {
              accessor: "tickets",
              title: "Tickets",
              width: 100,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const emp = empresasTransporte.find(e => e.id_empresa_transporte === r.id_empresa_transporte);
                const ruc = emp ? emp.ruc : "";

                const loteTicketDto = {
                  id: r.id_lote,
                  correlativo: r.lote_correlativo,
                  fecha_hora_registro: r.lote_fecha_creacion,
                };

                const loteBalanzaDto = {
                  id: r.id_lote,
                  correlativo: r.lote_correlativo,
                  numero_correlativo: r.lote_numero_correlativo,
                  vehiculo_placa: r.vehiculo_placa,
                  empresa_transporte_ruc: ruc,
                  empresa_transporte_razon_social: r.empresa_transporte_razon_social,
                  tipo_vehiculo_nombre: r.tipo_vehiculo_nombre,
                  conductor_nombre_completo: r.conductor_nombre_completo,
                  proveedor_nombre: r.proveedor_razon_social,
                  observacion_peso_inicial: r.observacion_peso_inicial,
                  observacion_peso_final: r.observacion_peso_final,
                  peso_inicial: r.peso_inicial,
                  fecha_hora_peso_inicial: r.fecha_hora_peso_inicial,
                  peso_final: r.peso_final,
                  fecha_hora_peso_final: r.fecha_hora_peso_final,
                  peso_neto: r.peso_neto,
                };

                return (
                  <Group gap={6} justify="center" wrap="nowrap">
                    <Tooltip label="Ticket Humedad (Código Barras)" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="indigo"
                        radius="md"
                        onClick={() => printTicket(loteTicketDto)}
                        className="text-indigo-400 hover:bg-white/5"
                      >
                        <IconBarcode size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Ticket de Balanza" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="teal"
                        radius="md"
                        onClick={() => printTicketBalanza(loteBalanzaDto)}
                        className="text-teal-400 hover:bg-white/5"
                      >
                        <IconScale size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                );
              },
            },
            {
              accessor: "lote_correlativo",
              title: "Lote",
              width: 140,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="font-semibold text-zinc-200" fw={500}>
                  {r.lote_correlativo}
                </Text>
              ),
            },

            {
              accessor: "lote_fechas",
              title: "Fechas Lote",
              width: 230,
              render: (r: RES_ResumenBalanzaItem) => (
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">Registro:</span>
                    <span className="text-zinc-300 font-mono">{formatFecha(r.lote_fecha_creacion)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">P. Inicial:</span>
                    <span className="text-zinc-300 font-mono">{formatFecha(r.fecha_hora_peso_inicial)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">P. Final:</span>
                    <span className="text-zinc-300 font-mono">{formatFecha(r.fecha_hora_peso_final)}</span>
                  </div>
                </div>
              ),
            },
            {
              accessor: "tipo_ingreso",
              title: "Condición",
              width: 180,
              render: (r: RES_ResumenBalanzaItem) => (
                <Badge
                  variant="light"
                  color={r.tipo_ingreso === "Ficticio" ? "orange" : "indigo"}
                  radius="md"
                  size="sm"
                  className="font-bold uppercase py-2"
                >
                  {r.tipo_ingreso}
                </Badge>
              ),
            },
            {
              accessor: "vehiculo_placa",
              title: "Vehículo / Placa",
              width: 160,
              render: (r: RES_ResumenBalanzaItem) => {
                const fullPlaca = r.vehiculo_placa || "SIN PLACA";
                return (
                  <div className="flex flex-col gap-1 items-start">
                    <div className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wider uppercase font-mono">
                      {fullPlaca}
                    </div>
                    {r.segunda_placa && (
                      <Text size="xs" className="text-zinc-500 mt-0.5">
                        Acople: {r.segunda_placa}
                      </Text>
                    )}
                  </div>
                );
              },
            },
            {
              accessor: "empresa_transporte_razon_social",
              title: "Empresa Transporte",
              width: 200,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-200 max-w-47.5" truncate title={r.empresa_transporte_razon_social || ""}>
                  {r.empresa_transporte_razon_social || (
                    <span className="text-zinc-600 italic">Particular / Propio</span>
                  )}
                </Text>
              ),
            },
            {
              accessor: "lote_numero_contacto",
              title: "Contacto",
              width: 140,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-400 font-mono">
                  {r.lote_numero_contacto || (
                    <span className="text-zinc-600 italic font-sans text-xs">Sin registro</span>
                  )}
                </Text>
              ),
            },
            {
              accessor: "conductor_nombre_completo",
              title: "Conductor",
              width: 200,
              render: (r: RES_ResumenBalanzaItem) => (
                <div>
                  {r.conductor_nombre_completo ? (
                    <>
                      <Text size="sm" className="text-zinc-200" fw={500}>
                        {r.conductor_nombre_completo}
                      </Text>
                      <Text size="xs" className="text-zinc-500">
                        Licencia: {r.conductor_licencia || "—"}
                      </Text>
                    </>
                  ) : (
                    <span className="text-zinc-600 italic">No registrado</span>
                  )}
                </div>
              ),
            },
            {
              accessor: "proveedor_razon_social",
              title: "Proveedor",
              width: 200,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300 font-medium max-w-47.5" truncate title={r.proveedor_razon_social || ""}>
                  {r.proveedor_razon_social || (
                    <span className="text-zinc-600 italic">No registrado</span>
                  )}
                </Text>
              ),
            },
            {
              accessor: "zona_origen_nombre",
              title: "Zona Origen",
              width: 150,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-400">
                  {r.zona_origen_nombre || (
                    <span className="text-zinc-600 italic">No registrada</span>
                  )}
                </Text>
              ),
            },
            {
              accessor: "lote_tipo_producto",
              title: "Producto",
              width: 140,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300">
                  {r.lote_tipo_producto}
                </Text>
              ),
            },
            {
              accessor: "lote_tipo_mineral",
              title: "Mineral",
              width: 140,
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300">
                  {r.lote_tipo_mineral}
                </Text>
              ),
            },
            {
              accessor: "peso_inicial",
              title: "Pesos",
              width: 230,
              render: (r: RES_ResumenBalanzaItem) => {
                const formatTonelada = (valor: number | null) => {
                  if (valor === null) return "---";
                  return `${(valor / 1000).toLocaleString(undefined, {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })} T`;
                };
                return (
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-[11px] text-zinc-500 font-medium  tracking-wide">Inicial</span>
                      <span className="font-mono text-sm text-zinc-400">
                        {formatTonelada(r.peso_inicial)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-[11px] text-zinc-500 font-medium  tracking-wide">Final</span>
                      <span className="font-mono text-sm text-zinc-400">
                        {formatTonelada(r.peso_final)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 w-full pt-1 border-t border-zinc-800/60">
                      <span className="text-[11px] text-emerald-400 font-bold  tracking-wide">Neto</span>
                      {r.peso_neto !== null ? (
                        <Badge
                          variant="gradient"
                          gradient={{ from: "teal", to: "green", deg: 45 }}
                          size="md"
                          radius="md"
                          className="font-extrabold text-zinc-950 px-2.5 py-2.5 shadow-sm shadow-emerald-500/10"
                        >
                          {formatTonelada(r.peso_neto)}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          ---
                        </Text>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              accessor: "evidencias",
              title: "Evidencias",
              width: 140,
              render: (r: RES_ResumenBalanzaItem) => {
                if (!Array.isArray(r.lote_evidencias) || r.lote_evidencias.length === 0) {
                  return <Text size="xs" className="text-zinc-500 italic">Sin archivos</Text>;
                }

                return (
                  <Button
                    size="xs"
                    variant="light"
                    color="indigo"
                    radius="xl"
                    leftSection={<IconPaperclip size={14} />}
                    onClick={() => handleOpenEvidencias(r.lote_evidencias)}
                    className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10"
                  >
                    Ver ({r.lote_evidencias.length})
                  </Button>
                );
              },
            },
            {
              accessor: "observaciones",
              title: "Obs.",
              width: 80,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <div className="flex justify-center">
                  {r.observacion_peso_inicial || r.observacion_peso_final ? (
                    <Tooltip
                      multiline
                      w={280}
                      withArrow
                      transitionProps={{ duration: 150 }}
                      color="zinc.900"
                      label={
                        <Stack gap={4} className="p-1">
                          {r.observacion_peso_inicial && (
                            <div>
                              <Text size="11px" className="font-bold text-amber-400">
                                Peso Inicial:
                              </Text>
                              <Text size="11px" c="white" className="leading-snug">
                                {r.observacion_peso_inicial}
                              </Text>
                            </div>
                          )}
                          {r.observacion_peso_final && (
                            <div>
                              <Text size="11px" className="font-bold text-emerald-400">
                                Peso Final:
                              </Text>
                              <Text size="11px" c="white" className="leading-snug">
                                {r.observacion_peso_final}
                              </Text>
                            </div>
                          )}
                        </Stack>
                      }
                    >
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="indigo"
                        className="text-indigo-400 hover:bg-white/5 rounded-lg"
                      >
                        <IconNote size={16} />
                      </ActionIcon>
                    </Tooltip>
                  ) : (
                    <span className="text-zinc-600 font-light">-</span>
                  )}
                </div>
              ),
            },
            {
              accessor: "acciones",
              title: "Acciones",
              width: 110,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <div className="flex justify-center gap-1.5">
                  <Tooltip label="Editar Lote" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="amber"
                      onClick={() => setEditingLote(r)}
                      className="text-amber-500 hover:bg-white/5 rounded-lg"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Historial de cambios" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => {
                        setLoteHistorial(r);
                        setHistorialModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-lg"
                    >
                      <IconHistory size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </Stack>

      {/* Modal: Evidencias Registradas */}
      <ModalEstandar
        opened={modalOpen}
        close={() => {
          setModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Evidencias Registradas"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>

      {/* Modal: Editar Lote de Mineral */}
      {editingLote && (
        <ModalEditarResumenLote
          opened={!!editingLote}
          lote={editingLote}
          onClose={() => setEditingLote(null)}
          onSuccess={loadResumen}
        />
      )}

      {/* Modal: Historial de cambios */}
      <ModalEstandar
        opened={historialModalOpen}
        close={() => {
          setHistorialModalOpen(false);
          setLoteHistorial(null);
        }}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-amber-400" />
            <span>Historial de Cambios</span>
          </Group>
        }
        size="lg"
        rightSection={
          loteHistorial ? (
            <Text size="xs" c="dimmed" fw={600} className="font-mono">
              LOTE #{loteHistorial.lote_correlativo}
            </Text>
          ) : undefined
        }
      >
        <CambiosLogViewer cambios={loteHistorial?.lote_log_cambios} />
      </ModalEstandar>
    </div>
  );
};
