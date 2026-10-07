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
import { getTargetVsActual } from "../services/targetPlanning";
import type {
  QuarterState,
  RosterStatus,
  TargetVsActualBrand,
  TargetVsActualPerson,
  TargetVsActualSummaryRow,
} from "../types/targetPlanning";
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

const STATUS_LABEL: Record<RosterStatus, string> = {
  NOT_STARTED: "Not started",
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLOR: Record<RosterStatus, string> = {
  NOT_STARTED: "#9ca3af",
  DRAFT: "#6b7280",
  PENDING_APPROVAL: "#b45309",
  APPROVED: "#059669",
  REJECTED: "#d03b3b",
};

// Only pending-approval and approved plans carry figures; the backend sends Draft and
// Rejected plans (and people with no plan) with planned 0 and no breakdown --
// except a rejected revision of an approved plan, which counts at its last
// approved total (BR-PL-05).
const SUBMITTED: ReadonlySet<RosterStatus> = new Set(["PENDING_APPROVAL", "APPROVED"]);

function countsAtLastApproved(p: TargetVsActualPerson): boolean {
  return p.plan_status === "REJECTED" && p.previous_approved_total_lakhs !== null;
}

const NOT_SUBMITTED_NOTE: Partial<Record<RosterStatus, string>> = {
  NOT_STARTED: "No plan started for this quarter.",
  DRAFT: "Plan is still a draft. Its figures show once it's submitted.",
  REJECTED: "Plan was sent back. Its figures show once it's resubmitted.",
};

// Backend sends Decimals as strings; null means "not applicable" (past
// quarter's Expected, or a percent with nothing to compare with) and shows a dash.
function lakhs(v: string | null): string {
  return v === null ? DASH : formatLakhs(parseFloat(v));
}
function percent(v: string | null): string {
  return v === null ? DASH : `${parseFloat(v).toFixed(0)}%`;
}
function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

const headCellSx = { fontSize: "0.6875rem", fontWeight: 900, textTransform: "uppercase", color: "#6b7280" } as const;
const numHeadSx = { ...headCellSx, textAlign: "right" } as const;
const numCellSx = { fontVariantNumeric: "tabular-nums", textAlign: "right" } as const;
const noteSx = { fontSize: "0.75rem", color: "text.secondary" } as const;

function BrandTable({ brands }: { brands: TargetVsActualBrand[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headCellSx}>Brand</TableCell>
          <TableCell sx={numHeadSx}>Planned</TableCell>
          <TableCell sx={numHeadSx}>Won</TableCell>
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

function NoPoDateNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Box sx={noteSx}>
      {count} {plural(count, "Opportunity past Order has", "Opportunities past Order have")} no PO date, so{" "}
      {plural(count, "it isn't", "they aren't")} counted in PO received.
    </Box>
  );
}

function PersonDetail({ person }: { person: TargetVsActualPerson }) {
  const note = countsAtLastApproved(person)
    ? `Revision was sent back. The last approved target (${lakhs(person.previous_approved_total_lakhs)}) still counts until a new one is approved.`
    : NOT_SUBMITTED_NOTE[person.plan_status];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
      {note && <Box sx={{ fontSize: "0.8125rem" }}>{note}</Box>}
      {person.hospitals.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Hospital</TableCell>
              <TableCell sx={numHeadSx}>Planned</TableCell>
              <TableCell sx={numHeadSx}>Won</TableCell>
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
                {(o.owner_name || Number(o.share_percentage) < 100) &&
                  ` · shared${o.owner_name ? `, owner ${o.owner_name}` : ""}, ${Number(o.share_percentage)} %`}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{lakhs(o.share_lakhs)}</span>
            </Box>
          ))}
        </Box>
      )}
      {person.undated_opportunity_count > 0 && (
        <Box sx={noteSx}>
          {person.undated_opportunity_count} open{" "}
          {plural(person.undated_opportunity_count, "Opportunity has", "Opportunities have")} no expected closure date, so{" "}
          {plural(person.undated_opportunity_count, "it isn't", "they aren't")} counted in Expected.
        </Box>
      )}
      <NoPoDateNote count={person.no_po_date_count} />
    </Box>
  );
}

// The SBU row (SBU Manager and above) and company row (Admin/GM), measured
// against the GM-entered SBU target(s).
function SummaryRows({ sbuRow, companyRow }: { sbuRow: TargetVsActualSummaryRow | null; companyRow: TargetVsActualSummaryRow | null }) {
  const rows: { key: string; label: string; row: TargetVsActualSummaryRow; notSet: string }[] = [];
  if (sbuRow) rows.push({ key: "sbu", label: "SBU", row: sbuRow, notSet: "Target not set" });
  if (companyRow) rows.push({ key: "company", label: "Company", row: companyRow, notSet: "Waits for every SBU's target" });
  if (rows.length === 0) return null;
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx}>Against SBU target</TableCell>
            <TableCell sx={numHeadSx}>Target</TableCell>
            <TableCell sx={numHeadSx}>Planned</TableCell>
            <TableCell sx={numHeadSx}>PO received</TableCell>
            <TableCell sx={numHeadSx}>Won (paid)</TableCell>
            <TableCell sx={numHeadSx}>% of target</TableCell>
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
              <TableCell sx={numCellSx}>{lakhs(row.po_received_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{lakhs(row.won_lakhs)}</TableCell>
              <TableCell sx={numCellSx}>{percent(row.percent_of_target)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default function TargetVsActualsSection() {
  const { userProfile } = useAuth();
  const homeSbuId: string | undefined = userProfile?.sbu?.id;
  // Admin/GM see everyone in the chosen SBU (the zone table's total is that
  // SBU's, not the company's -- the company figure is the company row);
  // everyone else sees their own scope.
  const isCompanyWide = ["Admin", "General Manager"].includes(userProfile?.role_name ?? "");
  // BR-FIN-09: a team view's totals are its members' shares, so an
  // Opportunity shared with someone outside the team counts only in part.
  const isTeamView = userProfile?.role_name === "Area Manager";
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
    queryKey: ["planning", "target-vs-actuals", sbuId, period],
    queryFn: () => getTargetVsActual(sbuId as string, period),
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
    <SectionCard title="Target vs Actuals" action={picker}>
      <LoadingOrEmpty
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!!data && data.people.length === 0 && Number(data.planned_lakhs) === 0 && Number(data.won_lakhs) === 0 && Number(data.po_received_lakhs) === 0}
        emptyText="No one to show for this quarter."
        errorText="Couldn't load Target vs Actuals."
        onRetry={() => query.refetch()}
      />
      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={noteSx}>
            {QUARTER_STATE_LABEL[data.quarter_state]} · as of {data.as_of}
            {data.roster_count > 0 && (
              <>
                {" · "}
                <Box component="span" sx={data.not_submitted_count > 0 ? { color: "#b45309", fontWeight: 700 } : undefined}>
                  {data.not_submitted_count} of {data.roster_count} haven't submitted a plan
                </Box>
              </>
            )}
            {isTeamView && " · Totals show only your team members' shares of shared Opportunities"}
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <StatTile label="Planned" value={lakhs(data.planned_lakhs)} sublabel="Pending approval and approved plans" />
            <StatTile label="PO received" value={lakhs(data.po_received_lakhs)} sublabel="PO dated in this quarter" />
            <StatTile
              label="Won (paid)"
              value={lakhs(data.won_lakhs)}
              sublabel={data.percent_of_target === null ? "No plan to compare with" : `${percent(data.percent_of_target)} of planned`}
            />
            <StatTile label="Expected this quarter" value={lakhs(data.expected_lakhs)} sublabel="Open Opportunities, win-probability adjusted" />
            <StatTile label="Likely finish" value={lakhs(data.likely_finish_lakhs)} sublabel="Won + Expected" />
          </Box>

          <SummaryRows sbuRow={data.sbu_row} companyRow={data.company_row} />

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={headCellSx}>Person</TableCell>
                  <TableCell sx={headCellSx}>Status</TableCell>
                  <TableCell sx={numHeadSx}>Target</TableCell>
                  <TableCell sx={numHeadSx}>PO received</TableCell>
                  <TableCell sx={numHeadSx}>Won (paid)</TableCell>
                  <TableCell sx={numHeadSx}>Expected</TableCell>
                  <TableCell sx={numHeadSx}>Likely finish</TableCell>
                  <TableCell sx={numHeadSx}>% of target</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.people.map((p) => {
                  const open = expanded.has(p.user_id);
                  const submitted = SUBMITTED.has(p.plan_status);
                  const lastApproved = countsAtLastApproved(p);
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
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: STATUS_COLOR[p.plan_status], whiteSpace: "nowrap" }}>
                          {STATUS_LABEL[p.plan_status]}
                        </TableCell>
                        <TableCell sx={numCellSx}>
                          {submitted || lastApproved ? lakhs(p.planned_lakhs) : DASH}
                          {submitted && p.previous_approved_total_lakhs !== null && (
                            <Box sx={{ ...noteSx, whiteSpace: "nowrap" }}>was {lakhs(p.previous_approved_total_lakhs)} approved</Box>
                          )}
                          {lastApproved && (
                            <Box sx={{ ...noteSx, whiteSpace: "nowrap" }}>approved, still counts</Box>
                          )}
                        </TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.po_received_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.won_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.expected_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{lakhs(p.likely_finish_lakhs)}</TableCell>
                        <TableCell sx={numCellSx}>{percent(p.percent_of_target)}</TableCell>
                      </TableRow>
                      {open && (
                        <TableRow>
                          <TableCell />
                          <TableCell colSpan={8}>
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
          <NoPoDateNote count={data.no_po_date_count} />

          {data.zones.length > 0 && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>By zone</TableCell>
                    <TableCell sx={numHeadSx}>Planned</TableCell>
                    <TableCell sx={numHeadSx}>Won</TableCell>
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
                    <TableCell sx={{ fontWeight: 900 }}>{isCompanyWide ? "SBU total" : "Total (your view)"}</TableCell>
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
