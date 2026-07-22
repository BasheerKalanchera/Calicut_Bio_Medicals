import api from "../lib/api";
import type {
  PipelinePage,
  PipelineOpportunity,
  SplitResponse,
  StakeholderLinkResponse,
  OpportunityItemResponse,
  OpportunityForStakeholder,
  StakeholderOpportunityCountsEntry,
} from "../types/api";

export interface PipelineParams {
  account_id?: string;
  stage_id?: string;
  status_id?: string;
  owner_id?: string;
  page?: number;
  page_size?: number;
}

export async function listPipeline(params: PipelineParams = {}): Promise<PipelinePage> {
  const p: Record<string, string | number> = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 100,
  };
  if (params.account_id) p.account_id = params.account_id;
  if (params.stage_id)   p.stage_id   = params.stage_id;
  if (params.status_id)  p.status_id  = params.status_id;
  if (params.owner_id)   p.owner_id   = params.owner_id;
  const response = await api.get("/opportunities/pipeline", { params: p });
  return response.data.data;
}

export async function getOpportunity(opportunityId: string): Promise<PipelineOpportunity> {
  const response = await api.get(`/opportunities/${opportunityId}`);
  return response.data.data;
}

export async function patchOpportunity(
  opportunityId: string,
  data: Record<string, unknown>,
): Promise<PipelineOpportunity> {
  const response = await api.patch(`/opportunities/${opportunityId}`, data);
  return response.data.data;
}

export async function listOpportunityItems(opportunityId: string): Promise<OpportunityItemResponse[]> {
  const response = await api.get(`/opportunities/${opportunityId}/items`);
  return response.data.data;
}

export async function replaceOpportunityItems(
  opportunityId: string,
  items: unknown[],
): Promise<OpportunityItemResponse[]> {
  const response = await api.put(`/opportunities/${opportunityId}/items`, { items });
  return response.data.data;
}

export async function listOpportunitySplits(opportunityId: string): Promise<SplitResponse[]> {
  const response = await api.get(`/opportunities/${opportunityId}/splits`);
  return response.data.data;
}

export async function replaceOpportunitySplits(
  opportunityId: string,
  splits: unknown[],
): Promise<SplitResponse[]> {
  const response = await api.put(`/opportunities/${opportunityId}/splits`, { splits });
  return response.data.data;
}

export async function listOpportunityStakeholders(
  opportunityId: string,
): Promise<StakeholderLinkResponse[]> {
  const response = await api.get(`/opportunities/${opportunityId}/stakeholders`);
  return response.data.data;
}

export async function addOpportunityStakeholder(
  opportunityId: string,
  data: { stakeholder_id: string; influence_level?: string | null; decision_role?: string | null; notes?: string | null },
): Promise<StakeholderLinkResponse> {
  const response = await api.post(`/opportunities/${opportunityId}/stakeholders`, data);
  return response.data.data;
}

export async function removeOpportunityStakeholder(
  opportunityId: string,
  stakeholderId: string,
): Promise<void> {
  await api.delete(`/opportunities/${opportunityId}/stakeholders/${stakeholderId}`);
}

export async function updateOpportunityStakeholder(
  opportunityId: string,
  stakeholderId: string,
  data: { influence_level?: string | null; decision_role?: string | null; notes?: string | null },
): Promise<StakeholderLinkResponse> {
  const response = await api.patch(`/opportunities/${opportunityId}/stakeholders/${stakeholderId}`, data);
  return response.data.data;
}

export async function listOpportunitiesForStakeholder(
  stakeholderId: string,
): Promise<OpportunityForStakeholder[]> {
  const response = await api.get(`/stakeholders/${stakeholderId}/opportunities`);
  return response.data.data;
}

export async function getStakeholderOpportunityCounts(
  stakeholderIds: string[],
): Promise<Record<string, StakeholderOpportunityCountsEntry>> {
  const response = await api.get("/stakeholders/counts", { params: { ids: stakeholderIds.join(",") } });
  return response.data.data;
}
