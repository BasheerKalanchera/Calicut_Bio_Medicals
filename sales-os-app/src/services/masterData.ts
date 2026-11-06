import api from "../lib/api";
import type { UserBlastRadius, UserCreate, UserListResponse, UserUpdate } from "../types/api-aliases";

export async function listSbus(): Promise<unknown> {
  const response = await api.get("/master-data/sbus");
  return response.data.data;
}

export async function listZones(): Promise<unknown> {
  const response = await api.get("/master-data/zones");
  return response.data.data;
}

export interface ZoneSearchResult {
  id: string;
  name: string;
  path: string;
}

export async function searchZones(q: string): Promise<ZoneSearchResult[]> {
  const response = await api.get("/master-data/zones/search", { params: { q } });
  return response.data.data;
}

// Add/Edit Hospital only -- scoped server-side to the rep's own territory
// (Admin/GM still get the unrestricted search). See master_data.py's
// search_zones_for_hospital for why this is a separate endpoint rather than
// a flag on searchZones above.
export async function searchZonesForHospital(q: string): Promise<ZoneSearchResult[]> {
  const response = await api.get("/master-data/zones/search-for-hospital", { params: { q } });
  return response.data.data;
}

export async function listProjectStatuses(): Promise<unknown> {
  const response = await api.get("/master-data/project-statuses");
  return response.data.data;
}

export async function listStages(): Promise<unknown> {
  const response = await api.get("/master-data/stages");
  return response.data.data;
}

export async function listStatuses(): Promise<unknown> {
  const response = await api.get("/master-data/statuses");
  return response.data.data;
}

export async function listLeadSources(): Promise<unknown> {
  const response = await api.get("/master-data/lead-sources");
  return response.data.data;
}

export async function listUsers(
  scope: "scoped" | "sbu" | "all" = "scoped",
  includeInactive = false
): Promise<UserListResponse[]> {
  const response = await api.get(
    `/users?page_size=100&scope=${scope}&include_inactive=${includeInactive}`
  );
  return response.data.data.items;
}

// The people a screen offers as "which rep?": the same list as listUsers, minus
// Marketing Users. A Marketing User owns no Opportunities or follow-ups and
// belongs to the Marketing module only, so a rep picker or filter must never
// offer one. Use this for every rep picker; use listUsers only where the full
// list is wanted (the User Directory). Callers use their own query key
// (["users", "reps", ...]) so this filtered list never shares a cache entry
// with the full one. Wider sweep: docs/Backlog.md "Marketing User sees only
// the Marketing module".
export async function listRepUsers(
  scope: "scoped" | "sbu" | "all" = "scoped",
  includeInactive = false
): Promise<UserListResponse[]> {
  const users = await listUsers(scope, includeInactive);
  return users.filter((u) => u.role_name !== "Marketing User");
}

export async function getUserBlastRadius(userId: string): Promise<UserBlastRadius> {
  const response = await api.get(`/users/${userId}/blast-radius`);
  return response.data.data;
}

export async function deactivateUser(userId: string): Promise<UserListResponse> {
  const response = await api.post(`/users/${userId}/deactivate`);
  return response.data.data;
}

export async function reactivateUser(userId: string): Promise<UserListResponse> {
  const response = await api.post(`/users/${userId}/reactivate`);
  return response.data.data;
}

export async function listRoles(): Promise<unknown> {
  const response = await api.get("/master-data/roles");
  return response.data.data;
}

export async function createUser(data: UserCreate): Promise<UserListResponse> {
  const response = await api.post("/users", data);
  return response.data.data;
}

export async function updateUser(userId: string, data: UserUpdate): Promise<UserListResponse> {
  const response = await api.patch(`/users/${userId}`, data);
  return response.data.data;
}

export async function listLossReasons(): Promise<unknown> {
  const response = await api.get("/master-data/loss-reasons");
  return response.data.data;
}

export async function listHoldReasons(): Promise<unknown> {
  const response = await api.get("/master-data/hold-reasons");
  return response.data.data;
}

export async function listGateOverrideReasons(): Promise<unknown> {
  const response = await api.get("/master-data/gate-override-reasons");
  return response.data.data;
}
