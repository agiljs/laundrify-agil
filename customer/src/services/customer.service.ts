import api from "./api";
import type { LaundryService, NotificationItem, Order, OrderPayment } from "../types";

type Envelope<T> = { success: boolean; message?: string; data: T };

export type CustomerOrderInput = {
  items: Array<{ serviceId: string; quantity: number }>;
  dueAt?: string;
  note?: string;
};

export type MidtransSnapResult = {
  paymentId: string;
  transactionCode: string;
  amount: number;
  token: string;
  redirectUrl: string;
  clientKey: string;
  isProduction: boolean;
};

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    subtotal: num(order.subtotal),
    discount: num(order.discount),
    deliveryFee: num(order.deliveryFee ?? 0),
    total: num(order.total),
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          quantity: num(item.quantity),
          priceSnapshot: num(item.priceSnapshot),
          subtotal: num(item.subtotal),
          service: item.service ? { ...item.service, price: num(item.service.price) } : undefined,
        }))
      : [],
    payments: Array.isArray(order.payments)
      ? order.payments.map((payment) => ({ ...payment, amount: num(payment.amount) }))
      : [],
  };
}

// ---------- Layanan ----------
export async function getActiveServices(): Promise<LaundryService[]> {
  const response = await api.get<Envelope<LaundryService[]>>("/services/active");
  return response.data.data.map((service) => ({ ...service, price: num(service.price) }));
}

// ---------- Order ----------
export async function getMyOrders(): Promise<Order[]> {
  const response = await api.get<Envelope<Order[]>>("/orders/my");
  return Array.isArray(response.data.data) ? response.data.data.map(normalizeOrder) : [];
}

export async function getMyOrder(id: string): Promise<Order> {
  const response = await api.get<Envelope<Order>>(`/orders/${id}`);
  return normalizeOrder(response.data.data);
}

export async function createMyOrder(payload: CustomerOrderInput): Promise<Order> {
  const response = await api.post<Envelope<Order>>("/orders", payload);
  return normalizeOrder(response.data.data);
}

// ---------- Pembayaran (Midtrans) ----------
export async function startMidtransPayment(orderId: string): Promise<MidtransSnapResult> {
  const response = await api.post<Envelope<MidtransSnapResult>>("/payment/midtrans/snap", { orderId });
  return response.data.data;
}

export async function syncMidtransPayment(orderId: string): Promise<{ order: Order; payments: OrderPayment[] }> {
  const response = await api.post<Envelope<{ order: Order; payments: OrderPayment[] }>>("/payment/midtrans/sync", { orderId });
  return { ...response.data.data, order: normalizeOrder(response.data.data.order) };
}

// ---------- Notifikasi ----------
export async function getNotifications(): Promise<NotificationItem[]> {
  const response = await api.get<Envelope<NotificationItem[]>>("/notifications");
  return response.data.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}

export function apiErrorMessage(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  const e = error as { response?: { data?: { message?: string } }; message?: string; code?: string };
  if (e.response?.data?.message) return e.response.data.message;
  if (!e.response && (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED")) {
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  }
  return e.message ?? fallback;
}

/** Kode error terstruktur dari backend (mis. CLAIM_CODE_REQUIRED saat pendaftaran pelanggan lama). */
export function apiErrorCode(error: unknown): string | undefined {
  return (error as { response?: { data?: { code?: string } } }).response?.data?.code;
}
