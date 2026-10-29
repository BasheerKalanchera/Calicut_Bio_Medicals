export type PipelineGroupBy = "stage" | "rep" | "sbu" | "zone" | "product" | "brand";

export interface PipelineSummaryRow {
  group_id: string;
  group_name: string;
  opportunity_count: number;
  total_value_lakhs: string;
  unweighted_forecast_lakhs: string;
  weighted_forecast_lakhs: string;
  // Zone breakdown only: tree indent level; true on a "<zone> (not in a
  // sub-zone)" row, which drills to that exact zone rather than its subtree.
  depth?: number | null;
  zone_exact?: boolean | null;
}

export interface PipelineSummaryResponse {
  group_by: PipelineGroupBy;
  rows: PipelineSummaryRow[];
}

export interface StagnantDealRow {
  opportunity_id: string;
  opportunity_name: string;
  account_name: string;
  owner_name: string;
  stage_name: string;
  last_activity_date: string | null;
  days_stagnant: number;
}

export interface StagnantDealsResponse {
  threshold_days: number;
  rows: StagnantDealRow[];
}

export interface RepActivityLevelRow {
  user_id: string;
  display_name: string;
  activity_count: number;
}

export interface RepActivityLevelResponse {
  start_date: string;
  end_date: string;
  rows: RepActivityLevelRow[];
}

export interface OverdueActionRow {
  user_id: string;
  display_name: string;
  overdue_count: number;
  // Redesign D5/D11: Active Opportunities past their expected closing date
  // (BR-OP-16, same rule as My Work's "Closing date passed"), with their value.
  past_closing_count: number;
  past_closing_value_lakhs: string;
}

// Insights' Overdue tab asks My Work to open on one person's list (Redesign
// D11). nonce makes a repeat of the same request count as a new one.
export interface MyWorkRequest {
  userId: string;
  tabId: "opportunities" | "next-actions";
  listId: "closing-date-passed" | "overdue";
  nonce: number;
}

export interface OverdueActionsResponse {
  rows: OverdueActionRow[];
  total_overdue: number;
}

export type ProductPerformanceGroupBy = "product" | "brand" | "sbu";

export interface ProductPerformanceRow {
  group_id: string;
  group_name: string;
  quantity_sold: number;
  revenue_lakhs: string;
  avg_selling_price_lakhs: string;
  opportunity_count: number;
  won_count: number;
  lost_count: number;
}

export interface ProductPerformanceResponse {
  group_by: ProductPerformanceGroupBy;
  rows: ProductPerformanceRow[];
}

export interface OpportunityOnHoldRow {
  opportunity_id: string;
  opportunity_name: string;
  account_name: string;
  owner_name: string;
  stage_name: string;
  hold_reason: string | null;
  reactivation_date: string | null;
  days_on_hold: number;
}

export interface OpportunitiesOnHoldResponse {
  rows: OpportunityOnHoldRow[];
}

export interface ReportingFilters {
  sbu_id?: string;
  zone_id?: string;
  user_id?: string;
  period_start?: string;
  period_end?: string;
}

export type SalesGroupBy = "rep" | "sbu" | "zone" | "product" | "brand";

export interface SalesHeadline {
  revenue_lakhs: string;
  won_count: number;
  lost_count: number;
  win_rate: string;
  avg_deal_size_lakhs: string;
}

export interface SalesSummaryRow {
  group_id: string;
  group_name: string;
  revenue_lakhs: string;
  won_count: number;
  depth?: number | null;
  zone_exact?: boolean | null;
}

export interface SalesSummaryResponse {
  group_by: SalesGroupBy;
  rows: SalesSummaryRow[];
}
