import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button } from "@mui/material";
import { listActivitiesByAccount, listActivitiesByOpportunity } from "../services/activities";
import type { ActivityResponse, ActivityType } from "../types/api";

interface Props {
  accountId?: string;
  opportunityId?: string;
  onLogActivity?: () => void;
}

// bg/color pairs match the original Tailwind shade names, e.g. VISIT: violet-50 / violet-700
const TYPE_CONFIG: Record<ActivityType, { icon: string; label: string; bg: string; color: string }> = {
  VISIT:        { icon: "🏥", label: "Visit",        bg: "#f5f3ff", color: "#6d28d9" },
  CALL:         { icon: "📞", label: "Call",          bg: "#eff6ff", color: "#1d4ed8" },
  EMAIL:        { icon: "✉️",  label: "Email",         bg: "#f0f9ff", color: "#0369a1" },
  MEETING:      { icon: "🤝", label: "Meeting",       bg: "#ecfdf5", color: "#047857" },
  NOTE:         { icon: "📝", label: "Note",          bg: "#fffbeb", color: "#b45309" },
  MANAGER_NOTE: { icon: "📋", label: "Manager Note",  bg: "#f3f4f6", color: "#4b5563" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function ActivityItem({ activity, isLast }: { activity: ActivityResponse; isLast: boolean }) {
  const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG.NOTE;
  return (
    <Box sx={{ display: "flex", gap: "0.75rem" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.875rem",
            bgcolor: cfg.bg,
            color: cfg.color,
          }}
        >
          {cfg.icon}
        </Box>
        {!isLast && <Box sx={{ width: "1px", flex: 1, bgcolor: "#f3f4f6", my: 0.5 }} />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.25 }}>
          <Box
            component="span"
            sx={{
              fontSize: "10px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              px: 1,
              py: 0.25,
              borderRadius: "0.375rem",
              bgcolor: cfg.bg,
              color: cfg.color,
            }}
          >
            {cfg.label}
          </Box>
          <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>
            {formatDate(activity.activity_date)}
          </Box>
        </Box>
        <Box sx={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", mb: 0.5 }}>
          {activity.user.display_name}
        </Box>
        {activity.notes && (
          <Box
            sx={{
              fontSize: "0.75rem",
              color: "#374151",
              bgcolor: "#fff",
              border: "1px solid #f3f4f6",
              borderRadius: "0.75rem",
              px: 1.5,
              py: 1,
              lineHeight: 1.625,
            }}
          >
            {activity.notes}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function ActivityTimeline({ accountId, opportunityId, onLogActivity }: Props) {
  const queryClient = useQueryClient();

  const queryKey = opportunityId
    ? ["activities", "opportunity", opportunityId]
    : ["activities", "account", accountId];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      opportunityId
        ? listActivitiesByOpportunity(opportunityId!)
        : listActivitiesByAccount(accountId!),
    enabled: !!(opportunityId || accountId),
  });

  const activities = data?.items ?? [];

  function handleLogActivity() {
    onLogActivity?.();
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Activity ({data?.total ?? "…"})
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={() => { queryClient.invalidateQueries({ queryKey }); refetch(); }}
            disableRipple
            sx={{
              fontSize: "10px",
              fontWeight: 900,
              color: "#9ca3af",
              letterSpacing: "0.05em",
              minWidth: 0,
              p: 0,
              "&:hover": { color: "#4b5563", bgcolor: "transparent" },
            }}
          >
            ↻ Refresh
          </Button>
          <Button
            onClick={handleLogActivity}
            disableRipple
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 900,
              color: "primary.main",
              bgcolor: "#eff6ff",
              letterSpacing: "0.05em",
              "&:hover": { bgcolor: "#dbeafe" },
            }}
          >
            + Log
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ py: 6, textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Loading…
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", color: "#9ca3af", fontStyle: "italic", fontSize: "0.875rem" }}>
          No activities logged yet.
        </Box>
      ) : (
        <Box sx={{ pt: 0.5 }}>
          {activities.map((a, i) => (
            <ActivityItem key={a.id} activity={a} isLast={i === activities.length - 1} />
          ))}
          {(data?.total ?? 0) > activities.length && (
            <Box sx={{ textAlign: "center", fontSize: "10px", color: "#9ca3af", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", pt: 1 }}>
              Showing {activities.length} of {data?.total}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
