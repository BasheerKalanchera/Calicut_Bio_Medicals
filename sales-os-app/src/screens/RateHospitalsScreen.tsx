import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { listAccounts, setBusinessPotential } from "../services/accounts";
import ZonePicker from "../components/ZonePicker";
import useDebouncedValue from "../hooks/useDebouncedValue";
import type { ZoneSearchResult } from "../services/masterData";
import type { AccountListResponse } from "../types/api-aliases";
import {
  BUSINESS_POTENTIAL_LABEL,
  BUSINESS_POTENTIAL_OPTIONS,
  toBusinessPotential,
  type BusinessPotential,
} from "../utils/businessPotential";
import TableOrCards, { TocCell, TocMessage, TocRow } from "../components/TableOrCards";

const PAGE_SIZE = 50;

// Admin/GM rate each hospital's Business Potential here, one row per
// hospital, edited in place (docs/Hospital-Wise-Target-Planning-
// Implementation-Plan.md, choice 3 "fuller"). The nav entry is Admin/GM-
// gated in DemoApp.tsx; the PATCH itself is Admin/GM-only server-side, and
// the notes come back only for those two roles.
export default function RateHospitalsScreen({ active }: { active: boolean }) {
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneSearchResult | null>(null);
  const [potentialFilter, setPotentialFilter] = useState<BusinessPotential | "">("NOT_CLASSIFIED");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["accounts", "rate-hospitals", { search: debouncedSearch, zoneId: zoneFilter?.id, potentialFilter, page }],
    queryFn: () =>
      listAccounts({
        search: debouncedSearch || undefined,
        zone_id: zoneFilter?.id || undefined,
        business_potential: potentialFilter || undefined,
        page: page + 1,
        page_size: PAGE_SIZE,
      }),
    // Stays mounted for every role (ADR-030) -- only fetch while on screen.
    enabled: active,
  });
  const accounts = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <Box sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Fixed: search + filters — does not scroll */}
      {/* On a phone the search takes its own line; Zone and rating share the next. */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", flexShrink: 0, px: { xs: 1.5, sm: 3 }, pt: 3, pb: 2 }}>
        <TextField
          size="small"
          placeholder="Search hospitals"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: { xs: "1 1 100%", sm: 1 }, minWidth: "12rem" }}
          slotProps={{
            htmlInput: { "aria-label": "Search hospitals" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => { setSearch(""); setPage(0); }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <Box sx={{ minWidth: { xs: 0, sm: 220 }, flex: { xs: 1, sm: "0 0 auto" } }}>
          <ZonePicker label="Zone" placeholder="All Zones" value={zoneFilter} onChange={(zone) => { setZoneFilter(zone); setPage(0); }} />
        </Box>
        <TextField
          select
          size="small"
          label="Rating"
          value={potentialFilter}
          onChange={(e) => { setPotentialFilter(e.target.value as BusinessPotential | ""); setPage(0); }}
          // "All ratings" is an empty value, so the label is held above the box.
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          sx={{ minWidth: "10rem" }}
        >
          <MenuItem value="">All ratings</MenuItem>
          {BUSINESS_POTENTIAL_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>{p === "NOT_CLASSIFIED" ? "Not rated yet" : BUSINESS_POTENTIAL_LABEL[p]}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Scrollable list content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: { xs: 1.5, sm: 3 }, pb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        {isError && (
          <Alert severity="error" action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
            Failed to load hospitals
          </Alert>
        )}

        {/* Each hospital is a card on a phone (Frontend standards §6.11 rule 2). */}
        <Box sx={{ bgcolor: { xs: "transparent", sm: "background.paper" }, borderRadius: 2 }}>
          <TableOrCards
            stickyHeader
            columns={[
              { label: "Hospital" },
              { label: "Zone" },
              { label: "Business Potential", width: "10rem" },
              { label: "Notes (Admin/GM only)" },
              { width: "6rem" },
            ]}
          >
            {accounts.map((a) => (
              <RatingRow key={a.id} account={a} />
            ))}
            {!isLoading && accounts.length === 0 && (
              <TocMessage>
                <Typography color="text.secondary">
                  {potentialFilter === "NOT_CLASSIFIED" ? "Every hospital matching these filters is rated." : "No hospitals match these filters."}
                </Typography>
              </TocMessage>
            )}
            {isLoading && (
              <TocMessage><Typography color="text.secondary">Loading...</Typography></TocMessage>
            )}
          </TableOrCards>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </Box>
      </Box>
    </Box>
  );
}

// One hospital. Rating and note are edited locally and saved together by the
// row's own Save button -- nothing saves on pick or on blur, so a half-typed
// note never goes out with a rating (Basheer, 2026-09-30).
function RatingRow({ account }: { account: AccountListResponse }) {
  const queryClient = useQueryClient();
  const savedPotential = toBusinessPotential(account.business_potential);
  const savedNotes = account.business_potential_notes ?? null;
  const [potential, setPotential] = useState<BusinessPotential>(savedPotential);
  const [notes, setNotes] = useState(savedNotes ?? "");

  const save = useMutation({
    mutationFn: (body: { business_potential: string; business_potential_notes: string | null }) =>
      setBusinessPotential(account.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", account.id] });
      queryClient.invalidateQueries({ queryKey: ["planning", "eligible-accounts"] });
    },
  });

  const trimmedNotes = notes.trim() || null;
  const dirty = potential !== savedPotential || trimmedNotes !== savedNotes;

  return (
    <TocRow>
      <TocCell title>{account.name}</TocCell>
      <TocCell label="Zone">{account.zone?.name ?? "—"}</TocCell>
      <TocCell field label="Business Potential">
        <TextField
          select
          size="small"
          fullWidth
          value={potential}
          disabled={save.isPending}
          onChange={(e) => setPotential(e.target.value as BusinessPotential)}
        >
          {BUSINESS_POTENTIAL_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>{BUSINESS_POTENTIAL_LABEL[p]}</MenuItem>
          ))}
        </TextField>
      </TocCell>
      <TocCell field label="Notes (Admin/GM only)">
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={3}
          placeholder="Why this rating?"
          value={notes}
          disabled={save.isPending}
          onChange={(e) => setNotes(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        {save.isError && (
          <Typography variant="caption" color="error">Couldn't save — try again.</Typography>
        )}
      </TocCell>
      <TocCell action>
        <Button
          size="small"
          variant="contained"
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate({ business_potential: potential, business_potential_notes: trimmedNotes })}
        >
          {save.isPending ? "Saving..." : "Save"}
        </Button>
      </TocCell>
    </TocRow>
  );
}
