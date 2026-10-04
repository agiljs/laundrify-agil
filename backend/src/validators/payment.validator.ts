import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),

  method: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "OTHER"]),

  amount: z.number().positive(),
  cashReceived: z.number().positive().optional(),

  transactionCode: z.string().max(150).optional(),

  note: z.string().max(1000).optional(),
});
