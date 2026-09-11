import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty } from "../components/ReportingUI";
import { getStagnantDeals } from "../services/reporting";

// BR-OP-06 says 180 days, PRD says ~90 -- shipped as parameter options
// rather than picking one (Insights-Dashboard-Implementation-Plan.md,
// Open questions §2).
const STAGNANT_THRESHOLD_OPTIONS = [
  { value: 90, label: "90+ days" },
  { value: 180, label: "180+ days" },
];

export default function StagnantDealsReportScreen({
  onSelectOpportunity,
}: {
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const [thresholdDays, setThresholdDays] = useState(180);

  const query = useQuery({
    queryKey: ["reporting", "stagnant-deals", thresholdDays],
    queryFn: () => getStagnantDeals(thresholdDays),
  });

  const rows = query.data?.rows ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0 }}>
        <TextField
          select
          size="small"
          value={thresholdDays}
          onChange={(e) => setThresholdDays(Number(e.target.value))}
          sx={{ minWidth: 140 }}
        >
          {STAGNANT_THRESHOLD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={rows.length === 0}
          emptyText="No deals past the threshold. Nice."
          errorText="Couldn't load stagnant deals."
          onRetry={() => query.refetch()}
        />
        {rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rows.map((row) => {
              const critical = row.days_stagnant >= thresholdDays * 1.5;
              return (
                <Box
                  key={row.opportunity_id}
                  onClick={onSelectOpportunity ? () => onSelectOpportunity({ id: row.opportunity_id, name: row.opportunity_name }) : undefined}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "1rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    border: "1px solid #f3f4f6",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    cursor: onSelectOpportunity ? "pointer" : "default",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.opportunity_name}
                    </Box>
                    <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>
                      {row.account_name} · {row.owner_name} · {row.stage_name}
                      {row.last_activity_date && ` · last touched ${row.last_activity_date}`}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      flexShrink: 0,
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "0.5rem",
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
      </Box>
    </Box>
  );
}
