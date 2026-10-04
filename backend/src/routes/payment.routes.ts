import { Router } from "express";
import { createPaymentController, getPaymentsByOrderIdController } from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();
router.use(authenticate);
router.get("/order/:orderId", authorize("ADMIN", "STAFF", "CUSTOMER"), getPaymentsByOrderIdController);
router.post("/", authorize("ADMIN", "STAFF", "CUSTOMER"), createPaymentController);

export default router;
