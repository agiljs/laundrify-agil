import api from "./api";
import type { CreatePaymentPayload, Payment } from "../types/payment";
import type { Order } from "../types/order";

type ApiEnvelope<T> = { data: T; message?: string };

type CreatePaymentResult = { payment: Payment; order: Order };

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

function normalizePayment(payment: Payment): Payment {
  return {
    ...payment,
    amount: normalizeNumber(payment.amount),
    cashReceived: payment.cashReceived == null ? null : normalizeNumber(payment.cashReceived),
    changeAmount: payment.changeAmount == null ? null : normalizeNumber(payment.changeAmount),
  };
}

export async function getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
  const response = await api.get<Payment[] | ApiEnvelope<Payment[]>>(`/payment/order/${orderId}`);
  const data = unwrapData(response.data);
  return Array.isArray(data) ? data.map(normalizePayment) : [];
}

export async function createPayment(payload: CreatePaymentPayload): Promise<CreatePaymentResult> {
  const response = await api.post<CreatePaymentResult | ApiEnvelope<CreatePaymentResult>>("/payment", payload);
  const data = unwrapData(response.data);
  return {
    ...data,
    payment: normalizePayment(data.payment),
  };
}
