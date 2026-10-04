export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QRIS" | "OTHER";
export type PaymentTransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type Payment = {
  id: string;
  orderId: string;
  receivedById?: string;
  method: PaymentMethod;
  amount: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
  transactionCode?: string | null;
  status: PaymentTransactionStatus;
  paidAt: string;
  createdAt: string;
  note?: string | null;
  receivedBy?: { id: string; name: string; role: string } | null;
};

export type CreatePaymentPayload = {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  transactionCode?: string;
  note?: string;
};
