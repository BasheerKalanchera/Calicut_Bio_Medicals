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

// entity_type "activity" (MANAGER_NOTE_ADDED) has no per-entity detail GET
// route to piggyback a read-receipt on the way OPPORTUNITY_ASSIGNED does off
// GET /opportunities/{id} -- called explicitly when the recipient opens it.
export async function markNotificationRead(entityType: string, entityId: string): Promise<void> {
  await api.post("/notifications/mark-read", { entity_type: entityType, entity_id: entityId });
}
