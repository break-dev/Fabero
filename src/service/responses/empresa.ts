export interface RES_Empresa {
  id_empresa: number;
  ruc: string;
  razon_social: string;
  path_logo: string | null;
  id_departamento: number | null;
  departamento_nombre: string | null;
  id_provincia: number | null;
  provincia_nombre: string | null;
  id_distrito: number | null;
  distrito_nombre: string | null;
  domicilio_fiscal: string | null;
  cantidad_cuentas_bancarias?: number;
}
