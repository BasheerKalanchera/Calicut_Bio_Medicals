import api from "../lib/api";
import type { ActivityPage, ActivityReportPage, ActivityResponse, ActivityType, ReminderResponse } from "../types/api";

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

export interface ActivityReportParams {
  report_date: string; // YYYY-MM-DD
  user_id?: string;
  page?: number;
  page_size?: number;
}

export async function listActivityReport(params: ActivityReportParams): Promise<ActivityReportPage> {
  const p: Record<string, string | number> = {
    report_date: params.report_date,
    page: params.page ?? 1,
    page_size: params.page_size ?? 100,
  };
  if (params.user_id) p.user_id = params.user_id;
  const r = await api.get("/activities", { params: p });
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

// BR-ACT-05: completing a reminder requires documenting what was done to
// close it out (mirrors BR-ACT-04's own strictness in the opposite
// direction). next_action_* fields are optional — a follow-up discovered
// while closing this one, not a requirement (unlike BR-ACT-04's own next
// action). Must be provided together if provided at all.
export async function completeReminder(
  reminderId: string,
  payload: {
    activity_type: ActivityType;
    activity_date: string;
    notes: string;
    next_action_text?: string;
    next_action_due_date?: string;
    next_action_owner_id?: string;
  },
): Promise<ReminderResponse> {
  const r = await api.patch(`/reminders/${reminderId}`, { is_completed: true, ...payload });
  return r.data.data;
}
