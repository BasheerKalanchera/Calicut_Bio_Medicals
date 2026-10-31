import { Fragment, useEffect, useRef, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FormModal from "../components/FormModal";
import SbuTargetBox, { AnnualSbuTargetCard } from "../components/SbuTargetBox";
import TeamTargetsPanel, { AnnualTeamTargetsCard, YourTargetLine } from "../components/TeamTargetsPanel";
import TargetPlanDetails from "../components/TargetPlanDetails";
import TargetPlanDialog from "../components/TargetPlanDialog";
import ChipTabs from "../components/ChipTabs";
import { centerChip } from "../utils/centerChip";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../lib/api";
import { listSbus } from "../services/masterData";
import { listBrands } from "../services/catalogHierarchy";
import {
  listTargetPlans,
  listPendingApproval,
  listTeamTargets,
  getTargetRoster,
  getTeamTargets,
  approveTargetPlan,
  rejectTargetPlan,
} from "../services/targetPlanning";
import {
  getCurrentPlanningPeriod,
  shiftPlanningPeriod,
  getFiscalYearOfPeriod,
  getPlanningYearQuarters,
  formatFiscalYear,
  formatLakhs,
  formatPlanningPeriod,
} from "../utils/formatter";
import type { RosterStatus, TargetPlan, TargetPlanSbu, TargetPlanStatus } from "../types/targetPlanning";
import type { BrandResponse } from "../types/api-aliases";
import { asTree } from "../utils/reportingTree";
import TableOrCards, { TocCell, TocMessage, TocRow } from "../components/TableOrCards";

// Local stopgap type -- masterData.ts's listSbus returns Promise<unknown>
// today -- see docs/Backlog.md "Type the shared frontend service functions
// properly".
interface SbuOption { id: string; name: string }

// Sales Staff never sees the team-wide rollup section at all -- everyone
// else (SBU Manager/Area Manager/Admin/GM) does, scoped by RLS.
const ROLLUP_VISIBLE_ROLES = new Set(["Admin", "General Manager", "SBU Manager", "Area Manager"]);

// The SBU target (its brands' total, read-only): Admin, GM and an SBU
// Manager only -- matches /planning/sbu-targets (Annual Target Planning
// D26, D34: Area Managers see only their own target).
const SBU_TARGET_VIEW_ROLES = new Set(["Admin", "General Manager", "SBU Manager"]);

// Admin/GM have no quarterly target of their own (no one above them sets
// one, D45); they divide the SBU target instead (D62).
const COMPANY_WIDE_ROLES = new Set(["Admin", "General Manager"]);

// Admin is purely an oversight/approval account -- unlike GM, who sells
// personally alongside running the company (Basheer's call, 2026-09-17),
// Admin carries no personal sales quota, so "My Plan" doesn't apply to
// them at all. This can't be derived from userProfile.sbu being null --
// GM's sbu is null for the exact same structural reason (no fixed home
// SBU) but GM *does* get this section -- it's a real, deliberate business
// exception, not a hierarchy generalization.
const NO_PERSONAL_TARGET_ROLES = new Set(["Admin"]);

// Every table on this screen is one card per row on a phone (TableOrCards);
// hiding the Hospitals column alone still left them too wide (Basheer,
// 2026-10-25). Cards get less padding on a phone to match.
const CARD_SX = { bgcolor: "background.paper", borderRadius: 2, p: { xs: 1.5, sm: 2.5 } };

const STATUS_LABEL: Record<TargetPlanStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const STATUS_COLOR: Record<TargetPlanStatus, "default" | "warning" | "success" | "error"> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

function StatusChip({ status }: { status: TargetPlanStatus }) {
  return <Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size="small" />;
}

// A roster row with no plan to show: nobody has started one, or it is
// someone else's draft (drafts are private to their owner).
function RosterStatusOnly({ status }: { status: RosterStatus }) {
  return status === "NOT_STARTED" ? (
    <Chip label="Not started" variant="outlined" size="small" />
  ) : (
    <StatusChip status={status} />
  );
}

// Beside a plan's amount (BR-PL-05): a revision waiting for approval notes
// the figure it replaces; a rejected revision notes the last approved
// figure, which is what still counts.
function previousApprovedNote(status: string, previous: string | number | null | undefined): string | null {
  if (previous == null) return null;
  const amount = formatLakhs(Number(previous));
  return status === "REJECTED" ? `${amount} approved still counts` : `was ${amount} approved`;
}

// A plan's amount cell -- the same note under it on every view, so a row
// showing a rejected ₹45 explains why only the approved ₹30 is in the total.
function PlanAmount({ amount, note }: { amount: string | number; note: string | null }) {
  return (
    <>
      {formatLakhs(Number(amount))}
      {note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {note}
        </Typography>
      )}
    </>
  );
}

// What one of my own plans adds to my totals -- the same rule as the roster's
// counted_lakhs (planning service _build_roster), so "My Plan" and the
// managers' view always agree: a rejected revision counts at its last
// approved total (BR-PL-05); a draft or a first plan rejected counts nothing.
function countedLakhs(t: TargetPlan): number {
  if (t.status === "REJECTED") return Number(t.previous_approved_total_lakhs ?? 0);
  if (t.status === "PENDING_APPROVAL" || t.status === "APPROVED") return Number(t.target_amount_lakhs);
  return 0;
}

// A resolved decision (Approved/Rejected) can carry the approver's note --
// shown right under the chip so it isn't stored but invisible.
//
// sbuHasBrands: flags a target that predates Brand-Level Target Planning
// (or otherwise has no split) once its SBU has an active brand -- splitting
// is mandatory going forward, but existing targets from before 2026-09-23
// were grandfathered in rather than retroactively blocked (Basheer's call).
// This is the visible nudge back to the owner to go revise and split it.
function StatusWithNote({ target, sbuHasBrands }: { target: TargetPlan; sbuHasBrands: boolean }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      <StatusChip status={target.status} />
      {sbuHasBrands && target.brand_splits.length === 0 && (
        <Chip label="Needs Brand Split" color="warning" variant="outlined" size="small" />
      )}
      {target.decision_note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", width: "100%" }}>
          {target.decision_note}
        </Typography>
      )}
    </Box>
  );
}

// Chevron that opens a plan row's hospital/brand detail underneath it.
function ExpandToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <IconButton size="small" onClick={onClick} aria-expanded={open} aria-label={open ? "Hide plan details" : "Show plan details"}>
      {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
    </IconButton>
  );
}

// Hospital count is counted live from the plan's rows, not stored.
function hospitalCount(t: TargetPlan): string {
  return t.accounts.length === 0 ? "—" : String(t.accounts.length);
}

// One person's target amounts across a fiscal year's 4 quarters -- the
// team rollup's per-rep grouping (Group H's "grouped rows" layout).
interface AnnualPerson {
  user: TargetPlan["user"];
  total: number;
  byQuarter: Record<string, TargetPlan | undefined>;
}

// "My Plan" grouped by SBU -- almost everyone belongs to exactly one SBU
// (so this collapses to a single block), but Admin/GM belong to none and
// may set a target in each, since they sell across every SBU personally.
interface AnnualSbuBlock {
  sbu: TargetPlanSbu;
  total: number;
  byQuarter: Record<string, TargetPlan | undefined>;
}

// One tab per section (Target-Coverage-Planning-Tabs plan D2).
type PlanTabId = "my-plan" | "approval" | "team-targets" | "team-plans";

export default function TargetPlanningScreen({
  initialFocus = null,
  isActive = true,
}: {
  // Set when a plan notification was clicked: open on that plan's quarter
  // and SBU with its row open (Annual Target Planning D21), on the tab that
  // holds the plan (Tabs plan D5, D7). "submitted" is the manager's
  // notification; "decided" is the owner's approved/rejected one.
  initialFocus?: { period: string; sbuId: string; planId: string; kind: "submitted" | "decided" } | null;
  // The screen stays mounted when another is open; the tab goes back to the
  // opening tab whenever it is left (Tabs plan D10).
  isActive?: boolean;
} = {}) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const roleName: string | undefined = userProfile?.role_name;
  const showRollup = !!roleName && ROLLUP_VISIBLE_ROLES.has(roleName);
  const showMyTarget = !roleName || !NO_PERSONAL_TARGET_ROLES.has(roleName);
  // Data-driven, not role-driven: whoever has no fixed home SBU (today,
  // that's Admin/GM -- they oversee every SBU rather than belonging to
  // one) needs to choose which SBU a target/rollup applies to. Anyone with
  // a real home SBU never sees a picker at all.
  const needsSbuChoice = !userProfile?.sbu;
  const isCompanyWide = !!roleName && COMPANY_WIDE_ROLES.has(roleName);

  const [viewMode, setViewMode] = useState<"quarterly" | "annual">("quarterly");
  const [period, setPeriod] = useState(() => initialFocus?.period ?? getCurrentPlanningPeriod());
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(() => (needsSbuChoice ? initialFocus?.sbuId ?? null : null));
  // The plan dialog mounts only while this is set, so each opening starts
  // fresh from the chosen target (Frontend Standards 6.2).
  const [planDialog, setPlanDialog] = useState<{ period: string; sbuId: string; existing: TargetPlan | null } | null>(null);
  const [decision, setDecision] = useState<{ targetPlan: TargetPlan; status: "APPROVED" | "REJECTED" } | null>(null);
  const [noteInput, setNoteInput] = useState("");
  // Set when an approve/reject was refused because the plan changed (or was
  // already decided) after the approver opened it -- BR-PL-08.
  const [staleNotice, setStaleNotice] = useState<string | null>(null);
  // Plan rows (approval queue and team list) whose detail panel is open.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialFocus ? [initialFocus.planId] : []));
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const fyStartYear = getFiscalYearOfPeriod(period);
  const yearQuarters = getPlanningYearQuarters(fyStartYear);
  const isAnnual = viewMode === "annual";
  const periodLabel = isAnnual ? formatFiscalYear(fyStartYear) : formatPlanningPeriod(period);

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: needsSbuChoice,
  });

  // The SBU(s) relevant to "my own" targets -- one's own home SBU for
  // almost everyone, or every SBU in the org for whoever has none.
  const mySbus: TargetPlanSbu[] = userProfile?.sbu ? [userProfile.sbu] : sbus;

  // Admin/GM must pick an SBU explicitly for the rollup below (no natural
  // default) -- derived from the loaded list rather than an effect,
  // defaulting to the first one until the user picks a different one.
  const rollupSbuId = needsSbuChoice ? (selectedSbuId ?? sbus[0]?.id ?? null) : userProfile?.sbu?.id ?? null;

  // Drives the "Needs Brand Split" nudge below -- a target is flagged once
  // its SBU has an active brand, regardless of whether the target itself
  // predates the feature. One brand-list fetch per SBU shown (mySbus is at
  // most 2 today -- everyone else has a single home SBU).
  const mySbuBrandQueries = useQueries({
    queries: mySbus.map((sbu) => ({
      queryKey: ["brands", sbu.id],
      queryFn: () => listBrands(sbu.id) as Promise<BrandResponse[]>,
    })),
  });
  const mySbuHasBrands = new Set(
    mySbus.filter((_sbu, i) => (mySbuBrandQueries[i]?.data ?? []).length > 0).map((s) => s.id),
  );

  const { data: rollupSbuBrands = [] } = useQuery({
    queryKey: ["brands", rollupSbuId],
    queryFn: () => listBrands(rollupSbuId as string) as Promise<BrandResponse[]>,
    enabled: showRollup && !!rollupSbuId,
  });
  const rollupSbuHasBrands = rollupSbuBrands.length > 0;

  const { data: myTargets = [] } = useQuery({
    queryKey: ["target-plans", "mine"],
    queryFn: listTargetPlans,
    enabled: showMyTarget,
  });

  const myPeriodTargets = myTargets.filter((t) => t.planning_period === period);
  const mySbuIdsWithTarget = new Set(myPeriodTargets.map((t) => t.sbu_id));
  const myAvailableSbus = mySbus.filter((s) => !mySbuIdsWithTarget.has(s.id));
  const myPeriodTotal = myPeriodTargets.reduce((sum, t) => sum + countedLakhs(t), 0);

  const myAnnualBySbu: AnnualSbuBlock[] = mySbus.map((sbu) => {
    const byQuarter: Record<string, TargetPlan | undefined> = {};
    let total = 0;
    for (const q of yearQuarters) {
      const t = myTargets.find((x) => x.sbu_id === sbu.id && x.planning_period === q);
      byQuarter[q] = t;
      total += t ? countedLakhs(t) : 0;
    }
    return { sbu, total, byQuarter };
  });
  const myAnnualGrandTotal = myAnnualBySbu.reduce((sum, b) => sum + b.total, 0);

  const { data: pendingApproval = [], isSuccess: pendingLoaded, isError: pendingFailed, isFetching: pendingFetching } = useQuery({
    queryKey: ["target-plans", "pending-approval"],
    queryFn: listPendingApproval,
    // A manager often leaves this screen open; without polling, a newly
    // submitted plan only appeared after a reload or window refocus.
    refetchInterval: 60_000,
  });

  // Quarter view: everyone in the viewer's scope, plan or not, and the same
  // total the Target vs Actuals card shows (Target-Coverage-Roster plan).
  const { data: roster, isError: rosterFailed } = useQuery({
    queryKey: ["target-plans", "roster", rollupSbuId, period],
    queryFn: () => getTargetRoster(rollupSbuId as string, period),
    enabled: showRollup && !isAnnual && !!rollupSbuId,
  });
  // Team members as a tree by reporting line (D76); former members stay a
  // flat group after them.
  const rosterRows = roster
    ? [
        ...asTree(roster.people.filter((p) => p.on_team)),
        ...roster.people.filter((p) => !p.on_team).map((person) => ({ person, depth: 0, managerName: null })),
      ]
    : [];

  // Annual rollup has no dedicated backend endpoint (Target-Planning-
  // Implementation-Plan.md's decision #3: "computed on read, not stored")
  // -- fires the existing per-quarter team-targets call 4x in parallel and
  // merges client-side, grouped per rep.
  const annualTeamQueries = useQueries({
    queries: yearQuarters.map((q) => ({
      queryKey: ["target-plans", "team", rollupSbuId, q],
      queryFn: () => listTeamTargets(rollupSbuId as string, q),
      enabled: showRollup && isAnnual && !!rollupSbuId,
    })),
  });
  // The totals come from the quarter rosters, so each quarter counts exactly
  // as the Quarter view and the Target vs Actuals card do: no drafts, a
  // rejected revision at its last approved total (code review 2026-10-06).
  // The per-quarter rows below still show each plan as filed.
  const annualRosterQueries = useQueries({
    queries: yearQuarters.map((q) => ({
      queryKey: ["target-plans", "roster", rollupSbuId, q],
      queryFn: () => getTargetRoster(rollupSbuId as string, q),
      enabled: showRollup && isAnnual && !!rollupSbuId,
    })),
  });
  const countedByUser = new Map<string, number>();
  for (const q of annualRosterQueries) {
    for (const p of q.data?.people ?? []) {
      countedByUser.set(p.user_id, (countedByUser.get(p.user_id) ?? 0) + Number(p.counted_lakhs));
    }
  }
  const teamAnnualByUser = new Map<string, AnnualPerson>();
  for (const q of annualTeamQueries) {
    for (const t of q.data ?? []) {
      if (!teamAnnualByUser.has(t.user_id)) {
        teamAnnualByUser.set(t.user_id, { user: t.user, total: countedByUser.get(t.user_id) ?? 0, byQuarter: {} });
      }
      teamAnnualByUser.get(t.user_id)!.byQuarter[t.planning_period] = t;
    }
  }
  const teamAnnualList = Array.from(teamAnnualByUser.values()).sort((a, b) => b.total - a.total);
  const annualRollupTotal = annualRosterQueries.reduce((sum, q) => sum + Number(q.data?.total_lakhs ?? 0), 0);

  // --- Tabs (Target-Coverage-Planning-Tabs plan D2-D10) ---
  // Team Targets is hidden when it would be empty: the viewer can't see the
  // SBU target and no one reports to them (D9). The same requests as the
  // Team Targets card's own, so they are fetched once.
  const teamTargetQueries = useQueries({
    queries: (isAnnual ? yearQuarters : [period]).map((q) => ({
      queryKey: ["planning", "team-targets", rollupSbuId, q],
      queryFn: () => getTeamTargets(rollupSbuId as string, q),
      enabled: showRollup && !!rollupSbuId,
    })),
  });
  const canSeeSbuTarget = !!roleName && SBU_TARGET_VIEW_ROLES.has(roleName);
  const [chosenTab, setChosenTab] = useState<PlanTabId | null>(null);
  // While another quarter's team is still loading, the tab stays if it is the
  // one open -- otherwise it would vanish and the screen would jump away and
  // back on every arrow press.
  const teamTargetsLoading = chosenTab === "team-targets" && teamTargetQueries.some((q) => q.isPending);
  const hasTeamTargets = canSeeSbuTarget || teamTargetsLoading || teamTargetQueries.some((q) => (q.data?.reports.length ?? 0) > 0);
  const showTeamTargetsTab = showRollup && !!rollupSbuId && hasTeamTargets;

  const tabs: { id: PlanTabId; label: string }[] = [];
  if (showMyTarget) tabs.push({ id: "my-plan", label: "My Plan" });
  if (showRollup) {
    tabs.push({ id: "approval", label: pendingApproval.length > 0 ? `Needs Your Approval (${pendingApproval.length})` : "Needs Your Approval" });
    if (showTeamTargetsTab) tabs.push({ id: "team-targets", label: "Team Targets" });
    tabs.push({ id: "team-plans", label: "Team Plans" });
  }

  // The opening tab is worked out once the approval list has loaded (D4,
  // D5, D7) and then kept, so a plan arriving while the screen is open does
  // not move the manager to another tab.
  const [focus, setFocus] = useState(initialFocus);
  const [openingTab, setOpeningTab] = useState<PlanTabId | null>(null);
  // A failed approval list must not leave the screen blank: open on Team
  // Plans, as if nothing were waiting.
  const approvalListReady = (pendingLoaded || pendingFailed) && !pendingFetching;
  if (isActive && openingTab === null && (!showRollup || approvalListReady)) {
    let opening: PlanTabId;
    if (!showRollup) opening = "my-plan";
    else if (focus?.kind === "decided") opening = showMyTarget ? "my-plan" : "team-plans";
    else if (focus) opening = pendingApproval.some((p) => p.id === focus.planId) ? "approval" : "team-plans";
    else opening = pendingApproval.length > 0 ? "approval" : "team-plans";
    setOpeningTab(opening);
  }
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (!isActive) {
      setOpeningTab(null);
      setChosenTab(null);
      setFocus(null);
    }
  }
  // A tab that has gone (Team Targets in a quarter with no team) falls back
  // to the opening tab.
  const wanted = chosenTab ?? openingTab;
  const activeTab: PlanTabId | null = wanted && tabs.some((t) => t.id === wanted) ? wanted : openingTab;

  const tabBarRef = useRef<HTMLDivElement>(null);
  const showTabBar = tabs.length > 1 && activeTab !== null;
  useEffect(() => {
    if (!showTabBar || !activeTab) return;
    const timer = setTimeout(() => centerChip(tabBarRef.current, activeTab), 50);
    return () => clearTimeout(timer);
  }, [showTabBar, activeTab]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["target-plans"] });
    // The Insights Dashboard's Target vs Actuals card shows plan statuses too.
    queryClient.invalidateQueries({ queryKey: ["planning", "target-vs-actuals"] });
  };

  const openTargetDialog = (quarterPeriod: string, existing: TargetPlan | null, sbuId: string) => {
    setPlanDialog({ period: quarterPeriod, sbuId, existing });
  };

  const openDecision = (targetPlan: TargetPlan, status: "APPROVED" | "REJECTED") => {
    setNoteInput("");
    setDecision({ targetPlan, status });
  };

  const handleDecision = async () => {
    if (!decision) return;
    // The server refuses (409) unless this is still the version on screen.
    const body = {
      status: decision.status,
      note: noteInput.trim() || null,
      expected_updated_at: decision.targetPlan.updated_at,
    };
    setStaleNotice(null);
    try {
      if (decision.status === "APPROVED") {
        await approveTargetPlan(decision.targetPlan.id, body);
      } else {
        await rejectTargetPlan(decision.targetPlan.id, body);
      }
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) throw err;
      // Returning normally closes the dialog; the refetch below brings in
      // the latest version for the approver to review again.
      setStaleNotice(err.message);
    }
    invalidateAll();
  };

  return (
    <Box sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Fixed: period picker + Quarterly/Annual toggle — do not scroll */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, flexShrink: 0, px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setPeriod((p) => shiftPlanningPeriod(p, isAnnual ? -4 : -1))}
            title={isAnnual ? "Previous fiscal year" : "Previous quarter"}
          >
            <Box component="span">◀</Box>
          </IconButton>
          <Typography sx={{ fontWeight: 700, minWidth: "6rem", textAlign: "center" }}>{periodLabel}</Typography>
          <IconButton
            size="small"
            onClick={() => setPeriod((p) => shiftPlanningPeriod(p, isAnnual ? 4 : 1))}
            title={isAnnual ? "Next fiscal year" : "Next quarter"}
          >
            <Box component="span">▶</Box>
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          {/* Admin/GM's SBU choice, for both Team Targets and Team Plans (D75, Tabs plan D8). */}
          {showRollup && needsSbuChoice && (
            <TextField
              select
              size="small"
              label="SBU"
              value={rollupSbuId ?? ""}
              onChange={(e) => setSelectedSbuId(e.target.value)}
              sx={{ minWidth: "12rem", bgcolor: "background.paper" }}
            >
              {sbus.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          )}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(_e, v) => { if (v) setViewMode(v); }}
          >
            <ToggleButton value="quarterly">Quarterly</ToggleButton>
            <ToggleButton value="annual">Annual</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* One tab per section; a rep has only My Plan, so no tab bar (D3). */}
      {showTabBar && activeTab && <ChipTabs tabs={tabs} value={activeTab} onChange={setChosenTab} barRef={tabBarRef} />}

      {/* Scrollable content -- keyed on the tab so each opens at its top. */}
      <Box key={activeTab ?? "loading"} sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: { xs: 1.5, sm: 3 }, pb: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {activeTab === "my-plan" && showMyTarget && (
        <Box sx={CARD_SX}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>My Plan</Typography>
          {!isAnnual ? (
            <>
              {!isCompanyWide && userProfile?.sbu && <YourTargetLine sbuId={userProfile.sbu.id} period={period} />}
              {mySbus.length > 1 && (
                <Typography sx={{ mb: 1.5 }}>
                  Total across SBUs: <strong>{formatLakhs(myPeriodTotal)}</strong>
                </Typography>
              )}
              <TableOrCards columns={[{ label: "SBU" }, { label: "Amount" }, { label: "Status" }, { label: "Actions", align: "right" }]}>
                {myPeriodTargets.map((t) => (
                  <TocRow key={t.id}>
                    <TocCell title>{t.sbu.name}</TocCell>
                    <TocCell label="Amount">
                      <PlanAmount amount={t.target_amount_lakhs} note={previousApprovedNote(t.status, t.previous_approved_total_lakhs)} />
                    </TocCell>
                    <TocCell label="Status"><StatusWithNote target={t} sbuHasBrands={mySbuHasBrands.has(t.sbu_id)} /></TocCell>
                    <TocCell action align="right">
                      <Button size="small" onClick={() => openTargetDialog(period, t, t.sbu_id)}>{t.status === "DRAFT" ? "Continue" : "Revise"}</Button>
                    </TocCell>
                  </TocRow>
                ))}
                {myAvailableSbus.map((sbu) => (
                  <TocRow key={sbu.id}>
                    <TocCell title>{sbu.name}</TocCell>
                    <TocCell colSpan={2}>
                      <Typography color="text.secondary">No plan set for {formatPlanningPeriod(period)} yet.</Typography>
                    </TocCell>
                    <TocCell action align="right">
                      <Button size="small" variant="contained" onClick={() => openTargetDialog(period, null, sbu.id)}>Plan</Button>
                    </TocCell>
                  </TocRow>
                ))}
              </TableOrCards>
            </>
          ) : (
            <>
              {myAnnualBySbu.length > 1 && (
                <Typography sx={{ mb: 1.5 }}>
                  Grand Total across SBUs: <strong>{formatLakhs(myAnnualGrandTotal)}</strong>
                </Typography>
              )}
              {/* On a phone each SBU is one card with its quarters inside. */}
              <TableOrCards columns={[{ label: "SBU / Quarter" }, { label: "Amount" }, { label: "Status" }, { label: "Actions", align: "right" }]}>
                {myAnnualBySbu.map((block) => (
                  <TocRow
                    key={block.sbu.id}
                    total
                    subRows={yearQuarters.map((q) => {
                      const t = block.byQuarter[q];
                      return (
                        <TocRow key={`${block.sbu.id}-${q}`}>
                          <TocCell title sx={{ pl: { sm: 3 }, color: "text.secondary" }}>{formatPlanningPeriod(q)}</TocCell>
                          <TocCell label="Amount">
                            {t ? <PlanAmount amount={t.target_amount_lakhs} note={previousApprovedNote(t.status, t.previous_approved_total_lakhs)} /> : "—"}
                          </TocCell>
                          <TocCell label="Status">
                            {t ? <StatusWithNote target={t} sbuHasBrands={mySbuHasBrands.has(block.sbu.id)} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
                          </TocCell>
                          <TocCell action align="right">
                            <Button size="small" onClick={() => openTargetDialog(q, t ?? null, block.sbu.id)}>{!t ? "Plan" : t.status === "DRAFT" ? "Continue" : "Revise"}</Button>
                          </TocCell>
                        </TocRow>
                      );
                    })}
                  >
                    <TocCell title>{block.sbu.name} — Annual Total</TocCell>
                    <TocCell label="Total">{formatLakhs(block.total)}</TocCell>
                    <TocCell phone={false} />
                    <TocCell phone={false} align="right" />
                  </TocRow>
                ))}
              </TableOrCards>
            </>
          )}
        </Box>
        )}

        {activeTab === "approval" && staleNotice && (
          <Alert severity="warning" onClose={() => setStaleNotice(null)}>
            {staleNotice}
          </Alert>
        )}

        {activeTab === "approval" && (
          <Box sx={CARD_SX}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Needs Your Approval</Typography>
            {pendingApproval.length === 0 ? (
              <Typography color="text.secondary">Nothing waiting for your approval</Typography>
            ) : (
            <TableOrCards
              columns={[{ toggle: true }, { label: "Rep" }, { label: "Period" }, { label: "Hospitals", align: "right" }, { label: "Amount" }, { label: "Actions", align: "right" }]}
            >
              {pendingApproval.map((t) => {
                const open = expanded.has(t.id);
                const wasApproved = t.previous_approved_total_lakhs != null ? Number(t.previous_approved_total_lakhs) : null;
                const belowApproved = wasApproved !== null && Number(t.target_amount_lakhs) < wasApproved;
                return (
                  <TocRow key={t.id} detail={open && <TargetPlanDetails target={t} />}>
                    <TocCell toggle>
                      <ExpandToggle open={open} onClick={() => toggleExpanded(t.id)} />
                    </TocCell>
                    <TocCell title>
                      {t.user.display_name}
                      {/* Approval queue only: the note outlives the approval,
                          so in the team list this tag would never go away. */}
                      {t.change_note && <Chip label="Revised" variant="outlined" size="small" sx={{ ml: 0.5 }} />}
                    </TocCell>
                    <TocCell label="Period">{formatPlanningPeriod(t.planning_period)}</TocCell>
                    <TocCell label="Hospitals" align="right">{hospitalCount(t)}</TocCell>
                    <TocCell label="Amount">
                      <Box component="span" sx={belowApproved ? { color: "warning.main", fontWeight: 700 } : undefined}>
                        {formatLakhs(Number(t.target_amount_lakhs))}
                      </Box>
                      {wasApproved !== null && (
                        <Typography component="span" variant="body2" sx={{ color: belowApproved ? "warning.main" : "text.secondary" }}>
                          {" "}(was {formatLakhs(wasApproved)})
                        </Typography>
                      )}
                    </TocCell>
                    {/* Below the lines on a phone: two buttons beside a name don't fit. */}
                    <TocCell align="right">
                      <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, ml: { xs: -1, sm: 0 } }}>
                        <Button size="small" color="success" onClick={() => openDecision(t, "APPROVED")}>Approve</Button>
                        <Button size="small" color="error" onClick={() => openDecision(t, "REJECTED")}>Reject</Button>
                      </Box>
                    </TocCell>
                  </TocRow>
                );
              })}
            </TableOrCards>
            )}
          </Box>
        )}

        {/* Its own card, above Team Targets (D75). */}
        {activeTab === "team-targets" && showRollup && rollupSbuId && canSeeSbuTarget && (isAnnual ? (
          <AnnualSbuTargetCard key={`sbu-target-${rollupSbuId}-${fyStartYear}`} sbuId={rollupSbuId} quarters={yearQuarters} yearLabel={periodLabel} />
        ) : (
          <SbuTargetBox sbuId={rollupSbuId} period={period} />
        ))}

        {/* Its own card, above Team Plans (D75); hidden when no one reports to the viewer. */}
        {activeTab === "team-targets" && showRollup && rollupSbuId && (isAnnual ? (
          <AnnualTeamTargetsCard
            key={`team-targets-${rollupSbuId}-${fyStartYear}`}
            sbuId={rollupSbuId}
            quarters={yearQuarters}
            yearLabel={periodLabel}
            isCompanyWide={isCompanyWide}
          />
        ) : (
          <TeamTargetsPanel key={`team-targets-${rollupSbuId}-${period}`} sbuId={rollupSbuId} period={period} isCompanyWide={isCompanyWide} />
        ))}

        {activeTab === "team-plans" && showRollup && (
          <Box sx={CARD_SX}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              {/* The SBU target and team targets have their own cards above (D75). */}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Team Plans</Typography>
            </Box>

            {!isAnnual ? (
              <>
                {roster && (
                  <Typography sx={{ mb: 1.5 }}>
                    Total: <strong>{formatLakhs(Number(roster.total_lakhs))}</strong>
                    {roster.roster_count > 0 && (
                      <Typography component="span" color={roster.not_submitted_count > 0 ? "warning.main" : "text.secondary"}>
                        {" · "}
                        {roster.not_submitted_count > 0
                          ? `${roster.not_submitted_count} of ${roster.roster_count} haven't submitted`
                          : `all ${roster.roster_count} submitted`}
                      </Typography>
                    )}
                  </Typography>
                )}
                {/* On a phone each person's card is pushed in under their manager. */}
                <TableOrCards columns={[{ toggle: true }, { label: "Rep" }, { label: "Hospitals", align: "right" }, { label: "Amount" }, { label: "Status" }]}>
                  {rosterRows.map(({ person: p, depth, managerName }, i, rows) => {
                    const t = p.plan;
                    const open = t !== null && expanded.has(t.id);
                    const note = t && previousApprovedNote(p.plan_status, p.previous_approved_total_lakhs);
                    // Former members come last; head their group once.
                    const firstFormer = !p.on_team && (i === 0 || rows[i - 1].person.on_team);
                    return (
                      <Fragment key={p.user_id}>
                        {firstFormer && (
                          <TocMessage>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              No longer on this team — their plans still count in the total
                            </Typography>
                          </TocMessage>
                        )}
                        <TocRow indent={depth} detail={open && t && <TargetPlanDetails target={t} />}>
                          <TocCell toggle>
                            {t && <ExpandToggle open={open} onClick={() => toggleExpanded(t.id)} />}
                          </TocCell>
                          <TocCell title>
                            {p.display_name}
                            {managerName && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
                                reports to {managerName}
                              </Typography>
                            )}
                          </TocCell>
                          <TocCell label="Hospitals" align="right">{t ? hospitalCount(t) : "—"}</TocCell>
                          <TocCell label="Amount">
                            {t ? <PlanAmount amount={t.target_amount_lakhs} note={note} /> : "—"}
                          </TocCell>
                          <TocCell label="Status">
                            {t ? <StatusWithNote target={t} sbuHasBrands={rollupSbuHasBrands} /> : <RosterStatusOnly status={p.plan_status} />}
                          </TocCell>
                        </TocRow>
                      </Fragment>
                    );
                  })}
                  {rosterFailed && !roster && (
                    <TocMessage>
                      <Typography color="error">Couldn't load the team list. Please refresh.</Typography>
                    </TocMessage>
                  )}
                  {roster && roster.people.length === 0 && (
                    <TocMessage>
                      <Typography color="text.secondary">No one in this team for {formatPlanningPeriod(period)}.</Typography>
                    </TocMessage>
                  )}
                </TableOrCards>
              </>
            ) : (
              <>
                <Typography sx={{ mb: 1.5 }}>
                  Total: <strong>{formatLakhs(annualRollupTotal)}</strong> across {teamAnnualList.length} rep
                  {teamAnnualList.length === 1 ? "" : "s"} for {periodLabel}
                </Typography>
                {/* On a phone each person is one card with their quarters inside. */}
                <TableOrCards columns={[{ label: "Rep" }, { label: "Amount" }, { label: "Status" }]}>
                  {teamAnnualList.map((p) => (
                    <TocRow
                      key={p.user.id}
                      total
                      subRows={yearQuarters.map((q) => {
                        const t = p.byQuarter[q];
                        return (
                          <TocRow key={`${p.user.id}-${q}`}>
                            <TocCell title sx={{ pl: { sm: 3 }, color: "text.secondary" }}>{formatPlanningPeriod(q)}</TocCell>
                            <TocCell label="Amount">
                              {t ? <PlanAmount amount={t.target_amount_lakhs} note={previousApprovedNote(t.status, t.previous_approved_total_lakhs)} /> : "—"}
                            </TocCell>
                            <TocCell label="Status">
                              {t ? <StatusWithNote target={t} sbuHasBrands={rollupSbuHasBrands} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
                            </TocCell>
                          </TocRow>
                        );
                      })}
                    >
                      <TocCell title>{p.user.display_name}</TocCell>
                      <TocCell label="Annual Total">{formatLakhs(p.total)}</TocCell>
                      <TocCell phone={false}>Annual Total</TocCell>
                    </TocRow>
                  ))}
                  {teamAnnualList.length === 0 && (
                    <TocMessage>
                      <Typography color="text.secondary">No plans set for {periodLabel} yet.</Typography>
                    </TocMessage>
                  )}
                </TableOrCards>
              </>
            )}
          </Box>
        )}
      </Box>

      {planDialog && (
        <TargetPlanDialog
          sbuId={planDialog.sbuId}
          period={planDialog.period}
          existing={planDialog.existing}
          onClose={() => setPlanDialog(null)}
          onSaved={invalidateAll}
        />
      )}

      <FormModal
        isOpen={decision !== null}
        onClose={() => setDecision(null)}
        title={
          decision
            ? `${decision.status === "APPROVED" ? "Approve" : "Reject"} ${decision.targetPlan.user.display_name}'s plan?`
            : ""
        }
        onSubmit={handleDecision}
        submitLabel={decision?.status === "APPROVED" ? "Approve" : "Reject"}
      >
        <Typography color="text.secondary">
          {decision && `Target for ${formatPlanningPeriod(decision.targetPlan.planning_period)}: ${formatLakhs(Number(decision.targetPlan.target_amount_lakhs))}`}
        </Typography>
        <TextField
          label="Note (optional)"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
        />
      </FormModal>
    </Box>
  );
}
