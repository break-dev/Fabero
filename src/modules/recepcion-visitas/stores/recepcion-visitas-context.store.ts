import { create } from "zustand";

interface IResumenVisita {
  id: number;
  motivo: string;
  empleado_contacto: string | null;
  fecha_hora_ingreso: string;
  con_vehiculo: boolean;
  placa: string | null;
  total_visitantes: number;
  estado: string | null;
}

interface IVisitanteFormSnapshot {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  total_fotos: number;
}

interface IVehiculoFormSnapshot {
  placa: string;
  cantidad_personas: number;
  total_fotos: number;
}

interface IFormEnCursoSnapshot {
  motivo_ingreso: string | null;
  empleado_contacto: string | null;
  observacion: string;
  total_visitantes_en_formulario: number;
  visitante_en_edicion: IVisitanteFormSnapshot | null;
  vehiculo_en_edicion: IVehiculoFormSnapshot | null;
}

interface IRecepcionVisitasContextState {
  filtros: { fecha_inicio: string | null; fecha_fin: string | null };
  modal_registro_abierto: boolean;
  resumen_recepciones: IResumenVisita[];
  total_recepciones: number;
  form_en_curso: IFormEnCursoSnapshot | null;
  setFiltros: (filtros: { fecha_inicio: string | null; fecha_fin: string | null }) => void;
  setModalRegistroAbierto: (abierto: boolean) => void;
  setResumenRecepciones: (resumen: IResumenVisita[]) => void;
  setFormEnCurso: (form: IFormEnCursoSnapshot | null) => void;
  reset: () => void;
}

const initial = {
  filtros: { fecha_inicio: null, fecha_fin: null },
  modal_registro_abierto: false,
  resumen_recepciones: [],
  total_recepciones: 0,
  form_en_curso: null,
};

export const useRecepcionVisitasContextStore =
  create<IRecepcionVisitasContextState>((set) => ({
    ...initial,
    setFiltros: (filtros) => set({ filtros }),
    setModalRegistroAbierto: (modal_registro_abierto) =>
      set({ modal_registro_abierto }),
    setResumenRecepciones: (recepciones) =>
      set({
        resumen_recepciones: recepciones,
        total_recepciones: recepciones.length,
      }),
    setFormEnCurso: (form_en_curso) => set({ form_en_curso }),
    reset: () => set({ ...initial }),
  }));

export type {
  IResumenVisita,
  IVisitanteFormSnapshot,
  IVehiculoFormSnapshot,
  IFormEnCursoSnapshot,
};