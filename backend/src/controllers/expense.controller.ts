import type { Request, Response } from "express";

import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validators/expense.validator.js";

import {
  getExpenses,
  getExpenseById,
  createNewExpense,
  updateExpenseById,
} from "../services/expense.service.js";

import { getParamId } from "../utils/request.js";

export async function getExpensesController(_req: Request, res: Response) {
  const expenses = await getExpenses();

  res.json({
    success: true,
    data: expenses,
  });
}

export async function getExpenseByIdController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const expense = await getExpenseById(id);

  res.json({
    success: true,
    data: expense,
  });
}

export async function createExpenseController(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const data = createExpenseSchema.parse(req.body);

  const expense = await createNewExpense(data, user.id);

  res.status(201).json({
    success: true,
    message: "Expense berhasil dibuat",
    data: expense,
  });
}

export async function updateExpenseController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const data = updateExpenseSchema.parse(req.body);

  const expense = await updateExpenseById(id, data);

  res.json({
    success: true,
    message: "Expense berhasil diperbarui",
    data: expense,
  });
}
