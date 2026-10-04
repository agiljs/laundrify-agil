import { prisma } from "../lib/prisma.js";

export async function findInventoryItems() {
  return prisma.inventoryItem.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findInventoryItemById(id: string) {
  return prisma.inventoryItem.findUnique({
    where: {
      id,
    },
  });
}

export async function findInventoryItemBySku(sku: string) {
  return prisma.inventoryItem.findUnique({
    where: {
      sku,
    },
  });
}

export async function createInventoryItem(data: {
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  costPrice: number;
  supplierName?: string;
  supplierPhone?: string;
}) {
  return prisma.inventoryItem.create({
    data,
  });
}

export async function updateInventoryItem(
  id: string,
  data: {
    name?: string;
    category?: string;
    unit?: string;
    minimumStock?: number;
    maximumStock?: number;
    costPrice?: number;
    supplierName?: string;
    supplierPhone?: string;
    isActive?: boolean;
  },
) {
  return prisma.inventoryItem.update({
    where: {
      id,
    },
    data,
  });
}
