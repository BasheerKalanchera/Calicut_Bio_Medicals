import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import FormModal from "./FormModal";
import AddHospitalModal from "./AddHospitalModal";
import OpportunityItemAddRow from "./OpportunityItemAddRow";
import OpportunityItemsList from "./OpportunityItemsList";
import { listAccounts, listProjects, createOpportunity } from "../services/accounts";
import { listProducts } from "../services/products";
import { listStages, listStatuses, listUsers, listLeadSources, listSbus, listGateOverrideReasons } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import type { DraftOpportunityItem, ProductOption } from "../types/opportunityItems";
import { itemsTotal } from "../utils/opportunityItems";
import { marketingLeadRef } from "../utils/marketingLeadMilestone";

// Stage display_order thresholds (from Seed-Data.sql) at which each stage-gated
// field first becomes relevant -- mirrors backend/app/domains/opportunity/
// validators.py's BR-OP-00 gates exactly, so a field never appears later than
// the point the server would actually start requiring it. Progressive
// disclosure on create only (Backlog decision, 2026-08-18) -- Edit forms show
// every applicable field regardless of stage, since hiding a populated field
// there would read as data loss.
const STAGE_ORDER_QUALIFIED = 20;
const STAGE_ORDER_DEMO = 30;
const STAGE_ORDER_NEGOTIATION = 50;
const STAGE_ORDER_ORDER = 60;

const GATE_OVERRIDE_ESCALATION_ROLE = "General Manager";

interface QuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Receives the newly created Opportunity (id included) -- the Marketing
  // Lead Convert flow (MarketingLeadReviewQueueScreen) needs the id to call
  // markMarketingLeadConverted afterward. Existing callers that ignore the
  // argument are unaffected (a zero-arg callback is still assignable here).
  onCreated?: (createdOpportunity: { id: string }) => void | Promise<void>;
  sbuId?: string;
  // Pre-fill Account/Project from wherever the user clicked "+ Lead" from
  // (Customer 360, Opportunity Detail, or a Project's own detail view) --
  // still fully editable, just saves re-picking the obvious choice. Same
  // context-inference DemoApp.tsx already does for LogActivityModal.
  initialAccountId?: string;
  initialProjectId?: string;
  // Marketing Lead Convert flow only (MarketingLeadReviewQueueScreen) --
  // pre-fills Lead Source and shows the Marketing User's original note (plus
  // the Conference event name, or the lead source itself when there's no
  // event name -- e.g. IndiaMART) as read-only context above the form.
  // Opportunity has no free-text note or event-name column of its own, so
  // all of these are reference only, never written to a field.
  initialLeadSourceId?: string;
  marketingLeadContextNote?: string | null;
  marketingLeadEventName?: string | null;
  marketingLeadSourceName?: string | null;
  marketingLeadId?: string;
}

// Local stopgap types — these services return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface AccountOption { id: string; name: string }
interface ProjectOption { id: string; name: string }
interface StageOption { id: string; stage_name: string; stage_code: string; display_order: number; default_win_probability: number }
interface StatusOption { id: string; status_name: string; status_code: string }
interface UserOption { id: string; display_name: string }
// role_name/manager_id: only the scope="all" user fetch (referralUsers below)
// populates these -- needed to resolve a gate override approver's eligibility
// (owner's manager_id, or role_name === "General Manager") client-side for the
// picker's option set. Same underlying UserListResponse shape as UserOption,
// just not narrowed away.
interface AllUserOption extends UserOption { role_name: string; manager_id: string | null }
interface LeadSourceOption { id: string; name: string }
interface SbuOption { id: string; name: string }
interface GateOverrideReasonOption { id: string; reason_name: string }

export default function QuickLeadModal({
  isOpen,
  onClose,
  onCreated,
  sbuId,
  initialAccountId,
  initialProjectId,
  initialLeadSourceId,
  marketingLeadContextNote,
  marketingLeadEventName,
  marketingLeadSourceName,
  marketingLeadId,
}: QuickLeadModalProps) {
  const { userProfile } = useAuth();
  // BR-OP-12: Admin/General Manager only — everyone else creates in their own SBU
  // (the sbuId prop) and never sees the override field.
  const isSbuOverrideRole = ["Admin", "General Manager"].includes((userProfile as any)?.role_name);

  const [accountId, setAccountId]       = useState("");
  const [projectId, setProjectId]       = useState("");
  const [name, setName]                 = useState("");
  const [sbuOverrideId, setSbuOverrideId] = useState("");
  const [stageId, setStageId]           = useState("");
  const [ownerId, setOwnerId]           = useState("");
  const [winProb, setWinProb]           = useState("");
  const [value, setValue]               = useState("");
  const [leadSourceId, setLeadSourceId] = useState("");
  const [demoStart, setDemoStart]       = useState("");
  const [demoEnd, setDemoEnd]           = useState("");
  const [closureDate, setClosureDate]   = useState("");
  const [poNumber, setPoNumber]         = useState("");
  // BR-FIN-07: referral credit, only relevant when Lead Source = Referral.
  const [isExternalReferrer, setIsExternalReferrer] = useState(false);
  const [referredByUserId, setReferredByUserId]     = useState("");
  const [referredByNote, setReferredByNote]         = useState("");
  // BR-OP-14: gate override. gateOverrideChecked is the sole trigger -- an
  // explicit rep action, not inferred from Stage + a blank date (2026-08-26
  // correction; see Manager-Attested-Gate-Override-Implementation-Plan.md).
  const [gateOverrideChecked, setGateOverrideChecked]       = useState(false);
  const [gateOverrideApproverId, setGateOverrideApproverId] = useState("");
  const [gateOverrideReasonId, setGateOverrideReasonId]     = useState("");
  const [gateOverrideNote, setGateOverrideNote]             = useState("");

  const effectiveSbuId = (isSbuOverrideRole && sbuOverrideId) ? sbuOverrideId : sbuId;

  const [items, setItems]                   = useState<DraftOpportunityItem[]>([]);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showAddHospital, setShowAddHospital] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", "picker"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listAccounts({ page_size: 100 });
      return (d as { items?: AccountOption[] }).items ?? [];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    enabled: isOpen,
    queryFn: async () => (await listStages()) as StageOption[],
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    enabled: isOpen,
    queryFn: async () => (await listStatuses()) as StatusOption[],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers();
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", effectiveSbuId],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listProducts({ page_size: 100, sbu_id: effectiveSbuId as any });
      return (d as { items?: ProductOption[] }).items ?? [];
    },
  });

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    enabled: isOpen && isSbuOverrideRole,
    queryFn: async () => (await listSbus()) as SbuOption[],
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    enabled: isOpen,
    queryFn: async () => (await listLeadSources()) as LeadSourceOption[],
  });

  // LeadSource has no separate code column -- `name` already holds the pseudo-code
  // (REFERRAL, TENDER, REPEAT_ORDER, ...), same value the picker renders as the label.
  const leadSourceCode = leadSources.find((ls) => ls.id === leadSourceId)?.name;

  // BR-OP-10: creation must default to Active only -- there is exactly one Active
  // status in the system, so this is never a real user choice. Set automatically
  // rather than showing a one-option dropdown.
  const activeStatusId = statuses.find((s) => s.status_code === "ACTIVE")?.id;
  const selectedStageOrder = stages.find((s) => s.id === stageId)?.display_order ?? 0;

  // Distinct query key -- must not reuse ["users","all"] above, which (despite its
  // name) actually calls listUsers() with no scope arg, defaulting to "scoped".
  // Also doubles as the gate override approver picker's source (role_name/
  // manager_id, via AllUserOption) -- the approver can be outside the current
  // viewer's own scoped visibility (any Area Manager tier or GM company-wide),
  // so it's enabled whenever the modal is open, not just for REFERRAL.
  const { data: referralUsers = [] } = useQuery({
    queryKey: ["users", "referral-picker"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as AllUserOption[]) : [];
    },
  });

  const { data: gateOverrideReasons = [] } = useQuery({
    queryKey: ["gateOverrideReasons"],
    enabled: isOpen,
    queryFn: async () => (await listGateOverrideReasons()) as GateOverrideReasonOption[],
  });

  // Approver picker option set: the selected owner's own immediate manager (via
  // manager_id) plus every active General Manager, not a free user picker --
  // mirrors the backend's own approver eligibility check
  // (OpportunityService._validate_gate_override) so the picker never offers a
  // choice the request would then reject.
  const gateOverrideOwner = referralUsers.find((u) => u.id === ownerId);
  const gateOverrideManager = gateOverrideOwner?.manager_id
    ? referralUsers.find((u) => u.id === gateOverrideOwner.manager_id)
    : undefined;
  const gateOverrideApproverOptions = (() => {
    const byId = new Map<string, AllUserOption>();
    if (gateOverrideManager) byId.set(gateOverrideManager.id, gateOverrideManager);
    for (const u of referralUsers) {
      if (u.role_name === GATE_OVERRIDE_ESCALATION_ROLE) byId.set(u.id, u);
    }
    return Array.from(byId.values());
  })();

  const { data: projects = [], isFetching: projectsLoading } = useQuery({
    queryKey: ["projects", "byAccount", accountId],
    enabled: isOpen && !!accountId,
    queryFn: async () => {
      const d = await listProjects(accountId as any);
      return Array.isArray(d) ? (d as ProjectOption[]) : [];
    },
  });

  useEffect(() => {
    // Derives the Value field from the items list; React 18 batches this
    // into one re-render, not worth restructuring for.
    if (items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(itemsTotal(items).toFixed(2));
    } else {
      setValue("");
    }
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    // Resets this form's fields on open; React 18 batches these into one
    // re-render, not worth restructuring this actively-used modal for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccountId(initialAccountId || ""); setProjectId(initialProjectId || "");
    setName(""); setSbuOverrideId(""); setStageId(""); setOwnerId("");
    setWinProb(""); setValue(""); setItems([]);
    setLeadSourceId(initialLeadSourceId || "");
    setDemoStart(""); setDemoEnd(""); setClosureDate(""); setPoNumber("");
    setIsExternalReferrer(false); setReferredByUserId(""); setReferredByNote("");
    setGateOverrideChecked(false);
    setGateOverrideApproverId(""); setGateOverrideReasonId(""); setGateOverrideNote("");
  }, [isOpen, initialAccountId, initialProjectId, initialLeadSourceId]);

  async function handleSubmit() {
    if (!name.trim()) throw new Error("Opportunity name is required");
    // BR-OP-12: Admin/GM have no meaningful "own" SBU -- must always explicitly choose.
    if (isSbuOverrideRole && !sbuOverrideId) throw new Error("SBU is required");
    if (!accountId) throw new Error("Account is required");
    if (!stageId) throw new Error("Stage is required");
    if (!activeStatusId) throw new Error("Unable to determine Active status -- please retry");
    if (!ownerId) throw new Error("Owner is required");
    if (winProb === "") throw new Error("Win probability is required");
    const _stage = stages.find((s) => s.id === stageId);
    const _qualified = stages.find((s) => s.stage_code === "QUALIFIED");
    if (_stage && _qualified && _stage.display_order >= _qualified.display_order && value === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    // BR-OP-14: mirrors the schema-level model_validator's rule client-side so
    // the failure surfaces before the round-trip, not just as a 422.
    if (gateOverrideChecked && gateOverrideApproverId && !gateOverrideReasonId) {
      throw new Error("Gate override reason is required whenever an approver is set");
    }
    const payload: Record<string, unknown> = {
      name: name.trim(),
      stage_id: stageId,
      status_id: activeStatusId,
      owner_id: ownerId,
      win_probability: Number(winProb),
    };
    if (isSbuOverrideRole && sbuOverrideId) payload.sbu_id = sbuOverrideId;
    if (value !== "") payload.indicative_value = Number(value);
    if (projectId) payload.project_id = projectId;
    if (leadSourceId) payload.lead_source_id = leadSourceId;
    if (demoStart && !gateOverrideChecked) payload.demo_start_date = demoStart;
    if (demoEnd && !gateOverrideChecked) payload.demo_end_date = demoEnd;
    if (closureDate && !(gateOverrideChecked && selectedStageOrder >= STAGE_ORDER_ORDER)) payload.expected_closure_date = closureDate;
    if (poNumber.trim()) payload.po_number = poNumber.trim();
    if (leadSourceCode === "REFERRAL") {
      if (isExternalReferrer) {
        if (referredByNote.trim()) payload.referred_by_note = referredByNote.trim();
      } else if (referredByUserId) {
        payload.referred_by_user_id = referredByUserId;
      }
    }
    if (gateOverrideChecked && gateOverrideApproverId) {
      payload.gate_override_approver_id = gateOverrideApproverId;
      payload.gate_override_reason_id = gateOverrideReasonId || null;
      if (gateOverrideNote.trim()) payload.gate_override_note = gateOverrideNote.trim();
    }
    if (items.length > 0) payload.items = items.map((i) => ({
      product_id: i.product_id,
      description: i.description,
      quantity: i.quantity,
      unit_price_lakhs: i.unit_price_lakhs,
      discount_lakhs: i.discount_lakhs,
      line_type: i.line_type,
    }));
    const created = await createOpportunity(accountId as any, payload);
    // Awaited -- the Lead Convert flow's onCreated (LeadReviewQueueScreen)
    // does a second async call (markLeadConverted) that must complete, and
    // any failure there must surface through FormModal's normal error
    // handling, not become an unhandled rejection after this dialog closes.
    await onCreated?.(created as { id: string });
  }

  return (
    <>
      <FormModal isOpen={isOpen} onClose={onClose} title="New Opportunity" onSubmit={handleSubmit} submitLabel="Create" disableEnforceFocus={showItemsModal || showAddHospital}>
        {(marketingLeadContextNote || marketingLeadEventName || marketingLeadSourceName) && (
          <Box sx={{ p: 1.5, borderRadius: "0.75rem", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              From the marketing lead{marketingLeadId ? ` ${marketingLeadRef(marketingLeadId)}` : ""}
            </Typography>
            {/* Source always shows when known; Conference additionally shows
                its event name as its own line -- every lead source gets the
                same "Source: X" line, Conference just gets one more on top. */}
            {marketingLeadSourceName && (
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "#166534", mb: marketingLeadEventName || marketingLeadContextNote ? 0.25 : 0 }}>
                Source: {marketingLeadSourceName}
              </Typography>
            )}
            {marketingLeadEventName && (
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "#166534", mb: marketingLeadContextNote ? 0.25 : 0 }}>
                Conference: {marketingLeadEventName}
              </Typography>
            )}
            {marketingLeadContextNote && (
              <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>{marketingLeadContextNote}</Typography>
            )}
          </Box>
        )}
        <TextField
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter opportunity name"
          autoFocus
          fullWidth
          size="small"
          sx={{ mt: 1.5 }}
        />
        {isSbuOverrideRole && (
          <TextField
            select
            label="SBU *"
            value={sbuOverrideId}
            onChange={(e) => setSbuOverrideId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select SBU</MenuItem>
            {sbus.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
        )}
        <TextField
          select
          label="Account *"
          value={accountId}
          onChange={(e) => { setAccountId(e.target.value); setProjectId(""); }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select account</MenuItem>
          {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -0.5 }}>
          <Button
            type="button"
            onClick={() => setShowAddHospital(true)}
            sx={{
              px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5",
              "&:hover": { bgcolor: "#d1fae5" },
            }}
          >
            + Add Hospital
          </Button>
        </Box>
        <TextField
          select
          label={`Project${projectsLoading ? " — loading…" : ""}`}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={!accountId}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">None</MenuItem>
          {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Stage *"
          value={stageId}
          onChange={(e) => {
            const s = stages.find((x) => x.id === e.target.value);
            setStageId(e.target.value);
            if (s) setWinProb(String(s.default_win_probability));
          }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select stage</MenuItem>
          {stages.map((s) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Lead Source"
          value={leadSourceId}
          onChange={(e) => setLeadSourceId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        {leadSourceCode === "REFERRAL" && (
          <Box>
            <FormControlLabel
              control={<Checkbox color="primary" checked={isExternalReferrer} onChange={(e) => { setIsExternalReferrer(e.target.checked); setReferredByUserId(""); setReferredByNote(""); }} />}
              label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>External referrer (not Cabio staff)</Typography>}
            />
            {isExternalReferrer ? (
              <TextField label="Referred By" value={referredByNote} onChange={(e) => setReferredByNote(e.target.value)} placeholder="e.g. Dr. Menon, referring physician" fullWidth size="small" />
            ) : (
              <TextField select label="Referred By" value={referredByUserId} onChange={(e) => setReferredByUserId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
                <MenuItem value="">Select colleague</MenuItem>
                {referralUsers.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
              </TextField>
            )}
          </Box>
        )}
        <TextField
          select
          label="Owner *"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField
          label="Win Probability % *"
          type="number"
          value={winProb}
          onChange={(e) => setWinProb(e.target.value)}
          placeholder="Enter Win Probability %"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, max: 100 } }}
        />
        {(selectedStageOrder >= STAGE_ORDER_QUALIFIED || items.length > 0) && (
          <TextField
            label={`Indicative Value (Lakhs)${items.length > 0 ? " (auto)" : ""}`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={items.length > 0}
            placeholder="Enter Indicative Value (Lakhs)"
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
        )}
        <FormControlLabel
          control={<Checkbox color="primary" checked={gateOverrideChecked} onChange={(e) => setGateOverrideChecked(e.target.checked)} />}
          label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Fast-Track this Deal</Typography>}
        />
        {selectedStageOrder >= STAGE_ORDER_DEMO && leadSourceCode !== "REPEAT_ORDER" && !gateOverrideChecked && (
          <>
            <TextField label="Demo Start Date" type="date" value={demoStart} onChange={(e) => setDemoStart(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo End Date" type="date" value={demoEnd} onChange={(e) => setDemoEnd(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
          </>
        )}
        {selectedStageOrder >= STAGE_ORDER_NEGOTIATION && leadSourceCode !== "REPEAT_ORDER" &&
          !(gateOverrideChecked && selectedStageOrder >= STAGE_ORDER_ORDER) && (
          <TextField label="Expected Closure Date" type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        {gateOverrideChecked && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <TextField
              select
              label={gateOverrideApproverId ? "Approved By *" : "Approved By"}
              value={gateOverrideApproverId}
              onChange={(e) => setGateOverrideApproverId(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              helperText="The owner's immediate manager, or a General Manager"
            >
              <MenuItem value="">No override</MenuItem>
              {gateOverrideApproverOptions.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.display_name}{u.role_name === GATE_OVERRIDE_ESCALATION_ROLE ? " (General Manager)" : " (Manager)"}
                </MenuItem>
              ))}
            </TextField>
            {gateOverrideApproverId && (
              <>
                <TextField
                  select label="Reason *" value={gateOverrideReasonId} onChange={(e) => setGateOverrideReasonId(e.target.value)}
                  fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">Select reason</MenuItem>
                  {gateOverrideReasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
                </TextField>
                <TextField
                  label="Note" value={gateOverrideNote} onChange={(e) => setGateOverrideNote(e.target.value)}
                  placeholder="Optional" fullWidth size="small" multiline minRows={2}
                />
              </>
            )}
          </Box>
        )}
        {selectedStageOrder >= STAGE_ORDER_ORDER && (
          <TextField label="PO Number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
        )}
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Products
            </Typography>
            <Button
              type="button"
              onClick={() => setShowItemsModal(true)}
              sx={{
                px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5",
                "&:hover": { bgcolor: "#d1fae5" },
              }}
            >
              {items.length > 0 ? `Edit (${items.length})` : "+ Add Products"}
            </Button>
          </Box>
          <OpportunityItemsList items={items} variant="summary" />
        </Box>
      </FormModal>

      {/* Products secondary modal */}
      <FormModal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        <OpportunityItemsList
          items={items}
          variant="editable"
          emptyMessage="No products added"
          onRemove={(i) => setItems(items.filter((_, j) => j !== i))}
          onUpdateField={(i, field, value) => setItems(items.map((it, j) => j === i ? { ...it, [field]: value } : it))}
        />
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem" }}>
          <OpportunityItemAddRow products={products} onAdd={(item) => setItems([...items, item])} />
        </Box>
      </FormModal>

      {/* Add Hospital secondary modal -- lets the rep create the account
          inline instead of backing out to Customer Directory and coming
          back. Same duplicate-checked flow (BR-ACC-03) either way, since
          both use AddHospitalModal.tsx. Both outcomes (fresh create or
          picking an existing near-duplicate match) select the account here
          -- unlike CustomerDirectoryScreen.tsx, there's no reason to treat
          them differently in this context. */}
      <AddHospitalModal
        isOpen={showAddHospital}
        onClose={() => setShowAddHospital(false)}
        onCreated={(account) => { setAccountId(account.id); setProjectId(""); setShowAddHospital(false); }}
        onExistingSelected={(account) => { setAccountId(account.id); setProjectId(""); setShowAddHospital(false); }}
      />
    </>
  );
}
