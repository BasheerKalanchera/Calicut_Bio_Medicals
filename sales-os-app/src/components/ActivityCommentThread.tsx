import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, TextField } from "@mui/material";
import { createActivityComment, listActivityComments } from "../services/activities";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// Activity Inline Comments (docs/Activity-Comment-Implementation-Plan.md): a
// flat, post-only thread against a single Activity, rendered directly under
// it so it reads as part of the same card. Collapsed and unfetched until
// expanded, so opening a timeline with many entries doesn't fire one query
// per entry -- commentCount (from the parent Activity list's own query,
// docs/Activity-Comment-Implementation-Plan.md's later comment_count
// addition) drives the toggle label instead: "Comments (N)" once there's at
// least one, otherwise a plain "Add comment" link with no count implying a
// thread that isn't there yet.
export default function ActivityCommentThread({
  activityId,
  commentCount,
  initiallyExpanded = false,
  onInitialLoadSettled,
}: {
  activityId: string;
  commentCount: number;
  // Set when this Activity is the target of a comment notification the user
  // just clicked through -- opens straight to the thread instead of making
  // them find and click "Comments (N)" themselves on the very card they were
  // just pointed at.
  initiallyExpanded?: boolean;
  // Fires once, after the auto-expanded thread's first fetch resolves --
  // lets ActivityTimeline's scroll-to-highlight wait for this card's real
  // final height instead of guessing at a fixed delay (see that effect's
  // comment for the bug this replaced).
  onInitialLoadSettled?: () => void;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["activity-comments", activityId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listActivityComments(activityId),
    enabled: expanded,
  });

  // initiallyExpanded only sets useState's value at first mount -- every
  // Activity card in the list stays mounted for as long as the user keeps
  // clicking different notifications on the same deal (the underlying list
  // never unmounts, only which card is highlighted changes), so a card
  // visited a second time needs to re-expand on that later prop change, not
  // just at mount. Found live 2026-09-10 (Basheer): a card highlighted a
  // second time scrolled into view correctly but its thread stayed
  // collapsed. The re-expand itself is adjusted during render (React's
  // documented pattern for syncing state to a prop change,
  // https://react.dev/learn/you-might-not-need-an-effect) rather than in a
  // useEffect -- `react-hooks/set-state-in-effect` correctly flagged the
  // effect version of this as an avoidable extra render pass. Refs can't be
  // written during render either (`react-hooks/refs`), so the parallel
  // "only on a fresh highlight" tracking for onInitialLoadSettled below
  // stays entirely inside its own effect instead.
  const [prevInitiallyExpanded, setPrevInitiallyExpanded] = useState(initiallyExpanded);
  if (initiallyExpanded !== prevInitiallyExpanded) {
    setPrevInitiallyExpanded(initiallyExpanded);
    if (initiallyExpanded) setExpanded(true);
  }

  const pendingSettleRef = useRef(initiallyExpanded);
  const wasInitiallyExpandedRef = useRef(initiallyExpanded);
  useEffect(() => {
    if (initiallyExpanded && !wasInitiallyExpandedRef.current) {
      pendingSettleRef.current = true;
    }
    wasInitiallyExpandedRef.current = initiallyExpanded;
    if (pendingSettleRef.current && !isLoading) {
      pendingSettleRef.current = false;
      onInitialLoadSettled?.();
    }
  }, [initiallyExpanded, isLoading, onInitialLoadSettled]);

  const postComment = useMutation({
    mutationFn: (body: string) => createActivityComment(activityId, body),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey });
      // Not `exact` -- matches every ["activities", ...] list query
      // (account/opportunity/project), so the new comment_count shows up
      // without a manual refresh.
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  function handlePost() {
    const body = draft.trim();
    if (!body) return;
    postComment.mutate(body);
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        onClick={() => setExpanded((e) => !e)}
        disableRipple
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: "10px",
          fontWeight: 900,
          color: "#9ca3af",
          letterSpacing: "0.05em",
          minWidth: 0,
          p: 0,
          "&:hover": { color: "#4b5563", bgcolor: "transparent" },
        }}
      >
        {expanded ? (
          "Hide comments"
        ) : commentCount > 0 ? (
          <>
            <Box component="span">Comments</Box>
            <Box
              component="span"
              sx={{
                bgcolor: "#fee2e2",
                color: "#dc2626",
                fontWeight: 900,
                fontSize: "10px",
                borderRadius: "999px",
                px: 0.75,
                py: 0.125,
                lineHeight: 1.5,
                letterSpacing: 0,
              }}
            >
              {commentCount}
            </Box>
          </>
        ) : (
          "Add comment"
        )}
      </Button>

      {expanded && (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {isLoading ? (
            <Box sx={{ fontSize: "0.7rem", color: "#9ca3af" }}>Loading…</Box>
          ) : (
            comments.map((c) => (
              <Box
                key={c.id}
                sx={{ bgcolor: "background.default", borderRadius: "0.75rem", px: 1.5, py: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                  <Box component="span" sx={{ fontSize: "10px", fontWeight: 700, color: "#6b7280" }}>
                    {c.author.display_name}
                  </Box>
                  <Box component="span" sx={{ fontSize: "10px", color: "#9ca3af" }}>
                    {formatDate(c.created_at)}
                  </Box>
                </Box>
                <Box sx={{ fontSize: "0.75rem", color: "#374151", whiteSpace: "pre-wrap" }}>{c.body}</Box>
              </Box>
            ))
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              multiline
              maxRows={4}
            />
            <Button
              onClick={handlePost}
              disabled={!draft.trim() || postComment.isPending}
              variant="contained"
              sx={{ fontSize: "0.75rem", fontWeight: 900 }}
            >
              Post
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
