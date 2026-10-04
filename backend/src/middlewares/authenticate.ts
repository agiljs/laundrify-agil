import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "rahasia_super_aman";

type JwtPayload = { id: string; role: UserRole };

function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "STAFF" || value === "CUSTOMER";
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.id === "string" && isUserRole(payload.role);
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Token tidak valid");

  const token = authHeader.slice(7).trim();
  if (!token) throw new Error("Token tidak ditemukan");

  const decoded: unknown = jwt.verify(token, JWT_SECRET);
  if (!isJwtPayload(decoded)) throw new Error("Token tidak valid");

  req.user = { id: decoded.id, role: decoded.role };
  next();
}
