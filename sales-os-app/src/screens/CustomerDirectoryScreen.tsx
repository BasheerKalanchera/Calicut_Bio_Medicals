import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listAccounts, createAccount, getAccountCounts } from "../services/accounts";
import FormModal from "../components/FormModal";
import ZonePicker from "../components/ZonePicker";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { useAuth } from "../contexts/AuthContext";
import type { AccountListResponse } from "../types/api-aliases";
import type { ZoneSearchResult } from "../services/masterData";

interface AccountOption { id: string; name: string }

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

// "MULTISPECIALITY_HOSPITAL" -> "Multispeciality Hospital"
function formatEnumLabel(value?: string | null): string {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function payerBehaviorChipSx(value: string) {
  if (value === "GOOD") return { bgcolor: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" };
  if (value === "PROBLEMATIC") return { bgcolor: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" };
  return { bgcolor: "#f9fafb", color: "#4b5563", borderColor: "#e5e7eb" };
}

interface Props {
  onSelectAccount: (account: AccountListResponse) => void;
  openCreateRef?: React.RefObject<(() => void) | null>;
}

export default function CustomerDirectoryScreen({ onSelectAccount, openCreateRef }: Props) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneSearchResult | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formZone, setFormZone] = useState<ZoneSearchResult | null>(null);
  const [formPayerBehavior, setFormPayerBehavior] = useState("");
  const [formCustomerType, setFormCustomerType] = useState("");
  const [formParentAccount, setFormParentAccount] = useState<AccountOption | null>(null);
  const [parentSearchInput, setParentSearchInput] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const debouncedParentSearch = useDebouncedValue(parentSearchInput);

  const { data: parentOptions = [], isFetching: parentOptionsLoading } = useQuery({
    queryKey: ["accounts", "parent-search", debouncedParentSearch],
    enabled: showCreateModal && !formParentAccount && debouncedParentSearch.trim().length > 0,
    queryFn: async () => {
      const d = await listAccounts({ search: debouncedParentSearch, page_size: 8 });
      return d.items as AccountOption[];
    },
  });

  const { data: listData, isLoading, isError, refetch } = useQuery({
    queryKey: ["accounts", "list", { search: debouncedSearch, zoneId: zoneFilter?.id, page }],
    queryFn: () =>
      listAccounts({
        search: debouncedSearch || undefined,
        zone_id: zoneFilter?.id || undefined,
        page,
        page_size: pageSize,
      }),
  });
  const accounts = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const ids = accounts.map((a) => a.id);
  const { data: counts } = useQuery({
    queryKey: ["accounts", "counts", ids],
    queryFn: () => getAccountCounts(ids),
    enabled: ids.length > 0,
  });
  const rows = accounts.map((a) => ({ ...a, ...(counts?.[a.id] ?? {}) }));

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "list"] });
      // Customer 360's account query cache is keyed by ["account", id] (React
      // Query) — a brand-new child doesn't exist in it yet, but the parent's
      // entry does, and its child_accounts list is now stale (see
      // Customer360Screen.tsx's handleUpdateAccount for the matching fix).
      if (formParentAccount) {
        queryClient.invalidateQueries({ queryKey: ["account", formParentAccount.id] });
      }
      // Restored from the pre-migration version (property-diff, 2026-08-11):
      // resets the list view to a known position after the modal closes,
      // rather than leaving the user stranded wherever they'd scrolled to.
      listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const openCreateModal = useCallback(() => {
    setFormName("");
    // Pre-fill with the logged-in user's own zone (their day-to-day home
    // base, not the broader zone_ids coverage list) so sales staff aren't
    // re-searching their own zone on every new customer -- still editable.
    setFormZone(userProfile?.zone ? { ...userProfile.zone, path: "" } : null);
    setFormPayerBehavior("");
    setFormCustomerType("");
    setFormParentAccount(null);
    setParentSearchInput("");
    setShowCreateModal(true);
  }, [userProfile]);
  useEffect(() => {
    if (openCreateRef) openCreateRef.current = openCreateModal;
  }, [openCreateRef, openCreateModal]);

  const handleCreateAccount = async () => {
    if (!formName.trim()) throw new Error("Customer name is required");
    if (!formZone) throw new Error("Zone is required");
    const payload: Record<string, unknown> = { name: formName.trim(), zone_id: formZone.id };
    if (formPayerBehavior) payload.payer_behavior = formPayerBehavior;
    if (formCustomerType) payload.customer_type = formCustomerType;
    if (formParentAccount) payload.parent_account_id = formParentAccount.id;
    await createMutation.mutateAsync(payload);
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#f9fafb" }}>
      {/* Fixed: search + zone filter — does not scroll */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            mb: 3,
            bgcolor: "background.paper",
            p: 2,
            borderRadius: "1rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid #f3f4f6",
          }}
        >
          <TextField
            placeholder="Search customers..."
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
          <Box sx={{ minWidth: { sm: 220 }, flexShrink: 0 }}>
            <ZonePicker
              label="All Zones"
              value={zoneFilter}
              onChange={(zone) => { setZoneFilter(zone); setPage(1); }}
            />
          </Box>
        </Box>
      </Box>

      {/* Scrollable list content */}
      <Box ref={listContainerRef} sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Failed to load customers
          </Alert>
        )}

        {isLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
            Loading customers...
          </Typography>
        )}

        {!isLoading && !isError && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {rows.map((account) => (
                <Box
                  key={account.id}
                  onClick={() => onSelectAccount(account)}
                  sx={{
                    bgcolor: "background.paper",
                    p: 2.5,
                    borderRadius: "1rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    border: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: "#60a5fa", boxShadow: "0 4px 6px rgba(0,0,0,0.07)" },
                    "&:hover [data-part='account-name']": { color: "#1e3a8a" },
                    "&:hover [data-part='account-avatar']": { bgcolor: "#d97706", color: "#fff" },
                    "&:hover [data-part='account-chevron-box']": { bgcolor: "#eff6ff" },
                    "&:hover [data-part='account-chevron-icon']": { color: "primary.main" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      data-part="account-avatar"
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "#fffbeb",
                        color: "#d97706",
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "0.875rem",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        flexShrink: 0,
                        transition: "background-color 0.15s, color 0.15s",
                      }}
                    >
                      {account.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography
                        data-part="account-name"
                        sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#1f2937", transition: "color 0.15s" }}
                      >
                        {account.name}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                        {account.zone && (
                          <Chip
                            label={account.zone.name}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.6875rem", bgcolor: "#f0fdfa", color: "#0f766e", borderColor: "#99f6e4" }}
                          />
                        )}
                        {account.parent_account && (
                          <Chip
                            label={`Parent: ${account.parent_account.name}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.6875rem", bgcolor: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" }}
                          />
                        )}
                        {account.payer_behavior && (
                          <Chip
                            label={account.payer_behavior}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.6875rem", ...payerBehaviorChipSx(account.payer_behavior) }}
                          />
                        )}
                        {account.customer_type && (
                          <Chip
                            label={formatEnumLabel(account.customer_type)}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.6875rem", bgcolor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    data-part="account-chevron-box"
                    sx={{ bgcolor: "background.default", p: 1, borderRadius: "0.75rem", flexShrink: 0, ml: 1, transition: "background-color 0.15s" }}
                  >
                    <ChevronRightIcon data-part="account-chevron-icon" sx={{ fontSize: 18, color: "#9ca3af", transition: "color 0.15s" }} />
                  </Box>
                </Box>
              ))}
            </Box>

            {rows.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6, bgcolor: "background.paper", borderRadius: "1.5rem", border: "2px dashed", borderColor: "divider" }}>
                <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                  {search ? "No customers match your search." : "No customers found."}
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

      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Customer"
        onSubmit={handleCreateAccount}
        submitLabel="Create"
      >
        <TextField
          label="Name *"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
          fullWidth
          size="small"
          placeholder="Enter customer name"
        />
        <ZonePicker label="Zone *" value={formZone} onChange={setFormZone} />
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
    </Box>
  );
}
