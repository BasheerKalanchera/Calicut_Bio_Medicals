import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LoadingOrEmpty, SectionCard, ZoneTreeNote } from "../components/ReportingUI";
import TableOrCards, { TocCell, TocPair, TocRow } from "../components/TableOrCards";
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

// "—" where nothing in the row has a saved cost (D17); a loss in red (D18).
function money(value: string | null) {
  return value === null ? "—" : formatLakhsExact(value);
}

function percent(value: string | null) {
  if (value === null) return "—";
  const n = Number(value);
  return `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
}

function lossColour(value: string | null) {
  return value !== null && Number(value) < 0 ? { color: "error.main" } : {};
}

function FigureCells({ figures }: { figures: MarginFigures }) {
  return (
    <>
      <TocCell label="Quantity" align="right">{figures.quantity}</TocCell>
      <TocPair>
        <TocCell label="Sold for" align="right">{money(figures.sold_for_lakhs)}</TocCell>
        <TocCell label="Cost" align="right">{money(figures.cost_lakhs)}</TocCell>
      </TocPair>
      <TocPair>
        <TocCell label="Margin" align="right" sx={lossColour(figures.margin_lakhs)}>{money(figures.margin_lakhs)}</TocCell>
        <TocCell label="Margin %" align="right" sx={lossColour(figures.margin_percent)}>{percent(figures.margin_percent)}</TocCell>
      </TocPair>
    </>
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

  // The drilled list carries Won and the same closed dates, so it holds the
  // Opportunities the row counted.
  function openRow(row: MarginSummaryRow) {
    const label = period === "all" ? `${row.group_name}, Won` : `${row.group_name}, Won, ${periodLabel}`;
    onDrillToPipeline(
      {
        [DRILL_KEYS[groupBy]]: row.group_id,
        statusId: wonStatusId,
        closedFrom: filters.period_start,
        closedTo: filters.period_end,
        ...(row.zone_exact && { zoneExact: true }),
      },
      label,
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* The two boxes stay put; the figures below scroll (§6.1). */}
      <Box sx={{ p: 2, pb: 1.5, flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">{reportPeriodDates(period)}</Typography>
        <TextField select size="small" label="Period" value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)} sx={{ minWidth: 140 }}>
          {REPORT_PERIOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value as MarginGroupBy)} sx={{ minWidth: 110 }}>
          {GROUP_BY_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5, "& > *": { flexShrink: 0 } }}>
        <LoadingOrEmpty
          isLoading={reportQuery.isLoading}
          isError={reportQuery.isError}
          isEmpty={report !== undefined && rows.length === 0 && tradeIn === 0}
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
            >
              <TocRow total shaded>
                <TocCell title>Total</TocCell>
                <FigureCells figures={report.totals} />
                <TocCell phone={false} />
              </TocRow>
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
                    <FigureCells figures={row} />
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
            <TableOrCards columns={[{ label: "Product" }, { label: "Sales", align: "right" }, { label: "Value sold", align: "right" }]}>
              {missingCost.map((p) => (
                <TocRow key={p.product_id}>
                  <TocCell title>{p.product_name}</TocCell>
                  <TocCell label="Sales" align="right">{p.sale_count}</TocCell>
                  <TocCell label="Value sold" align="right">{formatLakhsExact(p.sold_for_lakhs)}</TocCell>
                </TocRow>
              ))}
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
