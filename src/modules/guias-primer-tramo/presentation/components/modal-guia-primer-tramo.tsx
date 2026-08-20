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
  Badge,
  FileButton,
  Group as MGroup,
} from "@mantine/core";
import {
  IconCalendar,
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconFileText,
  IconX,
  IconFile,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { ModalConcesionesProveedor } from "../../../../presentation/utils/modal-concesiones-proveedor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import {
  ConcesionesPorProveedorService,
  ItemsMineralService,
} from "../../service/guias-primer-tramo.service";
import type { RES_ConcesionPorProveedor } from "../../service/guias-primer-tramo.responses";
import type { RES_ItemMineralDisponible } from "../../service/guias-primer-tramo.responses";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { ProveedorResponse } from "../../../proveedores-mineros/service/proveedores.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import { MOTIVO_TRASLADO_OPTIONS } from "../../../../shared/enums/_generic/motivo-traslado";
import { CONDICION_INGRESO_OPTIONS } from "../../../../shared/enums/_generic/condicion-ingreso";
import type {
  DTO_CrearGuiaPrimerTramo,
  DTO_ActualizarGuiaPrimerTramo,
  DTO_ItemGuiaInput,
} from "../../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";

interface Props {
  opened: boolean;
  idSucursal: number;
  guia?: RES_GuiaPrimerTramo | null;
  onClose: () => void;
  onSubmit: (dto: DTO_CrearGuiaPrimerTramo) => Promise<void>;
  onUpdate?: (id: number, dto: DTO_ActualizarGuiaPrimerTramo) => Promise<void>;
}

interface ItemFormItem {
  tempId: string;
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
  tipo_item: "LOTE" | "PARTICION";
  correlativo: string;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
}

const fieldClasses = {
  input:
    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
  label: "text-zinc-400 font-medium text-xs mb-1 whitespace-nowrap",
};

/**
 * Identifica unívocamente un item (lote entero o partición).
 *
 * Crítico: una PARTICION tiene `id_lote_mineral` (padre) y `id_particion_lote_mineral`
 * ambos poblados. Si colapsáramos a `id_lote_mineral ?? id_particion_lote_mineral`,
 * dos particiones del mismo lote compartirían key, y seleccionar una marcaría
 * la otra. Acá discriminamos por tipo.
 */
const itemKey = (i: {
  tipo_item: "LOTE" | "PARTICION";
  id_lote_mineral: number | null;
  id_particion_lote_mineral: number | null;
}): string => {
  if (i.tipo_item === "PARTICION") {
    return `PARTICION:${i.id_particion_lote_mineral ?? ""}`;
  }
  return `LOTE:${i.id_lote_mineral ?? ""}`;
};

export const ModalGuiaPrimerTramo = ({ opened, idSucursal, guia, onClose, onSubmit, onUpdate }: Props) => {
  const { notifyError } = useNotify();

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [carretas, setCarretas] = useState<RES_Vehiculo[]>([]);
  const [empresasTransporte, setEmpresasTransporte] = useState<RES_EmpresaTransporte[]>([]);
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingEmpresasTransporte, setLoadingEmpresasTransporte] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(false);

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
  const [condicionIngreso, setCondicionIngreso] = useState<string | null>(null);
  const [fechaInicioTraslado, setFechaInicioTraslado] = useState<string | null>(null);
  const [fechaEmision, setFechaEmision] = useState<string | null>(null);
  const [fechaEnPlanta, setFechaEnPlanta] = useState<string | null>(null);

  const [guiaRemitente, setGuiaRemitente] = useState("");
  const [guiaTransportista, setGuiaTransportista] = useState("");
  const [sinGuiaTransportista, setSinGuiaTransportista] = useState(false);

  const [documentoGuiaRemitente, setDocumentoGuiaRemitente] = useState<File | null>(null);
  const [documentoGuiaTransportista, setDocumentoGuiaTransportista] = useState<File | null>(null);

  const [items, setItems] = useState<ItemFormItem[]>([]);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemsDisponibles, setItemsDisponibles] = useState<RES_ItemMineralDisponible[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [openedModalProveedor, setOpenedModalProveedor] = useState(false);
  const [openedModalConcesion, setOpenedModalConcesion] = useState(false);

  // Para distinguir tractor/carreta cuando se registra un vehículo o empresa
  const [openedModalVehiculo, setOpenedModalVehiculo] = useState<null | "tractor" | "carreta">(null);
  const [openedModalEmpresa, setOpenedModalEmpresa] = useState<null | "tractor" | "carreta">(null);
  const [openedModalConductor, setOpenedModalConductor] = useState(false);

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

  // Refresca el catálogo de vehículos (tractores/carretas) tras un registro exitoso
  const handleVehiculoCreado = async (
    vehiculo: { id_vehiculo: number; es_carreta?: number | boolean | null },
    destino: "tractor" | "carreta",
  ) => {
    // Re-cargar ambos catálogos desde el backend
    const [tractorRes, carretaRes] = await Promise.all([
      AuxService.get_vehiculos(),
      AuxService.get_vehiculos(),
    ]);
    setVehiculos(tractorRes.filter((v) => !v.es_carreta || Number(v.es_carreta) === 0));
    setCarretas(carretaRes.filter((v) => !!v.es_carreta && Number(v.es_carreta) === 1));
    const idStr = String(vehiculo.id_vehiculo);
    if (destino === "tractor") {
      setIdVehiculo(idStr);
      // Auto-completar empresa si aún no hay
      if (!idEmpresaTransporte) {
        const v = tractorRes.find((x) => x.id_vehiculo === vehiculo.id_vehiculo);
        if (v && v.id_empresa_transporte) {
          setIdEmpresaTransporte(String(v.id_empresa_transporte));
        }
      }
    } else {
      setIdVehiculoCarreta(idStr);
    }
    setOpenedModalVehiculo(null);
  };

  const handleEmpresaCreada = async (
    empresa: { id: number; razon_social?: string },
    destino: "tractor" | "carreta",
  ) => {
    try {
      const lista = await AuxService.get_empresas_transporte();
      setEmpresasTransporte(lista);
    } catch (e) {
      console.error("Error al refrescar empresas de transporte", e);
    }
    const idStr = String(empresa.id);
    if (destino === "tractor") {
      setIdEmpresaTransporte(idStr);
    } else {
      setIdEmpresaTransporteCarreta(idStr);
    }
    setOpenedModalEmpresa(null);
  };

  const handleConductorCreado = (conductor: { id_conductor: number }) => {
    // El hook useRegistroConductor ya hace notifySuccess y refresca el catálogo del módulo.
    // Aquí solo recargamos el nuestro y seleccionamos el nuevo.
    (async () => {
      try {
        const lista = await AuxService.get_conductores();
        setConductores(lista);
      } catch (e) {
        console.error("Error al refrescar conductores", e);
      }
      setIdConductor(String(conductor.id_conductor));
    })();
    setOpenedModalConductor(false);
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
        setIdEmpresaTransporteCarreta(
          guia.id_empresa_transporte_carreta ? String(guia.id_empresa_transporte_carreta) : null,
        );
        setMotivoTraslado(guia.motivo_traslado || null);
        setCondicionIngreso(guia.condicion_ingreso || null);
        setFechaInicioTraslado(guia.fecha_inicio_traslado ? guia.fecha_inicio_traslado.slice(0, 10) : null);
        setFechaEmision(guia.fecha_emision ? guia.fecha_emision.slice(0, 10) : null);
        setFechaEnPlanta(guia.fecha_en_planta ? guia.fecha_en_planta.slice(0, 10) : null);

        // guia_remitente y guia_transportista son strings únicos almacenados en la BD.
        setGuiaRemitente(guia.guia_remitente ?? "");
        setGuiaTransportista(guia.guia_transportista ?? "");
        setSinGuiaTransportista(!!guia.sin_guia_transportista);
        setDocumentoGuiaRemitente(null);
        setDocumentoGuiaTransportista(null);

        const mappedItems: ItemFormItem[] = (guia.lotes || []).map((l) => ({
          tempId: `${itemKey(l)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          id_lote_mineral: l.id_lote_mineral,
          id_particion_lote_mineral: l.id_particion_lote_mineral,
          tipo_item: l.tipo_item,
          correlativo: l.correlativo || "",
          peso_inicial: l.peso_inicial,
          peso_final: l.peso_final,
          peso_neto: l.peso_neto,
          tipo_producto: l.tipo_producto,
          tipo_mineral: l.tipo_mineral,
        }));
        setItems(mappedItems);
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

  // Autocompletar empresa de transporte al elegir vehículo
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

  const setFechas = (value: string | null) => {
    setFechaInicioTraslado(value);
    setFechaEmision(value);
    setFechaEnPlanta(value);
  };

  // Cargar items disponibles (lotes o particiones) sin filtrar por proveedor
  const handleOpenItemModal = async () => {
    setOpenItemModal(true);
    setLoadingItems(true);
    try {
      const data = await ItemsMineralService.get_items_disponibles(idSucursal);
      const yaSeleccionados = new Set(items.map(itemKey));
      setItemsDisponibles(
        data.filter((i) => !yaSeleccionados.has(itemKey(i)) && !i.en_guia),
      );
    } catch (e) {
      console.error("Error al cargar items disponibles", e);
      notifyError("No se pudieron cargar los items de mineral disponibles.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAgregarItems = (seleccionados: RES_ItemMineralDisponible[]) => {
    const nuevos: ItemFormItem[] = seleccionados.map((i) => ({
      tempId: `${itemKey(i)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      id_lote_mineral: i.id_lote_mineral,
      id_particion_lote_mineral: i.id_particion_lote_mineral,
      tipo_item: i.tipo_item,
      correlativo: i.correlativo,
      peso_inicial: i.peso_inicial,
      peso_final: i.peso_final,
      peso_neto: i.peso_neto,
      tipo_producto: i.tipo_producto,
      tipo_mineral: i.tipo_mineral,
    }));
    setItems((prev) => [...prev, ...nuevos]);
    setOpenItemModal(false);
  };

  const handleEliminarItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleMoverItem = (tempId: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.tempId === tempId);
      if (idx < 0) return prev;
      const nuevoIdx = idx + dir;
      if (nuevoIdx < 0 || nuevoIdx >= prev.length) return prev;
      const copia = [...prev];
      const [item] = copia.splice(idx, 1);
      copia.splice(nuevoIdx, 0, item);
      return copia;
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
    setCondicionIngreso(null);
    setFechaInicioTraslado(null);
    setFechaEmision(null);
    setFechaEnPlanta(null);
    setGuiaRemitente("");
    setGuiaTransportista("");
    setSinGuiaTransportista(false);
    setDocumentoGuiaRemitente(null);
    setDocumentoGuiaTransportista(null);
    setItems([]);
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
    if (items.length === 0) return notifyError("Debe agregar al menos un item a la guía.");

    const guiaRemitenteTrim = guiaRemitente.trim();
    if (!guiaRemitenteTrim) {
      return notifyError("Debe ingresar el número de guía del remitente.");
    }

    const numeroGuiaTransportista = sinGuiaTransportista
      ? null
      : guiaTransportista.trim() || null;

    const getFinalDateTime = (
      currentVal: string | null,
      originalVal: string | null | undefined,
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

    const itemsDto: DTO_ItemGuiaInput[] = items.map((i) => ({
      id_lote_mineral: i.id_lote_mineral,
      id_particion_lote_mineral: i.id_particion_lote_mineral,
    }));

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
          condicion_ingreso: condicionIngreso,
          fecha_inicio_traslado: getFinalDateTime(fechaInicioTraslado, guia.fecha_inicio_traslado),
          fecha_emision: getFinalDateTime(fechaEmision, guia.fecha_emision),
          fecha_en_planta: getFinalDateTime(fechaEnPlanta, guia.fecha_en_planta),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: itemsDto,
          documento_guia_remitente: documentoGuiaRemitente,
          documento_guia_transportista: sinGuiaTransportista ? null : documentoGuiaTransportista,
          motivo: null,
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
          condicion_ingreso: condicionIngreso,
          fecha_inicio_traslado: getFinalDateTime(fechaInicioTraslado, null),
          fecha_emision: getFinalDateTime(fechaEmision, null),
          fecha_en_planta: getFinalDateTime(fechaEnPlanta, null),
          guia_remitente: guiaRemitenteTrim,
          guia_transportista: numeroGuiaTransportista,
          sin_guia_transportista: sinGuiaTransportista,
          lotes: itemsDto,
          documento_guia_remitente: documentoGuiaRemitente,
          documento_guia_transportista: sinGuiaTransportista ? null : documentoGuiaTransportista,
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

  const fileRemitenteLabel = documentoGuiaRemitente
    ? documentoGuiaRemitente.name
    : guia?.documentos?.guia_remitente?.nombre_original ?? null;

  const fileTransportistaLabel = sinGuiaTransportista
    ? null
    : documentoGuiaTransportista
    ? documentoGuiaTransportista.name
    : guia?.documentos?.guia_transportista?.nombre_original ?? null;

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
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput
                label="N° Guía Remitente:"
                placeholder="Ej. 001-12345"
                value={guiaRemitente}
                onChange={(e) => setGuiaRemitente(e.currentTarget.value.toUpperCase())}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                maxLength={20}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput
                label="N° Guía Transportista:"
                placeholder="Ej. 001-12345"
                value={guiaTransportista}
                onChange={(e) => setGuiaTransportista(e.currentTarget.value.toUpperCase())}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                maxLength={20}
                disabled={sinGuiaTransportista}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2 }}>
              <div className="flex flex-col">
                <span className="text-zinc-400 font-medium text-xs mb-1 whitespace-nowrap overflow-hidden text-ellipsis" title="Sin Guía Transportista">
                  Sin Guía Transp.:
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
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Vehículo (Tractor):"
                  placeholder={loadingVehiculos ? "Cargando..." : "Seleccione"}
                  searchable
                  clearable
                  data={vehiculos.map((v) => ({
                    value: String(v.id_vehiculo),
                    label: String(v.placa || `Vehículo #${v.id_vehiculo}`),
                  }))}
                  value={idVehiculo}
                  onChange={setIdVehiculo}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  disabled={loadingVehiculos}
                  rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                  required
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo Vehículo" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalVehiculo("tractor")}
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
                  className="flex-1"
                />
                <Tooltip label="Registrar nueva Empresa de Transporte" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalEmpresa("tractor")}
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
                  label="Vehículo Carreta:"
                  placeholder={loadingVehiculos ? "Cargando..." : "Seleccione (opcional)"}
                  searchable
                  clearable
                  data={carretas.map((v) => ({
                    value: String(v.id_vehiculo),
                    label: String(v.placa || `Vehículo #${v.id_vehiculo}`),
                  }))}
                  value={idVehiculoCarreta}
                  onChange={setIdVehiculoCarreta}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
                  disabled={loadingVehiculos}
                  rightSection={loadingVehiculos ? <Loader size={16} /> : undefined}
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo Vehículo Carreta" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalVehiculo("carreta")}
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
                  className="flex-1"
                />
                <Tooltip label="Registrar nueva Empresa de Transporte Carreta" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalEmpresa("carreta")}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>

          {/* ========== 5. Conductor, Motivo, Condición ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
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
                  className="flex-1"
                />
                <Tooltip label="Registrar nuevo Conductor" withArrow radius="md">
                  <ActionIcon
                    size="30px"
                    radius="lg"
                    variant="filled"
                    color="indigo"
                    onClick={() => setOpenedModalConductor(true)}
                    className="mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
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
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Condición de Ingreso:"
                placeholder="Seleccione (opcional)"
                clearable
                data={CONDICION_INGRESO_OPTIONS}
                value={condicionIngreso}
                onChange={setCondicionIngreso}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
              />
            </Grid.Col>
          </Grid>

          {/* ========== 6. Documentos de las Guías (subidos por separado) ========== */}
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium text-xs mb-1">Documento Guía Remitente:</span>
                <MGroup gap="xs" wrap="nowrap">
                  <FileButton
                    onChange={(file) => setDocumentoGuiaRemitente(file)}
                    accept="application/pdf,image/*"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        color="indigo"
                        radius="md"
                        size="xs"
                        leftSection={<IconFile size={14} />}
                      >
                        {documentoGuiaRemitente ? "Reemplazar" : "Subir PDF / Imagen"}
                      </Button>
                    )}
                  </FileButton>
                  {fileRemitenteLabel && (
                    <div className="flex items-center gap-1 text-xs text-zinc-300 truncate">
                      <IconFileText size={14} className="text-zinc-500" />
                      <span className="truncate max-w-50" title={fileRemitenteLabel}>
                        {fileRemitenteLabel}
                      </span>
                      {documentoGuiaRemitente && (
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => setDocumentoGuiaRemitente(null)}
                          title="Quitar"
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      )}
                    </div>
                  )}
                </MGroup>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 font-medium text-xs mb-1">Documento Guía Transportista:</span>
                <MGroup gap="xs" wrap="nowrap">
                  <FileButton
                    onChange={(file) => setDocumentoGuiaTransportista(file)}
                    accept="application/pdf,image/*"
                    disabled={sinGuiaTransportista}
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        color="indigo"
                        radius="md"
                        size="xs"
                        leftSection={<IconFile size={14} />}
                        disabled={sinGuiaTransportista}
                      >
                        {documentoGuiaTransportista ? "Reemplazar" : "Subir PDF / Imagen"}
                      </Button>
                    )}
                  </FileButton>
                  {fileTransportistaLabel && (
                    <div className="flex items-center gap-1 text-xs text-zinc-300 truncate">
                      <IconFileText size={14} className="text-zinc-500" />
                      <span className="truncate max-w-50" title={fileTransportistaLabel}>
                        {fileTransportistaLabel}
                      </span>
                      {documentoGuiaTransportista && (
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => setDocumentoGuiaTransportista(null)}
                          title="Quitar"
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      )}
                    </div>
                  )}
                </MGroup>
              </div>
            </Grid.Col>
          </Grid>

          {/* ========== 7. Items Asociados ========== */}
          <div className="flex items-center justify-between">
            <Text size="sm" fw={700} className="text-zinc-200">
              Items Asociados (Lotes o Particiones)
            </Text>
            <Button
              size="xs"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={handleOpenItemModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Agregar Item
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 shrink-0 min-h-37.5">
            <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-300 text-xs font-semibold">
                  <th className="text-center py-3" style={{ width: 140 }}>Orden</th>
                  <th className="text-left py-3 pl-3">Tipo</th>
                  <th className="text-left py-3">Correlativo</th>
                  <th className="text-left py-3">Producto</th>
                  <th className="text-left py-3">Mineral</th>
                  <th className="text-right py-3">P. Bruto</th>
                  <th className="text-right py-3">Tara</th>
                  <th className="text-right py-3 pr-3">P. Neto</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-zinc-500 text-xs">
                      No hay items agregados. Haga clic en "+ Agregar Item" para seleccionar.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr
                      key={it.tempId}
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
                                onClick={() => handleMoverItem(it.tempId, -1)}
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
                                onClick={() => handleMoverItem(it.tempId, 1)}
                                disabled={idx === items.length - 1}
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
                                onClick={() => handleEliminarItem(it.tempId)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <IconTrash size={13} />
                              </ActionIcon>
                            </Tooltip>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="light"
                          color={it.tipo_item === "PARTICION" ? "violet" : "teal"}
                          size="sm"
                          radius="md"
                          className="font-bold uppercase"
                        >
                          {it.tipo_item}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-left">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <IconFileText size={14} />
                          </div>
                          <Text size="xs" fw={600} className="text-zinc-200 font-mono tracking-wider">
                            {it.correlativo}
                          </Text>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs text-zinc-300">{it.tipo_producto ?? "—"}</td>
                      <td className="py-2.5 text-xs text-zinc-300">{it.tipo_mineral ?? "—"}</td>
                      <td className="py-2.5 text-right font-mono text-zinc-200 text-xs">
                        {it.peso_inicial?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2.5 text-right font-mono text-zinc-200 text-xs">
                        {it.peso_final?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-400 text-xs fw-semibold pr-3">
                        {it.peso_neto?.toFixed(2) ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

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

      {/* Submodal para registrar un vehículo (tractor o carreta) */}
      <ModalEstandar
        opened={openedModalVehiculo !== null}
        close={() => setOpenedModalVehiculo(null)}
        title={openedModalVehiculo === "carreta" ? "Registrar Vehículo Carreta" : "Registrar Vehículo Tractor"}
        size="md"
      >
        <RegistroVehiculoSimple
          idEmpresaTransporte={idEmpresaTransporte ? Number(idEmpresaTransporte) : null}
          idTipoVehiculo={null}
          onCancel={() => setOpenedModalVehiculo(null)}
          onSuccess={(vehiculo) => handleVehiculoCreado(vehiculo, openedModalVehiculo ?? "tractor")}
        />
      </ModalEstandar>

      {/* Submodal para registrar una empresa de transporte (tractor o carreta) */}
      <ModalEstandar
        opened={openedModalEmpresa !== null}
        close={() => setOpenedModalEmpresa(null)}
        title={openedModalEmpresa === "carreta" ? "Registrar Empresa de Transporte (Carreta)" : "Registrar Empresa de Transporte"}
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenedModalEmpresa(null)}
          onSuccess={(e) => handleEmpresaCreada(e, openedModalEmpresa ?? "tractor")}
        />
      </ModalEstandar>

      {/* Submodal para registrar un conductor */}
      <ModalEstandar
        opened={openedModalConductor}
        close={() => setOpenedModalConductor(false)}
        title="Registrar Conductor"
        size="md"
      >
        <RegistroConductor
          onCancel={() => setOpenedModalConductor(false)}
          onSuccess={handleConductorCreado}
        />
      </ModalEstandar>

      {/* Sub-modal selección de items */}
      <ModalSeleccionarItem
        opened={openItemModal}
        loading={loadingItems}
        items={itemsDisponibles}
        onClose={() => setOpenItemModal(false)}
        onConfirm={handleAgregarItems}
      />
    </>
  );
};

// ============================================================
// Sub-modal para seleccionar items (lotes o particiones)
// ============================================================

interface ModalSeleccionarItemProps {
  opened: boolean;
  loading: boolean;
  items: RES_ItemMineralDisponible[];
  onClose: () => void;
  onConfirm: (seleccionados: RES_ItemMineralDisponible[]) => void;
}

const ModalSeleccionarItem = ({ opened, loading, items, onClose, onConfirm }: ModalSeleccionarItemProps) => {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");

  const handleClose = () => {
    setSeleccionados(new Set());
    setBusqueda("");
    onClose();
  };

  const toggle = (key: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const seleccionItems = items.filter((i) => seleccionados.has(itemKey(i)));
    onConfirm(seleccionItems);
    setSeleccionados(new Set());
    setBusqueda("");
  };

  const filtrados = items.filter((i) => {
    if (busqueda.trim() === "") return true;
    const query = busqueda.toLowerCase();
    const matchesCorrelativo = i.correlativo.toLowerCase().includes(query);
    const matchesProveedor = i.proveedor_nombre?.toLowerCase().includes(query) ?? false;
    const matchesPlaca = i.vehiculo_placa?.toLowerCase().includes(query) ?? false;
    return matchesCorrelativo || matchesProveedor || matchesPlaca;
  });

  return (
    <ModalEstandar opened={opened} close={handleClose} title="Seleccionar Lotes o Particiones" size="xl">
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
                <th>Tipo</th>
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
                  <td colSpan={7} className="text-center py-4 text-zinc-400 text-xs">Cargando items...</td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-zinc-500 text-xs">
                    No hay items disponibles para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtrados.map((i) => {
                  const key = itemKey(i);
                  return (
                    <tr
                      key={key}
                      className={`border-b border-zinc-900/40 cursor-pointer hover:bg-zinc-900/30 ${seleccionados.has(key) ? "bg-emerald-950/20" : ""}`}
                      onClick={() => toggle(key)}
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(key)}
                          onChange={() => toggle(key)}
                          className="accent-emerald-500"
                        />
                      </td>
                      <td>
                        <Badge
                          variant="light"
                          color={i.tipo_item === "PARTICION" ? "violet" : "teal"}
                          size="sm"
                          radius="md"
                          className="font-bold uppercase"
                        >
                          {i.tipo_item}
                        </Badge>
                      </td>
                      <td className="font-mono text-zinc-100 text-xs">{i.correlativo}</td>
                      <td className="text-zinc-300 text-xs">
                        {i.vehiculo_placa ? i.vehiculo_placa.toUpperCase() : "—"}
                      </td>
                      <td className="text-right font-mono text-zinc-200 text-xs">{i.peso_inicial?.toFixed(2) ?? "—"}</td>
                      <td className="text-right font-mono text-zinc-200 text-xs">{i.peso_final?.toFixed(2) ?? "—"}</td>
                      <td className="text-right font-mono text-emerald-300 text-xs">{i.peso_neto?.toFixed(2) ?? "—"}</td>
                    </tr>
                  );
                })
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
