import { Box, Button } from "@mui/material";
import { ACTIVITY_TYPE_CONFIG } from "../utils/activityTypes";
import type { ReminderResponse } from "../types/api-aliases";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Matches the backend's own due-vs-overdue boundary (auth.py's end_of_today
// for due_or_overdue_reminder_count): a reminder due earlier *today* is still
// "due today," not overdue -- only a due_date on an earlier calendar day is.
// Comparing against the exact current instant (not the start of today) would
// mark anything due before the current time of day as overdue, even hours
// before midnight.
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdue(reminder: ReminderResponse) {
  return !reminder.is_completed && new Date(reminder.due_date) < startOfToday();
}

export default function ReminderRow({
  reminder,
  onComplete,
  onSelectAccount,
  onSelectOpportunity,
  hideOpportunity,
}: {
  reminder: ReminderResponse;
  // Signals "user wants to close this reminder" — the caller owns what
  // happens next (BR-ACT-05 requires documenting what was done, so this
  // opens a modal rather than completing directly; see NextActionsScreen).
  onComplete?: (reminder: ReminderResponse) => void;
  onSelectAccount?: (account: { id: string; name: string }) => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
  // Suppresses the opportunity chip when the row is already rendered inside
  // that opportunity's own screen (e.g. Opportunity Detail's Next Actions
  // tab) — the link would just re-navigate to the page already on screen.
  hideOpportunity?: boolean;
}) {
  const overdue = isOverdue(reminder);
  const icon = ACTIVITY_TYPE_CONFIG[reminder.activity.activity_type]?.icon ?? "📝";

  const badge = reminder.is_completed
    ? { bg: "#ecfdf5", color: "#047857", label: "Done" }
    : overdue
    ? { bg: "#fef2f2", color: "#dc2626", label: "Overdue" }
    : { bg: "#eff6ff", color: "#1d4ed8", label: "Due " + formatDateOnly(reminder.due_date) };

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
        {!reminder.is_completed && onComplete && (
          <Button
            onClick={() => onComplete(reminder)}
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
            }}
          >
            Mark to complete
          </Button>
        )}
      </Box>

      <Box sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#1f2937", lineHeight: 1.375 }}>
        {reminder.reminder_text}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
        <span>{icon}</span>
        <Box
          component="span"
          onClick={onSelectAccount ? () => onSelectAccount(reminder.activity.account) : undefined}
          sx={onSelectAccount
            ? { color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }
            : { color: "inherit" }}
        >
          {reminder.activity.account.name}
        </Box>
        {!hideOpportunity && reminder.activity.opportunity && (
          <>
            <Box component="span" sx={{ color: "#d1d5db" }}>•</Box>
            <Box
              component="span"
              onClick={() => onSelectOpportunity?.(reminder.activity.opportunity!)}
              sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              {reminder.activity.opportunity.name}
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>
        <Box component="span">Due: {formatDateOnly(reminder.due_date)}</Box>
        <Box component="span" sx={{ color: "#e5e7eb" }}>•</Box>
        <Box component="span">Owner: {reminder.assigned_to_user.display_name}</Box>
        <Box component="span" sx={{ color: "#e5e7eb" }}>•</Box>
        <Box component="span">Logged by: {reminder.activity.user.display_name}</Box>
      </Box>

      {/* BR-ACT-05: what was done to close this out — same Activity record
          that already appears in the Activity tab, surfaced here too since
          it's the whole point of capturing it. */}
      {reminder.closing_activity && (
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1, fontSize: "0.75rem", color: "#4b5563" }}>
          <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
            {ACTIVITY_TYPE_CONFIG[reminder.closing_activity.activity_type]?.icon ?? "📝"} Closed via {reminder.closing_activity.activity_type.replace("_", " ").toLowerCase()} on {formatDate(reminder.closing_activity.activity_date)}
          </Box>
          <Box sx={{ whiteSpace: "pre-wrap" }}>{reminder.closing_activity.notes}</Box>
        </Box>
      )}
    </Box>
  );
}
