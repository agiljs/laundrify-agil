export type MachineStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "BROKEN";

export type Machine = {
  id: string;
  machineCode: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number | string | null;
  status: MachineStatus;
  location: string | null;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  maintenanceCost: number | string;
  maintenanceNotes: string | null;
  maintenanceHistory: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MachinePayload = {
  machineCode: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status?: MachineStatus;
  location?: string;
  lastMaintenanceAt?: string;
  nextMaintenanceAt?: string;
  maintenanceCost?: number;
  maintenanceNotes?: string;
  maintenanceHistory?: unknown;
};
