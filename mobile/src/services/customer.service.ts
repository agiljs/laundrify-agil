import { api } from "./api";
import type { Customer } from "../types/api";

export type CustomerFormPayload = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

export async function getCustomers() {
  const response = await api.get<{ data: Customer[] }>("/customers");
  return response.data.data;
}

export async function createCustomer(payload: CustomerFormPayload) {
  const response = await api.post<{ data: Customer }>("/customers", payload);
  return response.data.data;
}

export async function updateCustomer(id: string, payload: Partial<CustomerFormPayload>) {
  const response = await api.patch<{ data: Customer }>(`/customers/${id}`, payload);
  return response.data.data;
}

export async function updateMembership(id: string, membershipType: "NONE" | "MEMBER", membershipDiscount: number) {
  const response = await api.patch<{ data: Customer }>(`/customers/${id}`, { membershipType, membershipDiscount });
  return response.data.data;
}

export async function deleteCustomer(id: string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
  return response.data;
}
