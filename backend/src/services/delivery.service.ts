import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { assignCourier, createDelivery, findDeliveries, findDeliveryById, updateDeliveryStatus } from "../repositories/delivery.repository.js";

type DeliveryStatus = "REQUESTED" | "ASSIGNED" | "ON_THE_WAY" | "PICKED_UP" | "DELIVERING" | "DELIVERED" | "CANCELLED";

const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  REQUESTED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["PICKED_UP", "DELIVERING", "CANCELLED"],
  PICKED_UP: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

function appendHistory(current: Prisma.JsonValue | null | undefined, entry: Prisma.JsonObject): Prisma.InputJsonValue {
  const history: Prisma.JsonArray = Array.isArray(current) ? [...current] : [];
  history.push(entry);
  return history;
}

export async function getDeliveries() { return findDeliveries(); }

export async function getDeliveryById(id: string) {
  const delivery = await findDeliveryById(id);
  if (!delivery) throw new Error("Delivery tidak ditemukan");
  return delivery;
}

export async function createNewDelivery(data: {
  orderId: string;
  type: "PICKUP" | "DELIVERY";
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  notes?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { customer: true } });
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.status === "CANCELLED") throw new Error("Order yang dibatalkan tidak dapat dibuatkan delivery");
  if (data.type === "DELIVERY" && !data.address) throw new Error("Alamat wajib diisi untuk delivery");

  const existing = await prisma.delivery.findUnique({ where: { orderId_type: { orderId: data.orderId, type: data.type } } });
  if (existing) throw new Error("Delivery dengan tipe tersebut sudah ada");

  return createDelivery({
    orderId: data.orderId,
    type: data.type,
    status: "REQUESTED",
    recipientName: data.recipientName ?? order.customer.name,
    recipientPhone: data.recipientPhone ?? order.customer.phone,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    notes: data.notes,
  });
}

export async function assignCourier(id: string, data: { courierName?: string; courierPhone?: string; vehicleType?: string; vehicleNumber?: string }, changedById: string) {
  const delivery = await findDeliveryById(id);
  if (!delivery) throw new Error("Delivery tidak ditemukan");
  if (["DELIVERED", "CANCELLED"].includes(delivery.status)) throw new Error("Delivery sudah selesai atau dibatalkan");

  const history = appendHistory(delivery.statusHistory, {
    status: "ASSIGNED",
    changedAt: new Date().toISOString(),
    changedBy: changedById,
  });

  return assignCourier(id, { ...data, statusHistory: history });
}

export async function changeDeliveryStatus(id: string, status: DeliveryStatus, changedById: string) {
  const delivery = await findDeliveryById(id);
  if (!delivery) throw new Error("Delivery tidak ditemukan");

  const nextStatuses = allowedTransitions[delivery.status as DeliveryStatus];
  if (!nextStatuses.includes(status)) throw new Error(`Status ${delivery.status} tidak dapat diubah menjadi ${status}`);
  if (!["CANCELLED", "ASSIGNED"].includes(status) && !delivery.courierName) throw new Error("Courier belum ditugaskan");

  const now = new Date();
  const history = appendHistory(delivery.statusHistory, { status, changedAt: now.toISOString(), changedBy: changedById });

  return updateDeliveryStatus(id, {
    status,
    statusHistory: history,
    startedAt: status === "ON_THE_WAY" ? now : undefined,
    pickedUpAt: status === "PICKED_UP" ? now : undefined,
    deliveredAt: status === "DELIVERED" ? now : undefined,
    cancelledAt: status === "CANCELLED" ? now : undefined,
  });
}
