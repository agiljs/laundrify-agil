import type { OrderStatus, PaymentStatus } from "../types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Diterima",
  WASHING: "Dicuci",
  DRYING: "Dikeringkan",
  IRONING: "Disetrika",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  RECEIVED: "bg-slate-100 text-slate-700",
  WASHING: "bg-blue-50 text-blue-700",
  DRYING: "bg-sky-50 text-sky-700",
  IRONING: "bg-indigo-50 text-indigo-700",
  READY: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Belum Dibayar",
  PARTIAL: "Dibayar Sebagian",
  PAID: "Lunas",
  REFUNDED: "Dikembalikan",
};

export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  UNPAID: "bg-amber-50 text-amber-700",
  PARTIAL: "bg-orange-50 text-orange-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REFUNDED: "bg-slate-100 text-slate-600",
};

/** Urutan tahap proses laundry untuk timeline. */
export const ORDER_FLOW: OrderStatus[] = ["RECEIVED", "WASHING", "DRYING", "IRONING", "READY", "COMPLETED"];

export const ACTIVE_STATUSES: OrderStatus[] = ["RECEIVED", "WASHING", "DRYING", "IRONING", "READY"];

export function canPay(order: { status: OrderStatus; paymentStatus: PaymentStatus }) {
  return order.status !== "CANCELLED" && (order.paymentStatus === "UNPAID" || order.paymentStatus === "PARTIAL");
}
