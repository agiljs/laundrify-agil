import type { Prisma } from "../generated/prisma/client.js";

import {
  findMachines,
  findMachineById,
  findMachineByCode,
  createMachine,
  updateMachine,
} from "../repositories/machine.repository.js";

function normalizeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    throw new Error("maintenanceHistory tidak valid");
  }
}

export async function getMachines() {
  return findMachines();
}

export async function getMachineById(id: string) {
  const machine = await findMachineById(id);

  if (!machine) {
    throw new Error("Machine tidak ditemukan");
  }

  return machine;
}

export async function createNewMachine(data: {
  machineCode: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status?: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "BROKEN";
  location?: string;
  lastMaintenanceAt?: string;
  nextMaintenanceAt?: string;
  maintenanceCost?: number;
  maintenanceNotes?: string;
  maintenanceHistory?: unknown;
}) {
  const machineCode = data.machineCode.trim().toUpperCase();

  const existing = await findMachineByCode(machineCode);

  if (existing) {
    throw new Error("Machine code sudah digunakan");
  }

  return createMachine({
    machineCode,
    name: data.name.trim(),
    type: data.type.trim(),
    brand: data.brand?.trim(),
    model: data.model?.trim(),
    serialNumber: data.serialNumber?.trim(),

    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,

    purchasePrice: data.purchasePrice,

    status: data.status ?? "ACTIVE",

    location: data.location?.trim(),

    lastMaintenanceAt: data.lastMaintenanceAt
      ? new Date(data.lastMaintenanceAt)
      : undefined,

    nextMaintenanceAt: data.nextMaintenanceAt
      ? new Date(data.nextMaintenanceAt)
      : undefined,

    maintenanceCost: data.maintenanceCost,

    maintenanceNotes: data.maintenanceNotes?.trim(),

    maintenanceHistory: normalizeJson(data.maintenanceHistory),
  });
}

export async function updateMachineById(
  id: string,
  data: {
    machineCode?: string;
    name?: string;
    type?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    status?: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "BROKEN";
    location?: string;
    lastMaintenanceAt?: string;
    nextMaintenanceAt?: string;
    maintenanceCost?: number;
    maintenanceNotes?: string;
    maintenanceHistory?: unknown;
  },
) {
  const machine = await findMachineById(id);

  if (!machine) {
    throw new Error("Machine tidak ditemukan");
  }

  let machineCode: string | undefined;

  if (data.machineCode) {
    machineCode = data.machineCode.trim().toUpperCase();

    if (machineCode !== machine.machineCode) {
      const existing = await findMachineByCode(machineCode);

      if (existing) {
        throw new Error("Machine code sudah digunakan");
      }
    }
  }

  return updateMachine(id, {
    machineCode,
    name: data.name?.trim(),
    type: data.type?.trim(),
    brand: data.brand?.trim(),
    model: data.model?.trim(),
    serialNumber: data.serialNumber?.trim(),

    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,

    purchasePrice: data.purchasePrice,

    status: data.status,

    location: data.location?.trim(),

    lastMaintenanceAt: data.lastMaintenanceAt
      ? new Date(data.lastMaintenanceAt)
      : undefined,

    nextMaintenanceAt: data.nextMaintenanceAt
      ? new Date(data.nextMaintenanceAt)
      : undefined,

    maintenanceCost: data.maintenanceCost,

    maintenanceNotes: data.maintenanceNotes?.trim(),

    maintenanceHistory: normalizeJson(data.maintenanceHistory),
  });
}
