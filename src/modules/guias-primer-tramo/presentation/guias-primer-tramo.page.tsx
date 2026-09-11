import { useEffect, useState } from "react";
import {
  Text,
  Button,
  Stack,
  Badge,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  IconHistory,
  IconPlus,
  IconX,
  IconPencil,
  IconTrash,
  IconPrinter,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useUIStore } from "../../../stores/ui.store";
import { useGuiasPrimerTramo } from "../hooks/useGuiasPrimerTramo";
import { ModalGuiaPrimerTramo } from "./components/modal-guia-primer-tramo";
import { HistorialModal } from "./components/historial-modal";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../service/guias-primer-tramo.responses";
import { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";

export const GuiasPrimerTramoPage = () => {
  useTitlePage("Guías Primer Tramo", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal ?? null;

  const {
    guias,
    loading,
    anulandoId,
    crearGuia,
    actualizarGuia,
    anularGuia,
    fetchGuias,
    fetchFiltrosMetadata,
  } = useGuiasPrimerTramo();

  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());

  const [openModal, setOpenModal] = useState(false);
  const [editingGuia, setEditingGuia] = useState<RES_GuiaPrimerTramo | null>(null);

  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [guiaHistorial, setGuiaHistorial] = useState<RES_GuiaPrimerTramo | null>(null);

  useEffect(() => {
    if (idSucursal) {
      fetchGuias({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      fetchFiltrosMetadata(idSucursal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal, fechaInicio, fechaFin]);

  const handleLimpiar = () => {
    const inicio = defaultFechaInicio();
    const fin = defaultFechaFin();
    setFechaInicio(inicio);
    setFechaFin(fin);
    if (idSucursal) {
      fetchGuias({ id_sucursal: idSucursal, fecha_inicio: inicio, fecha_fin: fin });
    }
  };

  const handleSubmit = async (dto: DTO_CrearGuiaPrimerTramo) => {
    await crearGuia(dto);
    setOpenModal(false);
    if (idSucursal) {
      fetchGuias({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      fetchFiltrosMetadata(idSucursal);
    }
  };

  const handleEditSubmit = async (id: number, dto: DTO_ActualizarGuiaPrimerTramo) => {
    await actualizarGuia(id, dto);
    setOpenModal(false);
    setEditingGuia(null);
    if (idSucursal) {
      fetchGuias({
        id_sucursal: idSucursal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      fetchFiltrosMetadata(idSucursal);
    }
  };

  const handleAnular = (id: number) => {
    mostrarConfirmacion({
      title: "Anular Guía de Primer Tramo",
      confirmLabel: "Anular",
      cancelLabel: "Cancelar",
      message: (
        <>
          ¿Está seguro de que desea <strong className="text-red-400">ANULAR</strong> esta guía de primer tramo? Esta acción no se puede deshacer y liberará los items asociados.
        </>
      ),
      onConfirm: async () => {
        try {
          await anularGuia(id);
          if (idSucursal) {
            fetchGuias({
              id_sucursal: idSucursal,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
            });
            fetchFiltrosMetadata(idSucursal);
          }
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const motivoColor = (m: string | null): string => {
    switch (m) {
      case MotivoTraslado.Venta:
        return "indigo";
      case MotivoTraslado.Chancado:
        return "orange";
      default:
        return "zinc";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            leftSection={<IconX size={16} />}
            variant="subtle"
            color="red"
            radius="lg"
            size="sm"
            onClick={handleLimpiar}
          >
            Limpiar
          </Button>
          <RefreshButton
            onClick={() => {
              if (idSucursal) {
                fetchGuias({
                  id_sucursal: idSucursal,
                  fecha_inicio: fechaInicio,
                  fecha_fin: fechaFin,
                });
              }
            }}
            loading={loading}
            disabled={!idSucursal}
            label="Recargar guías"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="lg"
            size="sm"
            onClick={() => setOpenModal(true)}
            disabled={!idSucursal}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20 font-bold"
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      <DataTableEstandar
        idAccessor="id"
        records={guias}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
          },
          {
            accessor: "fechas",
            title: <div className="text-center">Fechas Clave</div>,
            render: (g: RES_GuiaPrimerTramo) => {
              const fechaEmision = g.fecha_emision || g.created_at;
              if (!fechaEmision && !g.fecha_inicio_traslado && !g.fecha_en_planta) {
                return (
                  <Text size="xs" className="text-zinc-500 font-mono">
                    —
                  </Text>
                );
              }
              return (
                <Stack gap={1}>
                  {fechaEmision && (
                    <Text size="11px" c="teal" className="font-mono whitespace-nowrap">
                      Emis: {fechaEmision}
                    </Text>
                  )}
                  {g.fecha_inicio_traslado && (
                    <Text size="11px" c="indigo" className="font-mono whitespace-nowrap">
                      Tras: {g.fecha_inicio_traslado}
                    </Text>
                  )}
                  {g.fecha_en_planta && (
                    <Text size="11px" c="yellow" className="font-mono whitespace-nowrap">
                      Plan: {g.fecha_en_planta}
                    </Text>
                  )}
                </Stack>
              );
            },
          },
          {
            accessor: "guia_remitente",
            title: "GRR",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => {
              const doc = g.documentos?.guia_remitente ?? null;
              const hasGuia = !!g.guia_remitente;
              return (
                <div className="flex items-center justify-center gap-2">
                  <Text size="xs" fw={500} className="text-zinc-200 font-mono">
                    {hasGuia ? g.guia_remitente : "—"}
                  </Text>
                  {doc?.url && (
                    <Tooltip label="Ver Guía Remitente" withArrow>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="blue"
                        onClick={() => window.open(doc.url, "_blank")}
                        className="text-zinc-400 hover:text-blue-400"
                      >
                        <IconPrinter size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
              );
            },
          },
          {
            accessor: "guia_transportista",
            title: "GRT",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => {
              if (g.sin_guia_transportista) {
                return (
                  <Badge color="yellow" variant="outline" size="xs" radius="md">
                    Sin Guía Transp.
                  </Badge>
                );
              }
              const doc = g.documentos?.guia_transportista ?? null;
              const hasGuia = !!g.guia_transportista;
              return (
                <div className="flex items-center justify-center gap-2">
                  <Text size="xs" className="text-zinc-300 font-mono">
                    {hasGuia ? g.guia_transportista : "—"}
                  </Text>
                  {doc?.url && (
                    <Tooltip label="Ver Guía Transportista" withArrow>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="blue"
                        onClick={() => window.open(doc.url, "_blank")}
                        className="text-zinc-400 hover:text-blue-400"
                      >
                        <IconPrinter size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
              );
            },
          },
          {
            accessor: "proveedor",
            title: "Proveedor",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1} align="center">
                <Text size="xs" fw={600} className="text-zinc-100 text-center">
                  {g.proveedor_razon_social ?? `ID ${g.id_proveedor}`}
                </Text>
                <Text size="10px" c="emerald.4" fw={500} className="text-center">
                  Concesión: {g.concesion_nombre ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "conductor",
            title: "Conductor",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1} align="center">
                <Text size="xs" fw={600} className="text-zinc-200 text-center">
                  {g.conductor_nombre ?? "—"}
                </Text>
                <Text size="10px" c="dimmed" className="font-mono text-center">
                  Lic: {g.conductor_licencia ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "empresa_transporte",
            title: "Empresa Transporte",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Text
                size="xs"
                className="text-zinc-300 font-semibold truncate max-w-50 text-center mx-auto"
                title={g.empresa_transporte_razon_social ?? ""}
              >
                {g.empresa_transporte_razon_social || "—"}
              </Text>
            ),
          },
          {
            accessor: "vehiculo_tractor",
            title: "Vehículo",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => {
              const tractor = g.vehiculo_placa ? g.vehiculo_placa.toUpperCase() : "—";
              return (
                <Text size="xs" className="text-zinc-200 font-mono text-center">
                  {tractor}
                </Text>
              );
            },
          },
          {
            accessor: "vehiculo_carreta",
            title: "Carreta",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => {
              const carreta = g.vehiculo_carreta_placa ? g.vehiculo_carreta_placa.toUpperCase() : null;
              return (
                <Text size="xs" className="text-zinc-300 font-mono text-center">
                  {carreta ?? "—"}
                </Text>
              );
            },
          },
          {
            accessor: "motivo",
            title: "Motivo",
            textAlign: "center",
            render: (g: RES_GuiaPrimerTramo) => (
              <Badge
                color={motivoColor(g.motivo_traslado)}
                variant="light"
                size="xs"
                radius="md"
              >
                {g.motivo_traslado ?? "—"}
              </Badge>
            ),
          },
          {
            accessor: "estado",
            title: "Estado",
            textAlign: "center",
            width: 100,
            render: (g: RES_GuiaPrimerTramo) => {
              const isActivo = g.estado === EstadoBase.Activo;
              return (
                <Badge
                  color={isActivo ? "emerald" : "red"}
                  variant="light"
                  size="xs"
                  radius="md"
                >
                  {isActivo ? "ACTIVO" : "ANULADA"}
                </Badge>
              );
            },
          },
          {
            accessor: "acciones",
            title: "Acciones",
            textAlign: "center",
            width: 120,
            render: (g: RES_GuiaPrimerTramo) => {
              const isActivo = g.estado === EstadoBase.Activo;
              return (
                <div className="flex gap-2 justify-center">
                  <Tooltip label="Editar Guía" withArrow disabled={!isActivo}>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="blue"
                      onClick={() => {
                        setEditingGuia(g);
                        setOpenModal(true);
                      }}
                      disabled={!isActivo}
                      className="text-zinc-400 hover:text-blue-400 disabled:opacity-20"
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Historial de cambios" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => {
                        setGuiaHistorial(g);
                        setHistorialModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-amber-400"
                    >
                      <IconHistory size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Anular Guía" withArrow disabled={!isActivo}>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleAnular(g.id)}
                      disabled={!isActivo}
                      loading={anulandoId === g.id}
                      className="text-zinc-400 hover:text-rose-400 disabled:opacity-20"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              );
            },
          },
        ]}
        rowExpansion={{
          content: ({ record: g }: { record: RES_GuiaPrimerTramo }) => (
            <div className="p-4 border border-zinc-800/80 rounded-xl bg-transparent m-3">
              <Text
                size="xs"
                fw={700}
                c="blue.4"
                tt="uppercase"
                lts="0.1em"
                mb="xs"
              >
                Items Asociados
              </Text>
              {g.lotes && g.lotes.length > 0 ? (
                <div className="rounded-lg border border-zinc-800/85 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-zinc-400 text-[10px] uppercase tracking-wider">
                        <th style={{ width: 50 }} className="text-center py-2 pl-4">#</th>
                        <th className="text-center py-2">Tipo</th>
                        <th className="text-center py-2">Correlativo</th>
                        <th className="text-center py-2">P. Bruto</th>
                        <th className="text-center py-2">Tara</th>
                        <th className="text-center py-2 pr-4">P. Neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.lotes.map((l, idx) => (
                        <tr
                          key={l.id}
                          className="border-b border-zinc-900/40 bg-transparent hover:bg-transparent"
                        >
                          <td className="text-zinc-400 font-mono text-xs text-center py-2 pl-4">
                            {idx + 1}
                          </td>
                          <td className="py-2 text-xs text-center">
                            <Badge
                              variant="light"
                              color={l.tipo_item === "PARTICION" ? "violet" : "teal"}
                              size="sm"
                              radius="md"
                              className="font-bold uppercase"
                            >
                              {l.tipo_item}
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-2 w-full">
                              <Text size="xs" fw={600} className="text-zinc-100 font-mono">
                                {l.correlativo ?? "—"}
                              </Text>
                            </div>
                          </td>
                          <td className="text-center font-mono text-zinc-200 text-xs py-2">
                            {l.peso_inicial?.toFixed(2) ?? "—"}
                          </td>
                          <td className="text-center font-mono text-zinc-200 text-xs py-2">
                            {l.peso_final?.toFixed(2) ?? "—"}
                          </td>
                          <td className="text-center font-mono text-emerald-400 text-xs py-2 pr-4 fw-semibold">
                            {l.peso_neto?.toFixed(2) ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Text size="xs" c="dimmed">
                  Esta guía no tiene items asociados.
                </Text>
              )}
            </div>
          ),
        }}
      />

      {idSucursal && (
        <ModalGuiaPrimerTramo
          opened={openModal}
          idSucursal={idSucursal}
          guia={editingGuia}
          onClose={() => {
            setOpenModal(false);
            setEditingGuia(null);
          }}
          onSubmit={handleSubmit}
          onUpdate={handleEditSubmit}
        />
      )}

      <HistorialModal
        guia={guiaHistorial}
        opened={historialModalOpen}
        onClose={() => {
          setHistorialModalOpen(false);
          setGuiaHistorial(null);
        }}
      />
    </div>
  );
};
