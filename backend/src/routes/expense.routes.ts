import { Router } from "express";

import {
  getExpensesController,
  getExpenseByIdController,
  createExpenseController,
  updateExpenseController,
} from "../controllers/expense.controller.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN"), getExpensesController);

router.get("/:id", authorize("ADMIN"), getExpenseByIdController);

router.post("/", authorize("ADMIN"), createExpenseController);

router.patch("/:id", authorize("ADMIN"), updateExpenseController);

export default router;
