import { Router } from "express";
import {
  createOrderController,
  getMyOrdersController,
  getOrderByIdController,
  getOrdersController,
  updateOrderStatusController,
  updateOrderController,
  deleteOrderController,
} from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize("ADMIN", "STAFF"), getOrdersController);
router.get("/my", authorize("CUSTOMER"), getMyOrdersController);
router.get("/:id", authorize("ADMIN", "STAFF", "CUSTOMER"), getOrderByIdController);
router.post("/", authorize("ADMIN", "STAFF", "CUSTOMER"), createOrderController);
router.patch("/:id/status", authorize("ADMIN", "STAFF"), updateOrderStatusController);
router.patch("/:id", authorize("ADMIN", "STAFF"), updateOrderController);
router.delete("/:id", authorize("ADMIN", "STAFF"), deleteOrderController);

export default router;
