import {
  Grid,
  Paper,
  Text,
  Button,
  Table,
  Group,
  ActionIcon,
  Popover,
  Select,
  TextInput,
  Badge,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconTrash,
  IconPlus,
  IconBarcode,
} from "@tabler/icons-react";
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
  validatingField: { id: number; field: string } | null;
  handleOpenPopover: (
    recepcionId: number,
    field: string,
    currentValue: string,
    extraValue?: string | null
  ) => void;
  handleSaveField: (recepcionId: number, field: string) => Promise<void>;
  openedPopover: string | null;
  setOpenedPopover: (val: string | null) => void;
  tempValue: string;
  setTempValue: (val: string) => void;
  setOpenNewConductorModal: (val: boolean) => void;
  setSelectedRecepcionIdForLote: (id: number) => void;
  setCondicionModalOpen: (val: boolean) => void;
  creatingLoteId: number | null;
  deletingLoteId: number | null;
  eliminarLote: (recepcionId: number, loteId: number) => void | Promise<void>;
  printTicket: (lote: RES_LoteMineral) => void;
  getBarcodePreviewUrl: (lote: RES_LoteMineral) => string | null;
  setActiveLotePesoInicial: (lote: RES_LoteMineral) => void;
  setActiveLotePesoFinal: (lote: RES_LoteMineral) => void;
  closingProcesoId: number | null;
  cerrarProceso: (recepcionId: number) => Promise<void>;
}

export const CardProcesoBalanza = ({
  ru,
  empresas,
  tiposVehiculo,
  conductores,
  validatingField,
  handleOpenPopover,
  handleSaveField,
  openedPopover,
  setOpenedPopover,
  tempValue,
  setTempValue,
  setOpenNewConductorModal,
  setSelectedRecepcionIdForLote,
  setCondicionModalOpen,
  creatingLoteId,
  deletingLoteId,
  eliminarLote,
  printTicket,
  getBarcodePreviewUrl,
  setActiveLotePesoInicial,
  setActiveLotePesoFinal,
  closingProcesoId,
  cerrarProceso,
}: CardProcesoBalanzaProps) => {
  const formatPlacaInput = (val: string): string => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 3) return clean;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  };

  const getFullPlaca = (serie: string | null, placa: string | null) => {
    if (!placa) return "SIN PLACA";
    return serie ? `${serie}-${placa}` : placa;
  };

  const getEmpresaNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const emp = empresas.find((e) => e.id_empresa_transporte === id);
    return emp ? emp.razon_social : `Cód: ${id}`;
  };

  const getTipoVehiculoNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const tipo = tiposVehiculo.find((t) => t.id_tipo_vehiculo === id);
    return tipo ? tipo.nombre : `Cód: ${id}`;
  };

  const getConductorNombre = (id: number | null) => {
    if (!id) return "Sin registrar";
    const cond = conductores.find((c) => c.id_conductor === id);
    return cond ? cond.nombre_completo : `Cód: ${id}`;
  };

  const isValidationComplete = (recepcion: RecepcionMineralResponse) => {
    const val = recepcion.validacion_datos;
    if (!val) return false;
    return (
      val.condicion_ingreso &&
      val.tipo_carga &&
      val.placa &&
      val.empresa_transporte &&
      val.tipo_vehiculo &&
      val.segunda_placa &&
      val.conductor
    );
  };

  const getValidatedCount = (recepcion: RecepcionMineralResponse) => {
    const val = recepcion.validacion_datos;
    if (!val) return 0;
    let count = 0;
    if (val.condicion_ingreso) count++;
    if (val.tipo_carga) count++;
    if (val.placa) count++;
    if (val.empresa_transporte) count++;
    if (val.tipo_vehiculo) count++;
    if (val.segunda_placa) count++;
    if (val.conductor) count++;
    return count;
  };

  const canCloseProceso = (recepcion: RecepcionMineralResponse) => {
    if (!isValidationComplete(recepcion)) return false;
    if (!recepcion.lotes || recepcion.lotes.length === 0) return false;
    return recepcion.lotes.every((l: RES_LoteMineral) => l.peso_final !== null);
  };

  const valComplete = isValidationComplete(ru);
  const valCount = getValidatedCount(ru);
  const isFicticio = ru.tipo_ingreso === "Ficticio";
  const lotesAMostrar = ru.lotes || [];

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-[38px]",
    label: "text-zinc-400 mb-1 font-medium text-xs ml-1 flex items-center gap-1.5",
  };

  return (
    <Paper
      key={ru.id}
      radius="xl"
      p="md"
      className="bg-zinc-950/40 border border-zinc-800/80 shadow-xl flex flex-col gap-4"
    >
      {/* Encabezado Único de Balanza */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isFicticio
                ? "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <Text
                size="xs"
                fw={700}
                className={`tracking-wider ${
                  isFicticio ? "text-indigo-400" : "text-amber-400"
                }`}
              >
                PROCESO DE BALANZA ACTIVO
              </Text>
              {isFicticio && (
                <Badge variant="dot" color="indigo" size="xs">
                  Ficticia
                </Badge>
              )}
            </div>
            <Text size="sm" fw={700} className="text-white font-mono">
              Unidad:{" "}
              <span className="text-zinc-100 font-bold">
                {getFullPlaca(
                  isFicticio ? null : ru.vehiculo_serie,
                  ru.vehiculo_placa
                )}
              </span>
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="filled"
            color={
              valCount === 7 ? "emerald" : valCount > 0 ? "amber" : "gray"
            }
            size="sm"
            radius="lg"
            leftSection={valCount === 7 ? <IconCheck size={12} /> : undefined}
            className="font-semibold"
          >
            {valCount === 7
              ? "Vigilancia 100% Validada"
              : `Vigilancia: ${valCount}/7 Validado${
                  valCount === 1 ? "" : "s"
                }`}
          </Badge>

          <div className="text-right border-l border-zinc-800/80 pl-3">
            <Text
              size="10px"
              c="dimmed"
              className="uppercase font-semibold tracking-wider"
            >
              Ingreso a Planta
            </Text>
            <Text size="xs" fw={600} className="text-zinc-300 font-mono">
              {ru.fecha_hora_ingreso}
            </Text>
          </div>
        </div>
      </div>

      {/* Sección de Validación de Vigilancia (Cards Slim) */}
      <div className="flex flex-col gap-2">
        <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider">
          Validación de Datos de Vigilancia
        </Text>
        <Grid gutter="xs">
          {/* 1. Condición Ingreso */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-condicion_ingreso`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "condicion_ingreso",
                      ru.tipo_ingreso || ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.condicion_ingreso
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      CONDICIÓN
                    </Text>
                    {ru.validacion_datos.condicion_ingreso ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {ru.tipo_ingreso || "Sin especificar"}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-56 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Select
                  label="Condición Ingreso"
                  data={["Recepción de Mineral", "Despacho de Mineral"]}
                  value={tempValue}
                  onChange={(val) => setTempValue(val || "")}
                  classNames={fieldClasses}
                  radius="md"
                  comboboxProps={{ withinPortal: false }}
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "condicion_ingreso"
                  }
                  onClick={() => handleSaveField(ru.id, "condicion_ingreso")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 2. Tipo Carga */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-tipo_carga`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "tipo_carga",
                      ru.tipo_carga || "Granel"
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.tipo_carga
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      CARGA
                    </Text>
                    {ru.validacion_datos.tipo_carga ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {ru.tipo_carga || "Sin especificar"}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-56 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Select
                  label="Tipo de Carga"
                  data={["Granel", "Sacos", "Mixto"]}
                  value={tempValue}
                  onChange={(val) => setTempValue(val || "Granel")}
                  classNames={fieldClasses}
                  radius="md"
                  comboboxProps={{ withinPortal: false }}
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "tipo_carga"
                  }
                  onClick={() => handleSaveField(ru.id, "tipo_carga")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 3. Placa 1 */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-placa`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "placa",
                      ru.vehiculo_placa || ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.placa
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      PLACA 1
                    </Text>
                    {ru.validacion_datos.placa ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {ru.vehiculo_placa || "Sin placa"}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-56 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <TextInput
                  label="Placa 1"
                  placeholder="Ej: ABC-123"
                  maxLength={7}
                  value={tempValue}
                  onChange={(e) =>
                    setTempValue(formatPlacaInput(e.currentTarget.value))
                  }
                  classNames={fieldClasses}
                  radius="md"
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "placa"
                  }
                  onClick={() => handleSaveField(ru.id, "placa")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 3. Empresa Transporte */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-empresa_transporte`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "empresa_transporte",
                      ru.id_empresa_transporte
                        ? String(ru.id_empresa_transporte)
                        : ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.empresa_transporte
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      EMP. TRANSPORTE
                    </Text>
                    {ru.validacion_datos.empresa_transporte ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {getEmpresaNombre(ru.id_empresa_transporte)}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-64 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Select
                  label="Empresa Transporte"
                  searchable
                  data={empresas.map((e) => ({
                    value: String(e.id_empresa_transporte),
                    label: e.razon_social,
                  }))}
                  value={tempValue}
                  onChange={(val) => setTempValue(val || "")}
                  classNames={fieldClasses}
                  radius="md"
                  comboboxProps={{ withinPortal: false }}
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "empresa_transporte"
                  }
                  onClick={() => handleSaveField(ru.id, "empresa_transporte")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 4. Tipo Vehículo */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-tipo_vehiculo`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "tipo_vehiculo",
                      ru.id_tipo_vehiculo ? String(ru.id_tipo_vehiculo) : ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.tipo_vehiculo
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      TIPO VEHÍCULO
                    </Text>
                    {ru.validacion_datos.tipo_vehiculo ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {getTipoVehiculoNombre(ru.id_tipo_vehiculo)}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-56 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Select
                  label="Tipo Vehículo"
                  searchable
                  data={tiposVehiculo.map((t) => ({
                    value: String(t.id_tipo_vehiculo),
                    label: t.nombre,
                  }))}
                  value={tempValue}
                  onChange={(val) => setTempValue(val || "")}
                  classNames={fieldClasses}
                  radius="md"
                  comboboxProps={{ withinPortal: false }}
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "tipo_vehiculo"
                  }
                  onClick={() => handleSaveField(ru.id, "tipo_vehiculo")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 5. Placa 2 */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-segunda_placa`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "segunda_placa",
                      ru.segunda_placa || ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.segunda_placa
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      PLACA ACOPLE
                    </Text>
                    {ru.validacion_datos.segunda_placa ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {ru.segunda_placa || "Sin acople"}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-56 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <TextInput
                  label="Segunda Placa (Acople)"
                  placeholder="Ej: ABC-123"
                  maxLength={7}
                  value={tempValue}
                  onChange={(e) =>
                    setTempValue(formatPlacaInput(e.currentTarget.value))
                  }
                  classNames={fieldClasses}
                  radius="md"
                />
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "segunda_placa"
                  }
                  onClick={() => handleSaveField(ru.id, "segunda_placa")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>

          {/* 6. Conductor */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Popover
              opened={openedPopover === `${ru.id}-conductor`}
              onChange={() => setOpenedPopover(null)}
              position="bottom"
              withArrow
              radius="lg"
              styles={{
                dropdown: {
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                },
              }}
            >
              <Popover.Target>
                <Paper
                  onClick={() =>
                    handleOpenPopover(
                      ru.id,
                      "conductor",
                      ru.id_conductor ? String(ru.id_conductor) : ""
                    )
                  }
                  className={`px-3 py-2 cursor-pointer border rounded-xl flex flex-col justify-between h-14 transition-all duration-200 ${
                    ru.validacion_datos.conductor
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30"
                      : "bg-zinc-900/40 border-zinc-800/90 hover:border-amber-500/50 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                      className="uppercase truncate tracking-wide"
                    >
                      CONDUCTOR
                    </Text>
                    {ru.validacion_datos.conductor ? (
                      <IconCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <Text
                    size="xs"
                    fw={700}
                    className="truncate text-zinc-100 font-mono -mt-0.5"
                  >
                    {getConductorNombre(ru.id_conductor)}
                  </Text>
                </Paper>
              </Popover.Target>
              <Popover.Dropdown
                className="w-72 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-2 items-end">
                  <Select
                    label="Conductor"
                    searchable
                    data={conductores.map((c) => ({
                      value: String(c.id_conductor),
                      label: `${c.nombre_completo} (${c.dni})`,
                    }))}
                    value={tempValue}
                    onChange={(val) => setTempValue(val || "")}
                    classNames={fieldClasses}
                    radius="md"
                    className="flex-1"
                    comboboxProps={{ withinPortal: false }}
                  />
                  <ActionIcon
                    color="indigo"
                    radius="md"
                    size="lg"
                    className="mb-0.5"
                    onClick={() => setOpenNewConductorModal(true)}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </div>
                <Button
                  fullWidth
                  size="xs"
                  color="indigo"
                  radius="md"
                  mt="sm"
                  loading={
                    validatingField?.id === ru.id &&
                    validatingField?.field === "conductor"
                  }
                  onClick={() => handleSaveField(ru.id, "conductor")}
                >
                  Validar
                </Button>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>
        </Grid>
      </div>

      {/* Sección Lotes */}
      <div className="border border-zinc-900/60 rounded-3xl p-4 bg-zinc-950/20">
        <Group
          justify="space-between"
          mb="md"
          className="border-b border-zinc-900 pb-2"
        >
          <Group gap="xs">
            <Text size="sm" fw={700} className="text-zinc-200">
              Lotes de Mineral Asociados
            </Text>
            {!valComplete && (
              <Text
                size="11px"
                className="text-amber-500 font-semibold italic"
              >
                * Debe validar todos los datos de vigilancia para poder
                agregar lotes.
              </Text>
            )}
          </Group>
          <Button
            size="xs"
            radius="md"
            leftSection={<IconPlus size={14} />}
            disabled={!valComplete}
            loading={creatingLoteId === ru.id}
            onClick={() => {
              setSelectedRecepcionIdForLote(ru.id);
              setCondicionModalOpen(true);
            }}
            className={`font-bold ${
              valComplete
                ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
            }`}
          >
            Lote
          </Button>
        </Group>

        <div className="overflow-x-auto">
          <Table verticalSpacing="md" horizontalSpacing="sm" className="w-full">
            <thead>
              <tr className="bg-zinc-900/40 border-b border-zinc-900 text-zinc-400 font-bold text-xs text-left">
                <th style={{ width: 60 }}>Acción</th>
                <th>Código</th>
                <th>Ticket</th>
                <th className="text-right">Peso Inicial (Bruto)</th>
                <th className="text-right">Peso Final (Tara)</th>
              </tr>
            </thead>
            <tbody>
              {lotesAMostrar.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-zinc-500 text-xs"
                  >
                    {!valComplete
                      ? "Pendiente de validación de vigilancia."
                      : "No hay lotes agregados para esta unidad. Haz clic en '+ Lote' para comenzar a generar los lotes."}
                  </td>
                </tr>
              ) : (
                lotesAMostrar.map((lote: RES_LoteMineral) => {
                  const barcodeUrl = getBarcodePreviewUrl(lote);
                  return (
                    <tr key={lote.id} className="border-b border-zinc-900/40">
                      <td>
                        <Tooltip label="Eliminar lote" withArrow>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            radius="md"
                            loading={deletingLoteId === lote.id}
                            onClick={() => eliminarLote(ru.id, lote.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </td>
                      <td>
                        <Group gap={6} wrap="nowrap">
                          {barcodeUrl ? (
                            <Tooltip
                              label="Ver / reimprimir ticket"
                              withArrow
                            >
                              <ActionIcon
                                variant="default"
                                radius="sm"
                                size="md"
                                onClick={() => printTicket(lote)}
                                aria-label="Ver ticket"
                                className="bg-white hover:bg-zinc-100 p-0.5 border border-zinc-700/80 shrink-0 h-6 w-12"
                              >
                                <img
                                  src={barcodeUrl}
                                  alt={`barcode ${lote.correlativo}`}
                                  className="h-full w-full object-contain"
                                />
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <IconBarcode
                              size={18}
                              className="text-zinc-500 shrink-0"
                            />
                          )}
                          <Text
                            size="xs"
                            fw={700}
                            className="text-zinc-200 font-mono"
                          >
                            {lote.correlativo}
                          </Text>
                        </Group>
                      </td>
                      <td>
                        <Text size="xs" className="text-zinc-300">
                          {lote.numero_correlativo}
                        </Text>
                      </td>
                      <td className="text-right">
                        {lote.peso_inicial !== null ? (
                          <Badge
                            variant="gradient"
                            gradient={{ from: "teal", to: "green", deg: 45 }}
                            size="md"
                            radius="md"
                            className="font-bold text-zinc-950 px-2.5 py-2.5 shadow-sm shadow-emerald-500/10"
                          >
                            {lote.peso_inicial.toLocaleString()} Kg
                          </Badge>
                        ) : (
                          <Button
                            size="xs"
                            radius="md"
                            className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 transition-all hover:scale-105"
                            onClick={() => setActiveLotePesoInicial(lote)}
                          >
                            Pesar
                          </Button>
                        )}
                      </td>
                      <td className="text-right">
                        {lote.peso_final !== null ? (
                          <Badge
                            variant="gradient"
                            gradient={{ from: "teal", to: "green", deg: 45 }}
                            size="md"
                            radius="md"
                            className="font-bold text-zinc-950 px-2.5 py-2.5 shadow-sm shadow-emerald-500/10"
                          >
                            {lote.peso_final.toLocaleString()} Kg
                          </Badge>
                        ) : lote.peso_inicial !== null ? (
                          <Button
                            size="xs"
                            radius="md"
                            className="bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-extrabold shadow-sm shadow-amber-500/10 transition-all hover:scale-105"
                            onClick={() => setActiveLotePesoFinal(lote)}
                          >
                            Pesar
                          </Button>
                        ) : (
                          <Text size="xs" c="dimmed">
                            ---
                          </Text>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Botón Cerrar Proceso de Balanza */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-900">
        <Button
          radius="lg"
          disabled={!canCloseProceso(ru)}
          loading={closingProcesoId === ru.id}
          onClick={() => cerrarProceso(ru.id)}
          className={`font-bold ${
            canCloseProceso(ru)
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
          }`}
        >
          Cerrar Proceso de Balanza
        </Button>
      </div>
    </Paper>
  );
};
