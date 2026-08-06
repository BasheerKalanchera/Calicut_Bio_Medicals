import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button } from "@mui/material";
import { listActivitiesByAccount, listActivitiesByOpportunity, listActivitiesByProject } from "../services/activities";
import { ACTIVITY_TYPE_CONFIG } from "../utils/activityTypes";
import type { ActivityResponse } from "../types/api";

interface Props {
  accountId?: string;
  opportunityId?: string;
  projectId?: string;
  onLogActivity?: () => void;
  // Account-scoped callers can pass the account's own activity_count (already fetched
  // alongside its other counts, no extra request) instead of relying on this
  // component's own query for the total — see Customer360Screen.tsx. Opportunity-scoped
  // callers have no such prefetched count and fall back to the query's own total.
  totalCount?: number;
  // When false, this component doesn't run its own fetch for this query — it only
  // reactively reads whatever's already in the shared React Query cache (still
  // reflects a live fetch in progress elsewhere, via the query's shared fetchStatus).
  // Customer360Screen.tsx already runs this exact query at its own always-mounted
  // top level (needed so its fetch starts at screen mount, same as the other four
  // tabs, since this component itself only mounts once the Activity tab is clicked).
  // Having a second, independently-mounting observer here was causing a fresh
  // network request on every tab click instead of reusing that cached data —
  // confirmed empirically (Opportunities/Stakeholders never refetch on tab revisit,
  // Activity always did, even seconds after the parent's fetch had already resolved).
  // Defaults to true so opportunity-scoped callers (OpportunityDetailScreen.tsx),
  // which have no such parent-level query, keep fetching exactly as before.
  selfFetch?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function ActivityItem({ activity }: { activity: ActivityResponse }) {
  const cfg = ACTIVITY_TYPE_CONFIG[activity.activity_type] ?? ACTIVITY_TYPE_CONFIG.NOTE;
  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", p: 2, display: "flex", gap: "0.75rem" }}>
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
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
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
              bgcolor: "background.default",
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

export default function ActivityTimeline({ accountId, opportunityId, projectId, onLogActivity, totalCount, selfFetch = true }: Props) {
  const queryClient = useQueryClient();

  const queryKey = opportunityId
    ? ["activities", "opportunity", opportunityId]
    : projectId
    ? ["activities", "project", projectId]
    : ["activities", "account", accountId];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      opportunityId
        ? listActivitiesByOpportunity(opportunityId!)
        : projectId
        ? listActivitiesByProject(projectId!)
        : listActivitiesByAccount(accountId!),
    enabled: selfFetch && !!(opportunityId || projectId || accountId),
    staleTime: 5 * 60 * 1000,
  });

  const activities = data?.items ?? [];
  const total = totalCount ?? data?.total;

  function handleLogActivity() {
    onLogActivity?.();
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Activity ({total ?? "…"})
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
        <Box sx={{ pt: 0.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {activities.map((a) => (
            <ActivityItem key={a.id} activity={a} />
          ))}
          {(total ?? 0) > activities.length && (
            <Box sx={{ textAlign: "center", fontSize: "10px", color: "#9ca3af", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", pt: 1 }}>
              Showing {activities.length} of {total}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
