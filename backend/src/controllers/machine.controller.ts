import type { Request, Response } from "express";

import {
  createMachineSchema,
  updateMachineSchema,
} from "../validators/machine.validator.js";

import {
  getMachines,
  getMachineById,
  createNewMachine,
  updateMachineById,
} from "../services/machine.service.js";

import { getParamId } from "../utils/request.js";

export async function getMachinesController(_req: Request, res: Response) {
  const machines = await getMachines();

  res.json({
    success: true,
    data: machines,
  });
}

export async function getMachineByIdController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const machine = await getMachineById(id);

  res.json({
    success: true,
    data: machine,
  });
}

export async function createMachineController(req: Request, res: Response) {
  const data = createMachineSchema.parse(req.body);

  const machine = await createNewMachine(data);

  res.status(201).json({
    success: true,
    message: "Machine berhasil dibuat",
    data: machine,
  });
}

export async function updateMachineController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const data = updateMachineSchema.parse(req.body);

  const machine = await updateMachineById(id, data);

  res.json({
    success: true,
    message: "Machine berhasil diperbarui",
    data: machine,
  });
}
