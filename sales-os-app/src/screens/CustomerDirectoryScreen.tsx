import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listAccounts, getAccountCounts } from "../services/accounts";
import AddHospitalModal from "../components/AddHospitalModal";
import ZonePicker from "../components/ZonePicker";
import useDebouncedValue from "../hooks/useDebouncedValue";
import type { ZoneSearchResult } from "../services/masterData";

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
  // Minimal shape (id + name) -- matches the convention already used by every
  // other caller of onSelectAccount in the app (ReminderRow, DailyActivityReportScreen,
  // NextActionsScreen, Customer360Screen's own parent/child links); Customer360Screen
  // fetches the full record itself from accountId, so nothing more is needed here.
  onSelectAccount: (account: { id: string; name: string }) => void;
  openCreateRef?: React.RefObject<(() => void) | null>;
}

export default function CustomerDirectoryScreen({ onSelectAccount, openCreateRef }: Props) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneSearchResult | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [showCreateModal, setShowCreateModal] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

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

  const openCreateModal = () => setShowCreateModal(true);
  useEffect(() => {
    if (openCreateRef) openCreateRef.current = openCreateModal;
  });

  const closeCreateModal = () => setShowCreateModal(false);

  // Restored from the pre-migration version (property-diff, 2026-08-11):
  // resets the list view to a known position after the create modal closes,
  // rather than leaving the user stranded wherever they'd scrolled to.
  // AddHospitalModal.tsx already invalidates the ["accounts"] query prefix
  // on a successful create -- this is purely the scroll-position side
  // effect, which is specific to this screen's own list.
  const handleAccountCreated = () => {
    closeCreateModal();
    listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Original behavior, preserved exactly: picking an *existing* duplicate
  // match navigates straight to it (unlike a fresh create, which just
  // closes and refreshes the list in place -- see handleAccountCreated).
  const handleExistingSelected = (account: { id: string; name: string }) => {
    closeCreateModal();
    onSelectAccount(account);
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

      <AddHospitalModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onCreated={handleAccountCreated}
        onExistingSelected={handleExistingSelected}
      />
    </Box>
  );
}
