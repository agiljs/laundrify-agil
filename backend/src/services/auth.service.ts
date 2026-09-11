import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { generateToken } from "../utils/jwt";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Email atau password salah");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Akun tidak aktif");
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new Error("Email atau password salah");
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
