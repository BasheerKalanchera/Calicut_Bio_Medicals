import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty } from "../components/ReportingUI";
import { getProductPerformance } from "../services/reporting";
import { listStatuses } from "../services/masterData";
import type { ProductPerformanceGroupBy } from "../types/reporting";
import { formatLakhs } from "../utils/formatter";

const GROUP_BY_OPTIONS: { value: ProductPerformanceGroupBy; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
  { value: "sbu", label: "SBU" },
];

function Metric({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        minWidth: 84,
        ...(onClick && { cursor: "pointer", borderRadius: "0.5rem", mx: -0.5, px: 0.5, "&:hover": { bgcolor: "#f3f4f6" } }),
      }}
    >
      <Box sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af" }}>
        {label}
      </Box>
      <Box sx={{ fontSize: "0.875rem", fontWeight: 700, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Box>
    </Box>
  );
}

type DrillFilter = { productId?: string; sbuId?: string; statusId?: string; label: string };

export default function ProductPerformanceReportScreen({
  onDrillToPipeline,
}: {
  onDrillToPipeline?: (filter: Omit<DrillFilter, "label">, label: string) => void;
}) {
  const [groupBy, setGroupBy] = useState<ProductPerformanceGroupBy>("product");

  const query = useQuery({
    queryKey: ["reporting", "product-performance", groupBy],
    queryFn: () => getProductPerformance(groupBy),
  });

  // Report Drill-down (Feature 11.2): Won/Lost drills need the real status
  // id, same pattern as SalesReportScreen.
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => (await listStatuses()) as { id: string; status_code: string }[],
    staleTime: Infinity,
  });
  const wonStatusId = statuses.find((s) => s.status_code === "WON")?.id;
  const lostStatusId = statuses.find((s) => s.status_code === "LOST")?.id;

  const rows = query.data?.rows ?? [];
  // Brand cards stay non-clickable -- a brand (product.oem_name) spans many
  // products, no single product_id represents it.
  const drillKey: "productId" | "sbuId" | null = groupBy === "product" ? "productId" : groupBy === "sbu" ? "sbuId" : null;

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0 }}>
        <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value as ProductPerformanceGroupBy)} sx={{ minWidth: 140 }}>
          {GROUP_BY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>By {o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={rows.length === 0}
          emptyText="No won or pipeline activity for any product yet."
          errorText="Couldn't load product performance."
          onRetry={() => query.refetch()}
        />
        {rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rows.map((row) => (
              <Box
                key={row.group_id}
                sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2 }}
              >
                <Box sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "text.primary", mb: 1.25 }}>
                  {row.group_name}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Metric label="Qty Sold (Won)" value={String(row.quantity_sold)} />
                  <Metric label="Revenue (Won)" value={formatLakhs(parseFloat(row.revenue_lakhs))} />
                  <Metric label="Avg Selling Price" value={formatLakhs(parseFloat(row.avg_selling_price_lakhs))} />
                  <Metric
                    label="Opportunities"
                    value={String(row.opportunity_count)}
                    onClick={
                      onDrillToPipeline && drillKey
                        ? () => onDrillToPipeline({ [drillKey]: row.group_id }, row.group_name)
                        : undefined
                    }
                  />
                  <Metric
                    label="Won"
                    value={String(row.won_count)}
                    onClick={
                      onDrillToPipeline && drillKey && wonStatusId
                        ? () => onDrillToPipeline({ [drillKey]: row.group_id, statusId: wonStatusId }, `${row.group_name}, Won`)
                        : undefined
                    }
                  />
                  <Metric
                    label="Lost"
                    value={String(row.lost_count)}
                    onClick={
                      onDrillToPipeline && drillKey && lostStatusId
                        ? () => onDrillToPipeline({ [drillKey]: row.group_id, statusId: lostStatusId }, `${row.group_name}, Lost`)
                        : undefined
                    }
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
