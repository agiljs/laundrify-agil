import { Router } from "express";
import {
  createServiceController,
  getActiveServicesController,
  getServiceByIdController,
  getServicesController,
  updateServiceController,
} from "../controllers/service.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  getServicesController,
);

router.get(
  "/active",
  authenticate,
  authorize("ADMIN", "STAFF"),
  getActiveServicesController,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  getServiceByIdController,
);

router.post("/", authenticate, authorize("ADMIN"), createServiceController);

router.put("/:id", authenticate, authorize("ADMIN"), updateServiceController);

export default router;
