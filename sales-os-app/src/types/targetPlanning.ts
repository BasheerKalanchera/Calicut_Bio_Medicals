// Hand-written to match backend/app/domains/planning/schemas.py exactly,
// following the existing types/territoryAdmin.ts pattern.

export interface TargetPlanUser {
  id: string;
  display_name: string;
}

export interface TargetPlanSbu {
  id: string;
  name: string;
}

// DRAFT (Hospital-Wise Target Planning): private to its owner until submitted.
export type TargetPlanStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface BrandNested {
  id: string;
  name: string;
}

export interface BrandSplitEntry {
  brand_id: string;
  split_amount_lakhs: number;
}

export interface BrandSplitResponse {
  id: string;
  brand_id: string;
  brand: BrandNested;
  split_amount_lakhs: string;
}

// Fixed list (Hospital-Wise Target Planning plan, choice 2) -- matches the
// backend VisitFrequency enum and the CHECK constraint in migration 0055.
export type VisitFrequency = "WEEKLY" | "BI_WEEKLY" | "MONTHLY" | "QUARTERLY" | "AS_NEEDED";

export interface PlanZone {
  id: string;
  name: string;
}

// A hospital as the plan dialog's picker returns it (territory-limited).
export interface EligibleAccount {
  id: string;
  name: string;
  business_potential: string;
  zone: PlanZone;
}

export interface PlanAccount {
  id: string;
  account_id: string;
  account: EligibleAccount;
  planned_amount_lakhs: string;
  visit_frequency: VisitFrequency;
  strategic_objective: string | null;
}

export interface PlanAccountEntry {
  account_id: string;
  planned_amount_lakhs: number;
  visit_frequency: VisitFrequency;
  strategic_objective?: string | null;
}

export type PlanWarningKind = "HIGH_POTENTIAL_ZERO" | "RATED_POTENTIAL_ZERO" | "SAME_SBU_OVERLAP";

export interface PlanWarning {
  kind: PlanWarningKind;
  account_id: string;
  account_name: string;
  colleague_name: string | null;
}

export interface TargetPlan {
  id: string;
  user_id: string;
  user: TargetPlanUser;
  sbu_id: string;
  sbu: TargetPlanSbu;
  planning_period: string;
  target_amount_lakhs: string;
  status: TargetPlanStatus;
  approved_by: string | null;
  approver: TargetPlanUser | null;
  approved_at: string | null;
  decision_note: string | null;
  // The owner's latest "why it changed" note on a revision.
  change_note: string | null;
  // BR-PL-05: the last approved total, kept while a revision of an approved
  // plan is in flight; cleared when that revision is approved.
  previous_approved_total_lakhs: string | null;
  brand_splits: BrandSplitResponse[];
  accounts: PlanAccount[];
  // Filled on create/update responses only.
  warnings: PlanWarning[];
  created_at: string;
  updated_at: string;
}

// The target amount is never sent -- the server sets it to the sum of the
// hospitals' planned amounts. submit=false saves (or keeps) a DRAFT.
export interface TargetPlanCreate {
  sbu_id: string;
  planning_period: string;
  accounts: PlanAccountEntry[];
  brand_splits?: BrandSplitEntry[];
  submit: boolean;
}

// change_note is required once the plan has been submitted (server-checked).
export interface TargetPlanUpdate {
  accounts: PlanAccountEntry[];
  brand_splits?: BrandSplitEntry[];
  change_note?: string | null;
  submit: boolean;
}

// expected_updated_at: the plan's updated_at as the approver's screen loaded
// it -- the server refuses (409) if the rep has saved since (BR-PL-08).
export interface TargetPlanApprovalDecision {
  status: "APPROVED" | "REJECTED";
  note?: string | null;
  expected_updated_at: string;
}

export interface BrandVendorTargetSet {
  brand_id: string;
  planning_period: string;
  vendor_target_amount_lakhs: number;
}

export interface BrandVendorTarget {
  id: string;
  brand_id: string;
  brand: BrandNested;
  planning_period: string;
  vendor_target_amount_lakhs: string;
}

export interface BrandRollup {
  brand_id: string;
  planning_period: string;
  committed_total: string;
  vendor_target: string | null;
  gap: string | null;
}

// Target vs Actuals (Insights Dashboard). Decimals arrive as strings.
export type QuarterState = "CURRENT" | "PAST" | "FUTURE";

// A roster member's plan for the quarter, on Target vs Actuals and the
// Target Planning roster alike.
export type RosterStatus = "NOT_STARTED" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

// One row of the Target Planning roster (Target-Coverage-Roster plan).
export interface TargetRosterPerson {
  user_id: string;
  display_name: string;
  // false: no longer on the team (moved SBU, deactivated); listed last, their
  // plan still counts in the total, not part of "N of M".
  on_team: boolean;
  plan_status: RosterStatus;
  // What counts towards the total: waiting/approved plan's total, a rejected
  // revision's last approved total (BR-PL-05), else 0.
  counted_lakhs: string;
  previous_approved_total_lakhs: string | null;
  // null: no plan, or someone else's draft (status only).
  plan: TargetPlan | null;
}

// total_lakhs is the same figure as Target vs Actuals' "Team plans".
export interface TargetRosterResponse {
  sbu_id: string;
  planning_period: string;
  total_lakhs: string;
  roster_count: number;
  not_submitted_count: number;
  people: TargetRosterPerson[];
}

// BR-OP-16: still open past its expected closing date. Flag only.
export interface TargetVsActualLateOpportunity {
  opportunity_id: string;
  name: string;
  account_id: string;
  account_name: string;
  expected_closure_date: string;
  value_lakhs: string; // the Opportunity's full net value
  share_percentage: string; // this person's share; "100.00" when not shared (BR-FIN-09)
  share_lakhs: string;
  owner_name: string | null; // set when this row's person isn't the owner
}

// account_id null = the shared "Unplanned" line (wins at hospitals not on the plan).
export interface TargetVsActualHospital {
  account_id: string | null;
  account_name: string;
  planned_lakhs: string;
  won_lakhs: string;
}

export interface TargetVsActualBrand {
  brand_id: string;
  brand_name: string;
  planned_lakhs: string;
  won_lakhs: string;
}

export interface TargetVsActualPerson {
  user_id: string;
  display_name: string;
  // Draft and Rejected plans come with no figures (planned 0, no hospitals/brands).
  plan_status: RosterStatus;
  // BR-PL-05: set while a revision of an approved plan is in flight ("was ₹X approved").
  previous_approved_total_lakhs: string | null;
  // Their own quarterly target (D49); null if not set or not visible to the caller.
  target_lakhs: string | null;
  planned_lakhs: string;
  // PO date in the quarter, Lost excluded; separate from Won.
  po_received_lakhs: string;
  // BR-OP-17: Won is reached only at full payment.
  won_lakhs: string;
  // null for a past quarter.
  expected_lakhs: string | null;
  likely_finish_lakhs: string;
  // Won only; null when planned is 0.
  percent_of_target: string | null;
  undated_opportunity_count: number;
  no_po_date_count: number;
  late_opportunities: TargetVsActualLateOpportunity[];
  hospitals: TargetVsActualHospital[];
  brands: TargetVsActualBrand[];
}

// zone_id null = hospitals filed above zone level.
export interface TargetVsActualZone {
  zone_id: string | null;
  zone_name: string | null;
  planned_lakhs: string;
  won_lakhs: string;
}

// The SBU row (SBU Manager and above), company row (Admin/GM) or team row
// (Area Manager: their team's totals against their own target, D49).
// target_lakhs null = not entered yet (company: until every SBU has one).
export interface TargetVsActualSummaryRow {
  target_lakhs: string | null;
  planned_lakhs: string;
  po_received_lakhs: string;
  won_lakhs: string;
  percent_of_target: string | null;
}

export interface TargetVsActualResponse {
  sbu_id: string;
  planning_period: string;
  quarter_state: QuarterState;
  as_of: string;
  planned_lakhs: string;
  po_received_lakhs: string;
  won_lakhs: string;
  expected_lakhs: string | null;
  likely_finish_lakhs: string;
  percent_of_target: string | null;
  no_po_date_count: number;
  // "N of M haven't submitted": M = roster_count.
  roster_count: number;
  not_submitted_count: number;
  sbu_row: TargetVsActualSummaryRow | null;
  company_row: TargetVsActualSummaryRow | null;
  team_row: TargetVsActualSummaryRow | null;
  people: TargetVsActualPerson[];
  zones: TargetVsActualZone[];
  brands: TargetVsActualBrand[];
}

// The SBU's quarterly target: its brands' quarterly total, never typed
// (Annual Target Planning D47, D53, D55). null = no brand has a figure.
export interface SbuTarget {
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: string | null;
}

// --- Annual Target Planning Part 1 ---

// Shares of a year by calendar quarter, adding up to 100 (D25, D41).
export interface SeasonalPattern {
  pct_jan_mar: string;
  pct_apr_jun: string;
  pct_jul_sep: string;
  pct_oct_dec: string;
}

export interface SeasonalPatternInput {
  pct_jan_mar: number;
  pct_apr_jun: number;
  pct_jul_sep: number;
  pct_oct_dec: number;
}

export interface SbuSeasonalPattern extends SeasonalPattern {
  sbu_id: string;
  year: number;
}

export interface SbuSeasonalPatternSet extends SeasonalPatternInput {
  sbu_id: string;
  year: number;
}

export interface BrandAnnualTargetQuarter {
  planning_period: string;
  // What is saved as the brand's quarterly target (worked out from the
  // year, or typed in before 2026-Q3, D46a).
  saved_lakhs: string | null;
}

// One brand on Brand Target Tracking for a calendar year (D43).
export interface BrandAnnualTargetRow {
  brand_id: string;
  brand_name: string;
  sbu_id: string;
  year_start_month: number;
  // A yearly figure in any year, not just start_year: the year start is
  // locked once one exists (D59).
  has_any_annual: boolean;
  start_year: number;
  // null until the GM enters the brand's figure (D42).
  vendor_amount_lakhs: string | null;
  stretch_pct: string | null;
  stretched_lakhs: string | null;
  own_pattern: SeasonalPattern | null;
  // Its own pattern, else its SBU's for start_year; null if neither.
  effective_pattern: SeasonalPattern | null;
  quarters: BrandAnnualTargetQuarter[];
}

export interface BrandAnnualTargetSet {
  brand_id: string;
  start_year: number;
  vendor_amount_lakhs: number;
  stretch_pct: number;
  // null = follow the SBU's pattern (D25).
  pattern: SeasonalPatternInput | null;
}

// Target & Coverage Planning's "Your target" line and Team targets panel.
export interface TeamTargetPerson {
  user_id: string;
  display_name: string;
  role_name: string | null;
  target_lakhs: string | null;
}

export interface TeamTargetsResponse {
  planning_period: string;
  sbu_id: string | null;
  // null if not set, or Admin/GM (who have none).
  own_target_lakhs: string | null;
  reports: TeamTargetPerson[];
  reports_total_lakhs: string;
  // The caller's own target; for Admin/GM the SBU target.
  compare_to_lakhs: string | null;
}

export interface PersonQuarterTargetSet {
  user_id: string;
  planning_period: string;
  target_amount_lakhs: number;
}

export interface PersonQuarterTarget {
  user_id: string;
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: string;
}
