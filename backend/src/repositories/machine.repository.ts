import { prisma } from "../lib/prisma.js";
import type { MachineStatus, Prisma } from "../generated/prisma/client.js";

export async function findMachines() {
  return prisma.machine.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findMachineById(id: string) {
  return prisma.machine.findUnique({
    where: {
      id,
    },
  });
}

export async function findMachineByCode(machineCode: string) {
  return prisma.machine.findUnique({
    where: {
      machineCode,
    },
  });
}

export async function createMachine(data: {
  machineCode: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  status: MachineStatus;
  location?: string;
  lastMaintenanceAt?: Date;
  nextMaintenanceAt?: Date;
  maintenanceCost?: number;
  maintenanceNotes?: string;
  maintenanceHistory?: Prisma.InputJsonValue;
}) {
  return prisma.machine.create({
    data,
  });
}

export async function updateMachine(
  id: string,
  data: {
    machineCode?: string;
    name?: string;
    type?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: Date;
    purchasePrice?: number;
    status?: MachineStatus;
    location?: string;
    lastMaintenanceAt?: Date;
    nextMaintenanceAt?: Date;
    maintenanceCost?: number;
    maintenanceNotes?: string;
    maintenanceHistory?: Prisma.InputJsonValue;
  },
) {
  return prisma.machine.update({
    where: {
      id,
    },
    data,
  });
}
