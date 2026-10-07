import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

let io: Server | null = null;

type SocketJwtPayload = { id: string; role: "ADMIN" | "STAFF" | "CUSTOMER" };

/** Nama room — dipakai bersama oleh socket.ts dan events.ts. */
export const rooms = {
  staff: "staff", // ADMIN + STAFF
  user: (userId: string) => `user:${userId}`,
  customer: (customerId: string) => `customer:${customerId}`,
} as const;

function allowedOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return true; // sama seperti app.use(cors()) saat ini: semua origin
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function isPayload(value: unknown): value is SocketJwtPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && (v.role === "ADMIN" || v.role === "STAFF" || v.role === "CUSTOMER");
}

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins() },
  });

  /**
   * Autentikasi koneksi dengan JWT yang sama seperti REST API.
   * Tanpa token yang valid, koneksi ditolak -> tidak ada data yang bocor ke publik.
   */
  io.use(async (socket, next) => {
    try {
      const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token.trim() : "";
      if (!token) return next(new Error("Token tidak ditemukan"));

      const decoded: unknown = jwt.verify(token, process.env.JWT_SECRET ?? "rahasia_super_aman");
      if (!isPayload(decoded)) return next(new Error("Token tidak valid"));

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, status: true, customerProfile: { select: { id: true } } },
      });
      if (!user || user.status !== "ACTIVE") return next(new Error("Akun tidak aktif"));

      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.customerId = user.customerProfile?.id ?? null;
      next();
    } catch {
      next(new Error("Token tidak valid"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, customerId } = socket.data as {
      userId: string;
      role: SocketJwtPayload["role"];
      customerId: string | null;
    };

    void socket.join(rooms.user(userId));
    if (role === "ADMIN" || role === "STAFF") void socket.join(rooms.staff);
    if (role === "CUSTOMER" && customerId) void socket.join(rooms.customer(customerId));

    if (process.env.NODE_ENV !== "production") {
      console.log(`WebSocket connected: ${socket.id} (${role})`);
    }
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

/** Versi aman untuk dipanggil dari service: tidak melempar error bila socket belum aktif (mis. script seed/test). */
export function tryGetIO() {
  return io;
}
