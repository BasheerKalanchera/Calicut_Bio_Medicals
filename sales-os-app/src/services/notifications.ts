import api from "../lib/api";
import type { NotificationResponse, UnreadCountResponse } from "../types/api-aliases";

export async function listNotifications(limit = 20): Promise<NotificationResponse[]> {
  const r = await api.get("/notifications", { params: { limit } });
  return r.data.data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const r = await api.get("/notifications/unread-count");
  return r.data.data;
}

export async function listUrgentUnread(): Promise<NotificationResponse[]> {
  const r = await api.get("/notifications/urgent-unread");
  return r.data.data;
}
