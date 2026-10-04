import { Router } from "express";

import {
  getMyNotificationsController,
  getUnreadNotificationCountController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../controllers/notification.controller.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "CUSTOMER"), getMyNotificationsController);

router.get(
  "/unread-count",
  authorize("ADMIN", "CUSTOMER"),
  getUnreadNotificationCountController,
);

router.patch(
  "/read-all",
  authorize("ADMIN", "CUSTOMER"),
  markAllNotificationsReadController,
);

router.patch(
  "/:id/read",
  authorize("ADMIN", "CUSTOMER"),
  markNotificationReadController,
);

export default router;
