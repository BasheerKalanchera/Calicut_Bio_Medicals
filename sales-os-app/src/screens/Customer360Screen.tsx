import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import {
  getAccount,
  getAccountCounts,
  listAccounts,
  updateAccount,
  listStakeholders,
  createStakeholder,
  updateStakeholder,
  listProjects,
  createProject,
  updateProject,
  listOpportunities,
  listInstalledAssets,
  createInstalledAsset,
  updateInstalledAsset,
} from "../services/accounts";
import BusinessPotentialChip from "../components/BusinessPotentialChip";
import {
  getStakeholderOpportunityCounts,
  listOpportunitiesForStakeholder,
} from "../services/opportunities";
import {
  listProjectStatuses,
  listUsers,
  searchZonesForHospital,
} from "../services/masterData";
import type { ZoneSearchResult } from "../services/masterData";
import ZonePicker from "../components/ZonePicker";
import { ApiError } from "../lib/api";
import { SilentModalError } from "../lib/formErrors";
import { listProducts } from "../services/products";
import { listActivitiesByAccount, listAccountReminders } from "../services/activities";
import { isReactivationOverdue } from "../utils/opportunityStatus";
import { useAuth } from "../contexts/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";
import FormModal from "../components/FormModal";
import ActivityTimeline from "../components/ActivityTimeline";
import NextActionsPanel from "../components/NextActionsPanel";
import LogActivityModal from "../components/LogActivityModal";
import QuickLeadModal from "../components/QuickLeadModal";

interface Props {
  accountId: string;
  initialAccount?: any;
  onBack: () => void;
  onSelectAccount?: (account: { id: string; name: string }) => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }, detailTab?: string, customer360Tab?: string) => void;
  onSelectProject?: (project: { id: string; name: string }) => void;
  // Set when re-mounting after Back from Opportunity Detail (e.g. the
  // stakeholder bridge list), so this screen reopens on the tab the user
  // actually came from instead of always defaulting to Overview.
  initialTab?: string;
  // Set by a comment/manager-note notification click -- passed straight
  // through to ActivityTimeline so it can scroll to and highlight the exact
  // Activity the notification was about.
  highlightActivityId?: string;
  // Opportunities tab: Show All vs Active only. Held by DemoApp so it
  // survives a tab switch and Back from Opportunity Detail.
  showAllOpportunities?: boolean;
  onShowAllOpportunitiesChange?: (showAll: boolean) => void;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "projects", label: "Projects" },
  { id: "opportunities", label: "Opportunities" },
  { id: "next-actions", label: "Next Actions" },
  { id: "installed", label: "Installed Base" },
];

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

// ---------------------------------------------------------------------------
// Small presentational components
// ---------------------------------------------------------------------------
function PayerBadge({ behavior }: { behavior?: string | null }) {
  if (!behavior) return null;
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    GOOD: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
    PROBLEMATIC: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    UNKNOWN: { bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" },
  };
  const s = styles[behavior] ?? styles.UNKNOWN;
  return (
    <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid", borderColor: s.border, bgcolor: s.bg, color: s.color }}>
      {behavior}
    </Box>
  );
}

// "MULTISPECIALITY_HOSPITAL" -> "Multispeciality Hospital"
function formatEnumLabel(value?: string | null): string {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  if (!sentiment) return null;
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    PROMOTER: { label: "Promoter", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
    NEUTRAL: { label: "Neutral", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    DETRACTOR: { label: "Detractor", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  };
  const c = config[sentiment] ?? { label: sentiment, bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" };
  return (
    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid", borderColor: c.border, bgcolor: c.bg, color: c.color }}>
      {c.label}
    </Box>
  );
}

function NpsIndicator({ score }: { score?: number | null }) {
  if (score == null) return <Box component="span" sx={{ color: "#d1d5db", fontSize: "0.75rem" }}>—</Box>;
  const color = score >= 50 ? "#059669" : score >= 0 ? "#d97706" : "#dc2626";
  return <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", color }}>{score}</Box>;
}

function LoadingRow({ label = "Loading..." }: { label?: string }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Box
        sx={{
          color: "#9ca3af",
          fontWeight: 700,
          fontSize: "0.875rem",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------
function OverviewTab({
  account,
  onEdit,
  onSelectAccount,
}: {
  account: any;
  onEdit: () => void;
  onSelectAccount?: (account: { id: string; name: string }) => void;
}) {
  const fields = [
    { label: "Account Name", value: account.name },
    { label: "Zone", value: account.zone?.name || "—" },
    { label: "Payer Behavior", value: <PayerBadge behavior={account.payer_behavior} /> },
    {
      label: "Business Potential",
      // The server returns the notes only to Admin/GM -- no role check needed here.
      value: (
        <Box>
          <BusinessPotentialChip value={account.business_potential} />
          {account.business_potential_notes && (
            <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.75, whiteSpace: "pre-wrap" }}>
              {account.business_potential_notes}
            </Box>
          )}
        </Box>
      ),
    },
    { label: "Customer Type", value: formatEnumLabel(account.customer_type) || "—" },
    {
      label: "Parent Customer",
      value: account.parent_account ? (
        <Box
          component="span"
          onClick={() => onSelectAccount?.(account.parent_account)}
          sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
        >
          {account.parent_account.name}
        </Box>
      ) : (
        "—"
      ),
    },
  ];
  const childAccounts: { id: string; name: string }[] = account.child_accounts || [];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Account Details
          </Typography>
          <Button
            onClick={onEdit}
            sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
          >
            Edit
          </Button>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {fields.map((f) => (
            <Box key={f.label}>
              <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
                {f.label}
              </Typography>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{f.value || "—"}</Box>
            </Box>
          ))}
        </Box>
      </Box>
      {childAccounts.length > 0 && (
        <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
          <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", mb: 2 }}>
            Child Accounts ({childAccounts.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {childAccounts.map((c) => (
              <Box
                key={c.id}
                component="span"
                onClick={() => onSelectAccount?.(c)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "primary.main",
                  bgcolor: "#eff6ff",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#dbeafe" },
                }}
              >
                {c.name}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function StakeholdersTab({
  stakeholders,
  opportunityCounts,
  onAdd,
  onEdit,
  onViewOpportunities,
}: {
  stakeholders: any[];
  opportunityCounts: Record<string, { opportunity_count: number }>;
  onAdd: () => void;
  onEdit: (s: any) => void;
  onViewOpportunities: (s: any) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Stakeholders ({stakeholders.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}
        >
          + Add
        </Button>
      </Box>
      {stakeholders.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No stakeholders found for this account.
        </Box>
      ) : (
        stakeholders.map((s) => (
          <Box key={s.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, bgcolor: "#f5f3ff", color: "#7c3aed", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem", boxShadow: SHADOW_SM }}>
                {s.name.charAt(0)}
              </Box>
              <Box>
                <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{s.name}</Box>
                {s.designation && <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>{s.designation}</Box>}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}><SentimentBadge sentiment={s.sentiment} /></Box>
                {(s.email || s.phone) && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                    {s.email && <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{s.email}</Box>}
                    {s.phone && <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>{s.phone}</Box>}
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "9px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>NPS</Typography>
                <NpsIndicator score={s.nps_score} />
              </Box>
              <Button
                onClick={() => onViewOpportunities(s)}
                sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
              >
                {opportunityCounts[s.id]?.opportunity_count ?? 0} Opportunities
              </Button>
              <Button
                onClick={() => onEdit(s)}
                sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

// Bridge list — opened from a stakeholder card's "N Opportunities" pill.
// A plain read-only Dialog rather than FormModal: FormModal's Save/Cancel
// form chrome doesn't fit a list you tap through, not submit.
function StakeholderOpportunitiesModal({
  stakeholder,
  onClose,
  onSelectOpportunity,
}: {
  stakeholder: { id: string; name: string } | null;
  onClose: () => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }, detailTab?: string, customer360Tab?: string) => void;
}) {
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["stakeholder-opportunities", stakeholder?.id],
    queryFn: () => listOpportunitiesForStakeholder(stakeholder!.id),
    enabled: stakeholder !== null,
  });

  return (
    <Dialog
      open={stakeholder !== null}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      slotProps={{ paper: { sx: { maxWidth: "28rem" } } }}
    >
      <DialogTitle component="h3">{stakeholder ? `${stakeholder.name} — Opportunities` : ""}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <LoadingRow />
        ) : opportunities.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "#9ca3af" }}>
            No linked opportunities.
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {opportunities.map((o) => (
              <Button
                key={o.id}
                fullWidth
                onClick={() => {
                  onSelectOpportunity?.({ id: o.id, name: o.name }, "stakeholders", "stakeholders");
                  onClose();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  textTransform: "none",
                  color: "inherit",
                  px: 2,
                  py: 1.5,
                  borderRadius: "0.75rem",
                  bgcolor: "#fff",
                  border: "1px solid #f3f4f6",
                  boxShadow: SHADOW_SM,
                  "&:hover": { bgcolor: "#f9fafb" },
                }}
              >
                <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{o.name}</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fde68a", bgcolor: "#fffbeb", color: "#b45309" }}>
                    {o.stage.stage_name}
                  </Box>
                  <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                    {o.status.status_name}
                  </Box>
                </Box>
              </Button>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function ProjectsTab({ projects, onAdd, onEdit, onSelectProject }: { projects: any[]; onAdd: () => void; onEdit: (p: any) => void; onSelectProject?: (project: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Projects ({projects.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          + Add
        </Button>
      </Box>
      {projects.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No projects found for this account.
        </Box>
      ) : (
        projects.map((p) => (
          <Box
            key={p.id}
            onClick={() => onSelectProject?.(p)}
            sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", cursor: onSelectProject ? "pointer" : "default", "&:hover": onSelectProject ? { borderColor: "#d1d5db" } : undefined }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{p.name}</Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                  {p.status.status_name}
                </Box>
                <Button
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
              <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box><Box component="span" sx={{ fontWeight: 700 }}>{p.owner.display_name}</Box></Box>
              {p.bid_submission_date && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Bid Date: </Box><Box component="span" sx={{ fontWeight: 700 }}>{p.bid_submission_date}</Box></Box>}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

const TAB_BUTTON_SX = { whiteSpace: "nowrap", px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } } as const;
const EMPTY_BOX_SX = { textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" } as const;

// Opens on Active Opportunities only -- the same set the pipeline counts
// (BR-OP-07); Show All adds On Hold, Won and Lost. Editing an Opportunity happens on
// its own detail page, so EDIT just opens it (hotfix 2026-10-01).
function OpportunitiesTab({ opportunities, onAdd, onSelectOpportunity, showAll, onToggleShowAll }: { opportunities: any[]; onAdd: () => void; onSelectOpportunity?: (opportunity: { id: string; name: string }) => void; showAll: boolean; onToggleShowAll: () => void }) {
  const total = opportunities.length;
  const activeCount = opportunities.filter((o) => o.status?.status_code === "ACTIVE").length;
  const visible = showAll ? opportunities : opportunities.filter((o) => o.status?.status_code === "ACTIVE");
  const toggleButton = total > 0 && activeCount < total && (
    <Button onClick={onToggleShowAll} sx={TAB_BUTTON_SX}>
      {showAll ? "Show Active Only" : `Show All (${total})`}
    </Button>
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Wraps on a phone: heading on its own line, buttons right-aligned below. */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          {total === 0
            ? "Opportunities (0)"
            : showAll
              ? `Showing All Opportunities (${total})`
              : `Showing Active Opportunities (${activeCount} Active of ${total})`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          {toggleButton}
          <Button onClick={onAdd} sx={TAB_BUTTON_SX}>
            + Add
          </Button>
        </Box>
      </Box>
      {total === 0 ? (
        <Box sx={EMPTY_BOX_SX}>
          No opportunities found for this account.
        </Box>
      ) : visible.length === 0 ? (
        <Box sx={EMPTY_BOX_SX}>
          No Active Opportunities
        </Box>
      ) : (
        visible.map((o) => (
          <Box
            key={o.id}
            onClick={() => onSelectOpportunity?.({ id: o.id, name: o.name })}
            sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", cursor: onSelectOpportunity ? "pointer" : "default", "&:hover": onSelectOpportunity ? { borderColor: "#d1d5db" } : undefined }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{o.name}</Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fde68a", bgcolor: "#fffbeb", color: "#b45309" }}>
                  {o.stage.stage_name}
                </Box>
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                  {o.status.status_name}
                </Box>
                {isReactivationOverdue(o.status?.status_code, o.reactivation_date) && (
                  <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                    Reactivation Overdue
                  </Box>
                )}
                {onSelectOpportunity && (
                  <Button
                    onClick={(e) => { e.stopPropagation(); onSelectOpportunity({ id: o.id, name: o.name }); }}
                    sx={TAB_BUTTON_SX}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
              <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box><Box component="span" sx={{ fontWeight: 700 }}>{o.owner.display_name}</Box></Box>
              <Box>
                <Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Win %: </Box>
                <Box component="span" sx={{ fontWeight: 900, color: Number(o.win_probability) >= 70 ? "#059669" : Number(o.win_probability) >= 40 ? "#d97706" : "#dc2626" }}>
                  {o.win_probability}%
                </Box>
              </Box>
              {o.indicative_value && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Value: </Box><Box component="span" sx={{ fontWeight: 700 }}>{o.indicative_value}L</Box></Box>}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}


function InstalledBaseTab({ assets, onAdd, onEdit }: { assets: any[]; onAdd: () => void; onEdit: (a: any) => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Installed Base ({assets.length})
        </Typography>
        <Button
          onClick={onAdd}
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          + Add
        </Button>
      </Box>
      {assets.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
          No installed assets found for this account.
        </Box>
      ) : (
        assets.map((a) => {
          const productName = a.is_competitor_equipment ? a.competitor_product_name || "Unknown Competitor" : a.product?.name || "Unknown Product";
          const modelInfo = !a.is_competitor_equipment && a.product?.model_number ? a.product.model_number : null;
          const oemInfo = !a.is_competitor_equipment && a.product?.oem_name ? a.product.oem_name : null;
          return (
            <Box key={a.id} sx={{ bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid", borderColor: a.is_competitor_equipment ? "#fecaca" : "#f3f4f6" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{productName}</Box>
                  {a.is_competitor_equipment && (
                    <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                      COMPETITOR
                    </Box>
                  )}
                </Box>
                <Button
                  onClick={() => onEdit(a)}
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
                >
                  Edit
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 0.5, fontSize: "0.75rem", color: "#6b7280" }}>
                {oemInfo && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>OEM: </Box><Box component="span" sx={{ fontWeight: 700 }}>{oemInfo}</Box></Box>}
                {modelInfo && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Model: </Box><Box component="span" sx={{ fontWeight: 700 }}>{modelInfo}</Box></Box>}
                {a.department && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Dept: </Box><Box component="span" sx={{ fontWeight: 700 }}>{a.department}</Box></Box>}
                {a.installation_date && <Box><Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Installed: </Box><Box component="span" sx={{ fontWeight: 700 }}>{a.installation_date}</Box></Box>}
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function Customer360Screen({ accountId, initialAccount = null, onBack, onSelectAccount, onSelectOpportunity, onSelectProject, initialTab, highlightActivityId, showAllOpportunities = false, onShowAllOpportunitiesChange }: Props) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: account,
    isLoading: loading,
    isError: hasAccountError,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => getAccount(accountId as any) as Promise<any>,
    initialData: initialAccount ?? undefined,
    // initialAccount is often just a name/id summary (Directory row, or a
    // parent/child AccountRef) missing child_accounts/parent_account/counts.
    // Without this, React Query treats that seed as freshly-fetched "now" and,
    // under main.tsx's global 30s staleTime, never kicks off the correcting
    // background fetch until some unrelated trigger (window refocus, a fresh
    // mount) happens to fire — which can be never on a screen the user just
    // leaves open. Backdating the timestamp makes it stale immediately, so a
    // background refetch starts right on mount while still painting instantly.
    initialDataUpdatedAt: initialAccount ? 0 : undefined,
  });

  const { data: accountCounts } = useQuery({
    queryKey: ["account-counts", accountId],
    queryFn: async () => {
      const countMap: any = await getAccountCounts([accountId] as any);
      return countMap[accountId] || {};
    },
    enabled: initialAccount?.stakeholder_count == null,
  });
  // accountCounts is only a stopgap while `account` still lacks count fields (e.g.
  // initialAccount came from a summary list view) — once the account query itself
  // resolves with real counts, its fields take precedence over the stopgap.
  const mergedAccount = account ? { ...accountCounts, ...account } : account;

  const { data: stakeholders = [], isLoading: stakeholdersLoading } = useQuery({
    queryKey: ["stakeholders", "byAccount", accountId],
    queryFn: () => listStakeholders(accountId as any) as Promise<any[]>,
  });

  const stakeholderIds = stakeholders.map((s: any) => s.id);
  const { data: stakeholderOpportunityCounts = {} } = useQuery({
    queryKey: ["stakeholder-opportunity-counts", accountId, stakeholderIds],
    queryFn: () => getStakeholderOpportunityCounts(stakeholderIds),
    enabled: stakeholderIds.length > 0,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", "byAccount", accountId],
    queryFn: () => listProjects(accountId as any) as Promise<any[]>,
  });

  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["opportunities", "byAccount", accountId],
    queryFn: () => listOpportunities(accountId as any) as Promise<any[]>,
  });

  const { data: installed = [], isLoading: installedLoading } = useQuery({
    queryKey: ["installed-assets", "byAccount", accountId],
    queryFn: () => listInstalledAssets(accountId as any) as Promise<any[]>,
  });

  // Owns the activities fetch — ActivityTimeline is rendered with selfFetch={false}
  // below, so it never fetches on its own; it only reads this query's cached result.
  // Unlike the 4 tabs above, ActivityTimeline is conditionally mounted (only when
  // activeTab === "activity"), so without a query living here (always-mounted,
  // same as the others), its data wouldn't start fetching until the user actually
  // clicked the tab.
  useQuery({
    queryKey: ["activities", "account", accountId],
    queryFn: () => listActivitiesByAccount(accountId as any),
    staleTime: 5 * 60 * 1000,
  });

  const [activeTab, setActiveTab] = useState(initialTab ?? "overview");

  // Activity tab
  const [showLogActivity, setShowLogActivity] = useState(false);

  // Edit Account
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountZone, setEditAccountZone] = useState<ZoneSearchResult | null>(null);
  const [editAccountPayer, setEditAccountPayer] = useState("");
  const [editAccountCustomerType, setEditAccountCustomerType] = useState("");
  const [editAccountParent, setEditAccountParent] = useState<{ id: string; name: string } | null>(null);
  const [parentSearchInput, setParentSearchInput] = useState("");
  // Option B duplicate-hospital warning on rename (BR-ACC-03, same as
  // CustomerDirectoryScreen's create flow) -- set when the backend's
  // near-duplicate check (POSSIBLE_DUPLICATE) rejects the in-flight rename.
  const [editDuplicateCandidates, setEditDuplicateCandidates] = useState<{ id: string; name: string }[] | null>(null);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<Record<string, unknown> | null>(null);
  // "Change Anyway" saving state and error -- same guard as AddHospitalModal's
  // "Create Anyway" (docs/Duplicate-Hospital-Prevention-Implementation-Plan.md, Part A).
  const [renameForceSaving, setRenameForceSaving] = useState(false);
  const [renameForceError, setRenameForceError] = useState<string | null>(null);
  const renameForceSavingRef = useRef(false);
  const debouncedParentSearch = useDebouncedValue(parentSearchInput);

  const childAccountIds: string[] = (mergedAccount?.child_accounts || []).map((c: any) => c.id);

  const { data: parentOptions = [], isFetching: parentOptionsLoading } = useQuery({
    queryKey: ["accounts", "picker", "parent", debouncedParentSearch],
    enabled: showEditAccount,
    queryFn: async () => {
      const d = await listAccounts({ search: debouncedParentSearch || undefined, page_size: 20 });
      return (d as { items?: { id: string; name: string }[] }).items ?? [];
    },
  });
  const parentAccountChoices = parentOptions.filter(
    (a) => a.id !== accountId && !childAccountIds.includes(a.id)
  );

  // Stakeholders
  const [showCreateStakeholder, setShowCreateStakeholder] = useState(false);
  const [newSName, setNewSName] = useState("");
  const [newSDesignation, setNewSDesignation] = useState("");
  const [newSEmail, setNewSEmail] = useState("");
  const [newSPhone, setNewSPhone] = useState("");
  const [newSHasDifferentWhatsapp, setNewSHasDifferentWhatsapp] = useState(false);
  const [newSWhatsapp, setNewSWhatsapp] = useState("");
  const [newSNps, setNewSNps] = useState("");
  const [newSSentiment, setNewSSentiment] = useState("");
  const [editingStakeholder, setEditingStakeholder] = useState<any | null>(null);
  const [viewingStakeholderOpportunities, setViewingStakeholderOpportunities] = useState<{ id: string; name: string } | null>(null);
  const [editSName, setEditSName] = useState("");
  const [editSDesignation, setEditSDesignation] = useState("");
  const [editSEmail, setEditSEmail] = useState("");
  const [editSPhone, setEditSPhone] = useState("");
  const [editSHasDifferentWhatsapp, setEditSHasDifferentWhatsapp] = useState(false);
  const [editSWhatsapp, setEditSWhatsapp] = useState("");
  const [editSNps, setEditSNps] = useState("");
  const [editSSentiment, setEditSSentiment] = useState("");

  // Projects
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newPName, setNewPName] = useState("");
  const [newPStatusId, setNewPStatusId] = useState("");
  const [newPOwnerId, setNewPOwnerId] = useState("");
  const [newPBidDate, setNewPBidDate] = useState("");
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editPName, setEditPName] = useState("");
  const [editPStatusId, setEditPStatusId] = useState("");
  const [editPOwnerId, setEditPOwnerId] = useState("");
  const [editPBidDate, setEditPBidDate] = useState("");

  // Opportunities -- the one create form (QuickLeadModal), with this
  // hospital fixed; the project stays a choice (Win Probability plan D10).
  const [showCreateOpp, setShowCreateOpp] = useState(false);

  // Installed assets
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [newAIsCompetitor, setNewAIsCompetitor] = useState(false);
  const [newAProductId, setNewAProductId] = useState("");
  const [newACompetitorName, setNewACompetitorName] = useState("");
  const [newAInstallDate, setNewAInstallDate] = useState("");
  const [newADepartment, setNewADepartment] = useState("");
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editAIsCompetitor, setEditAIsCompetitor] = useState(false);
  const [editAProductId, setEditAProductId] = useState("");
  const [editACompetitorName, setEditACompetitorName] = useState("");
  const [editAInstallDate, setEditAInstallDate] = useState("");
  const [editADepartment, setEditADepartment] = useState("");


  const { data: projectStatuses = [] } = useQuery({
    queryKey: ["project-statuses"],
    queryFn: () => listProjectStatuses() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null,
    staleTime: Infinity,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => listUsers() as Promise<any[]>,
    enabled: showCreateProject || editingProject !== null,
    staleTime: Infinity,
  });

  // Installed asset forms' product picker -- the caller's own SBU.
  const productsSbuId = (userProfile as any)?.sbu?.id;
  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", productsSbuId],
    queryFn: async () => {
      const d: any = await listProducts({ page_size: 100, sbu_id: productsSbuId } as any);
      return d.items || [];
    },
    enabled: showCreateAsset || editingAsset !== null,
  });

  const chipBarRef = useRef<HTMLDivElement>(null);

  const centerTab = useCallback((tabId: string, behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior });
        }
      }
    }, 50);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    centerTab(tabId);
  }, [centerTab]);

  // Bug fix, 2026-08-19: this screen fully unmounts/remounts on every navigation
  // away and back (DemoApp.tsx conditionally renders it), so `activeTab` can start
  // on a non-"overview" tab (e.g. resuming "projects" after Back from Project
  // Detail) without the user ever clicking a tab pill themselves -- handleTabChange
  // above only centers the chip bar on an actual click, so without this the active
  // chip was correctly highlighted but the scroll position defaulted to 0 (left
  // edge), leaving it mostly off-screen on a narrow viewport. "auto" (instant),
  // not "smooth", so it doesn't visibly animate on first paint.
  useEffect(() => {
    centerTab(activeTab, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Loading / error states ---
  if (loading) {
    return (
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, bgcolor: "#f9fafb" }}>
        <LoadingRow label="Loading Customer 360..." />
      </Box>
    );
  }
  if (hasAccountError && !account) {
    return (
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: 2, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Button
            onClick={onBack}
            sx={{ bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" }, color: "#4b5563", px: 1.5, py: 0.75, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            ← Back
          </Button>
        </Box>
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => refetchAccount()}
              sx={{ bgcolor: "#fee2e2", "&:hover": { bgcolor: "#fecaca" }, color: "#b91c1c", px: 1.5, py: 0.5, borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Retry
            </Button>
          }
        >
          {(accountError as any)?.message || "Failed to load account"}
        </Alert>
      </Box>
    );
  }

  // --- Modal helpers ---
  // Edit account
  const openEditAccount = () => {
    setEditAccountName(account.name || "");
    setEditAccountZone(account.zone ? { id: account.zone.id, name: account.zone.name, path: "" } : null);
    setEditAccountPayer(account.payer_behavior || "");
    setEditAccountCustomerType(account.customer_type || "");
    setEditAccountParent(account.parent_account || null);
    setParentSearchInput("");
    setEditDuplicateCandidates(null);
    setPendingUpdatePayload(null);
    setRenameForceError(null);
    setShowEditAccount(true);
  };

  const closeEditAccount = () => {
    setShowEditAccount(false);
    setEditDuplicateCandidates(null);
    setPendingUpdatePayload(null);
    setRenameForceError(null);
  };

  const applyAccountUpdate = async (payload: Record<string, unknown>) => {
    const previousParentId = account.parent_account?.id || null;
    const newParentId = (payload.parent_account_id as string | null) || null;
    await updateAccount(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
    // Keeps the Customer Directory list in sync with an edit made here — used
    // to happen via an accountUpdateRef prop-chain through DemoApp.tsx into
    // CustomerDirectoryScreen's own module-level cache; superseded by this
    // invalidation once that screen moved to React Query (its list query key
    // is ["accounts", "list", ...]).
    queryClient.invalidateQueries({ queryKey: ["accounts", "list"] });
    // The parent's own child_accounts list is a computed field on ITS query
    // cache entry, not this account's — invalidate both sides of a reparent
    // (old and new parent) so a page already viewing either one picks it up
    // instead of serving up to 30s (main.tsx's global staleTime) of stale data.
    if (previousParentId && previousParentId !== newParentId) {
      queryClient.invalidateQueries({ queryKey: ["account", previousParentId] });
    }
    if (newParentId && newParentId !== previousParentId) {
      queryClient.invalidateQueries({ queryKey: ["account", newParentId] });
    }
  };

  const handleUpdateAccount = async () => {
    if (!editAccountName.trim()) throw new Error("Customer name is required");
    if (!editAccountZone) throw new Error("Zone is required");
    const payload: any = {
      name: editAccountName.trim(),
      zone_id: editAccountZone.id,
      parent_account_id: editAccountParent?.id || null,
    };
    if (editAccountPayer) payload.payer_behavior = editAccountPayer;
    payload.customer_type = editAccountCustomerType || null;
    setEditDuplicateCandidates(null);
    setRenameForceError(null);
    try {
      await applyAccountUpdate(payload);
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "POSSIBLE_DUPLICATE" && err.candidates?.length) {
        setEditDuplicateCandidates(err.candidates);
        setPendingUpdatePayload(payload);
        throw new SilentModalError();
      }
      throw err;
    }
  };

  const handleRenameAnyway = async () => {
    if (!pendingUpdatePayload || renameForceSavingRef.current) return;
    renameForceSavingRef.current = true;
    setRenameForceSaving(true);
    setRenameForceError(null);
    let saved = false;
    try {
      await applyAccountUpdate({ ...pendingUpdatePayload, force_create: true });
      saved = true;
    } catch (err) {
      setRenameForceError(err instanceof Error ? err.message : "Something went wrong");
    }
    // Not a `finally`, and the close outside the try -- see AddHospitalModal's
    // handleCreateAnyway.
    renameForceSavingRef.current = false;
    setRenameForceSaving(false);
    if (saved) closeEditAccount();
  };

  // Same as AddHospitalModal's clearDuplicateWarning: an edit after the
  // warning drops it, so "Change Anyway" can't save stale values.
  const clearRenameWarning = () => {
    setEditDuplicateCandidates(null);
    setPendingUpdatePayload(null);
    setRenameForceError(null);
  };

  const handleUseExistingInsteadOfRename =(candidate: { id: string; name: string }) => {
    closeEditAccount();
    onSelectAccount?.(candidate);
  };

  // Stakeholder
  const openCreateStakeholder = () => {
    setNewSName(""); setNewSDesignation(""); setNewSEmail(""); setNewSPhone("");
    setNewSHasDifferentWhatsapp(false); setNewSWhatsapp("");
    setNewSNps(""); setNewSSentiment("");
    setShowCreateStakeholder(true);
  };

  const handleCreateStakeholder = async () => {
    if (!newSName.trim()) throw new Error("Stakeholder name is required");
    const payload: any = { name: newSName.trim() };
    if (newSDesignation.trim()) payload.designation = newSDesignation.trim();
    if (newSEmail.trim()) payload.email = newSEmail.trim();
    if (newSPhone.trim()) payload.phone = newSPhone.trim();
    // Unchecked means "same as phone" — mirror phone into whatsapp_number so any
    // reader can use the field directly, rather than requiring a fallback rule.
    if (newSHasDifferentWhatsapp) {
      if (newSWhatsapp.trim()) payload.whatsapp_number = newSWhatsapp.trim();
    } else if (newSPhone.trim()) {
      payload.whatsapp_number = newSPhone.trim();
    }
    if (newSNps !== "") payload.nps_score = Number(newSNps);
    if (newSSentiment) payload.sentiment = newSSentiment;
    await createStakeholder(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["stakeholders", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
  };

  const openEditStakeholder = (s: any) => {
    setEditingStakeholder(s);
    setEditSName(s.name || ""); setEditSDesignation(s.designation || "");
    setEditSEmail(s.email || ""); setEditSPhone(s.phone || "");
    // whatsapp_number is now always populated (mirrors phone when not explicitly
    // different) — so "different" means the two values actually diverge, not
    // merely that whatsapp_number is set.
    const hasDifferentWhatsapp = !!s.whatsapp_number && s.whatsapp_number !== s.phone;
    setEditSHasDifferentWhatsapp(hasDifferentWhatsapp);
    setEditSWhatsapp(hasDifferentWhatsapp ? s.whatsapp_number : "");
    setEditSNps(s.nps_score != null ? String(s.nps_score) : ""); setEditSSentiment(s.sentiment || "");
  };

  const handleUpdateStakeholder = async () => {
    if (!editSName.trim()) throw new Error("Stakeholder name is required");
    const payload: any = {
      name: editSName.trim(),
      designation: editSDesignation.trim() || null,
      email: editSEmail.trim() || null,
      phone: editSPhone.trim() || null,
      // Unchecked means "same as phone" — mirror phone (including any edit just
      // made to it in this same save) so whatsapp_number auto-propagates.
      whatsapp_number: editSHasDifferentWhatsapp ? (editSWhatsapp.trim() || null) : (editSPhone.trim() || null),
    };
    if (editSNps !== "") payload.nps_score = Number(editSNps);
    if (editSSentiment) payload.sentiment = editSSentiment;
    await updateStakeholder(editingStakeholder.id, payload);
    queryClient.invalidateQueries({ queryKey: ["stakeholders", "byAccount", accountId] });
  };

  // Projects
  const openCreateProject = () => {
    setNewPName(""); setNewPStatusId(""); setNewPOwnerId(""); setNewPBidDate("");
    setShowCreateProject(true);
  };

  const handleCreateProject = async () => {
    if (!newPName.trim()) throw new Error("Project name is required");
    if (!newPOwnerId) throw new Error("Owner is required");
    if (!newPStatusId) throw new Error("Status is required");
    const payload: any = { name: newPName.trim(), owner_id: newPOwnerId, status_id: newPStatusId };
    if (newPBidDate) payload.bid_submission_date = newPBidDate;
    await createProject(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", accountId] });
    queryClient.invalidateQueries({ queryKey: ["account", accountId] });
  };

  const openEditProject = (p: any) => {
    setEditingProject(p); setEditPName(p.name || ""); setEditPStatusId(p.status?.id || "");
    setEditPOwnerId(p.owner?.id || ""); setEditPBidDate(p.bid_submission_date || "");
  };

  const handleUpdateProject = async () => {
    if (!editPName.trim()) throw new Error("Project name is required");
    const payload: any = { name: editPName.trim(), owner_id: editPOwnerId || undefined, status_id: editPStatusId || undefined };
    if (editPBidDate) payload.bid_submission_date = editPBidDate;
    await updateProject(editingProject.id, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", accountId] });
  };

  // Installed assets
  const openCreateAsset = () => {
    setNewAIsCompetitor(false); setNewAProductId(""); setNewACompetitorName(""); setNewAInstallDate(""); setNewADepartment("");
    setShowCreateAsset(true);
  };

  const handleCreateAsset = async () => {
    if (!newAIsCompetitor && !newAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: newAIsCompetitor, installation_date: newAInstallDate || null, department: newADepartment.trim() || null };
    if (newAIsCompetitor) { payload.competitor_product_name = newACompetitorName.trim() || null; } else { payload.product_id = newAProductId; }
    await createInstalledAsset(accountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["installed-assets", "byAccount", accountId] });
  };

  const openEditAsset = (a: any) => {
    setEditingAsset(a); setEditAIsCompetitor(a.is_competitor_equipment);
    setEditAProductId(a.product?.id || ""); setEditACompetitorName(a.competitor_product_name || "");
    setEditAInstallDate(a.installation_date || ""); setEditADepartment(a.department || "");
  };

  const handleUpdateAsset = async () => {
    if (!editAIsCompetitor && !editAProductId) throw new Error("Product is required");
    const payload: any = { is_competitor_equipment: editAIsCompetitor, installation_date: editAInstallDate || null, department: editADepartment.trim() || null };
    if (editAIsCompetitor) { payload.competitor_product_name = editACompetitorName.trim() || null; payload.product_id = null; }
    else { payload.product_id = editAProductId; payload.competitor_product_name = null; }
    await updateInstalledAsset(editingAsset.id, payload);
    queryClient.invalidateQueries({ queryKey: ["installed-assets", "byAccount", accountId] });
  };

  return (
    <Box
      sx={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb",
        animation: "fadeIn 200ms",
        "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {/* Fixed header */}
      <Box sx={{ px: 2, pt: 2, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconButton onClick={onBack} aria-label="Back" sx={{ width: 40, height: 40, color: "#4b5563", flexShrink: 0, "&:hover": { bgcolor: "#e5e7eb" } }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
              {account.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              {account.zone && (
                <Box component="span" sx={{ px: 1.25, py: 0.25, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #99f6e4", bgcolor: "#f0fdfa", color: "#0f766e" }}>
                  {account.zone.name}
                </Box>
              )}
              <PayerBadge behavior={account.payer_behavior} />
              <BusinessPotentialChip value={account.business_potential} />
            </Box>
          </Box>
        </Box>

        {/* Count strip */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", bgcolor: "#fff", borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", px: 2, py: 1.5, mb: 2 }}>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "#7c3aed" }}>{mergedAccount.stakeholder_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Stakeholders</Box>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "primary.main" }}>{mergedAccount.project_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Projects</Box>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669" }}>{mergedAccount.opportunity_count ?? "—"}</Box>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Opportunities</Box>
          </Box>
        </Box>

        {/* Tab chip bar */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <Box
            ref={chipBarRef}
            sx={{
              display: "flex", gap: 1, overflowX: "auto", pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              pr: "50vw",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  sx={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                    borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap",
                    transition: "all 0.2s", border: "1px solid", textTransform: "none",
                    ...(isActive
                      ? { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main", boxShadow: SHADOW_SM }
                      : { bgcolor: "#fff", color: "#6b7280", borderColor: "#e5e7eb", "&:hover": { borderColor: "#93c5fd", color: "primary.main" } }),
                  }}
                >
                  {isActive && <CheckIcon sx={{ fontSize: 14, flexShrink: 0 }} />}
                  {tab.label}
                </Button>
              );
            })}
          </Box>
          <Box sx={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, pointerEvents: "none", background: "linear-gradient(to left, #f9fafb, transparent)" }} />
        </Box>
      </Box>

      {/* Scrollable tab content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {activeTab === "overview" && <OverviewTab account={account} onEdit={openEditAccount} onSelectAccount={onSelectAccount} />}
        {activeTab === "stakeholders" && (stakeholdersLoading ? <LoadingRow /> : <StakeholdersTab stakeholders={stakeholders} opportunityCounts={stakeholderOpportunityCounts} onAdd={openCreateStakeholder} onEdit={openEditStakeholder} onViewOpportunities={(s) => setViewingStakeholderOpportunities({ id: s.id, name: s.name })} />)}
        {activeTab === "projects" && (projectsLoading ? <LoadingRow /> : <ProjectsTab projects={projects} onAdd={openCreateProject} onEdit={openEditProject} onSelectProject={(p: any) => onSelectProject?.({ ...p, account: { id: accountId, name: account?.name } })} />)}
        {activeTab === "opportunities" && (opportunitiesLoading ? <LoadingRow /> : <OpportunitiesTab opportunities={opportunities} onAdd={() => setShowCreateOpp(true)} onSelectOpportunity={(o: any) => onSelectOpportunity?.(o, undefined, "opportunities")} showAll={showAllOpportunities} onToggleShowAll={() => onShowAllOpportunitiesChange?.(!showAllOpportunities)} />)}
        {activeTab === "next-actions" && (
          <NextActionsPanel
            queryKeyPrefix={["account-reminders", accountId, "customer-360"]}
            fetchReminders={(includeCompleted) => listAccountReminders(accountId, { includeCompleted })}
            emptyPendingMessage="No pending next actions at this hospital."
            currentUserId={(userProfile as any)?.id}
            onSelectOpportunity={(o) => onSelectOpportunity?.(o, undefined, "next-actions")}
          />
        )}
        {activeTab === "installed" && (installedLoading ? <LoadingRow /> : <InstalledBaseTab assets={installed} onAdd={openCreateAsset} onEdit={openEditAsset} />)}
        {activeTab === "activity" && (
          <ActivityTimeline accountId={accountId} onLogActivity={() => setShowLogActivity(true)} totalCount={mergedAccount.activity_count} selfFetch={false} highlightActivityId={highlightActivityId} />
        )}
      </Box>

      {/* ---- Modals ---- */}

      {/* Edit Account */}
      <FormModal isOpen={showEditAccount} onClose={closeEditAccount} title="Edit Customer" onSubmit={handleUpdateAccount} busy={renameForceSaving}>
        {editDuplicateCandidates && editDuplicateCandidates.length > 0 && (
          <>
            <Alert severity="warning" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {editDuplicateCandidates.length === 1
                  ? <>Did you mean <strong>{editDuplicateCandidates[0].name}</strong>? It's already in the directory.</>
                  : "This looks similar to hospitals already in the directory:"}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {editDuplicateCandidates.map((candidate) => (
                  <Box key={candidate.id} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    {editDuplicateCandidates.length > 1 && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
                    )}
                    <Button type="button" size="small" variant="outlined" onClick={() => handleUseExistingInsteadOfRename(candidate)} disabled={renameForceSaving}>
                      Use this one instead
                    </Button>
                  </Box>
                ))}
              </Box>
            </Alert>
            {/* Outside the Alert, not inside its message slot -- the warning
                icon indents the message area, which would otherwise shift
                this full-width button off from the rest of the form's fields. */}
            <Button type="button" size="medium" variant="contained" color="warning" fullWidth onClick={handleRenameAnyway} disabled={renameForceSaving}>
              {renameForceSaving ? "Saving..." : "Change Anyway"}
            </Button>
            {renameForceError && <Alert severity="error">{renameForceError}</Alert>}
          </>
        )}
        <TextField label="Name *" value={editAccountName} onChange={(e) => { setEditAccountName(e.target.value); clearRenameWarning(); }} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <ZonePicker label="Zone *" value={editAccountZone} onChange={(z) => { setEditAccountZone(z); clearRenameWarning(); }}searchFn={searchZonesForHospital} />
        <Autocomplete
          options={parentAccountChoices}
          getOptionLabel={(o: any) => o.name}
          isOptionEqualToValue={(o: any, v: any) => o.id === v.id}
          value={editAccountParent}
          loading={parentOptionsLoading}
          onChange={(_e, newValue) => { setEditAccountParent(newValue); clearRenameWarning(); }}
          onInputChange={(_e, newInputValue) => setParentSearchInput(newInputValue)}
          renderInput={(params) => <TextField {...params} label="Parent Customer" size="small" />}
          fullWidth
        />
        <TextField
          select label="Payer Behavior" value={editAccountPayer} onChange={(e) => { setEditAccountPayer(e.target.value); clearRenameWarning(); }}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select behavior</MenuItem>
          <MenuItem value="GOOD">Good</MenuItem>
          <MenuItem value="AVERAGE">Average</MenuItem>
          <MenuItem value="PROBLEMATIC">Problematic</MenuItem>
          <MenuItem value="UNKNOWN">Unknown</MenuItem>
        </TextField>
        <TextField
          select label="Customer Type" value={editAccountCustomerType} onChange={(e) => { setEditAccountCustomerType(e.target.value); clearRenameWarning(); }}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select type</MenuItem>
          <MenuItem value="MULTISPECIALITY_HOSPITAL">Multispeciality Hospital</MenuItem>
          <MenuItem value="SPECIALTY_HOSPITAL">Specialty Hospital</MenuItem>
          <MenuItem value="DIAGNOSTIC_CENTER">Diagnostic Center</MenuItem>
          <MenuItem value="CLINIC">Clinic</MenuItem>
          <MenuItem value="DEALER">Dealer</MenuItem>
          <MenuItem value="MEDICAL_COLLEGE_HOSPITAL">Medical College Hospital</MenuItem>
          <MenuItem value="GOVERNMENT_HOSPITAL">Government Hospital</MenuItem>
          <MenuItem value="OTHER">Other</MenuItem>
        </TextField>
      </FormModal>

      {/* Create Stakeholder */}
      <FormModal isOpen={showCreateStakeholder} onClose={() => setShowCreateStakeholder(false)} title="New Stakeholder" onSubmit={handleCreateStakeholder} submitLabel="Create">
        <TextField label="Name *" value={newSName} onChange={(e) => setNewSName(e.target.value)} placeholder="Enter stakeholder name" autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField label="Designation" value={newSDesignation} onChange={(e) => setNewSDesignation(e.target.value)} placeholder="e.g. Chief Radiologist" fullWidth size="small" />
        <TextField label="Email" type="email" value={newSEmail} onChange={(e) => setNewSEmail(e.target.value)} placeholder="e.g. doctor@hospital.com" fullWidth size="small" />
        <TextField label="Phone" type="tel" value={newSPhone} onChange={(e) => setNewSPhone(e.target.value)} placeholder="e.g. +91-9876543210" fullWidth size="small" />
        <FormControlLabel
          control={<Checkbox checked={newSHasDifferentWhatsapp} onChange={(e) => { setNewSHasDifferentWhatsapp(e.target.checked); if (!e.target.checked) setNewSWhatsapp(""); }} size="small" />}
          label="Different WhatsApp number?"
          sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
        />
        {newSHasDifferentWhatsapp && (
          <TextField label="WhatsApp Number" type="tel" value={newSWhatsapp} onChange={(e) => setNewSWhatsapp(e.target.value)} placeholder="e.g. +91-9876543210" fullWidth size="small" />
        )}
        <TextField label="NPS Score" type="number" value={newSNps} onChange={(e) => setNewSNps(e.target.value)} placeholder="-100 to 100" fullWidth size="small" slotProps={{ htmlInput: { min: -100, max: 100 } }} />
        <TextField
          select label="Sentiment" value={newSSentiment} onChange={(e) => setNewSSentiment(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select sentiment</MenuItem>
          <MenuItem value="PROMOTER">Promoter</MenuItem>
          <MenuItem value="NEUTRAL">Neutral</MenuItem>
          <MenuItem value="DETRACTOR">Detractor</MenuItem>
        </TextField>
      </FormModal>

      {/* Edit Stakeholder */}
      <FormModal isOpen={editingStakeholder !== null} onClose={() => setEditingStakeholder(null)} title="Edit Stakeholder" onSubmit={handleUpdateStakeholder}>
        <TextField label="Name *" value={editSName} onChange={(e) => setEditSName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField label="Designation" value={editSDesignation} onChange={(e) => setEditSDesignation(e.target.value)} fullWidth size="small" />
        <TextField label="Email" type="email" value={editSEmail} onChange={(e) => setEditSEmail(e.target.value)} fullWidth size="small" />
        <TextField label="Phone" type="tel" value={editSPhone} onChange={(e) => setEditSPhone(e.target.value)} fullWidth size="small" />
        <FormControlLabel
          control={<Checkbox checked={editSHasDifferentWhatsapp} onChange={(e) => { setEditSHasDifferentWhatsapp(e.target.checked); if (!e.target.checked) setEditSWhatsapp(""); }} size="small" />}
          label="Different WhatsApp number?"
          sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
        />
        {editSHasDifferentWhatsapp && (
          <TextField label="WhatsApp Number" type="tel" value={editSWhatsapp} onChange={(e) => setEditSWhatsapp(e.target.value)} placeholder="e.g. +91-9876543210" fullWidth size="small" />
        )}
        <TextField label="NPS Score" type="number" value={editSNps} onChange={(e) => setEditSNps(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: -100, max: 100 } }} />
        <TextField
          select label="Sentiment" value={editSSentiment} onChange={(e) => setEditSSentiment(e.target.value)}
          fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select sentiment</MenuItem>
          <MenuItem value="PROMOTER">Promoter</MenuItem>
          <MenuItem value="NEUTRAL">Neutral</MenuItem>
          <MenuItem value="DETRACTOR">Detractor</MenuItem>
        </TextField>
      </FormModal>

      {/* Create Project */}
      <FormModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" onSubmit={handleCreateProject} submitLabel="Create">
        <TextField label="Name *" value={newPName} onChange={(e) => setNewPName(e.target.value)} placeholder="Enter project name" autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Status *" value={newPStatusId} onChange={(e) => setNewPStatusId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner *" value={newPOwnerId} onChange={(e) => setNewPOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={newPBidDate} onChange={(e) => setNewPBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Edit Project */}
      <FormModal isOpen={editingProject !== null} onClose={() => setEditingProject(null)} title="Edit Project" onSubmit={handleUpdateProject}>
        <TextField label="Name *" value={editPName} onChange={(e) => setEditPName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <TextField select label="Status" value={editPStatusId} onChange={(e) => setEditPStatusId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField select label="Owner" value={editPOwnerId} onChange={(e) => setEditPOwnerId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={editPBidDate} onChange={(e) => setEditPBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* New Opportunity -- the one create form, this hospital fixed */}
      <QuickLeadModal
        isOpen={showCreateOpp}
        onClose={() => setShowCreateOpp(false)}
        sbuId={(userProfile as any)?.sbu?.id}
        initialAccountId={accountId}
        lockAccount
      />

      {/* Create Asset */}
      <FormModal isOpen={showCreateAsset} onClose={() => setShowCreateAsset(false)} title="New Installed Asset" onSubmit={handleCreateAsset} submitLabel="Create">
        <Box>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>Equipment Type</Typography>
          <FormControlLabel
            control={<Checkbox color="primary" checked={newAIsCompetitor} onChange={(e) => setNewAIsCompetitor(e.target.checked)} />}
            label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Competitor Equipment</Typography>}
          />
        </Box>
        {newAIsCompetitor ? (
          <TextField label="Competitor Product Name" value={newACompetitorName} onChange={(e) => setNewACompetitorName(e.target.value)} placeholder="e.g. Siemens SOMATOM" fullWidth size="small" />
        ) : (
          <TextField select label="Product *" value={newAProductId} onChange={(e) => setNewAProductId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select product</MenuItem>
            {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        )}
        <TextField label="Department" value={newADepartment} onChange={(e) => setNewADepartment(e.target.value)} placeholder="e.g. Radiology" fullWidth size="small" />
        <TextField label="Installation Date" type="date" value={newAInstallDate} onChange={(e) => setNewAInstallDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Edit Asset */}
      <FormModal isOpen={editingAsset !== null} onClose={() => setEditingAsset(null)} title="Edit Installed Asset" onSubmit={handleUpdateAsset}>
        <Box>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>Equipment Type</Typography>
          <FormControlLabel
            control={<Checkbox color="primary" checked={editAIsCompetitor} onChange={(e) => setEditAIsCompetitor(e.target.checked)} />}
            label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Competitor Equipment</Typography>}
          />
        </Box>
        {editAIsCompetitor ? (
          <TextField label="Competitor Product Name" value={editACompetitorName} onChange={(e) => setEditACompetitorName(e.target.value)} fullWidth size="small" />
        ) : (
          <TextField select label="Product *" value={editAProductId} onChange={(e) => setEditAProductId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
            <MenuItem value="">Select product</MenuItem>
            {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        )}
        <TextField label="Department" value={editADepartment} onChange={(e) => setEditADepartment(e.target.value)} fullWidth size="small" />
        <TextField label="Installation Date" type="date" value={editAInstallDate} onChange={(e) => setEditAInstallDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>

      {/* Log Activity */}
      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={accountId}
        currentUserId={(userProfile as any)?.id}
      />

      <StakeholderOpportunitiesModal
        stakeholder={viewingStakeholderOpportunities}
        onClose={() => setViewingStakeholderOpportunities(null)}
        onSelectOpportunity={onSelectOpportunity}
      />
    </Box>
  );
}
