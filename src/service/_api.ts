import axios from "axios";
import { useAuthStore } from "../stores/auth.store";
import { useMenuNavegacionStore } from "../stores/menu.store";
import { usePerfilStore } from "../modules/perfil/hooks/usePerfilStore";
import { useUIStore } from "../stores/ui.store";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  // Sin Content-Type default: el transformRequest interno de axios setea
  // 'application/json' para bodies JSON. Para FormData lo deja libre y el
  // browser auto-asigna 'multipart/form-data; boundary=...' con boundary válido.
});

// Interceptor para agregar token de autenticacion
api.interceptors.request.use(
  (request) => {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `[API] Solicitud - ${request.method} a: ${request.url}`,
      request.data,
    );
    return request;
  },
  (error) => {
    console.error("[API] Error en la solicitud", error);
    return Promise.reject(error);
  },
);

// interceptor para imprimir respuestas y errores globalmente
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Respuesta de ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.log("[API] Error en la respuesta:", error);

    // Si recibimos un 401, cerramos la sesion automaticamente
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      useMenuNavegacionStore.getState().clearMenu();
      usePerfilStore.getState().reset();

      // Notificar al usuario
      const message =
        error.response.data?.message || "Sesión expirada o no autorizada";
      useUIStore.getState().notify({ type: "error", content: message });
    }

    return Promise.reject(error);
  },
);

export { api };
