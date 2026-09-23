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

export type TargetPlanStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

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
  brand_splits: BrandSplitResponse[];
  created_at: string;
  updated_at: string;
}

export interface TargetPlanCreate {
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: number;
  brand_splits?: BrandSplitEntry[];
}

export interface TargetPlanUpdate {
  target_amount_lakhs: number;
  brand_splits?: BrandSplitEntry[];
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
