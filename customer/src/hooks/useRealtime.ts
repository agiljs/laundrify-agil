import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

/**
 * Jalankan `handler` setiap kali salah satu event WebSocket diterima.
 * Bila beberapa event datang beruntun (mis. order + payment), handler hanya
 * dipanggil sekali (debounce) dan juga dipanggil ulang saat koneksi tersambung
 * kembali, supaya data yang terlewat saat offline langsung tersinkron.
 *
 * `events` sebaiknya berupa array konstan (di luar komponen) atau di-memo.
 * Format khusus `data:changed:<entity>` (mis. `data:changed:customers`) hanya
 * memicu handler bila perubahan data umum itu menyangkut entity tersebut.
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
    const socket = getSocket();
    if (!socket) return;

    let timer: number | undefined;
    let lastEvent = "";
    let lastPayload: unknown;

    const schedule = (event: string, payload: unknown) => {
      lastEvent = event;
      lastPayload = payload;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => handlerRef.current(lastEvent, lastPayload), debounceMs);
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

    // setelah koneksi terputus lalu tersambung lagi -> ambil ulang data
    let hasConnectedBefore = socket.connected;
    const onConnect = () => {
      if (hasConnectedBefore) schedule("reconnect", null);
      hasConnectedBefore = true;
    };
    socket.on("connect", onConnect);

    return () => {
      window.clearTimeout(timer);
      for (const [event, listener] of listeners) socket.off(event, listener);
      socket.off("connect", onConnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debounceMs]);
}
