import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";

import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  changeUserPasswordController,
} from "../controllers/user.controller.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("users"));

router.use(authenticate);

/*
 * Semua endpoint User Management
 * hanya untuk ADMIN.
 */

router.get("/", authorize("ADMIN"), getUsersController);

router.get("/:id", authorize("ADMIN"), getUserByIdController);

router.post("/", authorize("ADMIN"), createUserController);

router.patch("/:id", authorize("ADMIN"), updateUserController);

router.patch("/:id/password", authorize("ADMIN"), changeUserPasswordController);

export default router;
