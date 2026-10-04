export type OrderStatus =
  | "RECEIVED"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type OrderCustomer = {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  membershipType?: "NONE" | "MEMBER";
  membershipDiscount?: number;
};

export type OrderService = {
  id: string;
  name: string;
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
  service?: OrderService;
};

export type OrderPayment = {
  id: string;
  amount: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
  method?: string;
  status?: string;
  paidAt?: string | null;
  createdAt?: string;
};

export type OrderStatusHistory = {
  id: string;
  status: OrderStatus;
  note?: string | null;
  changedAt: string;
  changedBy?: {
    id: string;
    name: string;
    role: string;
  } | string | null;
};

export type OrderDelivery = {
  id: string;
  type?: string;
  status?: string;
};

export type Order = {
  id: string;
  orderCode: string;
  customerId: string;
  createdById?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  dueAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;

  customer?: OrderCustomer | null;
  createdBy?: {
    id: string;
    name: string;
    role: string;
  } | null;

  items: OrderItem[];
  payments?: OrderPayment[];
  statusHistory?: OrderStatusHistory[];
  deliveries?: OrderDelivery[];
};

export type CreateOrderItemPayload = {
  serviceId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  customerId: string;
  items: CreateOrderItemPayload[];
  dueAt?: string;
  note?: string;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  note?: string;
};
