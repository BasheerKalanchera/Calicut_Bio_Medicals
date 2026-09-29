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

export type PlanWarningKind = "HIGH_POTENTIAL_ZERO" | "SAME_SBU_OVERLAP";

export interface PlanWarning {
  kind: PlanWarningKind;
  account_id: string;
  account_name: string;
  colleague_name: string | null;
}

export interface ZoneRollupEntry {
  zone_id: string | null;
  zone_name: string | null;
  planned_amount_lakhs: string;
  hospital_count: number;
  person_count: number;
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

export interface TargetPlanApprovalDecision {
  status: "APPROVED" | "REJECTED";
  note?: string | null;
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
