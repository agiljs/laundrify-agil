import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middlewares/authenticate";
import { authorize } from "./middlewares/authorize";
import { errorHandler } from "./middlewares/errorHandler";
import customerRoutes from "./routes/customer.routes";
import serviceRoutes from "./routes/service.routes";
import { success } from "zod";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Laundrify API is running",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "Authenticated",
    user: req.user,
  });
});

app.get("/api/test/admin", authenticate, authorize("ADMIN"), (_req, res) => {
  res.json({
    success: true,
    message: "Welcome ADMIN",
  });
});

app.get(
  "/api/test/staff",
  authenticate,
  authorize("ADMIN", "STAFF"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Welcome ADMIN OR STAFF",
    });
  },
);

app.get(
  "/api/test/driver",
  authenticate,
  authorize("ADMIN", "DRIVER"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Welcome ADMIN or DRIVER",
    });
  },
);

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use(errorHandler);

export default app;
