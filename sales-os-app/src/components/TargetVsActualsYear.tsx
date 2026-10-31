import { Box } from "@mui/material";
import dayjs from "dayjs";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { WonBar } from "./TargetVsActualsParts";
import type { TargetVsActualYearResponse } from "../types/targetPlanning";
import { formatFiscalYear, formatPlanningPeriod, getCurrentPlanningPeriod, getFiscalYearOfPeriod } from "../utils/formatter";
import { asTree } from "../utils/reportingTree";
import { lakhs, noteSx, numCellSx, summaryLines } from "../utils/targetVsActuals";

// Target vs Actuals, Year view (Redesign D2, D6; Annual Target Planning D66,
// D81; Simpler Table D2, D4): one table of running totals from the year's
// first counted quarter. Names are not links here (Redesign D4).

export default function TargetVsActualsYear({ data, isTeamView }: { data: TargetVsActualYearResponse; isTeamView: boolean }) {
  // D6: a year that hasn't started has nothing to show but when it does.
  if (data.not_started) {
    return (
      <Box sx={noteSx}>
        {formatFiscalYear(data.fiscal_year)} starts in {dayjs(data.starts_on).format("MMM YYYY")} — nothing to show yet.
      </Box>
    );
  }
  const counted = data.first_counted_period;
  if (counted === null) {
    return <Box sx={noteSx}>Targets start in Oct–Dec 2026, so this year has nothing to count.</Box>;
  }

  const thisYear = getFiscalYearOfPeriod(getCurrentPlanningPeriod());
  const yearState = data.fiscal_year === thisYear ? "This year" : data.fiscal_year < thisYear ? "Past year" : "Upcoming year";
  const tree = asTree(data.people);
  const lines = summaryLines(data.company_row, data.sbu_row, data.team_row);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={noteSx}>
        {yearState} · as of {data.as_of}
        {!counted.endsWith("-Q1") && ` · counted from ${formatPlanningPeriod(counted)}, when this year's targets start`}
        {isTeamView && " · Totals show only your team members' shares of shared Opportunities"}
      </Box>

      {/* One block per row on a phone, a person's pushed in under their manager. */}
      <Box sx={{ overflowX: "auto" }}>
        <TableOrCards
          columns={[
            { label: "Who" },
            { label: "Target so far", align: "right" },
            { label: "Won (paid) so far", align: "right" },
            { label: "PO received so far", align: "right" },
            { label: "Won % of target" },
          ]}
        >
          {lines.map(({ key, label, row, notSet }) => (
            <TocRow key={key} shaded>
              <TocCell title sx={{ fontWeight: 700 }}>{label}</TocCell>
              <TocCell label="Target so far" align="right" sx={numCellSx}>
                {row.target_lakhs === null ? <Box component="span" sx={noteSx}>{notSet}</Box> : lakhs(row.target_lakhs)}
              </TocCell>
              <TocCell label="Won (paid) so far" align="right" sx={numCellSx}>{lakhs(row.won_lakhs)}</TocCell>
              <TocCell label="PO received so far" align="right" sx={numCellSx}>{lakhs(row.po_received_lakhs)}</TocCell>
              <TocCell label="Won % of target"><WonBar wonPct={row.percent_of_target} /></TocCell>
            </TocRow>
          ))}
          {tree.map(({ person: p, depth, managerName }) => (
            <TocRow key={p.user_id} indent={depth}>
              <TocCell title>
                {p.display_name}
                {managerName && <Box sx={{ ...noteSx, fontWeight: 400 }}>reports to {managerName}</Box>}
              </TocCell>
              <TocCell label="Target so far" align="right" sx={numCellSx}>{lakhs(p.target_lakhs)}</TocCell>
              <TocCell label="Won (paid) so far" align="right" sx={numCellSx}>{lakhs(p.won_lakhs)}</TocCell>
              <TocCell label="PO received so far" align="right" sx={numCellSx}>{lakhs(p.po_received_lakhs)}</TocCell>
              <TocCell label="Won % of target"><WonBar wonPct={p.percent_of_target} /></TocCell>
            </TocRow>
          ))}
        </TableOrCards>
      </Box>
    </Box>
  );
}
