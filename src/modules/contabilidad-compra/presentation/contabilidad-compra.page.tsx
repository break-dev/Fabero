import { useEffect, useState } from "react";
import {
  Button,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconPlus, IconX, IconReceipt } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { AuxService } from "../../../service/auxiliar.service";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { EstadoComprobanteCompra } from "../../../shared/enums/contabilidad-compra/estado-comprobante-compra";
import type { RES_Proveedor } from "../../../service/responses/proveedor";

import { useComprobantesCompra } from "../hooks/useComprobantesCompra";
import { usePagosComprobante } from "../hooks/usePagosComprobante";
import { ComprobanteCard } from "./components/comprobante-card";
import { ModalRegistroComprobante } from "./components/modal-registro-comprobante";
import { ModalHistorialPagos } from "./components/modal-historial-pagos";
import { ModalRegistroPago } from "./components/modal-registro-pago";
import { ModalAnularComprobante } from "./components/modal-anular-comprobante";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../presentation/utils/archivo/archivo-card";
import {
  DateRangeFilter,
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type { RES_ComprobanteCompra } from "../service/contabilidad-compra.responses";

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-zinc-500 transition-all h-9.5",
  label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
};

const ESTADOS_FILTRO = [
  "Todos",
  EstadoComprobanteCompra.EnEspera,
  EstadoComprobanteCompra.EnProceso,
  EstadoComprobanteCompra.Pagado,
  EstadoComprobanteCompra.Anulado,
];

export default function ContabilidadCompraPage() {
  useTitlePage("Contabilidad Compra", true);

  const {
    idProveedorFiltro,
    setIdProveedorFiltro,
    estadoFiltro,
    setEstadoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    loading,
    comprobantes,
    anulandoId,
    aprobandoId,
    submitting,
    cargarComprobantes,
    crearComprobante,
    aprobarComprobante,
    anularComprobante,
  } = useComprobantesCompra();

  const { anularPago } = usePagosComprobante();

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);

  const [modalRegistroOpened, setModalRegistroOpened] = useState(false);

  const [comprobanteHistorial, setComprobanteHistorial] =
    useState<RES_ComprobanteCompra | null>(null);

  const [comprobantePago, setComprobantePago] = useState<RES_ComprobanteCompra | null>(null);
  const [submittingPago, setSubmittingPago] = useState(false);

  const [comprobanteAAnular, setComprobanteAAnular] = useState<RES_ComprobanteCompra | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    AuxService.get_proveedores({ estado: EstadoBase.Activo })
      .then((res) => {
        if (!cancelled && res.success && res.data) setProveedores(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingProveedores(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAprobarInline = async (id: number, tipo: TipoAprobacionComprobante) => {
    await aprobarComprobante(id, { tipo });
  };

  const handleConfirmarAnularComprobante = async (motivo: string) => {
    if (!comprobanteAAnular) return;
    const ok = await anularComprobante(comprobanteAAnular.id, { motivo });
    if (ok) {
      setComprobanteAAnular(null);
    }
  };

  const handleAnularPago = async (idPago: number, motivo: string, evidenciasAnulacion?: File[]) => {
    if (!comprobanteHistorial) return;
    await anularPago(idPago, comprobanteHistorial.id, { motivo, evidencias_anulacion: evidenciasAnulacion });
    // Refrescar tarjetas de la vista principal y totales del historial de inmediato
    await cargarComprobantes(false);
    const res = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
    if (res.success && res.data) setComprobanteHistorial(res.data);
  };

  const handleRegistrarPago = async (
    payload: Parameters<typeof import("../service/contabilidad-compra.service").ContabilidadCompraService.registrarPago>[1],
  ): Promise<RES_ComprobanteCompra | null> => {
    if (!comprobantePago) return null;
    setSubmittingPago(true);
    try {
      const res = await ContabilidadCompraService.registrarPago(comprobantePago.id, payload);
      if (!res.success) return null;

      const actualizado = await ContabilidadCompraService.obtenerComprobante(comprobantePago.id);
      await cargarComprobantes(false);
      if (comprobanteHistorial) {
        const r2 = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
        if (r2.success && r2.data) setComprobanteHistorial(r2.data);
      }
      if (actualizado.success && actualizado.data) {
        setComprobantePago(actualizado.data);
        return actualizado.data;
      }
      return null;
    } finally {
      setSubmittingPago(false);
    }
  };

  const handleAbrirRegistroPago = async () => {
    if (!comprobanteHistorial) return;
    // Refrescar el comprobante antes de abrir el modal para evitar datos stale
    // (avance_pago_neto / avance_pago_detraccion desactualizados).
    const res = await ContabilidadCompraService.obtenerComprobante(comprobanteHistorial.id);
    if (res.success && res.data) {
      setComprobanteHistorial(res.data);
      setComprobantePago(res.data);
    }
  };

  const handleVerHistorial = async (id: number) => {
    const res = await ContabilidadCompraService.obtenerComprobante(id);
    if (res.success && res.data) {
      setComprobanteHistorial(res.data);
    }
  };

  const hasActiveFilters =
    idProveedorFiltro !== null ||
    estadoFiltro !== "Todos" ||
    fechaInicio !== defaultFechaInicio() ||
    fechaFin !== defaultFechaFin();

  const clearFilters = () => {
    setIdProveedorFiltro(null);
    setEstadoFiltro("Todos");
    setFechaInicio(defaultFechaInicio());
    setFechaFin(defaultFechaFin());
  };

  return (
    <Stack gap="md" className="animate-fadeIn">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <DateRangeFilter
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
          />
          <Select
            label="Proveedor"
            placeholder={loadingProveedores ? "Cargando..." : "Todos los proveedores"}
            data={proveedores.map((p) => ({
              value: String(p.id_proveedor),
              label: p.razon_social,
            }))}
            value={idProveedorFiltro ? String(idProveedorFiltro) : null}
            onChange={(v) => setIdProveedorFiltro(v ? Number(v) : null)}
            disabled={loadingProveedores}
            rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
            clearable
            searchable
            size="xs"
            radius="lg"
            classNames={fieldClasses}
            comboboxProps={{ withinPortal: true }}
            w={220}
          />
          <Select
            label="Estado"
            placeholder="Todos"
            data={ESTADOS_FILTRO}
            value={estadoFiltro}
            onChange={(v) => setEstadoFiltro(v || "Todos")}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
            comboboxProps={{ withinPortal: true }}
            w={150}
          />
        </Group>

        <Group gap="xs">
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              radius="lg"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          )}
          <RefreshButton
            onClick={() => void cargarComprobantes(false)}
            loading={loading}
            label="Recargar comprobantes"
          />
          <Button
            color="indigo"
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={() => setModalRegistroOpened(true)}
          >
            Nuevo Comprobante
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="md" />
        </Group>
      ) : comprobantes.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-12 text-center">
          <IconReceipt size={48} className="text-zinc-700 mx-auto mb-2" />
          <Text fz="sm" c="dimmed">
            No se encontraron comprobantes con los filtros aplicados.
          </Text>
        </div>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {comprobantes.map((c) => (
            <ComprobanteCard
              key={c.id}
              comprobante={c}
              anulando={anulandoId === c.id}
              aprobandoTipo={aprobandoId[c.id] ?? null}
              onAprobar={(tipo) => void handleAprobarInline(c.id, tipo)}
              onAnular={() => setComprobanteAAnular(c)}
              onVerPagos={() => void handleVerHistorial(c.id)}
              onVerEvidencias={() => {
                setSelectedEvidencias(c.evidencias ?? []);
                setEvidenceModalOpen(true);
              }}
            />
          ))}
        </SimpleGrid>
      )}

      <ModalRegistroComprobante
        opened={modalRegistroOpened}
        onClose={() => setModalRegistroOpened(false)}
        proveedores={proveedores}
        loadingProveedores={loadingProveedores}
        submitting={submitting}
        onSubmit={crearComprobante}
      />

      <ModalHistorialPagos
        opened={comprobanteHistorial !== null}
        onClose={() => setComprobanteHistorial(null)}
        comprobante={comprobanteHistorial}
        onAnularPago={handleAnularPago}
        onRegistrarPago={handleAbrirRegistroPago}
        approving={false}
      />

      {comprobantePago && (
        <ModalRegistroPago
          opened={comprobantePago !== null}
          onClose={() => setComprobantePago(null)}
          comprobante={comprobantePago}
          submitting={submittingPago}
          onSubmit={handleRegistrarPago}
        />
      )}

      <ModalAnularComprobante
        opened={comprobanteAAnular !== null}
        onClose={() => setComprobanteAAnular(null)}
        comprobante={comprobanteAAnular}
        onConfirm={handleConfirmarAnularComprobante}
        loading={anulandoId !== null}
      />

      {/* Modal: Evidencias Registradas */}
      <ModalEstandar
        opened={evidenceModalOpen}
        close={() => {
          setEvidenceModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Evidencias del Comprobante"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>
    </Stack>
  );
}