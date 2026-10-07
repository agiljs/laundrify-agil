import { Router } from "express";
import { realtimeChange } from "../middlewares/realtimeChange.js";
import {
  createServiceController,
  getActiveServicesController,
  getServiceByIdController,
  getServicesController,
  updateServiceController,
} from "../controllers/service.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(realtimeChange("services"));

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getServicesController,
);

router.get(
  "/active",
  authenticate,
  authorize("ADMIN", "STAFF", "CUSTOMER"),
  getActiveServicesController,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getServiceByIdController,
);

router.post("/", authenticate, authorize("ADMIN"), createServiceController);

router.patch("/:id", authenticate, authorize("ADMIN"), updateServiceController);

export default router;
