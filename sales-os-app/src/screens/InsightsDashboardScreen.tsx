import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import {
  getActivityLevels,
  getOverdueActions,
  getPipelineSummary,
  getStagnantDeals,
} from "../services/reporting";
import type { PipelineGroupBy } from "../types/reporting";

// Insights-Dashboard-Implementation-Plan.md's Frontend section: Sales Staff
// sees pipeline/forecast only; these four tiers additionally get the
// team-level widgets (rep comparison, activity levels, stagnant deals,
// team-rollup overdue actions).
const MANAGER_TIER_ROLES = new Set(["SBU Manager", "Area Manager", "Admin", "General Manager"]);

const GROUP_BY_OPTIONS: { value: PipelineGroupBy; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "rep", label: "Rep" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
];

// BR-OP-06 says 180 days, PRD says ~90 -- shipped as parameter options
// rather than picking one (Insights-Dashboard-Implementation-Plan.md,
// Open questions §2).
const STAGNANT_THRESHOLD_OPTIONS = [
  { value: 90, label: "90+ days" },
  { value: 180, label: "180+ days" },
];

function formatLakhs(v: number) {
  return `₹${v.toFixed(1)}L`;
}

// dataviz skill: a single-series magnitude comparison -- one sequential hue,
// thin bar with rounded ends, value always shown as visible text (never
// color alone), native `title` as the hover layer (redundant with the
// visible label, but still the expected affordance on a bar).
function MiniBar({
  label,
  value,
  max,
  formatValue,
}: {
  label: string;
  value: number;
  max: number;
  formatValue: (v: number) => string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }} title={`${label}: ${formatValue(value)}`}>
      <Box
        sx={{
          flex: "0 0 38%",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "text.primary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Box>
      <Box sx={{ flex: 1, height: 10, borderRadius: "5px", bgcolor: "#f3f4f6", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: "5px", bgcolor: "#2a78d6" }} />
      </Box>
      <Box
        sx={{
          flex: "0 0 auto",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "text.secondary",
          minWidth: 64,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(value)}
      </Box>
    </Box>
  );
}

function StatTile({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 160,
        bgcolor: "#fff",
        borderRadius: "1rem",
        border: "1px solid #f3f4f6",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        p: 2,
      }}
    >
      <Box sx={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", mb: 0.5 }}>
        {label}
      </Box>
      <Box sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#0b0b0b", fontVariantNumeric: "tabular-nums" }}>{value}</Box>
      {sublabel && <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>{sublabel}</Box>}
    </Box>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
          {title}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function LoadingOrEmpty({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  onRetry,
  errorText,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  errorText: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <Box sx={{ color: "#9ca3af", fontSize: "0.875rem", py: 2, textAlign: "center" }}>Loading...</Box>;
  }
  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
        {errorText}
      </Alert>
    );
  }
  if (isEmpty) {
    return (
      <Box sx={{ color: "#9ca3af", fontSize: "0.875rem", py: 2, textAlign: "center", fontStyle: "italic" }}>
        {emptyText}
      </Box>
    );
  }
  return null;
}

export default function InsightsDashboardScreen() {
  const { userProfile } = useAuth();
  const isManagerTier = MANAGER_TIER_ROLES.has((userProfile as { role_name?: string } | null)?.role_name ?? "");

  const [groupBy, setGroupBy] = useState<PipelineGroupBy>(isManagerTier ? "rep" : "stage");
  const [thresholdDays, setThresholdDays] = useState(180);

  const today = dayjs();
  const periodStart = today.subtract(30, "day").format("YYYY-MM-DD");
  const periodEnd = today.format("YYYY-MM-DD");

  const pipelineQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", groupBy],
    queryFn: () => getPipelineSummary(groupBy),
  });

  const activityQuery = useQuery({
    queryKey: ["reporting", "activity-levels", periodStart, periodEnd],
    queryFn: () => getActivityLevels(periodStart, periodEnd),
    enabled: isManagerTier,
  });

  const stagnantQuery = useQuery({
    queryKey: ["reporting", "stagnant-deals", thresholdDays],
    queryFn: () => getStagnantDeals(thresholdDays),
    enabled: isManagerTier,
  });

  const overdueQuery = useQuery({
    queryKey: ["reporting", "overdue-actions"],
    queryFn: () => getOverdueActions(),
    enabled: isManagerTier,
  });

  const pipelineRows = pipelineQuery.data?.rows ?? [];
  const totalValue = pipelineRows.reduce((s, r) => s + parseFloat(r.total_value_lakhs), 0);
  const totalUnweighted = pipelineRows.reduce((s, r) => s + parseFloat(r.unweighted_forecast_lakhs), 0);
  const totalWeighted = pipelineRows.reduce((s, r) => s + parseFloat(r.weighted_forecast_lakhs), 0);
  const totalCount = pipelineRows.reduce((s, r) => s + r.opportunity_count, 0);
  const maxGroupValue = Math.max(1, ...pipelineRows.map((r) => parseFloat(r.total_value_lakhs)));

  const activityRows = activityQuery.data?.rows ?? [];
  const maxActivityCount = Math.max(1, ...activityRows.map((r) => r.activity_count));

  const overdueRows = overdueQuery.data?.rows ?? [];
  const stagnantRows = stagnantQuery.data?.rows ?? [];

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
            emptyText="No open pipeline."
            errorText="Couldn't load pipeline summary."
            onRetry={() => pipelineQuery.refetch()}
          />
          {pipelineRows.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pipelineRows.map((row) => (
                <MiniBar key={row.group_id} label={row.group_name} value={parseFloat(row.total_value_lakhs)} max={maxGroupValue} formatValue={formatLakhs} />
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

          <SectionCard
            title="Stagnant Deals"
            action={
              <TextField select size="small" value={thresholdDays} onChange={(e) => setThresholdDays(Number(e.target.value))} sx={{ minWidth: 110 }}>
                {STAGNANT_THRESHOLD_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            }
          >
            <LoadingOrEmpty
              isLoading={stagnantQuery.isLoading}
              isError={stagnantQuery.isError}
              isEmpty={stagnantRows.length === 0}
              emptyText="No deals past the threshold. Nice."
              errorText="Couldn't load stagnant deals."
              onRetry={() => stagnantQuery.refetch()}
            />
            {stagnantRows.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {stagnantRows.map((row) => {
                  const critical = row.days_stagnant >= thresholdDays * 1.5;
                  return (
                    <Box
                      key={row.opportunity_id}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid #f3f4f6" }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.opportunity_name}
                        </Box>
                        <Box sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          {row.account_name} · {row.owner_name} · {row.stage_name}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          flexShrink: 0,
                          ml: 1,
                          fontSize: "0.75rem",
                          fontWeight: 900,
                          px: 1,
                          py: 0.25,
                          borderRadius: "0.375rem",
                          bgcolor: critical ? "#fdecea" : "#fff8e6",
                          color: critical ? "#d03b3b" : "#b8790f",
                        }}
                      >
                        {row.days_stagnant}d idle
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </>
      )}
    </Box>
  );
}
