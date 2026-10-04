import { prisma } from "../lib/prisma.js";

export async function getDashboardSummaryData(startDate: Date, endDate: Date) {
  const [
    totalCustomers,
    totalMembers,
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingOrders,
    revenueResult,
    expenseResult,
  ] = await Promise.all([
    prisma.customer.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.customer.count({
      where: {
        deletedAt: null,
        membershipType: "MEMBER",
      },
    }),

    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        status: "COMPLETED",
      },
    }),

    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        status: "CANCELLED",
      },
    }),

    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        paidAt: {
          gte: startDate,
          lt: endDate,
        },
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    totalCustomers,
    totalMembers,
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingOrders,
    totalRevenue: Number(revenueResult._sum.amount ?? 0),
    totalExpense: Number(expenseResult._sum.amount ?? 0),
  };
}

export async function getLifetimeBusinessData() {
  const [revenue, paidOrders] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { paymentStatus: "PAID" },
    }),
  ]);

  return {
    lifetimeRevenue: Number(revenue._sum.amount ?? 0),
    lifetimePaidOrders: paidOrders,
  };
}

export async function getOrderStatusReportData(startDate: Date, endDate: Date) {
  return prisma.order.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    _count: {
      _all: true,
    },
  });
}

export async function getRevenueReportData(startDate: Date, endDate: Date) {
  return prisma.payment.aggregate({
    where: {
      paidAt: {
        gte: startDate,
        lt: endDate,
      },
      status: "SUCCESS",
    },
    _sum: {
      amount: true,
    },
    _count: {
      _all: true,
    },
  });
}

export async function getExpenseReportData(startDate: Date, endDate: Date) {
  return prisma.expense.aggregate({
    where: {
      expenseDate: {
        gte: startDate,
        lt: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      _all: true,
    },
  });
}

export async function getDailyRevenueData(startDate: Date, endDate: Date) {
  return prisma.payment.findMany({
    where: {
      paidAt: {
        gte: startDate,
        lt: endDate,
      },
      status: "SUCCESS",
    },
    select: {
      amount: true,
      paidAt: true,
    },
    orderBy: {
      paidAt: "asc",
    },
  });
}

export async function getDailyExpenseData(startDate: Date, endDate: Date) {
  return prisma.expense.findMany({
    where: {
      expenseDate: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      amount: true,
      expenseDate: true,
    },
    orderBy: {
      expenseDate: "asc",
    },
  });
}

export async function getDailyOrderData(startDate: Date, endDate: Date) {
  return prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getRecentCustomersData(limit: number) {
  return prisma.customer.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function getRecentOrdersData(limit: number) {
  return prisma.order.findMany({
    select: {
      id: true,
      orderCode: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,

      customer: {
        select: {
          id: true,
          name: true,
        },
      },

      items: {
        select: {
          quantity: true,

          service: {
            select: {
              name: true,
              unit: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: limit,
  });
}
