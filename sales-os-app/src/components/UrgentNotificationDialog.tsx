import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText } from "@mui/material";
import { getUnreadCount, listUrgentUnread } from "../services/notifications";
import type { NotificationResponse } from "../types/api-aliases";

// IndiaMART lead SLA: Cabio must respond to an IndiaMART-sourced lead within
// 4 hours to get credit for the buylead. A quiet bell badge risks being
// missed for hours, so an assignment notification flagged urgent (see
// backend NotificationService.notify_opportunity_assigned) also pops this
// interrupting dialog. This only reaches someone with the app open when the
// poll runs -- it can't wake a closed app (real push notifications are
// deferred, see the implementation plan's Out of scope).
//
// Dismiss closes the dialog for now, but the notification stays unread until
// its Opportunity is actually opened, so it reappears on the next poll --
// not silence-forever-able by accident.
export default function UrgentNotificationDialog({
  onSelectOpportunity,
}: {
  onSelectOpportunity: (opportunity: { id: string; name: string }) => void;
}) {
  const queryClient = useQueryClient();
  // Epoch ms of the last Dismiss click -- compared against the urgent-unread
  // query's own dataUpdatedAt below, so the dialog stays hidden only until
  // the *next* poll actually lands (not silence-forever-able by accident).
  const [dismissedAt, setDismissedAt] = useState(0);

  const { data: countData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
  const urgentCount = countData?.urgent_unread_count ?? 0;

  const { data: urgent = [], dataUpdatedAt } = useQuery({
    queryKey: ["notifications", "urgent-unread"],
    queryFn: listUrgentUnread,
    enabled: urgentCount > 0,
  });

  function handleReview(n: NotificationResponse) {
    onSelectOpportunity({ id: n.entity_id, name: n.opportunity_name ?? "Opportunity" });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }), 500);
  }

  if (urgentCount === 0 || urgent.length === 0 || dataUpdatedAt <= dismissedAt) return null;

  return (
    <Dialog open maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "#dc2626" }}>Urgent: IndiaMART Lead{urgent.length === 1 ? "" : "s"}</DialogTitle>
      <DialogContent>
        <List disablePadding>
          {urgent.map((n) => (
            <ListItem
              key={n.id}
              disablePadding
              sx={{ py: 1, borderBottom: "1px solid #f3f4f6" }}
              secondaryAction={
                <Button size="small" variant="contained" onClick={() => handleReview(n)}>
                  Review
                </Button>
              }
            >
              <ListItemText
                primary={n.account_name ?? n.opportunity_name ?? "Opportunity"}
                secondary={`Assigned by ${n.actor.display_name} — respond within 4 hours for buylead credit.`}
                slotProps={{
                  primary: { sx: { fontWeight: 700, fontSize: "0.875rem" } },
                  secondary: { sx: { fontSize: "0.75rem" } },
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDismissedAt(Date.now())}>Dismiss</Button>
      </DialogActions>
    </Dialog>
  );
}
