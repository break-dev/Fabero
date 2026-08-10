import { useEffect, useState } from "react";
import {
  Text,
  Button,
  Stack,
  TextInput,
  Table,
  Badge,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  IconCalendar,
  IconHistory,
  IconPlus,
  IconX,
  IconPencil,
  IconTrash,
  IconPaperclip,
  IconPrinter,
} from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useUIStore } from "../../../stores/ui.store";
import { useGuiasPrimerTramo } from "../hooks/useGuiasPrimerTramo";
// Forzar a Vite a resolver usePrintGuiaRemitente como .tsx y no como el antiguo .ts
import { usePrintGuiaRemitente } from "../hooks/usePrintGuiaRemitente";
import { usePrintGuiaTransportista } from "../hooks/usePrintGuiaTransportista";
import { ModalGuiaPrimerTramo } from "./components/modal-guia-primer-tramo";
import { HistorialModal } from "./components/historial-modal";
import { DataTableEstandar } from "../../../presentation/utils/datatable-estandar";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../service/guias-primer-tramo.responses";
import { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";

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

  const { printGuia, isPrinting, printingId } = usePrintGuiaRemitente();
  const {
    printGuiaTransportista,
    isPrinting: isPrintingTransportista,
    printingId: printingIdTransportista,
  } = usePrintGuiaTransportista();

  const todayIso = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Filtros
  const [fechaInicio, setFechaInicio] = useState<string>(todayIso());
  const [fechaFin, setFechaFin] = useState<string>(todayIso());

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [editingGuia, setEditingGuia] = useState<RES_GuiaPrimerTramo | null>(null);

  // Visor de evidencias
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

  // Historial de cambios (modal independiente del de edición)
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
    const today = todayIso();
    setFechaInicio(today);
    setFechaFin(today);
    if (idSucursal) {
      fetchGuias({ id_sucursal: idSucursal, fecha_inicio: today, fecha_fin: today });
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
          ¿Está seguro de que desea <strong className="text-red-400">ANULAR</strong> esta guía de primer tramo? Esta acción no se puede deshacer y liberará los lotes asociados.
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
      {/* Filtros + Acciones (estilo compacto) */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <TextInput
            type="date"
            label="Fecha Inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.currentTarget.value)}
            leftSection={<IconCalendar size={14} className="text-zinc-500" />}
            radius="lg"
            size="xs"
            w={200}
            classNames={{
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
            }}
          />
          <TextInput
            type="date"
            label="Fecha Fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.currentTarget.value)}
            leftSection={<IconCalendar size={14} className="text-zinc-500" />}
            radius="lg"
            size="xs"
            w={200}
            classNames={{
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
            }}
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

      {/* Tabla Estandar de guías */}
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
            title: "Fechas Clave",
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
            title: "Guía Remitente",
            render: (g: RES_GuiaPrimerTramo) => {
              const hasGuia = !!(
                g.serie_guia_remitente || g.numero_guia_remitente
              );
              return (
                <div className="flex items-center gap-2">
                  <Text size="xs" fw={500} className="text-zinc-200 font-mono">
                    {hasGuia
                      ? `${g.serie_guia_remitente ?? ""}-${g.numero_guia_remitente ?? ""}`
                      : "—"}
                  </Text>
                  {hasGuia && (
                    <Tooltip label="Imprimir Guía Remitente" withArrow>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="blue"
                        loading={isPrinting && printingId === g.id}
                        onClick={() => printGuia(g)}
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
            title: "Guía Transportista",
            render: (g: RES_GuiaPrimerTramo) => {
              if (g.sin_guia_transportista) {
                return (
                  <Badge color="yellow" variant="outline" size="xs" radius="md">
                    Sin Guía Transp.
                  </Badge>
                );
              }
              const hasGuia = !!(
                g.serie_guia_transportista || g.numero_guia_transportista
              );
              return (
                <div className="flex items-center gap-2">
                  <Text size="xs" className="text-zinc-300 font-mono">
                    {hasGuia
                      ? `${g.serie_guia_transportista ?? ""}-${g.numero_guia_transportista ?? ""}`
                      : "—"}
                  </Text>
                  {hasGuia && (
                    <Tooltip label="Imprimir Guía Transportista" withArrow>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="blue"
                        loading={
                          isPrintingTransportista &&
                          printingIdTransportista === g.id
                        }
                        onClick={() => printGuiaTransportista(g)}
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
            title: "Proveedor / Concesión",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1}>
                <Text size="xs" fw={600} className="text-zinc-100">
                  {g.proveedor_razon_social ?? `ID ${g.id_proveedor}`}
                </Text>
                <Text size="10px" c="emerald.4" fw={500}>
                  Concesión: {g.concesion_nombre ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "conductor",
            title: "Conductor",
            render: (g: RES_GuiaPrimerTramo) => (
              <Stack gap={1}>
                <Text size="xs" fw={600} className="text-zinc-200">
                  {g.conductor_nombre ?? "—"}
                </Text>
                <Text size="10px" c="dimmed" className="font-mono">
                  Lic: {g.conductor_licencia ?? "—"}
                </Text>
              </Stack>
            ),
          },
          {
            accessor: "empresa_transporte",
            title: "Empresa Transporte",
            render: (g: RES_GuiaPrimerTramo) => (
              <Text
                size="xs"
                className="text-zinc-300 font-semibold truncate max-w-50"
                title={g.empresa_transporte_razon_social ?? ""}
              >
                {g.empresa_transporte_razon_social || "—"}
              </Text>
            ),
          },
          {
            accessor: "vehiculo_tractor",
            title: "Vehículo",
            render: (g: RES_GuiaPrimerTramo) => {
              const tractor = g.vehiculo_placa ? g.vehiculo_placa.toUpperCase() : "—";
              return (
                <Text size="xs" className="text-zinc-200 font-mono">
                  {tractor}
                </Text>
              );
            },
          },
          {
            accessor: "vehiculo_carreta",
            title: "Carreta",
            render: (g: RES_GuiaPrimerTramo) => {
              const carreta = g.vehiculo_carreta_placa ? g.vehiculo_carreta_placa.toUpperCase() : null;
              return (
                <Text size="xs" className="text-zinc-300 font-mono">
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
            accessor: "evidencias",
            title: "Evidencias",
            width: 130,
            render: (g: RES_GuiaPrimerTramo) => {
              if (!Array.isArray(g.evidencias) || g.evidencias.length === 0) {
                return (
                  <Text size="xs" className="text-zinc-500 italic">
                    Sin archivos
                  </Text>
                );
              }

              return (
                <Button
                  size="xs"
                  variant="light"
                  color="indigo"
                  radius="xl"
                  leftSection={<IconPaperclip size={14} />}
                  onClick={() => {
                    setSelectedEvidencias(
                      g.evidencias as unknown as IArchivo[],
                    );
                    setEvidenceModalOpen(true);
                  }}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10"
                >
                  Ver ({g.evidencias.length})
                </Button>
              );
            },
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
              {/* Lotes asociados */}
              <div>
                <Text
                  size="xs"
                  fw={700}
                  c="blue.4"
                  tt="uppercase"
                  lts="0.1em"
                  mb="xs"
                >
                  Lotes asociados
                </Text>
                {g.lotes && g.lotes.length > 0 ? (
                  <div className="rounded-lg border border-zinc-800/85 overflow-hidden">
                    <Table verticalSpacing="xs" className="w-full">
                      <thead>
                        <tr className="text-zinc-400 text-[10px] uppercase tracking-wider">
                          <th
                            style={{ width: 50 }}
                            className="text-center py-2 pl-4"
                          >
                            #
                          </th>
                          <th className="text-left py-2">Lote Mineral</th>
                          <th className="text-left py-2">Producto</th>
                          <th className="text-left py-2">Mineral</th>
                          <th className="text-right py-2">P. Bruto</th>
                          <th className="text-right py-2">Tara</th>
                          <th className="text-right py-2 pr-4">P. Neto</th>
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
                            <td className="font-mono text-zinc-100 text-xs py-2 fw-semibold">
                              {l.lote_correlativo ?? "—"}
                            </td>
                            <td className="text-zinc-300 text-xs py-2">
                              {l.tipo_producto ?? "—"}
                            </td>
                            <td className="text-zinc-300 text-xs py-2">
                              {l.tipo_mineral ?? "—"}
                            </td>
                            <td className="text-right font-mono text-zinc-200 text-xs py-2">
                              {l.peso_bruto?.toFixed(2) ?? "—"}
                            </td>
                            <td className="text-right font-mono text-zinc-200 text-xs py-2">
                              {l.tara?.toFixed(2) ?? "—"}
                            </td>
                            <td className="text-right font-mono text-emerald-400 text-xs py-2 pr-4 fw-semibold">
                              {l.peso_neto?.toFixed(2) ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Text size="xs" c="dimmed">
                    Esta guía no tiene lotes asociados.
                  </Text>
                )}
              </div>
            </div>
          ),
        }}
      />

      {/* Modal de creación/edición */}
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

      {/* Modal: Evidencias Registradas */}
      <ModalEstandar
        opened={evidenceModalOpen}
        close={() => {
          setEvidenceModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Evidencias de la Guía"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>

      {/* Modal: Historial de cambios */}
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