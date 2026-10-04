import api from "./api";
import type { Expense, ExpensePayload } from "../types/expense";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    amount: Number(expense.amount),
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await api.get<ApiResponse<Expense[]>>("/expenses");
  return response.data.data.map(normalizeExpense);
}

export async function getExpenseById(id: string): Promise<Expense> {
  const response = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
  return normalizeExpense(response.data.data);
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const response = await api.post<ApiResponse<Expense>>("/expenses", payload);
  return normalizeExpense(response.data.data);
}

export async function updateExpense(
  id: string,
  payload: Partial<ExpensePayload>,
): Promise<Expense> {
  const response = await api.patch<ApiResponse<Expense>>(
    `/expenses/${id}`,
    payload,
  );
  return normalizeExpense(response.data.data);
}
