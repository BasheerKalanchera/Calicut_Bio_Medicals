import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField } from "@mui/material";
import { LoadingOrEmpty } from "../components/ReportingUI";
import { listUsers } from "../services/masterData";
import { getStagnantDeals } from "../services/reporting";
import { statusColors } from "../theme/statusColors";
import { shadows } from "../theme/shadows";

// BR-OP-20 "Not visited": the user types any number of days, starting at
// 30, the same as My Work (Weekly Follow-up plan D6c, D25). BR-OP-06 is
// time in a stage, not this.
const DEFAULT_THRESHOLD_DAYS = 30;
// The server refuses more than ten years (threshold_days le=3650).
const MAX_THRESHOLD_DAYS = 3650;

export default function StagnantDealsReportScreen({
  onSelectOpportunity,
}: {
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const [thresholdText, setThresholdText] = useState(String(DEFAULT_THRESHOLD_DAYS));
  // A blank or zero box keeps showing the last good number's list.
  const typed = /^\d+$/.test(thresholdText) ? Number.parseInt(thresholdText, 10) : 0;
  const [thresholdDays, setThresholdDays] = useState(DEFAULT_THRESHOLD_DAYS);
  if (typed >= 1 && typed <= MAX_THRESHOLD_DAYS && typed !== thresholdDays) setThresholdDays(typed);

  // Rep filter: the people this user may see (same list as My Work's
  // "Showing"). The server applies the same visibility rules to user_id.
  const [userId, setUserId] = useState("");
  const { data: reps = [] } = useQuery({
    queryKey: ["users", "scoped"],
    queryFn: () => listUsers("scoped"),
  });

  const query = useQuery({
    queryKey: ["reporting", "stagnant-deals", thresholdDays, userId],
    queryFn: () => getStagnantDeals(thresholdDays, userId ? { user_id: userId } : {}),
  });

  const rows = query.data?.rows ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 2 }}>
        {reps.length > 1 && (
          <TextField
            select
            size="small"
            label="Rep"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            sx={{ minWidth: 200, mt: 1 }}
          >
            <MenuItem value="">All reps</MenuItem>
            {reps.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          size="small"
          type="number"
          label="Not visited for (days)"
          value={thresholdText}
          onChange={(e) => setThresholdText(e.target.value)}
          slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
          sx={{ width: 170, mt: 1 }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={rows.length === 0}
          emptyText="No Opportunities past the threshold. Nice."
          errorText="Couldn't load stagnant Opportunities."
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
                    bgcolor: "background.paper",
                    borderRadius: "1rem",
                    boxShadow: shadows.sm,
                    border: 1,
                    borderColor: "gray.100",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    cursor: onSelectOpportunity ? "pointer" : "default",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ typography: "body1", fontWeight: 700, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.opportunity_name}
                    </Box>
                    <Box sx={{ typography: "caption", color: "gray.500", mt: 0.25 }}>
                      {row.account_name} · {row.owner_name} · {row.stage_name}
                      {row.last_activity_date && ` · last touched ${row.last_activity_date}`}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      flexShrink: 0,
                      typography: "caption",
                      fontWeight: 900,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "0.5rem",
                      bgcolor: critical ? statusColors.overdue.bg : statusColors.waiting.bg,
                      color: critical ? statusColors.overdue.text : statusColors.waiting.text,
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
