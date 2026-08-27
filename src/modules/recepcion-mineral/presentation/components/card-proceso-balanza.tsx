import { useMemo, useState } from "react";
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
  IconTruck,
  IconBuildingFactory,
  IconCar,
} from "@tabler/icons-react";
import { useNotify } from "../../../../hooks/useNotify";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroTipoVehiculoSimple } from "../../../../presentation/utils/registro-tipo-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type {
  RES_LoteMineral,
  RecepcionMineralResponse,
} from "../../service/recepcion-mineral.responses";

interface CardProcesoBalanzaProps {
  ru: RecepcionMineralResponse;
  empresas: RES_EmpresaTransporte[];
  tiposVehiculo: RES_TipoVehiculo[];
  vehiculos: RES_Vehiculo[];
  conductores: RES_Conductor[];
  setSelectedRecepcionIdForLote: (id: number) => void;
  setCondicionModalOpen: (val: boolean) => void;
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
  vehiculos,
  conductores,
  setSelectedRecepcionIdForLote,
  setCondicionModalOpen,
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

  const lotesAMostrar = ru.lotes || [];

  const canCloseProceso = (recepcion: RecepcionMineralResponse) => {
    if (!recepcion.lotes || recepcion.lotes.length === 0) return false;
    return recepcion.lotes.every((l: RES_LoteMineral) => l.peso_final !== null);
  };

  const formatPlacaInput = (val: string): string => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 3) return clean;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  };

  // Los inputs siempre son editables; el guardado es automático al cambiar select (onChange) o al perder foco (onBlur).
  const [condIng, setCondIng] = useState(ru.tipo_ingreso || "");
  const [selectedPlaca, setSelectedPlaca] = useState<string>(
    formatPlacaInput(ru.vehiculo_placa || ""),
  );
  const [segPlaca2, setSegPlaca2] = useState(formatPlacaInput(ru.segunda_placa || ""));
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
  const [openNewVehiculoModal, setOpenNewVehiculoModal] = useState(false);
  const [openNewTipoVehiculoModal, setOpenNewTipoVehiculoModal] = useState(false);
  const [openNewEmpresaTransporteModal, setOpenNewEmpresaTransporteModal] = useState(false);

  // Listas de "recién agregados" para que aparezcan en el Select sin esperar un re-fetch del padre.
  const [conductoresAdded, setConductoresAdded] = useState<RES_Conductor[]>([]);
  const [vehiculosAdded, setVehiculosAdded] = useState<RES_Vehiculo[]>([]);
  const [empresasAdded, setEmpresasAdded] = useState<RES_EmpresaTransporte[]>([]);
  const [tiposVehiculoAdded, setTiposVehiculoAdded] = useState<RES_TipoVehiculo[]>([]);

  // Fusionar prop (catálogo del padre) + recién agregados en este card, deduplicando por id.
  const empresasData = useMemo(() => {
    const map = new Map<number, RES_EmpresaTransporte>();
    for (const e of empresas) {
      if (typeof e.id_empresa_transporte === "number") map.set(e.id_empresa_transporte, e);
    }
    for (const e of empresasAdded) {
      map.set(e.id_empresa_transporte, e);
    }
    return Array.from(map.values());
  }, [empresas, empresasAdded]);

  const tiposVehiculoData = useMemo(() => {
    const map = new Map<number, RES_TipoVehiculo>();
    for (const t of tiposVehiculo) {
      if (typeof t.id_tipo_vehiculo === "number") map.set(t.id_tipo_vehiculo, t);
    }
    for (const t of tiposVehiculoAdded) {
      map.set(t.id_tipo_vehiculo, t);
    }
    return Array.from(map.values());
  }, [tiposVehiculo, tiposVehiculoAdded]);

  const vehiculosData = useMemo(() => {
    const map = new Map<number, RES_Vehiculo>();
    for (const v of vehiculos) {
      if (typeof v.id_vehiculo === "number") map.set(v.id_vehiculo, v);
    }
    for (const v of vehiculosAdded) {
      map.set(v.id_vehiculo, v);
    }
    return Array.from(map.values());
  }, [vehiculos, vehiculosAdded]);

  const conductoresData = useMemo(() => {
    const map = new Map<number, RES_Conductor>();
    for (const c of conductores) {
      if (typeof c.id_conductor === "number") map.set(c.id_conductor, c);
    }
    for (const c of conductoresAdded) {
      map.set(c.id_conductor, c);
    }
    return Array.from(map.values());
  }, [conductores, conductoresAdded]);

  const handleSaveField = async (field: string, value: unknown) => {
    try {
      await validarCampo(ru.id, field, value);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo guardar el cambio.");
    }
  };

  const handleCreatedConductor = (c: RES_Conductor) => {
    setConductoresAdded((prev) => {
      const sinDuplicado = prev.filter((x) => x.id_conductor !== c.id_conductor);
      return [c, ...sinDuplicado];
    });
    setIdCond(String(c.id_conductor));
    handleSaveField("conductor", c.id_conductor);
    setOpenNewConductorModal(false);
  };

  const handleCreatedVehiculo = (v: RES_Vehiculo) => {
    setVehiculosAdded((prev) => {
      const sinDuplicado = prev.filter((x) => x.id_vehiculo !== v.id_vehiculo);
      return [v, ...sinDuplicado];
    });
    const placa = v.placa || "";
    setSelectedPlaca(placa);
    handleSaveField("placa", placa);
    setOpenNewVehiculoModal(false);
  };

  const handleCreatedTipoVehiculo = (t: RES_TipoVehiculo) => {
    setTiposVehiculoAdded((prev) => {
      const sinDuplicado = prev.filter((x) => x.id_tipo_vehiculo !== t.id_tipo_vehiculo);
      return [t, ...sinDuplicado];
    });
    setIdTip(String(t.id_tipo_vehiculo));
    handleSaveField("tipo_vehiculo", t.id_tipo_vehiculo);
    setOpenNewTipoVehiculoModal(false);
  };

  const handleCreatedEmpresaTransporte = (e: RES_EmpresaTransporte) => {
    setEmpresasAdded((prev) => {
      const sinDuplicado = prev.filter((x) => x.id_empresa_transporte !== e.id_empresa_transporte);
      return [e, ...sinDuplicado];
    });
    setIdEmp(String(e.id_empresa_transporte));
    handleSaveField("empresa_transporte", e.id_empresa_transporte);
    setOpenNewEmpresaTransporteModal(false);
  };

  const handleVehiculoChange = (val: string | null) => {
    setSelectedPlaca(val || "");
    if (val) {
      handleSaveField("placa", val);
    }
  };

  const idEmpresaTransporteActual = idEmp ? Number(idEmp) : null;
  const idTipoVehiculoActual = idTip ? Number(idTip) : null;

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
      {/* Layout 2 columnas */}
      <Grid columns={24} gutter="xs">
        {/* === Columna Izquierda: Datos de la unidad (siempe editables) === */}
        <Grid.Col span={{ base: 24, md: 8 }}>
          <Paper
            radius="md"
            p="xs"
            className="bg-zinc-900/30 border border-zinc-800/80 h-full"
          >
            <Group justify="space-between" align="center" className="px-1 mb-1.5">
              <Group gap={6} align="center">
                <div className="w-2 h-2 rounded-full animate-pulse bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                <Text size="10px" fw={700} className="text-indigo-400 uppercase tracking-wider">
                  Datos de la unidad
                </Text>
                <Text size="12px" fw={700} className="text-zinc-500 font-mono">
                  {formatPlacaInput(ru.vehiculo_placa || "")}
                </Text>
              </Group>
              <Text size="10px" c="dimmed" className="font-mono">
                {ru.fecha_hora_ingreso}
              </Text>
            </Group>

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

              {/* Vehículo (Placa 1) */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex items-end gap-1">
                  <Select
                    label="Vehículo"
                    placeholder={
                      vehiculosData.length === 0 ? "Cargando..." : "Seleccione placa"
                    }
                    searchable
                    data={vehiculosData
                      .filter((v): v is typeof v & { placa: string } =>
                        typeof v.placa === "string" && v.placa.length > 0,
                      )
                      .map((v) => ({
                        value: v.placa,
                        label: v.placa,
                      }))}
                    value={selectedPlaca || null}
                    onChange={handleVehiculoChange}
                    nothingFoundMessage="Sin vehículos registrados"
                    size="xs"
                    style={{ maxWidth: 180 }}
                    classNames={selectInputClasses}
                    comboboxProps={{ withinPortal: true }}
                    className="flex-1"
                  />
                  <Tooltip label="Registrar Vehículo" withArrow>
                    <ActionIcon
                      variant="filled"
                      color="indigo"
                      radius="md"
                      size="sm"
                      className="mb-0.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setOpenNewVehiculoModal(true)}
                    >
                      <IconTruck size={12} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </Grid.Col>

              {/* Empresa Transporte */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex items-end gap-1">
                  <Select
                    label="Empresa Transporte"
                    placeholder={
                      empresasData.length === 0 ? "Cargando..." : "Seleccione"
                    }
                    searchable
                    data={empresasData
                      .filter(
                        (e) =>
                          typeof e.id_empresa_transporte === "number" &&
                          e.razon_social,
                      )
                      .map((e) => ({
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
                    className="flex-1"
                  />
                  <Tooltip label="Registrar Empresa de Transporte" withArrow>
                    <ActionIcon
                      variant="filled"
                      color="indigo"
                      radius="md"
                      size="sm"
                      className="mb-0.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setOpenNewEmpresaTransporteModal(true)}
                    >
                      <IconBuildingFactory size={12} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </Grid.Col>

              {/* Tipo Vehículo */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <div className="flex items-end gap-1">
                  <Select
                    label="Tipo Vehículo"
                    placeholder={
                      tiposVehiculoData.length === 0 ? "Cargando..." : "Seleccione"
                    }
                    searchable
                    data={tiposVehiculoData
                      .filter(
                        (t): t is RES_TipoVehiculo & { id_tipo_vehiculo: number } =>
                          typeof t.id_tipo_vehiculo === "number",
                      )
                      .map((t) => ({
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
                    className="flex-1"
                  />
                  <Tooltip label="Registrar Tipo de Vehículo" withArrow>
                    <ActionIcon
                      variant="filled"
                      color="indigo"
                      radius="md"
                      size="sm"
                      className="mb-0.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setOpenNewTipoVehiculoModal(true)}
                    >
                      <IconCar size={12} />
                    </ActionIcon>
                  </Tooltip>
                </div>
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
                    placeholder={conductoresData.length === 0 ? "Cargando..." : "Seleccione"}
                    searchable
                    data={conductoresData
                      .filter(
                        (c): c is RES_Conductor & { id_conductor: number } =>
                          typeof c.id_conductor === "number",
                      )
                      .map((c) => ({
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
              <Group gap={4}>
                <Button
                  size="compact-xs"
                  radius="md"
                  leftSection={<IconPlus size={12} />}
                  disabled={unitClosed}
                  onClick={() => {
                    setSelectedRecepcionIdForLote(ru.id);
                    setCondicionModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-6 px-2 text-[11px]"
                >
                  Lote
                </Button>
                <Button
                  radius="md"
                  disabled={!canCloseProceso(ru)}
                  loading={closingProcesoId === ru.id}
                  onClick={() => cerrarProceso(ru.id)}
                  size="compact-xs"
                  className={`font-semibold h-6 px-2.5 text-[11px] ${
                    canCloseProceso(ru)
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                  }`}
                >
                  Cerrar Proceso
                </Button>
              </Group>
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
          onSuccess={(c) => {
            handleCreatedConductor(c);
          }}
        />
      </ModalEstandar>

      {/* Modal inline para crear nuevo vehículo */}
      <ModalEstandar
        opened={openNewVehiculoModal}
        close={() => setOpenNewVehiculoModal(false)}
        title="Registrar Nuevo Vehículo"
        size="sm"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={idEmpresaTransporteActual}
          idTipoVehiculo={idTipoVehiculoActual}
          onCancel={() => setOpenNewVehiculoModal(false)}
          onSuccess={(v) => {
            handleCreatedVehiculo(v);
          }}
        />
      </ModalEstandar>

      {/* Modal inline para crear nuevo tipo de vehículo */}
      <ModalEstandar
        opened={openNewTipoVehiculoModal}
        close={() => setOpenNewTipoVehiculoModal(false)}
        title="Registrar Nuevo Tipo de Vehículo"
        size="sm"
      >
        <RegistroTipoVehiculoSimple
          onCancel={() => setOpenNewTipoVehiculoModal(false)}
          onSuccess={handleCreatedTipoVehiculo}
        />
      </ModalEstandar>

      {/* Modal inline para crear nueva empresa de transporte */}
      <ModalEstandar
        opened={openNewEmpresaTransporteModal}
        close={() => setOpenNewEmpresaTransporteModal(false)}
        title="Registrar Nueva Empresa de Transporte"
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenNewEmpresaTransporteModal(false)}
          onSuccess={(nueva) => {
            const resEmp: RES_EmpresaTransporte = {
              id_empresa_transporte: nueva.id,
              ruc: nueva.ruc,
              razon_social: nueva.razon_social,
              estado: nueva.estado,
            };
            handleCreatedEmpresaTransporte(resEmp);
          }}
        />
      </ModalEstandar>
    </Paper>
  );
};
