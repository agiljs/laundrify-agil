import { io, type Socket } from "socket.io-client";
import { TOKEN_KEY } from "./storage";

/**
 * Satu koneksi WebSocket bersama untuk seluruh aplikasi customer.
 * Memakai JWT yang sama dengan REST API dan dibuat ulang bila token berubah.
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
  const token = localStorage.getItem(TOKEN_KEY);

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
