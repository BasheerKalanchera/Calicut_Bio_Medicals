import { useQueries } from "@tanstack/react-query";
import { Alert, Box, Typography } from "@mui/material";
import TableOrCards, { TocCell, TocRow } from "./TableOrCards";
import { getTeamTargets, listSbuTargets } from "../services/targetPlanning";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";

// Target & Coverage Planning > My Targets tab (Tabs plan D17). The content of
// the card only -- the screen supplies the card around it, as for its other
// tabs.
//
// Everyone but Admin sees their own quarterly target, set by the person they
// report to (Annual Target Planning D35). The General Manager has none (no
// one above sets it, BR-PL-12), so the GM sees the chosen SBU's target
// instead -- its brands' total (BR-PL-11) -- headed with the SBU's name so it
// doesn't read as the GM's own figure.

// Admin and the GM have no target of their own; the GM's card shows the
// SBU's. Both read the same requests as the Team Targets tab's cards
// (same query keys), so nothing is fetched twice.
function useMyTargetAmounts({ sbuId, periods, companyWide }: { sbuId: string; periods: string[]; companyWide: boolean }) {
  const sbuResults = useQueries({
    queries: periods.map((p) => ({
      queryKey: ["planning", "sbu-targets", p],
      queryFn: () => listSbuTargets(p),
      enabled: companyWide,
    })),
  });
  const ownResults = useQueries({
    queries: periods.map((p) => ({
      queryKey: ["planning", "team-targets", sbuId, p],
      queryFn: () => getTeamTargets(sbuId, p),
      enabled: !companyWide,
    })),
  });
  const active = companyWide ? sbuResults : ownResults;
  const amounts = periods.map((_p, i): number | null => {
    const raw = companyWide
      ? sbuResults[i].data?.find((t) => t.sbu_id === sbuId)?.target_amount_lakhs
      : ownResults[i].data?.own_target_lakhs;
    return raw === undefined || raw === null ? null : Number(raw);
  });
  return { amounts, isLoading: active.some((r) => r.isPending), isError: active.some((r) => r.isError) };
}

const headingSx = { fontWeight: 700 };

function notSet() {
  return <Typography component="span" color="text.secondary">Not set yet</Typography>;
}

// Quarter view: one figure for the quarter.
export function MyTargetCard({ sbuId, sbuName, period, companyWide }: {
  sbuId: string;
  sbuName: string | null;
  period: string;
  companyWide: boolean;
}) {
  const { amounts, isLoading, isError } = useMyTargetAmounts({ sbuId, periods: [period], companyWide });
  const heading = companyWide ? `${sbuName ?? "SBU"} SBU target` : "My Target";
  const label = formatPlanningPeriod(period);
  if (isError) {
    return <Alert severity="error">Couldn't load the target. Refresh to try again.</Alert>;
  }
  const amount = amounts[0];
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: 1.5, mb: 0.5 }}>
        <Typography variant="h6" sx={headingSx}>{heading}</Typography>
        {isLoading ? (
          <Typography component="span" color="text.secondary">…</Typography>
        ) : amount !== null ? (
          <Typography component="span" variant="lead" sx={headingSx}>{formatLakhs(amount)}</Typography>
        ) : (
          notSet()
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {companyWide
          ? `The total of this SBU's brand targets for ${label}, set on Brand Target Tracking. You have no target of your own.`
          : `Your target for ${label}, set by the person you report to.`}
      </Typography>
    </>
  );
}

// Annual view: the four quarters and their total.
export function AnnualMyTargetsCard({ sbuId, sbuName, quarters, yearLabel, companyWide }: {
  sbuId: string;
  sbuName: string | null;
  quarters: string[];
  yearLabel: string;
  companyWide: boolean;
}) {
  const { amounts, isLoading, isError } = useMyTargetAmounts({ sbuId, periods: quarters, companyWide });
  const heading = companyWide ? `${sbuName ?? "SBU"} SBU target` : "My Targets";
  if (isError) {
    return <Alert severity="error">Couldn't load the targets. Refresh to try again.</Alert>;
  }
  const set = amounts.filter((v): v is number => v !== null);
  const total = set.length > 0 ? set.reduce((a, b) => a + b, 0) : null;
  const show = (v: number | null) => (isLoading ? "…" : v !== null ? formatLakhs(v) : notSet());
  return (
    <>
      <Typography variant="h6" sx={{ ...headingSx, mb: 0.5 }}>{heading}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {companyWide
          ? "The total of this SBU's brand targets, set on Brand Target Tracking. You have no target of your own."
          : "Your target for each quarter, set by the person you report to."}
      </Typography>
      {/* One card on a phone: the year is its title, the quarters inside. */}
      <TableOrCards columns={[{ label: "Period" }, { label: "Target" }]}>
        <TocRow
          total
          subRows={quarters.map((q, i) => (
            <TocRow key={q}>
              <TocCell title sx={{ pl: { sm: 3 }, color: "text.secondary" }}>{formatPlanningPeriod(q)}</TocCell>
              <TocCell label="Target">{show(amounts[i])}</TocCell>
            </TocRow>
          ))}
        >
          <TocCell title>{yearLabel} — Annual Total</TocCell>
          <TocCell label="Total">{show(total)}</TocCell>
        </TocRow>
      </TableOrCards>
    </>
  );
}
