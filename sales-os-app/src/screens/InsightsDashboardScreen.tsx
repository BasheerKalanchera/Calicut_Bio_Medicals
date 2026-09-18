import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import { LoadingOrEmpty, MiniBar, SectionCard, StatTile } from "../components/ReportingUI";
import { useAuth } from "../contexts/AuthContext";
import { getActivityLevels, getOverdueActions, getPipelineSummary } from "../services/reporting";
import type { PipelineGroupBy } from "../types/reporting";
import { formatLakhs } from "../utils/formatter";

// Insights-Dashboard-Implementation-Plan.md's Dashboard-vs-Reports split
// (2026-09-11): this screen stays tiles-only -- single numbers and per-rep
// comparisons. Stagnant Deals, Product Performance Summary, and
// Opportunities On Hold are each their own full report screen now (see
// StagnantDealsReportScreen.tsx, ProductPerformanceReportScreen.tsx,
// OpportunitiesOnHoldReportScreen.tsx), not dashboard tiles.
const MANAGER_TIER_ROLES = new Set(["SBU Manager", "Area Manager", "Admin", "General Manager"]);

const GROUP_BY_OPTIONS: { value: PipelineGroupBy; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "rep", label: "Rep" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
  { value: "product", label: "Product" },
];

export default function InsightsDashboardScreen() {
  const { userProfile } = useAuth();
  const isManagerTier = MANAGER_TIER_ROLES.has((userProfile as { role_name?: string } | null)?.role_name ?? "");

  const [groupBy, setGroupBy] = useState<PipelineGroupBy>(isManagerTier ? "rep" : "stage");

  const today = dayjs();
  const periodStart = today.subtract(30, "day").format("YYYY-MM-DD");
  const periodEnd = today.format("YYYY-MM-DD");

  const pipelineQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", groupBy],
    queryFn: () => getPipelineSummary(groupBy),
  });

  // Headline totals are fetched separately, always grouped by Stage --
  // every deal has exactly one stage, so summing across these rows can
  // never double-count. Deliberately independent of `groupBy`/`pipelineQuery`
  // above: those exist to feed the "Pipeline by X" breakdown list, which
  // Product doesn't share this 1:1 guarantee (a deal can carry more than one
  // product), so reusing its rows here would misstate the headline numbers
  // whenever "Product" is selected. Shares its cache with `pipelineQuery`
  // when Stage is the selected breakdown, no duplicate request.
  const headlineQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", "stage"],
    queryFn: () => getPipelineSummary("stage"),
  });

  const activityQuery = useQuery({
    queryKey: ["reporting", "activity-levels", periodStart, periodEnd],
    queryFn: () => getActivityLevels(periodStart, periodEnd),
    enabled: isManagerTier,
  });

  const overdueQuery = useQuery({
    queryKey: ["reporting", "overdue-actions"],
    queryFn: () => getOverdueActions(),
    enabled: isManagerTier,
  });

  const pipelineRows = pipelineQuery.data?.rows ?? [];
  const maxGroupValue = Math.max(1, ...pipelineRows.map((r) => parseFloat(r.total_value_lakhs)));

  const headlineRows = headlineQuery.data?.rows ?? [];
  const totalValue = headlineRows.reduce((s, r) => s + parseFloat(r.total_value_lakhs), 0);
  const totalUnweighted = headlineRows.reduce((s, r) => s + parseFloat(r.unweighted_forecast_lakhs), 0);
  const totalWeighted = headlineRows.reduce((s, r) => s + parseFloat(r.weighted_forecast_lakhs), 0);
  const totalCount = headlineRows.reduce((s, r) => s + r.opportunity_count, 0);

  const activityRows = activityQuery.data?.rows ?? [];
  const maxActivityCount = Math.max(1, ...activityRows.map((r) => r.activity_count));

  const overdueRows = overdueQuery.data?.rows ?? [];

  return (
    <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <StatTile label="Open Pipeline Value" value={formatLakhs(totalValue)} sublabel={`${totalCount} open deals`} />
          <StatTile label="Unweighted Forecast" value={formatLakhs(totalUnweighted)} sublabel="Active deals, full value" />
          <StatTile label="Weighted Forecast" value={formatLakhs(totalWeighted)} sublabel="Active deals, win-probability adjusted" />
        </Box>

        <SectionCard
          title={`Pipeline by ${GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label}`}
          action={
            <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value as PipelineGroupBy)} sx={{ minWidth: 110 }}>
              {GROUP_BY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          }
        >
          <LoadingOrEmpty
            isLoading={pipelineQuery.isLoading}
            isError={pipelineQuery.isError}
            isEmpty={pipelineRows.length === 0}
            emptyText={isManagerTier ? "No open pipeline." : "You don't own any open deals yet."}
            errorText="Couldn't load pipeline summary."
            onRetry={() => pipelineQuery.refetch()}
          />
          {pipelineRows.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pipelineRows.map((row) => (
                <MiniBar
                  key={row.group_id}
                  label={row.group_name}
                  value={parseFloat(row.total_value_lakhs)}
                  max={maxGroupValue}
                  formatValue={formatLakhs}
                  secondaryValue={parseFloat(row.weighted_forecast_lakhs)}
                  secondaryLabel="weighted"
                />
              ))}
            </Box>
          )}
        </SectionCard>
      </Box>

      {isManagerTier && (
        <>
          <SectionCard title="Team Activity — last 30 days">
            <LoadingOrEmpty
              isLoading={activityQuery.isLoading}
              isError={activityQuery.isError}
              isEmpty={activityRows.length === 0}
              emptyText="No activity logged in this period."
              errorText="Couldn't load activity levels."
              onRetry={() => activityQuery.refetch()}
            />
            {activityRows.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {activityRows.map((row) => (
                  <MiniBar key={row.user_id} label={row.display_name} value={row.activity_count} max={maxActivityCount} formatValue={(v) => String(v)} />
                ))}
              </Box>
            )}
          </SectionCard>

          <SectionCard title={`Overdue Actions${overdueQuery.data ? ` — ${overdueQuery.data.total_overdue} total` : ""}`}>
            <LoadingOrEmpty
              isLoading={overdueQuery.isLoading}
              isError={overdueQuery.isError}
              isEmpty={overdueRows.length === 0}
              emptyText="Nobody on the team has overdue actions."
              errorText="Couldn't load overdue actions."
              onRetry={() => overdueQuery.refetch()}
            />
            {overdueRows.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {overdueRows.map((row) => (
                  <Box key={row.user_id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
                    <Box sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "text.primary" }}>{row.display_name}</Box>
                    <Box
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        px: 1,
                        py: 0.25,
                        borderRadius: "0.375rem",
                        bgcolor: row.overdue_count > 0 ? "#fdecea" : "#f3f4f6",
                        color: row.overdue_count > 0 ? "#d03b3b" : "#9ca3af",
                      }}
                    >
                      {row.overdue_count} overdue
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </>
      )}
    </Box>
  );
}
