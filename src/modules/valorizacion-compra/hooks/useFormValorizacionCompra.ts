import { useState, useEffect, useMemo } from "react";
import { TipoPagoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import { AuxService } from "../../../service/auxiliar.service";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import { useNotify } from "../../../hooks/useNotify";
import type { IArchivo } from "../../../shared/interfaces/archivo";
import type {
  REQ_ValorizacionDetalleItem,
  REQ_ValorizacionAnticipoItem,
} from "../service/valorizacion-compra.requests";
import type {
  RES_ValorizacionCompra,
  RES_ValorizacionCompraDetalle,
} from "../service/valorizacion-compra.responses";

interface ConcesionItem {
  id: number;
  nombre: string;
  codigo_reinfo: string;
  procedencia: string;
}

interface CuentaItem {
  id: number;
  banco_nombre: string;
  numero_cuenta: string;
  moneda: string;
  es_para_detraccion: boolean;
}

interface AnticipoDisponibleItem {
  id: number;
  factura: string | null;
  serie_factura: string;
  numero_factura: string;
  saldo_inicial: number;
  saldo_actual: number;
  created_at: string;
}

interface Props {
  opened?: boolean;
  valorizacionEditar?: RES_ValorizacionCompra | null;
  onSuccess: () => void;
}

const basename = (path: string): string => {
  const normalized = path.replace(/\\/g, "/");
  return normalized.substring(normalized.lastIndexOf("/") + 1) || path;
};

const extractExtension = (name: string): string | null => {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.substring(idx + 1) : null;
};

const mapEvidenciasToArchivos = (evidencias: unknown): IArchivo[] => {
  if (!evidencias) return [];

  let rawList: unknown[] = [];
  if (Array.isArray(evidencias)) {
    rawList = evidencias;
  } else if (typeof evidencias === "string") {
    try {
      const parsed = JSON.parse(evidencias);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === "string") {
        rawList = [parsed];
      }
    } catch {
      if (evidencias.trim().length > 0) {
        rawList = [evidencias];
      }
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL || "";
  const baseUrl = backendUrl.replace(/\/api\/?$/, "");

  const result: IArchivo[] = [];
  for (const item of rawList) {
    if (!item) continue;

    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const pathRelativo = String(obj.path_relativo || obj.path || obj.url || "");
      const nombreOriginal = String(
        obj.nombre_original || obj.nombre || basename(pathRelativo) || "archivo",
      );
      const extension = String(
        obj.extension || extractExtension(nombreOriginal) || "",
      );
      let url = String(obj.url || "");
      if (!url && pathRelativo) {
        url = `${baseUrl}/storage/${pathRelativo}`;
      } else if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:")) {
        url = `${baseUrl}/storage/${url}`;
      }
      if (pathRelativo || url) {
        result.push({
          nombre_original: nombreOriginal,
          extension: extension,
          path_relativo: pathRelativo || url,
          url: url || pathRelativo,
        });
      }
    } else if (typeof item === "string" && item.trim().length > 0) {
      const pathStr = item.trim();
      const name = basename(pathStr);
      let url = pathStr;
      if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("blob:")
      ) {
        url = `${baseUrl}/storage/${pathStr}`;
      }
      result.push({
        nombre_original: name,
        extension: extractExtension(name) || "",
        path_relativo: pathStr,
        url: url,
      });
    }
  }

  return result;
};

export const useFormValorizacionCompra = ({
  opened,
  valorizacionEditar,
  onSuccess,
}: Props) => {
  const { notifySuccess, notifyError } = useNotify();

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  // Form Fields
  const [idProveedor, setIdProveedor] = useState<number | null>(null);
  const [idConcesion, setIdConcesion] = useState<number | null>(null);
  const [idCuentaBancaria, setIdCuentaBancaria] = useState<number | null>(null);
  const [idCuentaDetraccion, setIdCuentaDetraccion] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<
    { req: REQ_ValorizacionDetalleItem; display: RES_ValorizacionCompraDetalle }[]
  >([]);
  const [anticipos, setAnticipos] = useState<REQ_ValorizacionAnticipoItem[]>([]);
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<IArchivo[]>([]);
  const [fechaHoraValorizacion, setFechaHoraValorizacion] = useState<string | null>(null);

  // Catalogs
  const [concesiones, setConcesiones] = useState<ConcesionItem[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaItem[]>([]);
  const [cuentasDetraccion, setCuentasDetraccion] = useState<CuentaItem[]>([]);
  const [anticiposCatalog, setAnticiposCatalog] = useState<AnticipoDisponibleItem[]>([]);

  // Modals state
  const [modalLoteOpened, setModalLoteOpened] = useState(false);
  const [modalAnticiposOpened, setModalAnticiposOpened] = useState(false);

  // Cargar datos de edición si existen o reiniciar al abrir en modo creación
  useEffect(() => {
    if (!opened) return;

    if (valorizacionEditar) {
      setIdProveedor(valorizacionEditar.id_proveedor_minero);
      setIdConcesion(valorizacionEditar.id_concesion);
      setIdCuentaBancaria(valorizacionEditar.id_cuenta_bancaria);
      setIdCuentaDetraccion(valorizacionEditar.id_cuenta_detraccion);

      setDetalles(
        valorizacionEditar.detalles.map((d) => ({
          req: {
            id_lote_guia: d.id_lote_guia,
            elemento_quimico: d.elemento_quimico,
            id_condicion_comercial: d.id_condicion_comercial,
            id_valor_elemento_quimico: d.id_valor_elemento_quimico ?? null,
            inter: d.inter,
            des_inter: d.des_inter,
            recuperacion: d.recuperacion,
            maquila: d.maquila,
            consumo: d.consumo,
            factor: d.factor,
            penalidad: d.penalidad ?? 0,
            flete: d.flete ?? 0,
          },
          display: d,
        })),
      );

      setAnticipos(
        valorizacionEditar.transacciones_anticipo.map((t) => ({
          id_anticipo_proveedor: t.id_anticipo_proveedor,
          monto_retirado: t.monto_retirado,
        })),
      );

      setEvidencias([]);
      setEvidenciasExistentes(mapEvidenciasToArchivos(valorizacionEditar.evidencias));

      setFechaHoraValorizacion(valorizacionEditar.fecha_hora_valorizacion ?? null);
    } else {
      setIdProveedor(null);
      setIdConcesion(null);
      setIdCuentaBancaria(null);
      setIdCuentaDetraccion(null);
      setDetalles([]);
      setAnticipos([]);
      setEvidencias([]);
      setEvidenciasExistentes([]);
      setConcesiones([]);
      setCuentasBancarias([]);
      setCuentasDetraccion([]);
      setAnticiposCatalog([]);
      setFechaHoraValorizacion(null);
    }
  }, [opened, valorizacionEditar]);

  // Cargar catálogos cuando cambia el proveedor seleccionado
  useEffect(() => {
    if (!idProveedor) {
      setConcesiones([]);
      setCuentasBancarias([]);
      setCuentasDetraccion([]);
      setAnticiposCatalog([]);
      if (!valorizacionEditar) {
        setIdConcesion(null);
        setIdCuentaBancaria(null);
        setIdCuentaDetraccion(null);
      }
      return;
    }

    const cargarCatalogos = async () => {
      setLoadingCatalogo(true);
      try {
        const [concRes, ctasRes, antsRes] = await Promise.all([
          AuxService.get_concesiones_proveedor(idProveedor),
          AuxService.get_cuentas_bancarias_proveedor(idProveedor),
          AuxService.get_anticipos_proveedor(idProveedor).catch(() => []),
        ]);

        setConcesiones(concRes);

        const ordinarias = ctasRes.filter((c) => !c.es_para_detraccion);
        const detracciones = ctasRes.filter((c) => c.es_para_detraccion);

        setCuentasBancarias(ordinarias);
        setCuentasDetraccion(detracciones);
        setAnticiposCatalog(antsRes);

        if (valorizacionEditar) {
          // En edición, preservar/restaurar los IDs guardados en la valorización
          setIdConcesion(valorizacionEditar.id_concesion);
          setIdCuentaBancaria(valorizacionEditar.id_cuenta_bancaria);
          setIdCuentaDetraccion(valorizacionEditar.id_cuenta_detraccion);
        } else {
          // En creación, pre-seleccionar automáticamente la primera opción disponible
          if (concRes.length > 0) {
            setIdConcesion(concRes[0].id);
          }
          if (ordinarias.length > 0) {
            setIdCuentaBancaria(ordinarias[0].id);
          }
          if (detracciones.length > 0) {
            setIdCuentaDetraccion(detracciones[0].id);
          }
        }
      } catch (err) {
        notifyError(
          err instanceof Error
            ? err.message
            : "Error al cargar catálogos del proveedor",
        );
      } finally {
        setLoadingCatalogo(false);
      }
    };

    cargarCatalogos();
  }, [idProveedor, notifyError, valorizacionEditar]);

  // Totales
  const totalSubtotal = useMemo(() => {
    return detalles.reduce((acc, curr) => acc + curr.display.subtotal, 0);
  }, [detalles]);

  const totalPenalidad = useMemo(() => {
    return detalles.reduce((acc, curr) => {
      const raw =
        curr.display.penalidad ?? curr.req.penalidad ?? 0;
      return acc + (typeof raw === "number" ? raw : parseFloat(String(raw)) || 0);
    }, 0);
  }, [detalles]);

  const totalFlete = useMemo(() => {
    return detalles.reduce((acc, curr) => {
      const raw = curr.display.flete ?? curr.req.flete ?? 0;
      return acc + (typeof raw === "number" ? raw : parseFloat(String(raw)) || 0);
    }, 0);
  }, [detalles]);

  const totalAnticipos = useMemo(() => {
    return anticipos.reduce((acc, curr) => acc + curr.monto_retirado, 0);
  }, [anticipos]);

  const montoTransferencia = useMemo(() => {
    return Math.max(0, totalSubtotal - totalAnticipos);
  }, [totalSubtotal, totalAnticipos]);

  // Determinación automática del tipo de pago
  const tipoPago = useMemo(() => {
    if (totalAnticipos === 0) {
      return TipoPagoValorizacionCompra.Transferencia;
    }
    if (totalAnticipos >= totalSubtotal && totalSubtotal > 0) {
      return TipoPagoValorizacionCompra.Anticipo;
    }
    return TipoPagoValorizacionCompra.Mixto;
  }, [totalAnticipos, totalSubtotal]);

  // Mapa de saldos propios de cada transacción registrada en la valorización que se edita
  const anticipoSaldoTransaccionMap = useMemo(() => {
    const map = new Map<number, number>();
    if (valorizacionEditar && valorizacionEditar.transacciones_anticipo) {
      valorizacionEditar.transacciones_anticipo.forEach((t) => {
        map.set(t.id_anticipo_proveedor, t.saldo_actual);
      });
    }
    return map;
  }, [valorizacionEditar]);

  // Mapa de saldo a mostrar/validar en el formulario:
  // Si la transacción ya existe en esta valorización, muestra transaccion.saldo_actual.
  // De lo contrario, muestra el saldo_actual del catálogo de anticipos.
  const anticipoSaldoEfectivoMap = useMemo(() => {
    const map = new Map<number, number>();
    anticiposCatalog.forEach((a) => {
      const saldoTrans = anticipoSaldoTransaccionMap.get(a.id);
      map.set(a.id, saldoTrans !== undefined ? saldoTrans : a.saldo_actual);
    });
    return map;
  }, [anticiposCatalog, anticipoSaldoTransaccionMap]);

  // Handlers para agregar / eliminar / editar detalles
  const handleAgregarDetalle = (
    req: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => {
    setDetalles((prev) => [...prev, { req, display }]);
  };

  const handleEliminarDetalle = (index: number) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditarDetalle = (
    index: number,
    req: REQ_ValorizacionDetalleItem,
    display: RES_ValorizacionCompraDetalle,
  ) => {
    setDetalles((prev) =>
      prev.map((d, i) => (i === index ? { req, display } : d)),
    );
  };

  // Handlers para anticipos
  const handleConfirmarAnticipos = (items: REQ_ValorizacionAnticipoItem[]) => {
    setAnticipos(items);
  };

  const handleLimpiarAnticipos = () => {
    setAnticipos([]);
  };

  const concesionSeleccionada = useMemo(() => {
    if (!idConcesion) return null;
    return concesiones.find((c) => c.id === idConcesion) || null;
  }, [idConcesion, concesiones]);

  const handleSubmit = async (motivoCustom?: string) => {
    if (!idProveedor) {
      notifyError("Debe seleccionar un proveedor");
      return;
    }
    if (!idConcesion) {
      notifyError("Debe seleccionar una concesión");
      return;
    }
    if (detalles.length === 0) {
      notifyError("Debe agregar al menos un lote a la valorización");
      return;
    }

    const excedeSaldo = anticipos.some((a) => {
      const saldoEfectivo = anticipoSaldoEfectivoMap.get(a.id_anticipo_proveedor);
      if (saldoEfectivo === undefined) return false;
      return a.monto_retirado > saldoEfectivo + 0.0001;
    });
    if (excedeSaldo) {
      notifyError("Algún anticipo excede su saldo disponible");
      return;
    }

    setLoadingSubmit(true);

    try {
      if (valorizacionEditar) {
        await ValorizacionCompraService.editarValorizacion(valorizacionEditar.id, {
          id_concesion: idConcesion,
          id_cuenta_bancaria: idCuentaBancaria,
          id_cuenta_detraccion: idCuentaDetraccion,
          tipo_pago: tipoPago,
          detalles: detalles.map((d) => d.req),
          anticipos: anticipos,
          evidencias,
          evidencias_existentes: evidenciasExistentes,
          motivo_edicion: motivoCustom && motivoCustom.trim() ? motivoCustom.trim() : undefined,
          fecha_hora_valorizacion: fechaHoraValorizacion,
          monto_penalidad: totalPenalidad,
          monto_flete: totalFlete,
        });
        notifySuccess("Valorización actualizada correctamente");
      } else {
        await ValorizacionCompraService.crearValorizacion({
          id_proveedor_minero: idProveedor,
          id_concesion: idConcesion,
          id_cuenta_bancaria: idCuentaBancaria,
          id_cuenta_detraccion: idCuentaDetraccion,
          tipo_pago: tipoPago,
          detalles: detalles.map((d) => d.req),
          anticipos: anticipos,
          evidencias,
          fecha_hora_valorizacion: fechaHoraValorizacion,
          monto_penalidad: totalPenalidad,
          monto_flete: totalFlete,
        });
        notifySuccess("Valorización creada correctamente en estado Pendiente");
      }

      onSuccess();
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al guardar la valorización",
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return {
    loadingSubmit,
    loadingCatalogo,
    idProveedor,
    setIdProveedor,
    idConcesion,
    setIdConcesion,
    idCuentaBancaria,
    setIdCuentaBancaria,
    idCuentaDetraccion,
    setIdCuentaDetraccion,
    detalles,
    anticipos,
    concesiones,
    cuentasBancarias,
    cuentasDetraccion,
    anticiposCatalog,
    anticipoSaldoEfectivoMap,
    anticipoSaldoTransaccionMap,
    concesionSeleccionada,
    totalSubtotal,
    totalPenalidad,
    totalFlete,
    totalAnticipos,
    evidencias,
    setEvidencias,
    evidenciasExistentes,
    setEvidenciasExistentes,
    fechaHoraValorizacion,
    setFechaHoraValorizacion,
    montoTransferencia,
    tipoPago,
    modalLoteOpened,
    setModalLoteOpened,
    modalAnticiposOpened,
    setModalAnticiposOpened,
    handleAgregarDetalle,
    handleEditarDetalle,
    handleEliminarDetalle,
    handleConfirmarAnticipos,
    handleLimpiarAnticipos,
    handleSubmit,
  };
};
