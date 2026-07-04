import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { listReminders, patchReminder } from "../services/activities";
import type { ReminderResponse } from "../types/api";

const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  VISIT: "🏥",
  CALL: "📞",
  EMAIL: "✉️",
  MEETING: "🤝",
  NOTE: "📝",
  MANAGER_NOTE: "📋",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function isOverdue(reminder: ReminderResponse) {
  return !reminder.is_completed && new Date(reminder.due_date) < new Date();
}

function ReminderRow({
  reminder,
  onComplete,
  isCompleting,
}: {
  reminder: ReminderResponse;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}) {
  const overdue = isOverdue(reminder);
  const icon = ACTIVITY_TYPE_ICONS[reminder.activity.activity_type] ?? "📝";

  const badge = reminder.is_completed
    ? { bg: "#ecfdf5", color: "#047857", label: "Done" }
    : overdue
    ? { bg: "#fef2f2", color: "#dc2626", label: "Overdue" }
    : { bg: "#eff6ff", color: "#1d4ed8", label: "Due " + formatDate(reminder.due_date) };

  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: "0.375rem",
            fontSize: "9px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            bgcolor: badge.bg,
            color: badge.color,
          }}
        >
          {badge.label}
        </Box>
        {!reminder.is_completed && (
          <Button
            onClick={() => onComplete(reminder.id)}
            disabled={isCompleting}
            disableRipple
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: "0.75rem",
              fontSize: "10px",
              fontWeight: 900,
              color: "#059669",
              bgcolor: "#ecfdf5",
              letterSpacing: "0.05em",
              flexShrink: 0,
              "&:hover": { bgcolor: "#d1fae5" },
              "&.Mui-disabled": { opacity: 0.4, color: "#059669", bgcolor: "#ecfdf5" },
            }}
          >
            {isCompleting ? "Completing…" : "Mark to complete"}
          </Button>
        )}
      </Box>

      <Box sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937", lineHeight: 1.375 }}>
        {reminder.reminder_text}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
        <span>{icon}</span>
        <span>{reminder.activity.account.name}</span>
        {reminder.activity.opportunity && (
          <>
            <Box component="span" sx={{ color: "#d1d5db" }}>•</Box>
            <span>{reminder.activity.opportunity.name}</span>
          </>
        )}
      </Box>

      <Box sx={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>
        Owner: {reminder.assigned_to_user.display_name}
      </Box>
    </Box>
  );
}

export default function NextActionsScreen() {
  const queryClient = useQueryClient();
  const [includeCompleted, setIncludeCompleted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reminders", includeCompleted],
    queryFn: () => listReminders(includeCompleted),
  });

  const completeMutation = useMutation({
    mutationFn: (reminderId: string) => patchReminder(reminderId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const reminders = data ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: "background.default", flexShrink: 0 }}>
        <ToggleButtonGroup
          value={includeCompleted}
          exclusive
          onChange={(_, value) => { if (value !== null) setIncludeCompleted(value); }}
          sx={{ width: "fit-content", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden" }}
        >
          <ToggleButton
            value={false}
            disableRipple
            sx={{
              px: 2, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              border: "none", color: "#9ca3af", bgcolor: "#fff",
              "&:hover": { bgcolor: "background.default" },
              "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
              "&.Mui-selected:hover": { bgcolor: "primary.main" },
            }}
          >
            Pending
          </ToggleButton>
          <ToggleButton
            value={true}
            disableRipple
            sx={{
              px: 2, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
              border: "none", color: "#9ca3af", bgcolor: "#fff",
              "&:hover": { bgcolor: "background.default" },
              "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
              "&.Mui-selected:hover": { bgcolor: "primary.main" },
            }}
          >
            Completed
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <Box sx={{ color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading next actions...</Box>
          </Box>
        )}

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Couldn't load your next actions. Your list may be incomplete.
          </Alert>
        )}

        {!isLoading && !isError && reminders.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
            {includeCompleted ? "No completed actions yet." : "All caught up — no pending actions."}
          </Box>
        )}

        {!isLoading && reminders.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {reminders.map((r) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                onComplete={(id) => completeMutation.mutate(id)}
                isCompleting={completeMutation.isPending && completeMutation.variables === r.id}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
