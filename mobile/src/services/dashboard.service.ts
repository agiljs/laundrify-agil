import { api } from "./api";
import type { DashboardSummary, Order, Customer } from "../types/api";

export async function getDashboardSummary() {
  const response = await api.get<{ data: DashboardSummary }>("/dashboard/summary");
  return response.data.data;
}

export async function getRecentOrders(limit = 5) {
  const response = await api.get<{ data: Order[] }>(`/dashboard/recent-orders?limit=${limit}`);
  return response.data.data;
}

export async function getRecentCustomers(limit = 5) {
  const response = await api.get<{ data: Customer[] }>(`/dashboard/recent-customers?limit=${limit}`);
  return response.data.data;
}
