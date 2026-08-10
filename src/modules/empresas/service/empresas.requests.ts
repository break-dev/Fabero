import { Moneda } from "../../../shared/enums/_generic/moneda";
import type { CrearCuentaBancariaPayload } from "../../../shared/interfaces/cuenta-bancaria";
import { z } from "zod";

export const Schema_RegistroEmpresa = z.object({
  ruc: z.string().length(11, "El RUC debe tener 11 dígitos"),
  razon_social: z
    .string()
    .min(3, "La razón social debe tener al menos 3 caracteres"),
  nombre_comercial: z
    .string()
    .min(3, "El nombre comercial debe tener al menos 3 caracteres"),
  prefijo: z.string().optional(),
  path_logo: z.string().optional(),
});

export type DTO_RegistroEmpresa = z.infer<typeof Schema_RegistroEmpresa>;

export const Schema_CrearCuentaBancariaEmpresa = z.object({
  id_empresa: z.number().min(1, "Empresa requerida"),
  id_banco: z.number().min(1, "Seleccione un banco válido"),
  moneda: z.nativeEnum(Moneda),
  numero_cuenta: z.string().min(1, "El número de cuenta es requerido"),
  cci: z.string().optional().nullable(),
  es_para_detraccion: z.number(),
});
export type CrearCuentaBancariaEmpresaRequest = z.infer<
  typeof Schema_CrearCuentaBancariaEmpresa
>;

export const Schema_EditarCuentaBancariaEmpresa =
  Schema_CrearCuentaBancariaEmpresa.omit({ id_empresa: true });
export type EditarCuentaBancariaEmpresaRequest = z.infer<
  typeof Schema_EditarCuentaBancariaEmpresa
>;

export type DTO_CuentaBancariaEmpresa = CrearCuentaBancariaPayload;
