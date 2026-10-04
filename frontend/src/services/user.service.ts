import api from "./api";
import type { CreateUserPayload, UpdateUserPayload, User } from "../types/user";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export async function getUsers(): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>("/users");
  return response.data.data;
}

export async function getUserById(id: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);
  return response.data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await api.post<ApiResponse<User>>("/users", payload);
  return response.data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return response.data.data;
}

export async function changeUserPassword(id: string, password: string): Promise<User> {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}/password`, { password });
  return response.data.data;
}
