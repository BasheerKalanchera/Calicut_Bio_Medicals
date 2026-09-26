import api from "../lib/api";
import type {
  PipelinePage,
  PipelineOpportunity,
  SplitResponse,
  SplitEditPermission,
  StakeholderLinkResponse,
  OpportunityItemResponse,
  OpportunityForStakeholder,
  StakeholderOpportunityCountsEntry,
} from "../types/api-aliases";

export interface PipelineParams {
  account_id?: string;
  stage_id?: string;
  status_id?: string;
  owner_id?: string;
  zone_id?: string;
  sbu_id?: string;
  product_id?: string;
  brand_id?: string;
  has_trade_in?: boolean;
  closed_from?: string;
  closed_to?: string;
  owner_team_only?: boolean;
  page?: number;
  page_size?: number;
}

export async function listPipeline(params: PipelineParams = {}): Promise<PipelinePage> {
  const p: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 500,
  };
  if (params.account_id) p.account_id = params.account_id;
  if (params.stage_id)   p.stage_id   = params.stage_id;
  if (params.status_id)  p.status_id  = params.status_id;
  if (params.owner_id)   p.owner_id   = params.owner_id;
  if (params.zone_id)    p.zone_id    = params.zone_id;
  if (params.sbu_id)     p.sbu_id     = params.sbu_id;
  if (params.product_id) p.product_id = params.product_id;
  if (params.brand_id)   p.brand_id   = params.brand_id;
  if (params.has_trade_in) p.has_trade_in = true;
  if (params.closed_from) p.closed_from = params.closed_from;
  if (params.closed_to)   p.closed_to   = params.closed_to;
  if (params.owner_team_only) p.owner_team_only = true;
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

// BR-FIN-08: whether the current user may change this opportunity's split.
export async function canEditOpportunitySplits(opportunityId: string): Promise<SplitEditPermission> {
  const response = await api.get(`/opportunities/${opportunityId}/splits/can-edit`);
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
