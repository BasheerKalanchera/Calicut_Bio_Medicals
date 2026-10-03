import { useCallback, useEffect, useState, type RefObject } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, IconButton, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listAllProjects } from "../services/projects";
import { listAccounts, createProject, updateProject, listOpportunities, createOpportunity } from "../services/accounts";
import { listProjectStatuses, listUsers, listStages, listStatuses, listLeadSources, listGateOverrideReasons, listSbus } from "../services/masterData";
import { listProducts } from "../services/products";
import { useAuth } from "../contexts/AuthContext";
import FormModal from "../components/FormModal";
import ActivityTimeline from "../components/ActivityTimeline";
import OpportunityItemAddRow from "../components/OpportunityItemAddRow";
import OpportunityItemsList from "../components/OpportunityItemsList";
import { itemsTotal } from "../utils/opportunityItems";
import useDebouncedValue from "../hooks/useDebouncedValue";
import type { DraftOpportunityItem, ProductOption } from "../types/opportunityItems";

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

// Stage display_order thresholds (from Seed-Data.sql) at which each stage-gated
// field first becomes relevant -- mirrors backend/app/domains/opportunity/
// validators.py's BR-OP-00 gates exactly, so a field never appears later than
// the point the server would actually start requiring it.
const STAGE_ORDER_QUALIFIED = 20;
const STAGE_ORDER_DEMO = 30;
const STAGE_ORDER_NEGOTIATION = 50;
const STAGE_ORDER_ORDER = 60;

const GATE_OVERRIDE_ESCALATION_ROLE = "General Manager";

// Minimal shape DemoApp.tsx's selectedProject state actually needs — this
// screen's own project rows/queries carry richer objects (see the `any`
// entity typing below), which satisfy this narrower shape structurally.
interface ProjectRef {
  id: string;
  name: string;
  account: { id: string; name: string };
}

function ProjectDetailView({
  project: p,
  onBack,
  onEdit,
  refreshOppsRef,
  openLogActivityRef,
  onSelectOpportunity,
}: {
  project: any;
  onBack: () => void;
  onEdit: () => void;
  refreshOppsRef?: RefObject<(() => void) | null>;
  openLogActivityRef?: RefObject<(() => void) | null>;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  // BR-OP-12: Admin/General Manager have no meaningful "own" SBU -- must
  // always explicitly choose one when creating an Opportunity. Same check
  // as Customer360Screen.tsx / QuickLeadModal.tsx.
  const isSbuOverrideRole = ["Admin", "General Manager"].includes(userProfile?.role_name);

  const [showAddOpp, setShowAddOpp] = useState(false);
  const [addOppName, setAddOppName] = useState("");
  const [addOppStageId, setAddOppStageId] = useState("");
  const [addOppOwnerId, setAddOppOwnerId] = useState("");
  const [addOppWinProb, setAddOppWinProb] = useState("");
  const [addOppValue, setAddOppValue] = useState("");
  const [addOppLeadSourceId, setAddOppLeadSourceId] = useState("");
  const [addOppDemoStart, setAddOppDemoStart] = useState("");
  const [addOppDemoEnd, setAddOppDemoEnd] = useState("");
  const [addOppClosureDate, setAddOppClosureDate] = useState("");
  const [addOppPoNumber, setAddOppPoNumber] = useState("");
  const [addOppItems, setAddOppItems] = useState<DraftOpportunityItem[]>([]);
  const [showAddOppItemsModal, setShowAddOppItemsModal] = useState(false);
  const [addOppSbuId, setAddOppSbuId] = useState("");
  // BR-FIN-07: referral credit, only relevant when Lead Source = Referral.
  const [addOppIsExternalReferrer, setAddOppIsExternalReferrer] = useState(false);
  const [addOppReferredByUserId, setAddOppReferredByUserId] = useState("");
  const [addOppReferredByNote, setAddOppReferredByNote] = useState("");
  // BR-OP-14: gate override. addOppGateOverrideChecked is the sole trigger -- an
  // explicit rep action, not inferred from Stage + a blank date (2026-08-26
  // correction; see Manager-Attested-Gate-Override-Implementation-Plan.md).
  const [addOppGateOverrideChecked, setAddOppGateOverrideChecked] = useState(false);
  const [addOppGateOverrideApproverId, setAddOppGateOverrideApproverId] = useState("");
  const [addOppGateOverrideReasonId, setAddOppGateOverrideReasonId] = useState("");
  const [addOppGateOverrideNote, setAddOppGateOverrideNote] = useState("");

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ["opportunities", "byAccount", p.account.id],
    queryFn: () => listOpportunities(p.account.id as any) as Promise<any[]>,
  });
  const opps = opportunities.filter((o: any) => o.project_id === p.id);
  useEffect(() => {
    if (refreshOppsRef) {
      refreshOppsRef.current = () =>
        queryClient.invalidateQueries({ queryKey: ["opportunities", "byAccount", p.account.id] });
    }
  }, [refreshOppsRef, queryClient, p.account.id]);

  const { data: oppStages = [] } = useQuery({
    queryKey: ["stages"],
    queryFn: () => listStages() as Promise<any[]>,
    enabled: showAddOpp,
    staleTime: Infinity,
  });
  const { data: oppStatuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => listStatuses() as Promise<any[]>,
    enabled: showAddOpp,
    staleTime: Infinity,
  });
  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    queryFn: () => listLeadSources() as Promise<any[]>,
    enabled: showAddOpp,
    staleTime: Infinity,
  });
  // LeadSource has no separate code column -- `name` already holds the pseudo-code
  // (REFERRAL, TENDER, REPEAT_ORDER, ...), same value the picker renders as the label.
  const addOppLeadSourceCode = leadSources.find((ls: any) => ls.id === addOppLeadSourceId)?.name;
  // BR-OP-10: creation must default to Active only -- there is exactly one Active
  // status in the system, so this is never a real user choice on Add Opportunity.
  // Set automatically rather than showing a one-option dropdown.
  const activeStatusId = oppStatuses.find((s: any) => s.status_code === "ACTIVE")?.id;
  const addOppStageOrder = oppStages.find((s: any) => s.id === addOppStageId)?.display_order ?? 0;


  // Distinct query key -- must not reuse ["users","all"] below, which (despite its
  // name) actually calls listUsers() with no scope arg, defaulting to "scoped".
  // Also doubles as the gate override approver picker's source (role_name/
  // manager_id per user) -- the approver can be outside the current viewer's own
  // scoped visibility (any Area Manager tier or GM company-wide), so it's enabled
  // whenever either modal is open, not just for the REFERRAL lead source case.
  const { data: referralUsers = [] } = useQuery({
    queryKey: ["users", "referral-picker"],
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as any[]) : [];
    },
    enabled: showAddOpp,
    staleTime: Infinity,
  });

  // Approver picker option set: the selected owner's own immediate manager (via
  // manager_id) plus every active General Manager, not a free user picker --
  // mirrors the backend's own approver eligibility check
  // (OpportunityService._validate_gate_override) so the picker never offers a
  // choice the request would then reject.
  function gateOverrideApproverOptionsFor(ownerId: string): any[] {
    const owner = referralUsers.find((u: any) => u.id === ownerId);
    const manager = owner?.manager_id ? referralUsers.find((u: any) => u.id === owner.manager_id) : undefined;
    const byId = new Map<string, any>();
    if (manager) byId.set(manager.id, manager);
    for (const u of referralUsers as any[]) {
      if (u.role_name === GATE_OVERRIDE_ESCALATION_ROLE) byId.set(u.id, u);
    }
    return Array.from(byId.values());
  }
  const addOppGateOverrideApproverOptions = gateOverrideApproverOptionsFor(addOppOwnerId);

  // BR-OP-14: gate override applies on creation too, e.g. a referral going
  // straight to Negotiation with no prior demo.
  const { data: gateOverrideReasons = [] } = useQuery({
    queryKey: ["gateOverrideReasons"],
    queryFn: () => listGateOverrideReasons() as Promise<any[]>,
    enabled: showAddOpp,
    staleTime: Infinity,
  });
  const { data: oppUsers = [] } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => listUsers() as Promise<any[]>,
    enabled: showAddOpp,
    staleTime: Infinity,
  });
  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<any[]>,
    enabled: showAddOpp && isSbuOverrideRole,
    staleTime: Infinity,
  });

  // While creating an Opportunity, an Admin/GM's chosen SBU override (if any)
  // determines which products are eligible (BR-OP-11 validates items against
  // the opportunity's actual SBU, not the caller's own) -- everywhere else
  // it's just the caller's own SBU. Keying the query on this value replaces
  // the pre-migration manual refetch effect entirely: React Query refetches
  // on its own whenever the resolved SBU changes. Editing an existing
  // Opportunity happens on its own detail page (hotfix 2026-10-01).
  const productsSbuId = showAddOpp && isSbuOverrideRole && addOppSbuId
    ? addOppSbuId
    : userProfile?.sbu?.id;
  const { data: oppProducts = [] } = useQuery({
    queryKey: ["products", "picker", productsSbuId],
    queryFn: async () => {
      const d: any = await listProducts({ page_size: 100, sbu_id: productsSbuId } as any);
      return (d.items ?? []) as ProductOption[];
    },
    enabled: showAddOpp,
  });

  useEffect(() => {
    // Derives the Add Opportunity Value field from its item list; React 18
    // batches this into one re-render, not worth restructuring for.
    if (addOppItems.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddOppValue(itemsTotal(addOppItems).toFixed(2));
    } else {
      setAddOppValue("");
    }
  }, [addOppItems]);

  function openAddOpp() {
    setAddOppName(p.name);
    setAddOppStageId("");
    setAddOppOwnerId("");
    setAddOppWinProb("");
    setAddOppValue("");
    setAddOppItems([]);
    setAddOppLeadSourceId("");
    setAddOppDemoStart("");
    setAddOppDemoEnd("");
    setAddOppClosureDate("");
    setAddOppPoNumber("");
    setAddOppSbuId("");
    setAddOppIsExternalReferrer(false);
    setAddOppReferredByUserId("");
    setAddOppReferredByNote("");
    setAddOppGateOverrideChecked(false);
    setAddOppGateOverrideApproverId("");
    setAddOppGateOverrideReasonId("");
    setAddOppGateOverrideNote("");
    setShowAddOpp(true);
  }

  async function handleCreateOpp() {
    if (!addOppName.trim()) throw new Error("Opportunity name is required");
    // BR-OP-12: Admin/GM have no meaningful "own" SBU -- must always explicitly choose.
    if (isSbuOverrideRole && !addOppSbuId) throw new Error("SBU is required");
    if (!addOppStageId) throw new Error("Stage is required");
    if (!activeStatusId) throw new Error("Unable to determine Active status -- please retry");
    if (!addOppOwnerId) throw new Error("Owner is required");
    if (addOppWinProb === "") throw new Error("Win probability is required");
    // BR-OP-14: mirrors the schema-level model_validator's rule client-side so
    // the failure surfaces before the round-trip, not just as a 422.
    if (addOppGateOverrideChecked && addOppGateOverrideApproverId && !addOppGateOverrideReasonId) {
      throw new Error("Gate override reason is required whenever an approver is set");
    }
    const payload: any = {
      name: addOppName.trim(),
      stage_id: addOppStageId,
      status_id: activeStatusId,
      owner_id: addOppOwnerId,
      win_probability: Number(addOppWinProb),
      project_id: p.id,
    };
    if (isSbuOverrideRole && addOppSbuId) payload.sbu_id = addOppSbuId;
    if (addOppValue !== "") payload.indicative_value = Number(addOppValue);
    if (addOppLeadSourceId) payload.lead_source_id = addOppLeadSourceId;
    if (addOppDemoStart && !addOppGateOverrideChecked) payload.demo_start_date = addOppDemoStart;
    if (addOppDemoEnd && !addOppGateOverrideChecked) payload.demo_end_date = addOppDemoEnd;
    if (addOppClosureDate && !(addOppGateOverrideChecked && addOppStageOrder >= STAGE_ORDER_ORDER)) payload.expected_closure_date = addOppClosureDate;
    if (addOppPoNumber.trim()) payload.po_number = addOppPoNumber.trim();
    if (addOppLeadSourceCode === "REFERRAL") {
      if (addOppIsExternalReferrer) {
        if (addOppReferredByNote.trim()) payload.referred_by_note = addOppReferredByNote.trim();
      } else if (addOppReferredByUserId) {
        payload.referred_by_user_id = addOppReferredByUserId;
      }
    }
    if (addOppGateOverrideChecked && addOppGateOverrideApproverId) {
      payload.gate_override_approver_id = addOppGateOverrideApproverId;
      payload.gate_override_reason_id = addOppGateOverrideReasonId || null;
      if (addOppGateOverrideNote.trim()) payload.gate_override_note = addOppGateOverrideNote.trim();
    }
    if (addOppItems.length > 0)
      payload.items = addOppItems.map((i) => ({
        product_id: i.product_id,
        description: i.description,
        quantity: i.quantity,
        unit_price_lakhs: i.unit_price_lakhs,
        discount_lakhs: i.discount_lakhs,
        line_type: i.line_type,
      }));
    await createOpportunity(p.account.id as any, payload);
    queryClient.invalidateQueries({ queryKey: ["opportunities", "byAccount", p.account.id] });
    queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    setShowAddOpp(false);
  }

  const fields = [
    { label: "Account", value: p.account?.name },
    { label: "Status", value: p.status?.status_name },
    { label: "Owner", value: p.owner?.display_name },
    { label: "Bid Submission Date", value: p.bid_submission_date || "—" },
  ];

  return (
    <>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
        {/* Fixed header */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <IconButton onClick={onBack} aria-label="Back" sx={{ width: 40, height: 40, color: "#4b5563", flexShrink: 0, "&:hover": { bgcolor: "#e5e7eb" } }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", letterSpacing: "-0.025em", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </Typography>
            </Box>
            <Button
              onClick={onEdit}
              sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" }, flexShrink: 0 }}
            >
              Edit
            </Button>
          </Box>
        </Box>
        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", mb: 2 }}>
              Project Details
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {fields.map((f) => (
                <Box key={f.label}>
                  <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>{f.label}</Box>
                  <Box sx={{ fontWeight: 700, color: "#1f2937" }}>{f.value || "—"}</Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Opportunities */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography component="h4" sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Opportunities
              </Typography>
              <Button
                onClick={openAddOpp}
                sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
              >
                + Add
              </Button>
            </Box>
            {oppsLoading ? (
              <Typography sx={{ textAlign: "center", py: 2, color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading...</Typography>
            ) : opps.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 2, color: "#9ca3af", fontStyle: "italic", fontSize: "0.875rem" }}>No opportunities linked to this project.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {opps.map((opp: any) => (
                  <Box
                    key={opp.id}
                    onClick={() => onSelectOpportunity?.({ id: opp.id, name: opp.name })}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                      p: 1.5, bgcolor: "#f9fafb", borderRadius: "0.75rem",
                      cursor: onSelectOpportunity ? "pointer" : "default",
                      "&:hover": onSelectOpportunity ? { bgcolor: "#f3f4f6" } : undefined,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {opp.name}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #a7f3d0", bgcolor: "#ecfdf5", color: "#047857" }}>
                          {opp.stage?.stage_name}
                        </Box>
                        <Box component="span" sx={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af" }}>{opp.win_probability}% win</Box>
                        {opp.indicative_value != null && (
                          <Box component="span" sx={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af" }}>₹{opp.indicative_value}L</Box>
                        )}
                      </Box>
                    </Box>
                    {onSelectOpportunity && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); onSelectOpportunity({ id: opp.id, name: opp.name }); }}
                        sx={{ px: 1.5, py: 0.75, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" }, flexShrink: 0 }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Activity */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 2.5 }}>
            <ActivityTimeline projectId={p.id} onLogActivity={() => openLogActivityRef?.current?.()} />
          </Box>
        </Box>
      </Box>

      {/* Add Opportunity Modal */}
      <FormModal isOpen={showAddOpp} onClose={() => setShowAddOpp(false)} title="Add Opportunity" onSubmit={handleCreateOpp}>
        <Box sx={{ px: 1.5, py: 1, bgcolor: "#eff6ff", borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "primary.main", mb: 0.5 }}>
          {p.account?.name} — {p.name}
        </Box>
        <TextField label="Name *" value={addOppName} onChange={(e) => setAddOppName(e.target.value)} autoFocus fullWidth size="small" />
        {isSbuOverrideRole && (
          <TextField
            select
            label="SBU *"
            value={addOppSbuId}
            onChange={(e) => setAddOppSbuId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select SBU</MenuItem>
            {sbus.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
        )}
        <TextField
          select
          label="Stage *"
          value={addOppStageId}
          onChange={(e) => {
            const s: any = oppStages.find((x: any) => x.id === e.target.value);
            setAddOppStageId(e.target.value);
            if (s) setAddOppWinProb(String(s.default_win_probability));
          }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select stage</MenuItem>
          {oppStages.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Lead Source"
          value={addOppLeadSourceId}
          onChange={(e) => setAddOppLeadSourceId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls: any) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        {addOppLeadSourceCode === "REFERRAL" && (
          <Box>
            <FormControlLabel
              control={<Checkbox color="primary" checked={addOppIsExternalReferrer} onChange={(e) => { setAddOppIsExternalReferrer(e.target.checked); setAddOppReferredByUserId(""); setAddOppReferredByNote(""); }} />}
              label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>External referrer (not Cabio staff)</Typography>}
            />
            {addOppIsExternalReferrer ? (
              <TextField label="Referred By" value={addOppReferredByNote} onChange={(e) => setAddOppReferredByNote(e.target.value)} placeholder="e.g. Dr. Menon, referring physician" fullWidth size="small" />
            ) : (
              <TextField select label="Referred By" value={addOppReferredByUserId} onChange={(e) => setAddOppReferredByUserId(e.target.value)} fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
                <MenuItem value="">Select colleague</MenuItem>
                {referralUsers.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
              </TextField>
            )}
          </Box>
        )}
        <TextField
          select
          label="Owner *"
          value={addOppOwnerId}
          onChange={(e) => setAddOppOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {oppUsers.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField
          label="Win Probability % *"
          type="number"
          value={addOppWinProb}
          onChange={(e) => setAddOppWinProb(e.target.value)}
          placeholder="0 – 100"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, max: 100 } }}
        />
        {(addOppStageOrder >= STAGE_ORDER_QUALIFIED || addOppItems.length > 0) && (
          <TextField
            label={`Indicative Value (Lakhs)${addOppItems.length > 0 ? " (auto)" : ""}`}
            type="number"
            value={addOppValue}
            onChange={(e) => setAddOppValue(e.target.value)}
            disabled={addOppItems.length > 0}
            placeholder="e.g. 25.50"
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
        )}
        <FormControlLabel
          control={<Checkbox color="primary" checked={addOppGateOverrideChecked} onChange={(e) => setAddOppGateOverrideChecked(e.target.checked)} />}
          label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151" }}>Fast-Track this Deal</Typography>}
        />
        {addOppStageOrder >= STAGE_ORDER_DEMO && addOppLeadSourceCode !== "REPEAT_ORDER" && !addOppGateOverrideChecked && (
          <>
            <TextField label="Demo Start Date" type="date" value={addOppDemoStart} onChange={(e) => setAddOppDemoStart(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo End Date" type="date" value={addOppDemoEnd} onChange={(e) => setAddOppDemoEnd(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
          </>
        )}
        {addOppStageOrder >= STAGE_ORDER_NEGOTIATION && addOppLeadSourceCode !== "REPEAT_ORDER" &&
          !(addOppGateOverrideChecked && addOppStageOrder >= STAGE_ORDER_ORDER) && (
          <TextField label="Expected Closure Date" type="date" value={addOppClosureDate} onChange={(e) => setAddOppClosureDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        {addOppGateOverrideChecked && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <TextField
              select
              label={addOppGateOverrideApproverId ? "Approved By *" : "Approved By"}
              value={addOppGateOverrideApproverId}
              onChange={(e) => setAddOppGateOverrideApproverId(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              helperText="The owner's immediate manager, or a General Manager"
            >
              <MenuItem value="">No override</MenuItem>
              {addOppGateOverrideApproverOptions.map((u: any) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.display_name}{u.role_name === GATE_OVERRIDE_ESCALATION_ROLE ? " (General Manager)" : " (Manager)"}
                </MenuItem>
              ))}
            </TextField>
            {addOppGateOverrideApproverId && (
              <>
                <TextField
                  select label="Reason *" value={addOppGateOverrideReasonId} onChange={(e) => setAddOppGateOverrideReasonId(e.target.value)}
                  fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">Select reason</MenuItem>
                  {gateOverrideReasons.map((r: any) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
                </TextField>
                <TextField
                  label="Note" value={addOppGateOverrideNote} onChange={(e) => setAddOppGateOverrideNote(e.target.value)}
                  placeholder="Optional" fullWidth size="small" multiline minRows={2}
                />
              </>
            )}
          </Box>
        )}
        {addOppStageOrder >= STAGE_ORDER_ORDER && (
          <TextField label="PO Number" value={addOppPoNumber} onChange={(e) => setAddOppPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
        )}
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Products</Box>
            <Button
              onClick={() => setShowAddOppItemsModal(true)}
              sx={{ px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5", "&:hover": { bgcolor: "#d1fae5" } }}
            >
              {addOppItems.length > 0 ? `Edit (${addOppItems.length})` : "+ Add Products"}
            </Button>
          </Box>
          <OpportunityItemsList items={addOppItems} variant="summary" />
        </Box>
      </FormModal>

      {/* Add Opportunity — Products secondary modal */}
      <FormModal isOpen={showAddOppItemsModal} onClose={() => setShowAddOppItemsModal(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        <OpportunityItemsList
          items={addOppItems}
          variant="editable"
          emptyMessage="No products added"
          onRemove={(i) => setAddOppItems(addOppItems.filter((_, j) => j !== i))}
          onUpdateField={(i, field, value) => setAddOppItems(addOppItems.map((it, j) => (j === i ? { ...it, [field]: value } : it)))}
        />
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem" }}>
          <OpportunityItemAddRow products={oppProducts} onAdd={(item) => setAddOppItems([...addOppItems, item])} />
        </Box>
      </FormModal>
    </>
  );
}

interface ProjectDirectoryScreenProps {
  onDetailModeChange?: (detail: boolean) => void;
  openCreateRef?: RefObject<(() => void) | null>;
  refreshOppsRef?: RefObject<(() => void) | null>;
  onSelectProject?: (project: ProjectRef | null) => void;
  openLogActivityRef?: RefObject<(() => void) | null>;
  resetDetailRef?: RefObject<(() => void) | null>;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
  openProjectRef?: RefObject<((p: { id: string; name: string }) => void) | null>;
  onDetailBack?: () => void;
}

export default function ProjectDirectoryScreen({
  onDetailModeChange,
  openCreateRef,
  refreshOppsRef,
  onSelectProject,
  openLogActivityRef,
  resetDetailRef,
  onSelectOpportunity,
  openProjectRef,
  onDetailBack,
}: ProjectDirectoryScreenProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Create form
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectAccountId, setNewProjectAccountId] = useState("");
  const [newProjectAccount, setNewProjectAccount] = useState<{ id: string; name: string } | null>(null);
  const [newProjectAccountSearch, setNewProjectAccountSearch] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatusId, setNewProjectStatusId] = useState("");
  const [newProjectOwnerId, setNewProjectOwnerId] = useState("");
  const [newProjectBidDate, setNewProjectBidDate] = useState("");

  // Edit form
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatusId, setEditProjectStatusId] = useState("");
  const [editProjectOwnerId, setEditProjectOwnerId] = useState("");
  const [editProjectBidDate, setEditProjectBidDate] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const { data: listData, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects", "list", { search: debouncedSearch, page }],
    queryFn: () =>
      listAllProjects({ search: debouncedSearch || undefined, page, page_size: pageSize }) as Promise<{ items: any[]; total: number }>,
    placeholderData: keepPreviousData,
  });
  const projects = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const debouncedNewProjectAccountSearch = useDebouncedValue(newProjectAccountSearch);

  // Searches server-side instead of preloading every account -- a plain
  // page_size bump still silently truncates once accounts exceed the
  // backend's page_size cap (le=100, account/router.py), which is exactly
  // what happened in UAT once real hospital count passed 100 (2026-09-08).
  const { data: accounts = [], isFetching: accountsLoading } = useQuery({
    queryKey: ["accounts", "picker", debouncedNewProjectAccountSearch],
    queryFn: async () =>
      (await listAccounts({ search: debouncedNewProjectAccountSearch || undefined, page_size: 20 })).items ?? [],
    enabled: showCreateProject || editingProject !== null,
  });
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

  const openCreateProject = useCallback(() => {
    setNewProjectAccountId("");
    setNewProjectAccount(null);
    setNewProjectAccountSearch("");
    setNewProjectName("");
    setNewProjectStatusId("");
    setNewProjectOwnerId("");
    setNewProjectBidDate("");
    setShowCreateProject(true);
  }, []);
  useEffect(() => {
    if (openCreateRef) openCreateRef.current = openCreateProject;
  }, [openCreateRef, openCreateProject]);

  // Called by DemoApp.tsx's navigate() when leaving this screen via the sidebar —
  // this screen stays mounted (hidden via CSS) rather than unmounting like
  // Customer360Screen/OpportunityDetailScreen, so its own detail-mode state
  // doesn't reset for free and needs this explicit nudge from the parent.
  useEffect(() => {
    if (resetDetailRef) {
      resetDetailRef.current = () => {
        setSelectedProject(null);
        onSelectProject?.(null);
      };
    }
  }, [resetDetailRef, onSelectProject]);

  // Called by DemoApp.tsx to jump straight to a specific project's detail
  // view from outside this screen (e.g. clicking a project card on Customer
  // 360) — mirrors what clicking a project row already does internally.
  // DemoApp.tsx's ref type only guarantees {id, name}, but every real caller
  // (Customer360Screen.tsx's Projects tab) actually passes the full project
  // record ProjectDetailView needs (.account, .status, .owner, ...) — same
  // cross-file looseness the 2026-08-01 archive entry already documents and
  // fixed once before; not new here.
  useEffect(() => {
    if (openProjectRef) {
      openProjectRef.current = (p) => {
        setSelectedProject(p);
        onSelectProject?.(p as unknown as ProjectRef);
        onDetailModeChange?.(true);
      };
    }
  }, [openProjectRef, onSelectProject, onDetailModeChange]);

  const handleCreateProject = async () => {
    if (!newProjectAccountId) throw new Error("Account is required");
    if (!newProjectName.trim()) throw new Error("Project name is required");
    if (!newProjectStatusId) throw new Error("Status is required");
    if (!newProjectOwnerId) throw new Error("Owner is required");
    const payload: any = {
      name: newProjectName.trim(),
      owner_id: newProjectOwnerId,
      status_id: newProjectStatusId,
    };
    if (newProjectBidDate) payload.bid_submission_date = newProjectBidDate;
    await createProject(newProjectAccountId as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", newProjectAccountId] });
  };

  const openEditProject = (p: any) => {
    setEditingProject(p);
    setEditProjectName(p.name || "");
    setEditProjectStatusId(p.status?.id || "");
    setEditProjectOwnerId(p.owner?.id || "");
    setEditProjectBidDate(p.bid_submission_date || "");
  };

  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) throw new Error("Project name is required");
    const payload: any = {
      name: editProjectName.trim(),
      owner_id: editProjectOwnerId || undefined,
      status_id: editProjectStatusId || undefined,
    };
    if (editProjectBidDate) payload.bid_submission_date = editProjectBidDate;
    await updateProject(editingProject.id as any, payload);
    queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    queryClient.invalidateQueries({ queryKey: ["projects", "byAccount", editingProject.account?.id] });
    // Stay on this project's detail view with the edit reflected, instead of
    // bouncing back to the list (a pre-existing gap in the original file --
    // selectedProject was a static local snapshot with no way to refresh in
    // place, so returning to the list was the only way to see the update).
    // The PATCH response is the flat ProjectResponse shape (IDs only), not
    // the nested account/status/owner shape this view renders, so the
    // chosen status/owner are looked up from the already-loaded picker
    // lists instead of a second round trip.
    const updated = {
      ...editingProject,
      name: editProjectName.trim(),
      status: projectStatuses.find((s: any) => s.id === editProjectStatusId) ?? editingProject.status,
      owner: users.find((u: any) => u.id === editProjectOwnerId) ?? editingProject.owner,
      bid_submission_date: editProjectBidDate || null,
    };
    setSelectedProject(updated);
    onSelectProject?.(updated);
  };

  if (selectedProject) {
    return (
      <>
        <ProjectDetailView
          project={selectedProject}
          onBack={() => {
            setSelectedProject(null);
            onSelectProject?.(null);
            onDetailModeChange?.(false);
            onDetailBack?.();
          }}
          onEdit={() => openEditProject(selectedProject)}
          refreshOppsRef={refreshOppsRef}
          openLogActivityRef={openLogActivityRef}
          onSelectOpportunity={onSelectOpportunity}
        />
        <FormModal isOpen={editingProject !== null} onClose={() => setEditingProject(null)} title="Edit Project" onSubmit={handleUpdateProject}>
          {editingProject && (
            <Box sx={{ px: 1.5, py: 1, bgcolor: "#eff6ff", borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "primary.main", mb: 0.5 }}>
              {editingProject.account?.name}
            </Box>
          )}
          <TextField label="Name *" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} autoFocus fullWidth size="small" />
          <TextField
            select
            label="Status"
            value={editProjectStatusId}
            onChange={(e) => setEditProjectStatusId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Owner"
            value={editProjectOwnerId}
            onChange={(e) => setEditProjectOwnerId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select owner</MenuItem>
            {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
          </TextField>
          <TextField label="Bid Submission Date" type="date" value={editProjectBidDate} onChange={(e) => setEditProjectBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
        </FormModal>
      </>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
      {/* Fixed header */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, bgcolor: "#fff", p: 2, borderRadius: "1rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6" }}>
          <TextField
            placeholder="Search by project or hospital..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            fullWidth
            autoComplete="off"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Failed to load projects
          </Alert>
        )}

        {isLoading && (
          <Typography sx={{ textAlign: "center", py: 6, color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading projects...</Typography>
        )}

        {!isLoading && !isError && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {projects.map((p: any) => (
                <Box
                  key={p.id}
                  onClick={() => { setSelectedProject(p); onSelectProject?.(p); onDetailModeChange?.(true); }}
                  sx={{
                    bgcolor: "#fff", py: 1.5, px: 2, borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6",
                    cursor: "pointer", transition: "all 0.15s",
                    "&:hover": { borderColor: "#60a5fa", boxShadow: "0 4px 6px rgba(0,0,0,0.07)" },
                    "&:hover [data-part='project-avatar']": { bgcolor: "#d97706", color: "#fff" },
                    "&:hover [data-part='project-name']": { color: "#1e3a8a" },
                    "&:hover [data-part='project-chevron']": { color: "primary.main" },
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Box
                      data-part="project-avatar"
                      sx={{
                        width: 36, height: 36, bgcolor: "#fffbeb", color: "#d97706", borderRadius: "0.75rem",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem",
                        boxShadow: SHADOW_SM, flexShrink: 0, alignSelf: "center", transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography data-part="project-name" sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                        {p.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mt: 0.25 }}>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.account.name}</Typography>
                        <Box sx={{ bgcolor: "#f9fafb", p: 1, borderRadius: "0.75rem", flexShrink: 0, transition: "background-color 0.15s" }}>
                          <ChevronRightIcon data-part="project-chevron" sx={{ fontSize: 18, color: "#9ca3af", transition: "color 0.15s" }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: 0.5, mt: 0.75 }}>
                        <Box component="span" sx={{ px: 1.25, py: 0.5, borderRadius: "0.5rem", fontSize: "10px", fontWeight: 900, border: "1px solid #99f6e4", bgcolor: "#f0fdfa", color: "#0f766e" }}>
                          {p.status.status_name}
                        </Box>
                        <Box>
                          <Box component="span" sx={{ fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>Owner: </Box>
                          <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{p.owner.display_name}</Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {projects.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6" }}>
                <Typography sx={{ fontStyle: "italic", color: "#9ca3af" }}>
                  {search ? `No projects or hospitals matching "${search}".` : "No projects found."}
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 3 }}>
                <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Page {page} of {totalPages} ({total} total)
                </Typography>
                <Button size="small" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Create Project Modal */}
      <FormModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="New Project" onSubmit={handleCreateProject} submitLabel="Create">
        <Autocomplete
          options={accounts}
          getOptionLabel={(a: any) => a.name}
          isOptionEqualToValue={(a: any, v: any) => a.id === v.id}
          value={newProjectAccount}
          loading={accountsLoading}
          onChange={(_e, newValue: any) => { setNewProjectAccount(newValue); setNewProjectAccountId(newValue?.id ?? ""); }}
          onInputChange={(_e, newInputValue) => setNewProjectAccountSearch(newInputValue)}
          renderInput={(params) => <TextField {...params} label="Account *" size="small" sx={{ mt: 1.5 }} />}
          fullWidth
          size="small"
        />
        <TextField label="Name *" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Enter project name" autoFocus fullWidth size="small" />
        <TextField
          select
          label="Status *"
          value={newProjectStatusId}
          onChange={(e) => setNewProjectStatusId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select status</MenuItem>
          {projectStatuses.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Owner *"
          value={newProjectOwnerId}
          onChange={(e) => setNewProjectOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField label="Bid Submission Date" type="date" value={newProjectBidDate} onChange={(e) => setNewProjectBidDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
      </FormModal>
    </Box>
  );
}
