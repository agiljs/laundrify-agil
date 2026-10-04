export type Role = "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  customerId: string | null;
  customerCode: string | null;
};

export type PaymentRecord = {
  id: string;
  method: string;
  amount: number | string;
  cashReceived?: number | string | null;
  changeAmount?: number | string | null;
  transactionCode?: string | null;
  note?: string | null;
  status: string;
  paidAt: string;
  receivedBy?: { id: string; name: string; role: string } | null;
};

export type Order = {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  total: number | string;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string | null };
  items?: Array<{ id: string; quantity: number | string; subtotal: number | string; service?: { name: string } }>;
  payments?: PaymentRecord[];
};

export type Customer = {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  membershipType: "NONE" | "MEMBER";
  membershipDiscount: number | string;
  membershipExpiredAt?: string | null;
  loyaltyPoints: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string | null;
  unit: string;
  price: number | string;
  isActive: boolean;
};

export type DashboardSummary = {
  today: { revenue: number; expense: number; profit: number; orders: number };
  month: { revenue: number; expense: number; profit: number; orders: number };
  customers: { total: number; members: number };
  lifetime: { revenue: number; paidOrders: number };
  orderStatus: { completed: number; cancelled: number; pending: number };
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};
