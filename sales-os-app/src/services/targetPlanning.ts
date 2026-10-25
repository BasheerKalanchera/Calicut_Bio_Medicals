import api from "../lib/api";
import type {
  TargetPlan,
  TargetPlanCreate,
  TargetPlanUpdate,
  TargetPlanApprovalDecision,
  BrandVendorTarget,
  BrandVendorTargetSet,
  BrandRollup,
  EligibleAccount,
  PlanWarning,
  TargetVsActualResponse,
  TargetVsActualYearResponse,
  TargetRosterResponse,
  SbuTarget,
  BrandAnnualTargetRow,
  BrandAnnualTargetSet,
  SbuSeasonalPattern,
  SbuSeasonalPatternSet,
  TeamTargetsResponse,
  PersonQuarterTarget,
  PersonQuarterTargetSet,
} from "../types/targetPlanning";
import type { BrandResponse } from "../types/api-aliases";

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

// Target vs Actuals for one quarter -- roster rows, PO received, Won (paid),
// Expected, and the SBU/company rows by role. Read-only, RLS-scoped.
export async function getTargetVsActual(sbuId: string, planningPeriod: string): Promise<TargetVsActualResponse> {
  const response = await api.get("/planning/targets/target-vs-actuals", {
    params: { sbu_id: sbuId, planning_period: planningPeriod },
  });
  return response.data.data;
}

// Target vs Actuals for a fiscal year (2026 = FY 2026-27): the year so far
// and each person's whole year (Annual Target Planning D31, D78).
export async function getTargetVsActualYear(sbuId: string, fiscalYear: number): Promise<TargetVsActualYearResponse> {
  const response = await api.get("/planning/targets/target-vs-actuals/year", {
    params: { sbu_id: sbuId, fiscal_year: fiscalYear },
  });
  return response.data.data;
}

// SBU targets for a quarter -- each SBU's brands' total, read-only. Admin,
// GM and an SBU Manager (their own SBU only).
export async function listSbuTargets(planningPeriod: string): Promise<SbuTarget[]> {
  const response = await api.get("/planning/sbu-targets", {
    params: { planning_period: planningPeriod },
  });
  return response.data.data;
}

// --- Annual Target Planning Part 1 (Admin/GM unless noted) ---

// Refused once the brand has a yearly figure (D59).
export async function setBrandYearStart(brandId: string, yearStartMonth: number): Promise<BrandResponse> {
  const response = await api.put(`/planning/brands/${brandId}/year-start`, { year_start_month: yearStartMonth });
  return response.data.data;
}

// Each active brand's year starting in calendarYear, with its four quarters (D43).
export async function listBrandAnnualTargets(sbuId: string, calendarYear: number): Promise<BrandAnnualTargetRow[]> {
  const response = await api.get("/planning/brand-annual-targets", {
    params: { sbu_id: sbuId, calendar_year: calendarYear },
  });
  return response.data.data;
}

// Upsert; also saves the brand's quarterly targets (D46, D51).
export async function setBrandAnnualTarget(data: BrandAnnualTargetSet): Promise<BrandAnnualTargetRow> {
  const response = await api.put("/planning/brand-annual-targets", data);
  return response.data.data;
}

// null until the GM sets the SBU's pattern for that year.
export async function getSeasonalPattern(sbuId: string, year: number): Promise<SbuSeasonalPattern | null> {
  const response = await api.get("/planning/seasonal-patterns", { params: { sbu_id: sbuId, year } });
  return response.data.data;
}

// Upsert; brands following the SBU's pattern are saved again (D50).
export async function setSeasonalPattern(data: SbuSeasonalPatternSet): Promise<SbuSeasonalPattern> {
  const response = await api.put("/planning/seasonal-patterns", data);
  return response.data.data;
}

// Anyone: the caller's own target and their direct reports' (D33, D57).
export async function getTeamTargets(sbuId: string, planningPeriod: string): Promise<TeamTargetsResponse> {
  const response = await api.get("/planning/person-targets", {
    params: { sbu_id: sbuId, planning_period: planningPeriod },
  });
  return response.data.data;
}

// The person's manager, Admin or GM; upsert (D45, D61).
export async function setPersonTarget(data: PersonQuarterTargetSet): Promise<PersonQuarterTarget> {
  const response = await api.put("/planning/person-targets", data);
  return response.data.data;
}

// Back to "Not set" -- the same people who may set it (D74).
export async function removePersonTarget(userId: string, planningPeriod: string): Promise<void> {
  await api.delete("/planning/person-targets", {
    params: { user_id: userId, planning_period: planningPeriod },
  });
}

// Target Planning's quarter roster: everyone in the caller's scope with their
// plan status, and the same total Target vs Actuals counts. Read-only.
export async function getTargetRoster(sbuId: string, planningPeriod: string): Promise<TargetRosterResponse> {
  const response = await api.get("/planning/targets/roster", {
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
