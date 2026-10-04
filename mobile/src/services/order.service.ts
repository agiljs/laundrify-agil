import { api } from "./api";
import type { Order } from "../types/api";

export type OrderItemInput = { serviceId: string; quantity: number };

export type OrderFormPayload = {
  customerId?: string;
  items: OrderItemInput[];
  deliveryFee: number;
  dueAt?: string;
  note?: string;
};

export async function getOrders() {
  const response = await api.get<{ data: Order[] }>("/orders");
  return response.data.data;
}

export async function getOrder(id: string) {
  const response = await api.get<{ data: Order }>(`/orders/${id}`);
  return response.data.data;
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  const response = await api.patch<{ data: Order }>(`/orders/${id}/status`, { status, note });
  return response.data.data;
}

export async function createOrder(payload: OrderFormPayload) {
  const response = await api.post<{ data: Order }>("/orders", payload);
  return response.data.data;
}

export async function updateOrder(id: string, payload: OrderFormPayload) {
  const response = await api.patch<{ data: Order }>(`/orders/${id}`, payload);
  return response.data.data;
}

export async function deleteOrder(id: string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/orders/${id}`);
  return response.data;
}
