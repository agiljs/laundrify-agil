import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";
import { assignCourierController, createDeliveryController, getDeliveriesController, getDeliveryByIdController, updateDeliveryStatusController } from "../controllers/delivery.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("deliveries"));
router.use(authenticate, authorize("ADMIN"));
router.get("/", getDeliveriesController);
router.get("/:id", getDeliveryByIdController);
router.post("/", createDeliveryController);
router.patch("/:id/assign", assignCourierController);
router.patch("/:id/status", updateDeliveryStatusController);

export default router;
