import type { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: err.issues,
    });
  }

  if (err instanceof Error) {
    const message = err.message;

    if (
      message === "Unauthorized" ||
      message === "Token tidak ditemukan" ||
      message === "Token tidak valid" ||
      message === "Format token tidak valid"
    ) {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (
      message === "Akses ditolak" ||
      message.includes("tidak memiliki akses") ||
      message.includes("bukan driver")
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (message.includes("tidak ditemukan")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message.includes("sudah digunakan") || message.includes("sudah ada")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
