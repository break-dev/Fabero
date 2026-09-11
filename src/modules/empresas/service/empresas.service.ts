import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { CuentaBancariaEmpresaResponse, RES_Empresa } from "./empresas.responses";
import type {
  CrearCuentaBancariaEmpresaRequest,
  DTO_EditarEmpresa,
  EditarCuentaBancariaEmpresaRequest,
} from "./empresas.requests";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export class EmpresasService {
  private static PATH = "/empresas";

  public static crear_empresa = async (
    data: FormData,
  ): Promise<IRespuesta<RES_Empresa>> => {
    const { data: response } = await api.post(`${this.PATH}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  };

  public static actualizar_empresa = async (
    id: number,
    payload: DTO_EditarEmpresa,
  ): Promise<IRespuesta<RES_Empresa>> => {
    const { data } = await api.put(`${this.PATH}/${id}`, payload);
    return data;
  };

  public static actualizar_logo = async (
    id_empresa: number,
    logo: File,
  ): Promise<IRespuesta<RES_Empresa>> => {
    const formData = new FormData();
    formData.append("path_logo", logo);

    const { data: response } = await api.post(
      `${this.PATH}/${id_empresa}/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  };

  public static getCuentasBancarias = async (
    id_empresa: number,
  ): Promise<CuentaBancariaEmpresaResponse[]> => {
    const { data } = await api.get(
      `${this.PATH}/cuentas-bancarias/${id_empresa}`,
    );
    return data.data;
  };

  public static crearCuentaBancaria = async (
    payload: CrearCuentaBancariaEmpresaRequest,
  ): Promise<CuentaBancariaEmpresaResponse> => {
    const { data } = await api.post(
      `${this.PATH}/cuentas-bancarias`,
      payload,
    );
    return data.data;
  };

  public static editarCuentaBancaria = async (
    id: number,
    payload: EditarCuentaBancariaEmpresaRequest,
  ): Promise<CuentaBancariaEmpresaResponse> => {
    const { data } = await api.put(
      `${this.PATH}/cuentas-bancarias/${id}`,
      payload,
    );
    return data.data;
  };

  public static cambiarEstadoCuentaBancaria = async (
    id: number,
    estado: EstadoBase,
  ): Promise<CuentaBancariaEmpresaResponse> => {
    const { data } = await api.patch(
      `${this.PATH}/cuentas-bancarias/${id}/estado`,
      { estado },
    );
    return data.data;
  };

  public static eliminarCuentaBancaria = async (id: number): Promise<void> => {
    await api.delete(`${this.PATH}/cuentas-bancarias/${id}`);
  };
}
