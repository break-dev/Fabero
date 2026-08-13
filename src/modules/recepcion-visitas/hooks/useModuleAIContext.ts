import { registerModuleAIContext } from "../../../hooks/ia/module-ai-registry";
import type { IModuleAIContext } from "../../../service/ia/ia.types";
import { useRecepcionVisitasContextStore } from "../stores/recepcion-visitas-context.store";

const fn = (): IModuleAIContext => {
  const state = useRecepcionVisitasContextStore.getState();

  const datos: Record<string, unknown> = {
    filtros: state.filtros,
    total_recepciones_cargadas: state.total_recepciones,
  };

  if (state.resumen_recepciones.length > 0) {
    datos.recepciones_recientes = state.resumen_recepciones.slice(0, 8);
  }

  if (state.modal_registro_abierto) {
    datos.modal_registro_abierto = true;
    if (state.form_en_curso) {
      datos.form_en_curso = state.form_en_curso;
    }
  }

  const instrucciones = [
    "Responde sobre cómo registrar una visita, qué datos se requieren del visitante, qué adjuntos son obligatorios y cómo se relaciona con la Recepción de Unidades.",
    "Si los datos del módulo están disponibles, úsalos como referencia (no como fuente de verdad absoluta).",
    "Si el modal de registro está abierto, prioriza responder sobre los datos que el usuario está completando actualmente.",
  ].join(" ");

  const descripcion =
    "Registro de visitas a la planta: motivo, personal de contacto, vehículo y lista de visitantes con su documento de identidad. " +
    `Actualmente hay ${state.total_recepciones} recepción(es) cargada(s) en el listado.`;

  return {
    titulo: "Recepción de Visitas",
    descripcion,
    instrucciones,
    datos,
  };
};

registerModuleAIContext("/operaciones/vigilancia/recepcion-visitas", fn);

export const useModuleAIContext = fn;