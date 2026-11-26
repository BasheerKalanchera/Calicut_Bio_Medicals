import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Chip, Collapse, ListSubheader, MenuItem, TextField, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FilterListIcon from "@mui/icons-material/FilterList";
import { LoadingOrEmpty, SectionCard } from "../components/ReportingUI";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import ZonePicker from "../components/ZonePicker";
import useIsPhone from "../hooks/useIsPhone";
import { listLossReasons, listRepUsers, listSbus, type ZoneSearchResult } from "../services/masterData";
import { getSalesLossReport } from "../services/reporting";
import type { SalesLossRow } from "../types/api-aliases";
import {
  formatLakhsExact,
  REPORT_PERIOD_OPTIONS,
  reportPeriodDates,
  reportPeriodFilters,
  type ReportPeriod,
} from "../utils/formatter";

// Sales Loss Report (docs/Sales-Loss-Report-Implementation-Plan.md). The server
// decides who sees what (D3), the value (D7), the competitor grouping (D9) and
// the order (D6); this screen only shows the list.

// Local stopgap types -- masterData.ts's listSbus/listLossReasons return
// Promise<unknown>.
interface SbuOption { id: string; name: string }
interface LossReasonOption { id: string; reason_name: string }

// The summary row pressed (D5); it narrows the list below.
type RowPick =
| { by: "reason"; key: string | null; label: string }
  | { by: "competitor"; key: string; label: string };

// "2026-11-18" -> "18 Nov 2026". Built from the parts so the day can't shift
// with the browser's time zone.
function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function money(value: string | null) {
  return value === null ? "—" : formatLakhsExact(value);
}

const NO_REASON = "No reason";

const filterSx = { minWidth: 160, flex: { xs: "1 1 100%", sm: "0 0 auto" } };
// An empty value shows its "All …" line, with the name above the box (§6.6.1).
const emptyMeansAll = { select: { displayEmpty: true }, inputLabel: { shrink: true } };

interface SummaryLine {
  pick: RowPick;
  count: number;
  value: string | null;
}

function Summary({
  title,
  nameLabel,
  lines,
  emptyText,
  picked,
  onPick,
}: {
  title: string;
  nameLabel: string;
  lines: SummaryLine[];
  emptyText: string;
  picked: RowPick | null;
  onPick: (pick: RowPick) => void;
}) {
  const phone = useIsPhone();
  return (
    <SectionCard title={title}>
      {lines.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
      ) : (
        <TableOrCards
          columns={[
            { label: nameLabel },
            { label: "Opportunities", align: "right" },
            { label: "Value", align: "right" },
            { toggle: true },
          ]}
        >
          {lines.map((line) => (
            <TocRow
              key={line.pick.key ?? ""}
              onClick={() => onPick(line.pick)}
              shaded={picked?.by === line.pick.by && picked.key === line.pick.key}
            >
              <TocCell title>{line.pick.label}</TocCell>
              {phone ? (
                <TocCell>
                  {line.count} {line.count === 1 ? "Opportunity" : "Opportunities"} · {money(line.value)}
                </TocCell>
              ) : (
                <>
                  <TocCell align="right">{line.count}</TocCell>
                  <TocCell align="right">{money(line.value)}</TocCell>
                </>
              )}
              <TocCell action align="right">
                <ChevronRightIcon fontSize="small" sx={{ color: "gray.400" }} />
              </TocCell>
            </TocRow>
          ))}
        </TableOrCards>
      )}
    </SectionCard>
  );
}

function LossList({
  rows,
  onOpen,
}: {
  rows: SalesLossRow[];
  onOpen?: (opportunity: { id: string; name: string }) => void;
}) {
  const phone = useIsPhone();
  return (
    <TableOrCards
      columns={[
        { label: "Opportunity" },
        { label: "Customer" },
        { label: "Owner" },
        { label: "Stage lost at" },
        { label: "Loss Reason" },
        { label: "Competitor" },
        { label: "Competing product" },
        { label: "Value", align: "right" },
        { label: "Closed date" },
        { toggle: true },
      ]}
    >
      {rows.map((row) => {
        const open = onOpen ? () => onOpen({ id: row.opportunity_id, name: row.opportunity_name }) : undefined;
        const reason = row.loss_reason ?? NO_REASON;
        const closed = row.closed_date ? formatDay(row.closed_date) : null;
        return (
          <TocRow key={row.opportunity_id} onClick={open}>
            <TocCell title>{row.opportunity_name}</TocCell>
            {phone ? (
              // Three lines under the name (D6a, D18).
              <>
                <TocCell>{row.account_name} · {row.owner_name}</TocCell>
                <TocCell>{[reason, row.competitor_name, row.competitor_product_name].filter(Boolean).join(" · ")}</TocCell>
                <TocCell>{money(row.value_lakhs)} · {row.stage_name} · {closed ?? "No closed date"}</TocCell>
              </>
            ) : (
              <>
                <TocCell>{row.account_name}</TocCell>
                <TocCell>{row.owner_name}</TocCell>
                <TocCell>{row.stage_name}</TocCell>
                <TocCell>{reason}</TocCell>
                <TocCell>{row.competitor_name ?? "—"}</TocCell>
                <TocCell>{row.competitor_product_name ?? "—"}</TocCell>
                <TocCell align="right">{money(row.value_lakhs)}</TocCell>
                <TocCell>{closed ?? "—"}</TocCell>
              </>
            )}
            <TocCell action align="right">
              {open && <ChevronRightIcon fontSize="small" sx={{ color: "gray.400" }} />}
            </TocCell>
          </TocRow>
        );
      })}
    </TableOrCards>
  );
}

export default function SalesLossReportScreen({
  isActive,
  onSelectOpportunity,
}: {
  // DemoApp keeps this screen mounted while hidden, so the filters are still
  // set on Back from an Opportunity.
  isActive: boolean;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const phone = useIsPhone();
  const [period, setPeriod] = useState<ReportPeriod>("quarter");
  const [sbuId, setSbuId] = useState("");
  const [zone, setZone] = useState<ZoneSearchResult | null>(null);
  const [userId, setUserId] = useState("");
  const [lossReasonId, setLossReasonId] = useState("");
  const [pick, setPick] = useState<RowPick | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetched afresh each time the screen is opened: an Opportunity marked Lost
  // elsewhere changes the list.
  const query = useQuery({
    queryKey: ["reporting", "sales-loss", period, sbuId, zone?.id ?? "", userId, lossReasonId],
    queryFn: () =>
      getSalesLossReport({
        ...reportPeriodFilters(period),
        ...(sbuId && { sbu_id: sbuId }),
        ...(zone && { zone_id: zone.id }),
        ...(userId && { user_id: userId }),
        ...(lossReasonId && { loss_reason_id: lossReasonId }),
      }),
    enabled: isActive,
    staleTime: 0,
    // Keep the list on screen while a new filter loads.
    placeholderData: (previous) => previous,
  });

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: isActive,
  });
  // Deactivated owners too (D20): this filters past losses, it assigns no work.
  const { data: reps = [] } = useQuery({
    queryKey: ["users", "reps", "include-inactive"],
    queryFn: () => listRepUsers("scoped", true),
    enabled: isActive,
  });
  const activeOwners = reps.filter((u) => u.is_active !== false);
  const inactiveOwners = reps.filter((u) => u.is_active === false);
  const { data: lossReasons = [] } = useQuery({
    queryKey: ["lossReasons"],
    queryFn: async () => (await listLossReasons()) as LossReasonOption[],
    staleTime: Infinity,
    enabled: isActive,
  });

  // A new filter clears the summary row pressed under the last one.
  function changeFilter<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setPick(null);
    };
  }
  // Pressing the same summary row again clears it.
  function togglePick(next: RowPick) {
    setPick((current) => (current?.by === next.by && current.key === next.key ? null : next));
  }

  const report = query.data;
  const reasonLines: SummaryLine[] = (report?.by_loss_reason ?? []).map((s) => ({
    pick: { by: "reason", key: s.loss_reason_id, label: s.loss_reason ?? NO_REASON },
    count: s.opportunity_count,
    value: s.value_lakhs,
  }));
  const competitorLines: SummaryLine[] = (report?.by_competitor ?? []).map((s) => ({
    pick: { by: "competitor", key: s.competitor_key, label: s.competitor_name },
    count: s.opportunity_count,
    value: s.value_lakhs,
  }));
  // A row pressed earlier counts only while a summary still lists it: a refresh
  // can drop its group, which must not leave the list filtered to nothing.
  const activePick =
    [...reasonLines, ...competitorLines].find((l) => l.pick.by === pick?.by && l.pick.key === pick?.key)?.pick ?? null;
  const allRows = report?.rows ?? [];
  const rows = !activePick
    ? allRows
    : allRows.filter((r) =>
        activePick.by === "reason" ? r.loss_reason_id === activePick.key : r.competitor_key === activePick.key,
      );

  const filterBoxes = (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, pt: 1 }}>
      <TextField select size="small" label="Period" value={period} onChange={(e) => changeFilter(setPeriod)(e.target.value as ReportPeriod)} sx={filterSx}>
        {REPORT_PERIOD_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="SBU" value={sbuId} onChange={(e) => changeFilter(setSbuId)(e.target.value)} slotProps={emptyMeansAll} sx={filterSx}>
        <MenuItem value="">All SBUs</MenuItem>
        {sbus.map((s) => (
          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
        ))}
      </TextField>
      <Box sx={{ ...filterSx, minWidth: 220 }}>
        <ZonePicker label="Zone" placeholder="All Zones" value={zone} onChange={changeFilter(setZone)} />
      </Box>
      {reps.length > 1 && (
        <TextField select size="small" label="Owner" value={userId} onChange={(e) => changeFilter(setUserId)(e.target.value)} slotProps={emptyMeansAll} sx={filterSx}>
          <MenuItem value="">All owners</MenuItem>
          {activeOwners.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
          ))}
          {/* As on the Pipeline screen's Owner box. */}
          {inactiveOwners.length > 0 && [
            <ListSubheader key="inactive-header" sx={{ fontWeight: 700 }}>Inactive Owners</ListSubheader>,
            ...inactiveOwners.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ color: "error.main" }}>{u.display_name}</MenuItem>
            )),
          ]}
        </TextField>
      )}
      <TextField select size="small" label="Loss Reason" value={lossReasonId} onChange={(e) => changeFilter(setLossReasonId)(e.target.value)} slotProps={emptyMeansAll} sx={filterSx}>
        <MenuItem value="">All Loss Reasons</MenuItem>
        {lossReasons.map((r) => (
          <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>
        ))}
      </TextField>
    </Box>
  );

  return (
    <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* The filters stay put; the summaries and the list scroll (§6.1). On a
          phone they fold behind a button. */}
      <Box sx={{ px: 2, pt: phone ? 2 : 1, pb: 1.5, flexShrink: 0 }}>
        {phone ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">{reportPeriodDates(period)}</Typography>
              <Button size="small" variant="outlined" startIcon={<FilterListIcon />} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
                Filters
              </Button>
            </Box>
            <Collapse in={filtersOpen}>{filterBoxes}</Collapse>
          </>
        ) : (
          <>
            {filterBoxes}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{reportPeriodDates(period)}</Typography>
          </>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5, "& > *": { flexShrink: 0 }, opacity: query.isPlaceholderData ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          // An empty report still shows its cards, each saying it is empty.
          isEmpty={false}
          emptyText=""
          errorText="Couldn't load the Sales Loss Report."
          onRetry={() => query.refetch()}
        />

        {report && (
          <>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
              <Summary title="By Loss Reason" nameLabel="Loss Reason" lines={reasonLines} emptyText="Nothing to summarise." picked={activePick} onPick={togglePick} />
              <Summary title="By Competitor" nameLabel="Competitor" lines={competitorLines} emptyText="No competitor named." picked={activePick} onPick={togglePick} />
            </Box>

            <SectionCard
              title="Lost Opportunities"
              action={activePick && <Chip size="small" label={activePick.label} onDelete={() => setPick(null)} />}
            >
              {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No Lost Opportunities for these filters.</Typography>
              ) : (
                // Nine columns: on a narrower screen the list scrolls sideways
                // inside its card.
                <Box sx={{ overflowX: "auto" }}>
                  <LossList rows={rows} onOpen={onSelectOpportunity} />
                </Box>
              )}
            </SectionCard>
          </>
        )}
      </Box>
    </Box>
  );
}
