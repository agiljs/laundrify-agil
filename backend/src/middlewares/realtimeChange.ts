import type { NextFunction, Request, Response } from "express";
import { emitDataChanged } from "../websocket/events.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Setelah request yang mengubah data selesai dengan sukses,
 * beritahu admin & staff lewat WebSocket agar halaman mereka refresh otomatis.
 */
export function realtimeChange(entity: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (MUTATING.has(req.method)) {
      res.on("finish", () => {
        if (res.statusCode < 400) emitDataChanged(entity, req.method);
      });
    }
    next();
  };
}
