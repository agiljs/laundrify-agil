import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middlewares/authenticate";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Laundrify API is running",
  });
});

app.get("/api/health/db", async (req, res) => {
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

app.use("/api/auth", authRoutes);

export default app;
