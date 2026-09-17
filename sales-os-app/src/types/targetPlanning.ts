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
  created_at: string;
  updated_at: string;
}

export interface TargetPlanCreate {
  sbu_id: string;
  planning_period: string;
  target_amount_lakhs: number;
}

export interface TargetPlanUpdate {
  target_amount_lakhs: number;
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
