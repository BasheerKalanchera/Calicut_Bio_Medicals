import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import { LoadingOrEmpty } from "../components/ReportingUI";
import { getOpportunitiesOnHold } from "../services/reporting";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OpportunitiesOnHoldReportScreen({
  onSelectOpportunity,
}: {
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const query = useQuery({
    queryKey: ["reporting", "opportunities-on-hold"],
    queryFn: () => getOpportunitiesOnHold(),
  });

  const rows = query.data?.rows ?? [];

  return (
    <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", px: 2, pb: 2, pt: 2 }}>
      <LoadingOrEmpty
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={rows.length === 0}
        emptyText="No opportunities are currently On Hold."
        errorText="Couldn't load opportunities on hold."
        onRetry={() => query.refetch()}
      />
      {rows.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {rows.map((row) => (
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
                </Box>
                <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>
                  Reason: {row.hold_reason ?? "—"}
                  {row.reactivation_date && ` · Reactivates ${formatDate(row.reactivation_date)}`}
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
                  bgcolor: "#fff8e6",
                  color: "#b8790f",
                }}
              >
                {row.days_on_hold}d on hold
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
