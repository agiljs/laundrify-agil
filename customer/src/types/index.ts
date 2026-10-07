export type OrderStatus = "RECEIVED" | "WASHING" | "DRYING" | "IRONING" | "READY" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE";
  customerId?: string | null;
  customerCode?: string | null;
};

export type LaundryService = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  isActive: boolean;
};

export type OrderItem = {
  id: string;
  serviceId: string;
  quantity: number;
  priceSnapshot: number;
  subtotal: number;
  service?: { id: string; name: string; unit: string; price: number };
};

export type OrderPayment = {
  id: string;
  amount: number;
  method?: string;
  transactionCode?: string | null;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  paidAt?: string | null;
  createdAt?: string;
};

export type Order = {
  id: string;
  orderCode: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  dueAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments?: OrderPayment[];
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};
