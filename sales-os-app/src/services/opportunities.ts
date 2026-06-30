import api from "../lib/api";
import type {
  PipelinePage,
  PipelineOpportunity,
  SplitResponse,
  StakeholderLinkResponse,
  OpportunityItemResponse,
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
