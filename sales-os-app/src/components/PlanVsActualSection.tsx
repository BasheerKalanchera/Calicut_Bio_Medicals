import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, IconButton, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { LoadingOrEmpty, SectionCard, StatTile } from "./ReportingUI";
import { useAuth } from "../contexts/AuthContext";
import { listSbus } from "../services/masterData";
import { getPlanVsActual } from "../services/targetPlanning";
import type { PlanVsActualBrand, PlanVsActualPerson, QuarterState } from "../types/targetPlanning";
import { formatLakhs, getCurrentPlanningPeriod, shiftPlanningPeriod } from "../utils/formatter";

// Local stopgap type -- listSbus returns Promise<unknown> today (see
// docs/Backlog.md "Type the shared frontend service functions properly").
interface SbuOption { id: string; name: string }

const DASH = "—";

const QUARTER_STATE_LABEL: Record<QuarterState, string> = {
  CURRENT: "This quarter",
  PAST: "Past quarter",
  FUTURE: "Upcoming quarter",
};

// Backend sends Decimals as strings; null means "not applicable" (past
// quarter's Expected, or a percent with nothing planned) and shows a dash.
function lakhs(v: string | null): string {
  return v === null ? DASH : formatLakhs(parseFloat(v));
}
function percent(v: string | null): string {
  return v === null ? DASH : `${parseFloat(v).toFixed(0)}%`;
}

const headCellSx = { fontSize: "0.6875rem", fontWeight: 900, textTransform: "uppercase", color: "#6b7280" } as const;
const numCellSx = { fontVariantNumeric: "tabular-nums", textAlign: "right" } as const;

function BrandTable({ brands }: { brands: PlanVsActualBrand[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headCellSx}>Brand</TableCell>
          <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Planned</TableCell>
          <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Won</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {brands.map((b) => (
          <TableRow key={b.brand_id}>
            <TableCell>{b.brand_name}</TableCell>
            <TableCell sx={numCellSx}>{lakhs(b.planned_lakhs)}</TableCell>
            <TableCell sx={numCellSx}>{lakhs(b.won_lakhs)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PersonDetail({ person }: { person: PlanVsActualPerson }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
      {person.plan_status === null && (
        <Box sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>No submitted plan for this quarter.</Box>
      )}
      {person.hospitals.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Hospital</TableCell>
              <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Planned</TableCell>
              <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Won</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {person.hospitals.map((h) => (
              <TableRow key={h.account_id ?? h.account_name}>
                <TableCell sx={h.account_id === null ? { fontStyle: "italic" } : undefined}>
                  {h.account_name}
                </TableCell>
                <TableCell sx={numCellSx}>{lakhs(h.planned_lakhs)}</TableCell>
                <TableCell sx={numCellSx}>{lakhs(h.won_lakhs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {person.brands.length > 0 && <BrandTable brands={person.brands} />}
      {person.late_opportunities.length > 0 && (
        <Box>
          <Box sx={{ ...headCellSx, mb: 0.5 }}>Closing date passed</Box>
          {person.late_opportunities.map((o) => (
            <Box key={o.opportunity_id} sx={{ fontSize: "0.8125rem", display: "flex", justifyContent: "space-between", gap: 2, py: 0.25 }}>
              <span>
                {o.name} — {o.account_name} (was due {o.expected_closure_date})
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{lakhs(o.value_lakhs)}</span>
            </Box>
          ))}
        </Box>
      )}
      {person.undated_opportunity_count > 0 && (
        <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
          {person.undated_opportunity_count} open {person.undated_opportunity_count === 1 ? "Opportunity has" : "Opportunities have"} no
          closing date, so {person.undated_opportunity_count === 1 ? "it isn't" : "they aren't"} counted in Expected.
        </Box>
      )}
    </Box>
  );
}

export default function PlanVsActualSection() {
  const { userProfile } = useAuth();
  const homeSbuId: string | undefined = userProfile?.sbu?.id;
  // Only Admin/GM see the whole company; everyone else sees their own scope.
  const isCompanyWide = ["Admin", "General Manager"].includes(userProfile?.role_name ?? "");
  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Whoever has no home SBU (Admin/GM) picks one; everyone else uses theirs.
  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: !homeSbuId,
  });
  const sbuId = homeSbuId ?? selectedSbuId ?? sbus[0]?.id ?? null;

  const query = useQuery({
    queryKey: ["planning", "plan-vs-actual", sbuId, period],
    queryFn: () => getPlanVsActual(sbuId as string, period),
    enabled: !!sbuId,
  });
  const data = query.data;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const picker = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {!homeSbuId && (
        <TextField select size="small" value={sbuId ?? ""} onChange={(e) => setSelectedSbuId(e.target.value)} sx={{ minWidth: 140, mr: 1 }}>
          {sbus.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>
      )}
      <IconButton size="small" aria-label="Previous quarter" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, -1))}>
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <Box sx={{ fontSize: "0.8125rem", fontWeight: 700, minWidth: 64, textAlign: "center" }}>{period}</Box>
      <IconButton size="small" aria-label="Next quarter" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, 1))}>
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <SectionCard title="Plan vs Actuals" action={picker}>
      <LoadingOrEmpty
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!!data && data.people.length === 0 && Number(data.planned_lakhs) === 0 && Number(data.won_lakhs) === 0}
        emptyText="Nothing planned or won for this quarter."
        errorText="Couldn't load Plan vs Actuals."
        onRetry={() => query.refetch()}
      />
      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {QUARTER_STATE_LABEL[data.quarter_state]} · as of {data.as_of}
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <StatTile label="Planned" value={lakhs(data.planned_lakhs)} />
            <StatTile label="Won so far" value={lakhs(data.won_lakhs)} />
            <StatTile label="Expected this quarter" value={lakhs(data.expected_lakhs)} sublabel="Open Opportunities, win-probability adjusted" />
            <StatTile
              label="Likely finish"
              value={lakhs(data.likely_finish_lakhs)}
              sublabel={data.percent_of_plan === null ? "No plan to compare with" : `${percent(data.percent_of_plan)} of plan`}
            />
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={headCellSx}>Person</TableCell>
                  <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Planned</TableCell>
                  <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Won</TableCell>
                  <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Expected</TableCell>
                  <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Likely finish</TableCell>
                  <TableCell sx={{ ...headCellSx, textAlign: "right" }}>% of plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.people.map((p) => {
                  const open = expanded.has(p.user_id);
                  return (
                    <Fragment key={p.user_id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => toggle(p.user_id)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}>
                            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          {p.display_name}
                          {p.late_opportunities.length > 0 && (
                            <Box component="span" sx={{ ml: 1, fontSize: "0.6875rem", fontWeight: 700, color: "#d03b3b" }}>
                              {p.late_opportunities.length} past closing date
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.planned_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.won_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.expected_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.likely_finish_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{percent(p.percent_of_plan)}</TableCell>
                      </TableRow>
                      {open && (
                        <TableRow>
                          <TableCell />
                          <TableCell colSpan={6}>
                            <PersonDetail person={p} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {data.zones.length > 0 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>By zone</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Planned</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Won</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.zones.map((z) => (
                    <TableRow key={z.zone_id ?? "no-zone"}>
                      <TableCell>{z.zone_name ?? "Not in a zone"}</TableCell>
                      <TableCell sx={numCellSx}>{lakhs(z.planned_lakhs)}</TableCell>
                      <TableCell sx={numCellSx}>{lakhs(z.won_lakhs)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>{isCompanyWide ? "Company total" : "Total (your view)"}</TableCell>
                    <TableCell sx={{ ...numCellSx, fontWeight: 900 }}>{lakhs(data.planned_lakhs)}</TableCell>
                    <TableCell sx={{ ...numCellSx, fontWeight: 900 }}>{lakhs(data.won_lakhs)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}

          {data.brands.length > 0 && (
            <Box sx={{ overflowX: "auto" }}>
              <BrandTable brands={data.brands} />
            </Box>
          )}
        </Box>
      )}
    </SectionCard>
  );
}
