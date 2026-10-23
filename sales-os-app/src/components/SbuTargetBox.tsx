import { useQueries, useQuery } from "@tanstack/react-query";
import { Alert, Box, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { listSbuTargets } from "../services/targetPlanning";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";

// The SBU's quarterly target -- its brands' quarterly total on Brand Target
// Tracking, never typed (Annual Target Planning D47, D53, D55). What Target
// vs Actuals' SBU row measures against. Admin, GM and the SBU's own SBU
// Manager only (D26, D34); the screen hides it from everyone else. Its own
// card, above Team Targets (D75).
export default function SbuTargetBox({ sbuId, period }: { sbuId: string; period: string }) {
  const { data: targets = [], isLoading, isError } = useQuery({
    queryKey: ["planning", "sbu-targets", period],
    queryFn: () => listSbuTargets(period),
  });
  const amount = targets.find((t) => t.sbu_id === sbuId)?.target_amount_lakhs ?? null;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>SBU Target</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography color="text.secondary">SBU target for {formatPlanningPeriod(period)}:</Typography>
        <Typography>
          {isLoading
            ? "…"
            : isError
              ? "Couldn't load the SBU target. Refresh to try again."
              : amount !== null
                ? (
                  <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {formatLakhs(Number(amount))}
                  </Typography>
                )
                : "Not set — no brand has a target for this quarter yet"}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        The total of this SBU's brand targets for the quarter, set on Brand Target Tracking.
      </Typography>
    </Box>
  );
}

// Annual view (D75): the SBU's year is simply its four quarters added up
// (D47), shown with each quarter. View-only, same viewers as above.
export function AnnualSbuTargetCard({ sbuId, quarters, yearLabel }: { sbuId: string; quarters: string[]; yearLabel: string }) {
  const results = useQueries({
    queries: quarters.map((q) => ({
      queryKey: ["planning", "sbu-targets", q],
      queryFn: () => listSbuTargets(q),
    })),
  });

  if (results.some((r) => r.isError)) {
    return <Alert severity="error">Couldn't load the SBU target. Refresh to try again.</Alert>;
  }
  if (results.some((r) => !r.data)) return null;

  const byQuarter = results.map((r) => {
    const amount = r.data!.find((t) => t.sbu_id === sbuId)?.target_amount_lakhs ?? null;
    return amount === null ? null : Number(amount);
  });
  const set = byQuarter.filter((v): v is number => v !== null);
  const year = set.length > 0 ? set.reduce((a, b) => a + b, 0) : null;
  const notSet = <Typography component="span" variant="body2" color="text.secondary">Not set — no brand has a target for this quarter yet</Typography>;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>SBU Target</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        The total of this SBU's brand targets, set on Brand Target Tracking. The year is its four quarters added up.
      </Typography>
      <Table size="small">
        <TableBody>
          <TableRow sx={{ "& td": { fontWeight: 700 } }}>
            <TableCell>{yearLabel} — Annual Total</TableCell>
            <TableCell>{year !== null ? formatLakhs(year) : <Typography component="span" variant="body2" color="text.secondary">Not set</Typography>}</TableCell>
          </TableRow>
          {quarters.map((q, i) => (
            <TableRow key={q}>
              <TableCell sx={{ pl: 3, color: "text.secondary" }}>{formatPlanningPeriod(q)}</TableCell>
              <TableCell>{byQuarter[i] !== null ? formatLakhs(byQuarter[i]!) : notSet}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
