import { Router } from "express";

import {
  getCustomersController,
  getCustomerByIdController,
  createCustomerController,
  updateCustomerController,
  deleteCustomerController,
  getMyCustomerController,
  updateMyCustomerController,
  getMyMembershipController,
} from "../controllers/customer.controller.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/me", authorize("CUSTOMER"), getMyCustomerController);
router.get("/me/membership", authorize("CUSTOMER"), getMyMembershipController);
router.patch("/me", authorize("CUSTOMER"), updateMyCustomerController);

router.get("/", authorize("ADMIN", "STAFF"), getCustomersController);

router.get("/:id", authorize("ADMIN", "STAFF"), getCustomerByIdController);

router.post("/", authorize("ADMIN", "STAFF"), createCustomerController);

router.patch("/:id", authorize("ADMIN", "STAFF"), updateCustomerController);

router.delete("/:id", authorize("ADMIN", "STAFF"), deleteCustomerController);

export default router;
