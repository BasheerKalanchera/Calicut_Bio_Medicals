import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Popover, Typography } from "@mui/material";
import { getUnreadCount, listNotifications } from "../services/notifications";
import type { NotificationResponse } from "../types/api-aliases";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function describe(n: NotificationResponse): string {
  const who = n.actor.display_name;
  const what = n.opportunity_name ?? "an Opportunity";
  return `${who} assigned you ${what}`;
}

export default function NotificationBell({
  onSelectOpportunity,
}: {
  onSelectOpportunity: (opportunity: { id: string; name: string }) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const open = Boolean(anchorEl);

  // Polled independently of window focus refetch (already on by default,
  // see main.tsx's QueryClient) so an assignment made mid-session lights up
  // the badge without requiring a fresh login -- this is the reason it can't
  // live inside LoginRemindersDialog (justLoggedIn-gated, one-shot).
  const { data: countData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
  const unreadCount = countData?.unread_count ?? 0;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications(20),
    enabled: open,
  });

  function handleSelect(n: NotificationResponse) {
    setAnchorEl(null);
    // GET /opportunities/{id} (fired by whatever screen this opens) marks the
    // notification read server-side -- refetch shortly after so the badge
    // and dropdown catch up instead of waiting for the next 60s poll.
    onSelectOpportunity({ id: n.entity_id, name: n.opportunity_name ?? "Opportunity" });
    // Not ["notifications"] -- that would also sweep up urgent-unread by
    // prefix match, which can pop UrgentNotificationDialog back up over
    // this navigation if 2+ urgent items were outstanding (see that
    // component's matching comment). urgent-unread refreshes on its own
    // 60s refetchInterval instead.
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    }, 500);
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Notifications"
        sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: "0.75rem", bgcolor: "#f9fafb", color: "#4b5563", "&:hover": { bgcolor: "#f3f4f6" }, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
      >
        <Badge variant="dot" color="error" invisible={unreadCount === 0}>
          <Box component="span" sx={{ fontSize: "1.1rem" }}>🔔</Box>
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 320, maxHeight: 420, overflowY: "auto" }}>
          <Typography sx={{ px: 2, py: 1.5, fontWeight: 800, fontSize: "0.875rem", borderBottom: "1px solid #f3f4f6" }}>
            Notifications
          </Typography>
          {notifications.length === 0 ? (
            <Typography sx={{ px: 2, py: 3, fontSize: "0.8rem", color: "#9ca3af", textAlign: "center" }}>
              Nothing yet.
            </Typography>
          ) : (
            <List disablePadding>
              {notifications.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  sx={{
                    alignItems: "flex-start",
                    borderBottom: "1px solid #f9fafb",
                    bgcolor: n.read_at ? "transparent" : "#eff6ff",
                  }}
                >
                  <ListItemText
                    primary={describe(n)}
                    secondary={
                      <>
                        {n.account_name && <>{n.account_name} · </>}
                        {formatDate(n.created_at)}
                        {n.is_urgent && !n.read_at && " · URGENT"}
                      </>
                    }
                    slotProps={{
                      primary: { sx: { fontSize: "0.8rem", fontWeight: n.read_at ? 500 : 800 } },
                      secondary: {
                        sx: { fontSize: "0.7rem", color: n.is_urgent && !n.read_at ? "#dc2626" : "#9ca3af" },
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
