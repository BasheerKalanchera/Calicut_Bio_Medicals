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
  StagnantDealsResponse,
} from "../types/reporting";

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
