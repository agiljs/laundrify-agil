import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";
import {
  createInventoryTransactionController,
  getInventoryTransactionsController,
} from "../controllers/inventory-transaction.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("inventory"));

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getInventoryTransactionsController,
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createInventoryTransactionController,
);

export default router;
