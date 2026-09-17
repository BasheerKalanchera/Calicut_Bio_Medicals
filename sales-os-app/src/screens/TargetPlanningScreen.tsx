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
} from "../utils/reporting";
import type { TargetPlan, TargetPlanStatus } from "../types/targetPlanning";

// Local stopgap type -- masterData.ts's listSbus returns Promise<unknown>
// today (same TODO noted in MarketingLeadCreateModal.tsx et al.).
interface SbuOption { id: string; name: string }

// SBU Manager/Area Manager see the rollup for their own SBU; Admin/GM pick
// one (they carry no real business SBU of their own -- see
// Target-Planning-Implementation-Plan.md). Sales Staff never sees this
// section at all.
const ROLLUP_VISIBLE_ROLES = new Set(["Admin", "General Manager", "SBU Manager", "Area Manager"]);
const SBU_PICKER_ROLES = new Set(["Admin", "General Manager"]);

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

function fiscalYearLabel(fyStartYear: number): string {
  return `FY ${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;
}

// One person's target amounts across a fiscal year's 4 quarters -- the
// annual rollup's per-rep grouping (Group H's "grouped rows" layout).
interface AnnualPerson {
  user: TargetPlan["user"];
  total: number;
  byQuarter: Record<string, TargetPlan | undefined>;
}

export default function TargetPlanningScreen() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const roleName: string | undefined = userProfile?.role_name;
  const showRollup = !!roleName && ROLLUP_VISIBLE_ROLES.has(roleName);
  const showSbuPicker = !!roleName && SBU_PICKER_ROLES.has(roleName);

  const [viewMode, setViewMode] = useState<"quarterly" | "annual">("quarterly");
  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(period);
  const [editingTarget, setEditingTarget] = useState<TargetPlan | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [decision, setDecision] = useState<{ targetPlan: TargetPlan; status: "APPROVED" | "REJECTED" } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const fyStartYear = getFiscalYearOfPeriod(period);
  const yearQuarters = getPlanningYearQuarters(fyStartYear);
  const isAnnual = viewMode === "annual";
  const periodLabel = isAnnual ? fiscalYearLabel(fyStartYear) : period;

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: showSbuPicker,
  });

  // Admin/GM must pick an SBU explicitly (no natural default) -- derived
  // from the loaded list rather than an effect, defaulting to the first one
  // until the user picks a different one.
  const rollupSbuId = showSbuPicker ? (selectedSbuId ?? sbus[0]?.id ?? null) : userProfile?.sbu_id ?? null;

  const { data: myTargets = [] } = useQuery({
    queryKey: ["target-plans", "mine"],
    queryFn: listTargetPlans,
  });
  const myTarget = myTargets.find((t) => t.planning_period === period) ?? null;
  const myAnnualByQuarter: Record<string, TargetPlan | undefined> = {};
  for (const q of yearQuarters) myAnnualByQuarter[q] = myTargets.find((t) => t.planning_period === q);
  const myAnnualTotal = yearQuarters.reduce(
    (sum, q) => sum + Number(myAnnualByQuarter[q]?.target_amount_lakhs ?? 0),
    0
  );

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

  const openTargetDialog = (quarterPeriod: string, existing: TargetPlan | null) => {
    setEditingPeriod(quarterPeriod);
    setEditingTarget(existing);
    setAmountInput(existing ? existing.target_amount_lakhs : "");
    setTargetDialogOpen(true);
  };

  const handleSaveTarget = async () => {
    const amount = Number(amountInput);
    if (!amountInput.trim() || Number.isNaN(amount) || amount <= 0) {
      throw new Error("Enter a target amount greater than zero");
    }
    if (editingTarget) {
      await updateTargetPlan(editingTarget.id, { target_amount_lakhs: amount });
    } else {
      await createTargetPlan({
        sbu_id: userProfile.sbu_id,
        planning_period: editingPeriod,
        target_amount_lakhs: amount,
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

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>My Target</Typography>
        {!isAnnual ? (
          myTarget ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {formatLakhs(Number(myTarget.target_amount_lakhs))}
              </Typography>
              <StatusChip status={myTarget.status} />
              <Button variant="outlined" size="small" onClick={() => openTargetDialog(period, myTarget)}>Revise</Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography color="text.secondary">No target set for {period} yet.</Typography>
              <Button variant="contained" size="small" onClick={() => openTargetDialog(period, null)}>Set Target</Button>
            </Box>
          )
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Quarter</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ "& td": { fontWeight: 700, borderBottom: "2px solid", borderColor: "divider" } }}>
                <TableCell>Annual Total</TableCell>
                <TableCell>{formatLakhs(myAnnualTotal)}</TableCell>
                <TableCell />
                <TableCell align="right" />
              </TableRow>
              {yearQuarters.map((q) => {
                const t = myAnnualByQuarter[q];
                return (
                  <TableRow key={q}>
                    <TableCell sx={{ pl: 3, color: "text.secondary" }}>{q}</TableCell>
                    <TableCell>{t ? formatLakhs(Number(t.target_amount_lakhs)) : "—"}</TableCell>
                    <TableCell>
                      {t ? <StatusChip status={t.status} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openTargetDialog(q, t ?? null)}>{t ? "Revise" : "Set"}</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

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
            {showSbuPicker && (
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
                      <TableCell><StatusChip status={t.status} /></TableCell>
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
                              {t ? <StatusChip status={t.status} /> : <Typography color="text.secondary" variant="body2">Not set</Typography>}
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
