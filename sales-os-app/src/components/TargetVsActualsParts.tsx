import { Box } from "@mui/material";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import type { TargetVsActualSummaryRow } from "../types/targetPlanning";
import { lakhs, noteSx, numCellSx, percent, plural } from "../utils/targetVsActuals";

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
    <Box sx={{ overflowX: "auto" }}>
      <TableOrCards
        columns={[
          { label: heading },
          { label: "Target", align: "right" },
          { label: "Team plans", align: "right" },
          { label: "Plans vs target", align: "right" },
          { label: "PO received", align: "right" },
          { label: "Won (paid)", align: "right" },
          { label: "Won % of target", align: "right" },
        ]}
      >
        {rows.map(({ key, label, row, notSet }) => (
          <TocRow key={key}>
            <TocCell title sx={{ fontWeight: 700 }}>{label}</TocCell>
            <TocCell label="Target" align="right" sx={numCellSx}>
              {row.target_lakhs === null ? <Box component="span" sx={noteSx}>{notSet}</Box> : lakhs(row.target_lakhs)}
            </TocCell>
            <TocCell label="Team plans" align="right" sx={numCellSx}>{lakhs(row.planned_lakhs)}</TocCell>
            <TocCell label="Plans vs target" align="right" sx={numCellSx}>{percent(plansVsTarget(row))}</TocCell>
            <TocCell label="PO received" align="right" sx={numCellSx}>{lakhs(row.po_received_lakhs)}</TocCell>
            <TocCell label="Won (paid)" align="right" sx={numCellSx}>{lakhs(row.won_lakhs)}</TocCell>
            <TocCell label="Won % of target" align="right" sx={numCellSx}>{percent(row.percent_of_target)}</TocCell>
          </TocRow>
        ))}
      </TableOrCards>
    </Box>
  );
}
