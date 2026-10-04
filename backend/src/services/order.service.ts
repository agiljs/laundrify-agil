import { prisma } from "../lib/prisma.js";
import {
  createOrder,
  deleteOrder,
  findOrderById,
  findOrders,
  findOrdersByCustomerId,
} from "../repositories/order.repository.js";

import { useInventoryForOrder } from "./inventory-usage.service.js";
import { notifyRole } from "./notification.service.js";

import { Service } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

function generateOrderCode() {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `ORD-${timestamp}-${random}`;
}

export async function getOrders() {
  return findOrders();
}

export async function getCustomerOrders(customerId: string) {
  return findOrdersByCustomerId(customerId);
}

export async function getOrderById(id: string, customerId?: string) {
  const order = await findOrderById(id);

  if (!order) {
    throw new Error("Order tidak ditemukan");
  }

  if (customerId && order.customerId !== customerId) {
    throw new Error("Anda tidak memiliki akses ke order ini");
  }

  return order;
}

export async function createNewOrder(
  data: {
    customerId?: string;
    items: {
      serviceId: string;
      quantity: number;
    }[];
    deliveryFee: number;
    dueAt?: string;
    note?: string;
  },
  createdById: string,
  customerIdOverride?: string,
) {
  if (data.items.length === 0) {
    throw new Error("Order harus memiliki minimal satu service");
  }

  const customerId = customerIdOverride ?? data.customerId;

  if (!customerId) {
    throw new Error("Customer wajib dipilih");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new Error("Customer tidak ditemukan");
  }

  const uniqueServiceIds = [
    ...new Set(data.items.map((item) => item.serviceId)),
  ];

  const services = await prisma.service.findMany({
    where: {
      id: {
        in: uniqueServiceIds,
      },
      isActive: true,
    },
  });

  if (services.length !== uniqueServiceIds.length) {
    throw new Error("Salah satu service tidak ditemukan atau tidak aktif");
  }

  const items = data.items.map((item) => {
    const service = services.find((s: Service) => s.id === item.serviceId);

    if (!service) {
      throw new Error("Service tidak ditemukan");
    }

    if (item.quantity <= 0) {
      throw new Error("Quantity service harus lebih besar dari 0");
    }

    const price = Number(service.price);

    const subtotal = price * item.quantity;

    return {
      serviceId: service.id,
      quantity: item.quantity,
      priceSnapshot: price,
      subtotal,
    };
  });

  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

  const membershipActive =
    customer.membershipType === "MEMBER" &&
    (!customer.membershipExpiredAt ||
      customer.membershipExpiredAt > new Date());

  const membershipDiscount = membershipActive
    ? Number(customer.membershipDiscount)
    : 0;

  const discount = subtotal * (membershipDiscount / 100);

  const total = subtotal - discount + data.deliveryFee;

  const actor = await prisma.user.findUnique({
    where: { id: createdById },
    select: { id: true, name: true, role: true },
  });

  const order = await createOrder({
    orderCode: generateOrderCode(),
    customerId,
    createdById,

    status: "RECEIVED",
    paymentStatus: "UNPAID",

    subtotal,
    discount,
    deliveryFee: data.deliveryFee,
    total,

    dueAt: data.dueAt ? new Date(data.dueAt) : undefined,

    note: data.note,

    statusHistory: [
      {
        status: "RECEIVED",
        changedAt: new Date().toISOString(),
        changedBy: actor ?? { id: createdById, name: "Admin", role: "ADMIN" },
      },
    ],

    items,
  });

  await notifyRole({
    role: "ADMIN",
    title: "Order baru masuk",
    message: `Order ${order.orderCode} dari ${customer.name} berhasil dibuat.`,
    type: "INFO",
    excludeUserId: createdById,
  });

  return order;
}

type OrderStatus =
  | "RECEIVED"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ["WASHING", "CANCELLED"],

  WASHING: ["DRYING", "CANCELLED"],

  DRYING: ["IRONING", "CANCELLED"],

  IRONING: ["READY", "CANCELLED"],

  READY: ["COMPLETED", "CANCELLED"],

  COMPLETED: [],

  CANCELLED: [],
};

export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  changedById: string,
  note?: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          select: {
            serviceId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order tidak ditemukan");
    }

    const currentStatus = order.status as OrderStatus;

    const allowedStatuses = allowedTransitions[currentStatus];

    if (!allowedStatuses.includes(status)) {
      throw new Error(`Status order tidak valid: ${currentStatus} → ${status}`);
    }

    /*
     * Inventory digunakan ketika order
     * pertama kali masuk ke proses WASHING.
     */
    if (status === "WASHING") {
      await useInventoryForOrder(
        tx,
        order.id,
        changedById,
        order.items.map((item) => ({
          serviceId: item.serviceId,
          quantity: Number(item.quantity),
        })),
      );
    }

    const actor = await tx.user.findUnique({
      where: { id: changedById },
      select: { id: true, name: true, role: true },
    });

    const history = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];

    const newHistory = [
      ...history,
      {
        status,
        changedAt: new Date().toISOString(),
        changedBy: actor ?? { id: changedById, name: "Admin", role: "ADMIN" },
        ...(note?.trim() ? { note: note.trim() } : {}),
      },
    ];

    const updatedOrder = await tx.order.update({
      where: {
        id,
      },
      data: {
        status,

        statusHistory: newHistory,

        completedAt: status === "COMPLETED" ? new Date() : undefined,

        cancelledAt: status === "CANCELLED" ? new Date() : undefined,
      },

      include: {
        customer: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        items: {
          include: {
            service: true,
          },
        },

        payments: true,

        deliveries: true,
      },
    });

    await notifyRole({
      role: "ADMIN",
      title: "Status order diperbarui",
      message: `Order ${updatedOrder.orderCode} sekarang berstatus ${status}.`,
      type: status === "CANCELLED" ? "WARNING" : "INFO",
      excludeUserId: changedById,
    });

    return updatedOrder;
  });
}

export async function updateExistingOrder(
  id: string,
  data: {
    customerId?: string;
    items: { serviceId: string; quantity: number }[];
    deliveryFee: number;
    dueAt?: string | null;
    note?: string | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { payments: true, items: true },
    });
    if (!order) throw new Error("Order tidak ditemukan");
    if (order.status !== "RECEIVED")
      throw new Error("Order hanya dapat diedit saat status masih Diterima");
    if (order.payments.length > 0)
      throw new Error(
        "Order yang sudah memiliki pembayaran tidak dapat diedit",
      );

    const customerId = data.customerId ?? order.customerId;
    const customer = await tx.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) throw new Error("Customer tidak ditemukan");

    const serviceIds = [...new Set(data.items.map((item) => item.serviceId))];
    const services = await tx.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });
    if (services.length !== serviceIds.length)
      throw new Error("Salah satu service tidak ditemukan atau tidak aktif");

    const items = data.items.map((item) => {
      const service = services.find((s) => s.id === item.serviceId);
      if (!service) throw new Error("Service tidak ditemukan");
      if (item.quantity <= 0)
        throw new Error("Quantity service harus lebih besar dari 0");
      const price = Number(service.price);
      return {
        serviceId: service.id,
        quantity: item.quantity,
        priceSnapshot: price,
        subtotal: price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const membershipActive =
      customer.membershipType === "MEMBER" &&
      (!customer.membershipExpiredAt ||
        customer.membershipExpiredAt > new Date());
    const discountPercent = membershipActive
      ? Number(customer.membershipDiscount)
      : 0;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount + data.deliveryFee;

    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: id })),
    });

    const updated = await tx.order.update({
      where: { id },
      data: {
        customerId,
        subtotal,
        discount,
        deliveryFee: data.deliveryFee,
        total,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        note: data.note ?? null,
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { service: true } },
        payments: true,
        deliveries: true,
      },
    });
    return updated;
  });
}

export async function removeOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      payments: true,
      items: { include: { inventoryTransactions: true } },
    },
  });
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.status !== "RECEIVED")
    throw new Error("Order hanya dapat dihapus saat status masih Diterima");
  if (order.payments.length > 0)
    throw new Error("Order yang sudah memiliki pembayaran tidak dapat dihapus");
  const hasInventoryTransactions = order.items.some(
    (item) => item.inventoryTransactions.length > 0,
  );
  if (hasInventoryTransactions)
    throw new Error(
      "Order sudah memiliki transaksi inventory dan tidak dapat dihapus",
    );
  return deleteOrder(id);
}
