import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, ButtonBase, Checkbox, FormControlLabel, Link, MenuItem, TextField } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";
import TableOrCards, { TocCell, TocRow } from "../components/TableOrCards";
import { LoadingOrEmpty, SectionCard } from "../components/ReportingUI";
import CloseReminderModal from "../components/CloseReminderModal";
import LogActivityModal from "../components/LogActivityModal";
import { useAuth } from "../contexts/AuthContext";
import { getWeeklyFollowup } from "../services/reporting";
import { listUsers } from "../services/masterData";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";
import { statusColors } from "../theme/statusColors";
import { shadows } from "../theme/shadows";
import type { MyWorkRequest } from "../types/reporting";
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

// D34: the Opportunities tab shows one list at a time, picked by a row of small tabs.
type OppListId = "high-priority" | "closing-date-passed" | "not-visited";
type NextListId = "overdue" | "this-week";

type Selected = { id: string; name: string };

interface Props {
  isActive: boolean;
  onSelectAccount: (account: Selected) => void;
  onSelectOpportunity: (opportunity: Selected) => void;
  // Set by Insights' Overdue tab (Redesign D11).
  startRequest?: MyWorkRequest | null;
}

export default function MyWorkScreen({ isActive, onSelectAccount, onSelectOpportunity, startRequest }: Props) {
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
  const [oppList, setOppList] = useState<OppListId>("high-priority");
  const [nextList, setNextList] = useState<NextListId>("this-week");
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

  // Opens a tab at its top, or at one list when listId is given (D33, D34,
  // D38: on Opportunities and Next actions that means its small tab).
  const openTab = useCallback((tabId: TabId, listId?: string) => {
    setActiveTab(tabId);
    if (tabId === "opportunities" && listId) setOppList(listId as OppListId);
    if (tabId === "next-actions" && listId) setNextList(listId as NextListId);
    centerTab(tabId);
    setTimeout(() => listsRef.current?.scrollTo({ top: 0 }), 50);
  }, [centerTab]);

  // Redesign D11: Insights' Overdue tab opens this screen on one person's
  // list. A new request (new nonce) sets who is shown, the tab and its small
  // tab (the list); the chip bar is centred once, below.
  const [start, setStart] = useState<{ tabId: TabId; nonce: number } | null>(null);
  const [handledNonce, setHandledNonce] = useState<number | null>(startRequest?.nonce ?? null);
  const scrolledNonce = useRef<number | null>(null);

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
      setStart(null);
      setOppList("high-priority");
      setNextList("this-week");
    }
  }

  if (isActive && startRequest && startRequest.nonce !== handledNonce) {
    setHandledNonce(startRequest.nonce);
    setStart({ tabId: startRequest.tabId, nonce: startRequest.nonce });
    setUserId(startRequest.userId === profile?.id ? "" : startRequest.userId);
    setActiveTab(startRequest.tabId);
    // The list is a small tab on each of these two tabs (My Work D33, D38).
    if (startRequest.tabId === "opportunities") setOppList(startRequest.listId as OppListId);
    if (startRequest.tabId === "next-actions") setNextList(startRequest.listId as NextListId);
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

  // The tab and its small tab were set when the request arrived; this only
  // centres the tab's chip, once per request.
  useEffect(() => {
    if (!start || scrolledNonce.current === start.nonce) return;
    scrolledNonce.current = start.nonce;
    centerTab(start.tabId);
  }, [start, centerTab]);

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

      {/* D34, D40: small tabs pick the Opportunities / Next actions list and
          stay put, like the tab bar above, while the list scrolls; the days
          box and the tick show only on the list each one changes (D31). */}
      {(activeTab === "opportunities" || activeTab === "next-actions") && (
        <Box sx={{ px: 2, flexShrink: 0 }}>
          {activeTab === "opportunities" && (
            <SubTabs
              value={oppList}
              onChange={setOppList}
              tabs={[
                { id: "high-priority", label: highPriorityTitle },
                { id: "closing-date-passed", label: "Closing date passed" },
                { id: "not-visited", label: notVisitedTitle },
              ]}
            />
          )}
          {activeTab === "next-actions" && (
            <SubTabs
              value={nextList}
              onChange={setNextList}
              tabs={[
                { id: "this-week", label: "Next actions due this week" },
                { id: "overdue", label: "Overdue next actions" },
              ]}
            />
          )}
          {activeTab === "opportunities" && oppList === "not-visited" && (
            <Box sx={{ mb: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Not visited for (days)"
                value={idleText}
                onChange={(e) => setIdleText(e.target.value)}
                slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
                sx={{ width: 170, mt: 1 }}
              />
            </Box>
          )}
          {activeTab === "opportunities" && oppList === "high-priority" && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={highChanceOnly} onChange={(e) => setHighChanceOnly(e.target.checked)} />}
                label="70 %+ only"
              />
            </Box>
          )}
        </Box>
      )}

      <Box ref={listsRef} sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 2, pb: 2 }}>
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
          // D41: coloured edge per kind of list; a 0 goes grey and quiet.
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <SummaryGroup title="My hospitals" icon="🏥">
              <SummaryTile
                label={`My hospitals this quarter (${formatPlanningPeriod(data.planning_period)})`}
                value={data.planned_hospitals.count}
                tone="info"
                detail={data.planned_hospitals.count === 0
                  ? "No approved hospital plan for this quarter."
                  : `${neverVisited} never visited · ${overdueHospitals} overdue next action`}
                onClick={() => openTab("hospitals")}
              />
            </SummaryGroup>
            <SummaryGroup title="Opportunities" icon="📈" columns={3}>
              <SummaryTile label={highPriorityTitle} value={highPriority.count} tone="info" pill={formatLakhs(parseFloat(highPriority.value_lakhs))} onClick={() => openTab("opportunities", "high-priority")} />
              <SummaryTile label="Closing date passed" value={data.closing_date_passed.count} tone="danger" pill={formatLakhs(parseFloat(data.closing_date_passed.value_lakhs))} onClick={() => openTab("opportunities", "closing-date-passed")} />
              <SummaryTile label={notVisitedTitle} value={data.not_visited.count} tone="warning" pill={formatLakhs(parseFloat(data.not_visited.value_lakhs))} onClick={() => openTab("opportunities", "not-visited")} />
            </SummaryGroup>
            <SummaryGroup title="Next actions" icon="✅">
              <SummaryTile label="Overdue next actions" value={data.overdue_next_actions.rows.length} tone="danger" onClick={() => openTab("next-actions", "overdue")} />
              <SummaryTile label="Next actions due this week" value={data.next_actions_this_week.rows.length} tone="success" onClick={() => openTab("next-actions", "this-week")} />
            </SummaryGroup>
          </Box>
        )}
        {data && highPriority && activeTab === "opportunities" && (
          <>
            {oppList === "high-priority" && (
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
            )}
            {oppList === "closing-date-passed" && (
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
            )}
            {oppList === "not-visited" && (
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
            )}
          </>
        )}
        {data && activeTab === "next-actions" && (
          nextList === "overdue" ? (
            <NextActionSection
              title="Overdue next actions"
              overdueList
              rows={data.overdue_next_actions.rows}
              today={data.today}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onDone={setClosing}
            />
          ) : (
            <NextActionSection
              title="Next actions due this week"
              rows={data.next_actions_this_week.rows}
              today={data.today}
              canAct={canAct}
              onSelectAccount={onSelectAccount}
              onSelectOpportunity={onSelectOpportunity}
              onDone={setClosing}
            />
          )
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

// D34, D38: the small tabs under Opportunities and Next actions. Equal widths
// on one row (D39): a long label wraps onto a second line inside its button
// instead of pushing the last small tab onto a new row on a phone.
function SubTabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (id: T) => void;
  tabs: { id: T; label: string }[];
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      {tabs.map((t) => (
        <Button
          key={t.id}
          size="small"
          variant={value === t.id ? "contained" : "outlined"}
          onClick={() => onChange(t.id)}
          sx={{ flex: "1 1 0", minWidth: 0, minHeight: 44, px: 0.5, textTransform: "none", typography: "caption", fontWeight: 700, lineHeight: 1.2 }}
        >
          {t.label}
        </Button>
      ))}
    </Box>
  );
}

// The icon is the same emoji the side menu uses for that area (D41).
function SummaryGroup({ title, icon, columns = 2, children }: { title: string; icon: string; columns?: number; children: ReactNode }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}>
        <Box
          component="span"
          sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, flexShrink: 0, typography: "h5", lineHeight: 1 }}
        >
          {icon}
        </Box>
        <Box sx={{ typography: "body2", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.primary" }}>{title}</Box>
      </Box>
      {/* One box per row on a phone; from tablet width, `columns` per row. */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, 1fr)` } }}>{children}</Box>
    </Box>
  );
}

// D41: a Summary box. The coloured left edge and figure show the kind of
// list; a figure of 0 turns grey so the eye goes to what needs attention.
function SummaryTile({
  label,
  value,
  tone,
  pill,
  detail,
  onClick,
}: {
  label: string;
  value: number;
  tone: "info" | "danger" | "warning" | "success";
  pill?: string;
  detail?: string;
  onClick: () => void;
}) {
  const colors = value === 0 ? statusColors.neutral : statusColors[tone];
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, textAlign: "left", font: "inherit",
        minHeight: 84, p: 2, bgcolor: "background.paper", borderRadius: "1rem", border: 1, borderColor: "gray.100",
        borderLeft: 6, borderLeftColor: colors.text, boxShadow: shadows.sm, transition: "border-color 0.2s",
        "&:hover": { borderColor: "blue.300", borderLeftColor: colors.text },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ typography: "body2", fontWeight: 700, color: value === 0 ? "gray.500" : "text.primary" }}>{label}</Box>
        {pill && (
          <Box component="span" sx={{ display: "inline-block", mt: 0.75, typography: "caption", fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: colors.bg, color: colors.text }}>
            {pill}
          </Box>
        )}
        {detail && <Box sx={{ typography: "caption", color: "gray.500", mt: 0.5 }}>{detail}</Box>}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <Box sx={{ typography: "h4", fontWeight: 900, color: colors.text, fontVariantNumeric: "tabular-nums" }}>{value}</Box>
        <ChevronRightIcon sx={{ color: "gray.400" }} />
      </Box>
    </ButtonBase>
  );
}

// D35: a column headed "Days ..." shows the bare number (the word "days" made
// the cell wrap at tablet width); `unit` is for a column whose heading doesn't
// say what the number is.
function DaysBadge({ days, overdue, unit }: { days: number; overdue?: boolean; unit?: string }) {
  const colors = overdue ? statusColors.overdue : statusColors.warning;
  return (
    <Box component="span" sx={{ typography: "caption", fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, whiteSpace: "nowrap", bgcolor: colors.bg, color: colors.text }}>
      {days}{unit ? ` ${unit}` : ""}
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
    <SectionCard title={sectionTitle(`My hospitals this quarter (${formatPlanningPeriod(planningPeriod)})`, list.count)}>
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
                  {daysLate === null ? "—" : daysLate > 0 ? <DaysBadge days={daysLate} overdue unit={daysLate === 1 ? "day overdue" : "days overdue"} /> : dayjs(r.next_action_due).format(daysLate === 0 ? "[Today] h:mm A" : "ddd D MMM")}
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
  overdueList,
  rows,
  today,
  canAct,
  onSelectAccount,
  onSelectOpportunity,
  onDone,
}: {
  title: string;
  overdueList?: boolean;
  rows: ReminderResponse[];
  today: string;
  canAct: boolean;
  onSelectAccount: (account: Selected) => void;
  onSelectOpportunity: (opportunity: Selected) => void;
  onDone: (reminder: ReminderResponse) => void;
}) {
  // D21: next-action cards show a count only. D35: the overdue list's column
  // is "Days overdue" (bare number); the due-this-week list's is "Due" (a date).
  const dueLabel = overdueList ? "Days overdue" : "Due";
  return (
    <SectionCard title={sectionTitle(title, rows.length)}>
      {rows.length === 0 ? <Nothing /> : (
        <TableOrCards
          columns={[
            { label: "Next action" },
            { label: "Hospital" },
            { label: "Opportunity" },
            { label: dueLabel, align: "right" },
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
                <TocCell label={dueLabel} align="right">
                  {overdueList || daysLate > 0
                    ? <DaysBadge days={Math.max(daysLate, 0)} overdue />
                    : dayjs(r.due_date).format(daysLate === 0 ? "[Today] h:mm A" : "ddd D MMM")}
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
