import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import FormModal from "./FormModal";
import OpportunityItemAddRow from "./OpportunityItemAddRow";
import OpportunityItemsList from "./OpportunityItemsList";
import { listAccounts, listProjects, createOpportunity } from "../services/accounts";
import { listProducts } from "../services/products";
import { listStages, listStatuses, listUsers, listLeadSources, listSbus } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import type { DraftOpportunityItem, ProductOption } from "../types/opportunityItems";
import { itemsTotal } from "../utils/opportunityItems";

interface QuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  sbuId?: string;
  // Pre-fill Account/Project from wherever the user clicked "+ Lead" from
  // (Customer 360, Opportunity Detail, or a Project's own detail view) --
  // still fully editable, just saves re-picking the obvious choice. Same
  // context-inference DemoApp.tsx already does for LogActivityModal.
  initialAccountId?: string;
  initialProjectId?: string;
}

// Local stopgap types — these services return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface AccountOption { id: string; name: string }
interface ProjectOption { id: string; name: string }
interface StageOption { id: string; stage_name: string; stage_code: string; display_order: number; default_win_probability: number }
interface StatusOption { id: string; status_name: string; status_code: string }
interface UserOption { id: string; display_name: string }
interface LeadSourceOption { id: string; name: string }
interface SbuOption { id: string; name: string }

export default function QuickLeadModal({ isOpen, onClose, onCreated, sbuId, initialAccountId, initialProjectId }: QuickLeadModalProps) {
  const { userProfile } = useAuth();
  // BR-OP-12: Admin/General Manager only — everyone else creates in their own SBU
  // (the sbuId prop) and never sees the override field.
  const isSbuOverrideRole = ["Admin", "General Manager"].includes((userProfile as any)?.role_name);

  const [accountId, setAccountId]       = useState("");
  const [projectId, setProjectId]       = useState("");
  const [name, setName]                 = useState("");
  const [sbuOverrideId, setSbuOverrideId] = useState("");
  const [stageId, setStageId]           = useState("");
  const [statusId, setStatusId]         = useState("");
  const [ownerId, setOwnerId]           = useState("");
  const [winProb, setWinProb]           = useState("");
  const [value, setValue]               = useState("");
  const [leadSourceId, setLeadSourceId] = useState("");
  const [demoStart, setDemoStart]       = useState("");
  const [demoEnd, setDemoEnd]           = useState("");
  const [closureDate, setClosureDate]   = useState("");
  const [poNumber, setPoNumber]         = useState("");

  const effectiveSbuId = (isSbuOverrideRole && sbuOverrideId) ? sbuOverrideId : sbuId;

  const [items, setItems]                   = useState<DraftOpportunityItem[]>([]);
  const [showItemsModal, setShowItemsModal] = useState(false);

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

  const { data: projects = [], isFetching: projectsLoading } = useQuery({
    queryKey: ["projects", "byAccount", accountId],
    enabled: isOpen && !!accountId,
    queryFn: async () => {
      const d = await listProjects(accountId as any);
      return Array.isArray(d) ? (d as ProjectOption[]) : [];
    },
  });

  useEffect(() => {
    if (items.length > 0) {
      setValue(itemsTotal(items).toFixed(2));
    } else {
      setValue("");
    }
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    setAccountId(initialAccountId || ""); setProjectId(initialProjectId || "");
    setName(""); setSbuOverrideId(""); setStageId(""); setStatusId(""); setOwnerId("");
    setWinProb(""); setValue(""); setItems([]);
    setLeadSourceId("");
    setDemoStart(""); setDemoEnd(""); setClosureDate(""); setPoNumber("");
  }, [isOpen, initialAccountId, initialProjectId]);

  async function handleSubmit() {
    if (!name.trim()) throw new Error("Opportunity name is required");
    // BR-OP-12: Admin/GM have no meaningful "own" SBU -- must always explicitly choose.
    if (isSbuOverrideRole && !sbuOverrideId) throw new Error("SBU is required");
    if (!accountId) throw new Error("Account is required");
    if (!stageId) throw new Error("Stage is required");
    if (!statusId) throw new Error("Status is required");
    if (!ownerId) throw new Error("Owner is required");
    if (winProb === "") throw new Error("Win probability is required");
    const _stage = stages.find((s) => s.id === stageId);
    const _qualified = stages.find((s) => s.stage_code === "QUALIFIED");
    if (_stage && _qualified && _stage.display_order >= _qualified.display_order && value === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload: Record<string, unknown> = {
      name: name.trim(),
      stage_id: stageId,
      status_id: statusId,
      owner_id: ownerId,
      win_probability: Number(winProb),
    };
    if (isSbuOverrideRole && sbuOverrideId) payload.sbu_id = sbuOverrideId;
    if (value !== "") payload.indicative_value = Number(value);
    if (projectId) payload.project_id = projectId;
    if (leadSourceId) payload.lead_source_id = leadSourceId;
    if (demoStart) payload.demo_start_date = demoStart;
    if (demoEnd) payload.demo_end_date = demoEnd;
    if (closureDate) payload.expected_closure_date = closureDate;
    if (poNumber.trim()) payload.po_number = poNumber.trim();
    if (items.length > 0) payload.items = items.map((i) => ({
      product_id: i.product_id,
      description: i.description,
      quantity: i.quantity,
      unit_price_lakhs: i.unit_price_lakhs,
      discount_lakhs: i.discount_lakhs,
      line_type: i.line_type,
    }));
    await createOpportunity(accountId as any, payload);
    onCreated?.();
  }

  // LeadSource has no separate code column -- `name` already holds the pseudo-code
  // (REFERRAL, TENDER, REPEAT_ORDER, ...), same value the picker renders as the label.
  const leadSourceCode = leadSources.find((ls) => ls.id === leadSourceId)?.name;

  return (
    <>
      <FormModal isOpen={isOpen} onClose={onClose} title="New Opportunity" onSubmit={handleSubmit} submitLabel="Create" disableEnforceFocus={showItemsModal}>
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
        <Box sx={{ display: "flex", gap: "0.75rem" }}>
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
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {stages.map((s) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Status *"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {/* BR-OP-10: creation must default to Active only -- Won/Lost/On-Hold/Stalled are post-create transitions, not initial choices. */}
            {statuses.filter((s) => s.status_code === "ACTIVE").map((s) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </Box>
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
        {leadSourceCode !== "REPEAT_ORDER" && (
          <>
            <TextField label="Expected Closure Date" type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo Start Date" type="date" value={demoStart} onChange={(e) => setDemoStart(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo End Date" type="date" value={demoEnd} onChange={(e) => setDemoEnd(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
          </>
        )}
        <TextField label="PO Number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
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
    </>
  );
}
