import type { Request, Response } from "express";
import { createDeliverySchema, assignCourierSchema, updateDeliveryStatusSchema } from "../validators/delivery.validator.js";
import { assignCourier, changeDeliveryStatus, createNewDelivery, getDeliveries, getDeliveryById } from "../services/delivery.service.js";
import { getParamId } from "../utils/request.js";

export async function getDeliveriesController(_req: Request, res: Response) {
  res.json({ success: true, data: await getDeliveries() });
}

export async function getDeliveryByIdController(req: Request, res: Response) {
  res.json({ success: true, data: await getDeliveryById(getParamId(req.params)) });
}

export async function createDeliveryController(req: Request, res: Response) {
  const data = createDeliverySchema.parse(req.body);
  res.status(201).json({ success: true, message: "Delivery berhasil dibuat", data: await createNewDelivery(data) });
}

export async function assignCourierController(req: Request, res: Response) {
  const data = assignCourierSchema.parse(req.body);
  res.json({ success: true, message: "Courier berhasil ditugaskan", data: await assignCourier(getParamId(req.params), data, req.user!.id) });
}

export async function updateDeliveryStatusController(req: Request, res: Response) {
  const data = updateDeliveryStatusSchema.parse(req.body);
  res.json({ success: true, message: "Status delivery berhasil diperbarui", data: await changeDeliveryStatus(getParamId(req.params), data.status, req.user!.id) });
}
