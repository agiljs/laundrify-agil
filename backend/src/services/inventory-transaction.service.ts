import { prisma } from "../lib/prisma.js";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";

export async function getInventoryTransactions(inventoryItemId?: string) {
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

export async function createStockTransaction(data: {
  inventoryItemId: string;
  createdById: string;
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  supplierName?: string;
  purchasePrice?: number;
  purchaseReference?: string;
  note?: string;
}) {
  const item = await prisma.inventoryItem.findUnique({
    where: {
      id: data.inventoryItemId,
    },
  });

  if (!item) {
    throw new Error("Inventory item tidak ditemukan");
  }

  if (!item.isActive) {
    throw new Error("Inventory item tidak aktif");
  }

  const stockBefore = Number(item.currentStock);

  let stockChange = 0;

  switch (data.type) {
    case "PURCHASE":
    case "RETURN":
      stockChange = data.quantity;
      break;

    case "USAGE":
      stockChange = -data.quantity;
      break;

    case "ADJUSTMENT":
      stockChange = data.quantity;
      break;
  }

  const stockAfter = stockBefore + stockChange;

  if (stockAfter < 0) {
    throw new Error(`Stok tidak mencukupi. Stok saat ini: ${stockBefore}`);
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const transaction = await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        createdById: data.createdById,
        type: data.type,
        quantity: data.quantity,
        stockBefore,
        stockAfter,
        supplierName: data.supplierName,
        purchasePrice: data.purchasePrice,
        purchaseReference: data.purchaseReference,
        note: data.note,
      },
    });

    const updatedItem = await tx.inventoryItem.update({
      where: {
        id: data.inventoryItemId,
      },
      data: {
        currentStock: stockAfter,

        ...(data.type === "PURCHASE"
          ? {
              lastPurchasePrice: data.purchasePrice,
              lastPurchaseAt: new Date(),
            }
          : {}),
      },
    });

    return {
      transaction,
      inventoryItem: updatedItem,
    };
  });
}
