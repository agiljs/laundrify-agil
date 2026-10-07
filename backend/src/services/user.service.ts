import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import {
  findUsers,
  findUserById,
  findUserByEmail,
  updateUser,
  updateUserPassword,
} from "../repositories/user.repository.js";
import { prisma } from "../lib/prisma.js";

function createCustomerCode() {
  return `CUS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export async function getUsers() { return findUsers(); }

export async function getUserById(id: string) {
  const user = await findUserById(id);
  if (!user) throw new Error("User tidak ditemukan");
  return user;
}

export async function createNewUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "STAFF" | "CUSTOMER";
}) {
  const email = data.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email sudah digunakan");
  if (data.role === "CUSTOMER") {
    if (!data.phone) throw new Error("Nomor telepon wajib diisi untuk customer");
    const existingCustomer = await prisma.customer.findUnique({ where: { phone: data.phone.trim() } });
    if (existingCustomer) throw new Error("Nomor telepon customer sudah terdaftar");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        phone: data.phone?.trim(),
        role: data.role,
        status: "ACTIVE",
      },
    });

    if (data.role === "CUSTOMER") {
      if (!data.phone) throw new Error("Nomor telepon wajib diisi untuk customer");
      await tx.customer.create({
        data: {
          customerCode: createCustomerCode(),
          name: data.name.trim(),
          phone: data.phone.trim(),
          email,
          userId: user.id,
        },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
}

export async function updateUserById(id: string, data: { name?: string; phone?: string; status?: "ACTIVE" | "INACTIVE" }) {
  const user = await findUserById(id);
  if (!user) throw new Error("User tidak ditemukan");
  return updateUser(id, data);
}

export async function changeUserPassword(id: string, password: string) {
  const user = await findUserById(id);
  if (!user) throw new Error("User tidak ditemukan");
  return updateUserPassword(id, await bcrypt.hash(password, 12));
}
