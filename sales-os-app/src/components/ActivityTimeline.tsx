import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button } from "@mui/material";
import { listActivitiesByAccount, listActivitiesByOpportunity, listActivitiesByProject } from "../services/activities";
import { ACTIVITY_TYPE_CONFIG } from "../utils/activityTypes";
import ActivityCommentThread from "./ActivityCommentThread";
import type { ActivityResponse } from "../types/api-aliases";

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
  // Set when arriving here via an ACTIVITY_COMMENT_ADDED/MANAGER_NOTE_ADDED
  // notification click -- the notification only ever says "commented on an
  // activity" with no indication which one, so once the list loads we scroll
  // straight to this Activity, highlight it, and auto-expand its comment
  // thread instead of leaving the user to guess among a list that may have
  // several commented-on entries.
  highlightActivityId?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function ActivityItem({
  activity,
  highlighted,
  onHighlightedCommentsSettled,
}: {
  activity: ActivityResponse;
  highlighted?: boolean;
  onHighlightedCommentsSettled?: () => void;
}) {
  const cfg = ACTIVITY_TYPE_CONFIG[activity.activity_type] ?? ACTIVITY_TYPE_CONFIG.NOTE;
  return (
    <Box
      data-activity-id={activity.id}
      sx={{
        bgcolor: highlighted ? "#eff6ff" : "#fff",
        borderRadius: "1rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        border: highlighted ? "2px solid #2563eb" : "1px solid #f3f4f6",
        p: 2,
        display: "flex",
        gap: "0.75rem",
      }}
    >
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
          {/* activity.user is who this is logged AGAINST (BR-ACT-04), not who
              wrote it -- same person for every type except MANAGER_NOTE, where
              they genuinely differ. created_by_user is the true author;
              falls back to activity.user for legacy rows predating this field. */}
          {activity.created_by_user?.display_name ?? activity.user.display_name}
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
              whiteSpace: "pre-wrap",
            }}
          >
            {activity.notes}
          </Box>
        )}
        <ActivityCommentThread
          activityId={activity.id}
          commentCount={activity.comment_count}
          initiallyExpanded={highlighted}
          onInitialLoadSettled={highlighted ? onHighlightedCommentsSettled : undefined}
        />
      </Box>
    </Box>
  );
}

export default function ActivityTimeline({
  accountId,
  opportunityId,
  projectId,
  onLogActivity,
  totalCount,
  selfFetch = true,
  highlightActivityId,
}: Props) {
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);

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

  // Scroll to and land on the notified Activity once its card is actually in
  // the DOM. If it's past the first page (pageSize=50 in
  // services/activities.ts), it silently won't be found -- same known limit
  // as the "Showing X of Y" truncation notice below, not something this
  // fixes.
  //
  // Two earlier approaches here didn't hold up under live testing
  // (2026-09-10, Basheer walking every notification on a deal): a single
  // scrollIntoView call landed inconsistently because the highlighted card's
  // comment thread auto-expands and fetches asynchronously, growing the card
  // after the call already ran against its pre-load height -- and a
  // ResizeObserver, then a fixed retry schedule guessing at how long that
  // fetch takes, both still missed cards whose thread had more comments (and
  // so took longer) than the guess accounted for. `scrollToHighlightTarget`
  // is called an initial time here for snappiness, then called again by
  // ActivityCommentThread's onInitialLoadSettled once that specific fetch has
  // actually resolved -- no timing guess involved.
  const scrollToHighlightTarget = useCallback(() => {
    if (!highlightActivityId) return;
    const container = listRef.current;
    const target = container?.querySelector(`[data-activity-id="${highlightActivityId}"]`) as HTMLElement | null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightActivityId]);

  // Tracks *which* id was last handled, not just whether one ever was -- this
  // component (and every ActivityItem in it) stays mounted across repeated
  // notification clicks on the same deal, so a plain one-shot boolean would
  // silently stop firing this initial attempt from the second notification
  // onward (the settle-callback above still covers correctness in that case,
  // but this keeps the snappy early attempt working too).
  const lastHandledHighlightIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!highlightActivityId || activities.length === 0 || lastHandledHighlightIdRef.current === highlightActivityId) return;
    lastHandledHighlightIdRef.current = highlightActivityId;
    scrollToHighlightTarget();
    // activities.length, not activities -- `data?.items ?? []` makes a fresh
    // array on every render while data is undefined, which would re-run this
    // effect every render during loading if the array itself were a dep.
  }, [highlightActivityId, activities.length, scrollToHighlightTarget]);

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
        <Box ref={listRef} sx={{ pt: 0.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {activities.map((a) => (
            <ActivityItem
              key={a.id}
              activity={a}
              highlighted={a.id === highlightActivityId}
              onHighlightedCommentsSettled={scrollToHighlightTarget}
            />
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
