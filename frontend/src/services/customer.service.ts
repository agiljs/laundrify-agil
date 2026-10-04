import api from "./api";

import type { Customer, MembershipType } from "../types/customer";

type CustomerListResponse = {
  success: boolean;
  data: Customer[];
};

type CustomerResponse = {
  success: boolean;
  data: Customer;
};

export type CreateCustomerData = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  membershipType?: MembershipType;
  membershipDiscount?: number;
};

export type UpdateCustomerData = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  membershipType?: MembershipType;
  membershipDiscount?: number;
};

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<CustomerListResponse>("/customers");

  return response.data.data;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const response = await api.get<CustomerResponse>(`/customers/${id}`);

  return response.data.data;
}

export async function createCustomer(
  data: CreateCustomerData,
): Promise<Customer> {
  const response = await api.post<CustomerResponse>("/customers", data);

  return response.data.data;
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerData,
): Promise<Customer> {
  const response = await api.patch<CustomerResponse>(`/customers/${id}`, data);

  return response.data.data;
}

export async function deleteCustomer(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/customers/${id}`);

  return response.data;
}
