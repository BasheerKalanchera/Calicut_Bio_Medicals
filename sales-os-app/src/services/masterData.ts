import api from "../lib/api";
import type { UserCreate, UserListResponse, UserUpdate } from "../types/api";

export async function listSbus(): Promise<unknown> {
  const response = await api.get("/master-data/sbus");
  return response.data.data;
}

export async function listZones(): Promise<unknown> {
  const response = await api.get("/master-data/zones");
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

export async function listUsers(): Promise<UserListResponse[]> {
  const response = await api.get("/users?page_size=100");
  return response.data.data.items;
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
