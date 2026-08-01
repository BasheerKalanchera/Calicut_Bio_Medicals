import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import FormModal from "./FormModal";
import { logActivity } from "../services/activities";
import { listAccounts } from "../services/accounts";
import { listUsers } from "../services/masterData";
import type { ActivityType } from "../types/api";

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
];

// Local stopgap types — listUsers/listAccounts return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface UserOption { id: string; display_name: string }
interface AccountOption { id: string; name: string }

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
  const [selectedAccountId, setSelectedAccountId] = useState(accountId ?? "");
  const [activityType, setActivityType] = useState<ActivityType>("CALL");
  const [activityDate, setActivityDate] = useState(nowLocal());
  const [notes, setNotes]               = useState("");
  const [userId, setUserId]             = useState(currentUserId ?? "");
  const [nextActionText, setNextActionText]       = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState(nowPlusDaysLocal(1));
  const [nextActionOwnerId, setNextActionOwnerId] = useState(currentUserId ?? "");
  const [activeTab, setActiveTab] = useState<"details" | "nextAction">("details");

  const isManagerNote = activityType === "MANAGER_NOTE";

  const { data: users = [] } = useQuery({
    queryKey: ["users", "assignable"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers("all");
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", "picker"],
    enabled: isOpen && !accountId,
    queryFn: async () => {
      const d = await listAccounts({ page_size: 100 });
      return (d as { items?: AccountOption[] }).items ?? [];
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setActivityType("CALL");
    setActivityDate(nowLocal());
    setNotes("");
    setUserId(currentUserId ?? "");
    setSelectedAccountId(accountId ?? "");
    setNextActionText("");
    setNextActionDueDate(nowPlusDaysLocal(1));
    setNextActionOwnerId(currentUserId ?? "");
    setActiveTab("details");
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedAccountId = accountId ?? selectedAccountId;

  async function handleSubmit() {
    if (!resolvedAccountId) { setActiveTab("details"); throw new Error("Account is required"); }
    if (!activityType) { setActiveTab("details"); throw new Error("Activity type is required"); }
    if (!activityDate) { setActiveTab("details"); throw new Error("Date is required"); }
    // BR-ACT-04: Next Action is mandatory for every activity_type except
    // MANAGER_NOTE (internal manager-to-rep guidance, not a customer
    // interaction — carries no follow-up commitment).
    if (!isManagerNote) {
      if (!nextActionText.trim()) { setActiveTab("nextAction"); throw new Error("Next Action is required"); }
      if (!nextActionDueDate) { setActiveTab("nextAction"); throw new Error("Next Action Due Date is required"); }
    }
    await logActivity({
      account_id: resolvedAccountId,
      opportunity_id: opportunityId,
      project_id: projectId,
      user_id: userId || undefined,
      activity_type: activityType,
      activity_date: new Date(activityDate).toISOString(),
      notes: notes.trim() || undefined,
      ...(!isManagerNote && {
        next_action_text: nextActionText.trim(),
        next_action_due_date: new Date(nextActionDueDate).toISOString(),
        next_action_owner_id: nextActionOwnerId || undefined,
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["activities", "account", resolvedAccountId] });
    if (opportunityId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "opportunity", opportunityId] });
    }
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["activities", "project", projectId] });
    }
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
    if (opportunityId) {
      queryClient.invalidateQueries({ queryKey: ["opp-reminders", opportunityId] });
    }
    onCreated?.();
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Log Activity" onSubmit={handleSubmit} submitLabel="Log">
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
        {!isManagerNote && (
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
              <TextField
                select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">Select account</MenuItem>
                {accounts.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label="Type *"
              value={activityType}
              onChange={(e) => {
                const value = e.target.value as ActivityType;
                setActivityType(value);
                if (value === "MANAGER_NOTE") setActiveTab("details");
              }}
              fullWidth
              size="small"
            >
              {ACTIVITY_TYPES.map((t) => (
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
              select
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
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="What happened? Key discussion points, next steps…"
            />
          </Box>
        )}

        {activeTab === "nextAction" && !isManagerNote && (
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
  );
}
