import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import { listAuditLog } from "../services/auditLog";
import type { AuditLogResponse } from "../types/api-aliases";

// Mirrors the backend's own gate (AuditLogService._AUDIT_LOG_ADMIN_ROLES) and
// the DB-level RLS policy on audit_log itself (audit_log_admin_gm_read,
// 0030_add_audit_log.py) -- same set TerritoryAdminScreen already uses. This
// screen is always mounted in the background (DemoApp.tsx) regardless of who's
// logged in, so without this the query below fires for every non-admin user
// and gets a 403 it was never going to get past.
const AUDIT_LOG_ADMIN_ROLES = new Set(["Admin", "General Manager"]);

const TABLE_OPTIONS = [
  { value: "account", label: "Account" },
  { value: "user_profile", label: "User" },
  { value: "product", label: "Product" },
  { value: "opportunity", label: "Opportunity" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function EntryCard({ entry }: { entry: AuditLogResponse }) {
  // DELETE never has new_data (the row is gone) -- old_data is the full row,
  // not a diff, so it's rendered as a flat "final state" list instead of
  // old->new pairs. UPDATE's old_data/new_data only ever contain the fields
  // that actually changed (backend trigger computes this, not the frontend),
  // so it's already lean -- the clutter problem is DELETE-only, since that
  // snapshots the *entire* row, empty columns included.
  const isDelete = entry.action === "DELETE";
  const fields = Object.keys(entry.old_data ?? entry.new_data ?? {});
  // DELETE is collapsed entirely by default (a deleted record's full
  // field-by-field snapshot is rarely what someone needs at a glance) --
  // "Show all fields" reveals the complete row, empty columns included.
  // UPDATE is never collapsed -- it only ever lists the fields that
  // actually changed, so there's nothing to hide.
  const [showAllDeleted, setShowAllDeleted] = useState(false);
  const displayFields = isDelete && !showAllDeleted ? [] : fields;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid", borderColor: "divider", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Chip
          label={entry.action}
          size="small"
          color={isDelete ? "error" : "primary"}
          sx={{ fontWeight: 700, fontSize: "10px" }}
        />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {TABLE_OPTIONS.find((t) => t.value === entry.table_name)?.label ?? entry.table_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.record_label ?? entry.record_id}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">{formatDateTime(entry.changed_at)}</Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Changed by: <strong>{entry.changed_by_name ?? "Direct database access (no logged-in user)"}</strong>
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {displayFields.map((field) => {
          // old_data_display/new_data_display only carry an entry for
          // fields the backend could resolve to a human label (a known
          // foreign key, e.g. zone_id -> "North Kerala") -- anything else
          // falls back to its raw stored value.
          const oldDisplay = entry.old_data_display?.[field] ?? formatValue(entry.old_data?.[field]);
          const newDisplay = entry.new_data_display?.[field] ?? formatValue(entry.new_data?.[field]);
          return (
            <Box key={field} sx={{ display: "flex", gap: 1, fontSize: "0.75rem" }}>
              <Box component="span" sx={{ fontWeight: 700, minWidth: 140 }}>{field}</Box>
              {isDelete ? (
                <Box component="span" sx={{ color: "text.secondary" }}>{oldDisplay}</Box>
              ) : (
                <Box component="span">
                  <Box component="span" sx={{ color: "text.secondary" }}>{oldDisplay}</Box>
                  {" → "}
                  <Box component="span" sx={{ fontWeight: 700 }}>{newDisplay}</Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {isDelete && fields.length > 0 && (
        <Button
          size="small"
          onClick={() => setShowAllDeleted((v) => !v)}
          sx={{ mt: 0.5, fontSize: "0.7rem", textTransform: "none" }}
        >
          {showAllDeleted ? "Hide fields" : `Show all ${fields.length} fields`}
        </Button>
      )}
    </Box>
  );
}

export default function AuditLogScreen() {
  const { userProfile } = useAuth();
  const isAdmin = AUDIT_LOG_ADMIN_ROLES.has((userProfile as any)?.role_name);

  const [tableFilter, setTableFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["audit-log", tableFilter, dateFrom?.format("YYYY-MM-DD"), dateTo?.format("YYYY-MM-DD"), page],
    queryFn: () =>
      listAuditLog({
        table_name: tableFilter || undefined,
        date_from: dateFrom ? dateFrom.startOf("day").toISOString() : undefined,
        date_to: dateTo ? dateTo.endOf("day").toISOString() : undefined,
        page,
        page_size: 50,
      }),
    enabled: isAdmin,
  });

  const rows = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  if (!isAdmin) return null;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ p: 3, pb: 2, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Audit Log</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <TextField
            select
            value={tableFilter}
            onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
            size="small"
            sx={{ minWidth: 160 }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">All Tables</MenuItem>
            {TABLE_OPTIONS.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
          <DatePicker
            label="From"
            value={dateFrom}
            onChange={(v) => { setDateFrom(v); setPage(1); }}
            slotProps={{ textField: { size: "small" }, field: { clearable: true } }}
            sx={{ minWidth: 160 }}
          />
          <DatePicker
            label="To"
            value={dateTo}
            onChange={(v) => { setDateTo(v); setPage(1); }}
            slotProps={{ textField: { size: "small" }, field: { clearable: true } }}
            sx={{ minWidth: 160 }}
          />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 3 }}>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>Loading audit log...</Typography>
          </Box>
        )}

        {isError && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
            sx={{ mb: 2 }}
          >
            Couldn't load the audit log.
          </Alert>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "background.paper", borderRadius: "1.5rem", border: "2px dashed", borderColor: "divider" }}>
            <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>No audit entries match these filters.</Typography>
          </Box>
        )}

        {!isLoading && rows.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rows.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3 }}>
            <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Page {page} of {totalPages} ({total} total)
            </Typography>
            <Button size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
