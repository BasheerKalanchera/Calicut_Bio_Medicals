export type PipelineGroupBy = "stage" | "rep" | "sbu" | "zone";

export interface PipelineSummaryRow {
  group_id: string;
  group_name: string;
  opportunity_count: number;
  total_value_lakhs: string;
  unweighted_forecast_lakhs: string;
  weighted_forecast_lakhs: string;
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
}

export interface OverdueActionsResponse {
  rows: OverdueActionRow[];
  total_overdue: number;
}

export interface ReportingFilters {
  sbu_id?: string;
  zone_id?: string;
  user_id?: string;
}
