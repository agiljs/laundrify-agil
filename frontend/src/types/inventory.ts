export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  currentStock: number | string;
  minimumStock: number | string;
  maximumStock: number | string | null;
  costPrice: number | string;
  supplierName: string | null;
  supplierPhone: string | null;
  lastPurchasePrice: number | string | null;
  lastPurchaseAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransactionType = "PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN";

export type InventoryTransaction = {
  id: string;
  inventoryItemId: string;
  createdById: string;
  type: InventoryTransactionType;
  quantity: number | string;
  stockBefore: number | string;
  stockAfter: number | string;
  supplierName: string | null;
  purchasePrice: number | string | null;
  purchaseReference: string | null;
  note: string | null;
  createdAt: string;
  inventoryItem?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
};
