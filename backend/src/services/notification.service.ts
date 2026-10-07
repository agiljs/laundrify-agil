import type { NotificationType, UserRole } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";
import { emitNotification } from "../websocket/events.js";
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
  const created = await createNotification(data);
  emitNotification(created.userId, created);
  return created;
}

export async function notifyRole(data: {
  role: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  excludeUserId?: string;
}) {
  const created = await createNotificationsForRole(
    data.role,
    {
      title: data.title,
      message: data.message,
      type: data.type,
    },
    data.excludeUserId,
  );

  for (const item of created) emitNotification(item.userId, item);
  return created;
}

/** Kirim notifikasi ke akun login milik seorang customer (bila customer punya akun). */
export async function notifyCustomer(data: {
  customerId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { userId: true },
  });
  if (!customer?.userId) return null;

  return createNewNotification({
    userId: customer.userId,
    title: data.title,
    message: data.message,
    type: data.type,
  });
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
