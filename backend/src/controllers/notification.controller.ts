import type { Request, Response } from "express";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service.js";

import { getParamId } from "../utils/request.js";

export async function getMyNotificationsController(
  req: Request,
  res: Response,
) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const notifications = await getMyNotifications(user.id);

  res.json({
    success: true,
    data: notifications,
  });
}

export async function getUnreadNotificationCountController(
  req: Request,
  res: Response,
) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const count = await getUnreadNotificationCount(user.id);

  res.json({
    success: true,
    data: {
      count,
    },
  });
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
) {
  const id = getParamId(req.params);

  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const notification = await markNotificationRead(id, user.id);

  res.json({
    success: true,
    message: "Notification ditandai sudah dibaca",
    data: notification,
  });
}

export async function markAllNotificationsReadController(
  req: Request,
  res: Response,
) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const result = await markAllNotificationsRead(user.id);

  res.json({
    success: true,
    message: "Semua notification ditandai sudah dibaca",
    data: {
      count: result.count,
    },
  });
}
