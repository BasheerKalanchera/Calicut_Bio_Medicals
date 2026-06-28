import api from "../lib/api";

export async function listAccounts({ search, zone_id, page = 1, page_size = 50 } = {}) {
  const params = { page, page_size };
  if (search) params.search = search;
  if (zone_id) params.zone_id = zone_id;
  const response = await api.get("/accounts", { params });
  return response.data.data;
}

export async function getAccount(accountId) {
  const response = await api.get(`/accounts/${accountId}`);
  return response.data.data;
}

export async function getAccountCounts(ids) {
  const response = await api.get("/accounts/counts", { params: { ids: ids.join(",") } });
  return response.data.data;
}

export async function createAccount(data) {
  const response = await api.post("/accounts", data);
  return response.data.data;
}

export async function updateAccount(accountId, data) {
  const response = await api.put(`/accounts/${accountId}`, data);
  return response.data.data;
}

export async function getWorkspace(accountId) {
  const response = await api.get(`/accounts/${accountId}/workspace`);
  return response.data.data;
}

export async function listOpportunities(accountId) {
  const response = await api.get(`/accounts/${accountId}/opportunities`);
  return response.data.data;
}

export async function listProjects(accountId) {
  const response = await api.get(`/accounts/${accountId}/projects`);
  return response.data.data;
}

export async function listInstalledAssets(accountId) {
  const response = await api.get(`/accounts/${accountId}/installed-assets`);
  return response.data.data;
}

export async function listStakeholders(accountId) {
  const response = await api.get(`/accounts/${accountId}/stakeholders`);
  return response.data.data;
}

export async function createStakeholder(accountId, data) {
  const response = await api.post(`/accounts/${accountId}/stakeholders`, data);
  return response.data.data;
}

export async function updateStakeholder(stakeholderId, data) {
  const response = await api.put(`/stakeholders/${stakeholderId}`, data);
  return response.data.data;
}

export async function createProject(accountId, data) {
  const response = await api.post(`/accounts/${accountId}/projects`, data);
  return response.data.data;
}

export async function updateProject(projectId, data) {
  const response = await api.put(`/projects/${projectId}`, data);
  return response.data.data;
}

export async function createInstalledAsset(accountId, data) {
  const response = await api.post(`/accounts/${accountId}/installed-assets`, data);
  return response.data.data;
}

export async function updateInstalledAsset(assetId, data) {
  const response = await api.put(`/installed-assets/${assetId}`, data);
  return response.data.data;
}

export async function createOpportunity(accountId, data) {
  const response = await api.post(`/accounts/${accountId}/opportunities`, data);
  return response.data.data;
}

export async function updateOpportunity(opportunityId, data) {
  const response = await api.put(`/opportunities/${opportunityId}`, data);
  return response.data.data;
}

export async function listOpportunityItems(opportunityId) {
  const response = await api.get(`/opportunities/${opportunityId}/items`);
  return response.data.data;
}

export async function addOpportunityItem(opportunityId, data) {
  const response = await api.post(`/opportunities/${opportunityId}/items`, data);
  return response.data.data;
}

export async function deleteOpportunityItem(itemId) {
  await api.delete(`/opportunity-items/${itemId}`);
}
