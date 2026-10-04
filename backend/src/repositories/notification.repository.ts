import { prisma } from "../lib/prisma.js";
import type { NotificationType, UserRole } from "../generated/prisma/client.js";

export async function findNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });
}

export async function countUnreadNotificationsByUserId(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function findNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: {
      id,
    },
  });
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  return prisma.notification.create({
    data,
  });
}

export async function createNotificationsForRole(
  role: UserRole,
  data: {
    title: string;
    message: string;
    type: NotificationType;
  },
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      role,
      status: "ACTIVE",
      ...(excludeUserId
        ? {
            id: {
              not: excludeUserId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (users.length === 0) {
    return [];
  }

  return prisma.notification.createManyAndReturn({
    data: users.map((user) => ({
      userId: user.id,
      title: data.title,
      message: data.message,
      type: data.type,
    })),
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
