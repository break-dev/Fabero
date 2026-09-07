import { Button, Stack } from "@mantine/core";
import { IconTruckDelivery } from "@tabler/icons-react";
import { useState } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useNotify } from "../../../hooks/useNotify";
import { useDespachos } from "../hooks/useDespachos";
import { AuxService } from "../../../service/auxiliar.service";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type {
  CrearDistribucionResult,
  DespachoDetalle,
  DistribucionItem,
} from "../service/programacion-despachos.responses";
import { FiltrosDespachos } from "./components/filtros-despachos";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { TablaDespachos } from "./components/tabla-despachos";
import { RegistroDespachoModal } from "./components/registro-despacho-modal";
import { LogCambiosModal } from "./components/log-cambios-modal";
import { ModalDetalleDespacho } from "./components/modal-detalle-despacho";
import { useDespachoDetalleStore } from "../stores/despacho-detalle.store";

interface PlantaItem {
  id: number;
  ruc: string;
  razon_social: string;
}

interface LogModalState {
  abierto: boolean;
  distribucion: DistribucionItem | null;
}

export const ProgramacionDespachosPage = () => {
  useTitlePage("Programación de Despachos", true);

  const { notifySuccess, notifyError } = useNotify();
  const {
    filtros,
    setFiltros,
    limpiarFiltros,
    despachos,
    loading,
    recargar,
    reemplazarDespacho,
  } = useDespachos();

  const [openRegistroDespacho, setOpenRegistroDespacho] = useState(false);
  const [plantas, setPlantas] = useState<PlantaItem[]>([]);
  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [idDespachoDetalle, setIdDespachoDetalle] = useState<number | null>(null);
  const [logModal, setLogModal] = useState<LogModalState>({
    abierto: false,
    distribucion: null,
  });
  const [anulandoIds, setAnulandoIds] = useState<Record<number, boolean>>({});

  // Carga inicial de plantas destino (no necesita ser async en este componente,
  // se carga una sola vez).
  const [plantasCargadas, setPlantasCargadas] = useState(false);
  if (!plantasCargadas) {
    setPlantasCargadas(true);
    setLoadingPlantas(true);
    AuxService.get_plantas_despachable()
      .then((data) => setPlantas(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error(e);
        notifyError("Error al cargar las plantas destino");
      })
      .finally(() => setLoadingPlantas(false));
  }

  const onDespachoCreado = (nuevo: DespachoDetalle) => {
    reemplazarDespacho(nuevo);
    setOpenRegistroDespacho(false);
    recargar();
  };

  const abrirModalDetalle = (idDespacho: number) => {
    setIdDespachoDetalle(idDespacho);
    setModalDetalleAbierto(true);
  };

  const cerrarModalDetalle = () => {
    setModalDetalleAbierto(false);
    setIdDespachoDetalle(null);
  };

  const onDistribucionCreada = (result: CrearDistribucionResult) => {
    notifySuccess("Distribución registrada correctamente");
    useDespachoDetalleStore.getState().setDetalle(
      result.despacho.cabecera.id,
      result.despacho
    );
    recargar();
  };

  const anularDespacho = (id: number) => {
    setAnulandoIds((prev) => ({ ...prev, [id]: true }));
    ProgramacionDespachosService.anularDespacho(id)
      .then((actualizado) => {
        notifySuccess("Despacho anulado");
        reemplazarDespacho(actualizado);
        recargar();
      })
      .catch((e) => {
        console.error(e);
        notifyError("Error al anular el despacho");
      })
      .finally(() => {
        setAnulandoIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full">
          <FiltrosDespachos
            filtros={filtros}
            setFiltros={setFiltros}
            onLimpiar={limpiarFiltros}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          <RefreshButton
            onClick={() => void recargar()}
            loading={loading}
            label="Recargar despachos"
          />
          <Button
            radius="lg"
            size="sm"
            leftSection={<IconTruckDelivery size={18} />}
            onClick={() => setOpenRegistroDespacho(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Registrar Despacho
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaDespachos
          despachos={despachos}
          loading={loading}
          onVerDetalle={abrirModalDetalle}
          onAnularDespacho={anularDespacho}
          togglingIds={anulandoIds}
        />
      </Stack>

      <RegistroDespachoModal
        opened={openRegistroDespacho}
        onClose={() => setOpenRegistroDespacho(false)}
        plantas={plantas}
        loadingPlantas={loadingPlantas}
        onSuccess={onDespachoCreado}
      />

      <ModalDetalleDespacho
        opened={modalDetalleAbierto}
        idDespacho={idDespachoDetalle}
        onClose={cerrarModalDetalle}
        onDistribucionCreada={onDistribucionCreada}
        onVerLog={(dist) => setLogModal({ abierto: true, distribucion: dist })}
      />

      <LogCambiosModal
        opened={logModal.abierto}
        onClose={() => setLogModal({ abierto: false, distribucion: null })}
        titulo={`Historial — Distribución #${logModal.distribucion?.id ?? ""}`}
        cambios={logModal.distribucion?.log_cambios ?? null}
      />
    </div>
  );
};

export default ProgramacionDespachosPage;
