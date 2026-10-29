import type { ReactNode } from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { StatTile } from "./ReportingUI";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { NoPoDateNote, TileCell, TileGrid, WonBar } from "./TargetVsActualsParts";
import type { TargetVsActualPerson } from "../types/targetPlanning";
import { lakhs, noteSx, numCellSx, percent, plural, ratio } from "../utils/targetVsActuals";

// One person's own screen in Target vs Actuals' Quarter view (Redesign D4,
// D10): their four boxes, By hospital and By brand (Planned against Won), and
// the notes on Opportunities with a missing date.

// A name column plus Planned and Won, ending in a Total line.
function PlannedWonTable({ heading, rows, totalPlanned, totalWon }: {
  heading: string;
  rows: { key: string; name: string; planned: string; won: string; italic?: boolean }[];
  totalPlanned: number;
  totalWon: number;
}) {
  return (
    <TableOrCards columns={[{ label: heading }, { label: "Planned", align: "right" }, { label: "Won", align: "right" }]}>
      {rows.map((r) => (
        <TocRow key={r.key}>
          <TocCell title sx={r.italic ? { fontStyle: "italic" } : undefined}>{r.name}</TocCell>
          <TocCell label="Planned" align="right" sx={numCellSx}>{lakhs(r.planned)}</TocCell>
          <TocCell label="Won" align="right" sx={numCellSx}>{lakhs(r.won)}</TocCell>
        </TocRow>
      ))}
      <TocRow total shaded>
        <TocCell title>Total</TocCell>
        <TocCell label="Planned" align="right" sx={numCellSx}>{lakhs(String(totalPlanned))}</TocCell>
        <TocCell label="Won" align="right" sx={numCellSx}>{lakhs(String(totalWon))}</TocCell>
      </TocRow>
    </TableOrCards>
  );
}

function sum(values: string[]): number {
  return values.reduce((s, v) => s + parseFloat(v), 0);
}

export default function TargetVsActualsPerson({
  person,
  periodLabel,
  onBack,
}: {
  person: TargetVsActualPerson;
  periodLabel: string;
  onBack: () => void;
}) {
  const wonPct = ratio(person.won_lakhs, person.target_lakhs);
  const likelyPct = ratio(person.likely_finish_lakhs, person.target_lakhs);
  // A name sits on a line of its own so a long one wraps rather than pushing the button.
  const section = (title: string, body: ReactNode) => (
    <Box>
      <Box sx={{ typography: "caption", fontWeight: 900, textTransform: "uppercase", color: "gray.500", mb: 0.5 }}>{title}</Box>
      {body}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Button size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} sx={{ textTransform: "none" }}>
          Back
        </Button>
        <Box sx={{ typography: "body1", fontWeight: 700 }}>{person.display_name}</Box>
        <Box sx={noteSx}>{periodLabel}</Box>
      </Box>

      <TileGrid columns={4}>
        <TileCell><StatTile inGrid label="Target" value={lakhs(person.target_lakhs)} /></TileCell>
        <TileCell>
          <StatTile inGrid label="Won (paid)" value={lakhs(person.won_lakhs)} sublabel={`PO received ${lakhs(person.po_received_lakhs)}`} />
        </TileCell>
        <TileCell>
          <StatTile inGrid label="Won % of target" value={percent(wonPct)}>
            <WonBar wonPct={wonPct} />
          </StatTile>
        </TileCell>
        <TileCell>
          <StatTile
            inGrid
            label="Likely finish"
            value={lakhs(person.likely_finish_lakhs)}
            sublabel={likelyPct === null ? undefined : `${percent(likelyPct)} of target`}
          />
        </TileCell>
      </TileGrid>

      {person.hospitals.length > 0 &&
        section(
          "By hospital",
          <PlannedWonTable
            heading="Hospital"
            rows={person.hospitals.map((h) => ({
              key: h.account_id ?? h.account_name,
              name: h.account_name,
              planned: h.planned_lakhs,
              won: h.won_lakhs,
              italic: h.account_id === null,
            }))}
            totalPlanned={sum(person.hospitals.map((h) => h.planned_lakhs))}
            totalWon={sum(person.hospitals.map((h) => h.won_lakhs))}
          />,
        )}
      {person.brands.length > 0 &&
        section(
          "By brand",
          <PlannedWonTable
            heading="Brand"
            rows={person.brands.map((b) => ({ key: b.brand_id, name: b.brand_name, planned: b.planned_lakhs, won: b.won_lakhs }))}
            totalPlanned={sum(person.brands.map((b) => b.planned_lakhs))}
            totalWon={sum(person.brands.map((b) => b.won_lakhs))}
          />,
        )}
      {person.hospitals.length === 0 && person.brands.length === 0 && (
        <Box sx={noteSx}>No planned hospitals or brands to show for this quarter.</Box>
      )}

      {(person.undated_opportunity_count > 0 || person.no_po_date_count > 0) && (
        <Box sx={{ ...noteSx, borderTop: 1, borderColor: "divider", pt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {person.undated_opportunity_count > 0 && (
            <Box>
              {person.undated_opportunity_count} open{" "}
              {plural(person.undated_opportunity_count, "Opportunity has", "Opportunities have")} no expected closure date, so{" "}
              {plural(person.undated_opportunity_count, "it isn't", "they aren't")} counted in Likely finish.
            </Box>
          )}
          <NoPoDateNote count={person.no_po_date_count} />
        </Box>
      )}
    </Box>
  );
}
