import { prisma } from "../lib/prisma.js";
import type { PaymentMethod, PaymentStatus, PaymentTransactionStatus } from "../generated/prisma/client.js";
import {
  assertMidtransConfigured,
  cancelMidtransTransaction,
  createSnapTransaction,
  getMidtransClientConfig,
  getMidtransStatus,
  type MidtransStatusPayload,
} from "./midtrans.service.js";
import { awardPointsForPaidOrder } from "./membership.service.js";
import { notifyCustomer, notifyRole } from "./notification.service.js";
import { findPaymentsByOrderId } from "../repositories/payment.repository.js";
import { emitOrderEvent, emitPaymentUpdated } from "../websocket/events.js";
import { randomUUID } from "node:crypto";

/** Semua transaksi Midtrans memakai prefix ini pada kolom transactionCode. */
const MIDTRANS_PREFIX = "MT-";

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

async function getOrderForCustomer(orderId: string, customerId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { id: true, name: true, email: true, phone: true, userId: true } } },
  });

  if (!order) throw new Error("Order tidak ditemukan");
  if (customerId && order.customerId !== customerId) {
    throw new Error("Anda tidak memiliki akses ke order ini");
  }

  return order;
}

async function sumSuccessfulPayments(orderId: string) {
  const aggregate = await prisma.payment.aggregate({
    where: { orderId, status: "SUCCESS" },
    _sum: { amount: true },
  });
  return Number(aggregate._sum.amount ?? 0);
}

function mapTransactionStatus(payload: MidtransStatusPayload): PaymentTransactionStatus | null {
  const status = payload.transaction_status;
  const fraud = payload.fraud_status;

  switch (status) {
    case "capture":
      return fraud === "accept" || !fraud ? "SUCCESS" : "PENDING";
    case "settlement":
      return "SUCCESS";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
    case "expire":
    case "failure":
      return "FAILED";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "REFUNDED";
    default:
      return null;
  }
}

function mapPaymentMethod(paymentType?: string): PaymentMethod {
  switch (paymentType) {
    case "qris":
    case "gopay":
    case "shopeepay":
      return "QRIS";
    case "bank_transfer":
    case "echannel":
    case "bca_klikpay":
    case "bca_klikbca":
    case "cimb_clicks":
    case "danamon_online":
      return "BANK_TRANSFER";
    default:
      return "OTHER";
  }
}

/** Buat transaksi Snap untuk sisa tagihan sebuah order. */
export async function createMidtransSnapPayment(orderId: string, customerId?: string) {
  // Konfigurasi salah? Gagal lebih awal dengan pesan jelas, sebelum menyentuh database.
  assertMidtransConfigured();

  // Cek dulu apakah percobaan sebelumnya sebenarnya sudah dibayar (mencegah bayar ganda).
  await syncPendingMidtransPayments(orderId, customerId);

  const order = await getOrderForCustomer(orderId, customerId);

  if (order.status === "CANCELLED") {
    throw new Error("Order yang dibatalkan tidak dapat dibayar");
  }
  if (order.paymentStatus === "PAID") throw new Error("Order sudah lunas");

  const alreadyPaid = await sumSuccessfulPayments(orderId);
  const remaining = Number(order.total) - alreadyPaid;
  if (remaining <= 0) throw new Error("Order sudah lunas");

  // Midtrans (IDR) hanya menerima nominal bulat.
  const amount = Math.ceil(remaining);

  // Transaksi pending lama digantikan oleh yang baru.
  const stale = await prisma.payment.findMany({
    where: { orderId, status: "PENDING", transactionCode: { startsWith: MIDTRANS_PREFIX } },
    select: { id: true, transactionCode: true },
  });

  for (const old of stale) {
    if (old.transactionCode) await cancelMidtransTransaction(old.transactionCode);
  }
  if (stale.length > 0) {
    await prisma.payment.updateMany({
      where: { id: { in: stale.map((item) => item.id) } },
      data: { status: "FAILED", note: "Midtrans: digantikan transaksi baru" },
    });
  }

  const transactionCode = `${MIDTRANS_PREFIX}${order.orderCode}-${randomUUID().slice(0, 6).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      orderId,
      method: "OTHER",
      amount,
      transactionCode,
      status: "PENDING",
      note: "Midtrans Snap",
    },
  });

  // Setelah bayar, Midtrans mengembalikan customer ke halaman detail order di aplikasi customer.
  const customerUrl = (process.env.CUSTOMER_URL ?? process.env.FRONTEND_URL)?.trim().replace(/\/$/, "");

  try {
    const snap = await createSnapTransaction({
      orderId: transactionCode,
      grossAmount: amount,
      itemName: `Laundry ${order.orderCode}`,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      finishUrl: customerUrl ? `${customerUrl}/orders/${order.id}` : undefined,
    });

    return {
      paymentId: payment.id,
      transactionCode,
      amount,
      token: snap.token,
      redirectUrl: snap.redirect_url,
      ...getMidtransClientConfig(),
    };
  } catch (error) {
    // Transaksi tidak pernah terbentuk di Midtrans -> hapus catatan sementara agar riwayat pembayaran
    // customer tidak dipenuhi entri "Gagal" yang bukan karena dirinya.
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => undefined);
    throw error;
  }
}

/** Terapkan status dari Midtrans (webhook maupun sinkronisasi manual) ke database. */
export async function applyMidtransStatus(payload: MidtransStatusPayload) {
  if (payload.status_code === "404") return { handled: false, changed: false };

  const payment = await prisma.payment.findFirst({
    where: { transactionCode: payload.order_id },
    include: {
      order: {
        select: {
          id: true,
          orderCode: true,
          customerId: true,
          status: true,
          paymentStatus: true,
          total: true,
        },
      },
    },
  });

  if (!payment) return { handled: false, changed: false };

  const next = mapTransactionStatus(payload);
  if (!next || payment.status === next) {
    return { handled: true, changed: false, orderId: payment.orderId };
  }

  // Pembayaran yang sudah sukses tidak boleh "turun" kecuali refund.
  if (payment.status === "SUCCESS" && next !== "REFUNDED") {
    return { handled: true, changed: false, orderId: payment.orderId };
  }

  if (next === "SUCCESS" && Number(payload.gross_amount) !== Number(payment.amount)) {
    throw new Error("Nominal pembayaran dari Midtrans tidak sesuai dengan tagihan");
  }

  const previousOrderPaymentStatus = payment.order.paymentStatus;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: next,
        method: mapPaymentMethod(payload.payment_type),
        paidAt: next === "SUCCESS" ? new Date() : undefined,
        note: `Midtrans${payload.payment_type ? ` (${payload.payment_type})` : ""}`,
      },
    });

    const aggregate = await tx.payment.aggregate({
      where: { orderId: payment.orderId, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const paid = Number(aggregate._sum.amount ?? 0);
    const total = Number(payment.order.total);

    let paymentStatus: PaymentStatus = paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
    if (next === "REFUNDED" && paid <= 0) paymentStatus = "REFUNDED";

    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus },
      select: { id: true, orderCode: true, customerId: true, status: true, paymentStatus: true },
    });

    if (paymentStatus === "PAID" && previousOrderPaymentStatus !== "PAID") {
      await awardPointsForPaidOrder(tx, payment.orderId, payment.order.customerId, paid);
    }

    return order;
  });

  // --- efek samping setelah commit: realtime + notifikasi ---
  emitPaymentUpdated({
    orderId: updatedOrder.id,
    orderCode: updatedOrder.orderCode,
    customerId: updatedOrder.customerId,
    paymentId: payment.id,
    paymentTransactionStatus: next,
    orderPaymentStatus: updatedOrder.paymentStatus,
  });
  emitOrderEvent("updated", updatedOrder);

  const amountText = formatRupiah(Number(payment.amount));

  if (next === "SUCCESS") {
    await notifyCustomer({
      customerId: updatedOrder.customerId,
      title: "Pembayaran berhasil",
      message: `Pembayaran ${amountText} untuk order ${updatedOrder.orderCode} sudah kami terima.`,
      type: "SUCCESS",
    });
    await notifyRole({
      role: "ADMIN",
      title: "Pembayaran online diterima",
      message: `Order ${updatedOrder.orderCode} dibayar ${amountText} via Midtrans.`,
      type: "SUCCESS",
    });
  } else if (next === "FAILED") {
    await notifyCustomer({
      customerId: updatedOrder.customerId,
      title: "Pembayaran tidak berhasil",
      message: `Pembayaran untuk order ${updatedOrder.orderCode} gagal atau kedaluwarsa. Silakan coba lagi.`,
      type: "WARNING",
    });
  }

  return { handled: true, changed: true, orderId: updatedOrder.id };
}

/** Tanya status ke Midtrans untuk semua transaksi pending milik sebuah order. */
export async function syncPendingMidtransPayments(orderId: string, customerId?: string) {
  await getOrderForCustomer(orderId, customerId);

  const pending = await prisma.payment.findMany({
    where: { orderId, status: "PENDING", transactionCode: { startsWith: MIDTRANS_PREFIX } },
    select: { transactionCode: true },
  });

  for (const item of pending) {
    if (!item.transactionCode) continue;
    try {
      const status = await getMidtransStatus(item.transactionCode);
      await applyMidtransStatus(status);
    } catch (error) {
      // Midtrans belum mengenal transaksi / jaringan bermasalah -> lewati, jangan gagalkan request
      console.warn(`Sinkronisasi Midtrans ${item.transactionCode} dilewati:`, (error as Error).message);
    }
  }

  return findPaymentsByOrderId(orderId);
}
