import api from "../lib/api";

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

export async function listUsers(): Promise<unknown> {
  const response = await api.get("/users?page_size=100");
  return response.data.data.items;
}
