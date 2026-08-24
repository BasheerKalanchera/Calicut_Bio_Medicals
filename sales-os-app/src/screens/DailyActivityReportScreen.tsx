import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { listActivityReport } from "../services/activities";
import { listUsers } from "../services/masterData";
import { ACTIVITY_TYPE_CONFIG } from "../utils/activityTypes";
import type { ActivityReportRow } from "../types/api-aliases";

interface UserOption { id: string; display_name: string }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function ReportRow({
  row,
  onSelectAccount,
  onSelectOpportunity,
}: {
  row: ActivityReportRow;
  onSelectAccount?: (account: { id: string; name: string }) => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const cfg = ACTIVITY_TYPE_CONFIG[row.activity_type] ?? ACTIVITY_TYPE_CONFIG.NOTE;

  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2, display: "flex", gap: "0.75rem" }}>
      <Box
        sx={{
          width: 32, height: 32, borderRadius: "0.75rem", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "0.875rem", bgcolor: cfg.bg, color: cfg.color, flexShrink: 0,
        }}
      >
        {cfg.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.25 }}>
          <Box
            component="span"
            sx={{
              fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              px: 1, py: 0.25, borderRadius: "0.375rem", bgcolor: cfg.bg, color: cfg.color,
            }}
          >
            {cfg.label}
          </Box>
          <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{formatTime(row.activity_date)}</Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, fontSize: "11px", color: "#6b7280", fontWeight: 500, mb: 0.5 }}>
          <Box
            component="span"
            onClick={onSelectAccount ? () => onSelectAccount(row.account) : undefined}
            sx={onSelectAccount ? { color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } } : { color: "inherit" }}
          >
            {row.account.name}
          </Box>
          {row.opportunity && (
            <>
              <Box component="span" sx={{ color: "#d1d5db" }}>•</Box>
              <Box
                component="span"
                onClick={() => onSelectOpportunity?.(row.opportunity!)}
                sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
              >
                {row.opportunity.name}
              </Box>
            </>
          )}
          {row.project && (
            <>
              <Box component="span" sx={{ color: "#d1d5db" }}>•</Box>
              <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 700, bgcolor: "#f3f4f6", color: "#4b5563" }}>
                {row.project.name}
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", mb: row.notes ? 0.5 : 0 }}>
          {row.user.display_name}
        </Box>

        {row.notes && (
          <Box sx={{ fontSize: "0.75rem", color: "#374151", bgcolor: "background.default", borderRadius: "0.75rem", px: 1.5, py: 1, lineHeight: 1.625, whiteSpace: "pre-wrap" }}>
            {row.notes}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function DailyActivityReportScreen({
  onSelectAccount,
  onSelectOpportunity,
}: {
  onSelectAccount?: (account: { id: string; name: string }) => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const [reportDate, setReportDate] = useState<Dayjs>(dayjs());
  const [userFilter, setUserFilter] = useState<string>("");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await listUsers()) as UserOption[],
    staleTime: Infinity,
  });

  const dateKey = reportDate.format("YYYY-MM-DD");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activityReport", dateKey, userFilter],
    queryFn: () => listActivityReport({ report_date: dateKey, user_id: userFilter || undefined, page_size: 100 }),
  });

  const rows = data?.items ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0, display: "flex", gap: 1 }}>
        <DatePicker
          value={reportDate}
          onChange={(newValue) => newValue && setReportDate(newValue)}
          slotProps={{ textField: { size: "small" } }}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="">All Team Members</MenuItem>
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <Box sx={{ color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading activity...</Box>
          </Box>
        )}

        {isError && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
            sx={{ mb: 2 }}
          >
            Couldn't load the activity report.
          </Alert>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
            No activity logged on this day.
          </Box>
        )}

        {!isLoading && rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rows.map((row) => (
              <ReportRow key={row.id} row={row} onSelectAccount={onSelectAccount} onSelectOpportunity={onSelectOpportunity} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
