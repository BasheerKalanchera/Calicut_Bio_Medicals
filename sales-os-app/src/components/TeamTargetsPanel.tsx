import { useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { getTeamTargets, removePersonTarget, setPersonTarget } from "../services/targetPlanning";
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
// Its own card on the screen (D75).
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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["planning", "team-targets"] });
    queryClient.invalidateQueries({ queryKey: ["planning", "target-vs-actuals"] });
  };

  const handleSave = async () => {
    if (!editing || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await setPersonTarget({ user_id: editing.userId, planning_period: period, target_amount_lakhs: amount });
      setEditing(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the target.");
    } finally {
      setSaving(false);
    }
  };

  // No confirmation: the audit trail keeps the removed figure (D74).
  const handleRemove = async (userId: string) => {
    setSaving(true);
    setError(null);
    try {
      await removePersonTarget(userId, period);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove the target.");
    } finally {
      setSaving(false);
    }
  };

  const total = Number(data.reports_total_lakhs);
  const compareTo = data.compare_to_lakhs === null ? null : Number(data.compare_to_lakhs);
  const compareLabel = isCompanyWide ? "the SBU target" : "your own target";
  const showYourTarget = !isCompanyWide && compareTo !== null;
  const anySet = data.reports.some((r) => r.target_lakhs !== null);
  // Before anyone has a target, say the target hasn't been handed down yet
  // rather than warning that it's short (Basheer, 2026-10-22).
  const notPassedOn = compareTo !== null && !anySet
    ? (isCompanyWide
      ? `The SBU target of ${formatLakhs(compareTo)} hasn't been passed on to the team yet.`
      : `Your target of ${formatLakhs(compareTo)} hasn't been passed on to your team yet.`)
    : null;
  let warning: string | null = null;
  if (compareTo === null) {
    if (anySet) warning = `${isCompanyWide ? "The SBU target" : "Your own target"} isn't set yet, so these can't be checked against it.`;
  } else if (anySet && Math.round(total * 100) !== Math.round(compareTo * 100)) {
    const diff = Math.abs(total - compareTo);
    warning = `These add up to ${formatLakhs(total)}, ${formatLakhs(diff)} ${total < compareTo ? "short of" : "over"} ${compareLabel} (${formatLakhs(compareTo)}).`;
  }

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Team Targets</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {isCompanyWide
          ? `Divide the SBU target for ${formatPlanningPeriod(period)} among the people at the top of this SBU.`
          : `Divide your target for ${formatPlanningPeriod(period)} among the people who report to you.`}
      </Typography>
      {/* On a phone each person is a card: name, target, buttons. */}
      <TableOrCards columns={[{ label: "Person" }, { label: "Target" }, { label: "Actions", align: "right" }]}>
          {data.reports.map((r) => {
            const isEditing = editing?.userId === r.user_id;
            return (
              <TocRow key={r.user_id}>
                <TocCell title>
                  {r.display_name}
                  {r.role_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>{r.role_name}</Typography>
                  )}
                </TocCell>
                <TocCell label="Target" field={isEditing}>
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
                    <Typography component="span" variant="body2" color="text.secondary">Not set</Typography>
                  )}
                </TocCell>
                <TocCell action align="right">
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
                    <>
                      <Button
                        size="small"
                        onClick={() => { setError(null); setEditing({ userId: r.user_id, draft: r.target_lakhs !== null ? String(Number(r.target_lakhs)) : "" }); }}
                        disabled={editing !== null || saving}
                      >
                        {r.target_lakhs !== null ? "Change" : "Set target"}
                      </Button>
                      {r.target_lakhs !== null && (
                        <Button size="small" color="error" onClick={() => handleRemove(r.user_id)} disabled={editing !== null || saving}>
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </TocCell>
              </TocRow>
            );
          })}
          <TocRow total>
            <TocCell title>Total</TocCell>
            <TocCell label="Total">{formatLakhs(total)}</TocCell>
            {/* Admin/GM: the SBU Target card above already shows it (D75). */}
            <TocCell align="right" phone={showYourTarget} sx={{ color: "text.secondary" }}>
              {showYourTarget && (
                <Box component="span" sx={{ fontWeight: 400 }}>Your target: {formatLakhs(compareTo!)}</Box>
              )}
            </TocCell>
          </TocRow>
      </TableOrCards>
      {notPassedOn && <Alert severity="info" sx={{ mt: 1.5 }}>{notPassedOn}</Alert>}
      {warning && <Alert severity="warning" sx={{ mt: 1.5 }}>{warning}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Box>
  );
}

// Annual view of the same card (D75): each person's four quarterly targets
// and their year, view-only -- targets are set a quarter at a time, and the
// "short of" warnings stay quarterly (D33). The team's year is shown beside
// the viewer's own year, without a warning; Admin/GM's is the SBU's, already
// on the SBU Target card above, so not repeated.
export function AnnualTeamTargetsCard({ sbuId, quarters, yearLabel, isCompanyWide }: {
  sbuId: string;
  quarters: string[];
  yearLabel: string;
  isCompanyWide: boolean;
}) {
  const results = useQueries({
    queries: quarters.map((q) => ({
      queryKey: ["planning", "team-targets", sbuId, q],
      queryFn: () => getTeamTargets(sbuId, q),
    })),
  });

  if (results.some((r) => r.isError)) {
    return <Alert severity="error">Couldn't load team targets. Refresh to try again.</Alert>;
  }
  if (results.some((r) => !r.data)) return null;

  // One block per person who reported to the viewer in any quarter, in the
  // server's order; a quarter they weren't in shows "Not set".
  const people = new Map<string, { name: string; role: string | null; byQuarter: Record<string, number | null> }>();
  results.forEach((r, i) => {
    for (const p of r.data!.reports) {
      if (!people.has(p.user_id)) people.set(p.user_id, { name: p.display_name, role: p.role_name, byQuarter: {} });
      people.get(p.user_id)!.byQuarter[quarters[i]] = p.target_lakhs === null ? null : Number(p.target_lakhs);
    }
  });
  if (people.size === 0) return null;

  const yearOf = (byQuarter: Record<string, number | null>) => {
    const set = quarters.map((q) => byQuarter[q]).filter((v): v is number => v != null);
    return set.length > 0 ? set.reduce((a, b) => a + b, 0) : null;
  };
  const teamYear = Array.from(people.values()).reduce((sum, p) => sum + (yearOf(p.byQuarter) ?? 0), 0);
  const compareSet = results.map((r) => r.data!.compare_to_lakhs).filter((v): v is string => v !== null);
  const compareYear = compareSet.length > 0 ? compareSet.reduce((a, b) => a + Number(b), 0) : null;
  const notSet = <Typography component="span" variant="body2" color="text.secondary">Not set</Typography>;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Team Targets</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Each person's quarterly targets for {yearLabel}. Switch to Quarterly to change a target.
      </Typography>
      {/* On a phone each person is one card with their quarters inside. */}
      <TableOrCards columns={[{ label: "Person / Quarter" }, { label: "Target" }]}>
          {Array.from(people.entries()).map(([userId, p]) => {
            const year = yearOf(p.byQuarter);
            return (
              <TocRow
                key={userId}
                total
                subRows={quarters.map((q) => {
                  const v = p.byQuarter[q];
                  return (
                    <TocRow key={`${userId}-${q}`}>
                      <TocCell title sx={{ pl: { sm: 3 }, color: "text.secondary", fontWeight: 400 }}>{formatPlanningPeriod(q)}</TocCell>
                      <TocCell label="Target">{v != null ? formatLakhs(v) : notSet}</TocCell>
                    </TocRow>
                  );
                })}
              >
                <TocCell title>
                  {p.name} — Annual Total
                  {p.role && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>{p.role}</Typography>
                  )}
                </TocCell>
                <TocCell label="Year">{year !== null ? formatLakhs(year) : notSet}</TocCell>
              </TocRow>
            );
          })}
          <TocRow total>
            <TocCell title>Team total for {yearLabel}</TocCell>
            <TocCell label="Total">
              {formatLakhs(teamYear)}
              {/* Admin/GM: the SBU Target card above already shows the year (D75). */}
              {!isCompanyWide && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                  {" · "}Your target for the year:{" "}
                  {compareYear !== null ? formatLakhs(compareYear) : "not set yet"}
                </Typography>
              )}
            </TocCell>
          </TocRow>
      </TableOrCards>
    </Box>
  );
}
