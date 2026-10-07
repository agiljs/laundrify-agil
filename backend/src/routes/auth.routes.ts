import { Router } from "express";
import {
  loginController,
  googleLoginController,
  meController,
  registerCustomerController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authRateLimit } from "../middlewares/authRateLimit.js";

const router = Router();

router.post("/login", authRateLimit({ limit: 8 }), loginController);
router.post("/google", authRateLimit({ limit: 8 }), googleLoginController);
router.post("/register/customer", authRateLimit({ limit: 10 }), registerCustomerController);
router.get("/me", authenticate, meController);

export default router;
