import { z } from "zod";

export const createInventoryItemSchema = z.object({
  sku: z.string().min(2).max(50),

  name: z.string().min(2).max(150),

  category: z.string().min(2).max(100),

  unit: z.string().min(1).max(30),

  currentStock: z.number().min(0).default(0),

  minimumStock: z.number().min(0).default(0),

  maximumStock: z.number().min(0).optional(),

  costPrice: z.number().min(0),

  supplierName: z.string().max(150).optional(),

  supplierPhone: z.string().max(30).optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(2).max(150).optional(),

  category: z.string().min(2).max(100).optional(),

  unit: z.string().min(1).max(30).optional(),

  minimumStock: z.number().min(0).optional(),

  maximumStock: z.number().min(0).optional(),

  costPrice: z.number().min(0).optional(),

  supplierName: z.string().max(150).optional(),

  supplierPhone: z.string().max(30).optional(),

  isActive: z.boolean().optional(),
});
