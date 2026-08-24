import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  getOpportunity,
  listOpportunityItems,
  listOpportunitySplits,
  listOpportunityStakeholders,
  patchOpportunity,
  replaceOpportunityItems,
  replaceOpportunitySplits,
  addOpportunityStakeholder,
  removeOpportunityStakeholder,
  updateOpportunityStakeholder,
} from "../services/opportunities";
import { listStakeholders } from "../services/accounts";
import { listActivitiesByOpportunity, listOpportunityReminders } from "../services/activities";
import { listStages, listStatuses, listUsers, listHoldReasons, listLossReasons, listLeadSources } from "../services/masterData";
import { listProducts } from "../services/products";
import { listOpportunityDocuments, uploadOpportunityDocument, getDocumentDownloadUrl, deleteDocument } from "../services/documents";
import type { PipelineOpportunity, PipelinePage, DocumentResponse } from "../types/api-aliases";
import type { DraftOpportunityItem, ProductOption } from "../types/opportunityItems";
import { isReactivationOverdue } from "../utils/opportunityStatus";
import { itemsTotal } from "../utils/opportunityItems";
import ActivityTimeline from "../components/ActivityTimeline";
import LogActivityModal from "../components/LogActivityModal";
import FormModal from "../components/FormModal";
import ReminderRow from "../components/ReminderRow";
import OpportunityItemAddRow from "../components/OpportunityItemAddRow";
import OpportunityItemsList from "../components/OpportunityItemsList";
import { useAuth } from "../contexts/AuthContext";

// Stage display_order thresholds (from Seed-Data.sql) at which each stage-gated
// field first becomes relevant -- mirrors backend/app/domains/opportunity/
// validators.py's BR-OP-00 gates exactly. A field showing purely from an
// already-set value (not from the stage threshold) is never hidden by this --
// see each field's render condition below (Backlog decision, 2026-08-18).
const STAGE_ORDER_QUALIFIED = 20;
const STAGE_ORDER_DEMO = 30;
const STAGE_ORDER_NEGOTIATION = 50;
const STAGE_ORDER_ORDER = 60;

interface Props {
  opportunityId: string;
  // Often just an {id, name} reference (e.g. Reminder click-through) rather
  // than a full PipelineOpportunity (e.g. Pipeline navigation) — same
  // any-typed seed convention as Customer360Screen's initialAccount.
  initialOpportunity?: any;
  onBack: () => void;
  onOpportunityUpdate?: (opp: PipelineOpportunity) => void;
  // Set by entry points that know which tab the user actually wants (e.g.
  // Customer 360's stakeholder bridge list) so navigation doesn't always
  // land on Overview first.
  initialTab?: TabId;
}

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "activity",      label: "Activity" },
  { id: "next-actions",  label: "Next Actions" },
  { id: "products",      label: "Products" },
  { id: "splits",        label: "Splits" },
  { id: "stakeholders",  label: "Stakeholders" },
  { id: "documents",     label: "Documents" },
] as const;

type TabId = typeof TABS[number]["id"];

// Local stopgap types — these services return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface StageOption { id: string; stage_name: string; stage_code: string; display_order: number; default_win_probability: string }
interface StatusOption { id: string; status_code: string; status_name: string; is_terminal?: boolean }
interface UserOption { id: string; display_name: string }
interface HoldReasonOption { id: string; reason_name: string }
interface LossReasonOption { id: string; reason_name: string; reason_code: string }
interface LeadSourceOption { id: string; name: string }
interface StakeholderOption { id: string; name: string; designation?: string | null }

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#1f2937" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function StageBadge({ name }: { name: string }) {
  return (
    <Box
      component="span"
      sx={{
        px: 1, py: 0.5, borderRadius: "0.5rem", bgcolor: "#eff6ff", color: "#1d4ed8",
        fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
      }}
    >
      <Box component="span" sx={{ opacity: 0.65, fontWeight: 700, mr: 0.5 }}>Stage:</Box>
      {name}
    </Box>
  );
}

function StatusBadge({ code, name }: { code: string; name: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    ACTIVE:  { bg: "#ecfdf5", color: "#047857" },
    ON_HOLD: { bg: "#fffbeb", color: "#b45309" },
    STALLED: { bg: "#f3f4f6", color: "#6b7280" },
    WON:     { bg: "#eff6ff", color: "#1d4ed8" },
    LOST:    { bg: "#fef2f2", color: "#dc2626" },
  };
  const c = colours[code] ?? colours.STALLED;
  return (
    <Box
      component="span"
      sx={{
        px: 1, py: 0.5, borderRadius: "0.5rem", bgcolor: c.bg, color: c.color,
        fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
      }}
    >
      <Box component="span" sx={{ opacity: 0.65, fontWeight: 700, mr: 0.5 }}>Status:</Box>
      {name}
    </Box>
  );
}

function LoadingPlaceholder() {
  return (
    <Box
      sx={{
        py: 6, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", color: "#d1d5db", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
        animation: "opp-detail-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "@keyframes opp-detail-pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
      }}
    >
      Loading…
    </Box>
  );
}

function EmptyPlaceholder({ message }: { message: string }) {
  return (
    <Box sx={{ py: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", px: 4 }}>
      {message}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------
function OverviewTab({
  opp, onEdit, holdReasonName, lossReasonName,
}: {
  opp: PipelineOpportunity;
  onEdit: () => void;
  holdReasonName?: string;
  lossReasonName?: string;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Opportunity Details
          </Typography>
          <Button
            onClick={onEdit}
            disableRipple
            sx={{
              px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff",
              "&:hover": { bgcolor: "#dbeafe" },
            }}
          >
            Edit
          </Button>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Field label="Demo Start"          value={opp.demo_start_date ?? null} />
          <Field label="Demo End"            value={opp.demo_end_date ?? null} />
          <Field label="Expected Closure"    value={opp.expected_closure_date ?? null} />
          <Field label="PO Number"           value={opp.po_number ?? null} />
          <Field label="SBU"                 value={opp.sbu.name} />
          <Field label="Lead Source"         value={opp.lead_source?.name ?? null} />
          <Field label="Associated Project"  value={opp.project?.name ?? null} />
          <Field label="Referred By"         value={opp.referred_by?.display_name ?? opp.referred_by_note ?? null} />
        </Box>
        {opp.status.status_code === "ON_HOLD" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
            <Field label="Hold Reason"       value={holdReasonName ?? null} />
            <Field label="Reactivation Date" value={opp.reactivation_date ?? null} />
          </Box>
        )}
        {opp.status.status_code === "LOST" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <Field label="Loss Reason"      value={lossReasonName ?? null} />
            <Field label="Competitor Name"  value={opp.competitor_name ?? null} />
          </Box>
        )}
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f9fafb" }}>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
            Created
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {new Date(opp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Next Actions tab — read-only: completing a reminder here would let anyone
// with visibility into this opportunity (not just the assignee) close out
// someone else's follow-up, since (unlike the standalone Next Actions
// screen) this list isn't scoped to "reminders assigned to me". Add a
// complete action only if a real need for it shows up.
// ---------------------------------------------------------------------------
function NextActionsTab({ opportunityId }: { opportunityId: string }) {
  const [includeCompleted, setIncludeCompleted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["opp-reminders", opportunityId, includeCompleted],
    queryFn:  () => listOpportunityReminders(opportunityId, includeCompleted),
    staleTime: 5 * 60 * 1000,
  });

  const reminders = data ?? [];

  if (isLoading) return <LoadingPlaceholder />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <ToggleButtonGroup
        value={includeCompleted}
        exclusive
        onChange={(_, value) => { if (value !== null) setIncludeCompleted(value); }}
        sx={{ width: "fit-content", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        <ToggleButton
          value={false}
          disableRipple
          sx={{
            px: 2, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
            border: "none", color: "#9ca3af", bgcolor: "#fff",
            "&:hover": { bgcolor: "background.default" },
            "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
            "&.Mui-selected:hover": { bgcolor: "primary.main" },
          }}
        >
          Pending
        </ToggleButton>
        <ToggleButton
          value={true}
          disableRipple
          sx={{
            px: 2, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
            border: "none", color: "#9ca3af", bgcolor: "#fff",
            "&:hover": { bgcolor: "background.default" },
            "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
            "&.Mui-selected:hover": { bgcolor: "primary.main" },
          }}
        >
          Completed
        </ToggleButton>
      </ToggleButtonGroup>

      {reminders.length === 0 ? (
        <EmptyPlaceholder message={includeCompleted ? "No completed next actions yet." : "No pending next actions for this opportunity."} />
      ) : (
        reminders.map((r) => (
          <ReminderRow key={r.id} reminder={r} hideOpportunity />
        ))
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Products tab
// ---------------------------------------------------------------------------
function ProductsTab({
  opportunityId,
  sbuId,
  onIndicativeValueChange,
}: {
  opportunityId: string;
  sbuId: string;
  onIndicativeValueChange: (value: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["opp-items", opportunityId],
    queryFn:  () => listOpportunityItems(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  const [editing, setEditing]     = useState(false);
  const [editItems, setEditItems] = useState<DraftOpportunityItem[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", sbuId],
    enabled:  editing,
    queryFn:  async () => {
      const d = await listProducts({ page_size: 100, sbu_id: sbuId as any } as any);
      return (d as { items?: ProductOption[] }).items ?? [];
    },
  });

  const openEdit = () => {
    setEditItems(
      (items ?? []).map((i) => ({
        product_id:        i.product_id,
        product_name:      i.product?.name,
        product_type:      i.product?.product_type,
        description:       i.description,
        line_type:         i.line_type as "PRODUCT" | "BUYBACK",
        quantity:          i.quantity,
        unit_price_lakhs:  parseFloat(i.unit_price_lakhs),
        discount_lakhs:    parseFloat(i.discount_lakhs),
      })),
    );
    setSaveError(null);
    setEditing(true);
  };

  const saveItems = async () => {
    setSaving(true); setSaveError(null);
    try {
      await replaceOpportunityItems(
        opportunityId,
        editItems.map((i) => ({
          product_id: i.product_id, description: i.description, quantity: i.quantity,
          unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs,
          line_type: i.line_type,
        })),
      );
      await queryClient.invalidateQueries({ queryKey: ["opp-items", opportunityId] });
      // BR-FIN-03 (dual-mode valuation): once items exist, the calculated
      // total becomes the authoritative value — same auto-sync rule already
      // implemented in QuickLeadModal.tsx's create flow.
      const total = itemsTotal(editItems);
      const newValue = editItems.length > 0 ? total.toFixed(2) : null;
      await patchOpportunity(opportunityId, { indicative_value: newValue !== null ? Number(newValue) : null });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      onIndicativeValueChange(newValue);
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save products");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingPlaceholder />;

  if (editing) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Products
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              onClick={() => setEditing(false)}
              disableRipple
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveItems}
              disabled={saving}
              variant="contained"
              disableRipple
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>

        {saveError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{saveError}</Alert>}

        <OpportunityItemsList
          items={editItems}
          variant="editable"
          emptyMessage="No products — add one below"
          onRemove={(i) => setEditItems(editItems.filter((_, j) => j !== i))}
          onUpdateField={(i, field, value) => setEditItems(editItems.map((it, j) => j === i ? { ...it, [field]: value } : it))}
        />

        <OpportunityItemAddRow products={products} onAdd={(item) => setEditItems([...editItems, item])} />
      </Box>
    );
  }

  // View mode
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Products ({items?.length ?? 0})
        </Typography>
        <Button
          onClick={openEdit}
          disableRipple
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          {items?.length ? "Edit" : "+ Add"}
        </Button>
      </Box>
      {!items?.length ? (
        <EmptyPlaceholder message="No products added to this opportunity." />
      ) : (
        <>
          {items.map((item) => (
            <Box key={item.id} sx={{ bgcolor: item.line_type === "BUYBACK" ? "#fef2f2" : "background.default", borderRadius: "1rem", p: 1.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#1f2937", whiteSpace: "pre-wrap" }}>{item.description || item.product?.name}</Typography>
                {item.product?.product_type === "REFURBISHED" && <Chip label="Refurbished" size="small" color="warning" />}
                {item.line_type === "BUYBACK" && <Chip label="Buyback" size="small" color="error" />}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: "10px", color: "#6b7280" }}>
                <Box component="span">Qty: {item.quantity}</Box>
                <Box component="span">₹{parseFloat(item.unit_price_lakhs).toFixed(2)}L each</Box>
                {parseFloat(item.discount_lakhs) > 0 && (
                  <Box component="span" sx={{ color: "#ef4444" }}>−₹{parseFloat(item.discount_lakhs).toFixed(2)}L disc</Box>
                )}
              </Box>
              <Typography sx={{ fontSize: "10px", fontWeight: 900, color: item.line_type === "BUYBACK" ? "#dc2626" : "#059669" }}>
                {item.line_type === "BUYBACK" ? "−" : ""}₹{parseFloat(item.extended_value_lakhs).toFixed(2)}L
              </Typography>
            </Box>
          ))}
          <Typography sx={{ textAlign: "right", fontSize: "0.75rem", fontWeight: 900, color: "#374151", pt: 1, borderTop: "1px solid #f3f4f6" }}>
            Total: ₹{items.reduce((s, i) => s + (i.line_type === "BUYBACK" ? -1 : 1) * parseFloat(i.extended_value_lakhs), 0).toFixed(2)}L
          </Typography>
        </>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Splits tab
// ---------------------------------------------------------------------------
function SplitsTab({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient();
  const { data: splits, isLoading } = useQuery({
    queryKey: ["opp-splits", opportunityId],
    queryFn:  () => listOpportunitySplits(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  const [editing, setEditing]       = useState(false);
  const [editSplits, setEditSplits] = useState<any[]>([]);
  const [addUserId, setAddUserId]   = useState("");
  const [addPct, setAddPct]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["users", "sbu"],
    enabled:  editing,
    queryFn:  async () => {
      const d = await listUsers("sbu");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  const openEdit = () => {
    setEditSplits(
      (splits ?? []).map((s) => ({
        user_id:          s.user_id,
        display_name:     s.user.display_name,
        split_percentage: parseFloat(s.split_percentage),
      })),
    );
    setSaveError(null);
    setEditing(true);
  };

  const addSplit = () => {
    if (!addUserId || !addPct) return;
    if (editSplits.find((s) => s.user_id === addUserId)) return;
    const user = users.find((u) => u.id === addUserId);
    setEditSplits([...editSplits, { user_id: addUserId, display_name: user?.display_name || "", split_percentage: Number(addPct) }]);
    setAddUserId(""); setAddPct("");
  };

  const saveSplits = async () => {
    const total = editSplits.reduce((s, sp) => s + sp.split_percentage, 0);
    if (editSplits.length > 0 && Math.abs(total - 100) > 0.01) {
      setSaveError(`Splits must total 100% (currently ${total.toFixed(1)}%)`);
      return;
    }
    setSaving(true); setSaveError(null);
    try {
      await replaceOpportunitySplits(
        opportunityId,
        editSplits.map((s) => ({ user_id: s.user_id, split_percentage: s.split_percentage })),
      );
      await queryClient.invalidateQueries({ queryKey: ["opp-splits", opportunityId] });
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save splits");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingPlaceholder />;

  if (editing) {
    const total = editSplits.reduce((s, sp) => s + sp.split_percentage, 0);
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Splits
            </Typography>
            <Box component="span" sx={{ fontSize: "10px", fontWeight: 900, color: Math.abs(total - 100) < 0.01 ? "#059669" : "#f59e0b" }}>
              {total.toFixed(0)}%
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              onClick={() => { setEditing(false); setSaveError(null); }}
              disableRipple
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveSplits}
              disabled={saving}
              variant="contained"
              disableRipple
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>

        {saveError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{saveError}</Alert>}

        {editSplits.map((s, i) => (
          <Box key={s.user_id} sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff", px: 1.5, py: 1.25, borderRadius: "1rem", border: "1px solid #f3f4f6" }}>
            <Typography sx={{ flex: 1, fontSize: "0.75rem", fontWeight: 700, color: "#1f2937" }}>{s.display_name}</Typography>
            <TextField
              type="number"
              size="small"
              value={s.split_percentage}
              onChange={(e) => setEditSplits(editSplits.map((sp, j) => j === i ? { ...sp, split_percentage: Number(e.target.value) } : sp))}
              slotProps={{ htmlInput: { min: 0, max: 100, step: "any", style: { textAlign: "right" } } }}
              sx={{ width: "4rem", "& input": { color: "primary.main", fontWeight: 900, fontSize: "0.75rem" } }}
            />
            <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>%</Typography>
            <IconButton size="small" onClick={() => setEditSplits(editSplits.filter((_, j) => j !== i))} sx={{ color: "#f87171", "&:hover": { color: "#dc2626" } }}>
              <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", lineHeight: 1 }}>×</Box>
            </IconButton>
          </Box>
        ))}

        {/* Add contributor row */}
        <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: "1rem", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Add Contributor
          </Typography>
          <TextField
            select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">Select user</MenuItem>
            {users.filter((u) => !editSplits.find((s) => s.user_id === u.id)).map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Split %"
            type="number"
            size="small"
            value={addPct}
            onChange={(e) => setAddPct(e.target.value)}
            placeholder="e.g. 50"
            fullWidth
            slotProps={{ htmlInput: { min: 0, max: 100, step: "any" }, inputLabel: { shrink: true } }}
          />
          <Button
            onClick={addSplit}
            disabled={!addUserId || !addPct}
            fullWidth
            disableRipple
            sx={{
              py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" },
              "&.Mui-disabled": { opacity: 0.4, color: "primary.main", bgcolor: "#eff6ff" },
            }}
          >
            + Add Contributor
          </Button>
        </Box>
      </Box>
    );
  }

  // View mode
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Splits ({splits?.length ?? 0})
        </Typography>
        <Button
          onClick={openEdit}
          disableRipple
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          {splits?.length ? "Edit" : "+ Add"}
        </Button>
      </Box>
      {!splits?.length ? (
        <EmptyPlaceholder message="No contributor splits defined." />
      ) : (
        splits.map((s) => (
          <Box key={s.user_id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "background.default", borderRadius: "1rem", px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#1f2937" }}>{s.user.display_name}</Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "primary.main" }}>{parseFloat(s.split_percentage).toFixed(0)}%</Typography>
          </Box>
        ))
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Stakeholders tab
// ---------------------------------------------------------------------------
function StakeholdersTab({ opportunityId, accountId }: { opportunityId: string; accountId: string }) {
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useQuery({
    queryKey: ["opp-stakeholders", opportunityId],
    queryFn:  () => listOpportunityStakeholders(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  const [showAdd, setShowAdd]                         = useState(false);
  const [addStakeholderId, setAddStakeholderId]       = useState("");
  const [addInfluence, setAddInfluence]               = useState("");
  const [addRole, setAddRole]                         = useState("");
  const [addNotes, setAddNotes]                       = useState("");
  const [linking, setLinking]                         = useState(false);
  const [linkError, setLinkError]                     = useState<string | null>(null);

  const [editingId, setEditingId]                     = useState<string | null>(null);
  const [editInfluence, setEditInfluence]             = useState("");
  const [editRole, setEditRole]                       = useState("");
  const [editNotes, setEditNotes]                     = useState("");
  const [editSaving, setEditSaving]                   = useState(false);
  const [editError, setEditError]                     = useState<string | null>(null);

  const { data: accountStakeholders = [] } = useQuery({
    queryKey: ["stakeholders", "byAccount", accountId],
    enabled:  showAdd,
    queryFn:  async () => {
      const d = await listStakeholders(accountId as any);
      return Array.isArray(d) ? (d as StakeholderOption[]) : [];
    },
  });

  const openAdd = () => {
    setAddStakeholderId(""); setAddInfluence(""); setAddRole(""); setAddNotes("");
    setLinkError(null);
    setShowAdd(true);
  };

  const handleLink = async () => {
    if (!addStakeholderId) { setLinkError("Select a stakeholder"); return; }
    setLinking(true); setLinkError(null);
    try {
      await addOpportunityStakeholder(opportunityId, {
        stakeholder_id: addStakeholderId,
        influence_level: addInfluence || null,
        decision_role:   addRole.trim() || null,
        notes:           addNotes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["opp-stakeholders", opportunityId] });
      setShowAdd(false);
    } catch (e: any) {
      setLinkError(e.message || "Failed to link stakeholder");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (stakeholderId: string) => {
    setLinkError(null);
    try {
      await removeOpportunityStakeholder(opportunityId, stakeholderId);
      await queryClient.invalidateQueries({ queryKey: ["opp-stakeholders", opportunityId] });
    } catch (e: any) {
      setLinkError(e.message || "Failed to remove stakeholder");
    }
  };

  const openEditLink = (lnk: { stakeholder_id: string; influence_level: string | null; decision_role: string | null; notes: string | null }) => {
    setEditingId(lnk.stakeholder_id);
    setEditInfluence(lnk.influence_level ?? "");
    setEditRole(lnk.decision_role ?? "");
    setEditNotes(lnk.notes ?? "");
    setEditError(null);
  };

  const handleUpdateLink = async () => {
    if (!editingId) return;
    setEditSaving(true); setEditError(null);
    try {
      await updateOpportunityStakeholder(opportunityId, editingId, {
        influence_level: editInfluence || null,
        decision_role:   editRole.trim() || null,
        notes:           editNotes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["opp-stakeholders", opportunityId] });
      setEditingId(null);
    } catch (e: any) {
      setEditError(e.message || "Failed to update stakeholder");
    } finally {
      setEditSaving(false);
    }
  };

  if (isLoading) return <LoadingPlaceholder />;

  const linkedIds  = new Set((links ?? []).map((l) => l.stakeholder_id));
  const available  = accountStakeholders.filter((s) => !linkedIds.has(s.id));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Stakeholders ({(links ?? []).length})
        </Typography>
        <Button
          onClick={openAdd}
          disableRipple
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}
        >
          + Link
        </Button>
      </Box>

      {!links?.length && !showAdd && <EmptyPlaceholder message="No stakeholders linked to this opportunity." />}

      {links?.map((lnk) => (
        <Box key={lnk.stakeholder_id} sx={{ bgcolor: "#fff", borderRadius: "1rem", px: 1.5, py: 1.25, border: "1px solid #f3f4f6" }}>
          {editingId === lnk.stakeholder_id ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#1f2937" }}>{lnk.stakeholder.name}</Typography>
              {editError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{editError}</Alert>}
              <TextField
                select
                label="Influence Level"
                value={editInfluence}
                onChange={(e) => setEditInfluence(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </TextField>
              <TextField
                label="Decision Role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="e.g. Approver"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
                <Button
                  onClick={() => setEditingId(null)}
                  fullWidth
                  disableRipple
                  sx={{ py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLink}
                  disabled={editSaving}
                  variant="contained"
                  fullWidth
                  disableRipple
                  sx={{ py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {editSaving ? "Saving…" : "Save"}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#1f2937" }}>{lnk.stakeholder.name}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25, fontSize: "10px", color: "#6b7280" }}>
                  {lnk.influence_level && (
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 900, textTransform: "uppercase",
                        color: lnk.influence_level === "HIGH" ? "#ef4444" : lnk.influence_level === "MEDIUM" ? "#f59e0b" : "#9ca3af",
                      }}
                    >
                      {lnk.influence_level}
                    </Box>
                  )}
                  {lnk.decision_role && <Box component="span">{lnk.decision_role}</Box>}
                </Box>
                {lnk.notes && <Typography sx={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic", mt: 0.25 }}>{lnk.notes}</Typography>}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                <Button
                  onClick={() => openEditLink(lnk)}
                  disableRipple
                  sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
                >
                  Edit
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleUnlink(lnk.stakeholder_id)}
                  sx={{ color: "#f87171", "&:hover": { color: "#dc2626" } }}
                >
                  <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", lineHeight: 1 }}>×</Box>
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      ))}

      {showAdd && (
        <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: "1rem", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Link Stakeholder
          </Typography>
          {linkError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{linkError}</Alert>}
          <TextField
            select
            value={addStakeholderId}
            onChange={(e) => setAddStakeholderId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">Select stakeholder</MenuItem>
            {available.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}{s.designation ? ` — ${s.designation}` : ""}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Influence Level"
            value={addInfluence}
            onChange={(e) => setAddInfluence(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </TextField>
          <TextField
            label="Decision Role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            placeholder="e.g. Approver"
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Notes"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            placeholder="Optional"
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
            <Button
              onClick={() => { setShowAdd(false); setLinkError(null); }}
              fullWidth
              disableRipple
              sx={{ py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!addStakeholderId || linking}
              fullWidth
              disableRipple
              sx={{
                py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
                color: "#7c3aed", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" },
                "&.Mui-disabled": { opacity: 0.4, color: "#7c3aed", bgcolor: "#f5f3ff" },
              }}
            >
              {linking ? "Linking…" : "Link"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Documents tab (BR-ACT-08 -- real upload to a private Supabase Storage
// bucket; distinct from Product Catalog's URL-only collateral links)
// ---------------------------------------------------------------------------
const DOCUMENT_ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const DOCUMENT_ALLOWED_ACCEPT = DOCUMENT_ALLOWED_TYPES.join(",");
const DOCUMENT_MAX_SIZE_BYTES = 4 * 1024 * 1024;

// Not yet in the generated OpenAPI types until the backend's regenerated --
// mirrors DocumentDownloadUrl's shape from document/schemas.py. Same stopgap
// convention as the interfaces near the top of this file.
interface DocumentDownloadUrlResponse {
  url: string;
  expires_at: string;
}

function documentIcon(fileType: string): string {
  if (fileType === "application/pdf") return "📄";
  if (fileType.startsWith("image/")) return "🖼️";
  return "📎";
}

function DocumentsTab({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; fileName: string; fileType: string } | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["opp-documents", opportunityId],
    queryFn: () => listOpportunityDocuments(opportunityId) as Promise<DocumentResponse[]>,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadOpportunityDocument(opportunityId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opp-documents", opportunityId] });
      setUploadError(null);
    },
    onError: (err: any) => setUploadError(err.message || "Failed to upload document"),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opp-documents", opportunityId] }),
  });

  // Opens an in-app preview modal (iframe/img on the signed URL) rather than
  // window.open()-ing a new tab -- a new-tab navigation to a signed URL was
  // triggering a browser download prompt instead of rendering inline for
  // Basheer (2026-08-11), regardless of Supabase not setting
  // Content-Disposition: attachment on the response.
  const previewMutation = useMutation({
    mutationFn: (doc: DocumentResponse) =>
      (getDocumentDownloadUrl(doc.id) as Promise<DocumentDownloadUrlResponse>).then((data) => ({
        url: data.url,
        fileName: doc.file_name,
        fileType: doc.file_type,
      })),
    onSuccess: (data) => setPreviewDoc(data),
  });

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after an error
    if (!file) return;
    if (!DOCUMENT_ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Only PNG, JPEG, or PDF files are allowed.");
      return;
    }
    if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
      setUploadError("File exceeds the 4MB size limit.");
      return;
    }
    setUploadError(null);
    uploadMutation.mutate(file);
  }

  if (isLoading) return <LoadingPlaceholder />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Documents ({documents.length})
        </Typography>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          disableRipple
          sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }}
        >
          {uploadMutation.isPending ? "Uploading…" : "+ Add"}
        </Button>
        <Box
          component="input"
          type="file"
          ref={fileInputRef}
          accept={DOCUMENT_ALLOWED_ACCEPT}
          capture="environment"
          onChange={handleFileSelected}
          sx={{ display: "none" }}
        />
      </Box>

      {uploadError && <Alert severity="error" sx={{ fontSize: "0.75rem" }}>{uploadError}</Alert>}

      {!documents.length ? (
        <EmptyPlaceholder message="No documents uploaded yet." />
      ) : (
        documents.map((doc) => (
          <Box key={doc.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, bgcolor: "background.default", borderRadius: "1rem", px: 1.5, py: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
              <span>{documentIcon(doc.file_type)}</span>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.file_name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => previewMutation.mutate(doc)}
                disabled={previewMutation.isPending && previewMutation.variables?.id === doc.id}
                aria-label="View"
                sx={{ color: "primary.main" }}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => deleteMutation.mutate(doc.id)}
                disabled={deleteMutation.isPending && deleteMutation.variables === doc.id}
                aria-label="Delete"
                sx={{ color: "#f87171", "&:hover": { color: "#dc2626" } }}
              >
                <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", lineHeight: 1 }}>×</Box>
              </IconButton>
            </Box>
          </Box>
        ))
      )}

      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </Box>
  );
}

function DocumentPreviewModal({
  doc,
  onClose,
}: {
  doc: { url: string; fileName: string; fileType: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={doc !== null} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle component="h3" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {doc?.fileName}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f3f4f6", p: 0 }}>
        {doc && doc.fileType === "application/pdf" ? (
          <Box component="iframe" src={doc.url} title={doc.fileName} sx={{ width: "100%", height: "70vh", border: "none" }} />
        ) : doc ? (
          <Box component="img" src={doc.url} alt={doc.fileName} sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
        ) : null}
      </DialogContent>
      <DialogActions>
        {doc && (
          <Button component="a" href={doc.url} download={doc.fileName} target="_blank" rel="noopener noreferrer">
            Download
          </Button>
        )}
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function OpportunityDetailScreen({ opportunityId, initialOpportunity, onBack, onOpportunityUpdate, initialTab }: Props) {
  const { userProfile }                           = useAuth();
  const queryClient                               = useQueryClient();

  const { data: opp } = useQuery({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunity(opportunityId),
    initialData: initialOpportunity ?? undefined,
    // initialOpportunity is often just an {id, name} reference (Reminder
    // click-through), missing stage/status/owner/account/sbu. Without this,
    // React Query treats that seed as freshly-fetched "now" and, under
    // main.tsx's global 30s staleTime, never kicks off the correcting
    // background fetch — same reasoning as Customer360Screen's account query.
    initialDataUpdatedAt: initialOpportunity ? 0 : undefined,
  });

  useEffect(() => {
    if (opp) onOpportunityUpdate?.(opp);
  }, [opp]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab]                 = useState<TabId>(initialTab ?? "overview");
  const [showLogActivity, setShowLogActivity]     = useState(false);
  const chipBarRef = useRef<HTMLDivElement>(null);

  // Landing directly on a non-Overview tab (e.g. via the Customer 360
  // stakeholder bridge list) sets activeTab through the useState initializer
  // above, which skips handleTabChange's scroll-into-view — so on a narrow/
  // mobile viewport the highlighted chip can sit off-screen in the
  // horizontally-scrolling tab bar. The bridge list only hands over a bare
  // {id, name} stub as initialOpportunity, so `opp` is already truthy (via
  // useQuery's initialData) on the very first render, well before the real
  // fetch resolves stage/status/owner/account/sbu — matching the early-return
  // loading gate's condition here (not just `!opp`) is required, otherwise
  // this effect fires on that stub while the chip bar is still behind
  // <LoadingPlaceholder /> (chipBarRef null), burns its one-shot guard, and
  // never gets to retry once the chip bar actually mounts.
  const hasAppliedInitialTabScrollRef = useRef(false);
  useEffect(() => {
    if (!initialTab || !opp || !opp.stage || !opp.status || !opp.owner || !opp.account || !opp.sbu || hasAppliedInitialTabScrollRef.current) return;
    hasAppliedInitialTabScrollRef.current = true;
    const timer = setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${initialTab}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft });
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialTab, opp]);

  // Overview edit state
  const [showEditOpp, setShowEditOpp]             = useState(false);
  const [editName, setEditName]                   = useState("");
  const [editStageId, setEditStageId]             = useState("");
  const [editStatusId, setEditStatusId]           = useState("");
  const [editOwnerId, setEditOwnerId]             = useState("");
  const [editWinProb, setEditWinProb]             = useState("");
  const [editValue, setEditValue]                 = useState("");
  const [editClosureDate, setEditClosureDate]     = useState("");
  const [editDemoStart, setEditDemoStart]         = useState("");
  const [editDemoEnd, setEditDemoEnd]             = useState("");
  const [editLeadSourceId, setEditLeadSourceId]   = useState("");
  const [editPoNumber, setEditPoNumber]           = useState("");
  // Status-gated fields (BR-OP-02/03/05) — same pattern as Customer360Screen.tsx.
  // Hold/Loss fields are only sent when the effective status is ON_HOLD/LOST (see
  // handleUpdateOpp), so editing an opportunity without touching its status never
  // overwrites a previously-set hold/loss reason with an unrelated blank field.
  const [editHoldReasonId, setEditHoldReasonId]   = useState("");
  const [editReactivationDate, setEditReactivationDate] = useState("");
  const [editLossReasonId, setEditLossReasonId]   = useState("");
  const [editCompetitorName, setEditCompetitorName] = useState("");
  // BR-FIN-07: referral credit, only relevant when Lead Source = Referral.
  const [editIsExternalReferrer, setEditIsExternalReferrer] = useState(false);
  const [editReferredByUserId, setEditReferredByUserId]     = useState("");
  const [editReferredByNote, setEditReferredByNote]         = useState("");

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      }
    }, 50);
  }, []);

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    enabled:  showEditOpp,
    queryFn:  async () => (await listStages()) as StageOption[],
    staleTime: Infinity,
  });

  const { data: oppStatuses = [] } = useQuery({
    queryKey: ["statuses"],
    enabled:  showEditOpp,
    queryFn:  async () => (await listStatuses()) as StatusOption[],
    staleTime: Infinity,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    enabled:  showEditOpp,
    queryFn:  async () => {
      const d = await listUsers();
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
    staleTime: Infinity,
  });

  // Distinct query key -- must not reuse ["users","all"] above (despite its name,
  // that one calls listUsers() with no scope arg, defaulting to "scoped") or
  // ["users","sbu"] (line ~484, Splits tab) -- this needs a genuine scope="all" list.
  const { data: referralUsers = [] } = useQuery({
    queryKey: ["users", "referral-picker"],
    enabled:  showEditOpp,
    queryFn:  async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
    staleTime: Infinity,
  });

  // Needed on the Edit Opportunity modal (BR-OP-03/05 status gates) AND on the
  // Overview tab's read-only display whenever the opportunity is currently in
  // that status (to resolve hold_reason_id/loss_reason_id to a display name).
  const { data: holdReasons = [] } = useQuery({
    queryKey: ["holdReasons"],
    enabled:  showEditOpp || opp?.status?.status_code === "ON_HOLD",
    queryFn:  async () => (await listHoldReasons()) as HoldReasonOption[],
    staleTime: Infinity,
  });

  const { data: lossReasons = [] } = useQuery({
    queryKey: ["lossReasons"],
    enabled:  showEditOpp || opp?.status?.status_code === "LOST",
    queryFn:  async () => (await listLossReasons()) as LossReasonOption[],
    staleTime: Infinity,
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    enabled:  showEditOpp,
    queryFn:  async () => (await listLeadSources()) as LeadSourceOption[],
    staleTime: Infinity,
  });

  // Always-mounted prefetch queries for Products/Splits/Stakeholders/Activity — same
  // query keys each tab component already owns internally (ProductsTab/SplitsTab/
  // StakeholdersTab/ActivityTimeline), so by the time the user clicks a tab, its data
  // is already in cache instead of only starting to fetch on that click. staleTime
  // matches each tab's own query so a click shortly after mount doesn't trigger a
  // silent background refetch. This is the same pattern already used for the four
  // list tabs on Customer360Screen.tsx (ADR-032, Commit B).
  //
  // BR-FIN-03: this query doubles as the Indicative-Value-is-calculated-once-items-
  // exist source (hasItems below) — was previously gated to showEditOpp only for that
  // purpose; now always-mounted, which only makes hasItems more consistently correct.
  const { data: oppItems } = useQuery({
    queryKey: ["opp-items", opportunityId],
    queryFn:  () => listOpportunityItems(opportunityId),
    staleTime: 5 * 60 * 1000,
  });
  const hasItems = (oppItems?.length ?? 0) > 0;

  useQuery({
    queryKey: ["opp-splits", opportunityId],
    queryFn:  () => listOpportunitySplits(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["opp-stakeholders", opportunityId],
    queryFn:  () => listOpportunityStakeholders(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["activities", "opportunity", opportunityId],
    queryFn:  () => listActivitiesByOpportunity(opportunityId),
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["opp-reminders", opportunityId, false],
    queryFn:  () => listOpportunityReminders(opportunityId, false),
    staleTime: 5 * 60 * 1000,
  });

  // Patches the opportunity query's cache and the always-mounted Pipeline
  // screen's cache directly — we already have the new values in hand, so
  // there's no need to invalidate and wait on a redundant refetch just to
  // keep the two in sync.
  const applyOppPatch = (patch: Partial<PipelineOpportunity>) => {
    queryClient.setQueryData<PipelineOpportunity>(["opportunity", opportunityId], (prev) => prev ? { ...prev, ...patch } : prev);
    queryClient.setQueriesData<PipelinePage>({ queryKey: ["pipeline"] }, (page) => {
      if (!page) return page;
      return { ...page, items: page.items.map((item) => item.id === opportunityId ? { ...item, ...patch } : item) };
    });
  };

  const openEditOpp = () => {
    if (!opp) return; // only reachable once the detail body (gated below) has rendered
    setEditName(opp.name);
    setEditStageId(opp.stage.id);
    setEditStatusId(opp.status.id);
    setEditOwnerId(opp.owner.id);
    setEditWinProb(String(parseFloat(opp.win_probability)));
    setEditValue(opp.indicative_value ? String(parseFloat(opp.indicative_value)) : "");
    setEditClosureDate(opp.expected_closure_date ?? "");
    setEditDemoStart(opp.demo_start_date ?? "");
    setEditDemoEnd(opp.demo_end_date ?? "");
    setEditLeadSourceId(opp.lead_source?.id ?? "");
    setEditPoNumber(opp.po_number ?? "");
    setEditHoldReasonId(opp.hold_reason_id ?? "");
    setEditReactivationDate(opp.reactivation_date ?? "");
    setEditLossReasonId(opp.loss_reason_id ?? "");
    setEditCompetitorName(opp.competitor_name ?? "");
    setEditIsExternalReferrer(!!opp.referred_by_note);
    setEditReferredByUserId(opp.referred_by?.id ?? "");
    setEditReferredByNote(opp.referred_by_note ?? "");
    setShowEditOpp(true);
  };

  const handleUpdateOpp = async () => {
    if (!opp) return; // only reachable once the detail body (gated below) has rendered
    if (!editName.trim()) throw new Error("Name is required");
    // BR-OP-02/03/05: status-gated required fields. Re-checked/re-sent on every save
    // while the selected status is On Hold/Lost, since the form has no way to know
    // whether they were already satisfied by a previous save (see field declarations).
    const newStatus = oppStatuses.find((s) => s.id === editStatusId);
    const selectedLossReason = lossReasons.find((r) => r.id === editLossReasonId);
    if (newStatus?.status_code === "ON_HOLD") {
      if (!editHoldReasonId) throw new Error("Hold Reason is required to put an opportunity On-Hold");
      if (!editReactivationDate) throw new Error("Reactivation Date is required to put an opportunity On-Hold");
      if (editReactivationDate <= new Date().toISOString().slice(0, 10)) throw new Error("Reactivation Date must be a future date");
    }
    if (newStatus?.status_code === "LOST") {
      if (!editLossReasonId) throw new Error("Loss Reason is required to mark an opportunity as Lost");
      if (selectedLossReason?.reason_code === "COMPETITOR_WON" && !editCompetitorName.trim()) {
        throw new Error("Competitor Name is required when Loss Reason is 'Competitor Won'");
      }
    }
    if (newStatus?.status_code === "WON" && !editPoNumber.trim()) {
      throw new Error("PO Number is required to mark an opportunity as Won");
    }
    // LeadSource has no separate code column -- `name` already holds the pseudo-code.
    // Computed inline (not the render-time `editLeadSourceCode` below, out of scope here).
    const referralLeadSourceCode = leadSources.find((ls) => ls.id === editLeadSourceId)?.name;
    const payload: Record<string, unknown> = {
      name:                  editName.trim(),
      stage_id:              editStageId  || undefined,
      status_id:             editStatusId || undefined,
      owner_id:              editOwnerId  || undefined,
      win_probability:       editWinProb !== "" ? Number(editWinProb) : undefined,
      indicative_value:      editValue   !== "" ? Number(editValue)   : null,
      expected_closure_date: editClosureDate || null,
      demo_start_date:       editDemoStart   || null,
      demo_end_date:         editDemoEnd     || null,
      lead_source_id:        editLeadSourceId || null,
      po_number:             editPoNumber.trim() || null,
    };
    if (newStatus?.status_code === "ON_HOLD") {
      payload.hold_reason_id = editHoldReasonId;
      payload.reactivation_date = editReactivationDate;
    }
    if (newStatus?.status_code === "LOST") {
      payload.loss_reason_id = editLossReasonId;
      if (editCompetitorName.trim()) payload.competitor_name = editCompetitorName.trim();
    }
    if (referralLeadSourceCode === "REFERRAL") {
      if (editIsExternalReferrer) {
        payload.referred_by_note = editReferredByNote.trim() || null;
        payload.referred_by_user_id = null;
      } else {
        payload.referred_by_user_id = editReferredByUserId || null;
        payload.referred_by_note = null;
      }
    } else {
      // Lead Source no longer Referral -- clear any previously-set referral credit
      // rather than leaving it stranded and invisible (BR-FIN-07).
      payload.referred_by_user_id = null;
      payload.referred_by_note = null;
    }
    await patchOpportunity(opportunityId, payload);
    queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    // Reconstruct nested objects from loaded master data so header + strip +
    // pipeline card re-render immediately (local state and cache both, via applyOppPatch)
    const newStage       = stages.find((s) => s.id === editStageId);
    const newOwner       = users.find((u) => u.id === editOwnerId);
    const newLeadSource  = leadSources.find((ls) => ls.id === editLeadSourceId);
    const newReferredBy  = referralLeadSourceCode === "REFERRAL" && !editIsExternalReferrer
      ? referralUsers.find((u) => u.id === editReferredByUserId)
      : undefined;
    applyOppPatch({
      name:                  editName.trim(),
      win_probability:       editWinProb !== "" ? editWinProb : opp.win_probability,
      indicative_value:      editValue   !== "" ? editValue   : null,
      expected_closure_date: editClosureDate || null,
      demo_start_date:       editDemoStart   || null,
      demo_end_date:         editDemoEnd     || null,
      lead_source:           editLeadSourceId ? (newLeadSource ?? opp.lead_source) : null,
      po_number:             editPoNumber.trim() || null,
      hold_reason_id:        newStatus?.status_code === "ON_HOLD" ? editHoldReasonId : opp.hold_reason_id,
      reactivation_date:     newStatus?.status_code === "ON_HOLD" ? editReactivationDate : opp.reactivation_date,
      loss_reason_id:        newStatus?.status_code === "LOST" ? editLossReasonId : opp.loss_reason_id,
      competitor_name:       newStatus?.status_code === "LOST" ? (editCompetitorName.trim() || opp.competitor_name) : opp.competitor_name,
      referred_by_note:      referralLeadSourceCode === "REFERRAL" ? (editIsExternalReferrer ? (editReferredByNote.trim() || null) : null) : null,
      referred_by:           referralLeadSourceCode === "REFERRAL" ? (newReferredBy ?? null) : null,
      ...(newStage  && { stage:  { id: newStage.id,  stage_code: newStage.stage_code,   stage_name: newStage.stage_name,   display_order: newStage.display_order,   default_win_probability: newStage.default_win_probability } }),
      ...(newStatus && { status: { id: newStatus.id, status_code: newStatus.status_code, status_name: newStatus.status_name, is_terminal: newStatus.is_terminal ?? opp.status.is_terminal } }),
      ...(newOwner  && { owner:  { id: newOwner.id,  display_name: newOwner.display_name } }),
    });
  };

  const editStatusCode = oppStatuses.find((s) => s.id === editStatusId)?.status_code;
  const editLossReasonCode = lossReasons.find((r) => r.id === editLossReasonId)?.reason_code;
  // LeadSource has no separate code column -- `name` already holds the pseudo-code
  // (REFERRAL, TENDER, REPEAT_ORDER, ...), same value the picker below renders as the label.
  const editLeadSourceCode = leadSources.find((ls) => ls.id === editLeadSourceId)?.name;
  const editStageOrder = stages.find((s) => s.id === editStageId)?.display_order ?? 0;

  // initialOpportunity can be just an {id, name} reference (Reminder
  // click-through) — every render below assumes the full PipelineOpportunity
  // shape, so gate on the required nested fields until the real fetch
  // resolves. Pipeline navigation already hands over a complete object, so
  // this never shows for that entry point.
  if (!opp || !opp.stage || !opp.status || !opp.owner || !opp.account || !opp.sbu) {
    return (
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <LoadingPlaceholder />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, bgcolor: "background.default", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <IconButton onClick={onBack} aria-label="Back" sx={{ width: 40, height: 40, color: "#4b5563", flexShrink: 0, "&:hover": { bgcolor: "#e5e7eb" } }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", letterSpacing: "-0.025em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {opp.name}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#6b7280", mt: 0.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {opp.account.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
              <StageBadge name={opp.stage.stage_name} />
              <StatusBadge code={opp.status.status_code} name={opp.status.status_name} />
              {isReactivationOverdue(opp.status.status_code, opp.reactivation_date) && (
                <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#dc2626" }}>
                  Reactivation Overdue
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats strip */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", px: 2, py: 1.5, mb: 2 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{
              fontSize: "1.25rem", fontWeight: 900,
              color: parseFloat(opp.win_probability) >= 70 ? "#059669" : parseFloat(opp.win_probability) >= 40 ? "#f59e0b" : "#ef4444",
            }}>
              {parseFloat(opp.win_probability).toFixed(0)}%
            </Typography>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Win Prob</Typography>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669" }}>
              {opp.indicative_value ? `₹${parseFloat(opp.indicative_value).toFixed(1)}L` : "—"}
            </Typography>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Value</Typography>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#f3f4f6" }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 900, color: "#374151", lineHeight: 1.2, wordBreak: "break-word", maxWidth: "90px" }}>
              {opp.owner.display_name}
            </Typography>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.25 }}>Owner</Typography>
          </Box>
        </Box>

        {/* Tab chip bar */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <Box
            ref={chipBarRef}
            sx={{
              display: "flex", gap: 1, overflowX: "auto", pb: 0.5, pr: "50vw",
              "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disableRipple
                  sx={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                    borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap",
                    bgcolor: isActive ? "primary.main" : "#fff",
                    color: isActive ? "#fff" : "#4b5563",
                    border: isActive ? "none" : "1px solid #e5e7eb",
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    "&:hover": {
                      borderColor: isActive ? "transparent" : "#93c5fd",
                      color: isActive ? "#fff" : "primary.main",
                      bgcolor: isActive ? "primary.main" : "#fff",
                    },
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

      {/* Tab content */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
        {activeTab === "overview"     && (
          <OverviewTab
            opp={opp}
            onEdit={openEditOpp}
            holdReasonName={holdReasons.find((r) => r.id === opp.hold_reason_id)?.reason_name}
            lossReasonName={lossReasons.find((r) => r.id === opp.loss_reason_id)?.reason_name}
          />
        )}
        {activeTab === "products"     && (
          <ProductsTab
            opportunityId={opp.id}
            sbuId={opp.sbu.id}
            onIndicativeValueChange={(v) => applyOppPatch({ indicative_value: v })}
          />
        )}
        {activeTab === "splits"       && <SplitsTab opportunityId={opp.id} />}
        {activeTab === "stakeholders" && <StakeholdersTab opportunityId={opp.id} accountId={opp.account.id} />}
        {activeTab === "documents"    && <DocumentsTab opportunityId={opp.id} />}
        {activeTab === "activity"     && (
          <ActivityTimeline opportunityId={opp.id} accountId={opp.account.id} onLogActivity={() => setShowLogActivity(true)} selfFetch={false} />
        )}
        {activeTab === "next-actions" && <NextActionsTab opportunityId={opp.id} />}
      </Box>

      {/* Edit Opportunity modal */}
      <FormModal isOpen={showEditOpp} onClose={() => setShowEditOpp(false)} title="Edit Opportunity" onSubmit={handleUpdateOpp}>
        <TextField label="Name *" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus fullWidth size="small" sx={{ mt: 1.5 }} />
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            select
            label="Stage"
            value={editStageId}
            onChange={(e) => { const s = stages.find((x) => x.id === e.target.value); setEditStageId(e.target.value); if (s) setEditWinProb(String(s.default_win_probability)); }}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {stages.map((s) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Status"
            value={editStatusId}
            onChange={(e) => setEditStatusId(e.target.value)}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {oppStatuses.map((s) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </Box>
        <TextField
          select
          label="Lead Source"
          value={editLeadSourceId}
          onChange={(e) => setEditLeadSourceId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        {editLeadSourceCode === "REFERRAL" && (
          <Box>
            <FormControlLabel
              control={<Checkbox color="primary" checked={editIsExternalReferrer} onChange={(e) => { setEditIsExternalReferrer(e.target.checked); setEditReferredByUserId(""); setEditReferredByNote(""); }} />}
              label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>External referrer (not Cabio staff)</Typography>}
            />
            {editIsExternalReferrer ? (
              <TextField label="Referred By" value={editReferredByNote} onChange={(e) => setEditReferredByNote(e.target.value)} placeholder="e.g. Dr. Menon, referring physician" fullWidth size="small" />
            ) : (
              <TextField select label="Referred By" value={editReferredByUserId} onChange={(e) => setEditReferredByUserId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
                <MenuItem value="">Select colleague</MenuItem>
                {referralUsers.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
              </TextField>
            )}
          </Box>
        )}
        <TextField
          select
          label="Owner"
          value={editOwnerId}
          onChange={(e) => setEditOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Win Probability %" type="number" value={editWinProb} onChange={(e) => setEditWinProb(e.target.value)} placeholder="0–100" fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 100 } }} />
        {(editStageOrder >= STAGE_ORDER_QUALIFIED || hasItems || editValue !== "") && (
          <TextField
            label={`Indicative Value (₹ Lakhs)${hasItems ? " (auto)" : ""}`}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={hasItems}
            placeholder="e.g. 25.50"
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
        )}
        {((editStageOrder >= STAGE_ORDER_DEMO && editLeadSourceCode !== "REPEAT_ORDER") || editDemoStart !== "") && (
          <TextField label="Demo Start Date" type="date" value={editDemoStart} onChange={(e) => setEditDemoStart(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        {((editStageOrder >= STAGE_ORDER_DEMO && editLeadSourceCode !== "REPEAT_ORDER") || editDemoEnd !== "") && (
          <TextField label="Demo End Date" type="date" value={editDemoEnd} onChange={(e) => setEditDemoEnd(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        {((editStageOrder >= STAGE_ORDER_NEGOTIATION && editLeadSourceCode !== "REPEAT_ORDER") || editClosureDate !== "") && (
          <TextField label="Expected Closure Date" type="date" value={editClosureDate} onChange={(e) => setEditClosureDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        {(editStageOrder >= STAGE_ORDER_ORDER || editPoNumber.trim() !== "" || editStatusCode === "WON") && (
          <TextField label="PO Number" value={editPoNumber} onChange={(e) => setEditPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
        )}
        {editStatusCode === "ON_HOLD" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
            <TextField
              select label="Hold Reason *" value={editHoldReasonId} onChange={(e) => setEditHoldReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {holdReasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            <TextField
              label="Reactivation Date *" type="date" value={editReactivationDate} onChange={(e) => setEditReactivationDate(e.target.value)}
              fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
        {editStatusCode === "LOST" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <TextField
              select label="Loss Reason *" value={editLossReasonId} onChange={(e) => setEditLossReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {lossReasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            {editLossReasonCode === "COMPETITOR_WON" && (
              <TextField label="Competitor Name *" value={editCompetitorName} onChange={(e) => setEditCompetitorName(e.target.value)} placeholder="e.g. Siemens" fullWidth size="small" />
            )}
          </Box>
        )}
      </FormModal>

      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={opp.account.id}
        opportunityId={opp.id}
        currentUserId={(userProfile as any)?.id}
      />
    </Box>
  );
}
