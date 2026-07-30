import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { listReminders, patchReminder } from "../services/activities";
import ReminderRow from "../components/ReminderRow";

export default function NextActionsScreen({
  onSelectAccount,
  onSelectOpportunity,
}: {
  onSelectAccount?: (account: { id: string; name: string }) => void;
  onSelectOpportunity?: (opportunity: { id: string; name: string }) => void;
}) {
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
                onSelectAccount={onSelectAccount}
                onSelectOpportunity={onSelectOpportunity}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
