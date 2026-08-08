import { Stack, Button } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepciones } from "../hooks/useRecepciones";
import { usePerfil } from "../../perfil/hooks/usePerfil";
import { Filtros } from "./components/filtros";
import { TablaRecepciones } from "./components/tabla-recepciones";
import { ProgramarRecepcionModal } from "./components/programar-recepcion-modal";
import { ConfirmarProgramacionModal } from "./components/confirmar-programacion-modal";
import { useState, useEffect } from "react";
import { IconPlus, IconX, IconCalendarTime } from "@tabler/icons-react";
import {
  RecepcionUnidadesService,
} from "../service/recepcion-unidades.service";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";

export const RecepcionUnidadesPage = () => {
  useTitlePage("Recepción de Unidades", true);

  const {
    recepciones,
    loading,
    filters,
    handleFilterChange,
    handleSearch,
    empresas,
    insertRecepcion,
    updateRecepcion,
    clearFilters,
    clearTextFilterAndSearch,
  } = useRecepciones();

  const { perfil } = usePerfil();
  const puedeProgramar = Boolean(perfil?.autoriza_ingreso_unidades);

  const [openRegistro, setOpenRegistro] = useState(false);
  const [openProgramar, setOpenProgramar] = useState(false);

  const [programacionAConfirmar, setProgramacionAConfirmar] =
    useState<RecepcionUnidadResponse | null>(null);
  const [programacionConfirmadaFull, setProgramacionConfirmadaFull] =
    useState<RecepcionUnidadResponse | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (programacionAConfirmar) {
        try {
          const full = await RecepcionUnidadesService.getProgramacion(
            programacionAConfirmar.id,
          );
          if (!cancelado) setProgramacionConfirmadaFull(full);
        } catch {
          if (!cancelado) setProgramacionConfirmadaFull(programacionAConfirmar);
        }
      } else {
        setProgramacionConfirmadaFull(null);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [programacionAConfirmar]);

  const hasActiveFilters =
    !!filters.fecha_inicio ||
    !!filters.fecha_fin ||
    !!filters.placa ||
    filters.id_empresa_transporte !== undefined ||
    !!filters.tipo_ingreso;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <div className="flex-1 w-full">
          <Filtros
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleSearch={handleSearch}
            empresas={empresas}
            onClearTextFilter={clearTextFilterAndSearch}
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

          {puedeProgramar && (
            <Button
              radius="lg"
              size="sm"
              variant="default"
              leftSection={<IconCalendarTime size={18} />}
              onClick={() => setOpenProgramar(true)}
              className="bg-zinc-800! text-zinc-200! border-zinc-700! hover:bg-zinc-700! shadow-md shrink-0 h-9.5 px-5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Programar Recepción
            </Button>
          )}

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconPlus size={18} />}
            onClick={() => setOpenRegistro(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Recepción
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaRecepciones
          recepciones={recepciones}
          loading={loading}
          onUpdateRecepcion={updateRecepcion}
          onConfirmarProgramacion={(r) => setProgramacionAConfirmar(r)}
        />
      </Stack>

      {/* Modal para Registro Directo (No Programado) */}
      <ConfirmarProgramacionModal
        opened={openRegistro}
        programacion={null}
        onClose={() => setOpenRegistro(false)}
        onConfirmada={(nueva) => {
          insertRecepcion(nueva);
          setOpenRegistro(false);
        }}
      />

      {/* Modal para Programar Recepción */}
      <ProgramarRecepcionModal
        opened={openProgramar}
        onClose={() => setOpenProgramar(false)}
        onSuccess={(nueva) => {
          insertRecepcion(nueva);
          setOpenProgramar(false);
        }}
      />

      {/* Modal para Confirmar Programación Existente */}
      <ConfirmarProgramacionModal
        opened={!!programacionAConfirmar}
        programacion={programacionConfirmadaFull ?? programacionAConfirmar}
        onClose={() => {
          setProgramacionAConfirmar(null);
          setProgramacionConfirmadaFull(null);
        }}
        onConfirmada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />


    </div>
  );
};

export default RecepcionUnidadesPage;
