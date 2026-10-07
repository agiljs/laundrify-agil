import { Router } from "express";
import { createPaymentController, getPaymentsByOrderIdController } from "../controllers/payment.controller.js";
import {
  createSnapPaymentController,
  midtransNotificationController,
  syncMidtransPaymentController,
} from "../controllers/midtrans.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { realtimeChange } from "../middlewares/realtimeChange.js";

const router = Router();

// Webhook Midtrans: publik (tanpa JWT), diverifikasi lewat signature.
router.post("/midtrans/notification", midtransNotificationController);

router.use(authenticate);
router.use(realtimeChange("payments"));

// Pembayaran online via Midtrans: khusus customer untuk order miliknya sendiri.
router.post("/midtrans/snap", authorize("CUSTOMER"), createSnapPaymentController);
router.post("/midtrans/sync", authorize("CUSTOMER"), syncMidtransPaymentController);

router.get("/order/:orderId", authorize("ADMIN", "STAFF", "CUSTOMER"), getPaymentsByOrderIdController);

// Pencatatan pembayaran manual (cash/transfer) hanya untuk admin & staff.
// Customer TIDAK boleh membuat payment manual sendiri (bisa menandai order lunas tanpa membayar).
router.post("/", authorize("ADMIN", "STAFF"), createPaymentController);

export default router;
