import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, IconButton, InputAdornment, Link, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import ZonePicker from "../components/ZonePicker";
import { LoadingOrEmpty, StatTile } from "../components/ReportingUI";
import { listRepUsers, searchZonesForHospital, type ZoneSearchResult } from "../services/masterData";
import { getNoActivityCustomers, searchNoActivityZones } from "../services/reporting";
import { statusColors } from "../theme/statusColors";
import { useAuth } from "../contexts/AuthContext";
import type { NoActivityCustomersResponse } from "../types/api-aliases";

// Customer with No Activity (docs/Exception-Report-Implementation-Plan.md).
// The server decides who counts as quiet (90 days or more, D6), who sees which
// hospitals (D3-D5) and the order (D8); this screen only shows the list.

// "2026-07-21" -> "21 Jul 2026". Built from the parts so the day can't shift
// with the browser's time zone.
function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// D16: the line above the tiles -- whose list this is, which contacts count,
// and how many of the hospitals in view are listed. The server sends the facts;
// the Rep and Zone picks are the screen's own, so the wording is put together
// here. Picking yourself in the Rep picker is no pick (the server treats it so).
function captionLine(
  data: NoActivityCustomersResponse,
  repName: string | null,
  zoneName: string | null,
): string | null {
  // Neither SBU nor "all SBUs": the server refused the pick or the user has no
  // SBU, so the list is empty and a line would only mislead.
  if (!data.counts_all_sbus && !data.sbu_name) return null;
  const sbuPart = data.counts_all_sbus ? "All SBUs" : data.sbu_name;
  const baseZones =
    data.zone_scope === "all" ? "all zones" : data.zone_scope === "own_and_team" ? "your zones and your team's" : "your zones";
  let zonePart = baseZones;
  if (repName && zoneName) zonePart = `${zoneName} and the zones below it, within ${repName}'s zones`;
  else if (repName) zonePart = `${repName}'s zones`;
  else if (zoneName) zonePart = `${zoneName} and the zones below it`;
  const contactsPart = data.counts_all_sbus
    ? "anyone's contact counts"
    : `only ${data.sbu_name} visits, calls, meetings and emails count`;
  const listed = data.gone_quiet_count + data.never_contacted_count;
  const total = data.hospitals_in_view;
  return `${sbuPart} · ${zonePart} · ${contactsPart} · ${listed} of ${total} ${total === 1 ? "hospital" : "hospitals"}`;
}

function NameLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <Link component="button" type="button" underline="hover" onClick={onClick} sx={{ textAlign: "left", typography: "body2", fontWeight: 600 }}>
      {children}
    </Link>
  );
}

export default function NoActivityCustomersReportScreen({
  isActive,
  onSelectAccount,
}: {
  // DemoApp keeps this screen mounted while hidden, so "opened again" never
  // happens; the list is reloaded when it becomes the visible screen.
  isActive: boolean;
  onSelectAccount?: (account: { id: string; name: string }) => void;
}) {
  const [userId, setUserId] = useState("");
  const [zone, setZone] = useState<ZoneSearchResult | null>(null);
  // D17: narrows the list on screen by hospital name; the tiles and the caption
  // keep counting the whole list. Cleared on a Rep or Zone pick.
  const [search, setSearch] = useState("");

  // Rep picker: the people this user may see, same list as Stagnant
  // Opportunities; shown only when there is someone to pick (D13).
  const { data: reps = [] } = useQuery({
    queryKey: ["users", "reps", "scoped"],
    queryFn: () => listRepUsers("scoped"),
  });

  const query = useQuery({
    queryKey: ["reporting", "no-activity-customers", userId, zone?.id ?? ""],
    queryFn: () =>
      getNoActivityCustomers({ ...(userId && { user_id: userId }), ...(zone && { zone_id: zone.id }) }),
    // Keep the pickers on screen while a new pick loads.
    placeholderData: (previous) => previous,
  });

  // A save made elsewhere (Log Activity, a new Opportunity or customer) changes
  // the list, and the global 30 s staleTime would show the old one: reload each
  // time this screen becomes visible (not on first load, the query already runs).
  const { refetch } = query;
  const wasActive = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActive.current) void refetch();
    wasActive.current = isActive;
  }, [isActive, refetch]);

  // After a new pick, the old list stays up until the new one arrives: dim it
  // so it isn't read as the new pick's list.
  const dimmed = query.isPlaceholderData;
  const allRows = query.data?.rows ?? [];
  const searchTerm = search.trim().toLowerCase();
  const rows = searchTerm ? allRows.filter((r) => r.account_name.toLowerCase().includes(searchTerm)) : allRows;
  // The server says whether the viewer holds more than one zone (D13).
  const showZonePicker = query.data?.show_zone_picker ?? false;
  const showRepPicker = reps.length > 1;
  const { userProfile } = useAuth();
  const viewerId = (userProfile as { id?: string } | null)?.id;
  const pickedOther = Boolean(userId) && userId !== viewerId;
  const pickedRep = pickedOther ? reps.find((u) => u.id === userId) : undefined;
  // The Zone picker follows the Rep pick: another person's zones once they are
  // picked, your own zones otherwise.
  const searchZonesForPick = useCallback(
    (q: string) => (pickedOther ? searchNoActivityZones(q, userId) : searchZonesForHospital(q)),
    [pickedOther, userId],
  );
  // No line while a new pick loads (the data on screen is still the old
  // pick's) or when the picked person's name isn't to hand.
  const caption =
    query.data && !query.isPlaceholderData && !(pickedOther && !pickedRep)
      ? captionLine(query.data, pickedRep?.display_name ?? null, zone?.name ?? null)
      : null;

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Fixed while the list scrolls (Simpler Table D15, D16). */}
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {query.data && (
          <TextField
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                    <IconButton size="small" aria-label="Clear search" onClick={() => setSearch("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        )}
        {(showRepPicker || showZonePicker) && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {showRepPicker && (
              <TextField
                select
                size="small"
                label="Rep"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setSearch("");
                  // A zone picked for the last person may not be in this one's.
                  setZone(null);
                }}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                sx={{ minWidth: 200, flex: { xs: "1 1 100%", sm: "0 0 auto" }, mt: 1 }}
              >
                <MenuItem value="">All reps</MenuItem>
                {reps.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
                ))}
              </TextField>
            )}
            {showZonePicker && (
              <Box sx={{ minWidth: 220, flex: { xs: "1 1 100%", sm: "0 0 auto" }, mt: 1 }}>
                <ZonePicker
                  label="Zone"
                  placeholder="All Zones"
                  value={zone}
                  onChange={(z) => {
                    setZone(z);
                    setSearch("");
                  }}
                  searchFn={searchZonesForPick}
                  searchKey={pickedOther ? userId : ""}
                />
              </Box>
            )}
          </Box>
        )}
        {caption && (
          <Typography variant="body2" color="text.secondary" sx={{ opacity: dimmed ? 0.5 : 1, transition: "opacity 0.2s" }}>
            {caption}
          </Typography>
        )}
        {query.data && (
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr", opacity: dimmed ? 0.5 : 1, transition: "opacity 0.2s" }}>
            <StatTile inGrid compact label="Gone quiet" value={String(query.data.gone_quiet_count)} sublabel={`No activity for ${query.data.threshold_days}+ days`} />
            <StatTile inGrid compact label="Never contacted" value={String(query.data.never_contacted_count)} sublabel="No visit, call, meeting or email yet" />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1, opacity: dimmed ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={rows.length === 0}
          emptyText={allRows.length > 0 ? "No customers match your search." : "No customers without activity. Nice."}
          errorText="Couldn't load the Customer with No Activity report."
          onRetry={() => query.refetch()}
        />
        {rows.length > 0 && (
          <TableOrCards
            stickyHeader
            columns={[
              { label: "Hospital" },
              { label: "Zone" },
              { label: "Last activity" },
              { label: "Logged by" },
              { label: "Days silent", align: "right" },
              { label: "Active Opportunities", align: "right" },
              { label: "Installed assets", align: "right" },
            ]}
          >
            {rows.map((row) => (
              <TocRow key={row.account_id}>
                <TocCell title>
                  {onSelectAccount ? (
                    <NameLink onClick={() => onSelectAccount({ id: row.account_id, name: row.account_name })}>{row.account_name}</NameLink>
                  ) : (
                    row.account_name
                  )}
                </TocCell>
                <TocCell label="Zone">{row.zone_name}</TocCell>
                <TocCell label="Last activity">{row.last_contact_date ? formatDay(row.last_contact_date) : "Never contacted"}</TocCell>
                <TocCell label="Logged by">{row.last_contact_by ?? "—"}</TocCell>
                <TocCell label="Days silent" align="right">
                  {row.days_silent == null ? (
                    "—"
                  ) : (
                    <Box
                      component="span"
                      sx={{
                        typography: "caption",
                        fontWeight: 700,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        whiteSpace: "nowrap",
                        bgcolor: statusColors.overdue.bg,
                        color: statusColors.overdue.text,
                      }}
                    >
                      {row.days_silent} days
                    </Box>
                  )}
                </TocCell>
                <TocCell label="Active Opportunities" align="right">{row.active_opportunity_count}</TocCell>
                <TocCell label="Installed assets" align="right">{row.installed_asset_count}</TocCell>
              </TocRow>
            ))}
          </TableOrCards>
        )}
      </Box>
    </Box>
  );
}
