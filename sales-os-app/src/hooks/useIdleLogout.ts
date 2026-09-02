import { useEffect, useRef } from "react";

// 60 minutes of no interaction -> automatic sign-out. Defense-in-depth on
// top of the device's own lock screen, not a regulatory requirement (Cabio's
// data isn't PCI/HIPAA-scoped). See docs/Auth-Session-Resilience-
// Implementation-Plan.md Part B.
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
// Throttles how often a real interaction updates lastActivityRef -- avoids a
// ref write on every single mousemove/scroll event.
const ACTIVITY_THROTTLE_MS = 30 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

// visibilitychange does NOT reset the clock -- only real user interaction
// does, so backgrounding the tab is still exactly the case this is meant to
// catch. It does, however, trigger an extra immediate *check* (not a reset)
// when the tab becomes visible again: browsers throttle setInterval in a
// backgrounded/hidden tab to save power, so the regular periodic check can
// fire far less often than CHECK_INTERVAL_MS -- or not at all for a short
// idle window -- while the tab is hidden (confirmed 2026-08-31 manual
// testing: the timeout never fired while the tab was in the background,
// only once focus returned). Re-checking on return closes that gap: even if
// the periodic check got throttled the whole time, coming back immediately
// re-evaluates the real elapsed time instead of waiting for the next tick.
//
// `enabled` (e.g. AuthGate's isAuthenticated) gates the listeners/interval
// themselves, not just whether onTimeout does anything -- no reason to run
// either on the login screen. Rules of hooks means this must still be called
// unconditionally by the caller; toggle `enabled` instead of the call itself.
export default function useIdleLogout(onTimeout: () => void, enabled: boolean): void {
  // 0, not Date.now() -- an impure call isn't allowed directly in the render
  // body (its argument is evaluated every render even though only the first
  // one is kept). The effect below overwrites this with the real timestamp
  // before anything else runs, so the placeholder is never actually read.
  const lastActivityRef = useRef(0);
  const firedRef = useRef(false);
  // Keeps the listener-setup effect below from needing onTimeout in its
  // dependency array -- it only needs to read whatever the latest callback
  // is when the interval actually fires, not re-run the whole mount/listener
  // setup on every render. Synced in its own effect (no deps -- runs after
  // every render), not assigned directly in the render body: writing to a
  // ref's `.current` during render itself isn't allowed.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();
    firedRef.current = false;

    let lastRecorded = Date.now();
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < ACTIVITY_THROTTLE_MS) return;
      lastRecorded = now;
      lastActivityRef.current = now;
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    const checkIdle = () => {
      if (firedRef.current) return;
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    };

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") checkIdle();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, recordActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [enabled]);
}
