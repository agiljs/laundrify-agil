import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createNewPayment, getPaymentsByOrderId } from "../services/payment.service.js";
import { createPaymentSchema } from "../validators/payment.validator.js";

async function getCustomerId(userId: string) {
  return (await prisma.customer.findUnique({ where: { userId }, select: { id: true } }))?.id;
}

export async function getPaymentsByOrderIdController(req: Request, res: Response) {
  const customerId = req.user?.role === "CUSTOMER" ? await getCustomerId(req.user.id) : undefined;
  if (req.user?.role === "CUSTOMER" && !customerId) return res.status(404).json({ success: false, message: "Profil customer tidak ditemukan" });

  const payments = await getPaymentsByOrderId(req.params.orderId as string, customerId);
  res.json({ success: true, data: payments });
}

export async function createPaymentController(req: Request, res: Response) {
  const data = createPaymentSchema.parse(req.body);
  const customerId = req.user?.role === "CUSTOMER" ? await getCustomerId(req.user.id) : undefined;

  if (req.user?.role === "CUSTOMER" && !customerId) {
    return res.status(404).json({ success: false, message: "Profil customer tidak ditemukan" });
  }

  if (customerId) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId }, select: { customerId: true } });
    if (!order || order.customerId !== customerId) return res.status(403).json({ success: false, message: "Anda tidak memiliki akses ke order ini" });
  }

  const result = await createNewPayment({
    ...data,
    receivedById: req.user!.role === "ADMIN" ? req.user!.id : undefined,
  });
  res.status(201).json({ success: true, message: "Pembayaran berhasil dibuat", data: result });
}
