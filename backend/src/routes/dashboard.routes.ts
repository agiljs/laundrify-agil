import { Router } from "express";

import {
  getDashboardSummaryController,
  getOrderStatusReportController,
  getRevenueReportController,
  getExpenseReportController,
  getDailyReportController,
  getRecentCustomersController,
  getRecentOrdersController,
} from "../controllers/dashboard.controller.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get(
  "/recent-customers",
  authorize("ADMIN", "STAFF"),
  getRecentCustomersController,
);

router.get("/recent-orders", authorize("ADMIN", "STAFF"), getRecentOrdersController);

router.get("/summary", authorize("ADMIN", "STAFF"), getDashboardSummaryController);

router.get("/orders", authorize("ADMIN", "STAFF"), getOrderStatusReportController);

router.get("/revenue", authorize("ADMIN", "STAFF"), getRevenueReportController);

router.get("/expenses", authorize("ADMIN", "STAFF"), getExpenseReportController);

router.get("/daily", authorize("ADMIN", "STAFF"), getDailyReportController);

export default router;
