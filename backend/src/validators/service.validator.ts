import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  unit: z.string().min(1).max(30),
  price: z.number().positive(),
  inventoryUsage: z.record(z.string(), z.unknown()).optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional(),
  unit: z.string().min(1).max(30).optional(),
  price: z.number().positive().optional(),
  inventoryUsage: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
