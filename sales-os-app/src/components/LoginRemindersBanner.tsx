import { useEffect, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { countDueOrOverdueReminders } from "../services/activities";

// Reminders-on-login: shown once per explicit sign-in (gated on
// AuthContext's justLoggedIn — never on a page refresh/session restore) to
// surface how many of the user's own Next Actions are due today or already
// overdue. Renders nothing while loading, on a fetch failure, or when the
// count is zero -- this is a convenience nudge, not something that should
// ever block or clutter the login experience.
export default function LoginRemindersBanner({ onReview }: { onReview: () => void }) {
  const { justLoggedIn, clearJustLoggedIn } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!justLoggedIn) return;
    let cancelled = false;
    countDueOrOverdueReminders()
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .catch(() => {
        if (!cancelled) clearJustLoggedIn();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justLoggedIn]);

  if (!justLoggedIn || !count) return null;

  return (
    <Box sx={{ maxWidth: "56rem", mx: "auto", width: "100%", px: 2, pt: 1.5 }}>
      <Alert
        severity="info"
        onClose={clearJustLoggedIn}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              clearJustLoggedIn();
              onReview();
            }}
          >
            Review
          </Button>
        }
      >
        {count} next action{count === 1 ? "" : "s"} due today or overdue.
      </Alert>
    </Box>
  );
}
