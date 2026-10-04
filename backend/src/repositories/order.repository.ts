import { prisma } from "../lib/prisma.js";

export async function findOrders() {
  return prisma.order.findMany({
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

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findOrdersByCustomerId(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: { include: { service: true } },
      payments: true,
      deliveries: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findOrderById(id: string) {
  return prisma.order.findUnique({
    where: {
      id,
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
}

export async function createOrder(data: {
  orderCode: string;
  customerId: string;
  createdById: string;

  status: "RECEIVED";
  paymentStatus: "UNPAID";

  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;

  dueAt?: Date;
  note?: string;

  statusHistory: object[];

  items: {
    serviceId: string;
    quantity: number;
    priceSnapshot: number;
    subtotal: number;
  }[];
}) {
  return prisma.order.create({
    data: {
      orderCode: data.orderCode,

      customerId: data.customerId,

      createdById: data.createdById,

      status: data.status,

      paymentStatus: data.paymentStatus,

      subtotal: data.subtotal,

      discount: data.discount,

      deliveryFee: data.deliveryFee,

      total: data.total,

      dueAt: data.dueAt,

      note: data.note,

      statusHistory: data.statusHistory,

      items: {
        create: data.items,
      },
    },

    include: {
      customer: true,

      items: {
        include: {
          service: true,
        },
      },
    },
  });
}


export async function deleteOrder(id: string) {
  return prisma.order.delete({ where: { id } });
}
