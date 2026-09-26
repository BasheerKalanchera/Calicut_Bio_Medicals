import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import { LoadingOrEmpty, MiniBar, StatTile } from "../components/ReportingUI";
import { getSalesHeadline, getSalesSummary } from "../services/reporting";
import { listStatuses } from "../services/masterData";
import type { ReportingFilters, SalesGroupBy } from "../types/reporting";
import { formatLakhs, getFiscalQuarterBounds } from "../utils/formatter";

const GROUP_BY_OPTIONS: { value: SalesGroupBy; label: string }[] = [
  { value: "rep", label: "Rep" },
  { value: "zone", label: "Zone" },
  { value: "sbu", label: "SBU" },
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
];

type Period = "month" | "quarter" | "all";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "all", label: "All Time" },
];

function periodFilters(period: Period): ReportingFilters {
  if (period === "all") return {};
  if (period === "month") {
    const today = dayjs();
    return {
      period_start: today.startOf("month").format("YYYY-MM-DD"),
      period_end: today.endOf("month").format("YYYY-MM-DD"),
    };
  }
  const { start, end } = getFiscalQuarterBounds();
  return { period_start: start, period_end: end };
}

function formatPercent(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

type DrillFilter = { ownerId?: string; zoneId?: string; sbuId?: string; productId?: string; brandId?: string; tradeInsOnly?: boolean; closedFrom?: string; closedTo?: string; statusId?: string; label: string };

export default function SalesReportScreen({
  onDrillToPipeline,
}: {
  onDrillToPipeline?: (filter: Omit<DrillFilter, "label">, label: string) => void;
}) {
  const [period, setPeriod] = useState<Period>("quarter");
  const [groupBy, setGroupBy] = useState<SalesGroupBy>("rep");
  const filters = periodFilters(period);

  const headlineQuery = useQuery({
    queryKey: ["reporting", "sales-headline", period],
    queryFn: () => getSalesHeadline(filters),
  });

  const breakdownQuery = useQuery({
    queryKey: ["reporting", "sales-summary", groupBy, period],
    queryFn: () => getSalesSummary(groupBy, filters),
  });

  // Report Drill-down (Feature 11.2): every drill from this report lands
  // on Won deals only, matching what the report itself counts.
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => (await listStatuses()) as { id: string; status_code: string }[],
    staleTime: Infinity,
  });
  const wonStatusId = statuses.find((s) => s.status_code === "WON")?.id;
  // Every drill carries the selected period too (closed_at window), so the
  // drilled list is the same Won deals the bar counted -- not all-time.
  const drillBase = { statusId: wonStatusId, closedFrom: filters.period_start, closedTo: filters.period_end };
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label;
  const drillLabel = (name: string) => (period === "all" ? `${name}, Won` : `${name}, Won, ${periodLabel}`);

  const headline = headlineQuery.data;
  const rows = breakdownQuery.data?.rows ?? [];
  const maxRevenue = Math.max(1, ...rows.map((r) => parseFloat(r.revenue_lakhs)));

  return (
    <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <TextField select size="small" value={period} onChange={(e) => setPeriod(e.target.value as Period)} sx={{ minWidth: 140 }}>
          {PERIOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <StatTile
          label="Revenue Won"
          value={headline ? formatLakhs(parseFloat(headline.revenue_lakhs)) : "—"}
          sublabel={headline ? `${headline.won_count} deals` : undefined}
        />
        <StatTile label="Deals Won" value={headline ? String(headline.won_count) : "—"} />
        <StatTile
          label="Win Rate"
          value={headline ? formatPercent(parseFloat(headline.win_rate)) : "—"}
          sublabel={headline ? `${headline.won_count} won, ${headline.lost_count} lost` : undefined}
        />
        <StatTile
          label="Avg Deal Size"
          value={headline ? formatLakhs(parseFloat(headline.avg_deal_size_lakhs)) : "—"}
        />
      </Box>

      <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
            Revenue Won by {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label}
          </Box>
          <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value as SalesGroupBy)} sx={{ minWidth: 110 }}>
            {GROUP_BY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        <LoadingOrEmpty
          isLoading={breakdownQuery.isLoading}
          isError={breakdownQuery.isError}
          isEmpty={rows.length === 0}
          emptyText="No deals won in this period."
          errorText="Couldn't load sales summary."
          onRetry={() => breakdownQuery.refetch()}
        />
        {rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {rows.map((row) => {
              // Same as Pipeline Report: the synthetic Trade-Ins/Returns
              // bucket drills to every Won deal carrying a Buyback line.
              const isTradeIns = (groupBy === "product" || groupBy === "brand") && row.group_id === "trade-in";
              const filterKey: keyof Omit<DrillFilter, "label" | "statusId" | "tradeInsOnly" | "closedFrom" | "closedTo"> | null =
                groupBy === "rep" ? "ownerId" :
                groupBy === "zone" ? "zoneId" :
                groupBy === "sbu" ? "sbuId" :
                groupBy === "product" && !isTradeIns ? "productId" :
                groupBy === "brand" && !isTradeIns ? "brandId" :
                null;
              return (
                <MiniBar
                  key={row.group_id}
                  label={row.group_name}
                  value={parseFloat(row.revenue_lakhs)}
                  max={maxRevenue}
                  formatValue={formatLakhs}
                  onClick={
                    !onDrillToPipeline || !wonStatusId ? undefined
                    : isTradeIns ? () => onDrillToPipeline({ tradeInsOnly: true, ...drillBase }, drillLabel(row.group_name))
                    : filterKey ? () => onDrillToPipeline({ [filterKey]: row.group_id, ...drillBase }, drillLabel(row.group_name))
                    : undefined
                  }
                />
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
