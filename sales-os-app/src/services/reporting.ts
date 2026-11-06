import api from "../lib/api";
import type {
  OpportunitiesOnHoldResponse,
  OverdueActionsResponse,
  PipelineGroupBy,
  PipelineSummaryResponse,
  ProductPerformanceGroupBy,
  ProductPerformanceResponse,
  RepActivityLevelResponse,
  ReportingFilters,
  SalesGroupBy,
  SalesHeadline,
  SalesSummaryResponse,
  StagnantDealsResponse,
} from "../types/reporting";
import type { NoActivityCustomersResponse, WeeklyFollowupResponse } from "../types/api-aliases";
import type { ZoneSearchResult } from "./masterData";

// Customer with No Activity (docs/Exception-Report-Implementation-Plan.md):
// the server fixes the 90 days (D6), so only the two pickers are sent.
export async function getNoActivityCustomers(
  filters: { zone_id?: string; user_id?: string } = {},
): Promise<NoActivityCustomersResponse> {
  const r = await api.get("/reporting/no-activity-customers", { params: filters });
  return r.data.data;
}

// The report's Zone picker once another Rep is picked: zones in that
// person's scope. With nobody (or yourself) picked the screen keeps using
// searchZonesForHospital, your own zones.
export async function searchNoActivityZones(q: string, userId: string): Promise<ZoneSearchResult[]> {
  const r = await api.get("/reporting/no-activity-customers/zones", { params: { q, user_id: userId } });
  return r.data.data;
}

// My Work (docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md): one
// person's five lists in one request (D24). userId left out = the viewer.
export async function getWeeklyFollowup(idleDays: number, userId?: string): Promise<WeeklyFollowupResponse> {
  const r = await api.get("/reporting/weekly-followup", {
    params: { idle_days: idleDays, ...(userId && { user_id: userId }) },
  });
  return r.data.data;
}

export async function getPipelineSummary(
  groupBy: PipelineGroupBy,
  filters: ReportingFilters = {},
): Promise<PipelineSummaryResponse> {
  const r = await api.get("/reporting/pipeline-summary", {
    params: { group_by: groupBy, ...filters },
  });
  return r.data.data;
}

export async function getStagnantDeals(
  thresholdDays: number,
  filters: ReportingFilters = {},
): Promise<StagnantDealsResponse> {
  const r = await api.get("/reporting/stagnant-deals", {
    params: { threshold_days: thresholdDays, ...filters },
  });
  return r.data.data;
}

export async function getActivityLevels(
  startDate: string,
  endDate: string,
  filters: ReportingFilters = {},
): Promise<RepActivityLevelResponse> {
  const r = await api.get("/reporting/activity-levels", {
    params: { start_date: startDate, end_date: endDate, ...filters },
  });
  return r.data.data;
}

export async function getOverdueActions(filters: ReportingFilters = {}): Promise<OverdueActionsResponse> {
  const r = await api.get("/reporting/overdue-actions", { params: filters });
  return r.data.data;
}

export async function getProductPerformance(
  groupBy: ProductPerformanceGroupBy,
  filters: ReportingFilters = {},
): Promise<ProductPerformanceResponse> {
  const r = await api.get("/reporting/product-performance", {
    params: { group_by: groupBy, ...filters },
  });
  return r.data.data;
}

export async function getOpportunitiesOnHold(
  filters: ReportingFilters = {},
): Promise<OpportunitiesOnHoldResponse> {
  const r = await api.get("/reporting/opportunities-on-hold", { params: filters });
  return r.data.data;
}

export async function getSalesHeadline(filters: ReportingFilters = {}): Promise<SalesHeadline> {
  const r = await api.get("/reporting/sales-headline", { params: filters });
  return r.data.data;
}

export async function getSalesSummary(
  groupBy: SalesGroupBy,
  filters: ReportingFilters = {},
): Promise<SalesSummaryResponse> {
  const r = await api.get("/reporting/sales-summary", {
    params: { group_by: groupBy, ...filters },
  });
  return r.data.data;
}
