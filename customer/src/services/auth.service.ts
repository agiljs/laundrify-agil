import api from "./api";
import { disconnectSocket } from "./socket";
import { TOKEN_KEY, USER_KEY } from "./storage";
import type { AuthUser } from "../types";

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await api.post<{ data: { token: string; user: AuthUser } }>("/auth/login", { email, password });
  const { token, user } = response.data.data;

  // Aplikasi ini khusus customer. Token admin/staff tidak disimpan sama sekali.
  if (user.role !== "CUSTOMER") {
    throw new Error("Akun ini bukan akun customer. Admin dan staff silakan masuk lewat web admin.");
  }

  disconnectSocket();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export type RegisterInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
  customerCode?: string;
};

export async function register(input: RegisterInput): Promise<{ user: AuthUser; linkedExisting: boolean }> {
  const response = await api.post<{ data: { token: string; user: AuthUser; linkedExisting: boolean } }>(
    "/auth/register/customer",
    {
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      password: input.password,
      address: input.address?.trim() || undefined,
      customerCode: input.customerCode?.trim() || undefined,
    },
  );
  const { token, user, linkedExisting } = response.data.data;

  disconnectSocket();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { user, linkedExisting };
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<{ data: AuthUser }>("/auth/me");
  const user = response.data.data;
  if (user.role !== "CUSTOMER") throw new Error("Role tidak diizinkan");
  return user;
}

export function logout() {
  disconnectSocket();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}
