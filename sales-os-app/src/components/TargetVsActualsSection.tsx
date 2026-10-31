import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, ButtonBase, IconButton, MenuItem, TextField } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LoadingOrEmpty, SectionCard } from "./ReportingUI";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { NoPoDateNote, WonBar } from "./TargetVsActualsParts";
import TargetVsActualsPerson from "./TargetVsActualsPerson";
import TargetVsActualsYear from "./TargetVsActualsYear";
import { useAuth } from "../contexts/AuthContext";
import { listSbus } from "../services/masterData";
import { getTargetVsActual, getTargetVsActualYear } from "../services/targetPlanning";
import type { QuarterState } from "../types/targetPlanning";
import { lakhs, noteSx, numCellSx, summaryLines } from "../utils/targetVsActuals";
import { formatFiscalYear, formatPlanningPeriod, getCurrentPlanningPeriod, getFiscalYearOfPeriod, shiftPlanningPeriod } from "../utils/formatter";
import { asTree } from "../utils/reportingTree";

// Local stopgap type -- listSbus returns Promise<unknown> today (see
// docs/Backlog.md "Type the shared frontend service functions properly").
interface SbuOption { id: string; name: string }

const QUARTER_STATE_LABEL: Record<QuarterState, string> = {
  CURRENT: "This quarter",
  PAST: "Past quarter",
  FUTURE: "Upcoming quarter",
};

type View = "QUARTER" | "YEAR";

export default function TargetVsActualsSection() {
  const { userProfile } = useAuth();
  const homeSbuId: string | undefined = userProfile?.sbu?.id;
  // BR-FIN-09: a team view's totals are its members' shares, so an
  // Opportunity shared with someone outside the team counts only in part.
  const isTeamView = userProfile?.role_name === "Area Manager";
  const [view, setView] = useState<View>("QUARTER");
  // In the Year view the arrows step a whole year, so switching back shows
  // the same quarter in the year being looked at.
  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const fiscalYear = getFiscalYearOfPeriod(period);
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);
  // The person whose own screen is open in the Quarter view (Redesign D4).
  const [personId, setPersonId] = useState<string | null>(null);

  // Whoever has no home SBU (Admin/GM) picks one; everyone else uses theirs.
  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: !homeSbuId,
  });
  const sbuId = homeSbuId ?? selectedSbuId ?? sbus[0]?.id ?? null;

  const query = useQuery({
    queryKey: ["planning", "target-vs-actuals", sbuId, period],
    queryFn: () => getTargetVsActual(sbuId as string, period),
    enabled: !!sbuId && view === "QUARTER",
  });
  const yearQuery = useQuery({
    // Under the Quarter view's key, so every refresh of it reaches this too.
    queryKey: ["planning", "target-vs-actuals", "year", sbuId, fiscalYear],
    queryFn: () => getTargetVsActualYear(sbuId as string, fiscalYear),
    enabled: !!sbuId && view === "YEAR",
  });
  const data = view === "QUARTER" ? query.data : undefined;
  const yearData = view === "YEAR" ? yearQuery.data : undefined;
  const active = view === "QUARTER" ? query : yearQuery;
  const step = view === "QUARTER" ? 1 : 4;
  const tree = data ? asTree(data.people) : [];
  const openPerson = data?.people.find((p) => p.user_id === personId);

  // D77: on a phone the title, the SBU and Quarter/Year boxes, and the
  // period with its arrows each take a line, so nothing leaves the card.
  const picker = (
    <Box sx={{ display: "flex", flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
        {!homeSbuId && (
          <TextField
            select
            size="small"
            value={sbuId ?? ""}
            onChange={(e) => {
              setSelectedSbuId(e.target.value);
              setPersonId(null);
            }}
            sx={{ minWidth: 140, flex: { xs: 1, sm: "none" } }}
          >
            {sbus.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          size="small"
          value={view}
          onChange={(e) => {
            setView(e.target.value as View);
            setPersonId(null);
          }}
          sx={{ minWidth: 110 }}
          slotProps={{ htmlInput: { "aria-label": "Quarter or Year" } }}
        >
          <MenuItem value="QUARTER">Quarter</MenuItem>
          <MenuItem value="YEAR">Year</MenuItem>
        </TextField>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
        <IconButton size="small" aria-label={view === "QUARTER" ? "Previous quarter" : "Previous year"} onClick={() => setPeriod((p) => shiftPlanningPeriod(p, -step))}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Box sx={{ typography: "body3", fontWeight: 700, minWidth: 96, textAlign: "center" }}>
          {view === "QUARTER" ? formatPlanningPeriod(period) : formatFiscalYear(fiscalYear)}
        </Box>
        <IconButton size="small" aria-label={view === "QUARTER" ? "Next quarter" : "Next year"} onClick={() => setPeriod((p) => shiftPlanningPeriod(p, step))}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <SectionCard title="Target vs Actuals" action={picker} stackActionOnPhone>
      <LoadingOrEmpty
        isLoading={active.isLoading}
        isError={active.isError}
        isEmpty={
          view === "QUARTER"
            ? !!data && data.people.length === 0 && Number(data.planned_lakhs) === 0 && Number(data.won_lakhs) === 0 && Number(data.po_received_lakhs) === 0 && !data.team_row?.target_lakhs && !data.sbu_row?.target_lakhs
            : !!yearData && !yearData.not_started && yearData.first_counted_period !== null && yearData.people.length === 0 && Number(yearData.won_lakhs) === 0 && !yearData.team_row?.target_lakhs && !yearData.sbu_row?.target_lakhs
        }
        emptyText={view === "QUARTER" ? "No one to show for this quarter." : "No one to show for this year."}
        errorText="Couldn't load Target vs Actuals."
        onRetry={() => active.refetch()}
      />
      {yearData && <TargetVsActualsYear data={yearData} isTeamView={isTeamView} />}
      {data && openPerson && (
        <TargetVsActualsPerson person={openPerson} periodLabel={formatPlanningPeriod(period)} onBack={() => setPersonId(null)} />
      )}
      {data && !openPerson && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={noteSx}>
            {QUARTER_STATE_LABEL[data.quarter_state]} · as of {data.as_of}
            {isTeamView && " · Totals show only your team members' shares of shared Opportunities"}
          </Box>

          {/* One block per row on a phone, a person's pushed in under their manager. */}
          <Box sx={{ overflowX: "auto" }}>
            <TableOrCards
              columns={[
                { label: "Who" },
                { label: "Target", align: "right" },
                { label: "Won (paid)", align: "right" },
                { label: "PO received", align: "right" },
                { label: "Won %" },
              ]}
            >
              {summaryLines(data.company_row, data.sbu_row, data.team_row).map(({ key, label, row, notSet }) => (
                <TocRow key={key} shaded>
                  <TocCell title sx={{ fontWeight: 700 }}>{label}</TocCell>
                  <TocCell label="Target" align="right" sx={numCellSx}>
                    {row.target_lakhs === null ? <Box component="span" sx={noteSx}>{notSet}</Box> : lakhs(row.target_lakhs)}
                  </TocCell>
                  <TocCell label="Won (paid)" align="right" sx={numCellSx}>{lakhs(row.won_lakhs)}</TocCell>
                  <TocCell label="PO received" align="right" sx={numCellSx}>{lakhs(row.po_received_lakhs)}</TocCell>
                  <TocCell label="Won %"><WonBar wonPct={row.percent_of_target} basis="of target" /></TocCell>
                </TocRow>
              ))}
              {tree.map(({ person: p, depth, managerName }) => (
                <TocRow key={p.user_id} indent={depth}>
                  <TocCell title>
                    <ButtonBase
                      onClick={() => setPersonId(p.user_id)}
                      sx={{ font: "inherit", fontWeight: "inherit", color: "primary.main", textAlign: "left", "&:hover": { textDecoration: "underline" } }}
                    >
                      {p.display_name}
                    </ButtonBase>
                    {managerName && <Box sx={{ ...noteSx, fontWeight: 400 }}>reports to {managerName}</Box>}
                  </TocCell>
                  <TocCell label="Target" align="right" sx={numCellSx}>{lakhs(p.target_lakhs)}</TocCell>
                  <TocCell label="Won (paid)" align="right" sx={numCellSx}>{lakhs(p.won_lakhs)}</TocCell>
                  <TocCell label="PO received" align="right" sx={numCellSx}>{lakhs(p.po_received_lakhs)}</TocCell>
                  <TocCell label="Won %">
                    <WonBar wonPct={p.percent_of_target} basis="of plan" />
                  </TocCell>
                </TocRow>
              ))}
            </TableOrCards>
          </Box>
          <NoPoDateNote count={data.no_po_date_count} />
        </Box>
      )}
    </SectionCard>
  );
}
