import { Button, Stack } from "@mantine/core";
import { IconCalendarPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { useProgramaciones, getTodayString } from "../hooks/useProgramaciones";
import { FiltrosProgramaciones } from "./components/filtros-programaciones";
import { TablaProgramaciones } from "./components/tabla-programaciones";
import { ProgramarRecepcionModal } from "./components/programar-modal";

export const ProgramarRecepcionPage = () => {
  useTitlePage("Programar Recepción", true);

  const {
    programaciones,
    loading,
    searchQuery,
    setSearchQuery,
    estadoConfirmacion,
    setEstadoConfirmacion,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    resetFilters,
    insertProgramacion,
  } = useProgramaciones();

  const [openProgramar, setOpenProgramar] = useState(false);

  const todayStr = getTodayString();
  const hasActiveFilters =
    fechaInicio !== todayStr ||
    fechaFin !== todayStr ||
    estadoConfirmacion !== "todos" ||
    !!searchQuery;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row gap-4 items-end justify-between w-full">
        <FiltrosProgramaciones
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          estadoConfirmacion={estadoConfirmacion}
          setEstadoConfirmacion={setEstadoConfirmacion}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
        />

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

          <Button
            radius="lg"
            size="sm"
            leftSection={<IconCalendarPlus size={18} />}
            onClick={() => setOpenProgramar(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 shrink-0 h-9.5 px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Nueva Programación
          </Button>
        </div>
      </div>

      <Stack gap="md">
        <TablaProgramaciones programaciones={programaciones} loading={loading} />
      </Stack>

      <ProgramarRecepcionModal
        opened={openProgramar}
        onClose={() => setOpenProgramar(false)}
        onSuccess={(nueva) => {
          insertProgramacion({
            id: nueva.id,
            id_empleado_autoriza: nueva.id_empleado_autoriza,
            empleado_autoriza_nombre: nueva.empleado_autoriza_nombre,
            id_empresa_transporte: nueva.id_empresa_transporte,
            empresa_transporte_razon_social: nueva.empresa_transporte_razon_social,
            id_vehiculo: nueva.id_vehiculo,
            vehiculo_placa: nueva.vehiculo_placa,
            id_tipo_vehiculo: nueva.id_tipo_vehiculo,
            tipo_vehiculo_nombre: nueva.tipo_vehiculo_nombre,
            id_conductor: nueva.id_conductor,
            conductor_nombre_completo: nueva.conductor_nombre_completo,
            id_proveedor_minero: nueva.id_proveedor_minero,
            proveedor_razon_social: nueva.proveedor_razon_social,
            tipo_ingreso: nueva.tipo_ingreso,
            guia_remitente: nueva.guia_remitente,
            guia_transportista: nueva.guia_transportista,
            fecha_estimada_llegada: nueva.fecha_estimada_llegada,
            observacion: nueva.observacion,
            es_programacion: nueva.es_programacion,
            id_empleado_recepcion: nueva.id_empleado_recepcion,
            fecha_hora_ingreso: nueva.fecha_hora_ingreso,
            estado: nueva.estado,
            created_at: null,
          });
          setOpenProgramar(false);
        }}
      />
    </div>
  );
};

export default ProgramarRecepcionPage;
