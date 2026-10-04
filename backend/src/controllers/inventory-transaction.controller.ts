import type { Request, Response } from "express";
import {
  createStockTransaction,
  getInventoryTransactions,
} from "../services/inventory-transaction.service.js";
import { createInventoryTransactionSchema } from "../validators/inventory-transaction.validator.js";

export async function getInventoryTransactionsController(
  req: Request,
  res: Response,
) {
  try {
    const transactions = await getInventoryTransactions(
      req.query.inventoryItemId as string | undefined,
    );

    return res.status(200).json({
      success: true,
      message: "Inventory transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory transactions",
    });
  }
}

export async function createInventoryTransactionController(
  req: Request,
  res: Response,
) {
  try {
    const validation = createInventoryTransactionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await createStockTransaction({
      ...validation.data,
      createdById: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory transaction created successfully",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create inventory transaction";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
