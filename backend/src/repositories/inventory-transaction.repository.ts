import { prisma } from "../lib/prisma.js";

export async function findInventoryTransactions(inventoryItemId?: string) {
  return prisma.inventoryTransaction.findMany({
    where: inventoryItemId ? { inventoryItemId } : undefined,
    include: {
      inventoryItem: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
