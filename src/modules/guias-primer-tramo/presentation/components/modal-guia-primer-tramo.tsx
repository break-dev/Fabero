import { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Grid,
  Select,
  TextInput,
  Switch,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Table,
  Text,
  Loader,
} from "@mantine/core";
import {
  IconCalendar,
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconFileText,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { ModalConcesionesProveedor } from "../../../../presentation/utils/modal-concesiones-proveedor";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { ConcesionesPorProveedorService, LotesMineralService } from "../../service/guias-primer-tramo.service";
import type { RES_ConcesionPorProveedor } from "../../service/guias-primer-tramo.responses";
import type { RES_LoteMineralDisponible } from "../../service/guias-primer-tramo.responses";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { ProveedorResponse } from "../../../proveedores-mineros/service/proveedores.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import { MOTIVO_TRASLADO_OPTIONS } from "../../../../shared/enums/_generic/motivo-traslado";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "../../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";

interface Props {
  opened: boolean;
  idSucursal: number;
  guia?: RES_GuiaPrimerTramo | null;
  onClose: () => void;
  onSubmit: (dto: DTO_CrearGuiaPrimerTramo) => Promise<void>;
  onUpdate?: (id: number, dto: DTO_ActualizarGuiaPrimerTramo) => Promise<void>;
}

interface LoteFormItem {
  tempId: string;
  id_lote_mineral: number;
  correlativo: string;
  peso_bruto: number;
  tara: number;
  peso_neto: number;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
  label: "text-zinc-400 font-medium text-xs mb-1 whitespace-nowrap",
};

export const ModalGuiaPrimerTramo = ({ opened, idSucursal, guia, onClose, onSubmit, onUpdate }: Props) => {
  const { notifyError } = useNotify();

  // Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [carretas, setCarretas] = useState<RES_Vehiculo[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<RES_EmpresaTransporte[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  // Loading por catálogo
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingEmpresasTransporte, setLoadingEmpresasTransporte] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

  // Estados del formulario
  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [concesiones, setConcesiones] = useState<RES_ConcesionPorProveedor[]>([]);
  const [loadingConcesiones, setLoadingConcesiones] = useState(false);
  const [idConcesion, setIdConcesion] = useState<string | null>(null);

  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idVehiculo, setIdVehiculo] = useState<string | null>(null);
  const [idEmpresaTransporte, setIdEmpresaTransporte] = useState<string | null>(null);

  const [idVehiculoCarreta, setIdVehiculoCarreta] = useState<string | null>(null);
  const [idEmpresaTransporteCarreta, setIdEmpresaTransporteCarreta] = useState<string | null>(null);

  const [motivoTraslado, setMotivoTraslado] = useState<string | null>(null);
  const [fechaInicioTraslado, setFechaInicioTraslado] = useState<string | null>(null);
  const [fechaEmision, setFechaEmision] = useState<string | null>(null);
  const [fechaEnPlanta, setFechaEnPlanta] = useState<string | null>(null);

  const [serieGuiaRemitente, setSerieGuiaRemitente] = useState("");
  const [numeroGuiaRemitente, setNumeroGuiaRemitente] = useState("");
  const [serieGuiaTransportista, setSerieGuiaTransportista] = useState("");
  const [numeroGuiaTransportista, setNumeroGuiaTransportista] = useState("");
  const [sinGuiaTransportista, setSinGuiaTransportista] = useState(false);

  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>([]);
  const [lotes, setLotes] = useState<LoteFormItem[]>([]);
  // Sub-modal selección de lote
  const [openLoteModal, setOpenLoteModal] = useState(false);
  const [lotesDisponibles, setLotesDisponibles] = useState<RES_LoteMineralDisponible[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Sub-modales de registro rápido de proveedor y concesión
  const [openedModalProveedor, setOpenedModalProveedor] = useState(false);
  const [openedModalConcesion, setOpenedModalConcesion] = useState(false);

  const reloadProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const res = await AuxService.get_proveedores();
      setProveedores(res.data ?? []);
    } catch (e) {
      console.error("Error al recargar proveedores", e);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const reloadConcesiones = async (provId: number) => {
    setLoadingConcesiones(true);
    try {
      const data = await ConcesionesPorProveedorService.get_concesiones_by_proveedor(provId);
      setConcesiones(data);
    } catch (e) {
      console.error("Error al recargar concesiones del proveedor", e);
    } finally {
      setLoadingConcesiones(false);
    }
  };

  const handleProveedorCreado = async (nuevo: ProveedorResponse) => {
    await reloadProveedores();
    setIdProveedor(String(nuevo.id_proveedor));
  };

  const handleConcesionCreada = async (newIdConcesion: number) => {
    if (idProveedor) {
      await reloadConcesiones(Number(idProveedor));
      setIdConcesion(String(newIdConcesion));
    }
  };

  // Cargar datos al abrir en modo Edición o limpiar en creación
  useEffect(() => {
    if (opened) {
      if (guia) {
        setIdProveedor(guia.id_proveedor ? String(guia.id_proveedor) : null);
        setIdConcesion(guia.id_concesion ? String(guia.id_concesion) : null);
        setIdConductor(guia.id_conductor ? String(guia.id_conductor) : null);
        setIdVehiculo(guia.id_vehiculo ? String(guia.id_vehiculo) : null);
        setIdEmpresaTransporte(guia.id_empresa_transporte ? String(guia.id_empresa_transporte) : null);
        setIdVehiculoCarreta(guia.id_vehiculo_carreta ? String(guia.id_vehiculo_carreta) : null);
        setIdEmpresaTransporteCarreta(guia.id_empresa_transporte_carreta ? String(guia.id_empresa_transporte_carreta) : null);
        setMotivoTraslado(guia.motivo_traslado || null);
        setFechaInicioTraslado(guia.fecha_inicio_traslado ? guia.fecha_inicio_traslado.slice(0, 10) : null);
        setFechaEmision(guia.fecha_emision ? guia.fecha_emision.slice(0, 10) : null);
        setFechaEnPlanta(guia.fecha_en_planta ? guia.fecha_en_planta.slice(0, 10) : null);
        setSerieGuiaRemitente(guia.serie_guia_remitente || "");
        setNumeroGuiaRemitente(guia.numero_guia_remitente || "");
        setSerieGuiaTransportista(guia.serie_guia_transportista || "");
        setNumeroGuiaTransportista(guia.numero_guia_transportista || "");
        setSinGuiaTransportista(!!guia.sin_guia_transportista);
        setEvidencias([]);
        setEvidenciasExistentes((guia.evidencias as unknown as IArchivo[]) || []);

        const mappedLotes: LoteFormItem[] = (guia.lotes || []).map((l) => ({
          tempId: `${l.id_lote_mineral}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          id_lote_mineral: l.id_lote_mineral,
          correlativo: l.lote_correlativo || "",
          peso_bruto: l.peso_bruto ?? 0,
          tara: l.tara ?? 0,
          peso_neto: (l.peso_bruto ?? 0) - (l.tara ?? 0),
        }));
        setLotes(mappedLotes);
      } else {
        resetForm();
      }
    }
  }, [opened, guia]);

  // Cargar catálogos globales al abrir el modal
  useEffect(() => {
    if (!opened) return;
    let isMounted = true;

    const loadProveedores = async () => {
      setLoadingProveedores(true);
      try {
        const res = await AuxService.get_proveedores();
        if (isMounted) setProveedores(res.data ?? []);
      } catch (e) {
        console.error("Error al cargar proveedores", e);
      } finally {
        if (isMounted) setLoadingProveedores(false);
      }
    };

    const loadVehiculos = async () => {
      setLoadingVehiculos(true);
      try {
        const [tractorRes, carretaRes] = await Promise.all([
          AuxService.get_vehiculos(),
          AuxService.get_vehiculos(),
        ]);
        if (isMounted) {
          setVehiculos(tractorRes.filter((v) => !v.es_carreta || Number(v.es_carreta) === 0));
          setCarretas(carretaRes.filter((v) => !!v.es_carreta && Number(v.es_carreta) === 1));
        }
      } catch (e) {
        console.error("Error al cargar vehículos", e);
      } finally {
        if (isMounted) setLoadingVehiculos(false);
      }
    };

    const loadEmpresas = async () => {
      setLoadingEmpresasTransporte(true);
      try {
        const res = await AuxService.get_empresas_transporte();
        if (isMounted) setEmpresasTransporte(res);
      } catch (e) {
        console.error("Error al cargar empresas de transporte", e);
      } finally {
        if (isMounted) setLoadingEmpresasTransporte(false);
      }
    };

    const loadConductores = async () => {
      setLoadingConductores(true);
      try {
        const res = await AuxService.get_conductores();
        if (isMounted) setConductores(res);
      } catch (e) {
        console.error("Error al cargar conductores", e);
      } finally {
        if (isMounted) setLoadingConductores(false);
      }
    };

    loadProveedores();
    loadVehiculos();
    loadEmpresas();
    loadConductores();

    return () => {
      isMounted = false;
    };
  }, [opened]);

  // Cargar concesiones cuando cambia el proveedor
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!idProveedor) {
        setConcesiones([]);
        setIdConcesion(null);
        return;
      }
      setLoadingConcesiones(true);
      try {
        const data = await ConcesionesPorProveedorService.get_concesiones_by_proveedor(Number(idProveedor));
        if (isMounted) {
          setConcesiones(data);
          setIdConcesion((current) => {
            if (current && data.find((c) => String(c.id_concesion) === current)) {
              return current;
            }
            return null;
          });
        }
      } catch (e) {
        console.error("Error al cargar concesiones del proveedor", e);
      } finally {
        if (isMounted) setLoadingConcesiones(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [idProveedor]);

  // Al seleccionar vehículo tractor, autocompletar la empresa de transporte
  useEffect(() => {
    if (!idVehiculo) {
      setIdEmpresaTransporte(null);
      return;
    }
    const vehiculo = vehiculos.find((v) => v.id_vehiculo === Number(idVehiculo));
    if (vehiculo && vehiculo.id_empresa_transporte) {
      setIdEmpresaTransporte(String(vehiculo.id_empresa_transporte));
    }
  }, [idVehiculo, vehiculos]);

  // Al seleccionar vehículo carreta, autocompletar la empresa de transporte carreta
  useEffect(() => {
    if (!idVehiculoCarreta) {
      setIdEmpresaTransporteCarreta(null);
      return;
    }
    const vehiculo = carretas.find((v) => v.id_vehiculo === Number(idVehiculoCarreta));
    if (vehiculo && vehiculo.id_empresa_transporte) {
      setIdEmpresaTransporteCarreta(String(vehiculo.id_empresa_transporte));
    }
  }, [idVehiculoCarreta, carretas]);

  // Cuando cambia fecha_inicio_traslado, sincronizar fecha_emision y fecha_en_planta
  const setFechas = (value: string | null) => {
    setFechaInicioTraslado(value);
    setFechaEmision(value);
    setFechaEnPlanta(value);
  };

  // Cargar lotes disponibles (sin filtrar por proveedor) cuando se abre el sub-modal
  const handleOpenLoteModal = async () => {
    setOpenLoteModal(true);
    setLoadingLotes(true);
    try {
      const data = await LotesMineralService.get_lotes_disponibles(idSucursal);
      const yaSeleccionados = new Set(lotes.map((l) => l.id_lote_mineral));
      setLotesDisponibles(data.filter((l) => !yaSeleccionados.has(l.id) && !l.en_guia));
    } catch (e) {
      console.error("Error al cargar lotes disponibles", e);
      notifyError("No se pudieron cargar los lotes de mineral disponibles.");
    } finally {
      setLoadingLotes(false);
    }
  };

  /**
   * Iguala los peso_neto de todos los lotes al del lote `anchorIndex`.
   * Cada lote mantiene su propio `peso_bruto`; se recalcula su `tara`
   * para que `bruto - tara = netoCompartido`.
   *
   * Por qué: cada lote representa una pesada del mismo camión en una balanza;
   * el peso de la carga (neto) debe ser idéntico en todas las pesadas.
   */
  const propagarNetoIgual = (lista: LoteFormItem[], anchorIndex: number): LoteFormItem[] => {
    if (lista.length === 0) return [];
    const copia = lista.map((l) => ({ ...l }));
    const k = Math.min(Math.max(0, anchorIndex), copia.length - 1);

    const netoCompartido = Number(copia[k].peso_bruto ?? 0) - Number(copia[k].tara ?? 0);

    return copia.map((l) => {
      const tara = Number(l.peso_bruto ?? 0) - netoCompartido;
      return {
        ...l,
        tara,
        peso_neto: netoCompartido,
      };
    });
  };

  const handleAgregarLotes = (seleccionados: RES_LoteMineralDisponible[]) => {
    const nuevos: LoteFormItem[] = seleccionados.map((l) => {
      const bruto = l.peso_inicial ?? 0;
      const tara = l.peso_final ?? 0;
      return {
        tempId: `${l.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        id_lote_mineral: l.id,
        correlativo: l.correlativo,
        peso_bruto: bruto,
        tara: tara,
        peso_neto: bruto - tara,
      };
    });
    setLotes((prev) => {
      const combinada = [...prev, ...nuevos];
      const anchor = Math.max(0, prev.length - 1);
      return propagarNetoIgual(combinada, anchor);
    });
    setOpenLoteModal(false);
  };

  const handleEliminarLote = (tempId: string) => {
    setLotes((prev) => {
      const idx = prev.findIndex((l) => l.tempId === tempId);
      if (idx < 0) return prev;
      const filtered = prev.filter((l) => l.tempId !== tempId);
      const anchor = Math.max(0, idx - 1);
      return propagarNetoIgual(filtered, anchor);
    });
  };

  const handleMoverLote = (tempId: string, dir: -1 | 1) => {
    setLotes((prev) => {
      const idx = prev.findIndex((l) => l.tempId === tempId);
      if (idx < 0) return prev;
      const nuevoIdx = idx + dir;
      if (nuevoIdx < 0 || nuevoIdx >= prev.length) return prev;
      const copia = [...prev];
      const [item] = copia.splice(idx, 1);
      copia.splice(nuevoIdx, 0, item);
      return propagarNetoIgual(copia, nuevoIdx);
    });
  };

  const handleLoteChange = (
    tempId: string,
    field: keyof Pick<LoteFormItem, "peso_bruto" | "tara">,
    value: number,
  ) => {
    setLotes((prev) => {
      const idx = prev.findIndex((l) => l.tempId === tempId);
      if (idx < 0) return prev;
      const nuevaLista = prev.map((l) =>
        l.tempId === tempId ? { ...l, [field]: value } : l,
      );
      return propagarNetoIgual(nuevaLista, idx);
    });
  };

  const resetForm = () => {
    setIdProveedor(null);
    setIdConcesion(null);
    setConcesiones([]);
    setIdConductor(null);
    setIdVehiculo(null);
    setIdEmpresaTransporte(null);
    setIdVehiculoCarreta(null);
    setIdEmpresaTransporteCarreta(null);
    setMotivoTraslado("Venta");
    setFechaInicioTraslado(null);
    setFechaEmision(null);
    setFechaEnPlanta(null);
    setSerieGuiaRemitente("");
    setNumeroGuiaRemitente("");
    setSerieGuiaTransportista("");
    setNumeroGuiaTransportista("");
    setSinGuiaTransportista(false);
    setEvidencias([]);
    setEvidenciasExistentes([]);
    setLotes([]);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleConfirmar = async () => {
    if (!idProveedor) return notifyError("Seleccione un proveedor.");
    if (!idConcesion) return notifyError("Seleccione una concesión.");
    if (!idConductor) return notifyError("Seleccione un conductor.");
    if (!idVehiculo) return notifyError("Seleccione un vehículo.");
    if (!motivoTraslado) return notifyError("Seleccione el motivo de traslado.");
    if (lotes.length === 0) return notifyError("Debe agregar al menos un lote a la guía.");
    if (!serieGuiaRemitente && !numeroGuiaRemitente) {
      return notifyError("Debe ingresar la serie y número de guía del remitente.");
    }

    const getFinalDateTime = (
      currentVal: string | null,
      originalVal: string | null | undefined
    ): string | null => {
      if (!currentVal) return null;
      if (originalVal && originalVal.startsWith(currentVal)) {
        return originalVal;
      }
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      return `${currentVal} ${hrs}:${mins}:${secs}`;
    };

    setSubmitting(true);
    try {
      if (guia) {
        if (!onUpdate) return;
        const dto: DTO_ActualizarGuiaPrimerTramo = {
          id_sucursal: idSucursal,
          id_proveedor: Number(idProveedor),
          id_concesion: Number(idConcesion),
          id_conductor: Number(idConductor),
          id_vehiculo: Number(idVehiculo),
          id_empresa_transporte: idEmpresaTransporte ? Number(idEmpresaTransporte) : null,
          id_vehiculo_carreta: idVehiculoCarreta ? Number(idVehiculoCarreta) : null,
          id_empresa_transporte_carreta: idEmpresaTransporteCarreta
            ? Number(idEmpresaTransporteCarreta)
            : null,
          motivo_traslado: motivoTraslado,
          fecha_inicio_traslado: getFinalDateTime(fechaInicioTraslado, guia.fecha_inicio_traslado),
          fecha_emision: getFinalDateTime(fechaEmision, guia.fecha_emision),
          fecha_en_planta: getFinalDateTime(fechaEnPlanta, guia.fecha_en_planta),
          serie_guia_remitente: serieGuiaRemitente || null,
          numero_guia_remitente: numeroGuiaRemitente || null,
          serie_guia_transportista: serieGuiaTransportista || null,
          numero_guia_transportista: numeroGuiaTransportista || null,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: lotes.map((l) => ({
            id_lote_mineral: l.id_lote_mineral,
            peso_bruto: l.peso_bruto,
            tara: l.tara,
          })),
          evidencias,
          evidencias_existentes: evidenciasExistentes,
        };
        await onUpdate(guia.id, dto);
      } else {
        const dto: DTO_CrearGuiaPrimerTramo = {
          id_sucursal: idSucursal,
          id_proveedor: Number(idProveedor),
          id_concesion: Number(idConcesion),
          id_conductor: Number(idConductor),
          id_vehiculo: Number(idVehiculo),
          id_empresa_transporte: idEmpresaTransporte ? Number(idEmpresaTransporte) : null,
          id_vehiculo_carreta: idVehiculoCarreta ? Number(idVehiculoCarreta) : null,
          id_empresa_transporte_carreta: idEmpresaTransporteCarreta
            ? Number(idEmpresaTransporteCarreta)
            : null,
          motivo_traslado: motivoTraslado,
          fecha_inicio_traslado: getFinalDateTime(fechaInicioTraslado, null),
          fecha_emision: getFinalDateTime(fechaEmision, null),
          fecha_en_planta: getFinalDateTime(fechaEnPlanta, null),
          serie_guia_remitente: serieGuiaRemitente || null,
          numero_guia_remitente: numeroGuiaRemitente || null,
          serie_guia_transportista: serieGuiaTransportista || null,
          numero_guia_transportista: numeroGuiaTransportista || null,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: lotes.map((l) => ({
            id_lote_mineral: l.id_lote_mineral,
            peso_bruto: l.peso_bruto,
            tara: l.tara,
          })),
          evidencias,
        };
        await onSubmit(dto);
      }
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const labelConcesion = useMemo(
    () => (loadingConcesiones ? "Concesión: (cargando...)" : "Concesión:"),
    [loadingConcesiones],
  );

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleClose}
        title={guia ? "Editar Guía de Primer Tramo" : "Registrar Guía de Primer Tramo"}
        size="xl"
      >
        <Stack gap="md" className="max-h-[85vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {/* ========== 1. Fechas ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                type="date"
                label="Fecha Inicio Traslado:"
                value={fechaInicioTraslado ?? ""}
                onChange={(e) => setFechas(e.currentTarget.value || null)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                leftSection={<IconCalendar size={14} />}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                type="date"
                label="Fecha Emisión:"
                value={fechaEmision ?? ""}
                onChange={(e) => setFechaEmision(e.currentTarget.value || null)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                leftSection={<IconCalendar size={14} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                type="date"
                label="Fecha En Planta:"
                value={fechaEnPlanta ?? ""}
                onChange={(e) => setFechaEnPlanta(e.currentTarget.value || null)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                leftSection={<IconCalendar size={14} />}
              />
            </Grid.Col>
          </Grid>

          {/* ========== 2. Proveedor y Concesión ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Proveedor:"
                  placeholder={loadingProveedores ? "Cargando..." : "Seleccione"}
                  searchable
                  clearable
                  data={proveedores.map((p) => ({
                    value: String(p.id_proveedor),
                    label: p.razon_social + (p.documento ? ` (${p.documento})` : ""),
                  }))}
                  value={idProveedor}
                  onChange={setIdProveedor}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  disabled={loadingProveedores}
                  rightSection={loadingProveedores ? <Loader size={16} /> : undefined}
                  required
                  className="flex-1"
                />
                <Tooltip label="Registrar Nuevo Proveedor Minero" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalProveedor(true)}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label={labelConcesion}
                  placeholder={loadingConcesiones ? "Cargando..." : "Seleccione"}
                  searchable
                  clearable
                  data={concesiones.map((c) => ({ value: String(c.id_concesion), label: c.nombre }))}
                  value={idConcesion}
                  onChange={setIdConcesion}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  required
                  disabled={!idProveedor || loadingConcesiones}
                  rightSection={loadingConcesiones ? <Loader size={16} /> : undefined}
                  className="flex-1"
                />
                <Tooltip
                  label={idProveedor ? "Asociar o Crear Concesión" : "Seleccione primero un proveedor"}
                  withArrow
                  radius="md"
                >
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    disabled={!idProveedor}
                    onClick={() => setOpenedModalConcesion(true)}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>

          {/* ========== 3. Guías Remitente y Transportista ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 6, sm: 2 }}>
              <TextInput
                label="Serie Remitente:"
                value={serieGuiaRemitente}
                onChange={(e) => setSerieGuiaRemitente(e.currentTarget.value.toUpperCase())}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Número Remitente:"
                value={numeroGuiaRemitente}
                onChange={(e) => setNumeroGuiaRemitente(e.currentTarget.value)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 2 }}>
              <TextInput
                label="Serie Transportista:"
                value={serieGuiaTransportista}
                onChange={(e) => setSerieGuiaTransportista(e.currentTarget.value.toUpperCase())}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={sinGuiaTransportista}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <TextInput
                label="Número Transportista:"
                value={numeroGuiaTransportista}
                onChange={(e) => setNumeroGuiaTransportista(e.currentTarget.value)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={sinGuiaTransportista}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2 }}>
              <div className="flex flex-col">
                <span className="text-zinc-400 font-medium text-xs mb-1 whitespace-nowrap overflow-hidden text-ellipsis" title="Sin Guía Transportista">
                  Sin Guía Transportista:
                </span>
                <div className="flex items-center h-8">
                  <Switch
                    checked={sinGuiaTransportista}
                    onChange={(e) => setSinGuiaTransportista(e.currentTarget.checked)}
                    color="amber"
                    size="sm"
                  />
                </div>
              </div>
            </Grid.Col>
          </Grid>

          {/* ========== 4. Vehículos y Empresas ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Vehículo (Tractor):"
                placeholder={loadingVehiculos ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                data={vehiculos.map((v) => ({
                  value: String(v.id_vehiculo),
                  label: String(v.placa || (v.serie_placa ? `${v.serie_placa}-${v.numero_placa}` : v.numero_placa) || `Vehículo #${v.id_vehiculo}`),
                }))}
                value={idVehiculo}
                onChange={setIdVehiculo}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={loadingVehiculos}
                rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Empresa de Transporte:"
                placeholder={loadingEmpresasTransporte ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                data={empresasTransporte.map((e) => ({ value: String(e.id_empresa_transporte), label: e.razon_social }))}
                value={idEmpresaTransporte}
                onChange={setIdEmpresaTransporte}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={loadingEmpresasTransporte}
                rightSection={loadingEmpresasTransporte ? <Loader size={16} /> : undefined}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Vehículo Carreta:"
                placeholder={loadingVehiculos ? "Cargando..." : "Seleccione (opcional)"}
                searchable
                clearable
                data={carretas.map((v) => ({
                  value: String(v.id_vehiculo),
                  label: String(v.placa || (v.serie_placa ? `${v.serie_placa}-${v.numero_placa}` : v.numero_placa) || `Vehículo #${v.id_vehiculo}`),
                }))}
                value={idVehiculoCarreta}
                onChange={setIdVehiculoCarreta}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={loadingVehiculos}
                rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Empresa de Transporte Carreta:"
                placeholder={loadingEmpresasTransporte ? "Cargando..." : "Seleccione (opcional)"}
                searchable
                clearable
                data={empresasTransporte.map((e) => ({ value: String(e.id_empresa_transporte), label: e.razon_social }))}
                value={idEmpresaTransporteCarreta}
                onChange={setIdEmpresaTransporteCarreta}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={loadingEmpresasTransporte}
                rightSection={loadingEmpresasTransporte ? <Loader size={16} /> : undefined}
              />
            </Grid.Col>
          </Grid>

          {/* ========== 5. Conductor y Motivo de Traslado ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Conductor:"
                placeholder={loadingConductores ? "Cargando..." : "Seleccione"}
                searchable
                clearable
                data={conductores.map((c) => ({
                  value: String(c.id_conductor),
                  label: `${c.nombre_completo} (${c.dni})`,
                }))}
                value={idConductor}
                onChange={setIdConductor}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                disabled={loadingConductores}
                rightSection={loadingConductores ? <Loader size={16} /> : undefined}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Motivo de Traslado:"
                data={MOTIVO_TRASLADO_OPTIONS}
                value={motivoTraslado}
                onChange={setMotivoTraslado}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                required
              />
            </Grid.Col>
          </Grid>

          {/* ========== 7. Lotes Asociados ========== */}
          <div className="flex items-center justify-between">
            <Text size="sm" fw={700} className="text-zinc-200">
              Información de Lotes
            </Text>
            <Button
              size="xs"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={handleOpenLoteModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Agregar Lote
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 shrink-0 min-h-37.5">
            <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-300 text-xs font-semibold">
                  <th className="text-center py-3" style={{ width: 160 }}>N° / Orden</th>
                  <th className="text-left py-3 pl-3">Lote (Correlativo)</th>
                  <th className="text-center py-3" style={{ width: 130 }}>P. Bruto (kg)</th>
                  <th className="text-center py-3" style={{ width: 130 }}>Tara (kg)</th>
                  <th className="text-center py-3" style={{ width: 130 }}>P. Neto (kg)</th>
                </tr>
              </thead>
              <tbody>
                {lotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-zinc-500 text-xs">
                      No hay lotes agregados. Haga clic en "+ Agregar Lote" para seleccionar.
                    </td>
                  </tr>
                ) : (
                  lotes.map((l, idx) => {
                    const neto = Number(l.peso_bruto) - Number(l.tara);
                    return (
                      <tr
                        key={l.tempId}
                        className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors"
                      >
                        <td className="text-center py-2.5">
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-bold text-zinc-400 text-xs w-4">{idx + 1}</span>
                            <div className="flex items-center gap-1 bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-800/80">
                              <Tooltip label="Subir" withArrow position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => handleMoverLote(l.tempId, -1)}
                                  disabled={idx === 0}
                                  className="text-zinc-400 hover:text-blue-400 disabled:opacity-20 disabled:hover:bg-transparent"
                                >
                                  <IconArrowUp size={13} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Bajar" withArrow position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => handleMoverLote(l.tempId, 1)}
                                  disabled={idx === lotes.length - 1}
                                  className="text-zinc-400 hover:text-blue-400 disabled:opacity-20 disabled:hover:bg-transparent"
                                >
                                  <IconArrowDown size={13} />
                                </ActionIcon>
                              </Tooltip>
                              <div className="w-px h-3.5 bg-zinc-800 mx-0.5" />
                              <Tooltip label="Eliminar" withArrow position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => handleEliminarLote(l.tempId)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                >
                                  <IconTrash size={13} />
                                </ActionIcon>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-left pl-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <IconFileText size={14} />
                            </div>
                            <Text size="xs" fw={600} className="text-zinc-200 font-mono tracking-wider">
                              {l.correlativo}
                            </Text>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <TextInput
                            size="xs"
                            type="number"
                            step="0.01"
                            value={String(l.peso_bruto ?? "")}
                            onChange={(e) => handleLoteChange(l.tempId, "peso_bruto", Number(e.currentTarget.value) || 0)}
                            disabled={idx > 0}
                            classNames={{
                              input: idx > 0
                                ? "bg-zinc-950/40 border-transparent text-zinc-400 text-center h-8 cursor-not-allowed select-none opacity-90 font-medium"
                                : "bg-zinc-900/40 border-zinc-800 text-white font-medium focus:border-emerald-500 focus:bg-zinc-900/80 transition-all text-center h-8",
                            }}
                            radius="md"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <TextInput
                            size="xs"
                            type="number"
                            step="0.01"
                            value={String(l.tara ?? "")}
                            onChange={(e) => handleLoteChange(l.tempId, "tara", Number(e.currentTarget.value) || 0)}
                            classNames={{
                              input:
                                "bg-zinc-900/40 border-zinc-800 text-white font-medium focus:border-emerald-500 focus:bg-zinc-900/80 transition-all text-center h-8",
                            }}
                            radius="md"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <TextInput
                            size="xs"
                            type="number"
                            value={neto.toFixed(2)}
                            disabled
                            classNames={{
                              input:
                                "bg-zinc-950/40 border-transparent text-emerald-400 font-bold text-center font-mono h-8 cursor-not-allowed select-none opacity-90",
                            }}
                            radius="md"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* ========== 8. Evidencias ========== */}
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            existingFiles={evidenciasExistentes}
            onRemoveExisting={(path: string) => setEvidenciasExistentes((prev) => prev.filter((e) => e.path_relativo !== path))}
            label="Evidencias de la Guía"
            description="Adjunte imágenes/fotos de la guía (opcional)"
          />

          <Divider my="xs" color="zinc.8" />

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="subtle" color="gray" radius="lg" size="sm" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              radius="lg"
              size="sm"
              loading={submitting}
              onClick={handleConfirmar}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/20 px-6"
            >
              {guia ? "Editar Guía" : "Registrar Guía"}
            </Button>
          </div>
        </Stack>
      </ModalEstandar>

      {/* Submodal para registrar proveedor de forma rápida */}
      <ModalRegistroProveedor
        opened={openedModalProveedor}
        onClose={() => setOpenedModalProveedor(false)}
        onSuccess={handleProveedorCreado}
      />

      {/* Submodal para asociar/crear concesión de forma rápida */}
      {idProveedor && (
        <ModalConcesionesProveedor
          opened={openedModalConcesion}
          idProveedor={Number(idProveedor)}
          nombreProveedor={proveedores.find((p) => String(p.id_proveedor) === idProveedor)?.razon_social}
          onClose={() => setOpenedModalConcesion(false)}
          onSuccess={handleConcesionCreada}
        />
      )}

      {/* Sub-modal selección de lote */}
      <ModalSeleccionarLote
        opened={openLoteModal}
        loading={loadingLotes}
        lotes={lotesDisponibles}
        onClose={() => setOpenLoteModal(false)}
        onConfirm={handleAgregarLotes}
      />
    </>
  );
};

// ============================================================
// Sub-modal para seleccionar lotes de mineral
// ============================================================

interface ModalSeleccionarLoteProps {
  opened: boolean;
  loading: boolean;
  lotes: RES_LoteMineralDisponible[];
  onClose: () => void;
  onConfirm: (seleccionados: RES_LoteMineralDisponible[]) => void;
}

const ModalSeleccionarLote = ({ opened, loading, lotes, onClose, onConfirm }: ModalSeleccionarLoteProps) => {
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [busqueda, setBusqueda] = useState("");

  const handleClose = () => {
    setSeleccionados(new Set());
    setBusqueda("");
    onClose();
  };

  const toggle = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const items = lotes.filter((l) => seleccionados.has(l.id));
    onConfirm(items);
    setSeleccionados(new Set());
    setBusqueda("");
  };

  const filtrados = lotes.filter((l) => {
    if (busqueda.trim() === "") return true;
    const query = busqueda.toLowerCase();
    const matchesCorrelativo = l.correlativo.toLowerCase().includes(query);
    const matchesProveedor = l.proveedor_nombre?.toLowerCase().includes(query) ?? false;
    const matchesPlaca = l.vehiculo_placa?.toLowerCase().includes(query) ?? false;
    return matchesCorrelativo || matchesProveedor || matchesPlaca;
  });

  return (
    <ModalEstandar opened={opened} close={handleClose} title="Seleccionar Lotes de Mineral" size="lg">
      <Stack gap="md">
        <TextInput
          placeholder="Buscar por correlativo, placa o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
          classNames={fieldClasses}
          radius="md"
          size="xs"
        />

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-zinc-800/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Table verticalSpacing="xs" horizontalSpacing="sm" className="w-full">
            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
              <tr className="text-zinc-300 text-xs">
                <th style={{ width: 40 }}></th>
                <th>Correlativo</th>
                <th>Placa</th>
                <th className="text-right">P. Bruto</th>
                <th className="text-right">Tara</th>
                <th className="text-right">P. Neto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-zinc-400 text-xs">Cargando lotes...</td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-zinc-500 text-xs">
                    No hay lotes disponibles para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtrados.map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-zinc-900/40 cursor-pointer hover:bg-zinc-900/30 ${seleccionados.has(l.id) ? "bg-emerald-950/20" : ""}`}
                    onClick={() => toggle(l.id)}
                  >
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(l.id)}
                        onChange={() => toggle(l.id)}
                        className="accent-emerald-500"
                      />
                    </td>
                    <td className="font-mono text-zinc-100 text-xs">{l.correlativo}</td>
                    <td className="text-zinc-300 text-xs">
                      {l.vehiculo_placa ? l.vehiculo_placa.toUpperCase() : "—"}
                    </td>
                    <td className="text-right font-mono text-zinc-200 text-xs">{l.peso_inicial?.toFixed(2) ?? "—"}</td>
                    <td className="text-right font-mono text-zinc-200 text-xs">{l.peso_final?.toFixed(2) ?? "—"}</td>
                    <td className="text-right font-mono text-emerald-300 text-xs">{l.peso_neto?.toFixed(2) ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Text size="xs" c="dimmed">
            {seleccionados.size} seleccionado(s)
          </Text>
          <div className="flex gap-2">
            <Button variant="subtle" color="gray" radius="md" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              radius="md"
              size="sm"
              onClick={handleConfirm}
              disabled={seleccionados.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Agregar {seleccionados.size > 0 ? `(${seleccionados.size})` : ""}
            </Button>
          </div>
        </div>
      </Stack>
    </ModalEstandar>
  );
};