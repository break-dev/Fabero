import { useState, useEffect, useMemo } from "react";
import {
  Group,
  Button,
  Select,
  Badge,
  ActionIcon,
  Text,
  Stack,
  Paper,
  Box,
  Loader,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconCheck,
  IconBan,
  IconFileText,
  IconHistory,
  IconX,
  IconFiles,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import { AuxService } from "../../../service/auxiliar.service";
import { useValorizacionesCompra } from "../hooks/useValorizacionesCompra";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { ModalFormValorizacionCompra } from "./components/modal-form-valorizacion-compra";
import { ModalAnularValorizacion } from "./components/modal-anular-valorizacion";
import { CambiosLogViewer } from "../../../presentation/utils/cambios-log-viewer";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { EstadoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { IArchivo } from "../../../shared/interfaces/archivo";

const getArchivoObj = (item: unknown): IArchivo => {
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    const nombreOriginal = String(obj.nombre_original || obj.nombre || "archivo");
    const extension = String(obj.extension || nombreOriginal.split(".").pop() || "");
    const pathRelativo = String(obj.path_relativo || obj.path || "");
    let url = String(obj.url || "");
    if (!url && pathRelativo) {
      const backendUrl = import.meta.env.VITE_API_URL || "";
      const baseUrl = backendUrl.replace(/\/api\/?$/, "");
      url = `${baseUrl}/storage/${pathRelativo}`;
    }
    return {
      nombre_original: nombreOriginal,
      extension: extension,
      path_relativo: pathRelativo,
      url: url,
    };
  }

  const pathStr = String(item || "");
  const filename = pathStr.split("/").pop() || pathStr;
  const ext = filename.includes(".") ? filename.split(".").pop() || "" : "";
  const backendUrl = import.meta.env.VITE_API_URL || "";
  const baseUrl = backendUrl.replace(/\/api\/?$/, "");
  return {
    nombre_original: filename,
    extension: ext,
    path_relativo: pathStr,
    url: `${baseUrl}/storage/${pathStr}`,
  };
};

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

export const ValorizacionCompraPage = () => {
  useTitlePage("Valorizaciones de Compra", true);

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  // Filtros adicionales UI con default 7-dóas-atrÃ�s â hoy
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const [modalHistorialOpened, setModalHistorialOpened] = useState(false);
  const [valorizacionHistorial, setValorizacionHistorial] = useState<RES_ValorizacionCompra | null>(null);
  const [modalEvidenciasInfo, setModalEvidenciasInfo] = useState<{
    title: string;
    files: (IArchivo | string)[];
  } | null>(null);

  const historialCambiosCombinados = useMemo(() => {
    if (!valorizacionHistorial) return [];

    type LogCrudo = Record<string, unknown>;
    type LogProcesado = LogCrudo & { motivo: string };

    // Filtra el item "estado: Pendiente â Aprobado" de la lista de cambios,
    // manteniendo intactos los demÃ�s cambios del mismo log (si los hubiera).
    const sinTransicionAprobado = (log: LogCrudo): LogCrudo => {
      const cambios = Array.isArray(log.cambios) ? log.cambios : [];
      const filtrados = (cambios as Array<Record<string, unknown>>).filter(
        (c) =>
          !(c.campo_bd === "estado" && String(c.valor_nuevo ?? "") === "Aprobado"),
      );
      return { ...log, cambios: filtrados };
    };

    const logsHeader: LogProcesado[] = (valorizacionHistorial.log_cambios || [])
      .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
      .map((log) => ({
        ...log,
        motivo: String(log.motivo || "Edición de Valorización de Compra"),
      }));

    const logsDetalles: LogProcesado[] = (valorizacionHistorial.detalles || []).flatMap((d) => {
      const loteNombre = d.lote_correlativo || `ID #${d.id_lote_guia}`;
      const elem = (d.elemento_quimico || "Oro").toUpperCase();
      return (d.log_cambios || [])
        .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
        .map((log) => ({
          ...log,
          motivo: `Lote ${loteNombre} (${elem}) - Modificación de ParÃ�metros`,
        }));
    });

    // Logs de las transacciones de anticipo (monto_retirado, saldo_actual, etc.).
    // Se omite la transición "estado: Pendiente â Aprobado" porque esa se refleja
    // en la aprobación de la valorización, no en cambios editables del usuario.
    const logsTransacciones: LogProcesado[] = (valorizacionHistorial.transacciones_anticipo || []).flatMap(
      (t) => {
        const codigo = t.factura || `Anticipo #${t.id_anticipo_proveedor}`;
        return (t.log_cambios || [])
          .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
          .map((log) => sinTransicionAprobado(log))
          .filter((log) => Array.isArray(log.cambios) && (log.cambios as unknown[]).length > 0)
          .map((log) => ({
            ...log,
            motivo: `Transacción Anticipo ${codigo} â ${valorizacionHistorial.numero_correlativo?.replace(/^VAL/, "") ?? ""}`,
          }));
      },
    );

    const combinados: LogProcesado[] = [...logsHeader, ...logsDetalles, ...logsTransacciones];

    combinados.sort((a, b) => {
      const timeA = new Date(String(a.fecha_hora || a.update_at || 0)).getTime();
      const timeB = new Date(String(b.fecha_hora || b.update_at || 0)).getTime();
      return timeB - timeA;
    });

    return combinados;
  }, [valorizacionHistorial]);

  const handleVerHistorial = (r: RES_ValorizacionCompra) => {
    setValorizacionHistorial(r);
    setModalHistorialOpened(true);
  };

  const {
    idProveedorFiltro,
    setIdProveedorFiltro,
    loading,
    valorizaciones,
    modalFormOpened,
    setModalFormOpened,
    valorizacionEditar,
    modalAnularOpened,
    setModalAnularOpened,
    valorizacionAnular,
    togglingIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleAprobar,
    handleAbrirAnular,
    handleConfirmarAnular,
  } = useValorizacionesCompra();

  useEffect(() => {
    const cargar = async () => {
      setLoadingProveedores(true);
      try {
        const res = await AuxService.get_proveedores({ estado: EstadoBase.Activo });
        if (res.success && res.data) {
          setProveedores(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProveedores(false);
      }
    };
    cargar();
  }, []);

  const hasActiveFilters =
    !!idProveedorFiltro ||
    fechaInicio !== defaultFechaInicio() ||
    fechaFin !== defaultFechaFin() ||
    (filtroEstado && filtroEstado !== "Todos");

  const clearFilters = () => {
    setIdProveedorFiltro(null);
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
    setFiltroEstado("Todos");
  };

  // Filtrado local por fecha y estado
  const valorizacionesFiltradas = useMemo(() => {
    return valorizaciones.filter((item) => {
      if (filtroEstado !== "Todos" && item.estado !== filtroEstado) {
        return false;
      }
      if (fechaInicio) {
        const itemFecha = item.created_at ? item.created_at.split(" ")[0] : "";
        if (itemFecha < fechaInicio) return false;
      }
      if (fechaFin) {
        const itemFecha = item.created_at ? item.created_at.split(" ")[0] : "";
        if (itemFecha > fechaFin) return false;
      }
      return true;
    });
  }, [valorizaciones, filtroEstado, fechaInicio, fechaFin]);

  const getBadgeEstado = (estado: EstadoValorizacionCompra) => {
    switch (estado) {
      case EstadoValorizacionCompra.Pendiente:
        return (
          <Badge color="amber" variant="light" size="sm">
            Pendiente
          </Badge>
        );
      case EstadoValorizacionCompra.Aprobado:
        return (
          <Badge color="emerald" variant="filled" size="sm">
            Aprobado
          </Badge>
        );
      case EstadoValorizacionCompra.Anulado:
        return (
          <Badge color="red" variant="light" size="sm">
            Anulado
          </Badge>
        );
      default:
        return <Badge size="sm">{estado}</Badge>;
    }
  };

  const columns = [
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
      render: (r: RES_ValorizacionCompra) => (
        <Text fw={500} fz="xs" c="cyan.4" className="font-mono">
          {r.correlativo || (r.numero_correlativo ? `VAL-${r.numero_correlativo}` : "-")}
        </Text>
      ),
    },
    {
      accessor: "proveedor_nombre",
      title: "Proveedor",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => (
        <Stack gap={2} align="center">
          <Text fw={600} fz="xs">
            {r.proveedor_nombre}
          </Text>
          <Text fz={11} c="dimmed">
            RUC: {r.proveedor_ruc}
          </Text>
        </Stack>
      ),
    },
    {
      accessor: "concesion_nombre",
      title: "Concesión",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => (
        <Text fz="xs">{r.concesion_nombre || "-"}</Text>
      ),
    },
    {
      accessor: "tipo_pago",
      title: "Tipo Pago",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => (
        <Badge variant="outline" color="blue" size="xs">
          {(r.tipo_pago || "").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessor: "total_subtotal",
      title: "Total Valorización",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => (
        <Text fw={700} c="emerald.4" fz="xs">
          $ {r.total_subtotal.toFixed(2)}
        </Text>
      ),
    },
    {
      accessor: "created_at",
      title: "Fecha Registro",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => (
        <Text fz="xs">{r.created_at ? r.created_at.split(" ")[0] : "-"}</Text>
      ),
    },
    {
      accessor: "estado",
      title: "Estado",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => getBadgeEstado(r.estado),
    },
    {
      accessor: "acciones",
      title: "Acciones",
      textAlign: "center" as const,
      render: (r: RES_ValorizacionCompra) => {
        const isPendiente = r.estado === EstadoValorizacionCompra.Pendiente;
        const isAnulado = r.estado === EstadoValorizacionCompra.Anulado;
        const isBusy = togglingIds[r.id];

        return (
          <Group gap={6} justify="center">
            {isPendiente && (
              <Tooltip label="Editar Valorización">
                <ActionIcon
                  color="yellow"
                  variant="light"
                  size="sm"
                  onClick={() => handleEditar(r)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {isPendiente && (
              <Tooltip label="Aprobar Valorización">
                <ActionIcon
                  color="teal"
                  variant="filled"
                  size="sm"
                  loading={isBusy}
                  disabled={isBusy}
                  onClick={() => {
                    const totalFmt = Number(r.total_subtotal ?? 0).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    mostrarConfirmacion({
                      title: "Aprobar valorización",
                      message: (
                        <div className="space-y-2">
                          <p>
                            Se aprobará la valorización
                            del proveedor {" "} <strong className="text-white">{r.proveedor_nombre}</strong>
                            con un total de {" "}
                            <strong className="text-emerald-400">$ {totalFmt}</strong>.
                          </p>
                          <p className="text-zinc-400 text-xs">
                            Una vez aprobada, la valorización no podrá ser editada.
                          </p>
                        </div>
                      ),
                      confirmLabel: "Sí, aprobar",
                      cancelLabel: "Cancelar",
                      onConfirm: () => handleAprobar(r.id),
                    });
                  }}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {!isAnulado && (
              <Tooltip label="Anular / Eliminar Valorización">
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  loading={isBusy}
                  disabled={isBusy}
                  onClick={() => handleAbrirAnular(r)}
                >
                  <IconBan size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {r.evidencias && r.evidencias.length > 0 && (
              <Tooltip label="Evidencias de Registro">
                <ActionIcon
                  variant="light"
                  color="indigo"
                  size="sm"
                  onClick={() =>
                    setModalEvidenciasInfo({
                      title: `Evidencias de Registro (${r.correlativo || `VAL-${r.id}`})`,
                      files: r.evidencias || [],
                    })
                  }
                >
                  <IconFiles size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {r.evidencias_anulacion && r.evidencias_anulacion.length > 0 && (
              <Tooltip label="Evidencias de Anulación">
                <ActionIcon
                  variant="filled"
                  color="red"
                  size="sm"
                  onClick={() =>
                    setModalEvidenciasInfo({
                      title: `Evidencias de Anulación (${r.correlativo || `VAL-${r.id}`})`,
                      files: r.evidencias_anulacion || [],
                    })
                  }
                >
                  <IconFiles size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label="Historial de Cambios">
              <ActionIcon
                color="blue"
                variant="light"
                size="sm"
                onClick={() => handleVerHistorial(r)}
              >
                <IconHistory size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  // Render expandible: cards compactas para sub-lista de lotes
  const renderRowExpansion = ({ record }: { record: RES_ValorizacionCompra }) => {
    const detallesList = record.detalles || [];

    return (
      <Box p="md" bg="#18181b">
        <Text fw={700} fz="xs" c="amber.4" mb="xs" className="flex items-center gap-1.5">
          <IconFileText size={15} /> Lotes Valorizados ({detallesList.length})
        </Text>

        {detallesList.length === 0 ? (
          <Box p="md" bg="#0f0f12" className="rounded-lg border border-dashed border-zinc-800 text-center">
            <Text fz="xs" c="zinc.5" fs="italic">
              Sin detalle de lotes
            </Text>
          </Box>
        ) : (
          <Stack gap="xs" className="max-h-95 overflow-y-auto pr-1">
            {detallesList.map((d, idx) => {
              const esOro = d.elemento_quimico === "Oro";
              const accentBorder = esOro
                ? "border-l-yellow-500/70"
                : "border-l-slate-400/70";
              return (
                <Paper
                  key={idx}
                  p="xs"
                  radius="md"
                  bg="#18181b"
                  className={`border border-zinc-800 border-l-2 ${accentBorder} hover:border-indigo-500/60 transition-all duration-200`}
                >
                  {/* Header: identificación + Subtotal */}
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" className="min-w-0">
                      <Badge
                        color={esOro ? "yellow" : "gray"}
                        variant="filled"
                        size="xs"
                        fw={700}
                      >
                        {d.elemento_quimico}
                      </Badge>
                      <Text fw={700} fz="xs" c="white" className="font-mono truncate">
                        Lote: {d.lote_correlativo || "-"}
                      </Text>
                      {d.grr && (
                        <Badge variant="outline" color="cyan" size="xs">
                          G.R.R: {d.grr}
                        </Badge>
                      )}
                      {d.grt && (
                        <Badge variant="outline" color="indigo" size="xs">
                          G.R.T: {d.grt}
                        </Badge>
                      )}
                    </Group>

                    <Group gap={6} wrap="nowrap" className="shrink-0">
                      <Text fz={9} c="emerald.4" tt="uppercase" fw={700}>
                        Subtotal
                      </Text>
                      <Text fz="sm" fw={800} c="emerald.3" className="font-mono">
                        $ {d.subtotal.toFixed(2)}
                      </Text>
                    </Group>
                  </Group>

                  {/* Mótricas en una sola lónea con separadores */}
                  <Box
                    mt={6}
                    p="xs"
                    bg="#0f0f12"
                    className="rounded border border-zinc-800"
                  >
                    <Group gap="md" wrap="wrap">
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>TMH (t):</Text>
                        <Text fz={11} fw={700} c="white">{(d.tmh / 1000).toFixed(3)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>% H2O:</Text>
                        <Text fz={11} fw={700} c="cyan.3">{d.ley_humedad.toFixed(2)}%</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>TMS (t):</Text>
                        <Text fz={11} fw={700} c="emerald.3">{(d.tms / 1000).toFixed(3)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Ley:</Text>
                        <Text fz={11} fw={700} c="yellow.3">{d.ley.toFixed(4)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>REC:</Text>
                        <Text fz={11} fw={700} c="amber.3">{d.recuperacion.toFixed(2)}%</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Factor:</Text>
                        <Text fz={11} fw={700} c="white">{d.factor.toFixed(4)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Inter:</Text>
                        <Text fz={11} fw={700} c="white">${d.inter.toFixed(2)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Des.Inter:</Text>
                        <Text fz={11} fw={700} c="white">${d.des_inter.toFixed(2)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Maquila:</Text>
                        <Text fz={11} fw={700} c="white">${d.maquila.toFixed(2)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>React:</Text>
                        <Text fz={11} fw={700} c="white">${d.consumo.toFixed(2)}</Text>
                      </Group>
                      <Text c="zinc.7">·</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text fz={10} c="zinc.5" tt="uppercase" fw={600}>Precio/TN:</Text>
                        <Text fz={11} fw={700} c="white">${d.precio_por_tonelada.toFixed(2)}</Text>
                      </Group>
                    </Group>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Bar Superior de Filtros y Acción */}
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex flex-wrap items-end gap-3 flex-1 w-full">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />

          {/* Proveedor */}
          <div className="w-full sm:w-60">
            <Select
              label="Proveedor"
              placeholder={loadingProveedores ? "Cargando..." : "Todos los proveedores"}
              disabled={loadingProveedores}
              rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
              data={proveedores.map((p) => {
                const idVal = p.id_proveedor ?? (p as unknown as { id: number }).id;
                const doc = p.documento || (p as unknown as { ruc?: string }).ruc || "";
                return {
                  value: String(idVal),
                  label: doc ? `${doc} - ${p.razon_social}` : p.razon_social,
                };
              })}
              value={idProveedorFiltro ? String(idProveedorFiltro) : null}
              onChange={(val) => setIdProveedorFiltro(val ? Number(val) : null)}
              clearable
              searchable
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>

          {/* Estado */}
          <div className="w-full sm:w-40">
            <Select
              label="Estado"
              placeholder="Seleccionar estado"
              data={["Todos", EstadoValorizacionCompra.Pendiente, EstadoValorizacionCompra.Aprobado, EstadoValorizacionCompra.Anulado]}
              value={filtroEstado}
              onChange={(val) => setFiltroEstado(val || "Todos")}
              size="xs"
              radius="lg"
              classNames={fieldClasses}
              comboboxProps={{ withinPortal: true }}
            />
          </div>
        </div>

        {/* Botones de Acción: Limpiar, Recargar y Nueva Valorización */}
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

          <RefreshButton
            onClick={() => void cargarValorizaciones()}
            loading={loading}
            label="Recargar valorizaciones"
          />

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={handleNuevo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Valorización
          </Button>
        </div>
      </div>

      {/* Tabla Principal */}
      <Stack gap="md">
        <DataTableEstandar
          idAccessor="id"
          columns={columns}
          records={valorizacionesFiltradas}
          loading={loading}
          rowExpansion={{
            content: renderRowExpansion,
          }}
        />
      </Stack>

      {/* Modal Formulario de Creación / Edición */}
      <ModalFormValorizacionCompra
        opened={modalFormOpened}
        onClose={() => setModalFormOpened(false)}
        valorizacionEditar={valorizacionEditar}
        onSuccess={cargarValorizaciones}
      />

      {/* Modal Historial de Cambios */}
      <ModalEstandar
        opened={modalHistorialOpened}
        close={() => setModalHistorialOpened(false)}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-amber-400" />
            <Text fw={700} fz="sm" c="white">
              Historial de cambios: {valorizacionHistorial?.numero_correlativo?.replace(/^VAL/, "") ?? "-"}
            </Text>
          </Group>
        }
        size="lg"
        rightSection={
          valorizacionHistorial ? (
            <Text size="xs" c="dimmed" fw={600} className="font-mono">
              VALORIZACIóN #{valorizacionHistorial.id}
            </Text>
          ) : undefined
        }
      >
        <CambiosLogViewer cambios={historialCambiosCombinados as unknown as RES_CambiosLog[]} />
      </ModalEstandar>

      {/* Modal Evidencias */}
      <ModalEstandar
        opened={modalEvidenciasInfo !== null}
        close={() => setModalEvidenciasInfo(null)}
        title={modalEvidenciasInfo?.title || "Evidencias / Documentos Adjuntos"}
        size="md"
      >
        <Stack gap="xs">
          {modalEvidenciasInfo && modalEvidenciasInfo.files.length > 0 ? (
            modalEvidenciasInfo.files.map((filepath, idx) => (
              <ArchivoCard key={idx} archivo={getArchivoObj(filepath)} />
            ))
          ) : (
            <Text size="xs" c="dimmed">
              No se adjuntaron archivos.
            </Text>
          )}
        </Stack>
      </ModalEstandar>

      {/* Modal Anular / Eliminar Valorización */}
      <ModalAnularValorizacion
        opened={modalAnularOpened}
        close={() => setModalAnularOpened(false)}
        valorizacion={valorizacionAnular}
        onConfirm={handleConfirmarAnular}
        loading={valorizacionAnular ? !!togglingIds[valorizacionAnular.id] : false}
      />
    </div>
  );
};

export const ValorizacionesCompraPage = ValorizacionCompraPage;
export default ValorizacionCompraPage;
