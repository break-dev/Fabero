import type { RES_Particion } from "../../service/validacion-distribucion.responses";

export interface EvaluacionParticion {
  cumple_pesos: boolean;
  cumple_fechas: boolean;
  cumple_recepcion: boolean;
  cumple: boolean;
  campos_faltantes: string[];
}

export interface EvaluacionLote {
  cumple_suma: boolean;
  suma_pesos_netos: number;
  diferencia_suma: number;
  cumple: boolean; // cumple_suma AND TODAS las particiones activas cumplen
  partidasNoCumplen: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Evalua una particion individual con la info disponible en RES_Particion.
 * Coincide con la logica SQL del backend (`ValidacionDistribucionData::get_evaluacion_validacion`).
 * Se computa en cliente para evitar llamadas extra a la API por cada particion renderizada.
 */
export const evaluarParticion = (p: RES_Particion): EvaluacionParticion => {
  const camposFaltantes: string[] = [];

  const pesoInicial = p.peso_inicial ?? 0;
  const pesoFinal = p.peso_final ?? 0;
  const pesoNeto = p.peso_neto ?? 0;

  if (pesoInicial <= 0) camposFaltantes.push("peso_inicial");
  if (pesoFinal <= 0) camposFaltantes.push("peso_final");
  if (pesoNeto <= 0) camposFaltantes.push("peso_neto");

  const cumplePesos =
    !camposFaltantes.includes("peso_inicial") &&
    !camposFaltantes.includes("peso_final") &&
    !camposFaltantes.includes("peso_neto");

  if (!p.fecha_hora_peso_inicial) camposFaltantes.push("fecha_hora_peso_inicial");
  if (!p.fecha_hora_peso_final) camposFaltantes.push("fecha_hora_peso_final");

  const cumpleFechas =
    cumplePesos &&
    !camposFaltantes.includes("fecha_hora_peso_inicial") &&
    !camposFaltantes.includes("fecha_hora_peso_final");

  if (!p.id_vehiculo) camposFaltantes.push("recepcion.id_vehiculo");
  if (!p.id_conductor) camposFaltantes.push("recepcion.id_conductor");
  if (!p.id_empresa_transporte)
    camposFaltantes.push("recepcion.id_empresa_transporte");
  if (!p.id_tipo_vehiculo) camposFaltantes.push("recepcion.id_tipo_vehiculo");
  if (!p.id_proveedor_minero)
    camposFaltantes.push("recepcion.id_proveedor_minero");
  if (!p.fecha_hora_ingreso)
    camposFaltantes.push("recepcion.fecha_hora_ingreso");
  if (!p.fecha_hora_salida)
    camposFaltantes.push("recepcion.fecha_hora_salida");

  const cumpleRecepcion =
    !camposFaltantes.includes("recepcion.id_vehiculo") &&
    !camposFaltantes.includes("recepcion.id_conductor") &&
    !camposFaltantes.includes("recepcion.id_empresa_transporte") &&
    !camposFaltantes.includes("recepcion.id_tipo_vehiculo") &&
    !camposFaltantes.includes("recepcion.id_proveedor_minero") &&
    !camposFaltantes.includes("recepcion.fecha_hora_ingreso") &&
    !camposFaltantes.includes("recepcion.fecha_hora_salida");

  return {
    cumple_pesos: cumplePesos,
    cumple_fechas: cumpleFechas,
    cumple_recepcion: cumpleRecepcion,
    cumple: cumplePesos && cumpleFechas && cumpleRecepcion,
    campos_faltantes: Array.from(new Set(camposFaltantes)),
  };
};

/**
 * Evalua un lote completo: cada particion individual + suma vs peso del lote padre.
 */
export const evaluarLote = (
  particiones: RES_Particion[],
  pesoNetoLote: number
): EvaluacionLote => {
  const activas = particiones.filter((p) => p.estado !== "Eliminado");

  // Lote sin particiones activas: no hay requisitos que validar, es trivialmente valido.
  if (activas.length === 0) {
    return {
      cumple_suma: true,
      suma_pesos_netos: 0,
      diferencia_suma: 0,
      cumple: true,
      partidasNoCumplen: 0,
    };
  }

  const suma = round2(
    activas.reduce((s, p) => s + (p.peso_neto ?? 0), 0)
  );
  const pesoLote = round2(pesoNetoLote);
  const diferencia = round2(Math.abs(pesoLote - suma));
  const cumpleSuma = diferencia <= 0.01;

  let partidasNoCumplen = 0;
  for (const p of activas) {
    if (!evaluarParticion(p).cumple) {
      partidasNoCumplen += 1;
    }
  }

  return {
    cumple_suma: cumpleSuma,
    suma_pesos_netos: suma,
    diferencia_suma: diferencia,
    cumple: cumpleSuma && partidasNoCumplen === 0,
    partidasNoCumplen,
  };
};

/**
 * Traduce un campo faltante (snake_case del backend) a una etiqueta legible
 * para mostrar en el modal.
 */
export const etiquetaCampoFaltante = (campo: string): string => {
  const mapa: Record<string, string> = {
    peso_inicial: "Peso inicial",
    peso_final: "Peso final",
    peso_neto: "Peso neto",
    fecha_hora_peso_inicial: "Fecha hora peso inicial",
    fecha_hora_peso_final: "Fecha hora peso final",
    "recepcion.id_vehiculo": "Recepción: vehículo",
    "recepcion.id_conductor": "Recepción: conductor",
    "recepcion.id_empresa_transporte": "Recepción: empresa transporte",
    "recepcion.id_tipo_vehiculo": "Recepción: tipo vehículo",
    "recepcion.id_proveedor_minero": "Recepción: proveedor",
    "recepcion.fecha_hora_ingreso": "Recepción: fecha/hora ingreso",
    "recepcion.fecha_hora_salida": "Recepción: fecha/hora salida",
  };
  return mapa[campo] ?? campo;
};
