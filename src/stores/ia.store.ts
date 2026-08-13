import { create } from "zustand";
import type {
  IAIMessage,
  IModuleAIContext,
} from "../service/ia/ia.types";

interface IAStore {
  panelOpen: boolean;
  conversacion: IAIMessage[];
  contextoModulo: IModuleAIContext | null;
  contextoKey: string;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setConversacion: (messages: IAIMessage[]) => void;
  appendMessage: (message: IAIMessage) => void;
  clearConversacion: () => void;
  setContextoModulo: (ctx: IModuleAIContext | null) => void;
  reset: () => void;
}

const initialState = {
  panelOpen: false,
  conversacion: [] as IAIMessage[],
  contextoModulo: null as IModuleAIContext | null,
  contextoKey: "",
};

export const useIAStore = create<IAStore>((set) => ({
  ...initialState,
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setConversacion: (messages) => set({ conversacion: messages }),
  appendMessage: (message) =>
    set((s) => ({ conversacion: [...s.conversacion, message] })),
  clearConversacion: () => set({ conversacion: [] }),
  setContextoModulo: (ctx) =>
    set(() => {
      const nextKey = ctx?.titulo ?? "";
      return {
        contextoModulo: ctx,
        contextoKey: nextKey,
      };
    }),
  reset: () => set({ ...initialState }),
}));