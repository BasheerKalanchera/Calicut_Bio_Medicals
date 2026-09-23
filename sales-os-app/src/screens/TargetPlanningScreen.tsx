import { Fragment, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import FormModal from "../components/FormModal";
import { useAuth } from "../contexts/AuthContext";
import { listSbus } from "../services/masterData";
import { listBrands } from "../services/catalogHierarchy";
import {
  listTargetPlans,
  listPendingApproval,
  listTeamTargets,
  getSbuRollup,
  createTargetPlan,
  updateTargetPlan,
  approveTargetPlan,
  rejectTargetPlan,
} from "../services/targetPlanning";
import {
  getCurrentPlanningPeriod,
  shiftPlanningPeriod,
  getFiscalYearOfPeriod,
  getPlanningYearQuarters,
  formatLakhs,
} from "../utils/formatter";
import type { TargetPlan, TargetPlanSbu, TargetPlanStatus, BrandSplitEntry } from "../types/targetPlanning";
import type { BrandResponse } from "../types/api-aliases";

// The split section is mandatory whenever the target's SBU has at least one
// active brand (both SBUs do today, confirmed 2026-09-23 -- Imaging has 1,
// Critical Care has 9) -- docs/Brand-Level-Target-Planning-Implementation-
// Plan.md decision #1. If a future SBU genuinely has none, the section
// hides and a target saves exactly as it did before this feature.
interface EditSplitRow { brand_id: string; amount: string }

// Local stopgap type -- masterData.ts's listSbus returns Promise<unknown>
// today (same TODO noted in MarketingLeadCreateModal.tsx et al.).
interface SbuOption { id: string; name: string }

// Sales Staff never sees the team-wide rollup section at all -- everyone
// else (SBU Manager/Area Manager/Admin/GM) does, scoped by RLS.
const ROLLUP_VISIBLE_ROLES = new Set(["Admin", "General Manager", "SBU Manager", "Area Manager"]);

// Admin is purely an oversight/approval account -- unlike GM, who sells
// personally alongside running the company (Basheer's call, 2026-09-17),
// Admin carries no personal sales quota, so "My Target" doesn't apply to
// them at all. This can't be derived from userProfile.sbu being null --
// GM's sbu is null for the exact same structural reason (no fixed home
// SBU) but GM *does* get this section -- it's a real, deliberate business
// exception, not a hierarchy generalization.
const NO_PERSONAL_TARGET_ROLES = new Set(["Admin"]);

const STATUS_LABEL: Record<TargetPlanStatus, string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const STATUS_COLOR: Record<TargetPlanStatus, "warning" | "success" | "error"> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

function StatusChip({ status }: { status: TargetPlanStatus }) {
  return <Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size="small" />;
}

// A resolved decision (Approved/Rejected) can carry the approver's note --
// shown right under the chip so it isn't stored but invisible.
function StatusWithNote({ target }: { target: TargetPlan }) {
  return (
    <Box>
      <StatusChip status={target.status} />
      {target.decision_note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {target.decision_note}
        </Typography>
      )}
    </Box>
  );
}

function fiscalYearLabel(fyStartYear: number): string {
  return `FY ${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;
}

// One person's target amounts across a fiscal year's 4 quarters -- the
// team rollup's per-rep grouping (Group H's "grouped rows" layout).
interface AnnualPerson {
  user: TargetPlan["user"];
  total: number;
  byQuarter: Record<string, TargetPlan | undefined>;
}

// "My Target" grouped by SBU -- almost everyone belongs to exactly one SBU
// (so this collapses to a single block), but Admin/GM belong to none and
// may set a target in each, since they sell across every SBU personally.
interface AnnualSbuBlock {
  sbu: TargetPlanSbu;
  total: number;
  byQuarter: Record<string, TargetPlan | undefined>;
}

export default function TargetPlanningScreen() {
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

  const [viewMode, setViewMode] = useState<"quarterly" | "annual">("quarterly");
  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(period);
  const [editingSbuId, setEditingSbuId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<TargetPlan | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [editSplits, setEditSplits] = useState<EditSplitRow[]>([]);
  const [addBrandId, setAddBrandId] = useState("");
  const [addBrandAmount, setAddBrandAmount] = useState("");
  const [decision, setDecision] = useState<{ targetPlan: TargetPlan; status: "APPROVED" | "REJECTED" } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const fyStartYear = getFiscalYearOfPeriod(period);
  const yearQuarters = getPlanningYearQuarters(fyStartYear);
  const isAnnual = viewMode === "annual";
  const periodLabel = isAnnual ? fiscalYearLabel(fyStartYear) : period;

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: needsSbuChoice,
  });

  // Only fetched while the dialog's open and an SBU is known -- drives
  // whether the brand-split section shows at all (decision #1: mandatory
  // whenever the SBU has any active brand, hidden otherwise).
  const { data: dialogBrands = [] } = useQuery({
    queryKey: ["brands", editingSbuId],
    queryFn: () => listBrands(editingSbuId as string) as Promise<BrandResponse[]>,
    enabled: targetDialogOpen && !!editingSbuId,
  });

  // The SBU(s) relevant to "my own" targets -- one's own home SBU for
  // almost everyone, or every SBU in the org for whoever has none.
  const mySbus: TargetPlanSbu[] = userProfile?.sbu ? [userProfile.sbu] : sbus;

  // Admin/GM must pick an SBU explicitly for the rollup below (no natural
  // default) -- derived from the loaded list rather than an effect,
  // defaulting to the first one until the user picks a different one.
  const rollupSbuId = needsSbuChoice ? (selectedSbuId ?? sbus[0]?.id ?? null) : userProfile?.sbu?.id ?? null;

  const { data: myTargets = [] } = useQuery({
    queryKey: ["target-plans", "mine"],
    queryFn: listTargetPlans,
    enabled: showMyTarget,
  });

  const myPeriodTargets = myTargets.filter((t) => t.planning_period === period);
  const mySbuIdsWithTarget = new Set(myPeriodTargets.map((t) => t.sbu_id));
  const myAvailableSbus = mySbus.filter((s) => !mySbuIdsWithTarget.has(s.id));
  const myPeriodTotal = myPeriodTargets.reduce((sum, t) => sum + Number(t.target_amount_lakhs), 0);

  const myAnnualBySbu: AnnualSbuBlock[] = mySbus.map((sbu) => {
    const byQuarter: Record<string, TargetPlan | undefined> = {};
    let total = 0;
    for (const q of yearQuarters) {
      const t = myTargets.find((x) => x.sbu_id === sbu.id && x.planning_period === q);
      byQuarter[q] = t;
      total += Number(t?.target_amount_lakhs ?? 0);
    }
    return { sbu, total, byQuarter };
  });
  const myAnnualGrandTotal = myAnnualBySbu.reduce((sum, b) => sum + b.total, 0);

  const { data: pendingApproval = [] } = useQuery({
    queryKey: ["target-plans", "pending-approval"],
    queryFn: listPendingApproval,
  });

  const { data: rollup } = useQuery({
    queryKey: ["target-plans", "rollup", rollupSbuId, period],
    queryFn: () => getSbuRollup(rollupSbuId as string, period),
    enabled: showRollup && !isAnnual && !!rollupSbuId,
  });

  const { data: teamTargets = [] } = useQuery({
    queryKey: ["target-plans", "team", rollupSbuId, period],
    queryFn: () => listTeamTargets(rollupSbuId as string, period),
    enabled: showRollup && !isAnnual && !!rollupSbuId,
  });

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
  const teamAnnualByUser = new Map<string, AnnualPerson>();
  for (const q of annualTeamQueries) {
    for (const t of q.data ?? []) {
      if (!teamAnnualByUser.has(t.user_id)) {
        teamAnnualByUser.set(t.user_id, { user: t.user, total: 0, byQuarter: {} });
      }
      const entry = teamAnnualByUser.get(t.user_id)!;
      entry.total += Number(t.target_amount_lakhs);
      entry.byQuarter[t.planning_period] = t;
    }
  }
  const teamAnnualList = Array.from(teamAnnualByUser.values()).sort((a, b) => b.total - a.total);
  const annualRollupTotal = teamAnnualList.reduce((sum, p) => sum + p.total, 0);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["target-plans"] });
  };

  const openTargetDialog = (quarterPeriod: string, existing: TargetPlan | null, sbuId: string) => {
    setEditingPeriod(quarterPeriod);
    setEditingSbuId(sbuId);
    setEditingTarget(existing);
    setAmountInput(existing ? existing.target_amount_lakhs : "");
    setEditSplits(
      existing
        ? existing.brand_splits.map((s) => ({ brand_id: s.brand_id, amount: s.split_amount_lakhs }))
        : [],
    );
    setAddBrandId("");
    setAddBrandAmount("");
    setTargetDialogOpen(true);
  };

  const addBrandSplitRow = () => {
    if (!addBrandId || !addBrandAmount) return;
    if (editSplits.find((s) => s.brand_id === addBrandId)) return;
    setEditSplits([...editSplits, { brand_id: addBrandId, amount: addBrandAmount }]);
    setAddBrandId("");
    setAddBrandAmount("");
  };

  const splitTotal = editSplits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const handleSaveTarget = async () => {
    const amount = Number(amountInput);
    if (!amountInput.trim() || Number.isNaN(amount) || amount <= 0) {
      throw new Error("Enter a target amount greater than zero");
    }

    let brand_splits: BrandSplitEntry[] | undefined;
    if (dialogBrands.length > 0) {
      if (editSplits.length === 0 || Math.abs(splitTotal - amount) > 0.01) {
        throw new Error(
          `Brand splits must sum to exactly the target amount (currently ${formatLakhs(splitTotal)} of ${formatLakhs(amount)}).`,
        );
      }
      brand_splits = editSplits.map((s) => ({ brand_id: s.brand_id, split_amount_lakhs: Number(s.amount) }));
    }

    if (editingTarget) {
      await updateTargetPlan(editingTarget.id, { target_amount_lakhs: amount, brand_splits });
    } else if (editingSbuId) {
      await createTargetPlan({
        sbu_id: editingSbuId,
        planning_period: editingPeriod,
        target_amount_lakhs: amount,
        brand_splits,
      });
    }
    invalidateAll();
  };

  const openDecision = (targetPlan: TargetPlan, status: "APPROVED" | "REJECTED") => {
    setNoteInput("");
    setDecision({ targetPlan, status });
  };

  const handleDecision = async () => {
    if (!decision) return;
    const body = { status: decision.status, note: noteInput.trim() || null };
    if (decision.status === "APPROVED") {
      await approveTargetPlan(decision.targetPlan.id, body);
    } else {
      await rejectTargetPlan(decision.targetPlan.id, body);
    }
    invalidateAll();
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
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

      {showMyTarget && (
      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>My Target</Typography>
        {!isAnnual ? (
          <>
            {mySbus.length > 1 && (
              <Typography sx={{ mb: 1.5 }}>
                Total across SBUs: <strong>{formatLakhs(myPeriodTotal)}</strong>
              </Typography>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SBU</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myPeriodTargets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.sbu.name}</TableCell>
                    <TableCell>{formatLakhs(Number(t.target_amount_lakhs))}</TableCell>
                    <TableCell><StatusWithNote target={t} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openTargetDialog(period, t, t.sbu_id)}>Revise</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {myAvailableSbus.map((sbu) => (
                  <TableRow key={sbu.id}>
                    <TableCell>{sbu.name}</TableCell>
                    <TableCell colSpan={2}>
                      <Typography color="text.secondary">No target set for {period} yet.</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained" onClick={() => openTargetDialog(period, null, sbu.id)}>Set Target</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <>
            {myAnnualBySbu.length > 1 && (
              <Typography sx={{ mb: 1.5 }}>
                Grand Total across SBUs: <strong>{formatLakhs(myAnnualGrandTotal)}</strong>
              </Typography>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SBU / Quarter</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myAnnualBySbu.map((block) => (
                  <Fragment key={block.sbu.id}>
                    <TableRow sx={{ "& td": { fontWeight: 700, borderTop: "2px solid", borderColor: "divider" } }}>
                      <TableCell>{block.sbu.name} — Annual Total</TableCell>
                      <TableCell>{formatLakhs(block.total)}</TableCell>
                      <TableCell />
                      <TableCell align="right" />
                    </TableRow>
                    {yearQuarters.map((q) => {
                      const t = block.byQuarter[q];
                      return (
                        <TableRow key={`${block.sbu.id}-${q}`}>
                          <TableCell sx={{ pl: 3, color: "text.secondary" }}>{q}</TableCell>
                          <TableCell>{t ? formatLakhs(Number(t.target_amount_lakhs)) : "—"}</TableCell>
                          <TableCell>
                            {t ? <StatusWithNote target={t} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => openTargetDialog(q, t ?? null, block.sbu.id)}>{t ? "Revise" : "Set"}</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Box>
      )}

      {pendingApproval.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Needs Your Approval</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rep</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingApproval.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.user.display_name}</TableCell>
                  <TableCell>{t.planning_period}</TableCell>
                  <TableCell>{formatLakhs(Number(t.target_amount_lakhs))}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="success" onClick={() => openDecision(t, "APPROVED")}>Approve</Button>
                    <Button size="small" color="error" onClick={() => openDecision(t, "REJECTED")}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {showRollup && (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>SBU Target Rollup</Typography>
            {needsSbuChoice && (
              <TextField
                select
                size="small"
                label="SBU"
                value={rollupSbuId ?? ""}
                onChange={(e) => setSelectedSbuId(e.target.value)}
                sx={{ minWidth: "12rem" }}
              >
                {sbus.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {!isAnnual ? (
            <>
              {rollup && (
                <Typography sx={{ mb: 1.5 }}>
                  Total: <strong>{formatLakhs(Number(rollup.total_target_amount_lakhs))}</strong> across{" "}
                  {rollup.user_count} target{rollup.user_count === 1 ? "" : "s"}
                </Typography>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rep</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamTargets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.user.display_name}</TableCell>
                      <TableCell>{formatLakhs(Number(t.target_amount_lakhs))}</TableCell>
                      <TableCell><StatusWithNote target={t} /></TableCell>
                    </TableRow>
                  ))}
                  {teamTargets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography color="text.secondary">No targets set for {period} yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <>
              <Typography sx={{ mb: 1.5 }}>
                Total: <strong>{formatLakhs(annualRollupTotal)}</strong> across {teamAnnualList.length} rep
                {teamAnnualList.length === 1 ? "" : "s"} for {periodLabel}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rep</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamAnnualList.map((p) => (
                    <Fragment key={p.user.id}>
                      <TableRow sx={{ "& td": { fontWeight: 700, borderTop: "2px solid", borderColor: "divider" } }}>
                        <TableCell>{p.user.display_name}</TableCell>
                        <TableCell>{formatLakhs(p.total)}</TableCell>
                        <TableCell>Annual Total</TableCell>
                      </TableRow>
                      {yearQuarters.map((q) => {
                        const t = p.byQuarter[q];
                        return (
                          <TableRow key={`${p.user.id}-${q}`}>
                            <TableCell sx={{ pl: 3, color: "text.secondary" }}>{q}</TableCell>
                            <TableCell>{t ? formatLakhs(Number(t.target_amount_lakhs)) : "—"}</TableCell>
                            <TableCell>
                              {t ? <StatusWithNote target={t} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </Fragment>
                  ))}
                  {teamAnnualList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography color="text.secondary">No targets set for {periodLabel} yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </Box>
      )}

      <FormModal
        isOpen={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
        title={editingTarget ? `Revise Target — ${editingPeriod}` : `Set Target — ${editingPeriod}`}
        onSubmit={handleSaveTarget}
        submitLabel={editingTarget ? "Save" : "Create"}
      >
        <TextField
          label="Target Amount (₹ Lakhs) *"
          type="number"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          fullWidth
          size="small"
          autoFocus
        />
        {editingTarget?.status === "APPROVED" && (
          <Alert severity="info">Revising an approved target sends it back for a fresh approval.</Alert>
        )}
        {editingTarget?.status === "REJECTED" && (
          <Alert severity="info">Revising a rejected target sends it back for a fresh approval.</Alert>
        )}

        {dialogBrands.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Split by Brand *</Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: Math.abs(splitTotal - (Number(amountInput) || 0)) < 0.01 ? "success.main" : "warning.main",
                }}
              >
                Remaining to allocate: {formatLakhs((Number(amountInput) || 0) - splitTotal)}
              </Typography>
            </Box>

            {editSplits.map((s, i) => {
              const brand = dialogBrands.find((b) => b.id === s.brand_id);
              return (
                <Box key={s.brand_id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ flex: 1, fontSize: "0.875rem" }}>{brand?.name ?? s.brand_id}</Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={s.amount}
                    onChange={(e) =>
                      setEditSplits(editSplits.map((sp, j) => (j === i ? { ...sp, amount: e.target.value } : sp)))
                    }
                    slotProps={{ htmlInput: { min: 0, step: "any", style: { textAlign: "right" } } }}
                    sx={{ width: "6rem" }}
                  />
                  <IconButton size="small" onClick={() => setEditSplits(editSplits.filter((_, j) => j !== i))}>
                    <Box component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>×</Box>
                  </IconButton>
                </Box>
              );
            })}

            {dialogBrands.filter((b) => !editSplits.find((s) => s.brand_id === b.id)).length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  select
                  size="small"
                  value={addBrandId}
                  onChange={(e) => setAddBrandId(e.target.value)}
                  sx={{ flex: 1 }}
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="">Select brand</MenuItem>
                  {dialogBrands
                    .filter((b) => !editSplits.find((s) => s.brand_id === b.id))
                    .map((b) => (
                      <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                    ))}
                </TextField>
                <TextField
                  type="number"
                  size="small"
                  placeholder="Amount"
                  value={addBrandAmount}
                  onChange={(e) => setAddBrandAmount(e.target.value)}
                  sx={{ width: "6rem" }}
                />
                <Button size="small" onClick={addBrandSplitRow} disabled={!addBrandId || !addBrandAmount}>
                  Add
                </Button>
              </Box>
            )}
          </Box>
        )}
      </FormModal>

      <FormModal
        isOpen={decision !== null}
        onClose={() => setDecision(null)}
        title={
          decision
            ? `${decision.status === "APPROVED" ? "Approve" : "Reject"} ${decision.targetPlan.user.display_name}'s target?`
            : ""
        }
        onSubmit={handleDecision}
        submitLabel={decision?.status === "APPROVED" ? "Approve" : "Reject"}
      >
        <Typography color="text.secondary">
          {decision && `${decision.targetPlan.planning_period} · ${formatLakhs(Number(decision.targetPlan.target_amount_lakhs))}`}
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
