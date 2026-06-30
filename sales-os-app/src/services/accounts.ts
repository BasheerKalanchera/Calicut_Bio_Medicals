import api from "../lib/api";

type Params = Record<string, string | number | boolean>;

export async function listAccounts(
  { search, zone_id, page = 1, page_size = 50 }: { search?: string; zone_id?: number; page?: number; page_size?: number } = {}
): Promise<unknown> {
  const params: Params = { page, page_size };
  if (search) params.search = search;
  if (zone_id) params.zone_id = zone_id;
  const response = await api.get("/accounts", { params });
  return response.data.data;
}

export async function getAccount(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}`);
  return response.data.data;
}

export async function getAccountCounts(ids: number[]): Promise<unknown> {
  const response = await api.get("/accounts/counts", { params: { ids: ids.join(",") } });
  return response.data.data;
}

export async function createAccount(data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post("/accounts", data);
  return response.data.data;
}

export async function updateAccount(accountId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/accounts/${accountId}`, data);
  return response.data.data;
}

export async function getWorkspace(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}/workspace`);
  return response.data.data;
}

export async function listOpportunities(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}/opportunities`);
  return response.data.data;
}

export async function listProjects(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}/projects`);
  return response.data.data;
}

export async function listInstalledAssets(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}/installed-assets`);
  return response.data.data;
}

export async function listStakeholders(accountId: number): Promise<unknown> {
  const response = await api.get(`/accounts/${accountId}/stakeholders`);
  return response.data.data;
}

export async function createStakeholder(accountId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post(`/accounts/${accountId}/stakeholders`, data);
  return response.data.data;
}

export async function updateStakeholder(stakeholderId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/stakeholders/${stakeholderId}`, data);
  return response.data.data;
}

export async function createProject(accountId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post(`/accounts/${accountId}/projects`, data);
  return response.data.data;
}

export async function updateProject(projectId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/projects/${projectId}`, data);
  return response.data.data;
}

export async function createInstalledAsset(accountId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post(`/accounts/${accountId}/installed-assets`, data);
  return response.data.data;
}

export async function updateInstalledAsset(assetId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/installed-assets/${assetId}`, data);
  return response.data.data;
}

export async function createOpportunity(accountId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post(`/accounts/${accountId}/opportunities`, data);
  return response.data.data;
}

export async function updateOpportunity(opportunityId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.put(`/opportunities/${opportunityId}`, data);
  return response.data.data;
}

export async function listOpportunityItems(opportunityId: number): Promise<unknown> {
  const response = await api.get(`/opportunities/${opportunityId}/items`);
  return response.data.data;
}

export async function addOpportunityItem(opportunityId: number, data: Record<string, unknown>): Promise<unknown> {
  const response = await api.post(`/opportunities/${opportunityId}/items`, data);
  return response.data.data;
}

export async function deleteOpportunityItem(itemId: number): Promise<void> {
  await api.delete(`/opportunity-items/${itemId}`);
}
