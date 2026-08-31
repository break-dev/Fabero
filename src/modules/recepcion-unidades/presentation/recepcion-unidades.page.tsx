import { Stack, Button } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useRecepciones } from "../hooks/useRecepciones";
import { Filtros } from "./components/filtros";
import { TablaRecepciones } from "./components/tabla-recepciones";
import { ConfirmarProgramacionModal } from "./components/confirmar-programacion-modal";
import { ModalEditarObservacionEvidencias } from "./components/modal-editar-observacion-evidencias";
import { ModalVerHistorial } from "./components/modal-ver-historial";
import { useEffect, useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import {
  ProgramarRecepcionService,
} from "../../programar-recepcion/service/programar-recepcion.service";
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

  const [openRegistro, setOpenRegistro] = useState(false);

  const [programacionAConfirmar, setProgramacionAConfirmar] =
    useState<RecepcionUnidadResponse | null>(null);
  const [programacionConfirmadaFull, setProgramacionConfirmadaFull] =
    useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAEditar, setRecepcionAEditar] = useState<RecepcionUnidadResponse | null>(null);
  const [recepcionAVerHistorial, setRecepcionAVerHistorial] =
    useState<RecepcionUnidadResponse | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (programacionAConfirmar) {
        try {
          const full = await ProgramarRecepcionService.getProgramacion(
            programacionAConfirmar.id,
          );
          const merged: RecepcionUnidadResponse = {
            ...programacionAConfirmar,
            id_vehiculo: full.id_vehiculo,
            vehiculo_placa: full.vehiculo_placa,
            id_tipo_vehiculo: full.id_tipo_vehiculo,
            tipo_vehiculo_nombre: full.tipo_vehiculo_nombre,
            id_conductor: full.id_conductor,
            conductor_nombre_completo: full.conductor_nombre_completo,
            conductor_dni: full.conductor_dni,
            conductor_numero_licencia: full.conductor_numero_licencia,
            id_sucursal: full.id_sucursal,
            fecha_hora_inicio_pesaje: full.fecha_hora_inicio_pesaje,
            fecha_hora_final_pesaje: full.fecha_hora_final_pesaje,
            estado: full.estado,
            fecha_hora_ingreso: full.fecha_hora_ingreso,
            evidencias: [],
            visita: full.visita as RecepcionUnidadResponse["visita"],
          };
          if (!cancelado) setProgramacionConfirmadaFull(merged);
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
    filters.id_empresa_transporte !== undefined;

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
          onEditarObservacionEvidencias={(r) => setRecepcionAEditar(r)}
          onVerHistorial={(r) => setRecepcionAVerHistorial(r)}
        />
      </Stack>

      <ConfirmarProgramacionModal
        opened={openRegistro}
        programacion={null}
        onClose={() => setOpenRegistro(false)}
        onConfirmada={(nueva) => {
          insertRecepcion(nueva);
          setOpenRegistro(false);
        }}
      />

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

      <ModalEditarObservacionEvidencias
        opened={!!recepcionAEditar}
        recepcion={recepcionAEditar}
        onClose={() => setRecepcionAEditar(null)}
        onGuardada={(actualizada) => {
          updateRecepcion(actualizada);
        }}
      />

      <ModalVerHistorial
        opened={!!recepcionAVerHistorial}
        recepcion={recepcionAVerHistorial}
        onClose={() => setRecepcionAVerHistorial(null)}
      />
    </div>
  );
};

export default RecepcionUnidadesPage;
