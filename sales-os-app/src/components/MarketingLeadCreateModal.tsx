import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, MenuItem, TextField } from "@mui/material";
import FormModal from "./FormModal";
import { listAccounts } from "../services/accounts";
import { listProducts } from "../services/products";
import { listLeadSources, listSbus, listUsers } from "../services/masterData";
import { createMarketingLead } from "../services/marketingLeads";
import useDebouncedValue from "../hooks/useDebouncedValue";

interface MarketingLeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// Local stopgap types -- masterData.ts's listSbus/listLeadSources return
// Promise<unknown> today (same TODO as QuickLeadModal.tsx's own local
// option interfaces -- see that file's comment).
interface AccountOption { id: string; name: string }
interface SbuOption { id: string; name: string }
interface LeadSourceOption { id: string; name: string; is_marketing_source: boolean }
interface ProductOption { id: string; name: string }
interface UserOption { id: string; display_name: string; sbu_id: string | null; role_name: string }

// Excluded from the assigned-rep picker -- these roles don't carry sales
// pipeline work of their own. Not reusing organization/repository.py's
// scope=sbu (compares against the *caller's* own sbu_id, not an arbitrary
// target sbu_id a Marketing User picks per-lead) -- see docs/Lead-
// Management-Implementation-Plan.md's assignment-scope decision. scope=all
// plus this client-side filter avoids touching that shared, already-
// regression-prone endpoint (Frontend-Implementation-Standards.md 3.1's
// noted 2026-07-30 incident) for a picker only this one screen needs.
const NON_REP_ROLES = new Set(["Admin", "General Manager", "Marketing User"]);

export default function MarketingLeadCreateModal({ isOpen, onClose, onCreated }: MarketingLeadCreateModalProps) {
  const [accountId, setAccountId] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
  const [accountSearchInput, setAccountSearchInput] = useState("");
  const debouncedAccountSearch = useDebouncedValue(accountSearchInput);
  const [sbuId, setSbuId] = useState("");
  const [leadSourceId, setLeadSourceId] = useState("");
  const [eventName, setEventName] = useState("");
  const [note, setNote] = useState("");
  const [productId, setProductId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");

  // Searches server-side instead of preloading every account -- a plain
  // page_size bump still silently truncates once accounts exceed the
  // backend's page_size cap (le=100, account/router.py), which is exactly
  // what happened in UAT once real hospital count passed 100 (2026-09-08).
  const { data: accounts = [], isFetching: accountsLoading } = useQuery({
    queryKey: ["accounts", "picker", debouncedAccountSearch],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listAccounts({ search: debouncedAccountSearch || undefined, page_size: 20 });
      return d.items ?? [];
    },
  });

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    enabled: isOpen,
    queryFn: async () => (await listSbus()) as SbuOption[],
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    enabled: isOpen,
    queryFn: async () => (await listLeadSources()) as LeadSourceOption[],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", sbuId],
    enabled: isOpen && !!sbuId,
    queryFn: async () => {
      const d = await listProducts({ page_size: 100, sbu_id: sbuId as any });
      return (d as { items?: ProductOption[] }).items ?? [];
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "all"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  const repOptions = allUsers.filter((u) => u.sbu_id === sbuId && !NON_REP_ROLES.has(u.role_name));

  // Data-driven, not a hardcoded name match -- see reference/models.py's
  // LeadSource.is_marketing_source. Filtered here (not in the query itself)
  // so the shared ["leadSources"] cache entry stays the full, unrestricted
  // list QuickLeadModal.tsx also reads for normal Opportunity creation.
  const marketingLeadSources = leadSources.filter((ls) => ls.is_marketing_source);

  // LeadSource has no separate code column -- name is 'CONFERENCE' (all-caps,
  // 0028_add_sales_development_activities.py), same lookup shape
  // QuickLeadModal.tsx uses for leadSourceCode.
  const isConference = leadSources.find((ls) => ls.id === leadSourceId)?.name === "CONFERENCE";

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccountId(""); setSelectedAccount(null); setAccountSearchInput("");
    setSbuId(""); setLeadSourceId(""); setEventName("");
    setNote(""); setProductId(""); setAssignedToUserId("");
  }, [isOpen]);

  async function handleSubmit() {
    if (!sbuId) throw new Error("SBU is required");
    if (!leadSourceId) throw new Error("Lead source is required");
    if (!assignedToUserId) throw new Error("Assigned rep is required");

    await createMarketingLead({
      account_id: accountId || null,
      sbu_id: sbuId,
      lead_source_id: leadSourceId,
      event_name: isConference && eventName.trim() ? eventName.trim() : null,
      raw_interest_note: note.trim() || null,
      product_id: productId || null,
      assigned_to_user_id: assignedToUserId,
    });
    onCreated?.();
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="New Marketing Lead" onSubmit={handleSubmit} submitLabel="Create">
      <Autocomplete
        options={accounts}
        getOptionLabel={(a) => a.name}
        isOptionEqualToValue={(a, v) => a.id === v.id}
        value={selectedAccount}
        loading={accountsLoading}
        onChange={(_e, newValue) => { setSelectedAccount(newValue); setAccountId(newValue?.id ?? ""); }}
        onInputChange={(_e, newInputValue) => setAccountSearchInput(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Account"
            size="small"
            sx={{ mt: 1.5 }}
            helperText="Not in the list? Leave blank and describe the hospital in the note below -- the rep will sort it out."
          />
        )}
        fullWidth
        size="small"
      />
      <TextField
        select
        label="SBU *"
        value={sbuId}
        onChange={(e) => { setSbuId(e.target.value); setAssignedToUserId(""); setProductId(""); }}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select SBU</MenuItem>
        {sbus.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
      </TextField>
      <TextField
        select
        label="Lead Source *"
        value={leadSourceId}
        onChange={(e) => setLeadSourceId(e.target.value)}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Select source</MenuItem>
        {marketingLeadSources.map((ls) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
      </TextField>
      {isConference && (
        <TextField
          label="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="e.g. Cochin Trade Fair 2026"
          fullWidth
          size="small"
        />
      )}
      <TextField
        label="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What did they say they're interested in?"
        fullWidth
        size="small"
        multiline
        minRows={2}
      />
      <TextField
        select
        label="Product (if known)"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        disabled={!sbuId}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="">Not sure yet</MenuItem>
        {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
      </TextField>
      <TextField
        select
        label="Assign To *"
        value={assignedToUserId}
        onChange={(e) => setAssignedToUserId(e.target.value)}
        disabled={!sbuId}
        fullWidth
        size="small"
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        helperText={sbuId && repOptions.length === 0 ? "No reps found for this SBU" : undefined}
      >
        <MenuItem value="">Select rep</MenuItem>
        {repOptions.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
      </TextField>
    </FormModal>
  );
}
