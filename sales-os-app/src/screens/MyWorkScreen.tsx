import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Checkbox, FormControlLabel, Link, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import { LoadingOrEmpty, SectionCard } from "../components/ReportingUI";
import CloseReminderModal from "../components/CloseReminderModal";
import LogActivityModal from "../components/LogActivityModal";
import { useAuth } from "../contexts/AuthContext";
import { getWeeklyFollowup } from "../services/reporting";
import { listUsers } from "../services/masterData";
import { formatLakhs } from "../utils/formatter";
import { statusColors } from "../theme/statusColors";
import type {
  ReminderResponse,
  WeeklyFollowupHospitalList,
  WeeklyFollowupOpportunityList,
  WeeklyFollowupOpportunityRow,
} from "../types/api-aliases";

// My Work -- the formal name is Weekly Follow-up (signed requirement 11.1);
// docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md.

// D6: opens at 30 days, and back to 30 each time the screen is opened.
const DEFAULT_IDLE_DAYS = 30;
// The server refuses more than ten years (idle_days le=3650).
const MAX_IDLE_DAYS = 3650;
// D3: the "70 %+ only" tick box.
const HIGH_CHANCE = 70;
// Who may look at someone else's My Work (D1: "Me" or one rep, no team view).
const MANAGER_TIER_ROLES = new Set(["SBU Manager", "Area Manager", "Admin", "General Manager"]);

type Selected = { id: string; name: string };

interface Props {
  isActive: boolean;
  onSelectAccount: (account: Selected) => void;
  onSelectOpportunity: (opportunity: Selected) => void;
}

export default function MyWorkScreen({ isActive, onSelectAccount, onSelectOpportunity }: Props) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const profile = userProfile as { id?: string; role_name?: string } | null;
  const isManagerTier = MANAGER_TIER_ROLES.has(profile?.role_name ?? "");

  const [idleText, setIdleText] = useState(String(DEFAULT_IDLE_DAYS));
  const [highChanceOnly, setHighChanceOnly] = useState(false);
  const [userId, setUserId] = useState("");
  const [closing, setClosing] = useState<ReminderResponse | null>(null);
  const [logFor, setLogFor] = useState<{ accountId: string; opportunityId?: string } | null>(null);

  // D6: everything back to its default whenever the screen is left (state
  // adjusted during render, same as InsightsDashboardScreen).
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (!isActive) {
      setIdleText(String(DEFAULT_IDLE_DAYS));
      setHighChanceOnly(false);
      setUserId("");
    }
  }

  // A blank, zero, non-whole-number ("30.9", "1e3") or over-ten-years box
  // keeps showing the last good number's lists.
  const typed = /^\d+$/.test(idleText) ? Number.parseInt(idleText, 10) : 0;
  const [idleDays, setIdleDays] = useState(DEFAULT_IDLE_DAYS);
  if (typed >= 1 && typed <= MAX_IDLE_DAYS && typed !== idleDays) setIdleDays(typed);

  const { data: team = [] } = useQuery({
    queryKey: ["users", "scoped"],
    enabled: isManagerTier,
    queryFn: () => listUsers("scoped"),
  });
  const others = team.filter((u) => u.id !== profile?.id);

  const query = useQuery({
    queryKey: ["reporting", "weekly-followup", userId, idleDays],
    queryFn: () => getWeeklyFollowup(idleDays, userId || undefined),
    placeholderData: keepPreviousData,
    // Always mounted (DemoApp), so only fetch while the screen is open.
    enabled: isActive,
  });
  const data = query.data;

  // D15: closing a next action records a visit or call as if it happened,
  // so someone else's lists are view-only. Not while the previous person's
  // lists are still on screen (keepPreviousData) after switching back to Me.
  const canAct = !userId && !query.isPlaceholderData;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["reporting", "weekly-followup"] });
  }

  const highPriority: WeeklyFollowupOpportunityList | undefined = data && highChanceOnly
    ? (() => {
        const rows = data.high_priority.rows.filter((r) => parseFloat(r.win_probability) >= HIGH_CHANCE);
        const value = rows.reduce((sum, r) => sum + parseFloat(r.value_lakhs), 0);
        return { count: rows.length, value_lakhs: String(value), rows };
      })()
    : data?.high_priority;

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        {isManagerTier && (
          <TextField
            select
            size="small"
            label="Showing"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            sx={{ minWidth: 200, mt: 1 }}
          >
            <MenuItem value="">Me</MenuItem>
            {others.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          size="small"
          type="number"
          label="Not visited for (days)"
          value={idleText}
          onChange={(e) => setIdleText(e.target.value)}
          slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
          sx={{ width: 170, mt: 1 }}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={highChanceOnly} onChange={(e) => setHighChanceOnly(e.target.checked)} />}
          label="70 %+ only"
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2, pt: 1 }}>
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={false}
          emptyText=""
          errorText="Couldn't load My Work."
          onRetry={() => query.refetch()}
        />
        {data && highPriority && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <OpportunitySection
              title={highChanceOnly ? "70 %+ chance" : "High priority or 70 %+"}
              list={highPriority}
              daysLabel="Days since visit"
              days={(r) => r.days_since_contact}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onLog={setLogFor}
            />
            <OpportunitySection
              title="Closing date passed"
              list={data.closing_date_passed}
              daysLabel="Days past closing"
              days={(r) => r.days_past_closing ?? 0}
              overdue
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onLog={setLogFor}
            />
            <OpportunitySection
              title={`Not visited in ${data.idle_days}+ days`}
              list={data.not_visited}
              daysLabel="Days since visit"
              days={(r) => r.days_since_contact}
              overdue
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onLog={setLogFor}
            />
            <NextActionSection
              title="Overdue next actions"
              rows={data.overdue_next_actions.rows}
              today={data.today}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onDone={setClosing}
            />
            <NextActionSection
              title="Next actions due this week"
              rows={data.next_actions_this_week.rows}
              today={data.today}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onDone={setClosing}
            />
            <HospitalSection
              list={data.planned_hospitals}
              planningPeriod={data.planning_period}
              today={data.today}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onLog={(accountId) => setLogFor({ accountId })}
            />
          </Box>
        )}
      </Box>

      <CloseReminderModal
        isOpen={!!closing}
        onClose={() => setClosing(null)}
        reminder={closing}
        onCompleted={() => { setClosing(null); refresh(); }}
      />
      <LogActivityModal
        isOpen={!!logFor}
        onClose={() => setLogFor(null)}
        accountId={logFor?.accountId}
        opportunityId={logFor?.opportunityId}
        currentUserId={profile?.id}
        onCreated={refresh}
      />
    </Box>
  );
}

function sectionTitle(title: string, count: number) {
  return `${title} · ${count}`;
}

function DaysBadge({ days, overdue }: { days: number; overdue?: boolean }) {
  const colors = overdue ? statusColors.overdue : statusColors.warning;
  return (
    <Box component="span" sx={{ typography: "caption", fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: colors.bg, color: colors.text }}>
      {days} {days === 1 ? "day" : "days"}
    </Box>
  );
}

function NameLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Link component="button" type="button" underline="hover" onClick={onClick} sx={{ textAlign: "left", typography: "body2", fontWeight: 600 }}>
      {children}
    </Link>
  );
}

function Nothing() {
  return <Box sx={{ color: "text.secondary", typography: "body2", fontStyle: "italic" }}>Nothing here.</Box>;
}

function OpportunitySection({
  title,
  list,
  daysLabel,
  days,
  overdue,
  canAct,
  onSelectAccount,
  onSelectOpportunity,
  onLog,
}: {
  title: string;
  list: WeeklyFollowupOpportunityList;
  daysLabel: string;
  days: (row: WeeklyFollowupOpportunityRow) => number;
  overdue?: boolean;
  canAct: boolean;
  onSelectAccount: (account: Selected) => void;
  onSelectOpportunity: (opportunity: Selected) => void;
  onLog: (target: { accountId: string; opportunityId: string }) => void;
}) {
  // D3/D21: each Opportunity card shows its own count and ₹ total.
  return (
    <SectionCard
      title={sectionTitle(title, list.count)}
      action={<Box sx={{ typography: "body2", fontWeight: 700 }}>{formatLakhs(parseFloat(list.value_lakhs))}</Box>}
    >
      {list.rows.length === 0 ? <Nothing /> : (
        <TableOrCards
          columns={[
            { label: "Opportunity" },
            { label: "Hospital" },
            { label: "Stage" },
            { label: "Chance", align: "right" },
            { label: "Value", align: "right" },
            { label: daysLabel, align: "right" },
            ...(canAct ? [{ label: "", align: "right" as const }] : []),
          ]}
        >
          {list.rows.map((r) => (
            <TocRow key={r.opportunity_id}>
              <TocCell title>
                <NameLink onClick={() => onSelectOpportunity({ id: r.opportunity_id, name: r.opportunity_name })}>{r.opportunity_name}</NameLink>
              </TocCell>
              <TocCell label="Hospital">
                <NameLink onClick={() => onSelectAccount({ id: r.account_id, name: r.account_name })}>{r.account_name}</NameLink>
              </TocCell>
              <TocCell label="Stage">{r.stage_name}</TocCell>
              <TocCell label="Chance" align="right">{parseFloat(r.win_probability)} %</TocCell>
              <TocCell label="Value" align="right">{formatLakhs(parseFloat(r.value_lakhs))}</TocCell>
              <TocCell label={daysLabel} align="right"><DaysBadge days={days(r)} overdue={overdue} /></TocCell>
              {canAct && (
                <TocCell action align="right">
                  <Button size="small" variant="outlined" onClick={() => onLog({ accountId: r.account_id, opportunityId: r.opportunity_id })}>
                    Log Activity
                  </Button>
                </TocCell>
              )}
            </TocRow>
          ))}
        </TableOrCards>
      )}
    </SectionCard>
  );
}

function HospitalSection({
  list,
  planningPeriod,
  today,
  canAct,
  onSelectAccount,
  onLog,
}: {
  list: WeeklyFollowupHospitalList;
  planningPeriod: string;
  today: string;
  canAct: boolean;
  onSelectAccount: (account: Selected) => void;
  onLog: (accountId: string) => void;
}) {
  // "My hospitals this quarter": the hospitals on the approved plan, never
  // visited first. Last visit is this person's own (D27, D28); next action is
  // their earliest open one at the hospital (D29).
  return (
    <SectionCard title={sectionTitle(`My hospitals this quarter (${planningPeriod})`, list.count)}>
      {list.rows.length === 0 ? (
        <Box sx={{ color: "text.secondary", typography: "body2", fontStyle: "italic" }}>
          No approved hospital plan for this quarter.
        </Box>
      ) : (
        <TableOrCards
          columns={[
            { label: "Hospital" },
            { label: "Last visit", align: "right" },
            { label: "Next action due", align: "right" },
            ...(canAct ? [{ label: "", align: "right" as const }] : []),
          ]}
        >
          {list.rows.map((r) => {
            const daysAgo = r.last_visit_date ? dayjs(today).diff(dayjs(r.last_visit_date).format("YYYY-MM-DD"), "day") : null;
            const daysLate = r.next_action_due ? dayjs(today).diff(dayjs(r.next_action_due).format("YYYY-MM-DD"), "day") : null;
            return (
              <TocRow key={r.account_id}>
                <TocCell title>
                  <NameLink onClick={() => onSelectAccount({ id: r.account_id, name: r.account_name })}>{r.account_name}</NameLink>
                </TocCell>
                <TocCell label="Last visit" align="right">
                  {daysAgo === null ? "Never" : `${dayjs(r.last_visit_date).format("D MMM")} · ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`}
                </TocCell>
                <TocCell label="Next action due" align="right">
                  {daysLate === null ? "—" : daysLate > 0 ? <DaysBadge days={daysLate} overdue /> : dayjs(r.next_action_due).format(daysLate === 0 ? "[Today] h:mm A" : "ddd D MMM")}
                </TocCell>
                {canAct && (
                  <TocCell action align="right">
                    <Button size="small" variant="outlined" onClick={() => onLog(r.account_id)}>Log Activity</Button>
                  </TocCell>
                )}
              </TocRow>
            );
          })}
        </TableOrCards>
      )}
    </SectionCard>
  );
}

function NextActionSection({
  title,
  rows,
  today,
  canAct,
  onSelectAccount,
  onSelectOpportunity,
  onDone,
}: {
  title: string;
  rows: ReminderResponse[];
  today: string;
  canAct: boolean;
  onSelectAccount: (account: Selected) => void;
  onSelectOpportunity: (opportunity: Selected) => void;
  onDone: (reminder: ReminderResponse) => void;
}) {
  // D21: next-action cards show a count only.
  return (
    <SectionCard title={sectionTitle(title, rows.length)}>
      {rows.length === 0 ? <Nothing /> : (
        <TableOrCards
          columns={[
            { label: "Next action" },
            { label: "Hospital" },
            { label: "Opportunity" },
            { label: "Due", align: "right" },
            ...(canAct ? [{ label: "", align: "right" as const }] : []),
          ]}
        >
          {rows.map((r) => {
            const account = r.activity.account;
            const opportunity = r.activity.opportunity;
            const daysLate = dayjs(today).diff(dayjs(r.due_date).format("YYYY-MM-DD"), "day");
            return (
              <TocRow key={r.id}>
                <TocCell title><Box sx={{ whiteSpace: "pre-line" }}>{r.reminder_text}</Box></TocCell>
                <TocCell label="Hospital">
                  {account ? <NameLink onClick={() => onSelectAccount(account)}>{account.name}</NameLink> : "—"}
                </TocCell>
                <TocCell label="Opportunity">
                  {opportunity ? <NameLink onClick={() => onSelectOpportunity(opportunity)}>{opportunity.name}</NameLink> : "—"}
                </TocCell>
                <TocCell label="Due" align="right">
                  {daysLate > 0 ? <DaysBadge days={daysLate} overdue /> : dayjs(r.due_date).format(daysLate === 0 ? "[Today] h:mm A" : "ddd D MMM")}
                </TocCell>
                {canAct && (
                  <TocCell action align="right">
                    <Button size="small" variant="contained" onClick={() => onDone(r)}>Done</Button>
                  </TocCell>
                )}
              </TocRow>
            );
          })}
        </TableOrCards>
      )}
    </SectionCard>
  );
}
