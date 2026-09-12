import { Fragment, useEffect, useMemo, useState } from "react";
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
  NumberInput,
} from "@mantine/core";
import {
  IconCalendar,
  IconPlus,
  IconTrash,
  IconFileText,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { ArchivoService } from "../../../../service/archivo.service";
import { ModalRegistroProveedor } from "../../../../presentation/utils/modal-registro-proveedor";
import { ModalConcesionesProveedor } from "../../../../presentation/utils/modal-concesiones-proveedor";
import { RegistroVehiculoSimple } from "../../../../presentation/utils/registro-vehiculo-simple";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { RegistroConductor } from "../../../../presentation/utils/registro-conductor";
import { CustomDatePicker } from "../../../../presentation/utils/date-picker-input";
import { AuxService } from "../../../../service/auxiliar.service";
import { useNotify } from "../../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../../presentation/utils/modal-confirmacion";
import {
  ConcesionesPorProveedorService,
  GuiasPrimerTramoService,
  ItemsMineralService,
} from "../../service/guias-primer-tramo.service";
import type { RES_ConcesionPorProveedor } from "../../service/guias-primer-tramo.responses";
import type { RES_ArchivosGuiasRecepcion, RES_ItemMineralDisponible } from "../../service/guias-primer-tramo.responses";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { ProveedorResponse } from "../../../proveedores-mineros/service/proveedores.responses";
import type { RES_Vehiculo } from "../../../../service/responses/vehiculo";
import type { RES_TipoVehiculo } from "../../../../service/responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "../../../../service/responses/empresa-transporte";
import type { RES_Conductor } from "../../../../service/responses/conductor";
import { MOTIVO_TRASLADO_OPTIONS } from "../../../../shared/enums/_generic/motivo-traslado";
import { CONDICION_INGRESO_OPTIONS } from "../../../../shared/enums/_generic/condicion-ingreso";
import type {
  DTO_CrearGuiaPrimerTramo,
  DTO_ActualizarGuiaPrimerTramo,
  DTO_ItemGuiaInput,
  DTO_PesosOficialesLote,
} from "../../service/guias-primer-tramo.requests";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";
import { useValidarDuplicadoGuiaEnVivo } from "../../hooks/useValidarDuplicadoGuiaEnVivo";

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

const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const ModalGuiaPrimerTramo = ({ opened, idSucursal, guia, onClose, onSubmit, onUpdate }: Props) => {
  const { notifyError, notifyInfo } = useNotify();

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
  const [fechaInicioTraslado, setFechaInicioTraslado] = useState<string | null>(todayIso());
  const [fechaEmision, setFechaEmision] = useState<string | null>(todayIso());
  const [fechaEnPlanta, setFechaEnPlanta] = useState<string | null>(todayIso());

  const [guiaRemitente, setGuiaRemitente] = useState("");
  const [guiaTransportista, setGuiaTransportista] = useState("");
  const [sinGuiaTransportista, setSinGuiaTransportista] = useState(false);

  const [documentoGuiaRemitente, setDocumentoGuiaRemitente] = useState<File | null>(null);
  const [documentoGuiaTransportista, setDocumentoGuiaTransportista] = useState<File | null>(null);

  // Confirmacion pendiente de reemplazo de documento. Mientras no sea null,
  // el modal de confirmacion esta visible. El file NO se asigna al state del
  // documento hasta que el usuario confirma.
  const [pendingReplacement, setPendingReplacement] = useState<
    { field: "remitente" | "transportista"; file: File } | null
  >(null);

  const [items, setItems] = useState<ItemFormItem[]>([]);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemsDisponibles, setItemsDisponibles] = useState<RES_ItemMineralDisponible[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsFechaInicio, setItemsFechaInicio] = useState<string>(todayIso());
  const [itemsFechaFin, setItemsFechaFin] = useState<string>(todayIso());
  // Mapa itemKey -> id_recepcion_unidad para agrupar items por recepción
  // y permitir autocompletar las guias cuando todos comparten una sola.
  const [recepcionesPorItem, setRecepcionesPorItem] = useState<Map<string, number>>(new Map());
  // Pesos oficiales editados para LOTEs sin particiones. Se inicializa al
  // agregar items con valores oficiales si existen, sino con los originales
  // del lote. Solo se envia al backend si el operador los modifico.
  const [pesosOficialesPorLote, setPesosOficialesPorLote] = useState<Record<number, DTO_PesosOficialesLote>>({});

  const round2 = (n: number): number => Math.round(n * 100) / 100;

  /**
   * Resolver el valor inicial de los pesos oficiales para un item LOTE.
   * - esEdicion=true:  prioriza `peso_*_oficial` (los guardados en una guia
   *                    previa). Si no existen, cae a los originales del lote.
   * - esEdicion=false: usa SOLO `peso_*` originales del lote. No toma los
   *                    oficiales aunque existan, porque la creacion parte
   *                    del peso actual del lote.
   */
  const obtenerPesosInicialesParaLote = (
    idLote: number,
    esEdicion: boolean,
  ): DTO_PesosOficialesLote | null => {
    const original = itemsDisponibles.find(
      (i) => i.id_lote_mineral === idLote,
    );
    if (!original) {
      return null;
    }

    const inicial = esEdicion
      ? (original.peso_inicial_oficial ?? original.peso_inicial ?? null)
      : (original.peso_inicial ?? null);
    const finalPeso = esEdicion
      ? (original.peso_final_oficial ?? original.peso_final ?? null)
      : (original.peso_final ?? null);
    const neto = esEdicion
      ? (original.peso_neto_oficial ?? original.peso_neto ?? null)
      : (original.peso_neto ?? null);

    if (inicial === null || finalPeso === null || neto === null) {
      return null;
    }
    return {
      id_lote_mineral: idLote,
      peso_inicial_oficial: round2(inicial),
      peso_final_oficial: round2(finalPeso),
      peso_neto_oficial: round2(neto),
    };
  };

  /**
   * Aplica la regla invariante a los pesos oficiales del lote:
   * - Editar peso_inicial_oficial -> peso_final_oficial = peso_inicial_oficial - peso_neto_oficial
   * - Editar peso_final_oficial -> peso_inicial_oficial = peso_final_oficial + peso_neto_oficial
   * - Editar peso_neto_oficial -> peso_final_oficial = peso_inicial_oficial - peso_neto_oficial
   */
  const aplicarReglaPesoOficial = (
    current: DTO_PesosOficialesLote,
    field: "peso_inicial_oficial" | "peso_final_oficial" | "peso_neto_oficial",
    value: number,
  ): DTO_PesosOficialesLote => {
    const updates: Partial<DTO_PesosOficialesLote> = { [field]: round2(value) };
    if (field === "peso_inicial_oficial") {
      updates.peso_final_oficial = round2(value - current.peso_neto_oficial);
    } else if (field === "peso_final_oficial") {
      updates.peso_inicial_oficial = round2(value + current.peso_neto_oficial);
    } else if (field === "peso_neto_oficial") {
      updates.peso_final_oficial = round2(current.peso_inicial_oficial - value);
    }
    return { ...current, ...updates };
  };

  const [submitting, setSubmitting] = useState(false);
  const [validatingDuplicado, setValidatingDuplicado] = useState(false);

  // Validación en vivo de duplicados (debounce 400ms + AbortController).
  // Devuelve tres flags independientes (combinacion, remitente, transportista)
  // para resaltar cada input en error y bloquear el submit si hay cualquier
  // conflicto. `enabled: opened` evita validar con modal cerrado.
  const {
    validating: validatingEnVivo,
    existe_combinacion: existeCombinacionEnVivo,
    existe_remitente: existeRemitenteEnVivo,
    existe_transportista: existeTransportistaEnVivo,
    messages: mensajesDuplicado,
  } = useValidarDuplicadoGuiaEnVivo({
    id_sucursal: idSucursal,
    guia_remitente: guiaRemitente,
    guia_transportista: guiaTransportista,
    sin_guia_transportista: sinGuiaTransportista,
    id_excluir: guia?.id ?? null,
    enabled: opened,
  });

  const hayDuplicadoEnVivo =
    existeCombinacionEnVivo || existeRemitenteEnVivo || existeTransportistaEnVivo;

  const [openedModalProveedor, setOpenedModalProveedor] = useState(false);
  const [openedModalConcesion, setOpenedModalConcesion] = useState(false);

  // Para distinguir tractor/carreta cuando se registra un vehículo o empresa
  const [openedModalVehiculo, setOpenedModalVehiculo] = useState<null | "tractor" | "carreta">(null);
  const [openedModalEmpresa, setOpenedModalEmpresa] = useState<null | "tractor" | "carreta">(null);
  const [openedModalConductor, setOpenedModalConductor] = useState(false);

  // Resolución perezosa del TipoVehiculo con es_carreta=1. Se carga la primera
  // vez que se abre el submodal "Registrar Vehículo Carreta" para auto-asignar
  // el tipo correcto al crear el vehículo (de lo contrario el nuevo vehículo
  // quedaba con id_tipo_vehiculo=NULL y no aparecía en el dropdown filtrado).
  const [idTipoVehiculoCarreta, setIdTipoVehiculoCarreta] = useState<number | null>(null);
  const [loadingTipoCarreta, setLoadingTipoCarreta] = useState(false);
  const [tipoCarretaChecked, setTipoCarretaChecked] = useState(false);

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

  /**
   * Handler del Select de proveedor. Si ya hay items cargados y el operador
   * cambia a otro proveedor, pide confirmacion previa: al confirmar, limpia
   * los items, recepcionesPorItem, pesosOficialesPorLote y los inputs de guias
   * (autocompletados desde la recepcion) via `sincronizarGuiasPorRecepciones([])`.
   *
   * Si no hay items o el valor no cambia, asigna directamente. Esto incluye
   * el caso del autocompletado (que setea idProveedor desde handleAgregarItems
   * y NO pasa por aqui).
   */
  const handleProveedorChange = (newVal: string | null) => {
    if (newVal === idProveedor || items.length === 0) {
      setIdProveedor(newVal);
      return;
    }

    mostrarConfirmacion({
      title: "Cambiar proveedor y limpiar items",
      confirmLabel: "Sí, limpiar y cambiar",
      cancelLabel: "Cancelar",
      message: (
        <>
          Cambiar el proveedor eliminará los <strong className="text-rose-400">{items.length}</strong> item(s) actualmente seleccionados y las guías/autocompletados asociados. ¿Desea continuar?
        </>
      ),
      onConfirm: () => {
        setItems([]);
        setRecepcionesPorItem(new Map());
        setPesosOficialesPorLote({});
        setIdProveedor(newVal);
        void sincronizarGuiasPorRecepciones([]);
      },
    });
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

  // Abre el submodal de registro de vehículo carreta. El id_tipo_vehiculo ya
  // se resolvió eagerly en el useEffect de catálogos (`loadTipoCarreta`), así
  // que acá solo validamos el estado y abrimos el modal. Si todavía no se
  // terminó de cargar, esperamos; si no existe el tipo carreta, notificamos.
  const handleOpenCarretaVehiculoModal = () => {
    if (!tipoCarretaChecked) {
      return;
    }
    if (idTipoVehiculoCarreta === null) {
      notifyError(
        "No existe un Tipo de Vehículo marcado como 'Carreta'. Créelo en Gestión de Tipos de Vehículo antes de continuar.",
      );
      return;
    }
    setOpenedModalVehiculo("carreta");
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

        // Inicializar pesos oficiales para LOTEs desde la guia en edicion.
        // En edicion, los pesos del response (peso_inicial/final/neto) ya son
        // los oficiales via COALESCE en backend (GuiasPrimerTramoData).
        setPesosOficialesPorLote((prev) => {
          const next = { ...prev };
          for (const l of guia.lotes ?? []) {
            if (l.tipo_item !== "LOTE" || l.id_lote_mineral === null) continue;
            const idLote = l.id_lote_mineral;
            if (next[idLote]) continue;
            if (
              l.peso_inicial === null ||
              l.peso_inicial === undefined ||
              l.peso_final === null ||
              l.peso_final === undefined ||
              l.peso_neto === null ||
              l.peso_neto === undefined
            ) {
              continue;
            }
            next[idLote] = {
              id_lote_mineral: idLote,
              peso_inicial_oficial: round2(Number(l.peso_inicial)),
              peso_final_oficial: round2(Number(l.peso_final)),
              peso_neto_oficial: round2(Number(l.peso_neto)),
            };
          }
          return next;
        });
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

    const loadTipoCarreta = async () => {
      setLoadingTipoCarreta(true);
      try {
        const tipos: RES_TipoVehiculo[] = await AuxService.get_tipos_vehiculo();
        if (isMounted) {
          // El backend serializa TINYINT(1) como número (0/1), no boolean.
          // Usar `Number(...) === 1` para ser consistente con el filtro
          // existente de carretas (línea `Number(v.es_carreta) === 1`).
          const tipoCarreta = tipos.find((t) => Number(t.es_carreta) === 1);
          setIdTipoVehiculoCarreta(tipoCarreta ? tipoCarreta.id_tipo_vehiculo : null);
        }
      } catch (e) {
        console.error("Error al cargar tipos de vehículo", e);
      } finally {
        if (isMounted) {
          setLoadingTipoCarreta(false);
          setTipoCarretaChecked(true);
        }
      }
    };

    loadProveedores();
    loadVehiculos();
    loadEmpresas();
    loadConductores();
    loadTipoCarreta();

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
    const inicio = todayIso();
    const fin = fechaEnPlanta ?? todayIso();
    setItemsFechaInicio(inicio);
    setItemsFechaFin(fin);
    setOpenItemModal(true);
    setLoadingItems(true);
    try {
      const data = await ItemsMineralService.get_items_disponibles(
        idSucursal,
        idProveedor ? Number(idProveedor) : undefined,
        inicio,
        fin,
      );
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
    // Autocompletar el proveedor si no hay uno seteado y los items vienen del mismo.
    // El sub-modal bloquea la mezcla de proveedores cuando no hay fijo, asi que
    // podemos tomar el primero con seguridad.
    if (!idProveedor && seleccionados.length > 0) {
      const primerProveedor = seleccionados.find(
        (i) => i.id_proveedor_minero !== null,
      )?.id_proveedor_minero;
      if (primerProveedor !== null && primerProveedor !== undefined) {
        setIdProveedor(String(primerProveedor));
      }
    }

    const nuevos: ItemFormItem[] = seleccionados.map((i) => ({
      tempId: `${itemKey(i)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      id_lote_mineral: i.tipo_item === "PARTICION" ? null : i.id_lote_mineral,
      id_particion_lote_mineral: i.tipo_item === "LOTE" ? null : i.id_particion_lote_mineral,
      tipo_item: i.tipo_item,
      correlativo: i.correlativo,
      peso_inicial: i.peso_inicial,
      peso_final: i.peso_final,
      peso_neto: i.peso_neto,
      tipo_producto: i.tipo_producto,
      tipo_mineral: i.tipo_mineral,
    }));
    const merged: ItemFormItem[] = [...items, ...nuevos];
    setItems(merged);
    // Construir el Map temporal de recepciones SINCRONAMENTE para pasarselo
    // al helper de sincronizacion. Esto evita el bug de timing del setState
    // de recepcionesPorItem (React batchea, el state nuevo no esta disponible
    // todavia cuando se llama al helper).
    const tempRecepciones = new Map(recepcionesPorItem);
    for (const i of seleccionados) {
      // Para PARTICIONES, la recepcion ficticia no tiene guias; usar la
      // del lote padre (recepcion_unidad_padre) que es donde se capturo la
      // guia_remitente, guia_transportista y documentos_programacion.
      const idRecep = i.id_recepcion_unidad_padre ?? i.id_recepcion_unidad;
      if (idRecep) tempRecepciones.set(itemKey(i), idRecep);
    }
    setRecepcionesPorItem(tempRecepciones);
    // Inicializar pesos oficiales para LOTEs sin particiones.
    setPesosOficialesPorLote((prev) => {
      const next = { ...prev };
      for (const i of seleccionados) {
        if (i.tipo_item !== "LOTE" || i.id_lote_mineral === null) continue;
        const idLote = i.id_lote_mineral;
        if (next[idLote]) continue; // ya existe
        // Creacion: priorizar peso_* originales del lote, no los oficiales.
        const iniciales = obtenerPesosInicialesParaLote(idLote, false);
        if (iniciales) next[idLote] = iniciales;
      }
      return next;
    });
    setOpenItemModal(false);

    // Sincronizar los inputs de guias (autocompletar o limpiar) segun
    // si los items resultantes siguen perteneciendo a una sola recepcion.
    void sincronizarGuiasPorRecepciones(merged, tempRecepciones);
  };

  const handleEliminarItem = (tempId: string) => {
    const itemEliminado = items.find((i) => i.tempId === tempId);
    const itemsRestantes = items.filter((i) => i.tempId !== tempId);
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
    // Si el item eliminado era un LOTE y NO quedan mas LOTEs del mismo id,
    // limpiar el state de pesos oficiales para no acumular.
    if (itemEliminado?.tipo_item === "LOTE" && itemEliminado.id_lote_mineral !== null) {
      const idLote = itemEliminado.id_lote_mineral;
      setPesosOficialesPorLote((prev) => {
        if (!prev[idLote]) return prev;
        const quedan = items.some(
          (i) => i.tipo_item === "LOTE" && i.id_lote_mineral === idLote && i.tempId !== tempId,
        );
        if (quedan) return prev;
        const next = { ...prev };
        delete next[idLote];
        return next;
      });
    }
    // Sincronizar los inputs de guias (autocompletar o limpiar) segun
    // si los items resultantes siguen perteneciendo a una sola recepcion.
    void sincronizarGuiasPorRecepciones(itemsRestantes);
  };

  /**
   * Sincroniza los inputs de guias (textos + archivos) con la lista actual
   * de items:
   * - size === 1: si los inputs estan vacios, autocompletar desde la
   *   recepcion unica. Si ya estan poblados, no tocar.
   * - size !== 1 (mezcla de recepciones o 0 items): limpiar los 4 inputs.
   *
   * Centraliza la logica para que se aplique consistente desde
   * handleAgregarItems y handleEliminarItem.
   */
  const sincronizarGuiasPorRecepciones = async (
    itemsActuales: ItemFormItem[],
    recepcionesOverride?: Map<string, number>,
  ): Promise<void> => {
    const mapaRecepciones = recepcionesOverride ?? recepcionesPorItem;
    const recepciones = new Set<number>();
    for (const it of itemsActuales) {
      const id = mapaRecepciones.get(itemKey(it));
      if (id) recepciones.add(id);
    }
    // console.log("[autocompletar] sincronizarGuiasPorRecepciones - set de recepciones:", {
    //   items: itemsActuales.length,
    //   recepciones: Array.from(recepciones),
    //   size: recepciones.size,
    //   usoOverride: !!recepcionesOverride,
    // });

    if (recepciones.size !== 1) {
      // 0 items, o mezcla de recepciones. Limpiar inputs.
      // const motivo = itemsActuales.length === 0
      //   ? "no hay items"
      //   : `mezcla de ${recepciones.size} recepciones`;
      // console.log("[autocompletar] action: limpiar -", motivo);
      setGuiaRemitente("");
      setGuiaTransportista("");
      setDocumentoGuiaRemitente(null);
      setDocumentoGuiaTransportista(null);
      if (itemsActuales.length > 0) {
        notifyInfo(
          "Los items seleccionados pertenecen a múltiples recepciones. Las guías se han limpiado.",
        );
      }
      return;
    }

    // size === 1. Decidir si autocompletar o mantener.
    const unicaRecepcion = recepciones.values().next().value as number;

    const inputsVacios =
      guiaRemitente.trim() === "" &&
      guiaTransportista.trim() === "" &&
      documentoGuiaRemitente === null &&
      documentoGuiaTransportista === null;

    if (!inputsVacios) {
      // console.log("[autocompletar] action: mantener - inputs ya poblados", {
      //   guiaRemitente,
      //   guiaTransportista,
      //   tieneRemitente: !!documentoGuiaRemitente,
      //   tieneTransportista: !!documentoGuiaTransportista,
      // });
      return;
    }

    // console.log("[autocompletar] action: autocompletar desde recepcion", { unicaRecepcion });

    // Fetch explicito al endpoint: trae los textos (guia_remitente,
    // guia_transportista) y los archivos (documentos_programacion)
    // directamente desde recepcion_unidad de la BD. Esto elimina la
    // dependencia de itemsDisponibles, que solo contiene items
    // visibles en el sub-modal y puede NO tener filas para algunas
    // recepciones si el operador selecciono items por separado.
    let dataRecepcion: RES_ArchivosGuiasRecepcion;
    try {
      dataRecepcion = await ItemsMineralService.get_archivos_guias_by_recepcion(
        unicaRecepcion,
      );
      // console.log("[autocompletar] respuesta del endpoint:", dataRecepcion);
    } catch {
      return;
    }

    if (
      dataRecepcion.guia_remitente !== null &&
      dataRecepcion.guia_remitente !== undefined
    ) {
      // console.log("[autocompletar] SET guiaRemitente =", dataRecepcion.guia_remitente);
      setGuiaRemitente(dataRecepcion.guia_remitente);
    }
    if (
      !sinGuiaTransportista &&
      dataRecepcion.guia_transportista !== null &&
      dataRecepcion.guia_transportista !== undefined
    ) {
      // console.log("[autocompletar] SET guiaTransportista =", dataRecepcion.guia_transportista);
      setGuiaTransportista(dataRecepcion.guia_transportista);
    }

    const docs = dataRecepcion.documentos;
    if (!docs) return;

    if (docs.guia_remitente?.url) {
      // console.log("[autocompletar] descargar archivo remitente", docs.guia_remitente);
      const file = await descargarArchivoADocumento(docs.guia_remitente);
      // console.log("[autocompletar] archivo remitente descargado?", !!file);
      if (file) setDocumentoGuiaRemitente(file);
    }
    if (
      !sinGuiaTransportista &&
      docs.guia_transportista?.url &&
      !documentoGuiaTransportista
    ) {
      // console.log("[autocompletar] descargar archivo transportista", docs.guia_transportista);
      const file = await descargarArchivoADocumento(docs.guia_transportista);
      // console.log("[autocompletar] archivo transportista descargado?", !!file);
      if (file) setDocumentoGuiaTransportista(file);
    }
  };

  /**
   * Mapea una extension de archivo a un MIME type. Usado como fallback
   * cuando el blob del backend llega con `application/octet-stream` y
   * no podemos inferir el tipo real desde el blob.
   */
  const mimeFromExtension = (ext: string): string => {
    const map: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return map[ext.toLowerCase()] || "application/octet-stream";
  };

  /**
   * Lee los primeros bytes de un Blob para detectar el tipo real del
   * archivo via magic bytes. Usado como ultimo fallback cuando tanto
   * blob.type como mimeFromExtension fallan (archivos viejos guardados
   * como .bin en storage que el backend no sabe tipar).
   *
   * Devuelve {mime, ext} o null si no reconoce los magic bytes.
   */
  const detectFromMagicBytes = async (
    b: Blob,
  ): Promise<{ mime: string; ext: string } | null> => {
    try {
      const buf = await b.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buf);
      // PDF: 25 50 44 46 (%PDF)
      if (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46
      ) {
        return { mime: "application/pdf", ext: "pdf" };
      }
      // ZIP / DOCX / XLSX: 50 4B 03 04 (PK..)
      if (
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      ) {
        // DOCX vs XLSX: DOCX tiene "word/" en offsets 38+, XLSX "xl/".
        // Por simplicidad y dado el dominio (documentos administrativos),
        // asumimos DOCX si no podemos leer mas profundo.
        const headerTail = Array.from(bytes.slice(4, 12))
          .map((b) => String.fromCharCode(b))
          .join("");
        if (headerTail.includes("xl")) {
          return {
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ext: "xlsx",
          };
        }
        return {
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ext: "docx",
        };
      }
      // PNG: 89 50 4E 47 (.PNG)
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        return { mime: "image/png", ext: "png" };
      }
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { mime: "image/jpeg", ext: "jpg" };
      }
      // GIF: 47 49 46 38 (GIF8)
      if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38
      ) {
        return { mime: "image/gif", ext: "gif" };
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Descarga un archivo de guias desde el backend (endpoint autenticado
   * via JWT) y lo convierte a un objeto File para el MultiFilePicker.
   * Devuelve null si falla la peticion o el tipo MIME no se puede inferir.
   */
  const descargarArchivoADocumento = async (
    archivo: IArchivo,
  ): Promise<File | null> => {
    if (!archivo.path_relativo) {
      return null;
    }
    const base = archivo.nombre_original || "archivo";
    let ext =
      archivo.extension && archivo.extension !== "bin"
        ? archivo.extension
        : "";
    let nombreCompleto =
      ext && !base.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
        ? `${base}.${ext}`
        : base;
    try {
      const blob = await ArchivoService.descargarArchivo(
        archivo.path_relativo,
        nombreCompleto,
      );
      let tipo =
        blob.type && blob.type !== "application/octet-stream"
          ? blob.type
          : mimeFromExtension(ext);

      // Ultimo fallback: detectar tipo real por magic bytes del blob.
      // Cubre archivos viejos guardados como .bin donde el backend no
      // puede inferir nada y la extension reportada tampoco sirve.
      if (!tipo || tipo === "application/octet-stream") {
        const detected = await detectFromMagicBytes(blob);
        if (detected) {
          tipo = detected.mime;
          if (!ext) {
            ext = detected.ext;
            const baseName = nombreCompleto.includes(".")
              ? nombreCompleto.split(".").slice(0, -1).join(".")
              : nombreCompleto;
            nombreCompleto = `${baseName}.${ext}`;
          }
        }
      }

      return new File([blob], nombreCompleto, { type: tipo });
    } catch {
      return null;
    }
  };

  /**
   * Handler unificado para los inputs de archivos de los documentos de la
   * guia. Si ya existe un archivo guardado para ese campo (modo edicion),
   * abre un modal controlado que pide confirmacion antes de sobrescribirlo.
   */
  const handleFilesChange = (
    field: "remitente" | "transportista",
    files: File[],
  ) => {
    // El MultiFilePicker envia `[]` cuando el usuario pulsa "Limpiar nuevos"
    // o elimina el unico archivo desde la papelera del card. Hay que tratarlo
    // como una operacion valida de limpieza y NO como un payload vacio a ignorar.
    if (files.length === 0) {
      if (field === "remitente") setDocumentoGuiaRemitente(null);
      else setDocumentoGuiaTransportista(null);
      return;
    }
    const file = files[0];
    const existing =
      field === "remitente"
        ? guia?.documentos?.guia_remitente
        : guia?.documentos?.guia_transportista;
    if (existing) {
      setPendingReplacement({ field, file });
    } else {
      if (field === "remitente") setDocumentoGuiaRemitente(file);
      else setDocumentoGuiaTransportista(file);
    }
  };

  const handleConfirmReplacement = () => {
    if (!pendingReplacement) return;
    if (pendingReplacement.field === "remitente") {
      setDocumentoGuiaRemitente(pendingReplacement.file);
    } else {
      setDocumentoGuiaTransportista(pendingReplacement.file);
    }
    setPendingReplacement(null);
  };

  const handleCancelReplacement = () => {
    setPendingReplacement(null);
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
    setFechaInicioTraslado(todayIso());
    setFechaEmision(todayIso());
    setFechaEnPlanta(todayIso());
    setGuiaRemitente("");
    setGuiaTransportista("");
    setSinGuiaTransportista(false);
    setDocumentoGuiaRemitente(null);
    setDocumentoGuiaTransportista(null);
    setItems([]);
    setRecepcionesPorItem(new Map());
    setPesosOficialesPorLote({});
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

    // Chequeo pre-submit: si ya existe una guía activa con la misma
    // combinación (guia_remitente + transportista / sin_guia_transportista),
    // advertimos con notifyError y NO enviamos el POST. El modal permanece
    // abierto para que el operador cambie los valores. En edición pasamos
    // `id_excluir` con el id de la guía actual para no chocar consigo misma.
    try {
      setValidatingDuplicado(true);
      const resultadoValidacion = await GuiasPrimerTramoService.validar_duplicado({
        id_sucursal: idSucursal,
        guia_remitente: guiaRemitenteTrim,
        guia_transportista: numeroGuiaTransportista,
        sin_guia_transportista: sinGuiaTransportista,
        id_excluir: guia?.id ?? null,
      });

      if (resultadoValidacion.existe) {
        const msgs = resultadoValidacion.messages ?? {};
        const msgPrincipal =
          msgs.combinacion ?? msgs.remitente ?? msgs.transportista
          ?? "Ya existe una guía activa con esos datos.";
        notifyError(msgPrincipal);
        return;
      }
    } catch (e) {
      console.error("Error al validar duplicado de guía", e);
      notifyError("No se pudo validar la guía. Intente nuevamente.");
      return;
    } finally {
      setValidatingDuplicado(false);
    }

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

    // Armar payload de pesos oficiales para TODOS los LOTEs sin particiones.
    // Al registrar la guia, los pesos del lote pasan a ser los oficiales —
    // los cambie el operador o no. Los *_oficial solo aplican al LOTE
    // (las particiones mantienen sus propios pesos originales).
    const pesosOficialesLotes: DTO_PesosOficialesLote[] = [];
    for (const it of items) {
      if (it.tipo_item !== "LOTE" || it.id_lote_mineral === null) continue;
      const editados = pesosOficialesPorLote[it.id_lote_mineral];
      if (!editados) continue;
      pesosOficialesLotes.push({
        id_lote_mineral: it.id_lote_mineral,
        peso_inicial_oficial: round2(editados.peso_inicial_oficial),
        peso_final_oficial: round2(editados.peso_final_oficial),
        peso_neto_oficial: round2(editados.peso_neto_oficial),
      });
    }

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
          pesos_oficiales_lotes: pesosOficialesLotes.length > 0 ? pesosOficialesLotes : null,
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
          pesos_oficiales_lotes: pesosOficialesLotes.length > 0 ? pesosOficialesLotes : null,
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
        size="lg"
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
                  onChange={handleProveedorChange}
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
                error={
                  existeRemitenteEnVivo
                    ? mensajesDuplicado.remitente ?? "Ya existe otra guía activa con este número de guía remitente."
                    : undefined
                }
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
                error={
                  existeTransportistaEnVivo
                    ? mensajesDuplicado.transportista ?? "Ya existe otra guía activa con este número de guía transportista."
                    : undefined
                }
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

          {/* Indicador de validación */}
          {validatingEnVivo && (
            <Group gap="xs" align="center" pl="xs">
              <Loader size={12} color="yellow" />
              <Text size="xs" c="dimmed">
                Validando duplicados…
              </Text>
            </Group>
          )}

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
                    loading={loadingTipoCarreta}
                    disabled={loadingTipoCarreta}
                    onClick={handleOpenCarretaVehiculoModal}
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
              <MultiFilePicker
                label="Guía Remitente:"
                description="PDF o imagen de la guía del remitente"
                files={documentoGuiaRemitente ? [documentoGuiaRemitente] : []}
                onFilesChange={(files) => handleFilesChange("remitente", files)}
                existingFiles={
                  documentoGuiaRemitente
                    ? []
                    : guia?.documentos?.guia_remitente
                      ? [guia.documentos.guia_remitente]
                      : []
                }
                onRemoveExisting={() =>
                  notifyInfo(
                    "El archivo existente solo se puede reemplazar. Suba uno nuevo encima para sobrescribirlo.",
                  )
                }
                accept="application/pdf,image/*"
                multiple={false}
                maxFiles={1}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <MultiFilePicker
                label="Guía Transportista:"
                description="PDF o imagen de la guía del transportista"
                files={
                  !sinGuiaTransportista && documentoGuiaTransportista
                    ? [documentoGuiaTransportista]
                    : []
                }
                onFilesChange={(files) => handleFilesChange("transportista", files)}
                existingFiles={
                  !sinGuiaTransportista &&
                  !documentoGuiaTransportista &&
                  guia?.documentos?.guia_transportista
                    ? [guia.documentos.guia_transportista]
                    : []
                }
                onRemoveExisting={() =>
                  notifyInfo(
                    "El archivo existente solo se puede reemplazar. Suba uno nuevo encima para sobrescribirlo.",
                  )
                }
                accept="application/pdf,image/*"
                multiple={false}
                maxFiles={1}
              />
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
                  <th className="text-center py-3">Tipo</th>
                  <th className="text-center py-3">Correlativo</th>
                  <th className="text-center py-3">P. Bruto</th>
                  <th className="text-center py-3">Tara</th>
                  <th className="text-center py-3">P. Neto</th>
                  <th className="text-center py-3" style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-zinc-500 text-xs">
                      No hay items agregados. Haga clic en "+ Agregar Item" para seleccionar.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr
                      key={it.tempId}
                      className="border-b border-zinc-900/60 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-2.5 text-center">
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
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2 w-full">
                          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <IconFileText size={14} />
                          </div>
                          <Text size="xs" fw={600} className="text-zinc-200 font-mono tracking-wider">
                            {it.correlativo}
                          </Text>
                        </div>
                      </td>
                      
                      {it.tipo_item === "LOTE" && it.id_lote_mineral !== null ? (
                        <>
                          <td className="py-2 text-center align-middle w-1/4">
                            <PesosOficialesInput
                              idLote={it.id_lote_mineral}
                              field="peso_inicial_oficial"
                              value={
                                pesosOficialesPorLote[it.id_lote_mineral]?.peso_inicial_oficial
                                  ?? it.peso_inicial
                                  ?? 0
                              }
                              onChange={(v) => {
                                setPesosOficialesPorLote((prev) => {
                                  const current =
                                    prev[it.id_lote_mineral!] ?? {
                                      id_lote_mineral: it.id_lote_mineral!,
                                      peso_inicial_oficial: round2(
                                        it.peso_inicial ?? 0,
                                      ),
                                      peso_final_oficial: round2(
                                        it.peso_final ?? 0,
                                      ),
                                      peso_neto_oficial: round2(it.peso_neto ?? 0),
                                    };
                                  return {
                                    ...prev,
                                    [it.id_lote_mineral!]: aplicarReglaPesoOficial(
                                      current,
                                      "peso_inicial_oficial",
                                      v,
                                    ),
                                  };
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 text-center align-middle w-1/4">
                            <PesosOficialesInput
                              idLote={it.id_lote_mineral}
                              field="peso_final_oficial"
                              value={
                                pesosOficialesPorLote[it.id_lote_mineral]?.peso_final_oficial
                                  ?? it.peso_final
                                  ?? 0
                              }
                              onChange={(v) => {
                                setPesosOficialesPorLote((prev) => {
                                  const current =
                                    prev[it.id_lote_mineral!] ?? {
                                      id_lote_mineral: it.id_lote_mineral!,
                                      peso_inicial_oficial: round2(
                                        it.peso_inicial ?? 0,
                                      ),
                                      peso_final_oficial: round2(
                                        it.peso_final ?? 0,
                                      ),
                                      peso_neto_oficial: round2(it.peso_neto ?? 0),
                                    };
                                  return {
                                    ...prev,
                                    [it.id_lote_mineral!]: aplicarReglaPesoOficial(
                                      current,
                                      "peso_final_oficial",
                                      v,
                                    ),
                                  };
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 text-center align-middle w-1/4">
                            <PesosOficialesInput
                              idLote={it.id_lote_mineral}
                              field="peso_neto_oficial"
                              value={
                                pesosOficialesPorLote[it.id_lote_mineral]?.peso_neto_oficial
                                  ?? it.peso_neto
                                  ?? 0
                              }
                              onChange={(v) => {
                                setPesosOficialesPorLote((prev) => {
                                  const current =
                                    prev[it.id_lote_mineral!] ?? {
                                      id_lote_mineral: it.id_lote_mineral!,
                                      peso_inicial_oficial: round2(
                                        it.peso_inicial ?? 0,
                                      ),
                                      peso_final_oficial: round2(
                                        it.peso_final ?? 0,
                                      ),
                                      peso_neto_oficial: round2(it.peso_neto ?? 0),
                                    };
                                  return {
                                    ...prev,
                                    [it.id_lote_mineral!]: aplicarReglaPesoOficial(
                                      current,
                                      "peso_neto_oficial",
                                      v,
                                    ),
                                  };
                                });
                              }}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 text-center font-mono text-zinc-200 text-xs">
                            {it.peso_inicial?.toFixed(2) ?? "—"}
                          </td>
                          <td className="py-2.5 text-center font-mono text-zinc-200 text-xs">
                            {it.peso_final?.toFixed(2) ?? "—"}
                          </td>
                          <td className="py-2.5 text-center font-mono text-emerald-400 text-xs fw-semibold">
                            {it.peso_neto?.toFixed(2) ?? "—"}
                          </td>
                        </>
                      )}
                      <td className="py-2.5 text-center">
                        <Tooltip label="Eliminar" withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleEliminarItem(it.tempId)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
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
            <Button
              variant="subtle"
              color="gray"
              radius="lg"
              size="sm"
              onClick={handleClose}
              disabled={submitting || validatingDuplicado}
            >
              Cancelar
            </Button>
            <Button
              radius="lg"
              size="sm"
              loading={submitting || validatingDuplicado}
              onClick={handleConfirmar}
              disabled={submitting || validatingDuplicado || hayDuplicadoEnVivo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/20 px-6"
            >
              {guia ? "Editar Guía" : "Registrar Guía"}
            </Button>
          </div>
        </Stack>
      </ModalEstandar>

      {/* Modal controlado de confirmación para reemplazo de documento */}
      <ModalEstandar
        opened={pendingReplacement !== null}
        close={handleCancelReplacement}
        title="Reemplazar documento existente"
      >
        <Stack gap="md">
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
              <IconAlertTriangle size={24} />
            </div>
            <Text size="sm" c="zinc.3" className="flex-1 leading-relaxed">
              El documento actual de{" "}
              <strong className="text-zinc-100">
                {pendingReplacement?.field === "remitente"
                  ? "la guia del remitente"
                  : "la guia del transportista"}
              </strong>{" "}
              sera reemplazado por el archivo seleccionado. Esta accion no se
              puede deshacer.
            </Text>
          </div>
          <Group justify="end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              radius="xl"
              size="sm"
              onClick={handleCancelReplacement}
            >
              Cancelar
            </Button>
            <Button
              radius="xl"
              size="sm"
              onClick={handleConfirmReplacement}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 font-semibold"
            >
              Reemplazar
            </Button>
          </Group>
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
          idTipoVehiculo={openedModalVehiculo === "carreta" ? idTipoVehiculoCarreta : null}
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
        fechaInicioFiltroIngreso={itemsFechaInicio}
        fechaFinFiltroIngreso={itemsFechaFin}
        idProveedorFijo={idProveedor ? Number(idProveedor) : null}
        onClose={() => setOpenItemModal(false)}
        onConfirm={handleAgregarItems}
        onFechaInicioChange={async (nuevaFecha) => {
          setItemsFechaInicio(nuevaFecha);
          setLoadingItems(true);
          try {
            const data = await ItemsMineralService.get_items_disponibles(
              idSucursal,
              idProveedor ? Number(idProveedor) : undefined,
              nuevaFecha,
              itemsFechaFin,
            );
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
        }}
        onFechaFinChange={async (nuevaFecha) => {
          setItemsFechaFin(nuevaFecha);
          setLoadingItems(true);
          try {
            const data = await ItemsMineralService.get_items_disponibles(
              idSucursal,
              idProveedor ? Number(idProveedor) : undefined,
              itemsFechaInicio,
              nuevaFecha,
            );
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
        }}
      />
    </>
  );
};

// ============================================================
// Input editable para pesos oficiales del LOTE
// ============================================================

interface PesosOficialesInputProps {
  idLote: number;
  field: "peso_inicial_oficial" | "peso_final_oficial" | "peso_neto_oficial";
  value: number;
  onChange: (value: number) => void;
}

const PesosOficialesInput = ({ idLote, field, value, onChange }: PesosOficialesInputProps) => {
  return (
    <NumberInput
      value={value}
      onChange={(v) => {
        const parsed = typeof v === "number" ? v : parseFloat(String(v));
        if (!Number.isFinite(parsed)) return;
        onChange(parsed);
      }}
      min={0}
      decimalScale={2}
      fixedDecimalScale
      hideControls
      radius="lg"
      size="xs"
      aria-label={`${field} lote ${idLote}`}
      classNames={{
        input:
          "text-[11px] h-7 px-2 font-mono text-center bg-zinc-900/60 border-zinc-800 focus:border-indigo-500",
      }}
      className="mx-auto"
      style={{ width: 100 }}
    />
  );
};

// ============================================================
// Sub-modal para seleccionar items (lotes o particiones)
// ============================================================

interface ModalSeleccionarItemProps {
  opened: boolean;
  loading: boolean;
  items: RES_ItemMineralDisponible[];
  fechaInicioFiltroIngreso: string;
  fechaFinFiltroIngreso: string;
  /**
   * Si llega un id_proveedor, los items de OTROS proveedores se renderizan
   * deshabilitados (gris + tooltip) para impedir mezcla. Si es null, se
   * muestran todos pero el botón "Agregar" se bloquea si los seleccionados
   * pertenecen a mas de un proveedor.
   */
  idProveedorFijo: number | null;
  onClose: () => void;
  onConfirm: (seleccionados: RES_ItemMineralDisponible[]) => void;
  onFechaInicioChange: (fecha: string) => void;
  onFechaFinChange: (fecha: string) => void;
}

const ModalSeleccionarItem = ({
  opened,
  loading,
  items,
  fechaInicioFiltroIngreso,
  fechaFinFiltroIngreso,
  idProveedorFijo,
  onClose,
  onConfirm,
  onFechaInicioChange,
  onFechaFinChange,
}: ModalSeleccionarItemProps) => {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>(fechaInicioFiltroIngreso);
  const [fechaFin, setFechaFin] = useState<string>(fechaFinFiltroIngreso);

  useEffect(() => {
    setFechaInicio(fechaInicioFiltroIngreso);
  }, [fechaInicioFiltroIngreso]);

  useEffect(() => {
    setFechaFin(fechaFinFiltroIngreso);
  }, [fechaFinFiltroIngreso]);

  const handleClose = () => {
    setSeleccionados(new Set());
    setBusqueda("");
    onClose();
  };

  const isItemDisabled = (i: RES_ItemMineralDisponible): boolean => {
    if (idProveedorFijo !== null) {
      return i.id_proveedor_minero !== null && i.id_proveedor_minero !== idProveedorFijo;
    }
    // Sin proveedor fijo: si ya hay un proveedor ancla (primer seleccionado),
    // cualquier item de otro proveedor queda disabled.
    if (proveedorAncla !== null) {
      const provItem = i.proveedor_nombre ?? "(Sin proveedor)";
      return provItem !== proveedorAncla;
    }
    return false;
  };

  // Proveedor ancla: nombre del primer item seleccionado (estable mientras
  // no se deseleccione completamente). Si no hay seleccion, queda null.
  const proveedorAncla = useMemo<string | null>(() => {
    for (const i of items) {
      if (seleccionados.has(itemKey(i)) && i.proveedor_nombre) return i.proveedor_nombre;
    }
    return null;
  }, [items, seleccionados]);

  const toggle = (key: string) => {
    const item = items.find((i) => itemKey(i) === key);
    if (item && isItemDisabled(item)) return;
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

  /**
   * Detecta proveedores unicos entre los items seleccionados. Si hay mas de uno
   * y no hay proveedor fijo, devuelve los nombres para el tooltip.
   */
  const proveedoresEnSeleccion = (): { count: number; nombres: string[] } => {
    const nombresSet = new Set<string>();
    for (const i of items) {
      if (seleccionados.has(itemKey(i)) && i.proveedor_nombre) {
        nombresSet.add(i.proveedor_nombre);
      }
    }
    return { count: nombresSet.size, nombres: Array.from(nombresSet) };
  };

  const mezclaProveedores = proveedoresEnSeleccion();

  const handleConfirm = () => {
    if (idProveedorFijo === null && mezclaProveedores.count > 1) return;
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

  // Orden estable: por proveedor (alfabetico), luego por correlativo.
  // `slice()` evita mutar el array filtrado.
  const ordenados = filtrados.slice().sort((a, b) => {
    const provA = a.proveedor_nombre ?? "";
    const provB = b.proveedor_nombre ?? "";
    if (provA < provB) return -1;
    if (provA > provB) return 1;
    return a.correlativo.localeCompare(b.correlativo);
  });

  // Agrupacion visual por proveedor: cada grupo renderiza una celda con
  // rowspan sobre todos sus items. Items sin `proveedor_nombre` caen en
  // "(Sin proveedor)". `ordenados` ya viene agrupado por el sort previo,
  // asi que basta con cortar al cambiar de proveedor.
  const gruposPorProveedor: Array<{
    key: string;
    items: RES_ItemMineralDisponible[];
  }> = [];
  for (const it of ordenados) {
    const key = it.proveedor_nombre ?? "(Sin proveedor)";
    const last = gruposPorProveedor[gruposPorProveedor.length - 1];
    if (last && last.key === key) {
      last.items.push(it);
    } else {
      gruposPorProveedor.push({ key, items: [it] });
    }
  }

  const filtrosHeader = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Buscar
        </span>
        <TextInput
          placeholder="Correlativo, placa o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
          leftSection={<IconSearch size={12} className="text-zinc-500" />}
          classNames={fieldClasses}
          radius="md"
          size="xs"
          style={{ width: 200 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Inicio
        </span>
        <CustomDatePicker
          value={fechaInicio}
          onChange={(d) => {
            if (!d) {
              const hoy = todayIso();
              setFechaInicio(hoy);
              onFechaInicioChange(hoy);
              return;
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            setFechaInicio(iso);
            onFechaInicioChange(iso);
          }}
          placeholder="DD/MM/YYYY"
          style={{ width: 140 }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Fin
        </span>
        <CustomDatePicker
          value={fechaFin}
          onChange={(d) => {
            if (!d) {
              const hoy = todayIso();
              setFechaFin(hoy);
              onFechaFinChange(hoy);
              return;
            }
            const pad = (n: number) => n.toString().padStart(2, "0");
            const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            setFechaFin(iso);
            onFechaFinChange(iso);
          }}
          placeholder="DD/MM/YYYY"
          style={{ width: 140 }}
        />
      </div>
    </div>
  );

  return (
    <ModalEstandar
      opened={opened}
      close={handleClose}
      title="Seleccionar Lotes o Particiones"
      size="85%"
      rightSection={filtrosHeader}
    >
      <Stack gap="md">
        <div className="max-h-[55vh] overflow-x-auto overflow-y-auto rounded-xl border border-zinc-800/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Table verticalSpacing="xs" horizontalSpacing="sm" className="w-full min-w-180">
            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
              <tr className="text-zinc-300 text-xs">
                <th className="text-center">Proveedor</th>
                <th style={{ width: 40 }} className="text-center">#</th>
                <th className="text-center">Tipo</th>
                <th className="text-center">Correlativo</th>
                <th className="text-center">Placa</th>
                <th className="text-center">P. Bruto</th>
                <th className="text-center">Tara</th>
                <th className="text-center">P. Neto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-zinc-400 text-xs">Cargando items...</td>
                </tr>
              ) : ordenados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-zinc-500 text-xs">
                    No hay items disponibles para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gruposPorProveedor.map((g) => (
                  <Fragment key={g.key}>
                    {g.items.map((i, idx) => {
                      const key = itemKey(i);
                      const disabled = isItemDisabled(i);
                      const tooltipLabel = disabled
                        ? idProveedorFijo !== null
                          ? `Este item pertenece al proveedor "${i.proveedor_nombre ?? "sin nombre"}". Cambie el proveedor o limpie los items seleccionados para poder elegir este.`
                          : `Este item pertenece al proveedor "${i.proveedor_nombre ?? "sin nombre"}". Solo puedes seleccionar items de un mismo proveedor ("${proveedorAncla ?? g.key}").`
                        : "";
                      return (
                        <tr
                          key={key}
                          className={`border-b border-zinc-900/40 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-zinc-900/30"} ${seleccionados.has(key) ? "bg-emerald-950/20" : ""}`}
                          onClick={() => !disabled && toggle(key)}
                        >
                          {idx === 0 && (
                            <td
                              rowSpan={g.items.length}
                              className="text-center align-middle font-semibold text-zinc-100 text-xs bg-zinc-800/30 border-r border-l border-zinc-800/80 px-3"
                            >
                              {g.key}
                            </td>
                          )}
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Tooltip label={tooltipLabel} withArrow disabled={!disabled}>
                              <input
                                type="checkbox"
                                checked={seleccionados.has(key)}
                                onChange={() => toggle(key)}
                                disabled={disabled}
                                className="accent-emerald-500 disabled:cursor-not-allowed"
                              />
                            </Tooltip>
                          </td>
                          <td className="text-center">
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
                          <td className="text-center font-mono text-zinc-100 text-xs">{i.correlativo}</td>
                          <td className="text-center text-zinc-300 text-xs">
                            {i.vehiculo_placa ? i.vehiculo_placa.toUpperCase() : "—"}
                          </td>
                          <td className="text-center font-mono text-zinc-200 text-xs">{i.peso_inicial?.toFixed(2) ?? "—"}</td>
                          <td className="text-center font-mono text-zinc-200 text-xs">{i.peso_final?.toFixed(2) ?? "—"}</td>
                          <td className="text-center font-mono text-emerald-300 text-xs">{i.peso_neto?.toFixed(2) ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <Text size="xs" c="dimmed">
              {seleccionados.size} seleccionado(s)
            </Text>
            {idProveedorFijo === null && mezclaProveedores.count > 1 && (
              <Text size="xs" c="red.4">
                Mezcla de proveedores detectada ({mezclaProveedores.nombres.join(", ")}). Selecciona items de un solo proveedor o asigna uno en el formulario.
              </Text>
            )}
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="subtle" color="gray" radius="md" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Tooltip
              label={
                seleccionados.size === 0
                  ? "Selecciona al menos un item."
                  : idProveedorFijo === null && mezclaProveedores.count > 1
                    ? `Mezcla de proveedores: ${mezclaProveedores.nombres.join(", ")}.`
                    : ""
              }
              withArrow
              disabled={
                !(seleccionados.size === 0 ||
                  (idProveedorFijo === null && mezclaProveedores.count > 1))
              }
            >
              <Button
                radius="md"
                size="sm"
                onClick={handleConfirm}
                disabled={
                  seleccionados.size === 0 ||
                  (idProveedorFijo === null && mezclaProveedores.count > 1)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Agregar {seleccionados.size > 0 ? `(${seleccionados.size})` : ""}
              </Button>
            </Tooltip>
          </div>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
