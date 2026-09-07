import { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Stack,
  Text,
  Group,
  Grid,
  Select,
  Tooltip,
  ActionIcon,
  Paper,
  Input,
  Loader,
} from "@mantine/core";
import { IconPlus, IconDeviceFloppy } from "@tabler/icons-react";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { FormZonaOrigen } from "../../../../presentation/utils/form-zona-origen";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { AuxService } from "../../../../service/auxiliar.service";
import { RecepcionMineralService } from "../../../recepcion-mineral/service/recepcion-mineral.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_ZonaOrigen } from "../../../../service/responses/zona-origen";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_ResumenBalanzaItem } from "../../service/resumen-balanza.responses";
import type { DTO_PesoFinal } from "../../../recepcion-mineral/service/recepcion-mineral.requests";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { useNotify } from "../../../../hooks/useNotify";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import type { EmpresaTransporteResponse } from "../../../empresas-transporte/service/empresas-transporte.responses";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";
import { TipoMineral } from "../../../../shared/enums/_generic/tipo-mineral";
import { EstadoBase } from "../../../../shared/enums/_generic/estado-base";

interface Props {
  opened: boolean;
  lote: RES_ResumenBalanzaItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarResumenLote = ({ opened, lote, onClose, onSuccess }: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  // Estados Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [zonas, setZonas] = useState<RES_ZonaOrigen[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<RES_EmpresaTransporte[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Estados Sub-Modals
  const [openZonaModal, setOpenZonaModal] = useState(false);
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState("");
  const [openVehiculoModal, setOpenVehiculoModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);
  const [openConductorModal, setOpenConductorModal] = useState(false);
  const [openEmpresaTransporteModal, setOpenEmpresaTransporteModal] = useState(false);

  // Estados Formulario
  const [condicionIngreso, setCondicionIngreso] = useState<string>(lote.lote_condicion_ingreso || CondicionIngreso.Comercializacion);
  const [motivo, setMotivo] = useState<string>("");
  const [idProveedor, setIdProveedor] = useState<string | null>(lote.id_proveedor ? String(lote.id_proveedor) : null);
  const [idZona, setIdZona] = useState<string | null>(lote.id_zona_origen ? String(lote.id_zona_origen) : null);
  const [contacto, setContacto] = useState<string>(lote.lote_numero_contacto || "");
  const [producto, setProducto] = useState<string>(lote.lote_tipo_producto || TipoMineral.Aurifero);
  const [material, setMaterial] = useState<string>(lote.lote_tipo_mineral || "Mixto");
  const [pesoInicial, setPesoInicial] = useState<string>(lote.peso_inicial ? String(lote.peso_inicial) : "");
  
  const [pesoFinal, setPesoFinal] = useState<string>(lote.peso_final ? String(lote.peso_final) : "");

  // Transporte
  const [idVehiculo, setIdVehiculo] = useState<string | null>(lote.id_vehiculo ? String(lote.id_vehiculo) : null);
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(
    lote.id_empresa_transporte ? String(lote.id_empresa_transporte) : null
  );
  const [idConductor, setIdConductor] = useState<string | null>(lote.id_conductor ? String(lote.id_conductor) : null);

  // Evidencias
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>(lote.lote_evidencias || []);
  const [submitting, setSubmitting] = useState(false);

  const handleRemoveExistente = (path_relativo: string) => {
    setEvidenciasExistentes((prev) => prev.filter((e) => e.path_relativo !== path_relativo));
  };

  // Carga de catálogos
  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resProv, resZonas, resCond, resVeh, resTipos, resEmp] = await Promise.all([
        AuxService.get_proveedores(),
        AuxService.get_zonas_origen(),
        AuxService.get_conductores(),
        AuxService.get_vehiculos(),
        AuxService.get_tipos_vehiculo(),
        AuxService.get_empresas_transporte(),
      ]);

      setProveedores(resProv.data || []);
      setZonas(resZonas || []);
      setConductores(resCond || []);
      setVehiculos(resVeh || []);
      setTiposVehiculo(resTipos || []);
      setEmpresasTransporte(resEmp || []);
    } catch (e) {
      console.error("Error al cargar catálogos en edición de lote", e);
      notifyError("Ocurrió un error al cargar la información de los catálogos.");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchCatalogos();
      // Reiniciar estados del formulario con el lote seleccionado
      setIdProveedor(lote.id_proveedor ? String(lote.id_proveedor) : null);
      setIdZona(lote.id_zona_origen ? String(lote.id_zona_origen) : null);
      setContacto(lote.lote_numero_contacto || "");
      setProducto(lote.lote_tipo_producto || TipoMineral.Aurifero);
      setMaterial(lote.lote_tipo_mineral || "Mixto");
      setPesoInicial(lote.peso_inicial ? String(lote.peso_inicial) : "");
      setPesoFinal(lote.peso_final ? String(lote.peso_final) : "");
      setIdVehiculo(lote.id_vehiculo ? String(lote.id_vehiculo) : null);
      setIdEmpresaTransporte(lote.id_empresa_transporte ? String(lote.id_empresa_transporte) : null);
      setIdConductor(lote.id_conductor ? String(lote.id_conductor) : null);
      setEvidenciasExistentes(lote.lote_evidencias || []);
      setEvidencias([]);
      setCondicionIngreso(lote.lote_condicion_ingreso || CondicionIngreso.Comercializacion);
      setMotivo("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, lote]);

  const handleProveedorChange = (val: string | null) => {
    setIdProveedor(val);
    if (val) {
      const p = proveedores.find((x) => String(x.id_proveedor) === val);
      if (p && p.telefono) {
        setContacto(p.telefono);
      }
    }
  };

  const handleCreatedProveedor = (nuevo: RES_Proveedor) => {
    setProveedores((prev) => {
      const sinDuplicado = prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor);
      return [nuevo, ...sinDuplicado];
    });
    setIdProveedor(String(nuevo.id_proveedor));
    if (nuevo.telefono) {
      setContacto(nuevo.telefono);
    }
    setOpenProveedorModal(false);
  };

  const handleCreatedConductor = (nuevo: RES_Conductor) => {
    setConductores((prev) => {
      const sinDuplicado = prev.filter((c) => c.id_conductor !== nuevo.id_conductor);
      return [nuevo, ...sinDuplicado];
    });
    setIdConductor(String(nuevo.id_conductor));
    setOpenConductorModal(false);
  };

  const handleCreatedEmpresaTransporte = (nuevo: EmpresaTransporteResponse) => {
    const mapped: RES_EmpresaTransporte = {
      id_empresa_transporte: nuevo.id,
      ruc: nuevo.ruc,
      razon_social: nuevo.razon_social,
      estado: nuevo.estado,
    };
    setEmpresasTransporte((prev) => {
      const sinDuplicado = prev.filter((et) => et.id_empresa_transporte !== mapped.id_empresa_transporte);
      return [mapped, ...sinDuplicado];
    });
    setIdEmpresaTransporte(String(nuevo.id));
    setOpenEmpresaTransporteModal(false);
  };

  // Valores calculados
  const pesoBruto = pesoInicial ? Number(pesoInicial) : 0;
  const tara = pesoFinal ? Number(pesoFinal) : 0;
  const pesoNeto = pesoBruto - tara;

  const handleConfirmar = async () => {
    if (!pesoBruto || pesoBruto <= 0) {
      notifyError("Debe ingresar un peso inicial válido y mayor a cero.");
      return;
    }

    if (pesoFinal && (isNaN(Number(pesoFinal)) || Number(pesoFinal) <= 0)) {
      notifyError("Debe ingresar un peso final (tara) válido.");
      return;
    }

    if (pesoFinal && Number(pesoFinal) >= pesoBruto) {
      notifyError("El peso final (tara) no puede ser mayor o igual al peso inicial (bruto).");
      return;
    }

    setSubmitting(true);
    try {
      const dto: DTO_PesoFinal = {
        peso_inicial: pesoBruto,
        peso_final: pesoFinal ? Number(pesoFinal) : 0,
        evidencias: evidencias,
        evidencias_existentes: evidenciasExistentes,
        id_proveedor_minero: idProveedor ? Number(idProveedor) : null,
        id_zona_origen: idZona ? Number(idZona) : null,
        numero_contacto: contacto,
        tipo_producto: producto,
        tipo_mineral: material,
        id_vehiculo: idVehiculo ? Number(idVehiculo) : null,
        id_empresa_transporte: idEmpresaTransporte ? Number(idEmpresaTransporte) : null,
        id_conductor: idConductor ? Number(idConductor) : null,
        condicion_ingreso: condicionIngreso,
        motivo: motivo || undefined,
      };

      // El modal sólo se renderiza para filas LOTE_RECEPCION (id_lote garantizado).
      if (lote.id_lote == null) {
        notifyError("Esta fila no corresponde a un lote editable.");
        return;
      }
      await RecepcionMineralService.actualizar_lote(lote.id_lote, dto);
      notifySuccess("Lote actualizado correctamente");
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-semibold text-xs mb-1.5",
  };

  const selectComboboxProps = {
    transitionProps: { transition: "pop-top-left" as const, duration: 150 },
    dropdownPadding: 6,
    shadow: "md",
    withinPortal: true,
  };

  const selectClassNames = {
    ...fieldClasses,
    dropdown: "bg-zinc-950 border-zinc-800 text-white rounded-lg shadow-2xl",
    option:
      "hover:bg-zinc-900 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors py-2 px-3 data-[selected]:bg-indigo-600 data-[selected]:text-white",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title={`Editar Información del Lote: ${lote.lote_correlativo}`}
      size="xl"
    >
      <Stack gap="md" className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {/* Sección 1: Detalles del Lote y Mineral (3 columnas, todas md:4) */}
            <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
              <Text size="xs" fw={800} className="text-indigo-400 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
                Detalles del Lote y Mineral
              </Text>

              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    label="Condición de Ingreso:"
                    placeholder="Seleccione"
                    data={[
                      { value: CondicionIngreso.Comercializacion, label: "Comercialización" },
                      { value: CondicionIngreso.Chancado, label: "Chancado" },
                      { value: CondicionIngreso.Almacen, label: "Almacén" },
                    ]}
                    value={condicionIngreso}
                    onChange={(val) => setCondicionIngreso(val || CondicionIngreso.Comercializacion)}
                    classNames={selectClassNames}
                    radius="lg"
                    comboboxProps={selectComboboxProps}
                    required
                  />
                </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Proveedor Minero:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione"}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={proveedores.map((p) => ({ value: String(p.id_proveedor), label: `${p.razon_social} (${p.documento})` }))}
                  value={idProveedor}
                  onChange={handleProveedorChange}
                  classNames={selectClassNames}
                  radius="lg"
                  comboboxProps={selectComboboxProps}
                  className="flex-1"
                />
                <Tooltip label="Registrar Proveedor Minero" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenProveedorModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Producto:"
                placeholder="Seleccione"
                data={[TipoMineral.Aurifero, TipoMineral.Polimetalico]}
                value={producto}
                onChange={(val) => setProducto(val || TipoMineral.Aurifero)}
                classNames={selectClassNames}
                radius="lg"
                comboboxProps={selectComboboxProps}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Tipo Material:"
                placeholder="Seleccione"
                data={["Mixto", "Óxido", "Sulfuro"]}
                value={material}
                onChange={(val) => setMaterial(val || "Mixto")}
                classNames={selectClassNames}
                radius="lg"
                comboboxProps={selectComboboxProps}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Zona Origen:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione..."}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={zonas.map((z) => ({ value: String(z.id), label: z.nombre }))}
                  value={idZona}
                  onChange={setIdZona}
                  classNames={selectClassNames}
                  radius="lg"
                  comboboxProps={selectComboboxProps}
                  className="flex-1"
                />
                <Tooltip label="Agregar Zona de Origen" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenZonaModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="N° Contacto:"
                value={contacto}
                onChange={(e) => setContacto(e.currentTarget.value)}
                classNames={fieldClasses}
                radius="lg"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="Peso Inicial (Kg):"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.currentTarget.value.replace(/\D/g, ""))}
                classNames={fieldClasses}
                radius="lg"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="Peso Final / Tara (Kg):"
                value={pesoFinal}
                onChange={(e) => setPesoFinal(e.currentTarget.value.replace(/\D/g, ""))}
                classNames={fieldClasses}
                radius="lg"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Input.Wrapper label="Peso Neto (Kg):" classNames={fieldClasses}>
                <Tooltip label="Calculado automáticamente (Peso Inicial − Tara)" withArrow>
                  <div className="bg-gradient from-emerald-950/40 to-zinc-950/60 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center h-9.5 shadow-inner shadow-emerald-900/20">
                    <Text size="sm" fw={900} c="emerald.3" className="font-mono leading-none">
                      {pesoNeto >= 0 ? pesoNeto.toLocaleString() : "0"}
                    </Text>
                  </div>
                </Tooltip>
              </Input.Wrapper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Sección 2: Datos de Transporte (3 columnas) */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text size="xs" fw={800} className="text-amber-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
            Datos de Transporte
          </Text>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Vehículo / Placa:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione placa"}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={vehiculos.map((v) => ({
                    value: String(v.id_vehiculo),
                    label: String(v.placa || `Vehículo #${v.id_vehiculo}`),
                  }))}
                  value={idVehiculo}
                  onChange={setIdVehiculo}
                  classNames={selectClassNames}
                  radius="lg"
                  comboboxProps={selectComboboxProps}
                  className="flex-1"
                />
                <Tooltip label="Agregar Vehículo" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenVehiculoModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Empresa de Transporte:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Particular / Propio"}
                  searchable
                  clearable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={empresasTransporte.map((et) => ({
                    value: String(et.id_empresa_transporte),
                    label: et.razon_social,
                  }))}
                  value={idEmpresaTransporte}
                  onChange={setIdEmpresaTransporte}
                  classNames={selectClassNames}
                  radius="lg"
                  comboboxProps={selectComboboxProps}
                  className="flex-1"
                />
                <Tooltip label="Agregar Empresa de Transporte" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenEmpresaTransporteModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Conductor:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione conductor"}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={conductores.map((c) => ({
                    value: String(c.id_conductor),
                    label: `${c.nombre_completo} (${c.numero_licencia || "Sin Licencia"})`,
                  }))}
                  value={idConductor}
                  onChange={setIdConductor}
                  classNames={selectClassNames}
                  radius="lg"
                  comboboxProps={selectComboboxProps}
                  className="flex-1"
                />
                <Tooltip label="Agregar Conductor" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenConductorModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Sección 3: Gestor de Evidencias (ancho completo) */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl">
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            existingFiles={evidenciasExistentes}
            onRemoveExisting={handleRemoveExistente}
            label="Gestor de Evidencias"
            description="Archivos existentes en el servidor y nuevos por adjuntar"
          />
        </div>

        {/* Sección 4: Auditoría */}
        <Paper radius="xl" p="md" className="bg-zinc-900/10 border border-zinc-900/80">
          <Text size="xs" fw={800} className="text-amber-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-900">
            Auditoría
          </Text>
          <TextInput
            label="Motivo del Cambio (Opcional):"
            placeholder="Indique el motivo por el cual realiza los cambios (auditoría)..."
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
            classNames={fieldClasses}
            radius="lg"
          />
        </Paper>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-zinc-800">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onClose}
            disabled={submitting}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            radius="lg"
            loading={submitting}
            onClick={handleConfirmar}
            leftSection={<IconDeviceFloppy size={18} />}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-900/20 px-8"
          >
            Guardar Cambios
          </Button>
        </div>
      </Stack>

      {/* Sub-Modal: Registro de Nueva Zona de Origen */}
      <ModalEstandar
        opened={openZonaModal}
        close={() => setOpenZonaModal(false)}
        title="Registrar Nueva Zona de Origen"
        size="sm"
      >
        <FormZonaOrigen
          nombre={nuevaZonaNombre}
          setNombre={setNuevaZonaNombre}
          zonasExistentes={zonas}
          onSuccess={(nueva) => {
            setZonas((prev) => [...prev, nueva]);
            setIdZona(String(nueva.id));
            setNuevaZonaNombre("");
            setOpenZonaModal(false);
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro Rápido de Nuevo Vehículo */}
      <ModalEstandar
        opened={openVehiculoModal}
        close={() => setOpenVehiculoModal(false)}
        title="Registrar Vehículo (Rápido)"
        size="sm"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={idEmpresaTransporte ? Number(idEmpresaTransporte) : null}
          idTipoVehiculo={tiposVehiculo.find((t) => t.estado === EstadoBase.Activo)?.id_tipo_vehiculo ?? null}
          onCancel={() => setOpenVehiculoModal(false)}
          onSuccess={(nuevo) => {
            setVehiculos((prev) => {
              if (prev.some((v) => v.id_vehiculo === nuevo.id_vehiculo)) {
                return prev;
              }
              return [...prev, nuevo];
            });
            setIdVehiculo(String(nuevo.id_vehiculo));
            setOpenVehiculoModal(false);
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro Rápido de Nuevo Proveedor Minero */}
      <ModalEstandar
        opened={openProveedorModal}
        close={() => setOpenProveedorModal(false)}
        title="Registrar Proveedor Minero"
        size="lg"
      >
        <RegistroProveedorMineroSimple
          onCancel={() => setOpenProveedorModal(false)}
          onSuccess={handleCreatedProveedor}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro Rápido de Nueva Empresa de Transporte */}
      <ModalEstandar
        opened={openEmpresaTransporteModal}
        close={() => setOpenEmpresaTransporteModal(false)}
        title="Registrar Empresa de Transporte"
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenEmpresaTransporteModal(false)}
          onSuccess={handleCreatedEmpresaTransporte}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro Rápido de Nuevo Conductor */}
      <ModalEstandar
        opened={openConductorModal}
        close={() => setOpenConductorModal(false)}
        title="Registrar Conductor"
        size="sm"
      >
        <RegistroConductor
          onCancel={() => setOpenConductorModal(false)}
          onSuccess={handleCreatedConductor}
        />
      </ModalEstandar>
    </ModalEstandar>
  );
};
