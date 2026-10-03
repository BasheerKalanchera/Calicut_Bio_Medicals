import api from "../lib/api";
import type {
  TargetPlan,
  TargetPlanCreate,
  TargetPlanUpdate,
  TargetPlanApprovalDecision,
  SbuTargetRollup,
  BrandVendorTarget,
  BrandVendorTargetSet,
  BrandRollup,
  EligibleAccount,
  PlanWarning,
  ZoneRollupEntry,
  PlanVsActualResponse,
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

// The plan dialog's hospital picker -- limited server-side to the caller's
// own territory (Admin/GM/SBU Manager: any hospital), 50 results max.
export async function listEligibleAccounts(search: string): Promise<EligibleAccount[]> {
  const response = await api.get("/planning/targets/eligible-accounts", {
    params: search ? { search } : {},
  });
  return response.data.data;
}

// Live "a colleague in your SBU has also planned this hospital" check.
export async function checkPlanOverlaps(
  sbuId: string,
  planningPeriod: string,
  accountIds: string[],
): Promise<PlanWarning[]> {
  if (accountIds.length === 0) return [];
  const response = await api.get("/planning/targets/overlaps", {
    params: { sbu_id: sbuId, planning_period: planningPeriod, account_ids: accountIds },
    // Repeated `account_ids=a&account_ids=b`, as FastAPI expects (see getBrandRollups).
    paramsSerializer: { indexes: null },
  });
  return response.data.data;
}

export async function getZoneRollup(sbuId: string, planningPeriod: string): Promise<ZoneRollupEntry[]> {
  const response = await api.get("/planning/targets/zone-rollup", {
    params: { sbu_id: sbuId, planning_period: planningPeriod },
  });
  return response.data.data;
}

// Planned vs Won vs Expected for one quarter -- read-only, RLS-scoped.
export async function getPlanVsActual(sbuId: string, planningPeriod: string): Promise<PlanVsActualResponse> {
  const response = await api.get("/planning/targets/plan-vs-actual", {
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

export async function getBrandRollups(brandIds: string[], planningPeriod: string): Promise<BrandRollup[]> {
  if (brandIds.length === 0) return [];
  const response = await api.get("/planning/targets/brand-rollups", {
    params: { brand_ids: brandIds, planning_period: planningPeriod },
    // FastAPI reads a list query param as repeated `brand_ids=a&brand_ids=b`;
    // axios's default `brand_ids[]=a` is rejected with a 422 (E2E 2026-09-23).
    paramsSerializer: { indexes: null },
  });
  return response.data.data;
}

export async function listBrandVendorTargets(planningPeriod: string): Promise<BrandVendorTarget[]> {
  const response = await api.get("/planning/brand-vendor-targets", {
    params: { planning_period: planningPeriod },
  });
  return response.data.data;
}

export async function setBrandVendorTarget(data: BrandVendorTargetSet): Promise<BrandVendorTarget> {
  const response = await api.post("/planning/brand-vendor-targets", data);
  return response.data.data;
}
