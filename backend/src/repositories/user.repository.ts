import { prisma } from "../lib/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function findUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: "STAFF" | "CUSTOMER";
  status: "ACTIVE";
}) {
  return prisma.user.create({ data, select: userSelect });
}

export async function updateUser(id: string, data: { name?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }) {
  return prisma.user.update({ where: { id }, data, select: userSelect });
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash }, select: userSelect });
}
