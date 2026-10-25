import { Fragment } from "react";
import { Box, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { StatTile } from "./ReportingUI";
import { NoPoDateNote, SummaryRows } from "./TargetVsActualsParts";
import type { QuarterState, TargetVsActualYearPerson, TargetVsActualYearResponse } from "../types/targetPlanning";
import { formatPlanningPeriod, getCurrentPlanningPeriod, getFiscalYearOfPeriod } from "../utils/formatter";
import { asTree } from "../utils/reportingTree";
import { DASH, headCellSx, lakhs, noteSx, numCellSx, numHeadSx, percent } from "../utils/targetVsActuals";

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
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headCellSx}>By end of</TableCell>
          <TableCell sx={numHeadSx}>Target so far</TableCell>
          <TableCell sx={numHeadSx}>Rep Plan so far</TableCell>
          <TableCell sx={numHeadSx}>Won so far</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {person.quarters.map((q) => {
          const upcoming = q.quarter_state === "FUTURE";
          return (
            <TableRow key={q.planning_period} sx={upcoming ? { "& td": dimSx } : undefined}>
              <TableCell>
                {formatPlanningPeriod(q.planning_period)}
                {UPCOMING_LABEL[q.quarter_state] && <Box component="span" sx={{ ...noteSx, ml: 1 }}>{UPCOMING_LABEL[q.quarter_state]}</Box>}
              </TableCell>
              <TableCell sx={numCellSx}>{lakhs(q.target_so_far_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{lakhs(q.planned_so_far_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{lakhs(q.won_so_far_lakhs)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
            <Box component="span" sx={data.not_submitted_count > 0 ? { color: "#b45309", fontWeight: 700 } : undefined}>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>{quarterRowLabel}, quarter by quarter</TableCell>
                <TableCell sx={numHeadSx}>Target</TableCell>
                <TableCell sx={numHeadSx}>Won (paid)</TableCell>
                <TableCell sx={numHeadSx}>Target so far</TableCell>
                <TableCell sx={numHeadSx}>Won so far</TableCell>
                <TableCell sx={numHeadSx}>Won % of target so far</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
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
                    <TableRow key={q.planning_period} sx={{ "& td": dimSx }}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{label}</TableCell>
                      <TableCell colSpan={5} sx={{ fontSize: "0.75rem" }}>No target that quarter, so not counted</TableCell>
                    </TableRow>
                  );
                }
                const upcoming = q.quarter_state === "FUTURE";
                return (
                  <TableRow key={q.planning_period} sx={upcoming ? { "& td": dimSx } : undefined}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{label}</TableCell>
                    <TableCell sx={numCellSx}>{q.target_lakhs === null ? <Box component="span" sx={noteSx}>Not set</Box> : lakhs(q.target_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(q.won_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(q.target_so_far_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(q.won_so_far_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{percent(q.percent_of_target_so_far)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* On a phone each person is a stacked block, as in the Quarter view. */}
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {tree.map(({ person: p, depth, managerName }) => {
          const open = expanded.has(p.user_id);
          const figures: [string, string][] = [
            ["Year's target", lakhs(p.target_lakhs)],
            ["Plan for year", lakhs(p.planned_lakhs)],
            ["PO received so far", lakhs(p.po_received_lakhs)],
            ["Won (paid) so far", lakhs(p.won_lakhs)],
            ["Still to win", lakhs(p.still_to_win_lakhs)],
          ];
          return (
            <Box key={p.user_id} sx={{ py: 1, borderBottom: 1, borderColor: "divider", ml: depth * 2, ...(depth > 0 && { pl: 1, borderLeft: 2, borderLeftColor: "divider" }) }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton size="small" onClick={() => toggle(p.user_id)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
                  {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontWeight: 700 }}>{p.display_name}</Box>
                  {managerName && <Box sx={noteSx}>reports to {managerName}</Box>}
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 2, rowGap: 0.25, pl: 5, pt: 0.5 }}>
                {figures.map(([label, value]) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: "0.8125rem" }}>
                    <Box component="span" sx={{ color: "text.secondary" }}>{label}</Box>
                    <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</Box>
                  </Box>
                ))}
              </Box>
              {open && (
                <Box sx={{ pl: 1, py: 1, overflowX: "auto" }}>
                  <PersonYearDetail person={p} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }} />
              <TableCell sx={headCellSx}>Person</TableCell>
              <TableCell sx={numHeadSx}>Year's target</TableCell>
              <TableCell sx={numHeadSx}>Plan for year</TableCell>
              <TableCell sx={numHeadSx}>PO received so far</TableCell>
              <TableCell sx={numHeadSx}>Won (paid) so far</TableCell>
              <TableCell sx={numHeadSx}>Still to win</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tree.map(({ person: p, depth, managerName }) => {
              const open = expanded.has(p.user_id);
              return (
                <Fragment key={p.user_id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggle(p.user_id)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
                        {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ pl: 2 + depth * 3 }}>
                      {p.display_name}
                      {managerName && <Box sx={noteSx}>reports to {managerName}</Box>}
                    </TableCell>
                    <TableCell sx={numCellSx}>{lakhs(p.target_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(p.planned_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(p.po_received_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{lakhs(p.won_lakhs)}</TableCell>
                    <TableCell sx={numCellSx}>{p.still_to_win_lakhs === null ? DASH : lakhs(p.still_to_win_lakhs)}</TableCell>
                  </TableRow>
                  {open && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={6}>
                        <PersonYearDetail person={p} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <NoPoDateNote count={data.no_po_date_count} />
    </Box>
  );
}
