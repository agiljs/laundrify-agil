import { prisma } from "../lib/prisma.js";

export async function findPaymentsByOrderId(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    include: { receivedBy: { select: { id: true, name: true, role: true } } },
    orderBy: { paidAt: "asc" },
  });
}

export async function createPayment(data: {
  orderId: string;
  receivedById?: string;
  method: "CASH" | "BANK_TRANSFER" | "QRIS" | "OTHER";
  amount: number;
  cashReceived?: number;
  changeAmount?: number;
  transactionCode?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  paidAt: Date;
  note?: string;
}) {
  return prisma.payment.create({
    data,
    include: { receivedBy: { select: { id: true, name: true, role: true } } },
  });
}
