import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import FormModal from "./FormModal";
import CloseReminderModal from "./CloseReminderModal";
import { logActivity, listAccountOpportunitiesLookup, listOpportunityReminders } from "../services/activities";
import { listAccounts, listOpportunities } from "../services/accounts";
import { SilentModalError } from "../lib/formErrors";
import { listUsers } from "../services/masterData";
import useDebouncedValue from "../hooks/useDebouncedValue";
import type { ActivityType, ReminderResponse } from "../types/api-aliases";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  opportunityId?: string;
  projectId?: string;
  projectName?: string;
  currentUserId?: string;
  onCreated?: () => void;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "VISIT",        label: "🏥 Visit" },
  { value: "CALL",         label: "📞 Call" },
  { value: "EMAIL",        label: "✉️ Email" },
  { value: "MEETING",      label: "🤝 Meeting" },
  { value: "NOTE",         label: "📝 Note" },
  { value: "MANAGER_NOTE", label: "📋 Manager Note" },
  { value: "CONFERENCE_EXPO",       label: "🎪 Conference/Expo" },
  { value: "OEM_PRODUCT_TRAINING",  label: "🎓 OEM/Product Training" },
  { value: "CERTIFICATION",         label: "📜 Certification" },
  { value: "SALES_TRAINING",        label: "📚 Sales Training" },
  { value: "SEMINAR_TRADE_SHOW",    label: "🗣️ Seminar/Trade Show" },
  { value: "OTHER_DEVELOPMENT",     label: "🌱 Other Development" },
  { value: "RELATIONSHIP_SUPPORT",  label: "🤲 Relationship Support" },
];

// BR-ACT-09: no Account required, no mandatory next action, not a valid
// Reminder-closing activity type. Kept in sync by hand with the backend's
// own SALES_DEVELOPMENT_ACTIVITY_TYPES (activity/schemas.py) — no shared
// package between frontend/backend to import this from.
const SALES_DEVELOPMENT_ACTIVITY_TYPES = new Set<ActivityType>([
  "CONFERENCE_EXPO", "OEM_PRODUCT_TRAINING", "CERTIFICATION",
  "SALES_TRAINING", "SEMINAR_TRADE_SHOW", "OTHER_DEVELOPMENT",
]);

// Local stopgap type — listUsers returns Promise<unknown> today.
// TODO(fix-at-service-layer): give this function a real return type; see
// docs/Backlog.md "Type the shared frontend service functions properly". Remove once fixed.
interface UserOption { id: string; display_name: string }
interface AccountOption { id: string; name: string }
interface OpportunityOption { id: string; name: string }

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function nowPlusDaysLocal(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function LogActivityModal({
  isOpen,
  onClose,
  accountId,
  opportunityId,
  projectId,
  projectName,
  currentUserId,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
  const [accountSearchInput, setAccountSearchInput] = useState("");
  const debouncedAccountSearch = useDebouncedValue(accountSearchInput);
  const [activityType, setActivityType] = useState<ActivityType>("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes]               = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [userId, setUserId]             = useState(currentUserId ?? "");
  const [nextActionText, setNextActionText]       = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState(nowPlusDaysLocal(1));
  const [nextActionOwnerId, setNextActionOwnerId] = useState(currentUserId ?? "");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "nextAction">("details");
  const [isUrgent, setIsUrgent] = useState(false);
  // BR-ACT-11: the open next action being closed instead of logging afresh.
  const [closingReminder, setClosingReminder] = useState<ReminderResponse | null>(null);

  const isManagerNote = activityType === "MANAGER_NOTE";
  const isSalesDevelopment = SALES_DEVELOPMENT_ACTIVITY_TYPES.has(activityType);
  const isRelationshipSupport = activityType === "RELATIONSHIP_SUPPORT";
  // BR-ACT-04: none of these carry a follow-up commitment -- Manager Note
  // isn't customer-facing, Sales Development isn't a customer interaction,
  // Relationship Support's logger has no standing access to the deal.
  const hidesNextAction = isManagerNote || isSalesDevelopment || isRelationshipSupport;

  const { data: users = [] } = useQuery({
    queryKey: ["users", "assignable"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  // Searches server-side instead of preloading every account -- a plain
  // page_size bump still silently truncates once accounts exceed the
  // backend's page_size cap (le=100, account/router.py), which is exactly
  // what happened in UAT once real hospital count passed 100 (2026-09-08).
  // Same debounced-Autocomplete pattern as Customer360Screen's parent-
  // account picker.
  const { data: accounts = [], isFetching: accountsLoading } = useQuery({
    queryKey: ["accounts", "picker", debouncedAccountSearch],
    enabled: isOpen && !accountId,
    queryFn: async () => {
      const d = await listAccounts({ search: debouncedAccountSearch || undefined, page_size: 20 });
      return d.items ?? [];
    },
  });

  const resolvedAccountId = accountId ?? (selectedAccount?.id ?? "");

  // BR-ACT-10: only fetched when Relationship Support is selected -- the
  // lookup itself is unscoped by the caller's own SBU/zone (that's the
  // whole point), but there's no reason to fetch it for any other type.
  const { data: opportunityOptions = [] } = useQuery({
    queryKey: ["opportunities", "lookup", resolvedAccountId],
    enabled: isOpen && !!resolvedAccountId && !opportunityId && isRelationshipSupport,
    queryFn: () => listAccountOpportunitiesLookup(resolvedAccountId),
  });

  // Plan D11: Customer 360 and the top bar can tie the activity to one of
  // the hospital's Opportunities -- only those the person can see
  // (RLS-scoped), unlike the BR-ACT-10 lookup above.
  const showsOpportunityPicker = !opportunityId && !!resolvedAccountId && !isRelationshipSupport && !isSalesDevelopment;
  const { data: ownOpportunityOptions = [] } = useQuery({
    queryKey: ["opportunities", "byAccount", resolvedAccountId],
    enabled: isOpen && showsOpportunityPicker,
    queryFn: async () => {
      const d = await listOpportunities(resolvedAccountId as any);
      return Array.isArray(d) ? (d as OpportunityOption[]) : [];
    },
  });

  // BR-ACT-11: while the "logged for" person (plan D2) has an open next
  // action of their own on this Opportunity, a customer-facing activity
  // there can only close it. The server refuses otherwise.
  const effectiveOpportunityId = opportunityId ?? (selectedOpportunityId || undefined);
  const loggedForUserId = userId || currentUserId || "";
  const isCustomerFacing = !hidesNextAction;
  const { data: openOpportunityReminders = [] } = useQuery({
    queryKey: ["opp-reminders", effectiveOpportunityId, false],
    enabled: isOpen && !!effectiveOpportunityId && isCustomerFacing,
    queryFn: () => listOpportunityReminders(effectiveOpportunityId!, false),
  });
  const blockingReminders = isCustomerFacing && effectiveOpportunityId
    ? openOpportunityReminders.filter((r) => !r.is_completed && r.assigned_to_user_id === loggedForUserId)
    : [];
  const mustClose = blockingReminders.length > 0;
  const loggedForName = loggedForUserId === currentUserId
    ? null
    : users.find((u) => u.id === loggedForUserId)?.display_name ?? "This person";

  useEffect(() => {
    if (!isOpen) return;
    // Resets this form's fields on open; React 18 batches these into one
    // re-render, not worth restructuring this actively-used modal for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivityType("CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setOutcomeNotes("");
    setUserId(currentUserId ?? "");
    setSelectedAccount(null);
    setAccountSearchInput("");
    setNextActionText("");
    setNextActionDueDate(nowPlusDaysLocal(1));
    setNextActionOwnerId(currentUserId ?? "");
    setSelectedOpportunityId("");
    setActiveTab("details");
    setIsUrgent(false);
    setClosingReminder(null);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (mustClose) {
      if (blockingReminders.length > 1) {
        throw new Error("Pick which open next action to close, using its Close button above.");
      }
      setClosingReminder(blockingReminders[0]);
      throw new SilentModalError();
    }
    // BR-ACT-01/BR-ACT-09: Account is required for every activity_type
    // except the six Sales Development types, which are deliberately
    // unattached.
    if (!isSalesDevelopment && !resolvedAccountId) {
      setActiveTab("details"); throw new Error("Account is required");
    }
    if (!activityType) { setActiveTab("details"); throw new Error("Activity type is required"); }
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    // BR-ACT-09: Outcome/Learning is the one required field for these
    // otherwise-lightweight entries.
    if (isSalesDevelopment && !outcomeNotes.trim()) {
      setActiveTab("details"); throw new Error("Outcome/Learning is required");
    }
    // BR-ACT-09, decision #4a: OTHER_DEVELOPMENT's label carries no
    // information on its own, unlike the other five Sales Development types.
    if (activityType === "OTHER_DEVELOPMENT" && !notes.trim()) {
      setActiveTab("details"); throw new Error("Description is required for Other Development");
    }
    // BR-ACT-10: the whole point is tying support to a specific deal, and
    // without notes the entry says nothing about what was actually done.
    if (isRelationshipSupport) {
      if (!opportunityId && !selectedOpportunityId) {
        setActiveTab("details"); throw new Error("Related Opportunity is required for Relationship Support");
      }
      if (!notes.trim()) {
        setActiveTab("details"); throw new Error("Notes describing what was done are required for Relationship Support");
      }
    }
    // BR-ACT-04: Next Action is mandatory for every activity_type except
    // MANAGER_NOTE, the Sales Development types, and Relationship Support
    // (none of them carry a follow-up commitment).
    if (!hidesNextAction) {
      if (!nextActionText.trim()) { setActiveTab("nextAction"); throw new Error("Next Action is required"); }
      if (!nextActionDueDate) { setActiveTab("nextAction"); throw new Error("Next Action Due Date is required"); }
    }
    await logActivity({
      account_id: resolvedAccountId || undefined,
      opportunity_id: opportunityId ?? (selectedOpportunityId || undefined),
      project_id: projectId,
      user_id: userId || undefined,
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim() || undefined,
      ...(isManagerNote && { is_urgent: isUrgent }),
      ...(isSalesDevelopment && { outcome_notes: outcomeNotes.trim() }),
      ...(!hidesNextAction && {
        next_action_text: nextActionText.trim(),
        next_action_due_date: new Date(nextActionDueDate).toISOString(),
        next_action_owner_id: nextActionOwnerId || undefined,
      }),
    });
    const loggedOpportunityId = opportunityId ?? (selectedOpportunityId || undefined);
    if (resolvedAccountId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "account", resolvedAccountId] });
    }
    if (loggedOpportunityId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", loggedOpportunityId] });
    }
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "project", projectId] });
    }
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
    if (loggedOpportunityId) {
      queryClient.invalidateQueries({ queryKey: ["opp-reminders", loggedOpportunityId] });
    }
    // Partial key match -- invalidates every ["activityReport", date, userFilter]
    // variant, not just today's, so the Daily Activity Report picks this up
    // immediately regardless of which date/filter it's currently showing.
    queryClient.invalidateQueries({ queryKey: ["activityReport"] });
    onCreated?.();
  }

  return (
    <>
    <FormModal
      isOpen={isOpen && !closingReminder}
      onClose={onClose}
      title="Log Activity"
      onSubmit={handleSubmit}
      submitLabel={mustClose ? "Close next action" : "Log"}
    >
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          type="button"
          onClick={() => setActiveTab("details")}
          disableRipple
          sx={{
            px: 2, py: 1, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
            borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem",
            borderBottomLeftRadius: "0.5rem", borderBottomRightRadius: "0.5rem",
            bgcolor: activeTab === "details" ? "primary.main" : "transparent",
            color: activeTab === "details" ? "#fff" : "#9ca3af",
            "&:hover": { bgcolor: activeTab === "details" ? "primary.main" : "#f3f4f6", color: activeTab === "details" ? "#fff" : "#4b5563" },
          }}
        >
          Details
        </Button>
        {!hidesNextAction && !mustClose && (
          <Button
            type="button"
            onClick={() => setActiveTab("nextAction")}
            disableRipple
            sx={{
              px: 2, py: 1, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem",
              borderBottomLeftRadius: "0.5rem", borderBottomRightRadius: "0.5rem",
              bgcolor: activeTab === "nextAction" ? "primary.main" : "transparent",
              color: activeTab === "nextAction" ? "#fff" : "#9ca3af",
              "&:hover": { bgcolor: activeTab === "nextAction" ? "primary.main" : "#f3f4f6", color: activeTab === "nextAction" ? "#fff" : "#4b5563" },
            }}
          >
            Next Action *
          </Button>
        )}
      </Box>

      <Box sx={{ minHeight: "23rem" }}>
        {activeTab === "details" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {!accountId && (
              <Autocomplete
                options={accounts}
                getOptionLabel={(a) => a.name}
                isOptionEqualToValue={(a, v) => a.id === v.id}
                value={selectedAccount}
                loading={accountsLoading}
                onChange={(_e, newValue) => { setSelectedAccount(newValue); setSelectedOpportunityId(""); }}
                onInputChange={(_e, newInputValue) => setAccountSearchInput(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={isSalesDevelopment ? "Select account (optional)" : "Select account"}
                    size="small"
                  />
                )}
                fullWidth
                size="small"
              />
            )}
            <TextField
              select
              label="Type *"
              value={activityType}
              onChange={(e) => {
                const value = e.target.value as ActivityType;
                setActivityType(value);
                if (
                  value === "MANAGER_NOTE"
                  || value === "RELATIONSHIP_SUPPORT"
                  || SALES_DEVELOPMENT_ACTIVITY_TYPES.has(value)
                ) {
                  setActiveTab("details");
                }
                // BR-ACT-10 / plan D11: Relationship Support picks from a
                // different list than every other type, so a picked
                // Opportunity is cleared on switching into or out of it --
                // and on switching to Sales Development, which has none.
                if (
                  (value === "RELATIONSHIP_SUPPORT") !== isRelationshipSupport
                  || SALES_DEVELOPMENT_ACTIVITY_TYPES.has(value)
                ) {
                  setSelectedOpportunityId("");
                }
                // Same reasoning -- a stale "Urgent" tick shouldn't silently
                // ride along onto a different (non-Manager-Note) activity type.
                if (value !== "MANAGER_NOTE") {
                  setIsUrgent(false);
                }
              }}
              fullWidth
              size="small"
            >
              {ACTIVITY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            {!mustClose && (
              <DateTimePicker
                label="Date & Time *"
                value={activityDate ? dayjs(activityDate) : null}
                onChange={(newValue) => setActivityDate(newValue ? newValue.toISOString() : "")}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            )}
            <TextField
              select
              // Unlabeled for every other activity type (unchanged) -- but
              // Manager Note is the one type where this field ("logged
              // against," BR-ACT-04) genuinely differs from who's writing
              // it, and silently defaulting to yourself here means "no one
              // to notify." A real label makes it unmissable specifically
              // for that type (2026-09-08 live testing: two managers each
              // left this on themselves, expecting the rep to be notified).
              label={isManagerNote ? "This Note Is For *" : undefined}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">Me (default)</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
              ))}
            </TextField>
            {opportunityId && (
              <Box
                sx={{
                  px: 1.5, py: 1, borderRadius: "0.75rem", fontSize: "10px", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  bgcolor: "#eff6ff", color: "primary.main",
                }}
              >
                Linked to this opportunity
              </Box>
            )}
            {showsOpportunityPicker && (
              <TextField
                select
                label="Opportunity (optional)"
                value={selectedOpportunityId}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">None — hospital-level</MenuItem>
                {ownOpportunityOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            )}
            {mustClose && (
              <Alert severity="warning">
                <Typography sx={{ fontSize: "0.8125rem", mb: 1 }}>
                  {loggedForName
                    ? `${loggedForName} has an open next action on this Opportunity. Close it, saying what happened, instead of logging a new activity.`
                    : "You have an open next action on this Opportunity. Close it, saying what happened, instead of logging a new activity."}
                </Typography>
                {blockingReminders.map((r) => (
                  <Box key={r.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 0.5 }}>
                    <Typography sx={{ fontSize: "0.75rem" }}>
                      {r.reminder_text} — due {new Date(r.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </Typography>
                    {blockingReminders.length > 1 && (
                      <Button type="button" size="small" onClick={() => setClosingReminder(r)}>Close</Button>
                    )}
                  </Box>
                ))}
              </Alert>
            )}
            {isManagerNote && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                  />
                }
                label="Urgent — notify immediately"
              />
            )}
            {/* BR-ACT-10: only shown when Relationship Support is selected
                and there's no fixed opportunityId prop -- the two never
                appear together. cabio_app_account_opportunities() (the
                lookup behind this) is unscoped by the caller's own
                SBU/zone, deliberately, since that's the entire point of
                the feature. */}
            {!opportunityId && isRelationshipSupport && (
              <TextField
                select
                label="Related Opportunity *"
                value={selectedOpportunityId}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">Select opportunity</MenuItem>
                {opportunityOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            )}
            {projectId && (
              <Box
                sx={{
                  px: 1.5, py: 1, borderRadius: "0.75rem", fontSize: "10px", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  bgcolor: "#eff6ff", color: "primary.main",
                }}
              >
                {projectName ? `Project: ${projectName}` : "Linked to this project"}
              </Box>
            )}
            {/* BR-ACT-11: what happened is written in the close form instead. */}
            {!mustClose && (
              <TextField
                label={activityType === "OTHER_DEVELOPMENT" || isRelationshipSupport ? "Description *" : "Notes"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder="What happened? Key discussion points, next steps…"
              />
            )}
            {isSalesDevelopment && (
              <TextField
                label="Outcome/Learning *"
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                multiline
                rows={2}
                fullWidth
                size="small"
                placeholder="What did you get out of it?"
              />
            )}
          </Box>
        )}

        {activeTab === "nextAction" && !hidesNextAction && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Next Action *"
              value={nextActionText}
              onChange={(e) => setNextActionText(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Call to confirm demo date"
            />
            <DateTimePicker
              label="Next Action Due Date *"
              value={nextActionDueDate ? dayjs(nextActionDueDate) : null}
              onChange={(newValue) => setNextActionDueDate(newValue ? newValue.toISOString() : "")}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
            <TextField
              select
              label="Assign Next Action To"
              value={nextActionOwnerId}
              onChange={(e) => setNextActionOwnerId(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Me (default)</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}
      </Box>
    </FormModal>

    {/* BR-ACT-11: shown in place of Log Activity. Cancel goes back to it;
        once closed, both are done. */}
    <CloseReminderModal
      isOpen={isOpen && !!closingReminder}
      onClose={() => setClosingReminder(null)}
      reminder={closingReminder}
      loggedForUserId={loggedForUserId !== currentUserId ? loggedForUserId : undefined}
      onCompleted={() => {
        setClosingReminder(null);
        onCreated?.();
        onClose();
      }}
    />
    </>
  );
}
