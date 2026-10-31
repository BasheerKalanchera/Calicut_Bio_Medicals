import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import FormModal from "./FormModal";
import QuickLeadModal from "./QuickLeadModal";
import { completeReminder, listAccountReminders, listOpportunityReminders } from "../services/activities";
import { listUsers } from "../services/masterData";
import { getOpportunity } from "../services/opportunities";
import { useAuth } from "../contexts/AuthContext";
import { SilentModalError } from "../lib/formErrors";
import type { ActivityType, ReminderResponse } from "../types/api-aliases";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reminder: ReminderResponse | null;
  onCompleted?: () => void;
  // Plan D2 (docs/Next-Action-Rules-Implementation-Plan.md): Log Activity's
  // "logged for" person, when a manager closes a rep's next action from
  // there -- the closing activity is recorded under the rep. Left out,
  // the server records it under whoever is closing.
  loggedForUserId?: string;
  // BR-ACT-11: what Log Activity already had filled in when it switched to
  // closing the open next action, so nothing is typed twice.
  initial?: { activity_type?: ActivityType; activity_date?: string; notes?: string };
  // Plan D22: Log Activity with two or more open next actions on the
  // Opportunity -- `reminder` is left out and the rep ticks which of these
  // to close (at least one). Without it, the form offers the same person's
  // other open ones at the same level -- the Opportunity, or with none the
  // Project or hospital (plan D13) -- as "Also close".
  closeChoices?: ReminderResponse[];
  // Plan D14/D15: the "Why this change?" pop-up after the Opportunity Edit
  // form's Save. `reminder` is ignored; the changer picks one of their own
  // open next actions to close, or with none writes a Note. Nothing is sent
  // from here -- onSave saves it with the stage or status change (BR-OP-22).
  stageChange?: {
    ownReminders: ReminderResponse[];
    newStatus: { code: string; name: string };
    reactivationDate?: string;
    onSave: (note: StageChangeNote) => Promise<void>;
  };
  // Plan D19 (BR-OP-21): the "First activity" pop-up after the New
  // Opportunity form's Create. `reminder` is ignored; a next action is
  // always required, and goes to the Opportunity's owner unless changed
  // (D16). Nothing is sent from here -- onSave creates the Opportunity
  // with it. `initial` pre-fills from a marketing lead's note (D5) or the
  // hospital close form (D17).
  firstActivity?: {
    ownerName?: string;
    initial?: { activity_type?: ActivityType; activity_date?: string; notes?: string };
    onSave: (activity: FirstActivity) => Promise<void>;
  };
}

// Mirrors the server's FirstActivity (opportunity/schemas.py).
export interface FirstActivity {
  activity_type: ActivityType;
  activity_date: string;
  notes: string;
  next_action_text: string;
  next_action_due_date: string;
  next_action_owner_id?: string;
}

// Mirrors the server's StageChangeNote (opportunity/schemas.py).
export interface StageChangeNote {
  close_reminder_id?: string;
  activity_type: ActivityType;
  activity_date: string;
  notes: string;
  next_action_text?: string;
  next_action_due_date?: string;
  next_action_owner_id?: string;
}

// BR-ACT-05: what was done to close this Next Action. MANAGER_NOTE
// deliberately excluded — internal manager-to-rep guidance, not a customer
// interaction, doesn't describe what closed a customer follow-up.
const CLOSING_ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "VISIT",   label: "🏥 Visit" },
  { value: "CALL",    label: "📞 Call" },
  { value: "EMAIL",   label: "✉️ Email" },
  { value: "MEETING", label: "🤝 Meeting" },
  { value: "NOTE",    label: "📝 Note" },
];

// BR-ACT-05 change: the two Opportunity statuses whose next action may
// close with no follow-up. Matched by code, same as the server.
const FOLLOW_UP_EXEMPT_STATUS_CODES = new Set(["WON", "LOST"]);

// Local stopgap type — listUsers returns Promise<unknown> today. See
// LogActivityModal.tsx's identical note.
interface UserOption { id: string; display_name: string }

type Tab = "details" | "followUp";

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

export default function CloseReminderModal({ isOpen, onClose, reminder: reminderProp, onCompleted, loggedForUserId, initial: initialProp, closeChoices, stageChange, firstActivity }: Props) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const currentUserId = (userProfile as any)?.id;
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [activityType, setActivityType] = useState<ActivityType>("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes] = useState("");
  // Follow-up is required (BR-ACT-05 change), so these start filled in:
  // the closed next action's own text, for the rep to edit (plan D10),
  // and "tomorrow", same default as Log Activity's next action.
  const [nextActionText, setNextActionText] = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState("");
  const [nextActionOwnerId, setNextActionOwnerId] = useState("");
  // Plan D3: hospital-level next actions only.
  const [producedNewOpportunity, setProducedNewOpportunity] = useState(false);
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);
  const [notice, setNotice] = useState<{ severity: "info" | "error"; text: string } | null>(null);
  // The Opportunity the create form saved. A ref as well as state: the
  // create form calls onCreated and then its own onClose in the same
  // tick, before a state update would be visible to that onClose.
  const producedOpportunityRef = useRef<string | null>(null);
  const [producedOpportunityId, setProducedOpportunityId] = useState<string | null>(null);
  // Stage-change mode: which of the changer's own open next actions to close.
  const [pickedReminderId, setPickedReminderId] = useState("");
  // Plan D22: the ticked next actions (none start ticked), and whether the
  // rep has typed in the follow-up box -- until then it follows the ticks.
  const [tickedIds, setTickedIds] = useState<string[]>([]);
  const [followUpEdited, setFollowUpEdited] = useState(false);

  const ownReminders = stageChange?.ownReminders ?? [];
  const plainClose = !stageChange && !firstActivity;
  const contextReminder = reminderProp ?? closeChoices?.[0] ?? null;
  const opportunityId = plainClose ? contextReminder?.activity.opportunity?.id : undefined;

  // Plan D22: with a next action pressed, the same person's other open ones
  // on this Opportunity (same key as Log Activity's fetch).
  const { data: openOnOpportunity = [] } = useQuery({
    queryKey: ["opp-reminders", opportunityId, false],
    enabled: isOpen && plainClose && !closeChoices && !!reminderProp && !!opportunityId,
    queryFn: () => listOpportunityReminders(opportunityId!, false),
  });
  // Hospital-next-action plan D13: with no Opportunity, the same person's
  // other open ones at the same level -- the Project, or the hospital with
  // no Project. Same key as Log Activity's fetch, so it's usually cached.
  const levelAccountId = reminderProp?.activity.account?.id;
  const levelProjectId = reminderProp?.activity.project?.id;
  // Plan D14: the server returns only that person's, at that level.
  const levelPersonId = reminderProp?.assigned_to_user_id;
  const { data: openAtLevel = [] } = useQuery({
    queryKey: ["account-reminders", levelAccountId, "level", levelProjectId ?? "hospital", levelPersonId],
    enabled: isOpen && plainClose && !closeChoices && !!reminderProp && !opportunityId
      && !!levelAccountId && !!levelPersonId,
    queryFn: () => listAccountReminders(levelAccountId!, {
      assignedToUserId: levelPersonId,
      ...(levelProjectId ? { projectId: levelProjectId } : { hospitalLevelOnly: true }),
    }),
  });
  const sameLevelChoices = (reminderProp && !opportunityId
    ? openAtLevel.filter((r) => !r.is_completed && r.id !== reminderProp.id)
    : []);
  const tickChoices = closeChoices ?? (reminderProp
    ? (opportunityId
      ? openOnOpportunity.filter((r) => !r.is_completed && r.id !== reminderProp.id
          && r.assigned_to_user_id === reminderProp.assigned_to_user_id)
      : sameLevelChoices)
    : []);
  // Everything being closed: the pressed one, if any, and the ticked ones.
  const closingFor = (ids: string[]) => [
    ...(reminderProp && !closeChoices ? [reminderProp] : []),
    ...tickChoices.filter((r) => ids.includes(r.id)),
  ].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const closing = closingFor(tickedIds);

  const reminder = firstActivity
    ? null
    : stageChange ? ownReminders.find((r) => r.id === pickedReminderId) ?? null
    : closeChoices ? closing[0] ?? null : reminderProp;
  const alsoCloseIds = closing.filter((r) => r.id !== reminder?.id).map((r) => r.id);
  // Stage-change mode with no open next action of one's own: a Note (D14).
  const noteOnly = !!stageChange && ownReminders.length === 0;
  const accountId = (plainClose ? contextReminder : reminder)?.activity.account?.id;
  // "Hospital level" here means no Opportunity: it covers Project-level next
  // actions too (hospital-next-action plan D12), whose new Opportunity is
  // created under that Project.
  const isHospitalLevel = plainClose && !!reminder && !opportunityId;
  const projectId = isHospitalLevel ? reminder?.activity.project?.id : undefined;

  const { data: users = [] } = useQuery({
    queryKey: ["users", "assignable"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  // Same key as the Opportunity page's own fetch, so it's usually cached.
  const { data: opportunity } = useQuery({
    queryKey: ["opportunity", opportunityId],
    enabled: isOpen && !stageChange && !!opportunityId,
    queryFn: () => getOpportunity(opportunityId!),
  });
  // Stage-change mode reads the status being saved, not the current one (D12).
  const statusCode = stageChange ? stageChange.newStatus.code : opportunity?.status.status_code;
  const statusName = stageChange ? stageChange.newStatus.name : opportunity?.status.status_name;
  const followUpExempt = FOLLOW_UP_EXEMPT_STATUS_CODES.has(statusCode ?? "");

  useEffect(() => {
    if (!isOpen) return;
    // Resets this form's fields on open; React 18 batches these into one
    // re-render, not worth restructuring this actively-used modal for.
    // Stage-change mode: a single own next action is picked already (D15).
    const onlyOwn = stageChange?.ownReminders.length === 1 ? stageChange.ownReminders[0] : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab("details");
    setPickedReminderId(onlyOwn?.id ?? "");
    const initial = firstActivity?.initial ?? initialProp;
    // Only a type this form offers; Log Activity has more.
    const initialType = CLOSING_ACTIVITY_TYPES.some((t) => t.value === initial?.activity_type)
      ? initial?.activity_type
      : undefined;
    setActivityType(noteOnly ? "NOTE" : initialType ?? "CALL");
    setActivityDate(initial?.activity_date || nowLocal());
    setNotes(initial?.notes ?? "");
    setNextActionText(followUpExempt ? "" : (stageChange ? onlyOwn : reminderProp)?.reminder_text ?? "");
    // BR-OP-02: On Hold starts the follow-up on the re-activation date (same time of day).
    const onHoldDue = stageChange?.newStatus.code === "ON_HOLD" && stageChange.reactivationDate;
    setNextActionDueDate(onHoldDue
      ? `${stageChange.reactivationDate}${nowPlusDaysLocal(1).slice(10)}`
      : nowPlusDaysLocal(1));
    setNextActionOwnerId("");
    setTickedIds([]);
    setFollowUpEdited(false);
    setProducedNewOpportunity(false);
    setShowNewOpportunity(false);
    setNotice(null);
    producedOpportunityRef.current = null;
    setProducedOpportunityId(null);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Won/Lost needs no follow-up, so the box isn't pre-filled there (a
  // pre-filled box would be sent as a new next action). In the plain close
  // form the status arrives after opening, so clear the pre-fill then --
  // the pressed one's text or the ticked ones' (D22), not what was typed.
  useEffect(() => {
    if (!isOpen || !followUpExempt || stageChange || followUpEdited) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNextActionText("");
  }, [isOpen, followUpExempt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Plan D22: the follow-up box starts as the ticked ones' text, one per
  // line, soonest due first -- until the rep types in it.
  function toggleTicked(id: string, ticked: boolean) {
    const next = ticked ? [...tickedIds, id] : tickedIds.filter((t) => t !== id);
    setTickedIds(next);
    if (followUpEdited || followUpExempt) return;
    setNextActionText(closingFor(next).map((r) => r.reminder_text).join("\n"));
  }

  // Won/Lost: a blank follow-up box means none. Otherwise it's required --
  // unless the D3 box is ticked, which replaces it with the new Opportunity.
  const sendsFollowUp = !producedNewOpportunity && (!followUpExempt || nextActionText.trim().length > 0);

  async function sendClose(producedId: string | null) {
    if (!reminder) return;
    await completeReminder(reminder.id, {
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim(),
      ...(loggedForUserId && { user_id: loggedForUserId }),
      ...(alsoCloseIds.length > 0 && { also_close_ids: alsoCloseIds }),
      ...(producedId
        ? { produced_opportunity_id: producedId }
        : sendsFollowUp && {
            next_action_text: nextActionText.trim(),
            next_action_due_date: new Date(nextActionDueDate).toISOString(),
            next_action_owner_id: nextActionOwnerId || loggedForUserId || currentUserId || undefined,
          }),
    });
    // The backend creates a real Activity to document this closure (BR-ACT-05)
    // — invalidate the Activity tab query it lands in, same as LogActivityModal
    // does for a normally-logged one, so it shows up without a hard refresh.
    // reminder.activity.account is typed optional (BR-ACT-09 widened
    // ActivityContextNested), but a Reminder can only ever descend from an
    // account-having Activity in practice -- the six Sales Development types
    // never carry a Next Action, so never produce one. Guarded anyway.
    if (accountId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "account", accountId] });
    }
    if (opportunityId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", opportunityId] });
      queryClient.invalidateQueries({ queryKey: ["opp-reminders", opportunityId] });
    }
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "project", projectId] });
    }
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
    queryClient.invalidateQueries({ queryKey: ["account-reminders"] });
    queryClient.invalidateQueries({ queryKey: ["project-reminders"] });
    // Same reasoning as above -- the closing Activity should show up in the
    // Daily Activity Report immediately too, not just the Activity tab.
    queryClient.invalidateQueries({ queryKey: ["activityReport"] });
    onCompleted?.();
  }

  async function handleStageChangeSubmit() {
    if (!stageChange) return;
    setNotice(null);
    if (!noteOnly && !reminder) { setActiveTab("details"); throw new Error("Pick the next action to close"); }
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    if (!notes.trim()) { setActiveTab("details"); throw new Error("Say why the stage or status changed"); }
    if (sendsFollowUp) {
      if (!nextActionText.trim()) { setActiveTab("followUp"); throw new Error("Follow-up next action is required"); }
      if (!nextActionDueDate) { setActiveTab("followUp"); throw new Error("Follow-up due date is required"); }
      // BR-OP-22: mirrors the server's On Hold check (compared as a day).
      if (statusCode === "ON_HOLD" && stageChange.reactivationDate
          && dayjs(nextActionDueDate).format("YYYY-MM-DD") > stageChange.reactivationDate) {
        setActiveTab("followUp");
        throw new Error("For an On Hold Opportunity, the next action must be due on or before the re-activation date.");
      }
    }
    await stageChange.onSave({
      ...(reminder && { close_reminder_id: reminder.id }),
      activity_type: noteOnly ? "NOTE" : activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim(),
      ...(sendsFollowUp && {
        next_action_text: nextActionText.trim(),
        next_action_due_date: new Date(nextActionDueDate).toISOString(),
        next_action_owner_id: nextActionOwnerId || currentUserId || undefined,
      }),
    });
  }

  async function handleFirstActivitySubmit() {
    if (!firstActivity) return;
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    if (!notes.trim()) { setActiveTab("details"); throw new Error("Say what happened"); }
    if (!nextActionText.trim()) { setActiveTab("followUp"); throw new Error("Next action is required"); }
    if (!nextActionDueDate) { setActiveTab("followUp"); throw new Error("Next action due date is required"); }
    await firstActivity.onSave({
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim(),
      next_action_text: nextActionText.trim(),
      next_action_due_date: new Date(nextActionDueDate).toISOString(),
      // Left out, the server gives it to the Opportunity's owner (D16).
      ...(nextActionOwnerId && { next_action_owner_id: nextActionOwnerId }),
    });
  }

  async function handleSubmit() {
    if (firstActivity) return handleFirstActivitySubmit();
    if (stageChange) return handleStageChangeSubmit();
    if (closeChoices && !reminder) { setActiveTab("details"); throw new Error("Tick the next actions to close"); }
    if (!reminder) return;
    setNotice(null);
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    if (!notes.trim()) { setActiveTab("details"); throw new Error("Notes describing what was done are required to close a Next Action."); }
    if (producedNewOpportunity) {
      // Already saved on an earlier try whose close then failed: retry the
      // close only, never a second Opportunity.
      if (producedOpportunityId) { await sendClose(producedOpportunityId); return; }
      // Plan D3: the close is sent only once the new Opportunity is saved.
      setShowNewOpportunity(true);
      throw new SilentModalError();
    }
    if (sendsFollowUp) {
      if (!nextActionText.trim()) { setActiveTab("followUp"); throw new Error("Follow-up next action is required"); }
      if (!nextActionDueDate) { setActiveTab("followUp"); throw new Error("Follow-up due date is required"); }
    }
    await sendClose(null);
  }

  async function handleOpportunityCreated(created: { id: string }) {
    producedOpportunityRef.current = created.id;
    setProducedOpportunityId(created.id);
    try {
      await sendClose(created.id);
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setNotice({
        severity: "error",
        text: `The new Opportunity was saved, but closing the next action failed: ${axiosErr.response?.data?.detail ?? axiosErr.message ?? "Something went wrong"}. Press Complete to try again.`,
      });
    }
  }

  function handleNewOpportunityClosed() {
    setShowNewOpportunity(false);
    if (producedOpportunityRef.current) return;
    // Plan D3: cancelled, so no Opportunity -- back to a required follow-up.
    setProducedNewOpportunity(false);
    setActiveTab("followUp");
    setNotice({ severity: "info", text: "No new Opportunity was saved, so add a follow-up next action to close this one." });
  }

  const followUpRequired = !producedNewOpportunity && !followUpExempt;

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={firstActivity ? "First activity" : stageChange ? "Why this change?" : "Close Next Action"}
        onSubmit={handleSubmit}
        submitLabel={firstActivity ? "Create" : stageChange ? "Save" : "Complete"}
        disableEnforceFocus={showNewOpportunity}
      >
        {firstActivity && (
          <Typography sx={{ fontSize: "0.75rem", color: "#4b5563" }}>
            Every new Opportunity starts with the conversation that led to it, and a next action. Create saves all three together.
          </Typography>
        )}
        {/* Plan D15: more than one of the changer's own -- they pick which to close. */}
        {ownReminders.length > 1 && (
          <TextField
            select
            label="Next action to close *"
            value={pickedReminderId}
            onChange={(e) => {
              const picked = ownReminders.find((r) => r.id === e.target.value);
              setPickedReminderId(e.target.value);
              setNextActionText(followUpExempt ? "" : picked?.reminder_text ?? "");
            }}
            fullWidth
            size="small"
            sx={{ mt: 1.5 }}
          >
            {[...ownReminders]
              .sort((a, b) => a.due_date.localeCompare(b.due_date))
              .map((r) => (
                <MenuItem key={r.id} value={r.id} sx={{ whiteSpace: "normal" }}>
                  {r.reminder_text} — due {dayjs(r.due_date).format("D MMM YYYY")}
                </MenuItem>
              ))}
          </TextField>
        )}
        {noteOnly && (
          <Typography sx={{ fontSize: "0.75rem", color: "#4b5563" }}>
            You have no open next action on this Opportunity, so this is saved as a Note.
          </Typography>
        )}
        {reminder && ownReminders.length <= 1 && !closeChoices && (
          <Box sx={{ px: 1.5, py: 1, borderRadius: "0.75rem", bgcolor: "#f9fafb", fontSize: "0.75rem", color: "#4b5563" }}>
            <Box sx={{ fontWeight: 700, color: "#374151" }}>
              {/* "your" only in stage-change mode: Close can be for someone else's (loggedForUserId). */}
              Closing {stageChange ? "your" : "this"} next action (due {dayjs(reminder.due_date).format("D MMM")}):
            </Box>
            <Box sx={{ whiteSpace: "pre-line" }}>{reminder.reminder_text}</Box>
          </Box>
        )}
        {/* Plan D22: close several of one person's at once; none start ticked. */}
        {tickChoices.length > 0 && (
          <Box sx={{ px: 1.5, py: 1, borderRadius: "0.75rem", bgcolor: "#f9fafb", fontSize: "0.75rem", color: "#4b5563" }}>
            <Box sx={{ fontWeight: 700, color: "#374151" }}>
              {closeChoices ? "Next actions to close *" : "Also close:"}
            </Box>
            {[...tickChoices]
              .sort((a, b) => a.due_date.localeCompare(b.due_date))
              .map((r) => (
                <FormControlLabel
                  key={r.id}
                  sx={{ display: "flex", alignItems: "flex-start", m: 0, mt: 0.5 }}
                  control={
                    <Checkbox
                      size="small"
                      sx={{ p: 0.25, mr: 1 }}
                      checked={tickedIds.includes(r.id)}
                      onChange={(e) => toggleTicked(r.id, e.target.checked)}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}>
                      {r.reminder_text} — due {dayjs(r.due_date).format("D MMM YYYY")}
                    </Typography>
                  }
                />
              ))}
          </Box>
        )}

        {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}

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
          <Button
            type="button"
            onClick={() => setActiveTab("followUp")}
            disableRipple
            sx={{
              px: 2, py: 1, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem",
              borderBottomLeftRadius: "0.5rem", borderBottomRightRadius: "0.5rem",
              bgcolor: activeTab === "followUp" ? "primary.main" : "transparent",
              color: activeTab === "followUp" ? "#fff" : "#9ca3af",
              "&:hover": { bgcolor: activeTab === "followUp" ? "primary.main" : "#f3f4f6", color: activeTab === "followUp" ? "#fff" : "#4b5563" },
            }}
          >
            Follow-up{followUpRequired ? " *" : ""}
          </Button>
        </Box>

        <Box sx={{ minHeight: "16rem" }}>
          {activeTab === "details" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                label="Type *"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                disabled={noteOnly}
                fullWidth
                size="small"
              >
                {CLOSING_ACTIVITY_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
              <DateTimePicker
                label="Date & Time *"
                value={activityDate ? dayjs(activityDate) : null}
                onChange={(newValue) => setActivityDate(newValue ? newValue.toISOString() : "")}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
              <TextField
                label={firstActivity ? "What happened? *" : stageChange ? "Why the change? *" : "What was done? *"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder={firstActivity
                  ? "e.g. Met the radiology HOD; they want a CT quote"
                  : stageChange
                    ? "e.g. Demo done, the radiologist approved; quote requested"
                    : "e.g. Called the customer, confirmed demo date for next week"}
              />
              <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
                {firstActivity
                  ? "Required — saved as this Opportunity's first activity."
                  : stageChange
                  ? (noteOnly ? "Required — saved with the change as a Note." : "Required — closes this next action and saves the change.")
                  : "Required to close this Next Action."}
              </Typography>
            </Box>
          )}

          {activeTab === "followUp" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {isHospitalLevel && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={producedNewOpportunity}
                      disabled={!!producedOpportunityId}
                      onChange={(e) => { setProducedNewOpportunity(e.target.checked); setNotice(null); }}
                    />
                  }
                  label="This visit produced a new Opportunity"
                />
              )}
              {producedNewOpportunity ? (
                <Typography sx={{ fontSize: "0.75rem", color: "#4b5563" }}>
                  {producedOpportunityId
                    ? "The new Opportunity is saved. Press Complete to close this next action."
                    : "Press Complete to add the new Opportunity. This next action closes once it's saved, with no follow-up."}
                </Typography>
              ) : (
                <>
                  <TextField
                    label={followUpRequired ? "Follow-up next action *" : "Follow-up next action"}
                    value={nextActionText}
                    onChange={(e) => { setNextActionText(e.target.value); setFollowUpEdited(true); }}
                    // D22: several ticked fill it one per line.
                    multiline={tickChoices.length > 0}
                    fullWidth
                    size="small"
                    placeholder="e.g. Send the quote they asked for"
                  />
                  <DateTimePicker
                    label={followUpRequired ? "Due Date *" : "Due Date"}
                    value={nextActionDueDate ? dayjs(nextActionDueDate) : null}
                    onChange={(newValue) => setNextActionDueDate(newValue ? newValue.toISOString() : "")}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                  <TextField
                    select
                    label="Assign To"
                    value={nextActionOwnerId}
                    onChange={(e) => setNextActionOwnerId(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                  >
                    <MenuItem value="">
                      {firstActivity
                        ? `${firstActivity.ownerName ?? "The owner"} — Opportunity owner (default)`
                        : loggedForUserId && loggedForUserId !== currentUserId ? "Same person (default)" : "Me (default)"}
                    </MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
                    ))}
                  </TextField>
                  <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
                    {firstActivity
                      ? "Required — every new Opportunity starts with a next action."
                      : followUpExempt
                      ? `Optional — this Opportunity is ${statusName}. Leave the follow-up box empty to ${stageChange ? "save" : "close"} with no follow-up.`
                      : stageChange?.newStatus.code === "ON_HOLD" && stageChange.reactivationDate
                        ? `Required — due on or before the re-activation date (${dayjs(stageChange.reactivationDate).format("D MMM YYYY")}).`
                        : stageChange
                          ? (noteOnly
                            ? "Required — you have no open next action on this Opportunity, so set one now."
                            : "Required — this change closes your next action above, so set the next step.")
                          : "Required — every closed next action sets the next one."}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </FormModal>

      {isHospitalLevel && accountId && (
        <QuickLeadModal
          isOpen={showNewOpportunity}
          onClose={handleNewOpportunityClosed}
          onCreated={handleOpportunityCreated}
          initialAccountId={accountId}
          lockAccount
          initialProjectId={projectId}
          lockProject={!!projectId}
          // Plan D17: the visit just described is the new Opportunity's first activity.
          initialFirstActivity={{ activity_type: activityType, activity_date: activityDate, notes: notes.trim() }}
        />
      )}
    </>
  );
}
