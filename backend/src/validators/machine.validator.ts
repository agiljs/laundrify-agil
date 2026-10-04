import { z } from "zod";

export const createMachineSchema = z.object({
  machineCode: z.string().min(2).max(50),

  name: z.string().min(2).max(150),

  type: z.string().min(2).max(100),

  brand: z.string().max(100).optional(),

  model: z.string().max(100).optional(),

  serialNumber: z.string().max(100).optional(),

  purchaseDate: z.string().datetime().optional(),

  purchasePrice: z.number().nonnegative().optional(),

  status: z
    .enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "BROKEN"])
    .default("ACTIVE"),

  location: z.string().max(150).optional(),

  lastMaintenanceAt: z.string().datetime().optional(),

  nextMaintenanceAt: z.string().datetime().optional(),

  maintenanceCost: z.number().nonnegative().optional(),

  maintenanceNotes: z.string().max(2000).optional(),

  maintenanceHistory: z.unknown().optional(),
});

export const updateMachineSchema = z.object({
  machineCode: z.string().min(2).max(50).optional(),

  name: z.string().min(2).max(150).optional(),

  type: z.string().min(2).max(100).optional(),

  brand: z.string().max(100).optional(),

  model: z.string().max(100).optional(),

  serialNumber: z.string().max(100).optional(),

  purchaseDate: z.string().datetime().optional(),

  purchasePrice: z.number().nonnegative().optional(),

  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "BROKEN"]).optional(),

  location: z.string().max(150).optional(),

  lastMaintenanceAt: z.string().datetime().optional(),

  nextMaintenanceAt: z.string().datetime().optional(),

  maintenanceCost: z.number().nonnegative().optional(),

  maintenanceNotes: z.string().max(2000).optional(),

  maintenanceHistory: z.unknown().optional(),
});
