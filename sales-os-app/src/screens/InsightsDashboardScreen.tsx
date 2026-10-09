import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import dayjs from "dayjs";
import { LoadingOrEmpty, MiniBar, SectionCard, StatTile, ZoneTreeNote } from "../components/ReportingUI";
import TargetVsActualsSection from "../components/TargetVsActualsSection";
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
//
// Tabs (Basheer, 2026-10-09): one section per tab instead of one long
// scroll, pill style copied from Customer360Screen's chip bar. Always opens
// on Target vs Actuals; each tab's queries run only once it is opened.
const MANAGER_TIER_ROLES = new Set(["SBU Manager", "Area Manager", "Admin", "General Manager"]);

const GROUP_BY_OPTIONS: { value: PipelineGroupBy; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "rep", label: "Rep" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
];

type TabId = "target" | "pipeline" | "activity" | "overdue";

const TABS: { id: TabId; label: string; managerOnly: boolean }[] = [
  { id: "target", label: "Target vs Actuals", managerOnly: false },
  { id: "pipeline", label: "Pipeline", managerOnly: false },
  { id: "activity", label: "Team Activity", managerOnly: true },
  { id: "overdue", label: "Overdue Actions", managerOnly: true },
];

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

interface Props {
  // DemoApp keeps this screen mounted while hidden; used to reset to the
  // first tab so the screen always opens on Target vs Actuals.
  isActive: boolean;
}

export default function InsightsDashboardScreen({ isActive }: Props) {
  const { userProfile } = useAuth();
  const isManagerTier = MANAGER_TIER_ROLES.has((userProfile as { role_name?: string } | null)?.role_name ?? "");
  const tabs = TABS.filter((t) => isManagerTier || !t.managerOnly);

  const [activeTab, setActiveTab] = useState<TabId>("target");
  const chipBarRef = useRef<HTMLDivElement>(null);

  const centerTab = useCallback((tabId: TabId, behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior });
        }
      }
    }, 50);
  }, []);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    centerTab(tabId);
  }, [centerTab]);

  // Back to the first tab whenever the screen is hidden (state adjusted
  // during render, React's recommended alternative to setState in an effect).
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (!isActive) setActiveTab("target");
  }

  useEffect(() => {
    if (!isActive) centerTab("target", "auto");
  }, [isActive, centerTab]);

  const [groupBy, setGroupBy] = useState<PipelineGroupBy>(isManagerTier ? "rep" : "stage");

  const today = dayjs();
  const periodStart = today.subtract(30, "day").format("YYYY-MM-DD");
  const periodEnd = today.format("YYYY-MM-DD");

  const pipelineQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", groupBy],
    queryFn: () => getPipelineSummary(groupBy),
    enabled: activeTab === "pipeline",
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
    enabled: activeTab === "pipeline",
  });

  const activityQuery = useQuery({
    queryKey: ["reporting", "activity-levels", periodStart, periodEnd],
    queryFn: () => getActivityLevels(periodStart, periodEnd),
    enabled: isManagerTier && activeTab === "activity",
  });

  const overdueQuery = useQuery({
    queryKey: ["reporting", "overdue-actions"],
    queryFn: () => getOverdueActions(),
    enabled: isManagerTier && activeTab === "overdue",
  });

  const pipelineRows = pipelineQuery.data?.rows ?? [];
  const maxGroupValue = Math.max(1, ...pipelineRows.map((r) => parseFloat(r.total_value_lakhs)));

  const headlineRows = headlineQuery.data?.rows ?? [];
  const totalValue = headlineRows.reduce((s, r) => s + parseFloat(r.total_value_lakhs), 0);
  const totalWeighted = headlineRows.reduce((s, r) => s + parseFloat(r.weighted_forecast_lakhs), 0);
  const totalCount = headlineRows.reduce((s, r) => s + r.opportunity_count, 0);

  const activityRows = activityQuery.data?.rows ?? [];
  const maxActivityCount = Math.max(1, ...activityRows.map((r) => r.activity_count));

  const overdueRows = overdueQuery.data?.rows ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* Tab chip bar -- stays put while the tab content scrolls */}
      <Box sx={{ position: "relative", px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Box
          ref={chipBarRef}
          sx={{
            display: "flex", gap: 1, overflowX: "auto", pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            pr: "50vw",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => handleTabChange(tab.id)}
                sx={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                  borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap",
                  transition: "all 0.2s", border: "1px solid", textTransform: "none",
                  ...(isActive
                    ? { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main", boxShadow: SHADOW_SM }
                    : { bgcolor: "#fff", color: "#6b7280", borderColor: "#e5e7eb", "&:hover": { borderColor: "#93c5fd", color: "primary.main" } }),
                }}
              >
                {isActive && <CheckIcon sx={{ fontSize: 14, flexShrink: 0 }} />}
                {tab.label}
              </Button>
            );
          })}
        </Box>
        <Box sx={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, pointerEvents: "none", background: "linear-gradient(to left, #f9fafb, transparent)" }} />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {activeTab === "target" && <TargetVsActualsSection />}

        {activeTab === "pipeline" && (
          <>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <StatTile label="Active Pipeline Value" value={formatLakhs(totalValue)} sublabel={`${totalCount} active deals`} />
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
                emptyText={isManagerTier ? "No active pipeline." : "You don't own any active deals yet."}
                errorText="Couldn't load pipeline summary."
                onRetry={() => pipelineQuery.refetch()}
              />
              {pipelineRows.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {pipelineRows.map((row) => (
                    <MiniBar
                      key={`${row.group_id}${row.zone_exact ? "-exact" : ""}`}
                      label={row.group_name}
                      value={parseFloat(row.total_value_lakhs)}
                      max={maxGroupValue}
                      formatValue={formatLakhs}
                      secondaryValue={parseFloat(row.weighted_forecast_lakhs)}
                      secondaryLabel="weighted"
                      count={row.opportunity_count}
                      indent={row.depth ?? 0}
                    />
                  ))}
                </Box>
              )}
              {groupBy === "zone" && pipelineRows.length > 0 && <ZoneTreeNote />}
            </SectionCard>
          </>
        )}

        {isManagerTier && activeTab === "activity" && (
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
        )}

        {isManagerTier && activeTab === "overdue" && (
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
        )}
      </Box>
    </Box>
  );
}
