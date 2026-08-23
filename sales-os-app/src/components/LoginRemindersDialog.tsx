import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

// Reminders-on-login: shown once per explicit sign-in (gated on
// AuthContext's justLoggedIn — never on a page refresh/session restore) to
// surface how many of the user's own Next Actions are due today or already
// overdue. The count rides on /auth/me's response (already fetched as part
// of signing in) rather than a separate call, so there's nothing to load
// here. Renders nothing when the count is zero -- this is a convenience
// nudge, not something that should ever block or clutter the login
// experience.
export default function LoginRemindersDialog({ onReview }: { onReview: () => void }) {
  const { justLoggedIn, clearJustLoggedIn, userProfile } = useAuth();
  const count: number = userProfile?.due_or_overdue_reminder_count ?? 0;

  if (!justLoggedIn || !count) return null;

  return (
    <Dialog open onClose={clearJustLoggedIn} maxWidth="xs" fullWidth>
      <DialogTitle>Next Actions</DialogTitle>
      <DialogContent>
        {count} next action{count === 1 ? "" : "s"} due today or overdue.
      </DialogContent>
      <DialogActions>
        <Button onClick={clearJustLoggedIn}>Dismiss</Button>
        <Button
          variant="contained"
          onClick={() => {
            clearJustLoggedIn();
            onReview();
          }}
        >
          Review
        </Button>
      </DialogActions>
    </Dialog>
  );
}
