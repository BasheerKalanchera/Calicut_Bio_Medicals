import api from "../lib/api";
import type { ActivityPage, ActivityResponse, ReminderResponse } from "../types/api";

export interface LogActivityPayload {
  account_id: string;
  opportunity_id?: string;
  project_id?: string;
  user_id?: string;
  activity_type: string;
  activity_date: string;
  notes?: string;
  // BR-ACT-04: required unless activity_type is MANAGER_NOTE.
  next_action_text?: string;
  next_action_due_date?: string;
  next_action_owner_id?: string;
}

export async function listActivitiesByAccount(
  accountId: string,
  page = 1,
  pageSize = 50,
): Promise<ActivityPage> {
  const r = await api.get(`/accounts/${accountId}/activities`, {
    params: { page, page_size: pageSize },
  });
  return r.data.data;
}

export async function listActivitiesByOpportunity(
  opportunityId: string,
  page = 1,
  pageSize = 50,
): Promise<ActivityPage> {
  const r = await api.get(`/opportunities/${opportunityId}/activities`, {
    params: { page, page_size: pageSize },
  });
  return r.data.data;
}

export async function listActivitiesByProject(
  projectId: string,
  page = 1,
  pageSize = 50,
): Promise<ActivityPage> {
  const r = await api.get(`/projects/${projectId}/activities`, {
    params: { page, page_size: pageSize },
  });
  return r.data.data;
}

export async function logActivity(
  payload: LogActivityPayload,
): Promise<ActivityResponse> {
  const r = await api.post("/activities", payload);
  return r.data.data;
}

export async function listReminders(
  includeCompleted = false,
): Promise<ReminderResponse[]> {
  const r = await api.get("/reminders", {
    params: { include_completed: includeCompleted, page_size: 50 },
  });
  return r.data.data.items;
}

export async function listOpportunityReminders(
  opportunityId: string,
  includeCompleted = false,
): Promise<ReminderResponse[]> {
  const r = await api.get(`/opportunities/${opportunityId}/reminders`, {
    params: { include_completed: includeCompleted, page_size: 50 },
  });
  return r.data.data.items;
}

export async function createReminder(payload: {
  activity_id: string;
  assigned_to_user_id: string;
  due_date: string;
  reminder_text: string;
}): Promise<ReminderResponse> {
  const r = await api.post("/reminders", payload);
  return r.data.data;
}

export async function patchReminder(
  reminderId: string,
  isCompleted: boolean,
): Promise<ReminderResponse> {
  const r = await api.patch(`/reminders/${reminderId}`, { is_completed: isCompleted });
  return r.data.data;
}
