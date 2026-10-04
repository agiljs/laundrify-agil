import {
  findExpenses,
  findExpenseById,
  createExpense,
  updateExpense,
} from "../repositories/expense.repository.js";

export async function getExpenses() {
  return findExpenses();
}

export async function getExpenseById(id: string) {
  const expense = await findExpenseById(id);

  if (!expense) {
    throw new Error("Expense tidak ditemukan");
  }

  return expense;
}

export async function createNewExpense(
  data: {
    category:
      | "ELECTRICITY"
      | "WATER"
      | "DETERGENT"
      | "SUPPLIES"
      | "MACHINE_MAINTENANCE"
      | "DELIVERY"
      | "RENT"
      | "SALARY"
      | "OTHER";

    description: string;
    amount: number;
    expenseDate: string;
  },
  createdById: string,
) {
  return createExpense({
    category: data.category,
    description: data.description.trim(),
    amount: data.amount,
    createdById,
    expenseDate: new Date(data.expenseDate),
  });
}

export async function updateExpenseById(
  id: string,
  data: {
    category?:
      | "ELECTRICITY"
      | "WATER"
      | "DETERGENT"
      | "SUPPLIES"
      | "MACHINE_MAINTENANCE"
      | "DELIVERY"
      | "RENT"
      | "SALARY"
      | "OTHER";

    description?: string;
    amount?: number;
    expenseDate?: string;
  },
) {
  const expense = await findExpenseById(id);

  if (!expense) {
    throw new Error("Expense tidak ditemukan");
  }

  return updateExpense(id, {
    category: data.category,
    description: data.description?.trim(),
    amount: data.amount,
    expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
  });
}
