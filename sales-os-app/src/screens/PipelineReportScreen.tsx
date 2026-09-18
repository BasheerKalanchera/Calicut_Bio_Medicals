import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty, MiniBar, StatTile } from "../components/ReportingUI";
import { getPipelineSummary } from "../services/reporting";
import type { PipelineGroupBy } from "../types/reporting";
import { formatLakhs } from "../utils/formatter";

const GROUP_BY_OPTIONS: { value: PipelineGroupBy; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "rep", label: "Rep" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
  { value: "product", label: "Product" },
];

type DrillFilter = { ownerId?: string; zoneId?: string; sbuId?: string; productId?: string; stageId?: string; label: string };

export default function PipelineReportScreen({
  onDrillToPipeline,
}: {
  onDrillToPipeline?: (filter: Omit<DrillFilter, "label">, label: string) => void;
}) {
  const [groupBy, setGroupBy] = useState<PipelineGroupBy>("product");

  // Headline tiles always come from a fixed, Stage-grouped query, independent
  // of the breakdown dropdown below -- Stage is 1:1 with a deal, so summing
  // it can never double-count. Product isn't (a deal can carry more than one
  // product), so deriving these from whatever the dropdown shows would
  // misstate the totals the moment "Product" is picked -- see
  // docs/Forecast-By-Product-Implementation-Plan.md's "Bugs found and fixed".
  const headlineQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", "stage"],
    queryFn: () => getPipelineSummary("stage"),
  });

  const breakdownQuery = useQuery({
    queryKey: ["reporting", "pipeline-summary", groupBy],
    queryFn: () => getPipelineSummary(groupBy),
  });

  const headlineRows = headlineQuery.data?.rows ?? [];
  const totalValue = headlineRows.reduce((s, r) => s + parseFloat(r.total_value_lakhs), 0);
  const totalUnweighted = headlineRows.reduce((s, r) => s + parseFloat(r.unweighted_forecast_lakhs), 0);
  const totalWeighted = headlineRows.reduce((s, r) => s + parseFloat(r.weighted_forecast_lakhs), 0);
  const totalCount = headlineRows.reduce((s, r) => s + r.opportunity_count, 0);

  const rows = breakdownQuery.data?.rows ?? [];
  const maxValue = Math.max(1, ...rows.map((r) => parseFloat(r.total_value_lakhs)));

  return (
    <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <StatTile label="Open Pipeline Value" value={formatLakhs(totalValue)} sublabel={`${totalCount} open deals`} />
        <StatTile label="Unweighted Forecast" value={formatLakhs(totalUnweighted)} sublabel="Active deals, full value" />
        <StatTile label="Weighted Forecast" value={formatLakhs(totalWeighted)} sublabel="Active deals, win-probability adjusted" />
      </Box>

      <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
            Pipeline by {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label}
          </Box>
          <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value as PipelineGroupBy)} sx={{ minWidth: 110 }}>
            {GROUP_BY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        <LoadingOrEmpty
          isLoading={breakdownQuery.isLoading}
          isError={breakdownQuery.isError}
          isEmpty={rows.length === 0}
          emptyText="No open pipeline."
          errorText="Couldn't load pipeline summary."
          onRetry={() => breakdownQuery.refetch()}
        />
        {rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {rows.map((row) => {
              // The synthetic Trade-Ins/Returns bucket isn't a real product --
              // no single product_id represents the mix of Buyback line items
              // it aggregates, so it stays non-clickable.
              const isTradeIns = groupBy === "product" && row.group_id === "trade-in";
              const filterKey: keyof Omit<DrillFilter, "label"> | null =
                groupBy === "rep" ? "ownerId" :
                groupBy === "zone" ? "zoneId" :
                groupBy === "sbu" ? "sbuId" :
                groupBy === "product" && !isTradeIns ? "productId" :
                groupBy === "stage" ? "stageId" :
                null;
              return (
                <MiniBar
                  key={row.group_id}
                  label={row.group_name}
                  value={parseFloat(row.total_value_lakhs)}
                  max={maxValue}
                  formatValue={formatLakhs}
                  secondaryValue={parseFloat(row.weighted_forecast_lakhs)}
                  secondaryLabel="weighted"
                  onClick={
                    onDrillToPipeline && filterKey
                      ? () => onDrillToPipeline({ [filterKey]: row.group_id }, row.group_name)
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
