import api from "../lib/api";
import type {
  ActivityCommentResponse,
  ActivityPage,
  ActivityReportPage,
  ActivityResponse,
  ActivityType,
  ReminderResponse,
} from "../types/api-aliases";

export interface LogActivityPayload {
  // BR-ACT-01/BR-ACT-09: required unless activity_type is one of the six
  // Sales Development Activity types.
  account_id?: string;
  opportunity_id?: string;
  project_id?: string;
  user_id?: string;
  activity_type: string;
  activity_date: string;
  notes?: string;
  // BR-ACT-09: required when activity_type is a Sales Development type.
  outcome_notes?: string;
  // BR-ACT-04: required unless activity_type is MANAGER_NOTE, a Sales
  // Development type, or RELATIONSHIP_SUPPORT (BR-ACT-10).
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

// BR-ACT-10: feeds the "Related Opportunity" picker for Relationship
// Support -- deliberately unscoped by the caller's own SBU/zone tier, the
// same narrow widening as cabio_app_account_opportunities() itself. Only
// ever called when Relationship Support is selected (a frontend
// convention, not the backend's enforcement mechanism).
export async function listAccountOpportunitiesLookup(
  accountId: string,
): Promise<{ id: string; name: string }[]> {
  const r = await api.get(`/accounts/${accountId}/opportunities/lookup`);
  return r.data.data;
}

export async function logActivity(
  payload: LogActivityPayload,
): Promise<ActivityResponse> {
  const r = await api.post("/activities", payload);
  return r.data.data;
}

export async function listActivityComments(activityId: string): Promise<ActivityCommentResponse[]> {
  const r = await api.get(`/activities/${activityId}/comments`);
  return r.data.data;
}

export async function createActivityComment(
  activityId: string,
  body: string,
): Promise<ActivityCommentResponse> {
  const r = await api.post(`/activities/${activityId}/comments`, { body });
  return r.data.data;
}

// Hospital-next-action plan D6: the next-action lists show every row, not the
// first page. Walks the pages at the router's maximum page size (100).
async function fetchAllReminderPages(
  url: string,
  params: Record<string, string | number | boolean>,
): Promise<ReminderResponse[]> {
  const all: ReminderResponse[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const r = await api.get(url, { params: { ...params, page, page_size: 100 } });
    all.push(...r.data.data.items);
    totalPages = r.data.data.total_pages;
    page += 1;
  }
  return all;
}

export async function listReminders(
  includeCompleted = false,
  dueAfter?: string,
  dueBefore?: string,
): Promise<ReminderResponse[]> {
  const params: Record<string, string | number | boolean> = { include_completed: includeCompleted };
  if (dueAfter) params.due_after = dueAfter;
  if (dueBefore) params.due_before = dueBefore;
  return fetchAllReminderPages("/reminders", params);
}

export async function listOpportunityReminders(
  opportunityId: string,
  includeCompleted = false,
): Promise<ReminderResponse[]> {
  return fetchAllReminderPages(`/opportunities/${opportunityId}/reminders`, {
    include_completed: includeCompleted,
  });
}

// Hospital-next-action plan D9: every next action on a Project -- its own and
// those on the Opportunities under it.
export async function listProjectReminders(
  projectId: string,
  includeCompleted = false,
): Promise<ReminderResponse[]> {
  return fetchAllReminderPages(`/projects/${projectId}/reminders`, {
    include_completed: includeCompleted,
  });
}

// Hospital-next-action plan: every open next action at a hospital -- or, with
// hospitalLevelOnly, just those with no Opportunity and no Project. Plan D14:
// assignedToUserId keeps one person's, projectId keeps those logged on that
// Project with no Opportunity -- the pop-ups ask for exactly what they need.
export async function listAccountReminders(
  accountId: string,
  {
    includeCompleted = false,
    hospitalLevelOnly = false,
    assignedToUserId,
    projectId,
  }: {
    includeCompleted?: boolean;
    hospitalLevelOnly?: boolean;
    assignedToUserId?: string;
    projectId?: string;
  } = {},
): Promise<ReminderResponse[]> {
  const params: Record<string, string | number | boolean> = {
    include_completed: includeCompleted,
    hospital_level: hospitalLevelOnly,
  };
  if (assignedToUserId) params.assigned_to_user_id = assignedToUserId;
  if (projectId) params.project_id = projectId;
  return fetchAllReminderPages(`/accounts/${accountId}/reminders`, params);
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
    // Next-action rules plan D2: the "logged for" person the closing
    // activity is recorded under (defaults to whoever is closing).
    user_id?: string;
    // Plan D3: a hospital-level next action closed by the new Opportunity
    // its visit produced, instead of a follow-up.
    produced_opportunity_id?: string;
    // Plan D22: the same person's other open next actions on this
    // Opportunity, closed together with this one.
    also_close_ids?: string[];
  },
): Promise<ReminderResponse> {
  const r = await api.patch(`/reminders/${reminderId}`, { is_completed: true, ...payload });
  return r.data.data;
}
