import { prisma } from "../lib/prisma.js";
import { findPaymentsByOrderId } from "../repositories/payment.repository.js";
import { awardPointsForPaidOrder } from "./membership.service.js";
import { notifyCustomer, notifyRole } from "./notification.service.js";
import { emitOrderEvent, emitPaymentUpdated } from "../websocket/events.js";

async function ensureOrderAccess(orderId: string, customerId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order tidak ditemukan");
  if (customerId && order.customerId !== customerId)
    throw new Error("Anda tidak memiliki akses ke order ini");
  return order;
}

export async function getPaymentsByOrderId(
  orderId: string,
  customerId?: string,
) {
  await ensureOrderAccess(orderId, customerId);
  return findPaymentsByOrderId(orderId);
}

export async function createNewPayment(data: {
  orderId: string;
  receivedById?: string;
  method: "CASH" | "BANK_TRANSFER" | "QRIS" | "OTHER";
  amount: number;
  cashReceived?: number;
  transactionCode?: string;
  note?: string;
}) {
  const order = await ensureOrderAccess(data.orderId);
  if (order.status === "CANCELLED")
    throw new Error("Order yang dibatalkan tidak dapat menerima pembayaran");
  if (order.paymentStatus === "PAID") throw new Error("Order sudah lunas");

  const aggregate = await prisma.payment.aggregate({
    where: { orderId: data.orderId, status: "SUCCESS" },
    _sum: { amount: true },
  });

  const totalPaid = Number(aggregate._sum.amount ?? 0);
  const orderTotal = Number(order.total);
  const remainingAmount = Math.max(0, orderTotal - totalPaid);

  if (data.amount > remainingAmount) {
    throw new Error(
      `Jumlah pembayaran melebihi sisa tagihan. Sisa tagihan: ${remainingAmount}`,
    );
  }

  if (data.method === "CASH") {
    if (data.cashReceived === undefined)
      throw new Error("Jumlah uang diterima wajib diisi untuk pembayaran cash");
    if (data.cashReceived < data.amount)
      throw new Error(
        "Uang diterima tidak boleh kurang dari jumlah pembayaran",
      );
  }

  const cashReceived = data.method === "CASH" ? data.cashReceived : undefined;
  const changeAmount =
    data.method === "CASH" && cashReceived !== undefined
      ? Math.max(0, cashReceived - data.amount)
      : undefined;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId: data.orderId,
        receivedById: data.receivedById,
        method: data.method,
        amount: data.amount,
        cashReceived,
        changeAmount,
        transactionCode: data.transactionCode,
        status: "SUCCESS",
        paidAt: new Date(),
        note: data.note,
      },
      include: {
        receivedBy: { select: { id: true, name: true, role: true } },
      },
    });

    const newTotalPaid = totalPaid + data.amount;
    const paymentStatus: "UNPAID" | "PARTIAL" | "PAID" =
      newTotalPaid === orderTotal
        ? "PAID"
        : newTotalPaid > 0
          ? "PARTIAL"
          : "UNPAID";

    const updatedOrder = await tx.order.update({
      where: { id: data.orderId },
      data: { paymentStatus },
    });

    const membership =
      paymentStatus === "PAID" && order.paymentStatus !== "PAID"
        ? await awardPointsForPaidOrder(
            tx,
            data.orderId,
            order.customerId,
            newTotalPaid,
          )
        : null;

    return { payment, order: updatedOrder, membership };
  });

  await notifyRole({
    role: "ADMIN",
    title: "Pembayaran diterima",
    message: `Pembayaran untuk order ${order.orderCode} sebesar Rp ${data.amount.toLocaleString("id-ID")} berhasil.`,
    type: "SUCCESS",
    excludeUserId: data.receivedById,
  });

  emitPaymentUpdated({
    orderId: result.order.id,
    orderCode: result.order.orderCode,
    customerId: result.order.customerId,
    paymentId: result.payment.id,
    paymentTransactionStatus: result.payment.status,
    orderPaymentStatus: result.order.paymentStatus,
  });
  emitOrderEvent("updated", result.order);

  await notifyCustomer({
    customerId: result.order.customerId,
    title: "Pembayaran diterima",
    message: `Pembayaran Rp ${data.amount.toLocaleString("id-ID")} untuk order ${order.orderCode} sudah dicatat.`,
    type: "SUCCESS",
  });

  return result;
}
