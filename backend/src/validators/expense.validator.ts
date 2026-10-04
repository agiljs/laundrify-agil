import { z } from "zod";

export const createExpenseSchema = z.object({
  category: z.enum([
    "ELECTRICITY",
    "WATER",
    "DETERGENT",
    "SUPPLIES",
    "MACHINE_MAINTENANCE",
    "DELIVERY",
    "RENT",
    "SALARY",
    "OTHER",
  ]),

  description: z.string().min(2).max(255),

  amount: z.number().positive(),

  expenseDate: z.string().datetime(),
});

export const updateExpenseSchema = z.object({
  category: z
    .enum([
      "ELECTRICITY",
      "WATER",
      "DETERGENT",
      "SUPPLIES",
      "MACHINE_MAINTENANCE",
      "DELIVERY",
      "RENT",
      "SALARY",
      "OTHER",
    ])
    .optional(),

  description: z.string().min(2).max(255).optional(),

  amount: z.number().positive().optional(),

  expenseDate: z.string().datetime().optional(),
});
