import type { Request, Response } from "express";
import {
  createNewService,
  getActiveServices,
  getServiceById,
  getServices,
  updateExistingService,
} from "../services/service.service";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validators/service.validator";
import { success } from "zod";

export async function getServicesController(_req: Request, res: Response) {
  try {
    const services = await getServices();

    return res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: services,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve services",
    });
  }
}

export async function getActiveServicesController(
  _req: Request,
  res: Response,
) {
  try {
    const services = await getActiveServices();

    return res.status(200).json({
      success: true,
      message: "Active services retrieved successfully",
      data: services,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve active services",
    });
  }
}

export async function getServiceByIdController(req: Request, res: Response) {
  try {
    const service = await getServiceById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "service retrieved successfully",
      data: service,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service not found";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function createServiceController(req: Request, res: Response) {
  try {
    const validation = createServiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failde",
        errors: validation.error.flatten(),
      });
    }

    const service = await createNewService(validation.data);

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create service";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateServiceController(req: Request, res: Response) {
  try {
    const validation = updateServiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const service = await updateExistingService(
      req.params.id as string,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update service";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
