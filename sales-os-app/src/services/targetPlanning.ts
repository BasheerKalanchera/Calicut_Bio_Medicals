import api from "../lib/api";
import type {
  TargetPlan,
  TargetPlanCreate,
  TargetPlanUpdate,
  TargetPlanApprovalDecision,
  SbuTargetRollup,
} from "../types/targetPlanning";

export async function listTargetPlans(): Promise<TargetPlan[]> {
  const response = await api.get("/planning/targets");
  return response.data.data;
}

export async function listPendingApproval(): Promise<TargetPlan[]> {
  const response = await api.get("/planning/targets/pending-approval");
  return response.data.data;
}

export async function listTeamTargets(sbuId: string, planningPeriod: string): Promise<TargetPlan[]> {
  const response = await api.get("/planning/targets/team", {
    params: { sbu_id: sbuId, planning_period: planningPeriod },
  });
  return response.data.data;
}

export async function getSbuRollup(sbuId: string, planningPeriod: string): Promise<SbuTargetRollup> {
  const response = await api.get("/planning/targets/rollup", {
    params: { sbu_id: sbuId, planning_period: planningPeriod },
  });
  return response.data.data;
}

export async function createTargetPlan(data: TargetPlanCreate): Promise<TargetPlan> {
  const response = await api.post("/planning/targets", data);
  return response.data.data;
}

export async function updateTargetPlan(id: string, data: TargetPlanUpdate): Promise<TargetPlan> {
  const response = await api.patch(`/planning/targets/${id}`, data);
  return response.data.data;
}

export async function approveTargetPlan(id: string, data: TargetPlanApprovalDecision): Promise<TargetPlan> {
  const response = await api.post(`/planning/targets/${id}/approve`, data);
  return response.data.data;
}

export async function rejectTargetPlan(id: string, data: TargetPlanApprovalDecision): Promise<TargetPlan> {
  const response = await api.post(`/planning/targets/${id}/reject`, data);
  return response.data.data;
}
