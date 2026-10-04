import {
  getDashboardSummaryData,
  getOrderStatusReportData,
  getRevenueReportData,
  getExpenseReportData,
  getDailyRevenueData,
  getDailyExpenseData,
  getDailyOrderData,
  getRecentCustomersData,
  getRecentOrdersData,
  getLifetimeBusinessData,
} from "../repositories/dashboard.repository.js";

function startOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function startOfNextDay(date: Date) {
  const result = startOfDay(date);

  result.setDate(result.getDate() + 1);

  return result;
}

function startOfMonth(date: Date) {
  const result = new Date(date);

  result.setDate(1);

  result.setHours(0, 0, 0, 0);

  return result;
}

function startOfNextMonth(date: Date) {
  const result = startOfMonth(date);

  result.setMonth(result.getMonth() + 1);

  return result;
}

function validateDateRange(startDate: Date, endDate: Date) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Rentang tanggal tidak valid");
  }

  if (startDate >= endDate) {
    throw new Error("startDate harus lebih kecil dari endDate");
  }
}

function getDateRange(startDate?: string, endDate?: string) {
  let start: Date;
  let end: Date;

  if (startDate) {
    start = new Date(startDate);
  } else {
    start = startOfMonth(new Date());
  }

  if (endDate) {
    end = new Date(endDate);
  } else {
    end = startOfNextMonth(new Date());
  }

  validateDateRange(start, end);

  return {
    startDate: start,
    endDate: end,
  };
}

function createDailyMap(startDate: Date, endDate: Date) {
  const daily = new Map<
    string,
    {
      date: string;
      revenue: number;
      expense: number;
      profit: number;
      orders: number;
    }
  >();

  const current = startOfDay(startDate);

  while (current < endDate) {
    const date = current.toISOString().slice(0, 10);

    daily.set(date, {
      date,
      revenue: 0,
      expense: 0,
      profit: 0,
      orders: 0,
    });

    current.setDate(current.getDate() + 1);
  }

  return daily;
}

export async function getDashboardSummary() {
  const today = new Date();

  const todayStart = startOfDay(today);

  const todayEnd = startOfNextDay(today);

  const monthStart = startOfMonth(today);

  const monthEnd = startOfNextMonth(today);

  const [todayData, monthData, lifetimeData] = await Promise.all([
    getDashboardSummaryData(todayStart, todayEnd),
    getDashboardSummaryData(monthStart, monthEnd),
    getLifetimeBusinessData(),
  ]);

  return {
    today: {
      revenue: todayData.totalRevenue,
      expense: todayData.totalExpense,
      profit: todayData.totalRevenue - todayData.totalExpense,
      orders: todayData.totalOrders,
    },

    month: {
      revenue: monthData.totalRevenue,
      expense: monthData.totalExpense,
      profit: monthData.totalRevenue - monthData.totalExpense,
      orders: monthData.totalOrders,
    },

    customers: {
      total: monthData.totalCustomers,
      members: monthData.totalMembers,
    },

    lifetime: {
      revenue: lifetimeData.lifetimeRevenue,
      paidOrders: lifetimeData.lifetimePaidOrders,
    },

    orderStatus: {
      completed: monthData.completedOrders,
      cancelled: monthData.cancelledOrders,
      pending: monthData.pendingOrders,
    },
  };
}

export async function getOrderStatusReport(
  startDate?: string,
  endDate?: string,
) {
  const range = getDateRange(startDate, endDate);

  const data = await getOrderStatusReportData(range.startDate, range.endDate);

  return data.map((item) => ({
    status: item.status,
    total:
      typeof item._count === "object" && item._count !== null
        ? (item._count._all ?? 0)
        : 0,
  }));
}

export async function getRevenueReport(startDate?: string, endDate?: string) {
  const range = getDateRange(startDate, endDate);

  const data = await getRevenueReportData(range.startDate, range.endDate);

  return {
    totalTransactions: data._count._all,
    totalRevenue: Number(data._sum.amount ?? 0),
  };
}

export async function getExpenseReport(startDate?: string, endDate?: string) {
  const range = getDateRange(startDate, endDate);

  const data = await getExpenseReportData(range.startDate, range.endDate);

  return {
    totalTransactions: data._count._all,
    totalExpense: Number(data._sum.amount ?? 0),
  };
}

export async function getDailyReport(startDate?: string, endDate?: string) {
  const range = getDateRange(startDate, endDate);

  const [revenueData, expenseData, orderData] = await Promise.all([
    getDailyRevenueData(range.startDate, range.endDate),

    getDailyExpenseData(range.startDate, range.endDate),

    getDailyOrderData(range.startDate, range.endDate),
  ]);

  const daily = createDailyMap(range.startDate, range.endDate);

  for (const payment of revenueData) {
    const date = payment.paidAt.toISOString().slice(0, 10);

    const item = daily.get(date);

    if (item) {
      item.revenue += Number(payment.amount);
    }
  }

  for (const expense of expenseData) {
    const date = expense.expenseDate.toISOString().slice(0, 10);

    const item = daily.get(date);

    if (item) {
      item.expense += Number(expense.amount);
    }
  }

  for (const order of orderData) {
    const date = order.createdAt.toISOString().slice(0, 10);

    const item = daily.get(date);

    if (item) {
      item.orders += 1;
    }
  }

  for (const item of daily.values()) {
    item.profit = item.revenue - item.expense;
  }

  return Array.from(daily.values());
}

export async function getRecentCustomers(limit = 5) {
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  const customers = await getRecentCustomersData(safeLimit);

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: customer.createdAt.toISOString(),
  }));
}

export async function getRecentOrders(limit = 5) {
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  const orders = await getRecentOrdersData(safeLimit);

  return orders.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),

    customer: {
      id: order.customer.id,
      name: order.customer.name,
    },

    items: order.items.map((item) => ({
      quantity: Number(item.quantity),
      service: {
        name: item.service.name,
        unit: item.service.unit,
      },
    })),
  }));
}
