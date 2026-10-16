import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import FormModal from "./FormModal";
import QuickLeadModal from "./QuickLeadModal";
import { completeReminder } from "../services/activities";
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

export default function CloseReminderModal({ isOpen, onClose, reminder: reminderProp, onCompleted, loggedForUserId, stageChange }: Props) {
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

  const ownReminders = stageChange?.ownReminders ?? [];
  const reminder = stageChange ? ownReminders.find((r) => r.id === pickedReminderId) ?? null : reminderProp;
  // Stage-change mode with no open next action of one's own: a Note (D14).
  const noteOnly = !!stageChange && ownReminders.length === 0;
  const opportunityId = reminder?.activity.opportunity?.id;
  const accountId = reminder?.activity.account?.id;
  const isHospitalLevel = !stageChange && !!reminder && !opportunityId;

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
    setActivityType(noteOnly ? "NOTE" : "CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setNextActionText((stageChange ? onlyOwn : reminderProp)?.reminder_text ?? "");
    setNextActionDueDate(nowPlusDaysLocal(1));
    setNextActionOwnerId("");
    setProducedNewOpportunity(false);
    setShowNewOpportunity(false);
    setNotice(null);
    producedOpportunityRef.current = null;
    setProducedOpportunityId(null);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
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

  async function handleSubmit() {
    if (stageChange) return handleStageChangeSubmit();
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
        title={stageChange ? "Why this change?" : "Close Next Action"}
        onSubmit={handleSubmit}
        submitLabel={stageChange ? "Save" : "Complete"}
        disableEnforceFocus={showNewOpportunity}
      >
        {/* Plan D15: more than one of the changer's own -- they pick which to close. */}
        {ownReminders.length > 1 && (
          <TextField
            select
            label="Next action to close *"
            value={pickedReminderId}
            onChange={(e) => {
              const picked = ownReminders.find((r) => r.id === e.target.value);
              setPickedReminderId(e.target.value);
              setNextActionText(picked?.reminder_text ?? "");
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
        {reminder && ownReminders.length <= 1 && (
          <Box sx={{ px: 1.5, py: 1, borderRadius: "0.75rem", bgcolor: "#f9fafb", fontSize: "0.75rem", color: "#4b5563" }}>
            {reminder.reminder_text}
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
                label={stageChange ? "Why the change? *" : "What was done? *"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder={stageChange
                  ? "e.g. Demo done, the radiologist approved; quote requested"
                  : "e.g. Called the customer, confirmed demo date for next week"}
              />
              <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
                {stageChange
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
                    onChange={(e) => setNextActionText(e.target.value)}
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
                    <MenuItem value="">{loggedForUserId && loggedForUserId !== currentUserId ? "Same person (default)" : "Me (default)"}</MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
                    ))}
                  </TextField>
                  <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
                    {followUpExempt
                      ? `Optional — this Opportunity is ${statusName}. Leave the follow-up box empty to ${stageChange ? "save" : "close"} with no follow-up.`
                      : stageChange?.newStatus.code === "ON_HOLD" && stageChange.reactivationDate
                        ? `Required — due on or before the re-activation date (${dayjs(stageChange.reactivationDate).format("D MMM YYYY")}).`
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
        />
      )}
    </>
  );
}
