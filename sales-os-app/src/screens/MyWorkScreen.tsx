import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Checkbox, FormControlLabel, Link, MenuItem, TextField } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import dayjs from "dayjs";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import { LoadingOrEmpty, SectionCard, StatTile } from "../components/ReportingUI";
import CloseReminderModal from "../components/CloseReminderModal";
import LogActivityModal from "../components/LogActivityModal";
import { useAuth } from "../contexts/AuthContext";
import { getWeeklyFollowup } from "../services/reporting";
import { listUsers } from "../services/masterData";
import { formatLakhs } from "../utils/formatter";
import { statusColors } from "../theme/statusColors";
import { shadows } from "../theme/shadows";
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

// D30: one tab at a time, pill style copied from InsightsDashboardScreen.
// D33: always opens on Summary; a Summary box opens its tab at its list.
type TabId = "summary" | "opportunities" | "next-actions" | "hospitals";
const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "hospitals", label: "My hospitals" },
  { id: "opportunities", label: "Opportunities" },
  { id: "next-actions", label: "Next actions" },
];

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
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const chipBarRef = useRef<HTMLDivElement>(null);
  const listsRef = useRef<HTMLDivElement>(null);

  const centerTab = useCallback((tabId: TabId, behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior });
        }
      }
    }, 50);
  }, []);

  // Opens a tab at its top, or at one list when listId is given (D33).
  const openTab = useCallback((tabId: TabId, listId?: string) => {
    setActiveTab(tabId);
    centerTab(tabId);
    setTimeout(() => {
      const container = listsRef.current;
      const list = listId ? container?.querySelector(`[data-list="${listId}"]`) : null;
      if (list) list.scrollIntoView({ block: "start" });
      else container?.scrollTo({ top: 0 });
    }, 50);
  }, [centerTab]);

  // D6, D33: everything back to its default whenever the screen is left
  // (state adjusted during render, same as InsightsDashboardScreen).
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (!isActive) {
      setIdleText(String(DEFAULT_IDLE_DAYS));
      setHighChanceOnly(false);
      setUserId("");
      setActiveTab("summary");
    }
  }

  useEffect(() => {
    if (!isActive) centerTab("summary", "auto");
  }, [isActive, centerTab]);

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

  const highPriorityTitle = highChanceOnly ? "70 %+ chance" : "High priority or 70 %+";
  const notVisitedTitle = `Not visited in ${data?.idle_days ?? idleDays}+ days`;

  // D32: the hospital box's two follow-up figures, from the rows already loaded.
  const hospitalRows = data?.planned_hospitals.rows ?? [];
  const neverVisited = hospitalRows.filter((r) => !r.last_visit_date).length;
  const overdueHospitals = data
    ? hospitalRows.filter((r) => r.next_action_due && dayjs(data.today).diff(dayjs(r.next_action_due).format("YYYY-MM-DD"), "day") > 0).length
    : 0;

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* D31: "Showing" stays above the tabs, as it changes every tab. */}
      {isManagerTier && (
        <Box sx={{ px: 2, pt: 2, flexShrink: 0 }}>
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
        </Box>
      )}

      {/* Tab chip bar -- stays put while the tab content scrolls */}
      <Box sx={{ position: "relative", px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Box
          ref={chipBarRef}
          sx={{
            display: "flex", gap: 1, overflowX: "auto", pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            pr: "50vw",
          }}
        >
          {TABS.map((tab) => {
            const isOpen = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => openTab(tab.id)}
                sx={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                  borderRadius: "9999px", typography: "body2", fontWeight: 700, whiteSpace: "nowrap",
                  transition: "all 0.2s", border: "1px solid", textTransform: "none",
                  ...(isOpen
                    ? { bgcolor: "primary.main", color: "common.white", borderColor: "primary.main", boxShadow: shadows.sm }
                    : { bgcolor: "background.paper", color: "gray.500", borderColor: "gray.200", "&:hover": { borderColor: "blue.300", color: "primary.main" } }),
                }}
              >
                {isOpen && <CheckIcon fontSize="inherit" sx={{ flexShrink: 0 }} />}
                {tab.label}
              </Button>
            );
          })}
        </Box>
        <Box sx={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, pointerEvents: "none", background: (theme) => `linear-gradient(to left, ${theme.palette.background.default}, transparent)` }} />
      </Box>

      <Box ref={listsRef} sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
        {/* D31: the days box and the tick each change only an Opportunities list. */}
        {activeTab === "opportunities" && (
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
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
        )}
        <LoadingOrEmpty
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={false}
          emptyText=""
          errorText="Couldn't load My Work."
          onRetry={() => query.refetch()}
        />
        {data && highPriority && activeTab === "summary" && (
          // D32: one box per list; no grand total across boxes (D3).
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <SummaryGroup title="My hospitals">
              <StatTile
                label={`My hospitals this quarter (${data.planning_period})`}
                value={String(data.planned_hospitals.count)}
                sublabel={data.planned_hospitals.count === 0
                  ? "No approved hospital plan for this quarter."
                  : `${neverVisited} never visited · ${overdueHospitals} overdue next action`}
                onClick={() => openTab("hospitals")}
              />
            </SummaryGroup>
            <SummaryGroup title="Opportunities">
              <StatTile label={highPriorityTitle} value={String(highPriority.count)} sublabel={formatLakhs(parseFloat(highPriority.value_lakhs))} onClick={() => openTab("opportunities", "high-priority")} />
              <StatTile label="Closing date passed" value={String(data.closing_date_passed.count)} sublabel={formatLakhs(parseFloat(data.closing_date_passed.value_lakhs))} onClick={() => openTab("opportunities", "closing-date-passed")} />
              <StatTile label={notVisitedTitle} value={String(data.not_visited.count)} sublabel={formatLakhs(parseFloat(data.not_visited.value_lakhs))} onClick={() => openTab("opportunities", "not-visited")} />
            </SummaryGroup>
            <SummaryGroup title="Next actions">
              <StatTile label="Overdue next actions" value={String(data.overdue_next_actions.rows.length)} onClick={() => openTab("next-actions", "overdue")} />
              <StatTile label="Next actions due this week" value={String(data.next_actions_this_week.rows.length)} onClick={() => openTab("next-actions", "this-week")} />
            </SummaryGroup>
          </Box>
        )}
        {data && highPriority && activeTab === "opportunities" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box data-list="high-priority">
              <OpportunitySection
                title={highPriorityTitle}
                list={highPriority}
                daysLabel="Days since visit"
                days={(r) => r.days_since_contact}
                canAct={canAct}
                onSelectAccount={onSelectAccount}
                onSelectOpportunity={onSelectOpportunity}
                onLog={setLogFor}
              />
            </Box>
            <Box data-list="closing-date-passed">
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
            </Box>
            <Box data-list="not-visited">
              <OpportunitySection
                title={notVisitedTitle}
                list={data.not_visited}
                daysLabel="Days since visit"
                days={(r) => r.days_since_contact}
                overdue
                canAct={canAct}
                onSelectAccount={onSelectAccount}
                onSelectOpportunity={onSelectOpportunity}
                onLog={setLogFor}
              />
            </Box>
          </Box>
        )}
        {data && activeTab === "next-actions" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box data-list="overdue">
              <NextActionSection
                title="Overdue next actions"
                rows={data.overdue_next_actions.rows}
                today={data.today}
                canAct={canAct}
                onSelectAccount={onSelectAccount}
                onSelectOpportunity={onSelectOpportunity}
                onDone={setClosing}
              />
            </Box>
            <Box data-list="this-week">
              <NextActionSection
                title="Next actions due this week"
                rows={data.next_actions_this_week.rows}
                today={data.today}
                canAct={canAct}
                onSelectAccount={onSelectAccount}
                onSelectOpportunity={onSelectOpportunity}
                onDone={setClosing}
              />
            </Box>
          </Box>
        )}
        {data && activeTab === "hospitals" && (
          <HospitalSection
            list={data.planned_hospitals}
            planningPeriod={data.planning_period}
            today={data.today}
            canAct={canAct}
            onSelectAccount={onSelectAccount}
            onLog={(accountId) => setLogFor({ accountId })}
          />
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

function SummaryGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Box sx={{ typography: "caption", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray.500", mb: 1 }}>{title}</Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{children}</Box>
    </Box>
  );
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
