import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty } from "../components/ReportingUI";
import { getProductPerformance } from "../services/reporting";
import type { ProductPerformanceGroupBy } from "../types/reporting";
import { formatLakhs } from "../utils/reporting";

const GROUP_BY_OPTIONS: { value: ProductPerformanceGroupBy; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
  { value: "sbu", label: "SBU" },
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 84 }}>
      <Box sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af" }}>
        {label}
      </Box>
      <Box sx={{ fontSize: "0.875rem", fontWeight: 700, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Box>
    </Box>
  );
}

export default function ProductPerformanceReportScreen() {
  const [groupBy, setGroupBy] = useState<ProductPerformanceGroupBy>("product");

  const query = useQuery({
    queryKey: ["reporting", "product-performance", groupBy],
    queryFn: () => getProductPerformance(groupBy),
  });

  const rows = query.data?.rows ?? [];

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
                  <Metric label="Opportunities" value={String(row.opportunity_count)} />
                  <Metric label="Won" value={String(row.won_count)} />
                  <Metric label="Lost" value={String(row.lost_count)} />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
