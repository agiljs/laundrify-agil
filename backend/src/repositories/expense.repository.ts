import { prisma } from "../lib/prisma.js";
import type { ExpenseCategory } from "../generated/prisma/client.js";

export async function findExpenses() {
  return prisma.expense.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      expenseDate: "desc",
    },
  });
}

export async function findExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function createExpense(data: {
  category: ExpenseCategory;
  description: string;
  amount: number;
  createdById: string;
  expenseDate: Date;
}) {
  return prisma.expense.create({
    data,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function updateExpense(
  id: string,
  data: {
    category?: ExpenseCategory;
    description?: string;
    amount?: number;
    expenseDate?: Date;
  },
) {
  return prisma.expense.update({
    where: { id },
    data,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
