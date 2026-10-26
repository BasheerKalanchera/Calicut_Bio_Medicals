import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty, MiniBar, SectionCard, StatTile, ZoneTreeNote } from "../components/ReportingUI";
import { getPipelineSummary } from "../services/reporting";
import { listStatuses } from "../services/masterData";
import type { PipelineGroupBy } from "../types/reporting";
import { formatLakhs } from "../utils/formatter";

const GROUP_BY_OPTIONS: { value: PipelineGroupBy; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "rep", label: "Rep" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
];

type DrillFilter = { ownerId?: string; zoneId?: string; sbuId?: string; productId?: string; brandId?: string; tradeInsOnly?: boolean; noProductsOnly?: boolean; zoneExact?: boolean; stageId?: string; statusId?: string; expectedCount?: number; label: string };

export default function PipelineReportScreen({
  onDrillToPipeline,
}: {
  onDrillToPipeline?: (filter: Omit<DrillFilter, "label">, label: string) => void;
}) {
  const [groupBy, setGroupBy] = useState<PipelineGroupBy>("product");

  // Headline tiles always come from a fixed, Stage-grouped query, independent
  // of the breakdown dropdown below -- Stage is 1:1 with an Opportunity, so summing
  // it can never double-count. Product isn't (an Opportunity can carry more than one
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

  // BR-OP-07: the report counts Active Opportunities only (On Hold excluded), so
  // every drill carries the Active status too -- otherwise the drilled list
  // would also show On Hold/Won/Lost Opportunities the bar never counted. Same
  // lookup as SalesReportScreen's wonStatusId.
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => (await listStatuses()) as { id: string; status_code: string }[],
    staleTime: Infinity,
  });
  const activeStatusId = statuses.find((s) => s.status_code === "ACTIVE")?.id;

  const headlineRows = headlineQuery.data?.rows ?? [];
  // total_value == unweighted forecast now that both are Active-only, so
  // the old separate "Unweighted Forecast" tile was merged into this one.
  const totalValue = headlineRows.reduce((s, r) => s + parseFloat(r.total_value_lakhs), 0);
  const totalWeighted = headlineRows.reduce((s, r) => s + parseFloat(r.weighted_forecast_lakhs), 0);
  const totalCount = headlineRows.reduce((s, r) => s + r.opportunity_count, 0);

  const rows = breakdownQuery.data?.rows ?? [];
  const maxValue = Math.max(1, ...rows.map((r) => parseFloat(r.total_value_lakhs)));

  return (
    <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <StatTile label="Active Pipeline Value" value={formatLakhs(totalValue)} sublabel={`${totalCount} active ${totalCount === 1 ? "Opportunity" : "Opportunities"}`} />
        <StatTile label="Weighted Forecast" value={formatLakhs(totalWeighted)} sublabel="Active Opportunities, win-probability adjusted" />
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
          isLoading={breakdownQuery.isLoading}
          isError={breakdownQuery.isError}
          isEmpty={rows.length === 0}
          emptyText="No active pipeline."
          errorText="Couldn't load pipeline summary."
          onRetry={() => breakdownQuery.refetch()}
        />
        {rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {rows.map((row) => {
              // The synthetic Trade-Ins/Returns bucket isn't a real product
              // or brand -- it drills to every Opportunity carrying a Buyback line.
              const isTradeIns = (groupBy === "product" || groupBy === "brand") && row.group_id === "trade-in";
              // Active Opportunities with no products entered yet (BR-OP-07) --
              // their own bucket on the line-level breakdowns.
              const isNoProducts = (groupBy === "product" || groupBy === "brand") && row.group_id === "no-products";
              const filterKey: keyof Omit<DrillFilter, "label" | "tradeInsOnly" | "noProductsOnly" | "zoneExact" | "statusId" | "expectedCount"> | null =
                groupBy === "rep" ? "ownerId" :
                groupBy === "zone" ? "zoneId" :
                groupBy === "sbu" ? "sbuId" :
                groupBy === "product" && !isTradeIns && !isNoProducts ? "productId" :
                groupBy === "brand" && !isTradeIns && !isNoProducts ? "brandId" :
                groupBy === "stage" ? "stageId" :
                null;
              return (
                <MiniBar
                  key={`${row.group_id}${row.zone_exact ? "-exact" : ""}`}
                  label={row.group_name}
                  value={parseFloat(row.total_value_lakhs)}
                  max={maxValue}
                  formatValue={formatLakhs}
                  secondaryValue={parseFloat(row.weighted_forecast_lakhs)}
                  secondaryLabel="weighted"
                  count={row.opportunity_count}
                  indent={row.depth ?? 0}
                  onClick={
                    !onDrillToPipeline || !activeStatusId ? undefined
                    : isTradeIns ? () => onDrillToPipeline({ tradeInsOnly: true, statusId: activeStatusId, expectedCount: row.opportunity_count }, row.group_name)
                    : isNoProducts ? () => onDrillToPipeline({ noProductsOnly: true, statusId: activeStatusId, expectedCount: row.opportunity_count }, row.group_name)
                    : filterKey ? () => onDrillToPipeline({ [filterKey]: row.group_id, statusId: activeStatusId, expectedCount: row.opportunity_count, ...(row.zone_exact && { zoneExact: true }) }, row.group_name)
                    : undefined
                  }
                />
              );
            })}
          </Box>
        )}
        {groupBy === "zone" && rows.length > 0 && <ZoneTreeNote />}
      </SectionCard>
    </Box>
  );
}
