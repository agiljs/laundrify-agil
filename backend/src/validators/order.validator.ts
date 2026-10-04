import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),

  items: z
    .array(
      z.object({
        serviceId: z.string().uuid(),

        quantity: z.number().positive(),
      }),
    )
    .min(1),

  deliveryFee: z.number().min(0).default(0),

  dueAt: z.string().datetime().optional(),

  note: z.string().max(1000).optional(),
});


export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "RECEIVED",
    "WASHING",
    "DRYING",
    "IRONING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().max(1000).optional(),
});


export const updateOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({ serviceId: z.string().uuid(), quantity: z.number().positive() })).min(1),
  deliveryFee: z.number().min(0).default(0),
  dueAt: z.string().datetime().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});
