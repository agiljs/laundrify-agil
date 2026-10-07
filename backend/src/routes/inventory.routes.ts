import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";
import {
  createInventoryItemController,
  getInventoryItemByIdController,
  getInventoryItemsController,
  updateInventoryItemController,
} from "../controllers/inventory.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("inventory"));

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getInventoryItemsController,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getInventoryItemByIdController,
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createInventoryItemController,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateInventoryItemController,
);

export default router;
