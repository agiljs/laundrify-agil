import api from "./api";

import type { LaundryService } from "../types/service";

export type CreateServiceData = {
  name: string;
  description?: string;
  unit: string;
  price: number;
  inventoryUsage?: Record<string, number>;
  isActive?: boolean;
};

export type UpdateServiceData = {
  name?: string;
  description?: string;
  unit?: string;
  price?: number;
  inventoryUsage?: Record<string, number>;
  isActive?: boolean;
};

type ServiceListResponse = {
  success: boolean;
  data: LaundryService[];
};

type ServiceResponse = {
  success: boolean;
  data: LaundryService;
};

export async function getServices(): Promise<LaundryService[]> {
  const response = await api.get<ServiceListResponse>("/services");

  return response.data.data.map(normalizeService);
}

export async function getActiveServices(): Promise<LaundryService[]> {
  const response = await api.get<ServiceListResponse>("/services/active");

  return response.data.data.map(normalizeService);
}

export async function getServiceById(id: string): Promise<LaundryService> {
  const response = await api.get<ServiceResponse>(`/services/${id}`);

  return normalizeService(response.data.data);
}

export async function createService(
  data: CreateServiceData,
): Promise<LaundryService> {
  const response = await api.post<ServiceResponse>("/services", data);

  return normalizeService(response.data.data);
}

export async function updateService(
  id: string,
  data: UpdateServiceData,
): Promise<LaundryService> {
  const response = await api.patch<ServiceResponse>(`/services/${id}`, data);

  return normalizeService(response.data.data);
}

function normalizeService(service: LaundryService): LaundryService {
  return {
    ...service,
    price: Number(service.price),
  };
}
