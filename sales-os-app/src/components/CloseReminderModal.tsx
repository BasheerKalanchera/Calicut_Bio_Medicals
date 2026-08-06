import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import FormModal from "./FormModal";
import { completeReminder } from "../services/activities";
import { listUsers } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";
import type { ActivityType, ReminderResponse } from "../types/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reminder: ReminderResponse | null;
  onCompleted?: () => void;
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

// Local stopgap type — listUsers returns Promise<unknown> today. See
// LogActivityModal.tsx's identical note.
interface UserOption { id: string; display_name: string }

type Tab = "details" | "followUp";

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function CloseReminderModal({ isOpen, onClose, reminder, onCompleted }: Props) {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const currentUserId = (userProfile as any)?.id;
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [activityType, setActivityType] = useState<ActivityType>("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes] = useState("");
  // Both start blank, deliberately — unlike LogActivityModal's mandatory
  // Next Action (defaulted to "tomorrow" since it's almost always wanted),
  // a follow-up here is optional and off by default; pre-filling the due
  // date would make hasFollowUp look true before the user's actually asked
  // for one.
  const [nextActionText, setNextActionText] = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState("");
  const [nextActionOwnerId, setNextActionOwnerId] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["users", "assignable"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("details");
    setActivityType("CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setNextActionText("");
    setNextActionDueDate("");
    setNextActionOwnerId("");
  }, [isOpen]);

  // Follow-up is optional (unlike BR-ACT-04's own next action) — presence
  // is driven by whether the Follow-up tab was actually filled in, not by
  // which tab happens to be active when Complete is clicked.
  const hasFollowUp = nextActionText.trim().length > 0 || nextActionDueDate !== "";

  async function handleSubmit() {
    if (!reminder) return;
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    if (!notes.trim()) { setActiveTab("details"); throw new Error("Notes describing what was done are required to close a Next Action."); }
    if (hasFollowUp) {
      if (!nextActionText.trim()) { setActiveTab("followUp"); throw new Error("Follow-up description is required"); }
      if (!nextActionDueDate) { setActiveTab("followUp"); throw new Error("Follow-up due date is required"); }
    }
    await completeReminder(reminder.id, {
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim(),
      ...(hasFollowUp && {
        next_action_text: nextActionText.trim(),
        next_action_due_date: new Date(nextActionDueDate).toISOString(),
        next_action_owner_id: nextActionOwnerId || currentUserId || undefined,
      }),
    });
    // The backend creates a real Activity to document this closure (BR-ACT-05)
    // — invalidate the Activity tab query it lands in, same as LogActivityModal
    // does for a normally-logged one, so it shows up without a hard refresh.
    queryClient.invalidateQueries({ queryKey: ["activities", "account", reminder.activity.account.id] });
    if (reminder.activity.opportunity) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", reminder.activity.opportunity.id] });
    }
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
    if (reminder.activity.opportunity) {
      queryClient.invalidateQueries({ queryKey: ["opp-reminders", reminder.activity.opportunity.id] });
    }
    // Same reasoning as above -- the closing Activity should show up in the
    // Daily Activity Report immediately too, not just the Activity tab.
    queryClient.invalidateQueries({ queryKey: ["activityReport"] });
    onCompleted?.();
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Close Next Action" onSubmit={handleSubmit} submitLabel="Complete">
      {reminder && (
        <Box sx={{ px: 1.5, py: 1, borderRadius: "0.75rem", bgcolor: "#f9fafb", fontSize: "0.75rem", color: "#4b5563" }}>
          {reminder.reminder_text}
        </Box>
      )}

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
          Follow-up{hasFollowUp ? " •" : ""}
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
              label="What was done? *"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="e.g. Called the customer, confirmed demo date for next week"
            />
            <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
              Required to close this Next Action.
            </Typography>
          </Box>
        )}

        {activeTab === "followUp" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Follow-up"
              value={nextActionText}
              onChange={(e) => setNextActionText(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Send the quote they asked for"
            />
            <DateTimePicker
              label="Due Date"
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
              <MenuItem value="">Me (default)</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
              ))}
            </TextField>
            <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
              Optional — only if this closure surfaced a new follow-up.
            </Typography>
          </Box>
        )}
      </Box>
    </FormModal>
  );
}
