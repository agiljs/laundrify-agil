import { Router } from "express";
import {
  createCustomerController,
  deleteCustomerController,
  getCustomerByIdController,
  getCustomersController,
  updateCustomerController,
} from "../controllers/customer.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  getCustomersController,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  getCustomerByIdController,
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  createCustomerController,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  updateCustomerController,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteCustomerController,
);

export default router;
