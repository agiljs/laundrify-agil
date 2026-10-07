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
    // Akun customer hanya berasal dari seed/admin; login Google tidak membuat akun baru.
    throw new Error("Akun Google ini belum terdaftar di Laundrify");
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

/** Error pendaftaran dengan kode, supaya aplikasi customer tahu field apa yang perlu ditampilkan. */
export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly code?: "CLAIM_CODE_REQUIRED" | "CLAIM_CODE_INVALID",
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}

/** "+62 812-3456-789" / "62812..." / "812..." -> "0812..." */
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("8")) digits = `0${digits}`;
  return digits;
}

function phoneVariants(normalized: string) {
  const national = normalized.slice(1);
  return [normalized, `62${national}`, `+62${national}`];
}

export async function registerCustomer(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  customerCode?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const phone = normalizePhone(data.phone);
  if (!/^0\d{8,13}$/.test(phone)) throw new Error("Nomor telepon tidak valid. Contoh: 081234567890");

  const [existingUser, existingCustomer] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.customer.findFirst({ where: { phone: { in: phoneVariants(phone) } } }),
  ]);

  if (existingUser) throw new Error("Email sudah digunakan");

  /**
   * Customer lama = data pelanggan yang dibuat admin/kasir TANPA akun login.
   * Nomor telepon mereka sudah ada, jadi pendaftaran harus "menautkan" akun baru ke data lama
   * (riwayat order tetap ikut). Karena belum ada verifikasi OTP, penautan wajib disertai Kode Customer
   * (yang tercatat di sistem & hanya diketahui admin/pemilik), agar orang lain tidak bisa
   * mengambil alih riwayat order seseorang hanya dengan mengetahui nomor HP-nya.
   */
  if (existingCustomer) {
    if (existingCustomer.userId) throw new Error("Nomor telepon sudah digunakan oleh akun lain. Silakan masuk dengan akun tersebut.");
    if (existingCustomer.deletedAt) throw new Error("Nomor telepon sudah digunakan. Silakan hubungi admin Laundrify.");

    const code = data.customerCode?.trim().toUpperCase();
    if (!code) {
      throw new RegistrationError(
        "Nomor ini sudah tercatat sebagai pelanggan Laundrify. Masukkan Kode Customer Anda (tanyakan ke kasir/admin) untuk menghubungkan riwayat order.",
        "CLAIM_CODE_REQUIRED",
      );
    }
    if (code !== existingCustomer.customerCode.toUpperCase()) {
      throw new RegistrationError("Kode Customer tidak sesuai dengan nomor telepon ini.", "CLAIM_CODE_INVALID");
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const name = data.name.trim();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash, phone, role: "CUSTOMER", status: "ACTIVE" },
    });

    const customer = existingCustomer
      ? await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            userId: user.id,
            email: existingCustomer.email ?? email,
            address: existingCustomer.address ?? (data.address?.trim() || undefined),
          },
        })
      : await tx.customer.create({
          data: {
            customerCode: createCustomerCode(),
            name,
            phone,
            email,
            address: data.address?.trim() || undefined,
            userId: user.id,
          },
        });

    return { user, customer, linkedExisting: Boolean(existingCustomer) };
  });

  const login = await finishLogin({ ...result.user, customerProfile: result.customer });
  return { ...login, linkedExisting: result.linkedExisting };
}

export async function getAuthenticatedUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { customerProfile: { select: { id: true, customerCode: true } } },
  });

  if (!user || user.status !== "ACTIVE") throw new Error("Akun tidak ditemukan atau tidak aktif");
  return buildAuthUser(user);
}
