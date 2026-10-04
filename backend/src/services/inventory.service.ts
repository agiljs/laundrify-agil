import {
  createInventoryItem,
  findInventoryItemById,
  findInventoryItemBySku,
  findInventoryItems,
  updateInventoryItem,
} from "../repositories/inventory.repository.js";

export async function getInventoryItems() {
  return findInventoryItems();
}

export async function getInventoryItemById(id: string) {
  const item = await findInventoryItemById(id);

  if (!item) {
    throw new Error("Inventory item tidak ditemukan");
  }

  return item;
}

export async function createNewInventoryItem(data: {
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
  const existingItem = await findInventoryItemBySku(data.sku);

  if (existingItem) {
    throw new Error("SKU inventory sudah digunakan");
  }

  if (
    data.maximumStock !== undefined &&
    data.maximumStock < data.minimumStock
  ) {
    throw new Error("Maximum stock tidak boleh lebih kecil dari minimum stock");
  }

  return createInventoryItem(data);
}

export async function updateExistingInventoryItem(
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
  const item = await findInventoryItemById(id);

  if (!item) {
    throw new Error("Inventory item tidak ditemukan");
  }

  const minimumStock = data.minimumStock ?? Number(item.minimumStock);

  if (data.maximumStock !== undefined && data.maximumStock < minimumStock) {
    throw new Error("Maximum stock tidak boleh lebih kecil dari minimum stock");
  }

  return updateInventoryItem(id, data);
}
