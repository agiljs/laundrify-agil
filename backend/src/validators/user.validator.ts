import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  password: z.string().min(8).max(100),
  phone: z.string().min(5).max(30).optional(),
  role: z.enum(["STAFF", "CUSTOMER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  phone: z.string().min(5).max(30).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const changeUserPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});
