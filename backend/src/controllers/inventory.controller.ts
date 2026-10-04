import type { Request, Response } from "express";
import {
  createNewInventoryItem,
  getInventoryItemById,
  getInventoryItems,
  updateExistingInventoryItem,
} from "../services/inventory.service.js";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "../validators/inventory.validator.js";

export async function getInventoryItemsController(
  _req: Request,
  res: Response,
) {
  try {
    const items = await getInventoryItems();

    return res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      data: items,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory items",
    });
  }
}

export async function getInventoryItemByIdController(
  req: Request,
  res: Response,
) {
  try {
    const item = await getInventoryItemById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Inventory item retrieved successfully",
      data: item,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Inventory item not found";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function createInventoryItemController(
  req: Request,
  res: Response,
) {
  try {
    const validation = createInventoryItemSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const item = await createNewInventoryItem(validation.data);

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create inventory item";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateInventoryItemController(
  req: Request,
  res: Response,
) {
  try {
    const validation = updateInventoryItemSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const item = await updateExistingInventoryItem(
      req.params.id as string,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: item,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update inventory item";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
