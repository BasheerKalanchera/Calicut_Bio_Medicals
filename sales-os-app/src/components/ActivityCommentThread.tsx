import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, TextField } from "@mui/material";
import { createActivityComment, listActivityComments } from "../services/activities";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// Phase 1 (docs/Activity-Comment-Implementation-Plan.md): a flat, post-only
// thread against a single Activity, rendered directly under it so it reads
// as part of the same card. No notifications yet, no edit/delete, no unread
// state -- all deferred to Phase 2. Collapsed and unfetched until expanded,
// so opening a timeline with many entries doesn't fire one query per entry.
export default function ActivityCommentThread({ activityId }: { activityId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["activity-comments", activityId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listActivityComments(activityId),
    enabled: expanded,
  });

  const postComment = useMutation({
    mutationFn: (body: string) => createActivityComment(activityId, body),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey });
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
          fontSize: "10px",
          fontWeight: 900,
          color: "#9ca3af",
          letterSpacing: "0.05em",
          minWidth: 0,
          p: 0,
          "&:hover": { color: "#4b5563", bgcolor: "transparent" },
        }}
      >
        {expanded ? "Hide comments" : "Comments"}
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
