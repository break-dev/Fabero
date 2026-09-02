import { useEffect, useState } from "react";
import { Stack, Button } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepcionVisitas } from "../hooks/useRecepcionVisitas";
import { Filtros } from "./components/filtros";
import { TablaVisitas } from "./components/tabla-visitas";
import { RegistroVisita } from "./components/registro-visita";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { RefreshButton } from "../../../presentation/utils/refresh-button";
import { IconPlus, IconX } from "@tabler/icons-react";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import "../hooks/useModuleAIContext";
import {
  useRecepcionVisitasContextStore,
  type IResumenVisita,
} from "../stores/recepcion-visitas-context.store";
import { useIAStore } from "../../../stores/ia.store";
import type { IModuleAIContext } from "../../../service/ia/ia.types";

export const RecepcionVisitasPage = () => {
  useTitlePage("Recepción de Visitas",true);

  const {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
    fetchRecepciones,
  } = useRecepcionVisitas();

  const [openRegistro, setOpenRegistro] = useState(false);

  const setFiltros = useRecepcionVisitasContextStore((s) => s.setFiltros);
  const setModalRegistroAbierto = useRecepcionVisitasContextStore(
    (s) => s.setModalRegistroAbierto,
  );
  const setResumenRecepciones = useRecepcionVisitasContextStore(
    (s) => s.setResumenRecepciones,
  );

  useEffect(() => {
    setFiltros({
      fecha_inicio: filters.fecha_inicio ?? null,
      fecha_fin: filters.fecha_fin ?? null,
    });
  }, [filters.fecha_inicio, filters.fecha_fin, setFiltros]);

  useEffect(() => {
    setModalRegistroAbierto(openRegistro);
  }, [openRegistro, setModalRegistroAbierto]);

  useEffect(() => {
    const resumen: IResumenVisita[] = recepciones.map((r) => ({
      id: r.id,
      motivo: r.motivo_ingreso_nombre,
      empleado_contacto: r.empleado_contacto_nombre ?? null,
      fecha_hora_ingreso: r.fecha_hora_ingreso,
      con_vehiculo: r.con_vehiculo,
      placa: r.placa ?? null,
      total_visitantes: r.visitantes?.length ?? 0,
      estado: r.estado ?? null,
    }));
    setResumenRecepciones(resumen);
  }, [recepciones, setResumenRecepciones]);

  // --- Push dinámico del contexto del módulo a ia.store (lo que observa el panel) ---
  const filtrosCtx = useRecepcionVisitasContextStore((s) => s.filtros);
  const totalCtx = useRecepcionVisitasContextStore((s) => s.total_recepciones);
  const resumenCtx = useRecepcionVisitasContextStore(
    (s) => s.resumen_recepciones,
  );
  const modalCtx = useRecepcionVisitasContextStore(
    (s) => s.modal_registro_abierto,
  );
  const formCtx = useRecepcionVisitasContextStore((s) => s.form_en_curso);

  useEffect(() => {
    const ctx: IModuleAIContext = {
      titulo: "Recepción de Visitas",
      descripcion:
        `Registro de visitas a la planta: motivo, personal de contacto, vehículo y lista de visitantes con su documento de identidad. ` +
        `Actualmente hay ${totalCtx} recepción(es) cargada(s) en el listado.`,
      instrucciones:
        "Responde sobre cómo registrar una visita, qué datos se requieren del visitante, qué adjuntos son obligatorios y cómo se relaciona con la Recepción de Unidades. " +
        "Si los datos del módulo están disponibles, úsalos como referencia (no como fuente de verdad absoluta). " +
        "Si el modal de registro está abierto, prioriza responder sobre los datos que el usuario está completando actualmente.",
      datos: {
        filtros: filtrosCtx,
        total_recepciones_cargadas: totalCtx,
        recepciones_recientes: resumenCtx.slice(0, 8),
        modal_registro_abierto: modalCtx,
        form_en_curso: formCtx,
      },
    };
    useIAStore.getState().setContextoModulo(ctx);
  }, [filtrosCtx, totalCtx, resumenCtx, modalCtx, formCtx]);

  const hasActiveFilters =
    filters.fecha_inicio !== defaultFechaInicio() ||
    filters.fecha_fin !== defaultFechaFin();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full">
          <Filtros
            filters={filters}
            handleFilterChange={handleFilterChange}
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

          <RefreshButton onClick={fetchRecepciones} loading={loading} label="Recargar visitas" />

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={() => setOpenRegistro(true)}
            className="bg-[#7A604D] hover:bg-[#8c6d53] text-white shadow-lg shadow-zinc-900/40 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaVisitas
          recepciones={recepciones}
          loading={loading}
          onUpdateRecepcion={updateRecepcion}
        />
      </Stack>

      {/* Modal: Registrar Ingreso / Recepción de Visitas */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nuevo Registro de Visita"
        size="lg"
      >
        <RegistroVisita
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(r) => {
            insertRecepcion(r);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>
    </div>
  );
};
