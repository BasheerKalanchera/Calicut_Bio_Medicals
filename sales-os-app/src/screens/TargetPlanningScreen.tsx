import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { getCurrentPlanningPeriod, shiftPlanningPeriod, formatLakhs } from "../utils/reporting";
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

export default function TargetPlanningScreen() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const roleName: string | undefined = userProfile?.role_name;
  const showRollup = !!roleName && ROLLUP_VISIBLE_ROLES.has(roleName);
  const showSbuPicker = !!roleName && SBU_PICKER_ROLES.has(roleName);

  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [decision, setDecision] = useState<{ targetPlan: TargetPlan; status: "APPROVED" | "REJECTED" } | null>(null);
  const [noteInput, setNoteInput] = useState("");

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

  const { data: pendingApproval = [] } = useQuery({
    queryKey: ["target-plans", "pending-approval"],
    queryFn: listPendingApproval,
  });

  const { data: rollup } = useQuery({
    queryKey: ["target-plans", "rollup", rollupSbuId, period],
    queryFn: () => getSbuRollup(rollupSbuId as string, period),
    enabled: showRollup && !!rollupSbuId,
  });

  const { data: teamTargets = [] } = useQuery({
    queryKey: ["target-plans", "team", rollupSbuId, period],
    queryFn: () => listTeamTargets(rollupSbuId as string, period),
    enabled: showRollup && !!rollupSbuId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["target-plans"] });
  };

  const openTargetDialog = () => {
    setAmountInput(myTarget ? myTarget.target_amount_lakhs : "");
    setTargetDialogOpen(true);
  };

  const handleSaveTarget = async () => {
    const amount = Number(amountInput);
    if (!amountInput.trim() || Number.isNaN(amount) || amount <= 0) {
      throw new Error("Enter a target amount greater than zero");
    }
    if (myTarget) {
      await updateTargetPlan(myTarget.id, { target_amount_lakhs: amount });
    } else {
      await createTargetPlan({
        sbu_id: userProfile.sbu_id,
        planning_period: period,
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton size="small" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, -1))} title="Previous quarter">
          <Box component="span">◀</Box>
        </IconButton>
        <Typography sx={{ fontWeight: 700, minWidth: "5rem", textAlign: "center" }}>{period}</Typography>
        <IconButton size="small" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, 1))} title="Next quarter">
          <Box component="span">▶</Box>
        </IconButton>
      </Box>

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>My Target</Typography>
        {myTarget ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {formatLakhs(Number(myTarget.target_amount_lakhs))}
            </Typography>
            <StatusChip status={myTarget.status} />
            <Button variant="outlined" size="small" onClick={openTargetDialog}>Revise</Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography color="text.secondary">No target set for {period} yet.</Typography>
            <Button variant="contained" size="small" onClick={openTargetDialog}>Set Target</Button>
          </Box>
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
        </Box>
      )}

      <FormModal
        isOpen={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
        title={myTarget ? `Revise Target — ${period}` : `Set Target — ${period}`}
        onSubmit={handleSaveTarget}
        submitLabel={myTarget ? "Save" : "Create"}
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
        {myTarget?.status === "APPROVED" && (
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
