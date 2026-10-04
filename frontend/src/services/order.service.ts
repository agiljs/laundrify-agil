import api from "./api";
import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
  UpdateOrderStatusPayload,
} from "../types/order";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

function unwrapData<T>(value: T | ApiEnvelope<T>): T {
  if (typeof value === "object" && value !== null && "data" in value) {
    return (value as ApiEnvelope<T>).data;
  }

  return value as T;
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,

    subtotal: normalizeNumber(order.subtotal),
    discount: normalizeNumber(order.discount),
    total: normalizeNumber(order.total),

    customer: order.customer
      ? {
          ...order.customer,
          membershipDiscount: normalizeNumber(
            order.customer.membershipDiscount ?? 0,
          ),
        }
      : null,

    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          quantity: normalizeNumber(item.quantity),
          priceSnapshot: normalizeNumber(item.priceSnapshot),
          subtotal: normalizeNumber(item.subtotal),

          service: item.service
            ? {
                ...item.service,
                price: normalizeNumber(item.service.price),
              }
            : undefined,
        }))
      : [],

    payments: Array.isArray(order.payments)
      ? order.payments.map((payment) => ({
          ...payment,
          amount: normalizeNumber(payment.amount),
          cashReceived: payment.cashReceived == null ? null : normalizeNumber(payment.cashReceived),
          changeAmount: payment.changeAmount == null ? null : normalizeNumber(payment.changeAmount),
        }))
      : [],

    statusHistory: Array.isArray(order.statusHistory)
      ? order.statusHistory.map((history) => ({
          ...history,
          changedBy: typeof history.changedBy === "string"
            ? { id: history.changedBy, name: "Admin", role: "ADMIN" }
            : history.changedBy,
        }))
      : [],
  };
}

export async function getOrders(): Promise<Order[]> {
  const response = await api.get<Order[] | ApiEnvelope<Order[]>>("/orders");

  const orders = unwrapData(response.data);

  if (!Array.isArray(orders)) {
    return [];
  }

  return orders.map(normalizeOrder);
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await api.get<Order | ApiEnvelope<Order>>(`/orders/${id}`);

  return normalizeOrder(unwrapData(response.data));
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const response = await api.post<Order | ApiEnvelope<Order>>(
    "/orders",
    payload,
  );

  return normalizeOrder(unwrapData(response.data));
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Order> {
  const payload: UpdateOrderStatusPayload = {
    status,
  };

  if (note?.trim()) {
    payload.note = note.trim();
  }

  const response = await api.patch<Order | ApiEnvelope<Order>>(
    `/orders/${id}/status`,
    payload,
  );

  return normalizeOrder(unwrapData(response.data));
}
