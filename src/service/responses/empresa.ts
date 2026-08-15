export interface RES_Empresa {
  id_empresa: number;
  ruc: string;
  razon_social: string;
  path_logo: string | null;
  cantidad_cuentas_bancarias?: number;
}
