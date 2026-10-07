import { io, type Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";

/**
 * Satu koneksi WebSocket bersama untuk seluruh aplikasi mobile.
 * Token dibaca ulang dari SecureStore setiap (re)connect, jadi tetap valid
 * setelah login ulang tanpa perlu membuat koneksi baru secara manual.
 */

function resolveSocketUrl() {
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;

  const api = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5000/api";
  return api.replace(/\/api\/?$/, "");
}

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (socket) return socket;

  socket = io(resolveSocketUrl(), {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    auth: (callback) => {
      SecureStore.getItemAsync("laundrify_token")
        .then((token) => callback({ token: token ?? "" }))
        .catch(() => callback({ token: "" }));
    },
  });

  return socket;
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
