import { z } from "zod";

export const dashboardPeriodSchema = z.object({
  startDate: z.string().datetime().optional(),

  endDate: z.string().datetime().optional(),
});

export const dashboardLimitSchema = z.object({
  limit: z
    .string()
    .optional()
    .default("5")
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1).max(10)),
});
