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

export interface SbuTargetRollup {
  sbu_id: string;
  planning_period: string;
  total_target_amount_lakhs: string;
  user_count: number;
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

// A roster member's plan for the quarter. PENDING_APPROVAL shows as "Waiting".
export type RosterStatus = "NOT_STARTED" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

// BR-OP-16: still open past its expected closing date. Flag only.
export interface TargetVsActualLateOpportunity {
  opportunity_id: string;
  name: string;
  account_id: string;
  account_name: string;
  expected_closure_date: string;
  value_lakhs: string;
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

// The SBU row (SBU Manager and above) or company row (Admin/GM).
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
  people: TargetVsActualPerson[];
  zones: TargetVsActualZone[];
  brands: TargetVsActualBrand[];
}

// One GM-entered target per SBU per quarter (sbu_target register).
export interface SbuTarget {
  id: string;
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: string;
}

export interface SbuTargetSet {
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: number;
}
