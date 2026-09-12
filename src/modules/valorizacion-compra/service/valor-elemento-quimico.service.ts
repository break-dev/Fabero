import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";

export interface RES_ValorElementoQuimico {
  id: number;
  id_empleado_registro: number | null;
  elemento_quimico: ElementoQuimicoValorizacion;
  inter: number;
  fecha: string;
  created_at: string | null;
}

export interface REQ_RegistrarPrecioInter {
  elemento_quimico: ElementoQuimicoValorizacion;
  fecha: string;
  inter: number;
}

const basePath = "/valor-elemento-quimico";

export const ValorElementoQuimicoService = {
  buscarPrecio: async (params: {
    elemento: ElementoQuimicoValorizacion;
    fecha: string;
  }): Promise<IRespuesta<RES_ValorElementoQuimico | null>> => {
    try {
      const { data } = await api.get<IRespuesta<RES_ValorElementoQuimico>>(
        `${basePath}/buscar`,
        { params },
      );
      return data;
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 400
      ) {
        return { success: false, data: null, message: "Sin precio registrado" };
      }
      throw err;
    }
  },

  registrarPrecio: async (
    payload: REQ_RegistrarPrecioInter,
  ): Promise<IRespuesta<RES_ValorElementoQuimico>> => {
    const { data } = await api.post<IRespuesta<RES_ValorElementoQuimico>>(
      basePath,
      payload,
    );
    return data;
  },
};
