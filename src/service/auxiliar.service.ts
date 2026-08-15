import { api } from "./_api";
import type { IRespuesta } from "../shared/interfaces/_response";
import type { RES_Proveedor } from "./responses/proveedor";
import type { RES_Empleado } from "./responses/empleado";
import type { RES_Empresa } from "./responses/empresa";
import type { RES_Marca } from "./responses/marca";
import type { TipoEntidad } from "../shared/enums/_generic/tipo-entidad";
import type { RES_Banco } from "./responses/banco";
import type {
  RES_Departamento,
  RES_Provincia,
  RES_Distrito,
} from "../modules/sucursales/service/sucursales.responses";
import type { RES_Conductor } from "./responses/conductor";
import type { RES_TipoVehiculo } from "./responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "./responses/empresa-transporte";
import type { RES_Vehiculo } from "./responses/vehiculo";
import type {
  RES_MotivoIngreso,
  RES_Visitante,
} from "./responses/auxiliar-visitas";
import type { EstadoBase } from "../shared/enums/_generic/estado-base";
import type { RES_Sucursal } from "./responses/sucursal";
import type { RES_ZonaOrigen } from "./responses/zona-origen";

const path = "/aux";

export const AuxService = {
  get_empleados: async (filters?: {
    id_empleado?: number | number[];
    estado?: EstadoBase;
  }): Promise<IRespuesta<RES_Empleado[]>> => {
    const { data } = await api.get(`${path}/empleados`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener proveedores
   */
  get_proveedores: async (filters?: {
    id_proveedor?: number;
    estado?: EstadoBase;
    tipo_entidad?: TipoEntidad;
  }): Promise<IRespuesta<RES_Proveedor[]>> => {
    const { data } = await api.get<IRespuesta<RES_Proveedor[]>>(
      `${path}/proveedores`,
      { params: filters },
    );
    return data;
  },

  get_empresas: async (filters?: {
    id_empresa?: number;
    estado?: string;
  }): Promise<IRespuesta<RES_Empresa[]>> => {
    const { data } = await api.get<IRespuesta<RES_Empresa[]>>(
      `${path}/empresas`,
      { params: filters },
    );
    return data;
  },

  /**
   * Obtener lista de marcas
   */
  get_marcas: async (filters?: {
    id_marca?: number;
    estado?: EstadoBase;
  }): Promise<IRespuesta<RES_Marca[]>> => {
    const { data } = await api.get<IRespuesta<RES_Marca[]>>(`${path}/marcas`, {
      params: filters,
    });
    return data;
  },

  /**
   * Crear una nueva marca
   */
  crear_marca: async (nuevaMarca: {
    nombre: string;
  }): Promise<IRespuesta<RES_Marca>> => {
    const { data } = await api.post<IRespuesta<RES_Marca>>(
      `${path}/marcas`,
      nuevaMarca,
    );
    return data;
  },

  getBancos: async (): Promise<IRespuesta<RES_Banco[]>> => {
    const { data } = await api.get<IRespuesta<RES_Banco[]>>(
      "/proveedores/bancos",
    );
    return data;
  },

  crearBanco: async (payload: {
    nombre: string;
    abreviatura: string;
  }): Promise<RES_Banco> => {
    const { data } = await api.post("/proveedores/bancos", payload);
    return data.data;
  },

  get_departamentos: async (): Promise<IRespuesta<RES_Departamento[]>> => {
    const { data } = await api.get<IRespuesta<RES_Departamento[]>>(
      `${path}/departamentos`,
    );
    return data;
  },

  get_provincias: async (
    id_departamento: number,
  ): Promise<IRespuesta<RES_Provincia[]>> => {
    const { data } = await api.get<IRespuesta<RES_Provincia[]>>(
      `${path}/provincias`,
      {
        params: { id_departamento },
      },
    );
    return data;
  },

  get_distritos: async (
    id_provincia: number,
  ): Promise<IRespuesta<RES_Distrito[]>> => {
    const { data } = await api.get<IRespuesta<RES_Distrito[]>>(
      `${path}/distritos`,
      {
        params: { id_provincia },
      },
    );
    return data;
  },

  get_conductores: async (): Promise<RES_Conductor[]> => {
    const { data } = await api.get(`${path}/conductores`);
    return data.data;
  },

  crear_conductor: async (payload: {
    dni: string;
    nombre: string;
    apellido: string;
    numero_licencia: string;
  }): Promise<RES_Conductor> => {
    const { data } = await api.post(`${path}/conductores`, payload);
    if (!data.success) {
      throw new Error(data.message || "Error al registrar conductor");
    }
    return data.data;
  },

  /**
   * Obtener lista de todos los tipos de vehículo registrados
   */
  get_tipos_vehiculo: async (): Promise<RES_TipoVehiculo[]> => {
    const { data } = await api.get(`${path}/tipos-vehiculo`);
    return data.data;
  },

  /**
   * Registrar un nuevo tipo de vehículo en el sistema
   */
  crear_tipo_vehiculo: async (
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean,
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.post(`${path}/tipos-vehiculo`, {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  /**
   * Editar la información de un tipo de vehículo existente
   */
  editar_tipo_vehiculo: async (
    id: number,
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean,
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.put(`${path}/tipos-vehiculo/${id}`, {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  /**
   * Cambiar el estado (Activo/Inactivo) de un tipo de vehículo
   */
  cambiar_estado_tipo_vehiculo: async (
    id: number,
    estado: EstadoBase,
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.patch(`${path}/tipos-vehiculo/${id}/estado`, {
      estado,
    });
    return data.data;
  },

  /**
   * Obtener lista simplificada de empresas de transporte activas (para dropdowns)
   */
  get_empresas_transporte: async (): Promise<RES_EmpresaTransporte[]> => {
    const { data } = await api.get(`${path}/empresas-transporte`);
    return data.data;
  },

  /**
   * Obtener lista simplificada de vehículos (para dropdowns y búsquedas rápidas)
   */
  get_vehiculos: async (filters?: {
    placa?: string;
  }): Promise<RES_Vehiculo[]> => {
    const { data } = await api.get(`${path}/vehiculos`, {
      params: filters,
    });
    return data.data;
  },

  /**
   * Registrar un vehículo de forma simplificada
   */
  crear_vehiculo: async (payload: {
    placa: string;
    id_empresa_transporte?: number | null;
    id_tipo_vehiculo?: number | null;
  }): Promise<RES_Vehiculo> => {
    const { data } = await api.post(`${path}/vehiculos`, payload);
    return data.data;
  },

  /**
   * Editar un vehículo de forma simplificada
   */
  editar_vehiculo: async (
    id: number,
    payload: {
      id_empresa_transporte: number;
      id_tipo_vehiculo: number;
    },
  ): Promise<RES_Vehiculo> => {
    const { data } = await api.put(`${path}/vehiculos/${id}`, payload);
    return data.data;
  },

  /**
   * Obtener listado de motivos de ingreso.
   * @param esRecepcionUnidad si se define, filtra motivos aplicables a recepciones de unidad.
   */
  get_motivos_ingreso: async (
    esRecepcionUnidad?: boolean,
  ): Promise<IRespuesta<RES_MotivoIngreso[]>> => {
    const params = esRecepcionUnidad === undefined
      ? undefined
      : { es_recepcion_unidad: esRecepcionUnidad ? 1 : 0 };
    const { data } = await api.get<IRespuesta<RES_MotivoIngreso[]>>(
      `${path}/motivos-ingreso`,
      { params },
    );
    return data;
  },

  /**
   * Registrar un nuevo motivo de ingreso.
   */
  crear_motivo_ingreso: async (payload: {
    nombre: string;
    es_recepcion_unidad?: boolean;
  }): Promise<IRespuesta<RES_MotivoIngreso>> => {
    const { data } = await api.post<IRespuesta<RES_MotivoIngreso>>(
      `${path}/motivos-ingreso`,
      payload,
    );
    return data;
  },

  /**
   * Buscar visitante por DNI
   */
  buscar_visitante_por_dni: async (
    dni: string,
  ): Promise<IRespuesta<RES_Visitante>> => {
    const { data } = await api.get<IRespuesta<RES_Visitante>>(
      `${path}/visitantes/buscar`,
      { params: { dni } },
    );
    return data;
  },

  /**
   * Crear un nuevo visitante
   */
  crear_visitante: async (payload: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string | null;
  }): Promise<IRespuesta<RES_Visitante>> => {
    const { data } = await api.post<IRespuesta<RES_Visitante>>(
      `${path}/visitantes`,
      payload,
    );
    return data;
  },

  get_sucursales: async (): Promise<RES_Sucursal[]> => {
    const { data } = await api.get(`${path}/sucursales`);
    return data.data;
  },

  get_zonas_origen: async (): Promise<RES_ZonaOrigen[]> => {
    const { data } = await api.get(`${path}/zonas-origen`);
    return data.data;
  },

  crear_zona_origen: async (payload: {
    nombre: string;
  }): Promise<RES_ZonaOrigen> => {
    const { data } = await api.post(`${path}/zonas-origen`, payload);
    return data.data;
  },

  get_proveedores_valorizacion: async (): Promise<RES_Proveedor[]> => {
    const { data } = await api.get(`${path}/proveedores-valorizacion`);
    return data;
  },

  get_concesiones_proveedor: async (idProveedor: number): Promise<Array<{
    id: number;
    nombre: string;
    codigo_reinfo: string;
    procedencia: string;
  }>> => {
    const { data } = await api.get(`${path}/concesiones-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data;
  },

  get_cuentas_bancarias_proveedor: async (idProveedor: number): Promise<Array<{
    id: number;
    id_banco: number;
    moneda: string;
    numero_cuenta: string;
    cci: string;
    es_para_detraccion: boolean;
    banco_nombre: string;
  }>> => {
    const { data } = await api.get(`${path}/cuentas-bancarias-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data;
  },

  get_anticipos_proveedor: async (idProveedor: number): Promise<Array<{
    id: number;
    factura: string;
    serie_factura: string;
    numero_factura: string;
    saldo_inicial: number;
    saldo_actual: number;
    created_at: string;
  }>> => {
    const { data } = await api.get(`${path}/anticipos-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data;
  },

  get_lotes_disponibles_valorizacion: async (
    idProveedor: number,
    idValorizacion?: number,
  ): Promise<Array<{
    id_lote_guia: number;
    id_lote_mineral: number;
    codigo_gel: string;
    correlativo_lote: string;
    grr: string;
    grt: string;
    fecha_en_planta: string;
    tmh: number;
    ley_humedad: number;
    tms: number;
    ley_oro: number;
    ley_plata: number;
    es_valorizado_oro?: boolean;
    es_valorizado_plata?: boolean;
    condicion_oro: {
      id_condicion_comercial: number;
      recuperacion: number;
      maquila: number;
      consumo: number;
    } | null;
    condicion_plata: {
      id_condicion_comercial: number;
      recuperacion: number;
      maquila: number;
      consumo: number;
    } | null;
  }>> => {
    const params: Record<string, unknown> = { id_proveedor: idProveedor };
    if (idValorizacion) {
      params.id_valorizacion = idValorizacion;
    }
    const { data } = await api.get(`${path}/lotes-disponibles-valorizacion`, {
      params,
    });
    return data;
  },

  get_valorizaciones_aprobadas_por_proveedor: async (
    idProveedor: number,
  ): Promise<IRespuesta<Array<{
    id: number;
    numero_correlativo: string;
    tipo_pago: string;
    fecha_hora_aprobacion: string;
    estado: string;
    id_proveedor_minero: number;
    proveedor_nombre: string;
    concesion_nombre: string;
    total_dolares: number;
    monto_anticipos: number;
  }>>> => {
    const { data } = await api.get<IRespuesta<Array<{
      id: number;
      numero_correlativo: string;
      tipo_pago: string;
      fecha_hora_aprobacion: string;
      estado: string;
      id_proveedor_minero: number;
      proveedor_nombre: string;
      concesion_nombre: string;
      total_dolares: number;
      monto_anticipos: number;
    }>>>(`${path}/valorizaciones-aprobadas-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data;
  },

  get_tipo_cambio_por_fecha: async (
    fecha: string,
  ): Promise<IRespuesta<{
    id: number;
    valor_compra: number;
    valor_venta: number;
    fecha: string;
    estado: string;
    empleado_registro_nombre?: string;
  } | null>> => {
    const { data } = await api.get<IRespuesta<{
      id: number;
      valor_compra: number;
      valor_venta: number;
      fecha: string;
      estado: string;
      empleado_registro_nombre?: string;
    } | null>>(`${path}/tipo-cambio`, { params: { fecha } });
    return data;
  },

  crear_tipo_cambio: async (payload: {
    valor_compra: number;
    valor_venta: number;
    fecha: string;
  }): Promise<IRespuesta<{
    id: number;
    valor_compra: number;
    valor_venta: number;
    fecha: string;
    estado: string;
    empleado_registro_nombre?: string;
  }>> => {
    const { data } = await api.post<IRespuesta<{
      id: number;
      valor_compra: number;
      valor_venta: number;
      fecha: string;
      estado: string;
      empleado_registro_nombre?: string;
    }>>(`${path}/tipo-cambio`, payload);
    return data;
  },

  get_cuentas_bancarias_empresa_por_moneda: async (
    moneda: string,
    esParaDetraccion = false,
  ): Promise<IRespuesta<Array<{
    id_cuenta_bancaria: number;
    banco: string;
    banco_abv: string;
    id_banco: number;
    moneda: string;
    numero_cuenta: string;
    cci: string | null;
    es_para_detraccion: boolean;
    estado: string;
    empresa_nombre?: string;
    id_empresa?: number;
  }>>> => {
    const { data } = await api.get<IRespuesta<Array<{
      id_cuenta_bancaria: number;
      banco: string;
      banco_abv: string;
      id_banco: number;
      moneda: string;
      numero_cuenta: string;
      cci: string | null;
      es_para_detraccion: boolean;
      estado: string;
      empresa_nombre?: string;
      id_empresa?: number;
    }>>>(`${path}/cuentas-bancarias-empresa-moneda`, {
      params: { moneda, es_para_detraccion: esParaDetraccion ? 1 : 0 },
    });
    return data;
  },
};
