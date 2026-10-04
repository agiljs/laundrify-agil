import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createOrderSchema, updateOrderSchema, updateOrderStatusSchema } from "../validators/order.validator.js";
import { createNewOrder, getCustomerOrders, getOrderById, getOrders, changeOrderStatus, updateExistingOrder, removeOrder } from "../services/order.service.js";
import { getParamId } from "../utils/request.js";

export async function getOrdersController(_req: Request, res: Response) {
  res.json({ success: true, data: await getOrders() });
}

export async function getMyOrdersController(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id } });

  if (!customer) return res.status(404).json({ success: false, message: "Profil customer tidak ditemukan" });
  res.json({ success: true, data: await getCustomerOrders(customer.id) });
}

export async function getOrderByIdController(req: Request, res: Response) {
  const id = getParamId(req.params);
  const customerId = req.user?.role === "CUSTOMER"
    ? (await prisma.customer.findUnique({ where: { userId: req.user!.id }, select: { id: true } }))?.id
    : undefined;

  const order = await getOrderById(id, customerId);
  res.json({ success: true, data: order });
}

export async function createOrderController(req: Request, res: Response) {
  const data = createOrderSchema.parse(req.body);
  let customerId = data.customerId;

  if (req.user?.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
    if (!customer) return res.status(404).json({ success: false, message: "Profil customer tidak ditemukan" });
    customerId = customer.id;
  }

  const order = await createNewOrder(data, req.user!.id, customerId);
  res.status(201).json({ success: true, message: "Order berhasil dibuat", data: order });
}

export async function updateOrderStatusController(req: Request, res: Response) {
  const id = getParamId(req.params);
  const data = updateOrderStatusSchema.parse(req.body);
  const order = await changeOrderStatus(id, data.status, req.user!.id, data.note);
  res.json({ success: true, message: "Status order berhasil diperbarui", data: order });
}


export async function updateOrderController(req: Request, res: Response) {
  const id = getParamId(req.params);
  const data = updateOrderSchema.parse(req.body);
  const order = await updateExistingOrder(id, data);
  res.json({ success: true, message: "Order berhasil diperbarui", data: order });
}

export async function deleteOrderController(req: Request, res: Response) {
  const id = getParamId(req.params);
  await removeOrder(id);
  res.json({ success: true, message: "Order berhasil dihapus" });
}
