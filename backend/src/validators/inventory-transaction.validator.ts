import { z } from "zod";

export const createInventoryTransactionSchema = z.object({
  inventoryItemId: z.string().uuid(),

  type: z.enum(["PURCHASE", "USAGE", "ADJUSTMENT", "RETURN"]),

  quantity: z.number().positive(),

  supplierName: z.string().max(150).optional(),

  purchasePrice: z.number().min(0).optional(),

  purchaseReference: z.string().max(150).optional(),

  note: z.string().max(1000).optional(),
});
