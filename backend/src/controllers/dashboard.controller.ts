import type { Request, Response } from "express";

import {
  getDashboardSummary,
  getOrderStatusReport,
  getRevenueReport,
  getExpenseReport,
  getDailyReport,
  getRecentCustomers,
  getRecentOrders,
} from "../services/dashboard.srvice.js";

import {
  dashboardPeriodSchema,
  dashboardLimitSchema,
} from "../validators/dashboard.validator.js";

export async function getRecentCustomersController(
  req: Request,
  res: Response,
) {
  const query = dashboardLimitSchema.parse(req.query);

  const data = await getRecentCustomers(query.limit);

  res.json({
    success: true,
    data,
  });
}

export async function getRecentOrdersController(req: Request, res: Response) {
  const query = dashboardLimitSchema.parse(req.query);

  const data = await getRecentOrders(query.limit);

  res.json({
    success: true,
    data,
  });
}

export async function getDashboardSummaryController(
  _req: Request,
  res: Response,
) {
  const data = await getDashboardSummary();

  res.json({
    success: true,
    data,
  });
}

export async function getOrderStatusReportController(
  req: Request,
  res: Response,
) {
  const query = dashboardPeriodSchema.parse(req.query);

  const data = await getOrderStatusReport(query.startDate, query.endDate);

  res.json({
    success: true,
    data,
  });
}

export async function getRevenueReportController(req: Request, res: Response) {
  const query = dashboardPeriodSchema.parse(req.query);

  const data = await getRevenueReport(query.startDate, query.endDate);

  res.json({
    success: true,
    data,
  });
}

export async function getExpenseReportController(req: Request, res: Response) {
  const query = dashboardPeriodSchema.parse(req.query);

  const data = await getExpenseReport(query.startDate, query.endDate);

  res.json({
    success: true,
    data,
  });
}

export async function getDailyReportController(req: Request, res: Response) {
  const query = dashboardPeriodSchema.parse(req.query);

  const data = await getDailyReport(query.startDate, query.endDate);

  res.json({
    success: true,
    data,
  });
}
