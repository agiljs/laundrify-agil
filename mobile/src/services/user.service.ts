import { api } from "./api";
import type { AuthUser } from "../types/api";

export async function updateUser(id: string, payload: { name?: string; phone?: string }) {
  const response = await api.patch<{ data: AuthUser }>(`/users/${id}`, payload);
  return response.data.data;
}

export async function changeUserPassword(id: string, password: string) {
  const response = await api.patch<{ data: AuthUser }>(`/users/${id}/password`, { password });
  return response.data.data;
}
