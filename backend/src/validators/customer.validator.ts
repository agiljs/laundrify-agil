import { email, z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().min(5).max(30),
  email: z.string().email().max(150).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  phone: z.string().min(5).max(30).optional(),
  email: z.string().email().max(150).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});
