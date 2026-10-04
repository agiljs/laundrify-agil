export type DashboardSummary = {
  today: {
    revenue: number;
    expense: number;
    profit: number;
    orders: number;
  };

  month: {
    revenue: number;
    expense: number;
    profit: number;
    orders: number;
  };

  customers: {
    total: number;
    members: number;
  };

  lifetime: {
    revenue: number;
    paidOrders: number;
  };

  orderStatus: {
    completed: number;
    cancelled: number;
    pending: number;
  };
};

export type OrderStatusReport = {
  status:
    | "RECEIVED"
    | "WASHING"
    | "DRYING"
    | "IRONING"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";

  total: number;
};

export type RevenueReport = {
  totalTransactions: number;
  totalRevenue: number;
};

export type ExpenseReport = {
  totalTransactions: number;
  totalExpense: number;
};

export type DailyReportItem = {
  date: string;
  revenue: number;
  expense: number;
  profit: number;
  orders: number;
};

export type RecentCustomer = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type RecentOrder = {
  id: string;
  orderCode: string;
  status:
    | "RECEIVED"
    | "WASHING"
    | "DRYING"
    | "IRONING"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";

  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

  total: number;
  createdAt: string;

  customer: {
    id: string;
    name: string;
  };

  items: {
    quantity: number;

    service: {
      name: string;
      unit: string;
    };
  }[];
};
