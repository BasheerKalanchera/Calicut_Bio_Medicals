import { useQuery } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { listSbuTargets } from "../services/targetPlanning";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";

// The SBU's quarterly target -- its brands' quarterly total on Brand Target
// Tracking, never typed (Annual Target Planning D47, D53, D55). What Target
// vs Actuals' SBU row measures against. Admin, GM and the SBU's own SBU
// Manager only (D26, D34); the screen hides it from everyone else.
export default function SbuTargetBox({ sbuId, period }: { sbuId: string; period: string }) {
  const { data: targets = [], isLoading, isError } = useQuery({
    queryKey: ["planning", "sbu-targets", period],
    queryFn: () => listSbuTargets(period),
  });
  const amount = targets.find((t) => t.sbu_id === sbuId)?.target_amount_lakhs ?? null;

  return (
    <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
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
