import type { Request, Response } from "express";
import {
  createNewCustomer,
  getCustomersById,
  getCustomers,
  removeCustomer,
  updateExistingCustomer,
} from "../services/customer.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customer.validator";
import { success } from "zod";
import { stat } from "node:fs";

export async function getCustomersController(_req: Request, res: Response) {
  try {
    const customers = await getCustomers();

    return res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
    });
  }
}

export async function getCustomerByIdController(req: Request, res: Response) {
  try {
    const customer = await getCustomersById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve customer";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function createCustomerController(req: Request, res: Response) {
  try {
    const validation = createCustomerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "validation failed",
        errors: validation.error.flatten(),
      });
    }

    const customer = await createNewCustomer(validation.data);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create customer";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateCustomerController(req: Request, res: Response) {
  try {
    const validation = updateCustomerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const customer = await updateExistingCustomer(
      req.params.id as string,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : " Failed to update customer";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function deleteCustomerController(req: Request, res: Response) {
  try {
    await removeCustomer(req.params.id as string);

    return res.status(200).json({
      success: false,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete customer";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}
