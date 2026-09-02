import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import FormModal from "./FormModal";
import ZonePicker from "./ZonePicker";
import { createAccount, listAccounts } from "../services/accounts";
import { searchZonesForHospital } from "../services/masterData";
import type { ZoneSearchResult } from "../services/masterData";
import { ApiError } from "../lib/api";
import { SilentModalError } from "../lib/formErrors";
import { useAuth } from "../contexts/AuthContext";
import useDebouncedValue from "../hooks/useDebouncedValue";

// Mirrors AccountService's _ZONE_ASSIGNMENT_EXEMPT_ROLES (backend/app/domains/
// account/service.py) -- Admin/GM can add a hospital in any territory, so
// they're the only roles exempt from needing a zone on file first.
const ZONE_ASSIGNMENT_EXEMPT_ROLES = new Set(["Admin", "General Manager"]);

const CUSTOMER_TYPES = [
  { value: "MULTISPECIALITY_HOSPITAL", label: "Multispeciality Hospital" },
  { value: "SPECIALTY_HOSPITAL", label: "Specialty Hospital" },
  { value: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { value: "CLINIC", label: "Clinic" },
  { value: "DEALER", label: "Dealer" },
  { value: "MEDICAL_COLLEGE_HOSPITAL", label: "Medical College Hospital" },
  { value: "GOVERNMENT_HOSPITAL", label: "Government Hospital" },
  { value: "OTHER", label: "Other" },
] as const;

interface AccountOption { id: string; name: string }

interface AddHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Fires when a genuinely new account row was created (plain path or
  // "Create Anyway" after a duplicate warning). Separate from
  // onExistingSelected below -- CustomerDirectoryScreen.tsx's original
  // behavior only navigates on the *existing*-match pick, not on a fresh
  // create (it just closes and refreshes its list); QuickLeadModal.tsx
  // wants both paths treated the same (select the account either way).
  // Extracted 2026-09-02 from CustomerDirectoryScreen.tsx (BR-ACC-03) so
  // QuickLeadModal.tsx's "+ Add Hospital" shortcut can reuse the exact
  // same duplicate-checked create flow instead of a second copy of it.
  onCreated?: (account: AccountOption) => void;
  // Fires when the rep picks "Use this one instead" from the duplicate-
  // warning list -- no new row created.
  onExistingSelected?: (account: AccountOption) => void;
}

export default function AddHospitalModal({ isOpen, onClose, onCreated, onExistingSelected }: AddHospitalModalProps) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [formName, setFormName] = useState("");
  const [formZone, setFormZone] = useState<ZoneSearchResult | null>(null);
  const [formPayerBehavior, setFormPayerBehavior] = useState("");
  const [formCustomerType, setFormCustomerType] = useState("");
  const [formParentAccount, setFormParentAccount] = useState<AccountOption | null>(null);
  const [parentSearchInput, setParentSearchInput] = useState("");
  // Option B duplicate-hospital warning (docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md,
  // BR-ACC-03): set when the backend's near-duplicate check (POSSIBLE_DUPLICATE) rejects the
  // in-flight create -- duplicateCandidates are every existing match it found (there can be
  // more than one), pendingCreatePayload is what to resubmit with force_create if the rep
  // confirms this is genuinely a different hospital.
  const [duplicateCandidates, setDuplicateCandidates] = useState<AccountOption[] | null>(null);
  const [pendingCreatePayload, setPendingCreatePayload] = useState<Record<string, unknown> | null>(null);

  const debouncedParentSearch = useDebouncedValue(parentSearchInput);

  const { data: parentOptions = [], isFetching: parentOptionsLoading } = useQuery({
    queryKey: ["accounts", "parent-search", debouncedParentSearch],
    enabled: isOpen && !formParentAccount && debouncedParentSearch.trim().length > 0,
    queryFn: async () => {
      const d = await listAccounts({ search: debouncedParentSearch, page_size: 8 });
      return d.items as AccountOption[];
    },
  });

  // Rep with no territory assigned can't add a hospital at all -- backend
  // enforces this too (AccountService.create_account), this is just the
  // friendlier front-door version so they see why before filling the form.
  const isZoneExempt = !!(userProfile?.role_name && ZONE_ASSIGNMENT_EXEMPT_ROLES.has(userProfile.role_name));
  const isBlocked = !isZoneExempt && !userProfile?.zone;

  useEffect(() => {
    if (!isOpen || isBlocked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormName("");
    // Pre-fill with the logged-in user's own zone (their day-to-day home
    // base, not the broader zone_ids coverage list) so sales staff aren't
    // re-searching their own zone on every new customer -- still editable.
    setFormZone(userProfile?.zone ? { ...userProfile.zone, path: "" } : null);
    setFormPayerBehavior(""); setFormCustomerType(""); setFormParentAccount(null);
    setParentSearchInput(""); setDuplicateCandidates(null); setPendingCreatePayload(null);
  }, [isOpen, isBlocked, userProfile]);

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      // Broad prefix invalidation (list/picker/counts/parent-search) --
      // this is a shared component with callers this codebase doesn't
      // fully know about yet, so invalidate everything under "accounts"
      // rather than one caller's specific query key.
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      if (formParentAccount) {
        queryClient.invalidateQueries({ queryKey: ["account", formParentAccount.id] });
      }
    },
  });

  const handleClose = () => {
    setDuplicateCandidates(null);
    setPendingCreatePayload(null);
    onClose();
  };

  const handleCreateAccount = async () => {
    if (!formName.trim()) throw new Error("Customer name is required");
    if (!formZone) throw new Error("Zone is required");
    const payload: Record<string, unknown> = { name: formName.trim(), zone_id: formZone.id };
    if (formPayerBehavior) payload.payer_behavior = formPayerBehavior;
    if (formCustomerType) payload.customer_type = formCustomerType;
    if (formParentAccount) payload.parent_account_id = formParentAccount.id;
    setDuplicateCandidates(null);
    try {
      const created = await createMutation.mutateAsync(payload);
      onCreated?.({ id: created.id, name: created.name });
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "POSSIBLE_DUPLICATE" && err.candidates?.length) {
        setDuplicateCandidates(err.candidates);
        setPendingCreatePayload(payload);
        throw new SilentModalError();
      }
      throw err;
    }
  };

  const handleCreateAnyway = async () => {
    if (!pendingCreatePayload) return;
    const created = await createMutation.mutateAsync({ ...pendingCreatePayload, force_create: true });
    handleClose();
    onCreated?.({ id: created.id, name: created.name });
  };

  const handleUseExisting = (account: AccountOption) => {
    handleClose();
    onExistingSelected?.(account);
  };

  return (
    <>
      <FormModal
        isOpen={isOpen && !isBlocked}
        onClose={handleClose}
        title="New Customer"
        onSubmit={handleCreateAccount}
        submitLabel="Create"
      >
        {duplicateCandidates && duplicateCandidates.length > 0 && (
          <>
            <Alert severity="warning" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {duplicateCandidates.length === 1
                  ? <>Did you mean <strong>{duplicateCandidates[0].name}</strong>? It's already in the directory.</>
                  : "This looks similar to hospitals already in the directory:"}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {duplicateCandidates.map((candidate) => (
                  <Box key={candidate.id} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    {duplicateCandidates.length > 1 && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
                    )}
                    <Button type="button" size="small" variant="outlined" onClick={() => handleUseExisting(candidate)}>
                      Use this one instead
                    </Button>
                  </Box>
                ))}
              </Box>
            </Alert>
            {/* Outside the Alert, not inside its message slot -- the warning
                icon indents the message area, which would otherwise shift
                this full-width button off from the rest of the form's fields. */}
            <Button type="button" size="medium" variant="contained" color="warning" fullWidth onClick={handleCreateAnyway}>
              Create Anyway
            </Button>
          </>
        )}
        <TextField
          label="Name *"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
          fullWidth
          size="small"
          placeholder="Enter customer name"
        />
        <ZonePicker label="Zone *" value={formZone} onChange={setFormZone} searchFn={searchZonesForHospital} />
        <Autocomplete
          options={parentOptions}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          value={formParentAccount}
          loading={parentOptionsLoading}
          onChange={(_e, newValue) => setFormParentAccount(newValue)}
          onInputChange={(_e, newInputValue) => setParentSearchInput(newInputValue)}
          renderInput={(params) => <TextField {...params} label="Parent Customer" size="small" />}
          fullWidth
        />
        <TextField
          select
          label="Payer Behavior"
          value={formPayerBehavior}
          onChange={(e) => setFormPayerBehavior(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select behavior</MenuItem>
          <MenuItem value="GOOD">Good</MenuItem>
          <MenuItem value="AVERAGE">Average</MenuItem>
          <MenuItem value="PROBLEMATIC">Problematic</MenuItem>
          <MenuItem value="UNKNOWN">Unknown</MenuItem>
        </TextField>
        <TextField
          select
          label="Customer Type"
          value={formCustomerType}
          onChange={(e) => setFormCustomerType(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select type</MenuItem>
          {CUSTOMER_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          ))}
        </TextField>
      </FormModal>

      <Dialog open={isOpen && isBlocked} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>No territory assigned yet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You don't have a territory assigned yet, so you can't add a new
            hospital. Ask your manager to get one set up for you first.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
