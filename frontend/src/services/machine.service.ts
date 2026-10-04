import api from "./api";
import type { Machine, MachinePayload } from "../types/machine";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export async function getMachines(): Promise<Machine[]> {
  const response = await api.get<ApiResponse<Machine[]>>("/machines");
  return response.data.data;
}

export async function getMachineById(id: string): Promise<Machine> {
  const response = await api.get<ApiResponse<Machine>>(`/machines/${id}`);
  return response.data.data;
}

export async function createMachine(payload: MachinePayload): Promise<Machine> {
  const response = await api.post<ApiResponse<Machine>>("/machines", payload);
  return response.data.data;
}

export async function updateMachine(id: string, payload: Partial<MachinePayload>): Promise<Machine> {
  const response = await api.patch<ApiResponse<Machine>>(`/machines/${id}`, payload);
  return response.data.data;
}
