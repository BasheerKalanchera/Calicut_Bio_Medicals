# Reminders-on-Login + Next Actions Date-Range Filter — Implementation Plan

**Status:** Planned, not yet implemented
**Date:** 2026-08-22
**Origin:** GM Haroon requested "a notification note when a user logs in."
Clarified with Basheer this is the previously-deferred **Reminders-on-login**
backlog item (`docs/Backlog.md:296` — "DEFERRED behind the migration — not
lost, not current"), not a GM-facing "who logged in" alert.

---

## Context

When any user logs in, they should see a short, clickable note about their
own pending Next Actions — not a GM-facing alert about who logged in. Scope,
per Basheer (2026-08-22):

- Trigger: every user, every login.
- Content: a short headline counting Next Actions **due today or overdue**
  (not all pending), clickable through to the Next Actions screen. No list
  in the popup itself.
- Zero due/overdue → show nothing.
- Bonus ask: the Next Actions screen itself should gain a **date-range
  filter**, so reps can plan their day/week — and so it's ready to support
  Milestone 2's coverage-execution planning without rework.

The reminder data model, repository, service, router endpoint
(`GET /reminders`), and rendering component (`ReminderRow`, with its
existing `isOverdue()` helper) already exist and are already scoped to the
current user server-side. This is an additive filter + a small piece of
frontend UI, not a new subsystem — **no DB migration needed**.

## Backend changes

**`backend/app/domains/activity/repository.py`** (`ReminderRepository`) —
add optional `due_after: datetime | None` / `due_before: datetime | None`
params to `list_for_user` and `count_for_user`, applied as
`Reminder.due_date >= due_after` / `<= due_before` when provided (column is
already indexed). `list_by_opportunity`/`count_by_opportunity` don't need
this — only the user-scoped queries.

**`backend/app/domains/activity/service.py`** (`ReminderService.list_for_user`)
— thread the same two optional params through to the repository calls.

**`backend/app/domains/activity/router.py`** (`GET /reminders`) — add
`due_after: datetime | None = Query(None)` and
`due_before: datetime | None = Query(None)`, pass through to
`service.list_for_user(...)`. No schema/response changes — `ReminderResponse`
and the pagination shape are unchanged.

No Alembic migration, no new endpoint, no RLS/role changes — this reuses the
existing `current_user`-scoped query path as-is.

After the router signature changes, regenerate frontend types per project
convention: `npm run generate:types` in `sales-os-app`.

## Frontend changes

**`sales-os-app/src/contexts/AuthContext.tsx`** — add a `justLoggedIn`
boolean + `clearJustLoggedIn()` to context state. Set `justLoggedIn = true`
only at the end of `signIn()`'s success path (inside the `try`, after
`applySession` resolves) — **not** inside `onAuthStateChange` or the
mount-time `getSession()` call, so a page refresh or tab reopen never
retriggers it (`signingInRef` already exists precisely to distinguish these
two paths — same pattern, new flag).

**`sales-os-app/src/services/activities.ts`** — add
`countDueOrOverdueReminders()`: calls `GET /reminders` with
`include_completed=false`, `due_before=<end of today, ISO>`, `page_size=1`,
and returns `r.data.data.total` (the count comes from the existing SQL
`COUNT`, so `page_size=1` keeps the payload light without a new endpoint).

**New component `sales-os-app/src/components/LoginRemindersBanner.tsx`** —
a dismissible one-line MUI `Alert`/banner ("3 next actions due today or
overdue — click to review"). Fetches the count via
`countDueOrOverdueReminders()` only when `justLoggedIn` is true; renders
nothing if the count is 0 or still loading. On click or dismiss, calls
`clearJustLoggedIn()` so it can't reappear later in the same session.

**`sales-os-app/src/DemoApp.tsx`** — mount `LoginRemindersBanner` near the
top of the shell. Its click handler navigates to the Next Actions view
(`setView("next-actions")`) and pre-applies a "due today or overdue" filter,
following the existing `selectedOpportunityInitialTab` /
`customer360InitialTab` pattern already used in this file to hand an initial
filter/tab into a screen on navigation.

**`sales-os-app/src/screens/NextActionsScreen.tsx`** — add a date-range
filter alongside the existing Pending/Completed toggle, following the
`DatePicker`/`dayjs` pattern already used in
`DailyActivityReportScreen.tsx`: two `DatePicker` fields (From/To), local
state `dueAfter`/`dueBefore : Dayjs | null`, included in the `useQuery` key
and passed to `listReminders`. Accept an optional `initialDueBefore` prop
(mirroring the `initialTab` convention) so the login-banner click-through
can pre-filter to "today." `listReminders()` itself needs a signature
update to accept and forward the new `due_after`/`due_before` params.

## Verification

- Backend: extend the existing reminder repository/service/router tests
  (`backend/tests/domains/activity/`) with cases for `due_after`/`due_before`
  filtering (none, one bound, both bounds).
- Manual E2E (Basheer runs this himself, per project convention): log in as
  a user with at least one overdue and one due-today reminder → confirm the
  banner shows the correct count and disappears on dismiss/click; log in as
  a user with none due/overdue → confirm no banner; refresh the page after
  login → confirm the banner does **not** reappear; click the banner →
  confirm Next Actions opens pre-filtered to today; manually adjust the
  date-range filter on Next Actions and confirm results match.
