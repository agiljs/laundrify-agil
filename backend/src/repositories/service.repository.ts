import { prisma } from "../lib/prisma";

export async function findServices() {
  return prisma.service.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findActiveServices() {
  return prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function findServiceById(id: string) {
  return prisma.service.findUnique({
    where: {
      id,
    },
  });
}

export async function findServiceByName(name: string) {
  return prisma.service.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

export async function createService(data: {
  name: string;
  description?: string;
  unit: string;
  price: number;
  inventoryUsage?: object;
}) {
  return prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      unit: data.unit,
      price: data.price,
      inventoryUsage: data.inventoryUsage,
    },
  });
}

export async function updateService(
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
  return prisma.service.update({
    where: {
      id,
    },
    data,
  });
}
