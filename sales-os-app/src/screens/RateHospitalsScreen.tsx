import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
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
    <Box sx={{ height: "100%", overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search hospitals"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: "12rem" }}
        />
        <Box sx={{ minWidth: { sm: 220 }, flexShrink: 0 }}>
          <ZonePicker label="All Zones" value={zoneFilter} onChange={(zone) => { setZoneFilter(zone); setPage(0); }} />
        </Box>
        <TextField
          select
          size="small"
          value={potentialFilter}
          onChange={(e) => { setPotentialFilter(e.target.value as BusinessPotential | ""); setPage(0); }}
          slotProps={{ select: { displayEmpty: true } }}
          sx={{ minWidth: "10rem" }}
        >
          <MenuItem value="">All ratings</MenuItem>
          {BUSINESS_POTENTIAL_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>{p === "NOT_CLASSIFIED" ? "Not rated yet" : BUSINESS_POTENTIAL_LABEL[p]}</MenuItem>
          ))}
        </TextField>
      </Box>

      {isError && (
        <Alert severity="error" action={<Button size="small" onClick={() => refetch()}>Retry</Button>}>
          Failed to load hospitals
        </Alert>
      )}

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hospital</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell sx={{ width: "10rem" }}>Business Potential</TableCell>
              <TableCell>Notes (Admin/GM only)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((a) => (
              <RatingRow key={a.id} account={a} />
            ))}
            {!isLoading && accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">
                    {potentialFilter === "NOT_CLASSIFIED" ? "Every hospital matching these filters is rated." : "No hospitals match these filters."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}><Typography color="text.secondary">Loading...</Typography></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
  );
}

// One hospital. The rating saves the moment it's picked; the note saves when
// the field loses focus, and only if it actually changed. Both send the
// row's current rating + note together (the PATCH replaces both).
function RatingRow({ account }: { account: AccountListResponse }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(account.business_potential_notes ?? "");
  const potential = toBusinessPotential(account.business_potential);

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

  return (
    <TableRow>
      <TableCell>{account.name}</TableCell>
      <TableCell>{account.zone?.name ?? "—"}</TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          fullWidth
          value={potential}
          disabled={save.isPending}
          onChange={(e) => save.mutate({ business_potential: e.target.value, business_potential_notes: trimmedNotes })}
        >
          {BUSINESS_POTENTIAL_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>{BUSINESS_POTENTIAL_LABEL[p]}</MenuItem>
          ))}
        </TextField>
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={3}
          placeholder="Why this rating?"
          value={notes}
          disabled={save.isPending}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (trimmedNotes !== (account.business_potential_notes ?? null)) {
              save.mutate({ business_potential: potential, business_potential_notes: trimmedNotes });
            }
          }}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        {save.isError && (
          <Typography variant="caption" color="error">Couldn't save — try again.</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}
