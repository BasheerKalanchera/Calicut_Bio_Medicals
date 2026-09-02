# Auth Session Resilience — Implementation Plan

**Status:** Built 2026-08-31, manually verified and committed 2026-09-02.
`tsc --noEmit` and `npm run lint` both clean. Confirmed zero file overlap
with the concurrent BR-ACC-03 and Audit Trail sessions.

**Verification summary (2026-09-02):** Part B was tested clean across four
conditions — tab watched, walked away without watching, tab-switched and
back, and a realistic 1-minute background gap — all producing the correct
idle-timeout sign-out with the distinct message. Part A was tested by
stopping the backend mid-session, confirming no premature sign-out, then
restarting and confirming automatic re-entry with no re-login required.
Two real issues were found and fixed during this pass, beyond the original
design below:

- **`signOutReason` ordering bug:** `signOut()` was setting `signOutReason`
  *after* calling `supabase.auth.signOut()`, which independently fires its
  own `onAuthStateChange(SIGNED_OUT)` event that could reach `LoginScreen`
  before the reason was set. Fixed by setting `signOutReason` first.
- **Backgrounded-tab throttling gap:** browsers throttle `setInterval` in a
  hidden/backgrounded tab, so Part B's periodic check could fire far less
  often than `CHECK_INTERVAL_MS` while hidden. Fixed by adding a
  `visibilitychange`-triggered immediate re-check on top of the existing
  interval (not a reset — only real interaction resets the clock, per the
  original design below) so a throttled timeout is caught the moment focus
  returns.

**New addition beyond the original design — `sessionCheckFailed` banner:**
Part A's retry-then-preserve behavior (see below) is invisible by design
when it fires mid-session (the screen just keeps working). But if the page
*reloads* while the backend is unreachable, on-screen state resets to blank
regardless, landing the user on a bare login form indistinguishable from a
real logout — even though their underlying session was never actually
revoked. Fixed by adding a `sessionCheckFailed` boolean to `AuthContext`
(set in `applySession`'s non-definitive-failure branch, cleared on the next
successful check or any explicit `signOut()`) and a corresponding
`LoginScreen` banner: "We were unable to verify your session due to a
connectivity issue. Please refresh the page before signing in again."

**Raised:** 2026-08-31, investigating reports of users getting logged out
periodically.

## Background

Two independent, unrelated problems surfaced from the same investigation:

1. **A real bug** — false logouts caused by a fault-intolerant deactivation
   check, introduced 2026-08-15 (commit `980d81b`).
2. **A real gap** — no inactivity/idle timeout exists at all, so an
   authenticated session with a live tab can stay signed in indefinitely
   as long as background token refreshes keep succeeding.

They're bundled in one plan because both touch the same file
(`AuthContext.tsx`) and the same underlying concept (when does a session
end), but they are independent fixes — either can ship without the other.

## Part A — Retry-before-signout (bug fix)

### Root cause

`AuthContext.tsx`'s `applySession()` (lines 50-66) runs on every Supabase
auth event, including the automatic `TOKEN_REFRESHED` event Supabase fires
roughly hourly (default access-token lifetime) as long as the tab is open.
Every one of those calls `getCurrentUser()` → `GET /auth/me`, and the
`catch` block signs the user out on **any** failure — a genuine
401/403 (token invalid, account deactivated) is treated identically to a
network blip, a timeout, or a transient 5xx during a backend restart.

Introduced by commit `980d81b` (2026-08-15), which added the
deactivation-gate check itself (`docs/Backlog.md`'s security rationale:
Supabase Auth has no concept of `user_profile.is_active`, so deactivated
credentials still worked at the Auth layer without this check). The
security intent is correct; the failure-mode handling isn't.

### Fix

In `applySession`'s `catch` (`AuthContext.tsx:60-64`):

- If the error is an `ApiError` (from `lib/api.ts`) with `status === 401`
  or `403` — a definitive rejection — sign out immediately, same as today.
- Any other error (no `status`, i.e. network/timeout error, or a `5xx`) —
  retry `getCurrentUser()` up to 2 more times with a short backoff (e.g.
  1s, then 3s) before giving up.
- If retries are exhausted with no definitive rejection: do **not** sign
  out. Leave the existing session/profile in place — the Supabase JWT
  itself is still valid; `/auth/me`'s `is_active` check is a courtesy
  layered on top of it, not the source of truth for token validity. Log a
  `console.warn` so a real recurring backend problem is still visible in
  the browser console, not silently swallowed.
- Applies uniformly to both call sites that route through `applySession`:
  the mount-time `getSession()` call (line 68-73) and the
  `onAuthStateChange` listener (line 75-80) — a bad network at app open
  should behave the same as a bad network mid-session, not bounce
  straight to the login screen.

### Things to check during implementation

- `lib/api.ts:56-69` has its own independent 401→refresh→retry→signOut
  path (for any API call, not just `/auth/me`). Confirm it isn't also
  firing spuriously for the same transient failure — if `/auth/me`'s
  own request goes through `api.get(...)`, a 401 there could trigger
  *both* this path's `refreshAuthSession()` retry and `applySession`'s
  retry. Not necessarily wrong (defense in depth), but trace it through
  once rather than assuming — avoid two independent retry loops
  double-firing refresh calls.
- Retries must not block `setLoading(false)` indefinitely on the
  mount-time path — cap total retry time to a few seconds.

### Test plan

No existing frontend test suite covers `AuthContext.tsx` (confirmed —
no `*.test.tsx`/`*.spec.tsx` files exist for it). Per established practice
on this project, verify manually rather than adding a test harness just
for this:
- Simulate a transient failure (throttle/kill network briefly, or a
  temporary `/auth/me` 500 via a backend restart) during an active
  session — confirm session survives, console warning appears, no
  logout.
- Confirm an actual deactivation (toggle `is_active` off for a test user
  mid-session) still signs out promptly — the fix must not weaken the
  original security intent.
- Confirm normal hourly token refresh still works end-to-end (harder to
  test live within a session — acceptable to reason through the code
  path instead, per BasheerKalanchera's usual live/manual verification
  style for anything else).

## Part B — 60-minute inactivity timeout (new control)

### Decision

**60 minutes of no user interaction → automatic sign-out.** Decided
2026-08-31 (not a regulatory requirement — Cabio's data isn't
PCI/HIPAA-scoped; 60 min balances not interrupting a rep mid-task against
not leaving a session open indefinitely on an unattended device). On
mobile, the phone's own lock screen is the primary control; this is
defense-in-depth for an unlocked device left idle.

### Design

- New hook, e.g. `useIdleLogout(timeoutMs, onTimeout)`, in a new file
  (e.g. `src/hooks/useIdleLogout.ts`).
- Track last-activity time in a `ref` (not React state — avoid a
  re-render on every mouse move). Update it, throttled to at most once
  per ~30s, on `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`
  listeners attached at mount.
- A single `setInterval` (e.g. every 30-60s) checks elapsed time since
  last activity; when it crosses 60 minutes, call the provided
  `onTimeout` callback once and stop checking until re-armed.
- Do **not** reset the timer on `visibilitychange` alone — backgrounding
  the tab is exactly the case this is meant to catch. Only real user
  interaction resets the clock.
- Mount this hook inside `AuthGate` (`main.tsx:24-40`), guarded to run
  only when `isAuthenticated` is true — no reason to run it on the login
  screen. On timeout, call `useAuth().signOut()` and show a distinct
  message (e.g. a query param or local state flag `LoginScreen` reads to
  render "You were signed out due to inactivity") — **must not** reuse
  the same silent-redirect UX as a real error, or it becomes
  indistinguishable from the Part A bug this whole investigation started
  from.

### Accepted edge case, not a blocker

A single UI interaction with no follow-up for 60+ minutes during a
long-running background operation (e.g. a large document upload) could
theoretically log a user out mid-operation. Extremely unlikely given
typical file sizes in this app (`Opportunity-Document-Upload-
Implementation-Plan.md`) — not worth engineering around up front.

### Config

Hardcode 60 minutes as a constant at the top of the hook file. No backend
involvement — this is purely client-side, unlike
`ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD` (`core/config.py`), which needed
backend tuning because multiple untrusted clients could bypass a
frontend-only threshold. Session inactivity has no equivalent bypass
concern (a user idling out their own client-side session isn't a
threat model), so no `.env` plumbing needed.

### Test plan

Manual: shorten the constant temporarily (e.g. to 10s) during local
verification, confirm sign-out fires and the distinct message renders;
restore to 60 min before commit.

## Sequencing / scope note

Both parts touch `AuthContext.tsx` and `main.tsx` only, plus one new hook
file. No overlap with the concurrent BR-ACC-03 duplicate-hospital session's
files (`account/schemas.py`, `account/repository.py`, `account/service.py`,
`duplicate_matching.py`, `CustomerDirectoryScreen.tsx`, `FormModal.tsx`,
`formErrors.ts`) — safe to pick up independently once that session's
build is done, no merge coordination needed.
