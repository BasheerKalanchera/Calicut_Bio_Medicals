import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { getUnreadCount, listUrgentUnread, markNotificationRead } from "../services/notifications";
import type { NotificationResponse } from "../types/api-aliases";
import { describeNotification } from "../utils/notificationDescribe";

// Originally built for the IndiaMART lead SLA: Cabio had to respond to an
// IndiaMART-sourced lead within 4 hours to get credit for the buylead, so a
// quiet bell badge risked being missed for hours -- an assignment
// notification flagged urgent (backend NotificationService.
// notify_opportunity_assigned) also popped this interrupting dialog. That
// IndiaMART path was retired 2026-09-02 (IndiaMART inquiries now go through
// the marketing_lead review queue first; notify_opportunity_assigned always
// passes is_urgent=False now) -- but this dialog, its polling, and the
// is_urgent plumbing behind it are DELIBERATELY still here, generic and
// ready to reuse for whatever the next urgent-notification case turns out
// to be. See docs/Backlog.md, "Urgent-notification infrastructure retained
// for future reuse."
//
// This only reaches someone with the app open when the poll runs -- it
// can't wake a closed app (real push notifications are deferred, see the
// implementation plan's Out of scope).
//
// Dismiss closes the dialog for now, but the notification stays unread until
// its Opportunity is actually opened, so it reappears on the next poll --
// not silence-forever-able by accident.
export default function UrgentNotificationDialog({
  onSelectOpportunity,
  onSelectAccount,
  dismissedAt,
  onDismiss,
}: {
  onSelectOpportunity: (
    opportunity: { id: string; name: string },
    detailTab?: string,
    customer360Tab?: string,
    highlightActivityId?: string,
  ) => void;
  // Only used by MANAGER_NOTE_ADDED when the note is Account-only (no
  // opportunity_id) -- every other urgent notification type navigates via
  // onSelectOpportunity instead.
  onSelectAccount: (account: { id: string; name: string }, initialTab?: string, highlightActivityId?: string) => void;
  // Epoch ms of the last dismissal -- compared against the urgent-unread
  // query's own dataUpdatedAt below, so the dialog stays hidden only until
  // the *next* poll actually lands (not silence-forever-able by accident).
  // Lifted to the app shell (not local state) so navigating to an Opportunity
  // from *anywhere* -- not just this dialog's own Dismiss/Review -- suppresses
  // it; otherwise it can reappear on top of whatever screen that navigation
  // just opened.
  dismissedAt: number;
  onDismiss: () => void;
}) {
  const queryClient = useQueryClient();
  // Interim picker only shown when there's more than one urgent item at once
  // (rare) -- Review otherwise jumps straight to the single Opportunity.
  const [pickerOpen, setPickerOpen] = useState(false);

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
    // dataUpdatedAt drives the dismissedAt suppression check below -- an
    // incidental window-focus refetch (React Query's app-wide default) could
    // land moments after a Dismiss/Review click and bump dataUpdatedAt past
    // dismissedAt again, popping this dialog back up on top of whatever
    // screen the click just navigated to. Scoped to this one query only
    // (not main.tsx's QueryClient) so no other screen loses its own
    // focus-triggered refresh; refetchInterval replaces what focus-refetch
    // used to provide, so it still reliably re-arms within ~60s.
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
  });

  function handleReview(n: NotificationResponse) {
    if (n.type === "MANAGER_NOTE_ADDED") {
      // entity_id here is the Activity id, not an Opportunity id -- unlike
      // every type below, it has no detail screen of its own. Navigate via
      // opportunity_id when the note is tied to a deal, else account_id
      // (same branching as NotificationBell.tsx's handleSelect). No GET-by-id
      // route to piggyback a read receipt on, so mark it explicitly.
      markNotificationRead("activity", n.entity_id);
      if (n.opportunity_id) {
        onSelectOpportunity(
          { id: n.opportunity_id, name: n.opportunity_name ?? "Opportunity" },
          "activity",
          undefined,
          n.entity_id,
        );
      } else if (n.account_id) {
        onSelectAccount({ id: n.account_id, name: n.account_name ?? "Account" }, "activity", n.entity_id);
      }
    } else {
      onSelectOpportunity({ id: n.entity_id, name: n.opportunity_name ?? "Opportunity" });
    }
    setPickerOpen(false);
    // Deliberately NOT ["notifications"] (which would also sweep up
    // urgent-unread by prefix match) -- that reintroduces the exact race
    // refetchOnWindowFocus:false above was fixing, just via invalidate
    // instead of window focus: with 2+ urgent items, reviewing one still
    // leaves urgent.length > 0 after this refetch, so the dialog's
    // dataUpdatedAt/dismissedAt check alone would pop it back up over
    // whatever screen this navigation just opened. urgent-unread only
    // refreshes on its own 60s refetchInterval now.
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    }, 500);
  }

  function handleReviewClick() {
    if (urgent.length === 1) {
      handleReview(urgent[0]);
    } else {
      setPickerOpen(true);
    }
  }

  if (urgentCount === 0 || urgent.length === 0 || dataUpdatedAt <= dismissedAt) return null;

  return (
    <>
      <Dialog open={!pickerOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: "#dc2626" }}>Urgent Notification{urgent.length === 1 ? "" : "s"}</DialogTitle>
        <DialogContent>
          <List disablePadding>
            {urgent.map((n) => (
              <ListItem key={n.id} disablePadding sx={{ py: 1, borderBottom: "1px solid #f3f4f6" }}>
                <ListItemText
                  primary={n.account_name ?? n.opportunity_name ?? "Opportunity"}
                  secondary={describeNotification(n)}
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
          <Button onClick={onDismiss}>Dismiss</Button>
          <Button variant="contained" onClick={handleReviewClick}>
            Review
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pickerOpen} maxWidth="sm" fullWidth onClose={() => setPickerOpen(false)}>
        <DialogTitle sx={{ color: "#dc2626" }}>Tap One to Review</DialogTitle>
        <DialogContent>
          <List disablePadding>
            {urgent.map((n) => (
              <ListItem key={n.id} disablePadding sx={{ borderBottom: "1px solid #f3f4f6" }}>
                <ListItemButton onClick={() => handleReview(n)} sx={{ py: 1 }}>
                  <ListItemText
                    primary={n.account_name ?? n.opportunity_name ?? "Opportunity"}
                    secondary={
                      n.opportunity_name ? (
                        <>
                          <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{n.opportunity_name}</span>
                          {` — ${describeNotification(n)}`}
                        </>
                      ) : (
                        describeNotification(n)
                      )
                    }
                    slotProps={{
                      primary: { sx: { fontWeight: 700, fontSize: "0.875rem" } },
                      secondary: { sx: { fontSize: "0.75rem" } },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Back</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
