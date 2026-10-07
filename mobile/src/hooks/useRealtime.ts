import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getRealtimeSocket } from "../services/realtime";

/**
 * Jalankan `handler` setiap kali salah satu event WebSocket diterima.
 * - event beruntun digabung (debounce) agar tidak memicu banyak request,
 * - setelah koneksi pulih atau app kembali ke foreground, handler dipanggil
 *   sekali supaya data yang terlewat langsung tersinkron.
 *
 * Format `data:changed:<entity>` hanya memicu handler untuk entity tersebut.
 * `events` harus berupa array konstan di luar komponen.
 */
export function useRealtime(
  events: readonly string[],
  handler: (event: string, payload: unknown) => void,
  debounceMs = 300,
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  const key = events.join("|");

  useEffect(() => {
    const socket = getRealtimeSocket();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastEvent = "";
    let lastPayload: unknown;

    const schedule = (event: string, payload: unknown) => {
      lastEvent = event;
      lastPayload = payload;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handlerRef.current(lastEvent, lastPayload), debounceMs);
    };

    const listeners = events.map((spec) => {
      const entity = spec.startsWith("data:changed:") ? spec.slice("data:changed:".length) : null;
      const eventName = entity ? "data:changed" : spec;

      const listener = (payload: unknown) => {
        if (entity && (payload as { entity?: string } | null)?.entity !== entity) return;
        schedule(spec, payload);
      };

      socket.on(eventName, listener);
      return [eventName, listener] as const;
    });

    let connectedBefore = socket.connected;
    const onConnect = () => {
      if (connectedBefore) schedule("reconnect", null);
      connectedBefore = true;
    };
    socket.on("connect", onConnect);

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (!socket.connected) socket.connect();
      schedule("resume", null);
    });

    return () => {
      if (timer) clearTimeout(timer);
      for (const [eventName, listener] of listeners) socket.off(eventName, listener);
      socket.off("connect", onConnect);
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debounceMs]);
}
