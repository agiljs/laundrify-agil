import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";

import {
  getMachinesController,
  getMachineByIdController,
  createMachineController,
  updateMachineController,
} from "../controllers/machine.controller.js";

import { authenticate } from "../middlewares/authenticate.js";

import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("machines"));

router.use(authenticate);

router.get("/", authorize("ADMIN"), getMachinesController);

router.get("/:id", authorize("ADMIN"), getMachineByIdController);

router.post("/", authorize("ADMIN"), createMachineController);

router.patch("/:id", authorize("ADMIN"), updateMachineController);

export default router;
