import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import type { TargetVsActualSummaryRow } from "../types/targetPlanning";
import { headCellSx, lakhs, noteSx, numCellSx, numHeadSx, percent, plural } from "../utils/targetVsActuals";

// Shared by Target vs Actuals' Quarter and Year views.

export function NoPoDateNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Box sx={noteSx}>
      {count} {plural(count, "Opportunity past Order has", "Opportunities past Order have")} no PO date, so{" "}
      {plural(count, "it isn't", "they aren't")} counted in PO received.
    </Box>
  );
}

// Team plans (bottom-up) as a share of the target (top-down); a dash until
// a target is set.
function plansVsTarget(row: TargetVsActualSummaryRow): string | null {
  const target = row.target_lakhs === null ? 0 : parseFloat(row.target_lakhs);
  return target > 0 ? String((parseFloat(row.planned_lakhs) / target) * 100) : null;
}

// The team row (Area Manager: against their own target), SBU row (SBU
// Manager and above: against the SBU target, its brands' total) and company
// row (Admin/GM: against every SBU's target) -- Annual Target Planning D49.
export function SummaryRows({ heading = "Against target", teamRow, sbuRow, companyRow }: { heading?: string; teamRow: TargetVsActualSummaryRow | null; sbuRow: TargetVsActualSummaryRow | null; companyRow: TargetVsActualSummaryRow | null }) {
  // Widest first, so the narrowest row sits just above the person rows it
  // sums (Basheer, 2026-10-24).
  const rows: { key: string; label: string; row: TargetVsActualSummaryRow; notSet: string }[] = [];
  if (companyRow) rows.push({ key: "company", label: "Company", row: companyRow, notSet: "Waits for every SBU's target" });
  if (sbuRow) rows.push({ key: "sbu", label: "SBU", row: sbuRow, notSet: "Target not set" });
  if (teamRow) rows.push({ key: "team", label: "Your team", row: teamRow, notSet: "Target not set" });
  if (rows.length === 0) return null;
  return (
    <>
    {/* On a phone each row is a stacked block, like the person rows below. */}
    <Box sx={{ display: { xs: "block", sm: "none" } }}>
      {rows.map(({ key, label, row, notSet }) => {
        const figures: [string, string][] = [
          ["Target", row.target_lakhs === null ? notSet : lakhs(row.target_lakhs)],
          ["Team plans", lakhs(row.planned_lakhs)],
          ["Plans vs target", percent(plansVsTarget(row))],
          ["PO received", lakhs(row.po_received_lakhs)],
          ["Won (paid)", lakhs(row.won_lakhs)],
          ["Won % of target", percent(row.percent_of_target)],
        ];
        return (
          <Box key={key} sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ fontWeight: 700, mb: 0.5 }}>{label}</Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 2, rowGap: 0.25 }}>
              {figures.map(([figLabel, value]) => (
                <Box key={figLabel} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: "0.8125rem" }}>
                  <Box component="span" sx={{ color: "text.secondary" }}>{figLabel}</Box>
                  <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{value}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
    <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx}>{heading}</TableCell>
            <TableCell sx={numHeadSx}>Target</TableCell>
            <TableCell sx={numHeadSx}>Team plans</TableCell>
            <TableCell sx={numHeadSx}>Plans vs target</TableCell>
            <TableCell sx={numHeadSx}>PO received</TableCell>
            <TableCell sx={numHeadSx}>Won (paid)</TableCell>
            <TableCell sx={numHeadSx}>Won % of target</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ key, label, row, notSet }) => (
            <TableRow key={key}>
              <TableCell sx={{ fontWeight: 700 }}>{label}</TableCell>
              <TableCell sx={numCellSx}>
                {row.target_lakhs === null ? <Box component="span" sx={noteSx}>{notSet}</Box> : lakhs(row.target_lakhs)}
              </TableCell>
              <TableCell sx={numCellSx}>{lakhs(row.planned_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{percent(plansVsTarget(row))}</TableCell>
              <TableCell sx={numCellSx}>{lakhs(row.po_received_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{lakhs(row.won_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{percent(row.percent_of_target)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    </>
  );
}
