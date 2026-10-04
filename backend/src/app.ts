import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import inventoryTransactionRoutes from "./routes/inventory-transaction.route.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import userRoutes from "./routes/user.routes.js";
import machineRoutes from "./routes/machine.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Laundrify API is running" }));
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: "Database connected" });
  } catch {
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/inventory/transactions", inventoryTransactionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" }));
app.use(errorHandler);

export default app;
