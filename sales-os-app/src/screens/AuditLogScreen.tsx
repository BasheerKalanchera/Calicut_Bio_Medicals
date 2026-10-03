import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import { listAuditLog } from "../services/auditLog";
import type { AuditLogResponse, AuditSaveResponse } from "../types/api-aliases";

// Mirrors the backend's own gate (AuditLogService._AUDIT_LOG_ADMIN_ROLES) and
// the DB-level RLS policy on audit_log itself (audit_log_admin_gm_read,
// 0030_add_audit_log.py) -- same set TerritoryAdminScreen already uses. This
// screen is always mounted in the background (DemoApp.tsx) regardless of who's
// logged in, so without this the query below fires for every non-admin user
// and gets a 403 it was never going to get past.
const AUDIT_LOG_ADMIN_ROLES = new Set(["Admin", "General Manager"]);

// Every table the audit trigger watches (migrations 0030, 0041, 0059);
// mirrors the backend's _TABLE_SPECS.
const TABLE_OPTIONS = [
  { value: "account", label: "Account" },
  { value: "user_profile", label: "User" },
  { value: "product", label: "Product" },
  { value: "opportunity", label: "Opportunity" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "opportunity_item", label: "Opportunity Product" },
  { value: "split", label: "Split" },
  { value: "opportunity_stakeholder", label: "Opportunity Contact" },
  { value: "target_plan", label: "Target Plan" },
  { value: "target_plan_account", label: "Target Plan Hospital" },
  { value: "target_plan_brand_split", label: "Target Plan Brand Split" },
  { value: "marketing_lead", label: "Marketing Lead" },
  { value: "project", label: "Project" },
  { value: "installed_asset", label: "Installed Equipment" },
  { value: "document", label: "Document" },
  { value: "user_zone", label: "User Zone" },
  { value: "zone", label: "Zone" },
  { value: "brand", label: "Brand" },
  { value: "model", label: "Model" },
  { value: "category", label: "Category" },
];

// "What happened" filter and tags (Audit-Trail-Redesign plan, Basheer 2026-09-30).
const ACTION_OPTIONS = [
  { value: "INSERT", label: "Added" },
  { value: "UPDATE", label: "Changed" },
  { value: "DELETE", label: "Removed" },
];
const ACTION_TAG: Record<string, { label: string; color: "success" | "primary" | "error" }> = {
  INSERT: { label: "ADDED", color: "success" },
  UPDATE: { label: "CHANGED", color: "primary" },
  DELETE: { label: "REMOVED", color: "error" },
};

function tableLabel(table: string) {
  return TABLE_OPTIONS.find((t) => t.value === table)?.label ?? table;
}

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

interface AuditLogScreenProps {
  // Same click-through pattern NotificationBell/UrgentNotificationDialog
  // already use (DemoApp.tsx) -- lets a card jump straight to the
  // Opportunity/Account it belongs to.
  onSelectOpportunity?: (opp: { id: string; name: string }) => void;
  onSelectAccount?: (account: { id: string; name: string }) => void;
}

// One logged row inside a card. A Changed row lists only the fields that
// changed (the trigger stores just those). Added/Removed rows carry the full
// row, so their fields start collapsed.
function EntryRow({ entry, isOwner }: { entry: AuditLogResponse; isOwner: boolean }) {
  const tag = ACTION_TAG[entry.action] ?? { label: entry.action, color: "primary" as const };
  const isUpdate = entry.action === "UPDATE";
  const data = (entry.action === "INSERT" ? entry.new_data : entry.old_data) ?? {};
  const fields = Object.keys(isUpdate ? (entry.old_data ?? entry.new_data ?? {}) : data);
  const [showAll, setShowAll] = useState(false);
  const displayFields = isUpdate || showAll ? fields : [];

  return (
    <Box sx={{ py: 0.75, borderTop: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Chip label={tag.label} size="small" color={tag.color} sx={{ fontWeight: 700, fontSize: "10px", height: 20 }} />
        {!isOwner && (
          <Typography variant="body2">
            <Box component="span" sx={{ color: "text.secondary" }}>{tableLabel(entry.table_name)}: </Box>
            <strong>{entry.record_label ?? "—"}</strong>
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: displayFields.length ? 0.5 : 0 }}>
        {displayFields.map((field) => {
          // *_data_display only carry fields the backend could resolve to a
          // name (a known foreign key, e.g. zone_id -> "North Kerala"); anything
          // else falls back to its raw stored value.
          const oldDisplay = entry.old_data_display?.[field] ?? formatValue(entry.old_data?.[field]);
          const newDisplay = entry.new_data_display?.[field] ?? formatValue(entry.new_data?.[field]);
          return (
            <Box key={field} sx={{ display: "flex", gap: 1, fontSize: "0.75rem" }}>
              <Box component="span" sx={{ fontWeight: 700, minWidth: 140 }}>{field}</Box>
              {isUpdate ? (
                <Box component="span">
                  <Box component="span" sx={{ color: "text.secondary" }}>{oldDisplay}</Box>
                  {" → "}
                  <Box component="span" sx={{ fontWeight: 700 }}>{newDisplay}</Box>
                </Box>
              ) : (
                <Box component="span" sx={{ color: "text.secondary" }}>
                  {entry.action === "INSERT" ? newDisplay : oldDisplay}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {!isUpdate && fields.length > 0 && (
        <Button size="small" onClick={() => setShowAll((v) => !v)} sx={{ mt: 0.25, fontSize: "0.7rem", textTransform: "none", p: 0 }}>
          {showAll ? "Hide fields" : `Show all ${fields.length} fields`}
        </Button>
      )}
    </Box>
  );
}

// One card per record touched in a save: the record itself and/or its lines
// (e.g. an Opportunity's value change plus a product swap).
function RecordCard({
  save,
  entries,
  onSelectOpportunity,
  onSelectAccount,
}: { save: AuditSaveResponse; entries: AuditLogResponse[] } & AuditLogScreenProps) {
  const first = entries[0];
  const ownerEntry = entries.find((e) => e.table_name === first.owner_type && e.record_id === first.owner_id);
  const ownerName = first.owner_label ?? first.owner_id ?? "—";
  const ownerId = first.owner_id;
  const clickable = !!ownerId && (first.owner_type === "opportunity" || first.owner_type === "account");
  const context = ownerEntry && ownerEntry.parent_type && ownerEntry.parent_id && ownerEntry.parent_label ? ownerEntry : null;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid", borderColor: "divider", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{tableLabel(first.owner_type)}</Typography>
        {clickable ? (
          <Chip
            label={ownerName}
            size="small"
            variant="outlined"
            clickable
            onClick={() => {
              if (first.owner_type === "account") onSelectAccount?.({ id: ownerId!, name: ownerName });
              else onSelectOpportunity?.({ id: ownerId!, name: ownerName });
            }}
            sx={{ fontSize: "11px", height: 22 }}
          />
        ) : (
          <Typography variant="body2">{ownerName}</Typography>
        )}
        {context && (
          <Chip
            label={`${tableLabel(context.parent_type!)}: ${context.parent_label}`}
            size="small"
            variant="outlined"
            clickable={context.parent_type === "account"}
            onClick={() => {
              if (context.parent_type === "account") onSelectAccount?.({ id: context.parent_id!, name: context.parent_label! });
            }}
            sx={{ fontSize: "10px", height: 20 }}
          />
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">{formatDateTime(save.changed_at)}</Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        Changed by: <strong>{save.changed_by_name ?? "Direct database access (no logged-in user)"}</strong>
      </Typography>

      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} isOwner={entry === ownerEntry} />
      ))}
    </Box>
  );
}

// Splits one save into one card per record it touched, owner first-seen order.
function groupByOwner(save: AuditSaveResponse): AuditLogResponse[][] {
  const groups = new Map<string, AuditLogResponse[]>();
  for (const entry of save.entries) {
    const key = `${entry.owner_type}:${entry.owner_id ?? entry.record_id}`;
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }
  // The record's own change first, then its lines.
  return [...groups.values()].map((list) =>
    [...list].sort((a, b) => Number(b.table_name === b.owner_type) - Number(a.table_name === a.owner_type)),
  );
}

export default function AuditLogScreen({ onSelectOpportunity, onSelectAccount }: AuditLogScreenProps) {
  const { userProfile } = useAuth();
  const isAdmin = AUDIT_LOG_ADMIN_ROLES.has((userProfile as any)?.role_name);

  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["audit-log", tableFilter, actionFilter, dateFrom?.format("YYYY-MM-DD"), dateTo?.format("YYYY-MM-DD"), page],
    queryFn: () =>
      listAuditLog({
        table_name: tableFilter || undefined,
        action: actionFilter || undefined,
        date_from: dateFrom ? dateFrom.startOf("day").toISOString() : undefined,
        date_to: dateTo ? dateTo.endOf("day").toISOString() : undefined,
        page,
        page_size: 50,
      }),
    enabled: isAdmin,
  });

  const saves = data?.items ?? [];
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
          <TextField
            select
            label="What happened"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            size="small"
            sx={{ minWidth: 160 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">All</MenuItem>
            {ACTION_OPTIONS.map((a) => (
              <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
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

        {!isLoading && !isError && saves.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "background.paper", borderRadius: "1.5rem", border: "2px dashed", borderColor: "divider" }}>
            <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>No audit entries match these filters.</Typography>
          </Box>
        )}

        {!isLoading && saves.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {saves.flatMap((save) =>
              groupByOwner(save).map((entries) => (
                <RecordCard
                  key={`${save.changed_at}:${entries[0].id}`}
                  save={save}
                  entries={entries}
                  onSelectOpportunity={onSelectOpportunity}
                  onSelectAccount={onSelectAccount}
                />
              )),
            )}
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3 }}>
            <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Page {page} of {totalPages} ({total} saves)
            </Typography>
            <Button size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
