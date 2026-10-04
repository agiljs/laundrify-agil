import { api } from "./api";
import type { Order, PaymentRecord } from "../types/api";

export type PaymentInput = {
  orderId: string;
  method: "CASH" | "QRIS" | "BANK_TRANSFER";
  amount: number;
  cashReceived?: number;
  transactionCode?: string;
  note?: string;
};

export async function createPayment(payload: PaymentInput) {
  const response = await api.post<{ data: { payment: PaymentRecord; order: Order } }>("/payment", payload);
  return response.data.data;
}

export async function getPaymentsByOrder(orderId: string) {
  const response = await api.get<{ data: PaymentRecord[] }>(`/payment/order/${orderId}`);
  return response.data.data;
}
