import { api, clearToken, saveToken } from "./api";
import type { AuthUser } from "../types/api";
import { disconnectRealtime } from "./realtime";

export async function login(email: string, password: string) {
  const response = await api.post<{ data: { token: string; user: AuthUser } }>("/auth/login", { email, password });
  const result = response.data.data;
  if (result.user.role !== "ADMIN" && result.user.role !== "STAFF") {
    throw new Error("Aplikasi mobile ini hanya untuk Admin dan Staff.");
  }
  disconnectRealtime(); // pastikan koneksi lama (akun sebelumnya) tidak terbawa
  await saveToken(result.token);
  return result.user;
}

export async function me() {
  const response = await api.get<{ data: AuthUser }>("/auth/me");
  const user = response.data.data;
  if (user.role !== "ADMIN" && user.role !== "STAFF") throw new Error("Role tidak diizinkan");
  return user;
}

export async function logout() {
  disconnectRealtime();
  await clearToken();
}
