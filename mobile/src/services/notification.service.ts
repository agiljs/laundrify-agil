import { api } from "./api";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export async function getMyNotifications() {
  const response = await api.get<{ data: NotificationItem[] }>("/notifications");
  return response.data.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.patch<{ data: NotificationItem }>(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{ data: { count: number } }>("/notifications/read-all");
  return response.data.data;
}
