import { from } from "node:stream/iter";
import {
  createService,
  findActiveServices,
  findServiceById,
  findServiceByName,
  findServices,
  updateService,
} from "../repositories/service.repository";

export async function getServices() {
  return findServices();
}

export async function getActiveServices() {
  return findActiveServices;
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

export async function updateExistingService(
  id: string,
  data: {
    name?: string;
    description?: string;
    unit?: string;
    price?: number;
    inventoryUsage?: object;
    isActive?: boolean;
  },
) {
  const service = await findServiceById(id);

  if (!service) {
    throw new Error("Service tidak ditemukan");
  }

  if (data.name && data.name !== service.name) {
    const existingService = await findServiceByName(data.name);

    if (existingService) {
      throw new Error("Service dengan nama tersebut sudah ada");
    }
  }

  return updateService(id, data);
}
