import { z } from "zod";

export const createDeliverySchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(["PICKUP", "DELIVERY"]),
  recipientName: z.string().min(2).max(150).optional(),
  recipientPhone: z.string().min(5).max(30).optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const assignCourierSchema = z.object({
  courierName: z.string().min(2).max(150).optional(),
  courierPhone: z.string().min(5).max(30).optional(),
  vehicleType: z.string().max(50).optional(),
  vehicleNumber: z.string().max(30).optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(["REQUESTED", "ASSIGNED", "ON_THE_WAY", "PICKED_UP", "DELIVERING", "DELIVERED", "CANCELLED"]),
});
