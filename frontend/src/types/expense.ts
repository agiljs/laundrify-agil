export type ExpenseCategory =
  | "ELECTRICITY"
  | "WATER"
  | "DETERGENT"
  | "SUPPLIES"
  | "MACHINE_MAINTENANCE"
  | "DELIVERY"
  | "RENT"
  | "SALARY"
  | "OTHER";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number | string;
  createdById: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type ExpensePayload = {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
};
