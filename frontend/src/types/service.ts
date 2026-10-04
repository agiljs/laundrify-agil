export type ServiceUnit = "KG" | "PCS" | "SET" | "METER" | "LITER";

export type LaundryService = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  inventoryUsage: Record<string, number> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
