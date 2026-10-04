import type { Request, Response } from "express";

import {
  createUserSchema,
  updateUserSchema,
  changeUserPasswordSchema,
} from "../validators/user.validator.js";

import {
  getUsers,
  getUserById,
  createNewUser,
  updateUserById,
  changeUserPassword,
} from "../services/user.service.js";

import { getParamId } from "../utils/request.js";

export async function getUsersController(_req: Request, res: Response) {
  const users = await getUsers();

  res.json({
    success: true,
    data: users,
  });
}

export async function getUserByIdController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const user = await getUserById(id);

  res.json({
    success: true,
    data: user,
  });
}

export async function createUserController(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);

  const user = await createNewUser(data);

  res.status(201).json({
    success: true,
    message: "User berhasil dibuat",
    data: user,
  });
}

export async function updateUserController(req: Request, res: Response) {
  const id = getParamId(req.params);

  const data = updateUserSchema.parse(req.body);

  const user = await updateUserById(id, data);

  res.json({
    success: true,
    message: "User berhasil diperbarui",
    data: user,
  });
}

export async function changeUserPasswordController(
  req: Request,
  res: Response,
) {
  const id = getParamId(req.params);

  const data = changeUserPasswordSchema.parse(req.body);

  const user = await changeUserPassword(id, data.password);

  res.json({
    success: true,
    message: "Password berhasil diperbarui",
    data: user,
  });
}
