import type { Request, Response } from "express";
import {
  createNewCustomer,
  getCustomersById,
  getCustomers,
  removeCustomer,
  updateExistingCustomer,
  getCustomerByUserId,
} from "../services/customer.service.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";
import { getParamId } from "../utils/request.js";
import { getMembershipSummary } from "../services/membership.service.js";

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
  const id = getParamId(req.params);
  try {
    const validation = updateCustomerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const customer = await updateExistingCustomer(id, validation.data);

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


export async function getMyCustomerController(req: Request, res: Response) {
  const customer = await getCustomerByUserId(req.user!.id);
  res.json({ success: true, data: customer });
}

export async function updateMyCustomerController(req: Request, res: Response) {
  try {
    const validation = updateCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: "Data profil tidak valid", errors: validation.error.flatten() });
    }
    const customer = await getCustomerByUserId(req.user!.id);
    const updated = await updateExistingCustomer(customer.id, {
      name: validation.data.name, phone: validation.data.phone, email: validation.data.email,
      address: validation.data.address, notes: validation.data.notes,
    });
    return res.json({ success: true, message: "Profil berhasil diperbarui", data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Profil gagal diperbarui" });
  }
}


export async function getMyMembershipController(req: Request, res: Response) {
  const customer = await getCustomerByUserId(req.user!.id);
  const membership = await getMembershipSummary(customer.id);
  res.json({ success: true, data: membership });
}
