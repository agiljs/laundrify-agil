import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  applyMidtransStatus,
  createMidtransSnapPayment,
  syncPendingMidtransPayments,
} from "../services/midtrans-payment.service.js";
import { isValidMidtransSignature, type MidtransStatusPayload } from "../services/midtrans.service.js";
import { getOrderById } from "../services/order.service.js";

const orderIdSchema = z.object({ orderId: z.string().uuid() });

async function requireCustomerId(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { userId: req.user!.id },
    select: { id: true },
  });

  if (!customer) {
    res.status(404).json({ success: false, message: "Profil customer tidak ditemukan" });
    return null;
  }

  return customer.id;
}

/** Customer meminta token Snap untuk membayar sisa tagihan order miliknya. */
export async function createSnapPaymentController(req: Request, res: Response) {
  const { orderId } = orderIdSchema.parse(req.body);
  const customerId = await requireCustomerId(req, res);
  if (!customerId) return;

  const data = await createMidtransSnapPayment(orderId, customerId);
  res.status(201).json({ success: true, message: "Transaksi pembayaran dibuat", data });
}

/** Customer menyinkronkan status transaksi pending (mis. setelah menutup popup Snap). */
export async function syncMidtransPaymentController(req: Request, res: Response) {
  const { orderId } = orderIdSchema.parse(req.body);
  const customerId = await requireCustomerId(req, res);
  if (!customerId) return;

  const payments = await syncPendingMidtransPayments(orderId, customerId);
  const order = await getOrderById(orderId, customerId);
  res.json({ success: true, data: { order, payments } });
}

/**
 * Webhook Midtrans (HTTP Notification). Tanpa JWT karena dipanggil server Midtrans;
 * keabsahan dijamin oleh signature SHA512 yang dihitung dengan server key.
 */
export async function midtransNotificationController(req: Request, res: Response) {
  const payload = req.body as Partial<MidtransStatusPayload>;

  if (!isValidMidtransSignature(payload)) {
    return res.status(403).json({ success: false, message: "Signature tidak valid" });
  }

  const result = await applyMidtransStatus(payload as MidtransStatusPayload);
  res.status(200).json({ success: true, data: { handled: result.handled } });
}
