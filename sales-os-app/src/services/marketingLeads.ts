import api from "../lib/api";
import type { MarketingLeadCreate, MarketingLeadDiscard, MarketingLeadResponse } from "../types/api-aliases";

export type MarketingLead = MarketingLeadResponse;

export async function listMarketingLeads(): Promise<MarketingLead[]> {
  const r = await api.get("/marketing-leads");
  return r.data.data;
}

export async function createMarketingLead(payload: MarketingLeadCreate): Promise<MarketingLead> {
  const r = await api.post("/marketing-leads", payload);
  return r.data.data;
}

export async function discardMarketingLead(leadId: string, payload: MarketingLeadDiscard): Promise<MarketingLead> {
  const r = await api.patch(`/marketing-leads/${leadId}/discard`, payload);
  return r.data.data;
}

export async function markMarketingLeadConverted(leadId: string, convertedOpportunityId: string): Promise<MarketingLead> {
  const r = await api.patch(`/marketing-leads/${leadId}/mark-converted`, {
    converted_opportunity_id: convertedOpportunityId,
  });
  return r.data.data;
}
