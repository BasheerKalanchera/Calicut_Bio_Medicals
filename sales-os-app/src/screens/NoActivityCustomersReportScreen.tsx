import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Link, MenuItem, TextField } from "@mui/material";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import ZonePicker from "../components/ZonePicker";
import { LoadingOrEmpty, StatTile } from "../components/ReportingUI";
import { listUsers, searchZonesForHospital, type ZoneSearchResult } from "../services/masterData";
import { getNoActivityCustomers } from "../services/reporting";
import { statusColors } from "../theme/statusColors";

// Customer with No Activity (docs/Exception-Report-Implementation-Plan.md).
// The server decides who counts as quiet (90 days or more, D6), who sees which
// hospitals (D3-D5) and the order (D8); this screen only shows the list.

// "2026-07-21" -> "21 Jul 2026". Built from the parts so the day can't shift
// with the browser's time zone.
function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function NameLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <Link component="button" type="button" underline="hover" onClick={onClick} sx={{ textAlign: "left", typography: "body2", fontWeight: 600 }}>
      {children}
    </Link>
  );
}

export default function NoActivityCustomersReportScreen({
  onSelectAccount,
}: {
  onSelectAccount?: (account: { id: string; name: string }) => void;
}) {
  const [userId, setUserId] = useState("");
  const [zone, setZone] = useState<ZoneSearchResult | null>(null);

  // Rep picker: the people this user may see, same list as Stagnant
  // Opportunities; shown only when there is someone to pick (D13).
  const { data: reps = [] } = useQuery({
    queryKey: ["users", "scoped"],
    queryFn: () => listUsers("scoped"),
  });

  const query = useQuery({
    queryKey: ["reporting", "no-activity-customers", userId, zone?.id ?? ""],
    queryFn: () =>
      getNoActivityCustomers({ ...(userId && { user_id: userId }), ...(zone && { zone_id: zone.id }) }),
    // Keep the pickers on screen while a new pick loads.
    placeholderData: (previous) => previous,
  });

  // After a new pick, the old list stays up until the new one arrives: dim it
  // so it isn't read as the new pick's list.
  const dimmed = query.isPlaceholderData;
  const rows = query.data?.rows ?? [];
  // The server says whether the viewer holds more than one zone (D13).
  const showZonePicker = query.data?.show_zone_picker ?? false;
  const showRepPicker = reps.length > 1;

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Fixed while the list scrolls (Simpler Table D15, D16). */}
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {(showRepPicker || showZonePicker) && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {showRepPicker && (
              <TextField
                select
                size="small"
                label="Rep"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
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
                  onChange={setZone}
                  searchFn={searchZonesForHospital}
                />
              </Box>
            )}
          </Box>
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
          emptyText="No customers without activity. Nice."
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
