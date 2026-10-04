// import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

type InventoryUsage = Record<string, number>;

export async function useInventoryForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  createdById: string,
  items: {
    serviceId: string;
    quantity: number;
  }[],
) {
  const serviceIds = [...new Set(items.map((item) => item.serviceId))];

  const services = await tx.service.findMany({
    where: {
      id: {
        in: serviceIds,
      },
      isActive: true,
    },
  });

  if (services.length !== serviceIds.length) {
    throw new Error("Service untuk inventory usage tidak ditemukan");
  }

  const usageMap = new Map<string, number>();

  for (const item of items) {
    const service = services.find((service) => service.id === item.serviceId);

    if (!service) {
      throw new Error("Service tidak ditemukan");
    }

    if (!service.inventoryUsage) {
      continue;
    }

    const inventoryUsage = service.inventoryUsage as InventoryUsage;

    for (const [inventoryItemId, quantityPerUnit] of Object.entries(
      inventoryUsage,
    )) {
      if (quantityPerUnit <= 0) {
        continue;
      }

      const totalUsage = quantityPerUnit * item.quantity;

      const currentUsage = usageMap.get(inventoryItemId) ?? 0;

      usageMap.set(inventoryItemId, currentUsage + totalUsage);
    }
  }

  for (const [inventoryKey, usageQuantity] of usageMap.entries()) {
    // inventoryUsage dari Service dapat menggunakan inventory UUID, SKU,
    // atau nama inventory. Konfigurasi seperti { "softener": 0.02 }
    // tidak boleh langsung dikirim ke Prisma sebagai UUID.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      inventoryKey,
    );

    const inventoryItem = isUuid
      ? await tx.inventoryItem.findUnique({
          where: { id: inventoryKey },
        })
      : await tx.inventoryItem.findFirst({
          where: {
            OR: [
              { sku: inventoryKey },
              { name: { equals: inventoryKey, mode: "insensitive" } },
            ],
          },
        });

    if (!inventoryItem) {
      throw new Error(`Inventory item ${inventoryKey} tidak ditemukan`);
    }

    if (!inventoryItem.isActive) {
      throw new Error(`Inventory item ${inventoryItem.name} tidak aktif`);
    }

    const stockBefore = Number(inventoryItem.currentStock);

    const stockAfter = stockBefore - usageQuantity;

    if (stockAfter < 0) {
      throw new Error(
        `Stok ${inventoryItem.name} tidak mencukupi. ` +
          `Stok saat ini: ${stockBefore}, ` +
          `kebutuhan: ${usageQuantity}`,
      );
    }

    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItem.id,
        createdById,
        type: "USAGE",
        quantity: usageQuantity,
        stockBefore,
        stockAfter,
        orderId,
        note: `Penggunaan inventory untuk order ${orderId}`,
      },
    });

    await tx.inventoryItem.update({
      where: {
        id: inventoryItem.id,
      },
      data: {
        currentStock: stockAfter,
      },
    });
  }

  return {
    success: true,
  };
}
