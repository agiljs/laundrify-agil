import api from "./api";

import type {
  DashboardSummary,
  OrderStatusReport,
  RevenueReport,
  ExpenseReport,
  DailyReportItem,
  RecentCustomer,
  RecentOrder,
} from "../types/dashboard";

export async function getRecentCustomers(limit = 5) {
  const response = await api.get<{
    success: boolean;
    data: RecentCustomer[];
  }>("/dashboard/recent-customers", {
    params: {
      limit,
    },
  });

  return response.data.data;
}

export async function getRecentOrders(limit = 5) {
  const response = await api.get<{
    success: boolean;
    data: RecentOrder[];
  }>("/dashboard/recent-orders", {
    params: {
      limit,
    },
  });

  return response.data.data;
}

export async function getDashboardSummary() {
  const response = await api.get<{
    success: boolean;
    data: DashboardSummary;
  }>("/dashboard/summary");

  return response.data.data;
}

export async function getOrderStatusReport(
  startDate?: string,
  endDate?: string,
) {
  const response = await api.get<{
    success: boolean;
    data: OrderStatusReport[];
  }>("/dashboard/orders", {
    params: {
      startDate,
      endDate,
    },
  });

  return response.data.data;
}

export async function getRevenueReport(startDate?: string, endDate?: string) {
  const response = await api.get<{
    success: boolean;
    data: RevenueReport;
  }>("/dashboard/revenue", {
    params: {
      startDate,
      endDate,
    },
  });

  return response.data.data;
}

export async function getExpenseReport(startDate?: string, endDate?: string) {
  const response = await api.get<{
    success: boolean;
    data: ExpenseReport;
  }>("/dashboard/expenses", {
    params: {
      startDate,
      endDate,
    },
  });

  return response.data.data;
}

export async function getDailyReport(startDate?: string, endDate?: string) {
  const response = await api.get<{
    success: boolean;
    data: DailyReportItem[];
  }>("/dashboard/daily", {
    params: {
      startDate,
      endDate,
    },
  });

  return response.data.data;
}
