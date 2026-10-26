import { Box, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { StatTile } from "./ReportingUI";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { NoPoDateNote, SummaryRows } from "./TargetVsActualsParts";
import type { QuarterState, TargetVsActualYearPerson, TargetVsActualYearResponse } from "../types/targetPlanning";
import { formatPlanningPeriod, getCurrentPlanningPeriod, getFiscalYearOfPeriod } from "../utils/formatter";
import { asTree } from "../utils/reportingTree";
import { DASH, lakhs, noteSx, numCellSx, percent } from "../utils/targetVsActuals";

// Target vs Actuals, Year view (Annual Target Planning D31, D66, D78–D80):
// running totals from the year's first counted quarter. No Expected, Likely
// finish, zones or brands (D79), and no "past closing date" note (D80).

const UPCOMING_LABEL: Record<QuarterState, string | null> = {
  CURRENT: "This quarter",
  PAST: null,
  FUTURE: "Upcoming",
};

const dimSx = { color: "text.disabled" } as const;

function PersonYearDetail({ person }: { person: TargetVsActualYearPerson }) {
  return (
    <TableOrCards
      columns={[
        { label: "By end of" },
        { label: "Target so far", align: "right" },
        { label: "Rep Plan so far", align: "right" },
        { label: "Won so far", align: "right" },
      ]}
    >
      {person.quarters.map((q) => {
        const cellSx = q.quarter_state === "FUTURE" ? { ...numCellSx, ...dimSx } : numCellSx;
        return (
          <TocRow key={q.planning_period}>
            <TocCell title sx={q.quarter_state === "FUTURE" ? dimSx : undefined}>
              {formatPlanningPeriod(q.planning_period)}
              {UPCOMING_LABEL[q.quarter_state] && <Box component="span" sx={{ ...noteSx, ml: 1 }}>{UPCOMING_LABEL[q.quarter_state]}</Box>}
            </TocCell>
            <TocCell label="Target so far" align="right" sx={cellSx}>{lakhs(q.target_so_far_lakhs)}</TocCell>
            <TocCell label="Rep Plan so far" align="right" sx={cellSx}>{lakhs(q.planned_so_far_lakhs)}</TocCell>
            <TocCell label="Won so far" align="right" sx={cellSx}>{lakhs(q.won_so_far_lakhs)}</TocCell>
          </TocRow>
        );
      })}
    </TableOrCards>
  );
}

export default function TargetVsActualsYear({
  data,
  isTeamView,
  expanded,
  toggle,
}: {
  data: TargetVsActualYearResponse;
  isTeamView: boolean;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const thisYear = getFiscalYearOfPeriod(getCurrentPlanningPeriod());
  const yearState = data.fiscal_year === thisYear ? "This year" : data.fiscal_year < thisYear ? "Past year" : "Upcoming year";
  const tree = asTree(data.people);
  const quarterRowLabel = data.team_row ? "Your team" : "SBU";
  const counted = data.first_counted_period;

  if (counted === null) {
    return <Box sx={noteSx}>Targets start in Oct–Dec 2026, so this year has nothing to count.</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={noteSx}>
        {yearState} · as of {data.as_of}
        {!counted.endsWith("-Q1") && ` · counted from ${formatPlanningPeriod(counted)}, when this year's targets start`}
        {data.roster_count !== null && data.not_submitted_count !== null && data.roster_count > 0 && (
          <>
            {" · "}
            <Box component="span" sx={data.not_submitted_count > 0 ? { color: "amber.700", fontWeight: 700 } : undefined}>
              {data.not_submitted_count} of {data.roster_count} haven't submitted a plan this quarter
            </Box>
          </>
        )}
        {isTeamView && " · Totals show only your team members' shares of shared Opportunities"}
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <StatTile label="Team plans so far" value={lakhs(data.planned_lakhs)} sublabel="Each rep's plan, pending or approved, quarters to date" />
        <StatTile label="PO received so far" value={lakhs(data.po_received_lakhs)} sublabel="PO dated this year, to date" />
        <StatTile
          label="Won (paid) so far"
          value={lakhs(data.won_lakhs)}
          sublabel={data.percent_of_target === null ? "No plan to compare with" : `${percent(data.percent_of_target)} of team plans so far`}
        />
      </Box>

      <SummaryRows heading="Against target, so far" teamRow={data.team_row} sbuRow={data.sbu_row} companyRow={data.company_row} />

      {data.quarters.length > 0 && (
        <Box sx={{ overflowX: "auto" }}>
          <TableOrCards
            columns={[
              { label: `${quarterRowLabel}, quarter by quarter` },
              { label: "Target", align: "right" },
              { label: "Won (paid)", align: "right" },
              { label: "Target so far", align: "right" },
              { label: "Won so far", align: "right" },
              { label: "Won % of target so far", align: "right" },
            ]}
          >
            {data.quarters.map((q) => {
              const label = (
                <>
                  {formatPlanningPeriod(q.planning_period)}
                  {UPCOMING_LABEL[q.quarter_state] && (
                    <Box component="span" sx={{ ...noteSx, ml: 1, whiteSpace: "nowrap" }}>{UPCOMING_LABEL[q.quarter_state]}</Box>
                  )}
                </>
              );
              if (!q.counted) {
                return (
                  <TocRow key={q.planning_period}>
                    <TocCell title sx={{ ...dimSx, whiteSpace: "nowrap" }}>{label}</TocCell>
                    <TocCell colSpan={5} sx={{ ...dimSx, typography: "caption" }}>No target that quarter, so not counted</TocCell>
                  </TocRow>
                );
              }
              const rowSx = q.quarter_state === "FUTURE" ? dimSx : undefined;
              const cellSx = { ...numCellSx, ...rowSx };
              return (
                <TocRow key={q.planning_period}>
                  <TocCell title sx={{ ...rowSx, whiteSpace: "nowrap" }}>{label}</TocCell>
                  <TocCell label="Target" align="right" sx={cellSx}>
                    {q.target_lakhs === null ? <Box component="span" sx={noteSx}>Not set</Box> : lakhs(q.target_lakhs)}
                  </TocCell>
                  <TocCell label="Won (paid)" align="right" sx={cellSx}>{lakhs(q.won_lakhs)}</TocCell>
                  <TocCell label="Target so far" align="right" sx={cellSx}>{lakhs(q.target_so_far_lakhs)}</TocCell>
                  <TocCell label="Won so far" align="right" sx={cellSx}>{lakhs(q.won_so_far_lakhs)}</TocCell>
                  <TocCell label="Won % of target so far" align="right" sx={cellSx}>{percent(q.percent_of_target_so_far)}</TocCell>
                </TocRow>
              );
            })}
          </TableOrCards>
        </Box>
      )}

      {/* One card per person on a phone, pushed in under their manager;
          the chevron opens their quarters inside it. */}
      <Box sx={{ overflowX: "auto" }}>
        <TableOrCards
          columns={[
            { toggle: true },
            { label: "Person" },
            { label: "Year's target", align: "right" },
            { label: "Plan for year", align: "right" },
            { label: "PO received so far", align: "right" },
            { label: "Won (paid) so far", align: "right" },
            { label: "Still to win", align: "right" },
          ]}
        >
          {tree.map(({ person: p, depth, managerName }) => {
            const open = expanded.has(p.user_id);
            return (
              <TocRow key={p.user_id} indent={depth} detail={open && <PersonYearDetail person={p} />}>
                <TocCell toggle>
                  <IconButton size="small" onClick={() => toggle(p.user_id)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
                    {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                  </IconButton>
                </TocCell>
                <TocCell title>
                  {p.display_name}
                  {managerName && <Box sx={{ ...noteSx, fontWeight: 400 }}>reports to {managerName}</Box>}
                </TocCell>
                <TocCell label="Year's target" align="right" sx={numCellSx}>{lakhs(p.target_lakhs)}</TocCell>
                <TocCell label="Plan for year" align="right" sx={numCellSx}>{lakhs(p.planned_lakhs)}</TocCell>
                <TocCell label="PO received so far" align="right" sx={numCellSx}>{lakhs(p.po_received_lakhs)}</TocCell>
                <TocCell label="Won (paid) so far" align="right" sx={numCellSx}>{lakhs(p.won_lakhs)}</TocCell>
                <TocCell label="Still to win" align="right" sx={numCellSx}>{p.still_to_win_lakhs === null ? DASH : lakhs(p.still_to_win_lakhs)}</TocCell>
              </TocRow>
            );
          })}
        </TableOrCards>
      </Box>
      <NoPoDateNote count={data.no_po_date_count} />
    </Box>
  );
}
