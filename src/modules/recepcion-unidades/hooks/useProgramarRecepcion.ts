import { useState, useCallback } from "react";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { ProgramarRecepcionRequest } from "../service/recepcion-unidades.requests";
import type { RecepcionUnidadResponse } from "../service/recepcion-unidades.responses";
import type { RES_EmpresaTransporte } from "../../../service/responses/empresa-transporte";
import type { RES_Vehiculo } from "../../../service/responses/vehiculo";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { EmpresaTransporteResponse } from "../../empresas-transporte/service/empresas-transporte.responses";
import type { ProveedorResponse } from "../../proveedores-mineros/service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";

import { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import { useUIStore } from "../../../stores/ui.store";

const INITIAL_FORM: ProgramarRecepcionRequest = {
  id_empresa_transporte: 0,
  tipo_ingreso: TipoIngreso.RecepcionMineral,
  id_vehiculo: undefined,
  id_tipo_vehiculo: undefined,
  id_conductor: undefined,
  id_proveedor_minero: undefined,
  id_sucursal: undefined,
  fecha_estimada_llegada: "",
  serie_guia_remitente: "",
  numero_guia_remitente: "",
  serie_guia_transportista: "",
  numero_guia_transportista: "",
  observacion: "",
};

export const useProgramarRecepcion = (
  onSuccess: (nueva: RecepcionUnidadResponse) => void,
) => {
  const { notifySuccess, notifyError } = useNotify();
  const [form, setForm] = useState<ProgramarRecepcionRequest>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const [empresas, setEmpresas] = useState<RES_EmpresaTransporte[]>([]);
  const [vehiculos, setVehiculos] = useState<RES_Vehiculo[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    setLoadingEmpresas(true);
    setLoadingVehiculos(true);
    setLoadingProveedores(true);

    try {
      const [emp, veh, prov] = await Promise.all([
        AuxService.get_empresas_transporte(),
        AuxService.get_vehiculos(),
        AuxService.get_proveedores(),
      ]);
      setEmpresas(Array.isArray(emp) ? emp : []);
      setVehiculos(Array.isArray(veh) ? veh : []);
      if (prov && prov.success && Array.isArray(prov.data)) {
        setProveedores(prov.data);
      } else if (Array.isArray(prov)) {
        setProveedores(prov as unknown as RES_Proveedor[]);
      }
    } catch (e) {
      console.error(e);
      notifyError("Error al cargar los catálogos de programación");
    } finally {
      setLoadingEmpresas(false);
      setLoadingVehiculos(false);
      setLoadingProveedores(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = useCallback(
    <K extends keyof ProgramarRecepcionRequest>(
      key: K,
      value: ProgramarRecepcionRequest[K],
    ) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "id_vehiculo" && value) {
          const vFound = vehiculos.find((v) => v.id_vehiculo === Number(value));
          if (vFound?.id_tipo_vehiculo) {
            next.id_tipo_vehiculo = vFound.id_tipo_vehiculo;
          }
        }
        return next;
      });
    },
    [vehiculos],
  );

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
  }, []);

  const submit = async (): Promise<boolean> => {
    if (!form.id_empresa_transporte) {
      notifyError("Debe seleccionar la empresa de transporte.");
      return false;
    }

    const idSucursalFinal =
      form.id_sucursal ||
      useUIStore.getState().sucursal_elegida?.id_sucursal ||
      useUIStore.getState().sucursales[0]?.id_sucursal;

    setLoading(true);
    try {
      const nueva = await RecepcionUnidadesService.crearProgramacion({
        ...form,
        id_sucursal: idSucursalFinal,
      });
      notifySuccess("Programación registrada correctamente");
      onSuccess(nueva);
      reset();
      return true;
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar la programación");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaCreada = useCallback(
    (nueva: EmpresaTransporteResponse) => {
      const resEmp: RES_EmpresaTransporte = {
        id_empresa_transporte: nueva.id,
        ruc: nueva.ruc,
        razon_social: nueva.razon_social,
        estado: nueva.estado,
      };
      setEmpresas((prev) => [resEmp, ...prev.filter((e) => e.id_empresa_transporte !== nueva.id)]);
      setField("id_empresa_transporte", nueva.id);
    },
    [setField],
  );

  const handleVehiculoCreado = useCallback(
    (nuevo: RES_Vehiculo) => {
      setVehiculos((prev) => [nuevo, ...prev.filter((v) => v.id_vehiculo !== nuevo.id_vehiculo)]);
      setField("id_vehiculo", nuevo.id_vehiculo);
    },
    [setField],
  );

  const handleProveedorCreado = useCallback(
    (nuevo: ProveedorResponse) => {
      const resProv: RES_Proveedor = {
        id_proveedor: nuevo.id_proveedor,
        razon_social: nuevo.razon_social,
        direccion: nuevo.direccion,
        documento: nuevo.ruc || nuevo.dni || null,
        telefono: nuevo.telefono,
      };
      setProveedores((prev) => [resProv, ...prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor)]);
      setField("id_proveedor_minero", nuevo.id_proveedor);
    },
    [setField],
  );

  return {
    form,
    setField,
    reset,
    submit,
    loading,
    empresas,
    vehiculos,
    proveedores,
    loadingEmpresas,
    loadingVehiculos,
    loadingProveedores,
    cargarCatalogos,
    handleEmpresaCreada,
    handleVehiculoCreado,
    handleProveedorCreado,
  };
};
