import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { getTeamTargets, setPersonTarget } from "../services/targetPlanning";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";

// Annual Target Planning D30, D33, D45, D57, D62. One query feeds both the
// "Your target" line and the Team targets panel (same key, fetched once).
function useTeamTargets(sbuId: string, period: string) {
  return useQuery({
    queryKey: ["planning", "team-targets", sbuId, period],
    queryFn: () => getTeamTargets(sbuId, period),
  });
}

// "Your target for Oct–Dec 2026": the person's own figure only (D35), set by
// the person they report to. Not shown to Admin/GM, who have none.
export function YourTargetLine({ sbuId, period }: { sbuId: string; period: string }) {
  const { data, isError } = useTeamTargets(sbuId, period);
  if (isError || !data) return null;
  return (
    <Typography sx={{ mb: 1.5 }}>
      Your target for {formatPlanningPeriod(period)}:{" "}
      {data.own_target_lakhs !== null ? (
        <strong>{formatLakhs(Number(data.own_target_lakhs))}</strong>
      ) : (
        <Typography component="span" color="text.secondary">Not set yet</Typography>
      )}
    </Typography>
  );
}

// Each manager divides their own quarterly target among the people who
// report to them, one figure per person, with a warning while the figures
// don't add up (D33). Admin/GM divide the SBU target among the people at the
// top of the SBU (D62). Hidden for anyone with no one reporting to them.
export default function TeamTargetsPanel({ sbuId, period, isCompanyWide }: { sbuId: string; period: string; isCompanyWide: boolean }) {
  const queryClient = useQueryClient();
  const { data, isError } = useTeamTargets(sbuId, period);
  // The row being edited and its box's text.
  const [editing, setEditing] = useState<{ userId: string; draft: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return <Alert severity="error" sx={{ mb: 2 }}>Couldn't load team targets. Refresh to try again.</Alert>;
  }
  if (!data || data.reports.length === 0) return null;

  const amount = editing ? Number(editing.draft) : NaN;
  const empty = !editing || editing.draft.trim() === "";
  const invalid = !empty && (!Number.isFinite(amount) || amount < 0);
  const canSave = !empty && !invalid;

  const handleSave = async () => {
    if (!editing || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await setPersonTarget({ user_id: editing.userId, planning_period: period, target_amount_lakhs: amount });
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["planning", "team-targets"] });
      queryClient.invalidateQueries({ queryKey: ["planning", "target-vs-actuals"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the target.");
    } finally {
      setSaving(false);
    }
  };

  const total = Number(data.reports_total_lakhs);
  const compareTo = data.compare_to_lakhs === null ? null : Number(data.compare_to_lakhs);
  const compareLabel = isCompanyWide ? "the SBU target" : "your own target";
  const anySet = data.reports.some((r) => r.target_lakhs !== null);
  let warning: string | null = null;
  if (compareTo === null) {
    if (anySet) warning = `${isCompanyWide ? "The SBU target" : "Your own target"} isn't set yet, so these can't be checked against it.`;
  } else if (Math.round(total * 100) !== Math.round(compareTo * 100)) {
    const diff = Math.abs(total - compareTo);
    warning = `These add up to ${formatLakhs(total)}, ${formatLakhs(diff)} ${total < compareTo ? "short of" : "over"} ${compareLabel} (${formatLakhs(compareTo)}).`;
  }

  return (
    <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Team targets</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {isCompanyWide
          ? `Divide the SBU target for ${formatPlanningPeriod(period)} among the people at the top of this SBU.`
          : `Divide your target for ${formatPlanningPeriod(period)} among the people who report to you.`}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Person</TableCell>
            <TableCell>Target</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.reports.map((r) => {
            const isEditing = editing?.userId === r.user_id;
            return (
              <TableRow key={r.user_id}>
                <TableCell>
                  {r.display_name}
                  {r.role_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{r.role_name}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      size="small"
                      type="number"
                      label="₹ Lakhs"
                      value={editing.draft}
                      onChange={(e) => setEditing({ userId: r.user_id, draft: e.target.value })}
                      error={invalid}
                      helperText={invalid ? "Enter 0 or more" : undefined}
                      slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                      sx={{ width: "10rem" }}
                      autoFocus
                    />
                  ) : r.target_lakhs !== null ? (
                    formatLakhs(Number(r.target_lakhs))
                  ) : (
                    <Typography component="span" color="text.secondary">Not set</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {isEditing ? (
                    <>
                      <Button size="small" variant="contained" onClick={handleSave} disabled={!canSave || saving}>
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button size="small" onClick={() => { setEditing(null); setError(null); }} disabled={saving}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => { setError(null); setEditing({ userId: r.user_id, draft: r.target_lakhs !== null ? String(Number(r.target_lakhs)) : "" }); }}
                      disabled={editing !== null}
                    >
                      {r.target_lakhs !== null ? "Change" : "Set target"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{formatLakhs(total)}</TableCell>
            <TableCell align="right" sx={{ color: "text.secondary" }}>
              {compareTo !== null && `${isCompanyWide ? "SBU target" : "Your target"}: ${formatLakhs(compareTo)}`}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {warning && <Alert severity="warning" sx={{ mt: 1.5 }}>{warning}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Box>
  );
}
