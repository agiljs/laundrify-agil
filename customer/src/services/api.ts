import axios from "axios";
import { disconnectSocket } from "./socket";
import { TOKEN_KEY, USER_KEY } from "./storage";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = String(error.config?.url ?? "").includes("/auth/login");

    // Sesi habis -> kembali ke login. Salah password (401 dari /auth/login) tidak boleh me-reload halaman.
    if (error.response?.status === 401 && !isLoginRequest) {
      disconnectSocket();
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
