import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, MenuItem, TextField, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LoadingOrEmpty, SectionCard, ZoneTreeNote } from "../components/ReportingUI";
import TableOrCards, { TocCell, TocPair, TocRow } from "../components/TableOrCards";
import useIsPhone from "../hooks/useIsPhone";
import { getMarginSummary } from "../services/reporting";
import { listStatuses } from "../services/masterData";
import type { MarginFigures, MarginGroupBy, MarginSummaryRow } from "../types/api-aliases";
import {
  formatLakhsExact,
  REPORT_PERIOD_OPTIONS,
  reportPeriodDates,
  reportPeriodFilters,
  type ReportPeriod,
} from "../utils/formatter";

const GROUP_BY_OPTIONS: { value: MarginGroupBy; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "brand", label: "Brand" },
  { value: "sbu", label: "SBU" },
  { value: "zone", label: "Zone" },
  { value: "rep", label: "Rep" },
];

// Which Pipeline list filter a row of each grouping opens (D10).
const DRILL_KEYS = {
  product: "productId",
  brand: "brandId",
  sbu: "sbuId",
  zone: "zoneId",
  rep: "ownerId",
} as const;

type DrillFilter = { ownerId?: string; zoneId?: string; sbuId?: string; productId?: string; brandId?: string; zoneExact?: boolean; closedFrom?: string; closedTo?: string; statusId?: string };

// A loss is shown with a minus sign and in red (D18). No percent when
// nothing was sold for anything.
function percent(value: string | null) {
  if (value === null) return "—";
  const n = Number(value);
  return `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
}

function lossColour(value: string | null) {
  return value !== null && Number(value) < 0 ? { color: "error.main" } : {};
}

// The total row passes no quantity: units of different machines don't add up
// to anything useful (D20).
function FigureCells({ figures, quantity }: { figures: MarginFigures; quantity?: number }) {
  return (
    <>
      <TocCell label="Quantity" align="right">{quantity}</TocCell>
      <TocPair>
        <TocCell label="Sold for" align="right">{formatLakhsExact(figures.sold_for_lakhs)}</TocCell>
        <TocCell label="Cost" align="right">{formatLakhsExact(figures.cost_lakhs)}</TocCell>
      </TocPair>
      <TocPair>
        <TocCell label="Margin" align="right" sx={lossColour(figures.margin_lakhs)}>{formatLakhsExact(figures.margin_lakhs)}</TocCell>
        <TocCell label="Margin %" align="right" sx={lossColour(figures.margin_percent)}>{percent(figures.margin_percent)}</TocCell>
      </TocPair>
    </>
  );
}

function TotalsFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>{label} </Box>
      {children}
    </Box>
  );
}

// The totals on a phone, held above the rows in one line, with no title and no
// margin % so that the three figures fit (D21). Margin drops to a second line
// rather than being cut off.
function PhoneTotals({ figures }: { figures: MarginFigures }) {
  return (
    <Card variant="outlined" sx={{ mx: 2, mb: 1.5, flexShrink: 0, bgcolor: "gray.50" }}>
      <CardContent
        sx={{
          p: 1.5,
          "&:last-child": { pb: 1.5 },
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          columnGap: 1,
          rowGap: 0.5,
          typography: "body3",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <TotalsFigure label="Sold for">{formatLakhsExact(figures.sold_for_lakhs)}</TotalsFigure>
        <TotalsFigure label="Cost">{formatLakhsExact(figures.cost_lakhs)}</TotalsFigure>
        <TotalsFigure label="Margin">
          <Box component="span" sx={lossColour(figures.margin_lakhs)}>
            {formatLakhsExact(figures.margin_lakhs)}
          </Box>
        </TotalsFigure>
      </CardContent>
    </Card>
  );
}

export default function MarginReportScreen({
  isActive,
  onDrillToPipeline,
}: {
  isActive: boolean;
  onDrillToPipeline: (filter: DrillFilter, label: string) => void;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("quarter");
  const [groupBy, setGroupBy] = useState<MarginGroupBy>("product");
  const phone = useIsPhone();
  const filters = reportPeriodFilters(period);

  // Fetched afresh each time the screen is opened: a catalog cost or a product
  // correction saved elsewhere changes these figures.
  const reportQuery = useQuery({
    queryKey: ["reporting", "margin-summary", groupBy, period],
    queryFn: () => getMarginSummary(groupBy, filters),
    enabled: isActive,
    staleTime: 0,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async () => (await listStatuses()) as { id: string; status_code: string }[],
    staleTime: Infinity,
  });
  const wonStatusId = statuses.find((s) => s.status_code === "WON")?.id;

  const report = reportQuery.data;
  const rows = report?.rows ?? [];
  const missingCost = report?.missing_cost ?? [];
  const tradeIn = Number(report?.trade_in_lakhs ?? 0);
  const groupLabel = GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label;
  const periodLabel = REPORT_PERIOD_OPTIONS.find((o) => o.value === period)?.label;

  // The drilled list carries Won and the same closed dates. It holds every
  // such Opportunity for the row, with or without a saved cost (D20).
  function openWon(filter: DrillFilter, name: string) {
    const label = period === "all" ? `${name}, Won` : `${name}, Won, ${periodLabel}`;
    onDrillToPipeline(
      { ...filter, statusId: wonStatusId, closedFrom: filters.period_start, closedTo: filters.period_end },
      label,
    );
  }

  function openRow(row: MarginSummaryRow) {
    openWon({ [DRILL_KEYS[groupBy]]: row.group_id, ...(row.zone_exact && { zoneExact: true }) }, row.group_name);
  }

  return (
    <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* The title has its own band here; on a phone it shares the boxes'
          line (D19). */}
      {!phone && (
        <Box sx={{ px: 2, py: 1.5, bgcolor: "background.paper", borderBottom: 1, borderColor: "gray.100", flexShrink: 0 }}>
          <Typography component="h2" sx={{ typography: "h5", fontWeight: 800, color: "gray.800", letterSpacing: "-0.025em" }}>
            Margin Report
          </Typography>
        </Box>
      )}

      {/* The two boxes and the totals stay put; the rows below scroll (§6.1). */}
      <Box sx={{ px: 2, pt: { xs: 1.5, sm: 2 }, pb: 1.5, flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: { xs: 0.75, sm: 1 } }}>
        {phone ? (
          <Typography component="h2" sx={{ typography: "body1", fontWeight: 800, color: "gray.800", letterSpacing: "-0.025em", mr: "auto" }}>
            Margin Report
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">{reportPeriodDates(period)}</Typography>
        )}
        {/* On a phone the closed box shows the dates themselves. */}
        <TextField
          select
          size="small"
          label="Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          slotProps={phone ? { input: { sx: { typography: "body2" } }, select: { renderValue: () => reportPeriodDates(period) } } : undefined}
          sx={{ minWidth: { xs: 128, sm: 140 } }}
        >
          {REPORT_PERIOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Group by"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as MarginGroupBy)}
          slotProps={phone ? { input: { sx: { typography: "body2" } } } : undefined}
          sx={{ minWidth: { xs: 96, sm: 110 } }}
        >
          {GROUP_BY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {phone && report && rows.length > 0 && <PhoneTotals figures={report.totals} />}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5, "& > *": { flexShrink: 0 } }}>
        <LoadingOrEmpty
          isLoading={reportQuery.isLoading}
          isError={reportQuery.isError}
          isEmpty={report !== undefined && rows.length === 0 && missingCost.length === 0 && tradeIn === 0}
          emptyText="No Opportunities won in this period."
          errorText="Couldn't load the margin report."
          onRetry={() => reportQuery.refetch()}
        />

        {report && rows.length > 0 && (
          <SectionCard title="Margin" hideHeader>
            <TableOrCards
              stickyHeader
              columns={[
                { label: groupLabel },
                { label: "Quantity", align: "right" },
                { label: "Sold for", align: "right" },
                { label: "Cost", align: "right" },
                { label: "Margin", align: "right" },
                { label: "Margin %", align: "right" },
                { toggle: true },
              ]}
              pinned={
                <TocRow total shaded>
                  <TocCell title>Total</TocCell>
                  <FigureCells figures={report.totals} />
                  <TocCell />
                </TocRow>
              }
            >
              {rows.map((row) => {
                const open = wonStatusId ? () => openRow(row) : undefined;
                return (
                  <TocRow key={`${row.group_id}${row.zone_exact ? "-exact" : ""}`} indent={row.depth ?? 0} onClick={open}>
                    <TocCell title>
                      {row.group_name}
                      {row.filled_later_line_count > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>cost filled in later</Typography>
                      )}
                    </TocCell>
                    <FigureCells figures={row} quantity={row.quantity} />
                    <TocCell action align="right">
                      {open && <ChevronRightIcon fontSize="small" sx={{ color: "gray.400" }} />}
                    </TocCell>
                  </TocRow>
                );
              })}
            </TableOrCards>
            {groupBy === "zone" && <ZoneTreeNote />}
          </SectionCard>
        )}

        {missingCost.length > 0 && (
          <SectionCard title="No cost entered — not in the margin">
            <TableOrCards columns={[{ label: "Product" }, { label: "Sales", align: "right" }, { label: "Value sold", align: "right" }, { toggle: true }]}>
              {missingCost.map((p) => {
                const open = wonStatusId ? () => openWon({ productId: p.product_id }, p.product_name) : undefined;
                return (
                  <TocRow key={p.product_id} onClick={open}>
                    <TocCell title>{p.product_name}</TocCell>
                    <TocCell label="Sales" align="right">{p.sale_count}</TocCell>
                    <TocCell label="Value sold" align="right">{formatLakhsExact(p.sold_for_lakhs)}</TocCell>
                    <TocCell action align="right">
                      {open && <ChevronRightIcon fontSize="small" sx={{ color: "gray.400" }} />}
                    </TocCell>
                  </TocRow>
                );
              })}
            </TableOrCards>
          </SectionCard>
        )}

        {tradeIn !== 0 && (
          <Typography variant="body2" color="text.secondary">
            Trade-ins: {formatLakhsExact(tradeIn)} — not in the margin
          </Typography>
        )}
      </Box>
    </Box>
  );
}
