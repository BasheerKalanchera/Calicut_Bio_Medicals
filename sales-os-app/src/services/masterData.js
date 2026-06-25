import api from "../lib/api";

export async function listSbus() {
  const response = await api.get("/master-data/sbus");
  return response.data.data;
}

export async function listProjectStatuses() {
  const response = await api.get("/master-data/project-statuses");
  return response.data.data;
}

export async function listStages() {
  const response = await api.get("/master-data/stages");
  return response.data.data;
}

export async function listStatuses() {
  const response = await api.get("/master-data/statuses");
  return response.data.data;
}

export async function listUsers() {
  const response = await api.get("/users?page_size=100");
  return response.data.data.items;
}
