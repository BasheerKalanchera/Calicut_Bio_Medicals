import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ReminderRow from "./ReminderRow";
import CloseReminderModal from "./CloseReminderModal";
import type { ReminderResponse } from "../types/api-aliases";

const TOGGLE_SX = {
  px: 2, py: 0.75, fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
  border: "none", color: "#9ca3af", bgcolor: "#fff",
  "&:hover": { bgcolor: "background.default" },
  "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
  "&.Mui-selected:hover": { bgcolor: "primary.main" },
} as const;

// ---------------------------------------------------------------------------
// Next Actions tab body, shared by Opportunity Detail and Customer 360
// (docs/Hospital-Next-Action-Rule-Implementation-Plan.md D6-D8). It lists
// everyone's next actions on the thing the screen is about, with the total in
// the heading; Close is offered on the current user's own rows only, so others'
// rows stay read-only.
// ---------------------------------------------------------------------------
export default function NextActionsPanel({
  queryKeyPrefix,
  fetchReminders,
  emptyPendingMessage,
  currentUserId,
  hideOpportunity,
  onSelectOpportunity,
}: {
  // Becomes ["<prefix...>", includeCompleted], so the invalidations that match
  // on the leading parts (e.g. ["opp-reminders", id]) refresh this list too.
  queryKeyPrefix: readonly unknown[];
  fetchReminders: (includeCompleted: boolean) => Promise<ReminderResponse[]>;
  emptyPendingMessage: string;
  currentUserId?: string;
  hideOpportunity?: boolean;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [closingReminder, setClosingReminder] = useState<ReminderResponse | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeyPrefix, includeCompleted],
    queryFn: () => fetchReminders(includeCompleted),
    staleTime: 5 * 60 * 1000,
  });

  const reminders = data ?? [];

  if (isLoading) {
    return (
      <Box sx={{ py: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#d1d5db", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Loading…
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <ToggleButtonGroup
        value={includeCompleted}
        exclusive
        onChange={(_, value) => { if (value !== null) setIncludeCompleted(value); }}
        sx={{ width: "fit-content", border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        <ToggleButton value={false} disableRipple sx={TOGGLE_SX}>Pending</ToggleButton>
        <ToggleButton value={true} disableRipple sx={TOGGLE_SX}>Completed</ToggleButton>
      </ToggleButtonGroup>

      {isError && <Alert severity="error">Couldn't load next actions. The list may be incomplete.</Alert>}

      {reminders.length === 0 ? (
        <Box sx={{ py: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", px: 4 }}>
          {includeCompleted ? "No completed next actions yet." : emptyPendingMessage}
        </Box>
      ) : (
        <>
          <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {includeCompleted ? "Completed" : "Pending"} ({reminders.length})
          </Box>
          {reminders.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              hideOpportunity={hideOpportunity}
              onSelectOpportunity={onSelectOpportunity}
              onComplete={r.assigned_to_user_id === currentUserId ? setClosingReminder : undefined}
            />
          ))}
        </>
      )}

      <CloseReminderModal
        isOpen={!!closingReminder}
        onClose={() => setClosingReminder(null)}
        reminder={closingReminder}
        onCompleted={() => setClosingReminder(null)}
      />
    </Box>
  );
}
