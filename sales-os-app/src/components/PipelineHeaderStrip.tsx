import { Box, MenuItem, TextField } from "@mui/material";
import { SectionCard, StatTile } from "./ReportingUI";
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

// The part of the Pipeline view that stays fixed while the bars below scroll:
// the two headline tiles, then the "Pipeline by …" title with its drop-down
// (Simpler Table D16). Shared by the Insights Dashboard's Pipeline tab and the
// Pipeline Report so the two cannot drift apart.
export default function PipelineHeaderStrip({
  totalValue,
  totalCount,
  totalWeighted,
  groupBy,
  onGroupByChange,
}: {
  totalValue: number;
  totalCount: number;
  totalWeighted: number;
  groupBy: PipelineGroupBy;
  onGroupByChange: (value: PipelineGroupBy) => void;
}) {
  return (
    <>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <StatTile compact label="Active Pipeline Value" value={formatLakhs(totalValue)} sublabel={`${totalCount} active ${totalCount === 1 ? "Opportunity" : "Opportunities"}`} />
        <StatTile compact label="Weighted Forecast" value={formatLakhs(totalWeighted)} sublabel="Active Opportunities, win-probability adjusted" />
      </Box>
      <SectionCard
        compact
        title={`Pipeline by ${GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label}`}
        action={
          <TextField select size="small" value={groupBy} onChange={(e) => onGroupByChange(e.target.value as PipelineGroupBy)} sx={{ minWidth: 110 }}>
            {GROUP_BY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        }
      >
        {null}
      </SectionCard>
    </>
  );
}
