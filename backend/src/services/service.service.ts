import {
  createService,
  findActiveServices,
  findServiceById,
  findServiceByName,
  findServices,
  // updateService,
} from "../repositories/service.repository.js";

export async function getServices() {
  return findServices();
}

export async function getActiveServices() {
  return findActiveServices();
}

export async function getServiceById(id: string) {
  const service = await findServiceById(id);

  if (!service) {
    throw new Error("Service tidak ditemukan");
  }

  return service;
}

export async function createNewService(data: {
  name: string;
  description?: string;
  unit: string;
  price: number;
  inventoryUsage?: object;
}) {
  const existingService = await findServiceByName(data.name);

  if (existingService) {
    throw new Error("Service dengan nama tersebut sudah ada");
  }

  return createService(data);
}

// export async function updateExistingService(
//   id: string,
//   data: {
//     name?: string;
//     description?: string;
//     unit?: string;
//     price?: number;
//     inventoryUsage?: object;
//     isActive?: boolean;
//   },
// ) {
//   const service = await findServiceById(id);

//   if (!service) {
//     throw new Error("Service tidak ditemukan");
//   }

//   if (data.name && data.name !== service.name) {
//     const existingService = await findServiceByName(data.name);

//     if (existingService) {
//       throw new Error("Service dengan nama tersebut sudah ada");
//     }
//   }

//   return updateService(id, data);
// }

import { prisma } from "../lib/prisma.js";

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    unit?: string;
    price?: number;
    inventoryUsage?: unknown;
    isActive?: boolean;
  },
) {
  const existingService = await prisma.service.findUnique({
    where: { id },
  });

  if (!existingService) {
    throw new Error("Service tidak ditemukan");
  }

  const updateData: {
    name?: string;
    description?: string | null;
    unit?: string;
    price?: number;
    inventoryUsage?: any;
    isActive?: boolean;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.unit !== undefined) {
    updateData.unit = data.unit;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.inventoryUsage !== undefined) {
    updateData.inventoryUsage = data.inventoryUsage;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  return prisma.service.update({
    where: { id },
    data: updateData,
  });
}
