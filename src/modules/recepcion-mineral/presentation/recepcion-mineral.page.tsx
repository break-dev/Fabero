import { useState, useEffect } from "react";
import { Grid, Paper, Text, Group, Center, Loader, Stack, Badge } from "@mantine/core";
import { IconScale, IconChecklist } from "@tabler/icons-react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { useRecepcionMineral } from "../hooks/useRecepcionMineral";
import { AuxService } from "../../../service/auxiliar.service";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { ModalPesoInicial } from "./components/modal-peso-inicial";
import { ModalPesoFinal } from "./components/modal-peso-final";
import { ModalCondicionIngreso } from "./components/modal-condicion-ingreso";
import { CardProcesoBalanza } from "./components/card-proceso-balanza";
import { CardDistribucionBalanza } from "./components/card-distribucion-balanza";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../service/responses/conductor";
import type { RES_Empresa } from "../../../service/responses/empresa";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RecepcionMineralResponse, RES_LoteMineral } from "../service/recepcion-mineral.responses";
import { useTicketBalanza } from "../hooks/useTicketBalanza";

export const RecepcionMineralPage = () => {
  useTitlePage("Recepción de Mineral", true);

  const { printTicketBalanza } = useTicketBalanza();

  const {
    sinPesarList,
    enProcesoList,
    loading,
    setSelectedRecepcion,
    validarCampo,
    deletingLoteId,
    closingProcesoId,
    iniciarProceso,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    cerrarProceso,
  } = useRecepcionMineral();

  const getFullPlaca = (placa: string | null) => {
    return placa || "SIN PLACA";
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
                                    {getFullPlaca(ru.vehiculo_placa)}
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
                        {/* Header: Placa + Badge tipo ingreso */}
                        <div
                          className={`py-2 px-3 font-bold text-xs tracking-wider font-mono uppercase bg-zinc-800 text-zinc-300`}
                        >
                          <Group justify="space-between" align="center" gap={6} wrap="nowrap">
                            <span className="truncate">
                              {getFullPlaca(ru.vehiculo_placa)}
                            </span>
                            <Badge
                              size="xs"
                              variant="filled"
                              radius="sm"
                              color={
                                ru.tipo_ingreso === "Despacho de Mineral"
                                  ? "yellow"
                                  : "teal"
                              }
                            >
                              {ru.tipo_ingreso === "Despacho de Mineral"
                                ? "Despacho"
                                : "Recepción"}
                            </Badge>
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
                  {unidadesAOperar.map((ru) => {
                    const esDespacho = ru.tipo_ingreso === "Despacho de Mineral";
                    if (esDespacho) {
                      return (
                        <CardDistribucionBalanza
                          key={ru.id}
                          ru={ru}
                          onDetalleUpdated={(actualizado) => {
                            // Actualización local del detalle sin recargar toda la lista.
                            // El servidor ya persistió los cambios; basta reflejar
                            // el nuevo detalle en el state local de la unidad seleccionada.
                            const updatedRecepcion: RecepcionMineralResponse = {
                              ...ru,
                              distribucion_detalles: (ru.distribucion_detalles ?? []).map((d) =>
                                d.id === actualizado.id ? actualizado : d,
                              ),
                            };
                            setSelectedRecepcion(updatedRecepcion);
                          }}
                          cerrarProceso={cerrarProceso}
                          closingProcesoId={closingProcesoId}
                        />
                      );
                    }
                    return (
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
                        deletingLoteId={deletingLoteId}
                        closingProcesoId={closingProcesoId}
                        validarCampo={validarCampo}
                        eliminarLote={eliminarLote}
                        printTicketBalanza={printTicketBalanza}
                        setActiveLotePesoInicial={setActiveLotePesoInicial}
                        setActiveLotePesoFinal={setActiveLotePesoFinal}
                        cerrarProceso={cerrarProceso}
                      />
                    );
                  })}
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

      {/* Modal: Seleccionar Condición de Ingreso y Empresa */}
      <ModalCondicionIngreso
        opened={condicionModalOpen}
        onClose={() => {
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
        empresasTitulares={empresasTitulares}
        onConfirm={(condicion, idEmpresa, codigoManual) => {
          if (selectedRecepcionIdForLote) {
            crearLote(selectedRecepcionIdForLote, condicion, idEmpresa, codigoManual);
          }
          setCondicionModalOpen(false);
          setSelectedRecepcionIdForLote(null);
        }}
      />
    </div>
  );
};
