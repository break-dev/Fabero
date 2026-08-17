import { useState } from "react";
import {
  Grid,
  Paper,
  Text,
  Button,
  Group,
  ActionIcon,
  Select,
  TextInput,
  Badge,
  Tooltip,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconBarcode,
  IconCalendarTime,
  IconUserPlus,
  IconScale,
} from "@tabler/icons-react";
import { useNotify } from "../../../../hooks/useNotify";
import { AuxService } from "../../../../service/auxiliar.service";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type {
  RES_LoteMineral,
  RecepcionMineralResponse,
} from "../../service/recepcion-mineral.responses";

interface CardProcesoBalanzaProps {
  ru: RecepcionMineralResponse;
  empresas: RES_EmpresaTransporte[];
  tiposVehiculo: RES_TipoVehiculo[];
  conductores: RES_Conductor[];
  setSelectedRecepcionIdForLote: (id: number) => void;
  setCondicionModalOpen: (val: boolean) => void;
  crearLoteLoadingId: number | null;
  deletingLoteId: number | null;
  closingProcesoId: number | null;
  validarCampo: (
    id: number,
    field: string,
    value: unknown,
  ) => Promise<void>;
  eliminarLote: (recepcionId: number, loteId: number) => void | Promise<void>;
  printTicketBalanza: (loteId: number) => void;
  setActiveLotePesoInicial: (lote: RES_LoteMineral) => void;
  setActiveLotePesoFinal: (lote: RES_LoteMineral) => void;
  cerrarProceso: (recepcionId: number) => Promise<void>;
}

const formatNumber = (n: number) => n.toLocaleString();

export const CardProcesoBalanza = ({
  ru,
  empresas,
  tiposVehiculo,
  conductores,
  setSelectedRecepcionIdForLote,
  setCondicionModalOpen,
  crearLoteLoadingId,
  deletingLoteId,
  closingProcesoId,
  validarCampo,
  eliminarLote,
  printTicketBalanza,
  setActiveLotePesoInicial,
  setActiveLotePesoFinal,
  cerrarProceso,
}: CardProcesoBalanzaProps) => {
  const { notifyError } = useNotify();

  const isFicticio = ru.tipo_ingreso === "Ficticio" || ru.es_recepcion_ficticia;
  const lotesAMostrar = ru.lotes || [];

  const canCloseProceso = (recepcion: RecepcionMineralResponse) => {
    if (!recepcion.lotes || recepcion.lotes.length === 0) return false;
    return recepcion.lotes.every((l: RES_LoteMineral) => l.peso_final !== null);
  };

  const getFullPlaca = (serie: string | null, placa: string | null) => {
    if (!placa) return "SIN PLACA";
    return serie ? `${serie}-${placa}` : placa;
  };

  const formatPlacaInput = (val: string): string => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 3) return clean;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  };

  // Los inputs siempre son editables; el guardado es automático al cambiar select (onChange) o al perder foco (onBlur).
  const [condIng, setCondIng] = useState(ru.tipo_ingreso || "");
  const [segPlaca, setSegPlaca] = useState(ru.vehiculo_placa || "");
  const [segPlaca2, setSegPlaca2] = useState(ru.segunda_placa || "");
  const [idEmp, setIdEmp] = useState<string>(
    ru.id_empresa_transporte ? String(ru.id_empresa_transporte) : "",
  );
  const [idTip, setIdTip] = useState<string>(
    ru.id_tipo_vehiculo ? String(ru.id_tipo_vehiculo) : "",
  );
  const [idCond, setIdCond] = useState<string>(
    ru.id_conductor ? String(ru.id_conductor) : "",
  );

  const [openNewConductorModal, setOpenNewConductorModal] = useState(false);
  const [conductoresLocal, setConductoresLocal] = useState<RES_Conductor[]>(conductores);

  const handleSaveField = async (field: string, value: unknown) => {
    try {
      await validarCampo(ru.id, field, value);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo guardar el cambio.");
    }
  };

  const handleCreatedConductor = (c: RES_Conductor) => {
    setConductoresLocal((prev) => [c, ...prev]);
    setIdCond(String(c.id_conductor));
    handleSaveField("conductor", c.id_conductor);
    setOpenNewConductorModal(false);
  };

  const refreshConductores = async () => {
    const res = await AuxService.get_conductores();
    setConductoresLocal(res);
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[30px] text-xs",
    label: "text-zinc-500 mb-0.5 font-medium text-[10px] ml-0.5",
  };

  const selectInputClasses = {
    ...fieldClasses,
    input: `${fieldClasses.input} [&_input]:text-xs`,
    dropdown: "bg-zinc-950 border-zinc-800 text-white",
    option: "hover:bg-zinc-900 text-zinc-300 text-xs data-[selected]:bg-indigo-600 data-[selected]:text-white",
  };

  const unitClosed = ru.estado_pesaje === "Pesado";

  return (
    <Paper
      key={ru.id}
      radius="md"
      p="sm"
      className="bg-zinc-950/40 border border-zinc-800/80 shadow-lg flex flex-col gap-2"
    >
      {/* Encabezado compacto */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isFicticio
                ? "bg-indigo-400 shadow-[0_0_6px_#818cf8]"
                : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
            }`}
          />
          <Text size="xs" fw={700} className="text-white font-mono">
            <span className="text-zinc-400">Unidad: </span>
            <span className="text-amber-400">{getFullPlaca(isFicticio ? null : ru.vehiculo_serie, ru.vehiculo_placa)}</span>
            {isFicticio && (
              <Badge variant="dot" color="indigo" size="xs" ml={6}>
                FICT
              </Badge>
            )}
          </Text>
        </div>

        <Group gap={6}>
          <Button
            radius="md"
            disabled={!canCloseProceso(ru)}
            loading={closingProcesoId === ru.id}
            onClick={() => cerrarProceso(ru.id)}
            size="compact-xs"
            className={`font-semibold h-6.5 px-2.5 text-xs ${
              canCloseProceso(ru)
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
            }`}
          >
            Cerrar Proceso
          </Button>
          <Text size="10px" c="dimmed" className="font-mono border-l border-zinc-800/80 pl-2">
            {ru.fecha_hora_ingreso}
          </Text>
        </Group>
      </div>

      {/* Layout 2 columnas */}
      <Grid columns={24} gutter="xs">
        {/* === Columna Izquierda: Datos de la unidad (siempe editables) === */}
        <Grid.Col span={{ base: 24, md: 8 }}>
          <Paper
            radius="md"
            p="xs"
            className="bg-zinc-900/30 border border-zinc-800/80 h-full"
          >
            <Text size="10px" fw={700} className="text-indigo-400 uppercase tracking-wider mb-1.5 px-1">
              Datos de la unidad
            </Text>

            <Grid gutter="xs">
              {/* Condición */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Condición"
                  placeholder="Seleccione"
                  data={["Recepción de Mineral", "Despacho de Mineral"]}
                  value={condIng || null}
                  onChange={(val) => {
                    setCondIng(val || "");
                    if (val) handleSaveField("condicion_ingreso", val);
                  }}
                  size="xs"
                  style={{ maxWidth: 180 }}
                  classNames={selectInputClasses}
                  comboboxProps={{ withinPortal: true }}
                />
              </Grid.Col>

              {/* Placa 1 */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Placa 1"
                  placeholder="ABC-123"
                  value={segPlaca}
                  onChange={(e) => setSegPlaca(formatPlacaInput(e.target.value))}
                  onBlur={() => {
                    if (segPlaca !== (ru.vehiculo_placa ?? "")) {
                      handleSaveField("placa", segPlaca);
                    }
                  }}
                  size="xs"
                  maxLength={7}
                  style={{ maxWidth: 180 }}
                  classNames={fieldClasses}
                />
              </Grid.Col>

              {/* Empresa Transporte */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Empresa Transporte"
                  placeholder={empresas.length === 0 ? "Cargando..." : "Seleccione"}
                  searchable
                  data={empresas.map((e) => ({
                    value: String(e.id_empresa_transporte),
                    label: e.razon_social,
                  }))}
                  value={idEmp || null}
                  onChange={(val) => {
                    setIdEmp(val || "");
                    if (val) handleSaveField("empresa_transporte", Number(val));
                  }}
                  size="xs"
                  style={{ maxWidth: 180 }}
                  classNames={selectInputClasses}
                  comboboxProps={{ withinPortal: true }}
                />
              </Grid.Col>

              {/* Tipo Vehículo */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Tipo Vehículo"
                  placeholder={tiposVehiculo.length === 0 ? "Cargando..." : "Seleccione"}
                  searchable
                  data={tiposVehiculo.map((t) => ({
                    value: String(t.id_tipo_vehiculo),
                    label: t.nombre,
                  }))}
                  value={idTip || null}
                  onChange={(val) => {
                    setIdTip(val || "");
                    if (val) handleSaveField("tipo_vehiculo", Number(val));
                  }}
                  size="xs"
                  style={{ maxWidth: 180 }}
                  classNames={selectInputClasses}
                  comboboxProps={{ withinPortal: true }}
                />
              </Grid.Col>

              {/* Placa Acople */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Placa Acople"
                  placeholder="Opcional"
                  value={segPlaca2}
                  onChange={(e) => setSegPlaca2(formatPlacaInput(e.target.value))}
                  onBlur={() => {
                    if (segPlaca2 !== (ru.segunda_placa ?? "")) {
                      handleSaveField("segunda_placa", segPlaca2);
                    }
                  }}
                  size="xs"
                  maxLength={7}
                  style={{ maxWidth: 180 }}
                  classNames={fieldClasses}
                />
              </Grid.Col>

              {/* Conductor */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex items-end gap-1">
                  <Select
                    label="Conductor"
                    placeholder={conductoresLocal.length === 0 ? "Cargando..." : "Seleccione"}
                    searchable
                    data={conductoresLocal.map((c) => ({
                      value: String(c.id_conductor),
                      label: `${c.nombre_completo} (${c.dni})`,
                    }))}
                    value={idCond || null}
onChange={(val) => {
                    setIdCond(val || "");
                    if (val) handleSaveField("conductor", Number(val));
                  }}
                  size="xs"
                  style={{ maxWidth: 180 }}
                  classNames={selectInputClasses}
                  comboboxProps={{ withinPortal: true }}
                  className="flex-1"
                />
                  <Tooltip label="Agregar Conductor" withArrow>
                    <ActionIcon
                      variant="filled"
                      color="indigo"
                      radius="md"
                      size="sm"
                      className="mb-0.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setOpenNewConductorModal(true)}
                    >
                      <IconUserPlus size={12} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>

        {/* === Columna Derecha: Lotes === */}
        <Grid.Col span={{ base: 24, md: 16 }}>
          <Paper
            radius="md"
            p="xs"
            className="bg-zinc-900/30 border border-zinc-800/80 h-full"
          >
            <Group justify="space-between" mb="xs" className="px-1">
              <Group gap={4}>
                <IconScale size={12} className="text-indigo-400" />
                <Text size="10px" fw={700} className="text-indigo-400 uppercase tracking-wider">
                  Lotes ({lotesAMostrar.length})
                </Text>
              </Group>
              <Button
                size="compact-xs"
                radius="md"
                leftSection={<IconPlus size={12} />}
                loading={crearLoteLoadingId === ru.id}
                disabled={unitClosed}
                onClick={() => {
                  setSelectedRecepcionIdForLote(ru.id);
                  setCondicionModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-6 px-2 text-[11px]"
              >
                Lote
              </Button>
            </Group>

            {lotesAMostrar.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center gap-1">
                <IconCalendarTime size={20} className="text-zinc-600" />
                <Text size="10px" c="dimmed">
                  Sin lotes. Haz clic en "+ Lote".
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {lotesAMostrar.map((lote: RES_LoteMineral) => (
                  <Paper
                    key={lote.id}
                    radius="md"
                    p="xs"
                    className="bg-zinc-950/30 border border-zinc-800/80"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <Badge
                        variant="light"
                        color="indigo"
                        size="sm"
                        radius="sm"
                        className="font-mono font-bold text-[10px]"
                      >
                        {lote.correlativo}
                      </Badge>
                      <Group gap={2}>
                        <Tooltip label="Imprimir ticket" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="indigo"
                            radius="sm"
                            size="sm"
                            onClick={() => printTicketBalanza(lote.id)}
                            className="text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <IconBarcode size={12} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar lote" withArrow>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            radius="sm"
                            size="sm"
                            loading={deletingLoteId === lote.id}
                            onClick={() => eliminarLote(ru.id, lote.id)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <Text size="9px" c="dimmed" className="uppercase font-semibold shrink-0">
                          Peso Inicial
                        </Text>
                        {lote.peso_inicial !== null ? (
                          <Badge
                            variant="gradient"
                            gradient={{ from: "teal", to: "green", deg: 45 }}
                            size="sm"
                            radius="sm"
                            className="font-bold text-zinc-950 px-1.5 py-1 shadow-sm shadow-emerald-500/10"
                          >
                            {formatNumber(lote.peso_inicial)} Kg
                          </Badge>
                        ) : (
                          <Button
                            size="compact-xs"
                            radius="sm"
                            onClick={() => setActiveLotePesoInicial(lote)}
                            className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 h-4 text-[9px] px-1.5"
                          >
                            Pesar
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <Text size="9px" c="dimmed" className="uppercase font-semibold shrink-0">
                          Peso Final
                        </Text>
                        {lote.peso_final !== null ? (
                          <Badge
                            variant="gradient"
                            gradient={{ from: "teal", to: "green", deg: 45 }}
                            size="sm"
                            radius="sm"
                            className="font-bold text-zinc-950 px-1.5 py-1 shadow-sm shadow-emerald-500/10"
                          >
                            {formatNumber(lote.peso_final)} Kg
                          </Badge>
                        ) : lote.peso_inicial !== null ? (
                          <Button
                            size="compact-xs"
                            radius="sm"
                            onClick={() => setActiveLotePesoFinal(lote)}
                            className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 h-4 text-[9px] px-1.5"
                          >
                            Pesar
                          </Button>
                        ) : (
                          <Text size="10px" c="dimmed">
                            ---
                          </Text>
                        )}
                      </div>
                    </div>
                  </Paper>
                ))}
              </div>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Modal inline para crear nuevo conductor */}
      <ModalEstandar
        opened={openNewConductorModal}
        close={() => setOpenNewConductorModal(false)}
        title="Registrar Nuevo Conductor"
        size="md"
      >
        <RegistroConductor
          onCancel={() => setOpenNewConductorModal(false)}
          onSuccess={async (c) => {
            handleCreatedConductor(c);
            await refreshConductores();
          }}
        />
      </ModalEstandar>
    </Paper>
  );
};
