import type { NotificationType, UserRole } from "../generated/prisma/client.js";

import {
  findNotificationsByUserId,
  findNotificationById,
  createNotification,
  createNotificationsForRole,
  countUnreadNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../repositories/notification.repository.js";

export async function createNewNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  return createNotification(data);
}

export async function notifyRole(data: {
  role: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  excludeUserId?: string;
}) {
  return createNotificationsForRole(
    data.role,
    {
      title: data.title,
      message: data.message,
      type: data.type,
    },
    data.excludeUserId,
  );
}

export async function getMyNotifications(userId: string) {
  return findNotificationsByUserId(userId);
}

export async function getUnreadNotificationCount(userId: string) {
  return countUnreadNotificationsByUserId(userId);
}

export async function markNotificationRead(id: string, userId: string) {
  const notification = await findNotificationById(id);

  if (!notification) {
    throw new Error("Notification tidak ditemukan");
  }

  if (notification.userId !== userId) {
    throw new Error("Anda tidak memiliki akses ke notification ini");
  }

  if (notification.isRead) {
    return notification;
  }

  return markNotificationAsRead(id);
}

export async function markAllNotificationsRead(userId: string) {
  return markAllNotificationsAsRead(userId);
}
