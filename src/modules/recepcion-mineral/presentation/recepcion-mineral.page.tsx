import { useState, useEffect } from "react";
import { Grid, Paper, Text, Button, Group, ActionIcon, Badge, Center, Loader, Stack } from "@mantine/core";
import { IconScale, IconPlus, IconChecklist, IconPencil } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { useRecepcionMineral } from "../hooks/useRecepcionMineral";
import { AuxService } from "../../../service/auxiliar.service";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ModalPesoInicial } from "./components/modal-peso-inicial";
import { ModalPesoFinal } from "./components/modal-peso-final";
import { ModalUnidadFicticia } from "./components/modal-unidad-ficticia";
import { ModalCondicionIngreso } from "./components/modal-condicion-ingreso";
import { CardProcesoBalanza } from "./components/card-proceso-balanza";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_Empresa } from "../../../service/responses/empresa";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RES_LoteMineral, RecepcionMineralResponse } from "../service/recepcion-mineral.responses";
import { useUIStore } from "../../../stores/ui.store";
import { useTicketBalanza } from "../hooks/useTicketBalanza";

export const RecepcionMineralPage = () => {
  useTitlePage("Recepción de Mineral", true);

  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const { printTicketBalanza } = useTicketBalanza();

  const {
    sinPesarList,
    enProcesoList,
    loading,
    selectedRecepcion,
    setSelectedRecepcion,
    validarCampo,
    creatingLoteId,
    deletingLoteId,
    closingProcesoId,
    iniciarProceso,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    cerrarProceso,
    crearUnidadFicticia,
  } = useRecepcionMineral();

  const getFullPlaca = (serie: string | null, placa: string | null) => {
    if (!placa) return "SIN PLACA";
    return serie ? `${serie}-${placa}` : placa;
  };

  // Catálogos para el panel de la unidad (izquierda) y modal de lote
  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [empresasTitulares, setEmpresasTitulares] = useState<RES_Empresa[]>([]);


  // Modales
  const [activeLotePesoInicial, setActiveLotePesoInicial] = useState<RES_LoteMineral | null>(null);
  const [activeLotePesoFinal, setActiveLotePesoFinal] = useState<RES_LoteMineral | null>(null);
  const [openFicticiaModal, setOpenFicticiaModal] = useState(false);
  const [editingFicticia, setEditingFicticia] = useState<RecepcionMineralResponse | null>(null);

  // Modal para condición de ingreso de lote
  const [condicionModalOpen, setCondicionModalOpen] = useState(false);
  const [selectedRecepcionIdForLote, setSelectedRecepcionIdForLote] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [resEmp, resTipos, resVeh, resCond, resEmpTit] = await Promise.all([
          AuxService.get_empresas_transporte(),
          AuxService.get_tipos_vehiculo(),
          AuxService.get_vehiculos(),
          AuxService.get_conductores(),
          AuxService.get_empresas(),
        ]);
        if (isMounted) {
          setEmpresas(resEmp);
          setTiposVehiculo(resTipos);
          setVehiculos(resVeh);
          setConductores(resCond);
          if (resEmpTit?.data) {
            setEmpresasTitulares(resEmpTit.data);
          }
        }
      } catch (e) {
        console.error("Error al cargar catálogos para edición", e);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const unidadesAOperar = enProcesoList;

  return (
    <div className="space-y-6 animate-fadeIn">
      {loading && (
        <Center className="py-12">
          <Loader color="indigo" size="md" />
        </Center>
      )}

      {!loading && (
        <Grid columns={24} gutter="md">
          {/* Lateral Izquierdo: Unidades en Planta (Sin Pesar) */}
          <Grid.Col span={{ base: 24, sm: 8, md: 6, lg: 5 }}>
            <Paper
              radius="lg"
              p="md"
              className="bg-zinc-950/40 border border-zinc-900/80 min-h-125 h-full flex flex-col gap-4"
            >
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconChecklist
                    size={18}
                    className="text-indigo-400 shrink-0"
                  />
                  <Text
                    size="sm"
                    fw={700}
                    className="text-zinc-100 truncate"
                    title="Unidades en Planta"
                  >
                    Unidades en Planta
                  </Text>
                </div>
                <Button
                  radius="md"
                  size="xs"
                  onClick={() => setOpenFicticiaModal(true)}
                  disabled={!sucursal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 h-7 w-7 p-0 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Unidad Ficticia"
                >
                  <IconPlus size={16} />
                </Button>
              </div>

              <Stack gap="sm" className="flex-1 overflow-y-auto pr-1">
                {sinPesarList.length === 0 ? (
                  <Center className="h-40 flex-col gap-2">
                    <Text size="xs" c="dimmed" ta="center">
                      No hay unidades pendientes de pesaje en esta sucursal.
                    </Text>
                  </Center>
                ) : (
                  sinPesarList.map((ru) => {
                    const isSelected = selectedRecepcion?.id === ru.id;
                    const formatFechaHora = (
                      s: string | null | undefined,
                    ): { fecha: string; hora: string } => {
                      if (!s) return { fecha: "---", hora: "---" };
                      const d = new Date(s);
                      if (isNaN(d.getTime()))
                        return { fecha: "---", hora: "---" };
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      return {
                        fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
                        hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
                      };
                    };
                    const { fecha: formattedDate, hora: formattedTime } =
                      formatFechaHora(ru.fecha_hora_ingreso);

                    return (
                      <Paper
                        key={ru.id}
                        radius="lg"
                        p={0}
                        onClick={() => {
                          if (ru.estado_pesaje === "Sin Pesar") {
                            mostrarConfirmacion({
                              title: "Confirmar Inicio de Pesaje",
                              confirmLabel: "Iniciar",
                              cancelLabel: "Cancelar",
                              message: (
                                <>
                                  ¿Desea iniciar el proceso de pesaje para la
                                  unidad con placa{" "}
                                  <strong className="text-indigo-400">
                                    "
                                    {getFullPlaca(
                                      ru.vehiculo_serie,
                                      ru.vehiculo_placa,
                                    )}
                                    "
                                  </strong>
                                  ?
                                </>
                              ),
                              onConfirm: () => {
                                iniciarProceso(ru.id);
                              },
                            });
                          } else {
                            setSelectedRecepcion(ru);
                          }
                        }}
                        className={`cursor-pointer border transition-all duration-200 select-none overflow-hidden flex flex-col relative bg-zinc-950/30 border-zinc-900/80 `}
                      >
                        {/* Header: Placa */}
                        <div
                          className={`py-2 px-3 text-center font-bold text-xs tracking-wider font-mono uppercase bg-zinc-800 text-zinc-300`}
                        >
                          <Group justify="center" gap={8} wrap="nowrap">
                            <span className="truncate">
                              {getFullPlaca(
                                ru.tipo_ingreso === "Ficticio"
                                  ? null
                                  : ru.vehiculo_serie,
                                ru.vehiculo_placa,
                              )}
                            </span>
                            {ru.tipo_ingreso === "Ficticio" && (
                              <Badge
                                variant="filled"
                                size="xs"
                                radius="md"
                                className="font-extrabold tracking-wider shrink-0 bg-zinc-700 text-zinc-100 border border-zinc-600/60"
                              >
                                FICTICIA
                              </Badge>
                            )}
                            {ru.tipo_ingreso === "Ficticio" && (
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                radius="md"
                                className={`shrink-0 transition-colors ${
                                  isSelected
                                    ? "text-zinc-950 hover:bg-zinc-950/30"
                                    : "text-zinc-300 hover:bg-zinc-700/40"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFicticia(ru);
                                }}
                                title="Editar fecha y hora"
                              >
                                <IconPencil size={12} stroke={2} />
                              </ActionIcon>
                            )}
                          </Group>
                        </div>

                        {/* Body: Fechas */}
                        <div className="p-3 space-y-1.5 bg-zinc-900/10">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">
                              Fecha Ingreso
                            </span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400 font-medium">
                              Hora Ingreso
                            </span>
                            <span className="text-zinc-200 font-mono font-bold">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Área Central: Proceso de Pesaje y Lotes */}
          <Grid.Col span={{ base: 24, sm: 16, md: 18, lg: 19 }}>
            <Paper
              radius="lg"
              p="md"
              className="bg-zinc-950/40 border border-zinc-900/80 min-h-125 h-full flex flex-col gap-4 "
            >
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <div>
                  <Text size="md" fw={700} className="text-zinc-200">
                    Proceso de Pesaje y Lotes
                  </Text>
                </div>
              </div>

              {/* Contenido Dinámico */}
              {unidadesAOperar.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center py-12 gap-3">
                  <IconScale size={48} className="text-zinc-600 stroke-[1.5]" />
                  <Text size="sm" c="dimmed" ta="center">
                    Ningún proceso de pesaje activo. Seleccione una unidad del
                    listado izquierdo para iniciar su pesaje.
                  </Text>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-8 overflow-y-auto min-h-0 pr-2">
                  {unidadesAOperar.map((ru) => (
                    <CardProcesoBalanza
                      key={ru.id}
                      ru={ru}
                      empresas={empresas}
                      tiposVehiculo={tiposVehiculo}
                      vehiculos={vehiculos}
                      conductores={conductores}
                      setSelectedRecepcionIdForLote={
                        setSelectedRecepcionIdForLote
                      }
                      setCondicionModalOpen={setCondicionModalOpen}
                      crearLoteLoadingId={creatingLoteId}
                      deletingLoteId={deletingLoteId}
                      closingProcesoId={closingProcesoId}
                      validarCampo={validarCampo}
                      eliminarLote={eliminarLote}
                      printTicketBalanza={printTicketBalanza}
                      setActiveLotePesoInicial={setActiveLotePesoInicial}
                      setActiveLotePesoFinal={setActiveLotePesoFinal}
                      cerrarProceso={cerrarProceso}
                    />
                  ))}
                </div>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {/* Modal: Peso Inicial */}
      {activeLotePesoInicial && (
        <ModalEstandar
          opened={!!activeLotePesoInicial}
          close={() => setActiveLotePesoInicial(null)}
          title={`Peso Inicial: ${activeLotePesoInicial.correlativo}`}
          size="lg"
        >
          <ModalPesoInicial
            lote={activeLotePesoInicial}
            onCancel={() => setActiveLotePesoInicial(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) =>
                r.lotes?.some((l) => l.id === loteId),
              );
              if (ru) {
                const loteActualizado = await registrarPesoInicial(
                  ru.id,
                  loteId,
                  dto,
                );
                setActiveLotePesoInicial(null);
                if (loteActualizado) {
                  printTicketBalanza(loteActualizado.id);
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Peso Final */}
      {activeLotePesoFinal && (
        <ModalEstandar
          opened={!!activeLotePesoFinal}
          close={() => setActiveLotePesoFinal(null)}
          title={`Peso Final para Lote: ${activeLotePesoFinal.correlativo}`}
          size="xl"
        >
          <ModalPesoFinal
            lote={activeLotePesoFinal}
            onCancel={() => setActiveLotePesoFinal(null)}
            onSubmit={async (loteId, dto) => {
              const ru = enProcesoList.find((r) =>
                r.lotes?.some((l) => l.id === loteId),
              );
              if (ru) {
                const loteActualizado = await registrarPesoFinal(
                  ru.id,
                  loteId,
                  dto,
                );
                setActiveLotePesoFinal(null);
                if (loteActualizado) {
                  printTicketBalanza(loteActualizado.id);
                }
              }
            }}
          />
        </ModalEstandar>
      )}

      {/* Modal: Unidad Ficticia (crear / editar fecha/hora) */}
      <ModalUnidadFicticia
        opened={openFicticiaModal || !!editingFicticia}
        onClose={() => {
          setOpenFicticiaModal(false);
          setEditingFicticia(null);
        }}
        mode={editingFicticia ? "edit" : "create"}
        initialFechaHoraIngreso={editingFicticia?.fecha_hora_ingreso ?? null}
        onConfirm={async (fechaHoraIngreso) => {
          if (editingFicticia) {
            await validarCampo(
              editingFicticia.id,
              "fecha_hora_ingreso",
              fechaHoraIngreso,
            );
            setEditingFicticia(null);
          } else {
            await crearUnidadFicticia(fechaHoraIngreso);
            setOpenFicticiaModal(false);
          }
        }}
      />

      {/* Modal: Seleccionar Condición de Ingreso y Empresa */}
      <ModalCondicionIngreso
        opened={condicionModalOpen}
        onClose={() => {
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
        empresasTitulares={empresasTitulares}
        onConfirm={(condicion, idEmpresa, correlativoManual) => {
          if (selectedRecepcionIdForLote) {
            crearLote(selectedRecepcionIdForLote, condicion, idEmpresa, correlativoManual);
          }
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
      />
    </div>
  );
};
