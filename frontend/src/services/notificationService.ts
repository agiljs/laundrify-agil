import api from "./api";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationResponse {
  success: boolean;
  data: NotificationItem[];
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const response = await api.get<NotificationResponse>("/notifications");

  return response.data.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
