import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";

function createCustomerCode() {
  return `CUS-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function buildAuthUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE";
  customerProfile?: { id: string; customerCode: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    customerId: user.customerProfile?.id ?? null,
    customerCode: user.customerProfile?.customerCode ?? null,
  };
}

async function finishLogin(user: Parameters<typeof buildAuthUser>[0]) {
  const token = generateToken({ id: user.id, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { token, user: buildAuthUser(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { customerProfile: { select: { id: true, customerCode: true } } },
  });

  if (!user) throw new Error("Email atau password salah");
  if (user.status !== "ACTIVE") throw new Error("Akun tidak aktif");

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) throw new Error("Email atau password salah");

  return finishLogin(user);
}

export async function loginWithGoogle(idToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID belum dikonfigurasi di backend");

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error("Akun Google tidak dapat diverifikasi");
  }

  const email = payload.email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email }] },
    include: { customerProfile: { select: { id: true, customerCode: true } } },
  });

  if (!user) {
    const temporaryPassword = await bcrypt.hash(randomUUID(), 12);
    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: payload.name?.trim() || email.split("@")[0],
          email,
          passwordHash: temporaryPassword,
          googleId: payload.sub,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });

      const customer = await tx.customer.create({
        data: {
          customerCode: createCustomerCode(),
          name: createdUser.name,
          phone: `GOOGLE-${createdUser.id.slice(0, 12)}`,
          email,
          userId: createdUser.id,
        },
      });

      return { createdUser, customer };
    });

    user = {
      ...result.createdUser,
      customerProfile: result.customer,
    };
  } else {
    if (user.status !== "ACTIVE") throw new Error("Akun tidak aktif");

    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
        include: { customerProfile: { select: { id: true, customerCode: true } } },
      });
    }
  }

  return finishLogin(user);
}

export async function registerCustomer(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim();

  const [existingUser, existingCustomer] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.customer.findUnique({ where: { phone } }),
  ]);

  if (existingUser) throw new Error("Email sudah digunakan");
  if (existingCustomer) throw new Error("Nomor telepon sudah digunakan");

  const passwordHash = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name.trim(), email, passwordHash, phone,
        role: "CUSTOMER", status: "ACTIVE",
      },
    });

    const customer = await tx.customer.create({
      data: {
        customerCode: createCustomerCode(), name: data.name.trim(), phone, email,
        address: data.address?.trim() || undefined, userId: user.id,
      },
    });

    return { user, customer };
  });

  return finishLogin({ ...result.user, customerProfile: result.customer });
}

export async function getAuthenticatedUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { customerProfile: { select: { id: true, customerCode: true } } },
  });

  if (!user || user.status !== "ACTIVE") throw new Error("Akun tidak ditemukan atau tidak aktif");
  return buildAuthUser(user);
}
