import { useState } from "react";
import {
  Grid,
  Text,
  Button,
  Select,
  Badge,
  ActionIcon,
  Tooltip,
  Stack,
  Group,
  Loader,
  TextInput,
} from "@mantine/core";
import {
  IconNote,
  IconPaperclip,
  IconX,
  IconPencil,
  IconBarcode,
  IconScale,
  IconHistory,
  IconSearch,
} from "@tabler/icons-react";
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
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { RefreshButton } from "../../../presentation/utils/refresh-button";

export const ResumenBalanzaPage = () => {
  useTitlePage("Resumen de Balanza", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);

  const { printTicket } = useTicketLote();
  const { printTicketBalanza, printTicketBalanzaByDistribucionDetalle } = useTicketBalanza();

  const formatFecha = (fechaStr: string | null | undefined) => {
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
    loteCorrelativo,
    setLoteCorrelativo,
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

  // Estados para edición de lote (sólo filas LOTE_RECEPCION)
  const [editingLote, setEditingLote] = useState<RES_ResumenBalanzaItem | null>(null);

  // Estados para historial de cambios
  const [loteHistorial, setLoteHistorial] = useState<RES_ResumenBalanzaItem | null>(null);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);

  const handleOpenEvidencias = (evidencias: IArchivo[]) => {
    setSelectedEvidencias(evidencias);
    setModalOpen(true);
  };

  // Mapear datos para los selects
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

  const textInputClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
  };

  const hasActiveFilters =
    fechaInicio !== defaultFechaInicio() ||
    fechaFin !== defaultFechaFin() ||
    !!loteCorrelativo.trim() ||
    !!placa ||
    !!tipoIngreso ||
    !!idEmpresaTransporte;

  const formatTonelada = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "---";
    return `${(valor / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} T`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera de Filtros */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full animate-fadeIn">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <DateRangeFilter
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onFechaInicioChange={setFechaInicio}
                onFechaFinChange={setFechaFin}
                showClearButton={false}
              />
            </Grid.Col>

            {/* Lote Mineral (búsqueda por correlativo) */}
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <TextInput
                label="Lote Mineral (Correlativo)"
                placeholder="Buscar por correlativo…"
                value={loteCorrelativo}
                onChange={(e) => setLoteCorrelativo(e.currentTarget.value)}
                leftSection={<IconSearch size={14} />}
                classNames={textInputClasses}
                radius="lg"
              />
            </Grid.Col>

            {/* Placa */}
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
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
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
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
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
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

          <RefreshButton onClick={loadResumen} loading={loading} label="Recargar resumen" />
        </div>
      </div>

      {/* Tabla Resumen */}
      <Stack gap="md">
        <DataTableEstandar
          idAccessor="id_row"
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
              width: 110,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const esDespacho = r.tipo_pesaje === "DISTRIBUCION_DETALLE";

                const loteTicketDto = esDespacho
                  ? null
                  : {
                      id: r.id_lote ?? 0,
                      correlativo: r.lote_correlativo ?? "",
                      fecha_hora_registro: r.lote_fecha_creacion ?? "",
                    };

                return (
                  <Group gap={6} justify="center" wrap="nowrap">
                    {/* Ticket Humedad sólo para recepción */}
                    {!esDespacho && loteTicketDto && (
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
                    )}

                    {/* Ticket Balanza: elige endpoint según el tipo de fila */}
                    <Tooltip
                      label={esDespacho ? "Ticket de Despacho" : "Ticket de Balanza"}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color={esDespacho ? "cyan" : "teal"}
                        radius="md"
                        onClick={() => {
                          if (esDespacho && r.id_distribucion_detalle) {
                            printTicketBalanzaByDistribucionDetalle(r.id_distribucion_detalle);
                          } else if (r.id_lote) {
                            printTicketBalanza(r.id_lote);
                          }
                        }}
                        className={
                          esDespacho ? "text-cyan-400 hover:bg-white/5" : "text-teal-400 hover:bg-white/5"
                        }
                      >
                        <IconScale size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                );
              },
            },
            // ── Correlativo consolidado (Lote o Despacho) ──
            {
              accessor: "principal_correlativo",
              title: "Correlativo",
              width: 220,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                if (r.tipo_pesaje === "LOTE_RECEPCION") {
                  return (
                    <Text size="sm" className="font-semibold text-zinc-200" fw={500} ta="center">
                      {r.lote_correlativo}
                    </Text>
                  );
                }
                const origenLine: string[] = [];
                if (r.origen_correlativo) {
                  origenLine.push(r.origen_correlativo);
                }
                if (r.numero_particion != null) {
                  origenLine.push(`P-${r.numero_particion}`);
                }
                return (
                  <div className="flex flex-col gap-0.5 items-center text-center">
                    {origenLine.length > 0 && (
                      <Text
                        size="sm"
                        fw={500}
                        className="text-zinc-100 font-semibold  tracking-wider"
                      >
                        {origenLine.join(" · ")}
                      </Text>
                    )}
                    <Text size="11px" className="text-cyan-400 font-mono leading-tight">
                      {r.despacho_correlativo || "—"}
                    </Text>
                  </div>
                );
              },
            },
            {
              accessor: "fechas_pesaje",
              title: "Fechas Pesaje",
              width: 240,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const esDespacho = r.tipo_pesaje === "DISTRIBUCION_DETALLE";
                const fechaInicial = esDespacho
                  ? r.fecha_hora_peso_tara
                  : r.fecha_hora_peso_bruto;
                const fechaFinal = esDespacho
                  ? r.fecha_hora_peso_bruto
                  : r.fecha_hora_peso_tara;
                return (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500 font-medium">Registro:</span>
                      <span className="text-zinc-300 font-mono">
                        {formatFecha(r.lote_fecha_creacion ?? null)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500 font-medium">Pesaje Inicial:</span>
                      <span className="text-zinc-300 font-mono">{formatFecha(fechaInicial)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500 font-medium">Pesaje Final:</span>
                      <span className="text-zinc-300 font-mono">{formatFecha(fechaFinal)}</span>
                    </div>
                  </div>
                );
              },
            },
            {
              accessor: "tipo_ingreso",
              title: "Condición",
              width: 170,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const colorBadge =
                  r.tipo_ingreso === "Ficticio" ? "orange"
                  : r.tipo_ingreso === TipoIngreso.DespachoMineral ? "cyan"
                  : "indigo";
                return (
                  <div className="flex justify-center">
                    <Badge
                      variant="light"
                      color={colorBadge}
                      radius="md"
                      size="sm"
                      className="font-bold uppercase py-2"
                    >
                      {r.tipo_ingreso}
                    </Badge>
                  </div>
                );
              },
            },
            {
              accessor: "vehiculo_placa",
              title: "Vehículo / Placa",
              width: 160,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const fullPlaca = r.vehiculo_placa || "SIN PLACA";
                return (
                  <div className="flex flex-col gap-1 items-center">
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-200 max-w-47.5 text-center" truncate title={r.empresa_transporte_razon_social || ""}>
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-400 font-mono text-center">
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <div className="text-center">
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300 font-medium max-w-47.5 text-center" truncate title={r.proveedor_razon_social || ""}>
                  {r.proveedor_razon_social || (
                    <span className="text-zinc-600 italic">
                      {r.tipo_pesaje === "DISTRIBUCION_DETALLE" && r.origen_tipo === "BLENDING"
                        ? "N/A (Blending)"
                        : "No registrado"}
                    </span>
                  )}
                </Text>
              ),
            },
            {
              accessor: "zona_origen_nombre",
              title: "Zona Origen",
              width: 150,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-400 text-center">
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300 text-center">
                  {r.lote_tipo_producto ?? "—"}
                </Text>
              ),
            },
            {
              accessor: "lote_tipo_mineral",
              title: "Mineral",
              width: 140,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => (
                <Text size="sm" className="text-zinc-300 text-center">
                  {r.lote_tipo_mineral ?? "—"}
                </Text>
              ),
            },
            // ── Pesos dinámicos según tipo_pesaje ──
            {
              accessor: "pesos",
              title: "Pesos",
              width: 230,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const esDespacho = r.tipo_pesaje === "DISTRIBUCION_DETALLE";
                // Etiquetas siempre muestran el TIPO físico del pesaje (TARA o BRUTO),
                // en el orden que corresponde al flujo:
                //   - RECEPCIÓN: camión llega cargado  → Inicial=Bruto, Final=Tara.
                //   - DESPACHO:  camión llega vacío    → Inicial=Tara,  Final=Bruto.
                const label1 = esDespacho ? "Tara" : "Bruto";
                const label2 = esDespacho ? "Bruto" : "Tara";
                const valorLabel1 = formatTonelada(esDespacho ? r.peso_tara : r.peso_bruto);
                const valorLabel2 = formatTonelada(esDespacho ? r.peso_bruto : r.peso_tara);
                return (
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-[11px] text-zinc-500 font-medium tracking-wide">{label1}</span>
                      <span className="font-mono text-sm text-zinc-400">{valorLabel1}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-[11px] text-zinc-500 font-medium tracking-wide">{label2}</span>
                      <span className="font-mono text-sm text-zinc-400">{valorLabel2}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 w-full pt-1 border-t border-zinc-800/60">
                      <span className="text-[11px] text-emerald-400 font-bold tracking-wide">Neto</span>
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
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const evidencias = r.lote_evidencias ?? [];
                if (!Array.isArray(evidencias) || evidencias.length === 0) {
                  return <Text size="xs" className="text-zinc-500 italic text-center">Sin archivos</Text>;
                }
                return (
                  <div className="flex justify-center">
                    <Button
                      size="xs"
                      variant="light"
                      color="indigo"
                      radius="xl"
                      leftSection={<IconPaperclip size={14} />}
                      onClick={() => handleOpenEvidencias(evidencias)}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10"
                    >
                      Ver ({evidencias.length})
                    </Button>
                  </div>
                );
              },
            },
            {
              accessor: "observaciones",
              title: "Obs.",
              width: 80,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const obs1 = r.observacion_peso_inicial ?? null;
                const obs2 = r.observacion_peso_final ?? null;
                if (!obs1 && !obs2) {
                  return <span className="text-zinc-600 font-light">-</span>;
                }
                return (
                  <div className="flex justify-center">
                    <Tooltip
                      multiline
                      w={280}
                      withArrow
                      transitionProps={{ duration: 150 }}
                      color="zinc.900"
                      label={
                        <Stack gap={4} className="p-1">
                          {obs1 && (
                            <div>
                              <Text size="11px" className="font-bold text-amber-400">
                                Pesaje 1:
                              </Text>
                              <Text size="11px" c="white" className="leading-snug">
                                {obs1}
                              </Text>
                            </div>
                          )}
                          {obs2 && (
                            <div>
                              <Text size="11px" className="font-bold text-emerald-400">
                                Pesaje 2:
                              </Text>
                              <Text size="11px" c="white" className="leading-snug">
                                {obs2}
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
                  </div>
                );
              },
            },
            {
              accessor: "acciones",
              title: "Acciones",
              width: 110,
              textAlign: "center",
              render: (r: RES_ResumenBalanzaItem) => {
                const esDespacho = r.tipo_pesaje === "DISTRIBUCION_DETALLE";
                return (
                  <div className="flex justify-center gap-1.5">
                    {/* Editar Lote: sólo filas LOTE_RECEPCION. Las filas DISTRIBUCION_DETALLE
                        se editan desde el módulo de Despachos. */}
                    {!esDespacho && r.id_lote != null && (
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
                    )}
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
                );
              },
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

      {/* Modal: Editar Lote de Mineral (sólo LOTE_RECEPCION) */}
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
              {loteHistorial.tipo_pesaje === "LOTE_RECEPCION"
                ? `LOTE #${loteHistorial.lote_correlativo ?? ""}`
                : `DESPACHO #${loteHistorial.despacho_correlativo ?? ""} / Part. #${loteHistorial.numero_particion ?? ""}`}
            </Text>
          ) : undefined
        }
      >
        <CambiosLogViewer cambios={loteHistorial?.lote_log_cambios} />
      </ModalEstandar>
    </div>
  );
};
