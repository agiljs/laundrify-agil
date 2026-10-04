import api from "./api";
import type { InventoryItem, InventoryTransaction } from "../types/inventory";

export type CreateInventoryData = {
  sku: string;
  name: string;
  category?: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  costPrice: number;
  supplierName?: string;
  supplierPhone?: string;
};

export type UpdateInventoryData = {
  name?: string;
  category?: string;
  unit?: string;
  minimumStock?: number;
  maximumStock?: number;
  costPrice?: number;
  supplierName?: string;
  supplierPhone?: string;
  isActive?: boolean;
};

export type CreateTransactionData = {
  inventoryItemId: string;
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  supplierName?: string;
  purchasePrice?: number;
  purchaseReference?: string;
  note?: string;
};

type ListResponse<T> = { success: boolean; data: T[] };
type ItemResponse<T> = { success: boolean; data: T };

const normalizeItem = (item: InventoryItem): InventoryItem => ({
  ...item,
  currentStock: Number(item.currentStock),
  minimumStock: Number(item.minimumStock),
  maximumStock: item.maximumStock == null ? null : Number(item.maximumStock),
  costPrice: Number(item.costPrice),
  lastPurchasePrice: item.lastPurchasePrice == null ? null : Number(item.lastPurchasePrice),
});

const normalizeTransaction = (item: InventoryTransaction): InventoryTransaction => ({
  ...item,
  quantity: Number(item.quantity),
  stockBefore: Number(item.stockBefore),
  stockAfter: Number(item.stockAfter),
  purchasePrice: item.purchasePrice == null ? null : Number(item.purchasePrice),
});

export async function getInventoryItems() {
  const response = await api.get<ListResponse<InventoryItem>>("/inventory");
  return response.data.data.map(normalizeItem);
}

export async function createInventoryItem(data: CreateInventoryData) {
  const response = await api.post<ItemResponse<InventoryItem>>("/inventory", data);
  return normalizeItem(response.data.data);
}

export async function updateInventoryItem(id: string, data: UpdateInventoryData) {
  const response = await api.put<ItemResponse<InventoryItem>>(`/inventory/${id}`, data);
  return normalizeItem(response.data.data);
}

export async function getInventoryTransactions(inventoryItemId?: string) {
  const params = inventoryItemId ? { inventoryItemId } : undefined;
  const response = await api.get<ListResponse<InventoryTransaction>>("/inventory/transactions", { params });
  return response.data.data.map(normalizeTransaction);
}

export async function createInventoryTransaction(data: CreateTransactionData) {
  const response = await api.post<ItemResponse<{ transaction: InventoryTransaction; inventoryItem: InventoryItem }>>(
    "/inventory/transactions",
    data,
  );
  return {
    transaction: normalizeTransaction(response.data.data.transaction),
    inventoryItem: normalizeItem(response.data.data.inventoryItem),
  };
}
