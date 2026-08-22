import { Button, Stack } from "@mantine/core";
import { IconTruckDelivery } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useNotify } from "../../../hooks/useNotify";
import { useDespachos } from "../hooks/useDespachos";
import { AuxService } from "../../../service/auxiliar.service";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type {
  CrearDistribucionResult,
  DespachoDetalle,
  DespachoDetalleItem,
  DistribucionItem,
} from "../service/programacion-despachos.responses";
import { FiltrosDespachos } from "./components/filtros-despachos";
import { TablaDespachos } from "./components/tabla-despachos";
import { RegistroDespachoModal } from "./components/registro-despacho-modal";
import { RegistroDistribucionModal } from "./components/registro-distribucion-modal";
import { LogCambiosModal } from "./components/log-cambios-modal";
import { DespachoExpandido } from "./components/despacho-expandido";
import { useDespachoDetalleStore } from "../stores/despacho-detalle.store";

interface PlantaItem {
  id: number;
  ruc: string;
  razon_social: string;
}

interface ModalDistribucionState {
  abierto: boolean;
  idDespacho: number | null;
  detalles: DespachoDetalleItem[];
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
  const [modalDistribucion, setModalDistribucion] = useState<ModalDistribucionState>({
    abierto: false,
    idDespacho: null,
    detalles: [],
  });
  const [logModal, setLogModal] = useState<LogModalState>({
    abierto: false,
    distribucion: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingPlantas(true);
    AuxService.get_plantas_despachable()
      .then((data) => {
        if (!cancelled) setPlantas(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) notifyError("Error al cargar las plantas destino");
      })
      .finally(() => {
        if (!cancelled) setLoadingPlantas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  const onDespachoCreado = (nuevo: DespachoDetalle) => {
    reemplazarDespacho(nuevo);
    setOpenRegistroDespacho(false);
    recargar();
  };

  const abrirModalDistribucion = async (idDespacho: number, detalles: DespachoDetalleItem[]) => {
    setModalDistribucion({ abierto: true, idDespacho, detalles });
  };

  const onDistribucionCreada = (result: CrearDistribucionResult) => {
    notifySuccess("Distribución registrada correctamente");
    recargar();
    // Invalidar cache del detalle del despacho para que la próxima vez que se
    // expanda el row (o si está expandido) se haga fetch con la nueva distribución.
    useDespachoDetalleStore.getState().invalidar(result.despacho.cabecera.id);
    setModalDistribucion({ abierto: false, idDespacho: null, detalles: [] });
  };

  const confirmarDistribucion = (id: number) => {
    ProgramacionDespachosService.confirmarDistribucion(id)
      .then(() => {
        notifySuccess("Distribución confirmada");
        recargar();
      })
      .catch((e) => {
        console.error(e);
        notifyError("Error al confirmar la distribución");
      });
  };

  const registrarSalida = (id: number) => {
    ProgramacionDespachosService.registrarSalida(id, {})
      .then(() => {
        notifySuccess("Salida de planta registrada");
        recargar();
      })
      .catch((e) => {
        console.error(e);
        notifyError("Error al registrar la salida");
      });
  };

  const registrarLlegada = (id: number) => {
    ProgramacionDespachosService.registrarLlegada(id)
      .then(() => {
        notifySuccess("Llegada al cliente registrada");
        recargar();
      })
      .catch((e) => {
        console.error(e);
        notifyError("Error al registrar la llegada");
      });
  };

  const anularDespacho = (id: number) => {
    ProgramacionDespachosService.anularDespacho(id)
      .then((actualizado) => {
        notifySuccess("Despacho anulado");
        reemplazarDespacho(actualizado);
        recargar();
      })
      .catch((e) => {
        console.error(e);
        notifyError("Error al anular el despacho");
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

      <Stack gap="md">
        <TablaDespachos
          despachos={despachos}
          loading={loading}
          renderExpandedRow={(record) => (
            <DespachoExpandido
              idDespacho={record.id}
              onAgregarDistribucion={abrirModalDistribucion}
              onConfirmarDistribucion={confirmarDistribucion}
              onRegistrarSalida={registrarSalida}
              onRegistrarLlegada={registrarLlegada}
              onAnularDespacho={anularDespacho}
              onVerLog={(dist) =>
                setLogModal({ abierto: true, distribucion: dist })
              }
              togglingIds={{}}
            />
          )}
        />
      </Stack>

      <RegistroDespachoModal
        opened={openRegistroDespacho}
        onClose={() => setOpenRegistroDespacho(false)}
        plantas={plantas}
        loadingPlantas={loadingPlantas}
        onSuccess={onDespachoCreado}
      />

      {modalDistribucion.abierto && modalDistribucion.idDespacho !== null && (
        <RegistroDistribucionModal
          opened={modalDistribucion.abierto}
          onClose={() =>
            setModalDistribucion({ abierto: false, idDespacho: null, detalles: [] })
          }
          idDespacho={modalDistribucion.idDespacho}
          detallesDespacho={modalDistribucion.detalles}
          onSuccess={onDistribucionCreada}
        />
      )}

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