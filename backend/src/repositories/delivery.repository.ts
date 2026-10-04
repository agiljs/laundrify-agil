import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

const include = {
  order: {
    include: {
      customer: true,
      items: { include: { service: true } },
    },
  },
} as const;

export async function findDeliveries() {
  return prisma.delivery.findMany({ include, orderBy: { createdAt: "desc" } });
}

export async function findDeliveryById(id: string) {
  return prisma.delivery.findUnique({ where: { id }, include });
}

export async function createDelivery(data: {
  orderId: string;
  type: "PICKUP" | "DELIVERY";
  status: "REQUESTED";
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: Date;
  notes?: string;
}) {
  return prisma.delivery.create({
    data: {
      orderId: data.orderId,
      type: data.type,
      status: data.status,
      recipientName: data.recipientName ?? "",
      recipientPhone: data.recipientPhone ?? "",
      address: data.address ?? "",
      latitude: data.latitude,
      longitude: data.longitude,
      scheduledAt: data.scheduledAt,
      notes: data.notes,
      statusHistory: [{ status: "REQUESTED", changedAt: new Date().toISOString() }],
    },
    include,
  });
}

export async function assignCourier(id: string, data: {
  courierName?: string;
  courierPhone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  statusHistory: Prisma.InputJsonValue;
}) {
  return prisma.delivery.update({
    where: { id },
    data: {
      courierName: data.courierName,
      courierPhone: data.courierPhone,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      status: "ASSIGNED",
      assignedAt: new Date(),
      statusHistory: data.statusHistory,
    },
    include,
  });
}

export async function updateDeliveryStatus(id: string, data: {
  status: "REQUESTED" | "ASSIGNED" | "ON_THE_WAY" | "PICKED_UP" | "DELIVERING" | "DELIVERED" | "CANCELLED";
  statusHistory: Prisma.InputJsonValue;
  startedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}) {
  return prisma.delivery.update({ where: { id }, data, include });
}
