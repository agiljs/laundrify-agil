import { io, type Socket } from "socket.io-client";

/**
 * Satu koneksi WebSocket bersama untuk seluruh aplikasi web (admin & customer).
 * Koneksi memakai JWT yang sama dengan REST API, dan dibuat ulang otomatis
 * bila token berubah (login ulang / ganti akun).
 */

function resolveSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicit) return explicit;

  const api = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api";
  return api.replace(/\/api\/?$/, "");
}

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket | null {
  const token = localStorage.getItem("laundrify_token");

  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket && currentToken === token) return socket;

  disconnectSocket();
  currentToken = token;
  socket = io(resolveSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentToken = null;
}
