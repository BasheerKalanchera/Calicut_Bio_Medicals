# Opportunity-Assignment Notifications (bell icon) — Implementation Plan

**Status:** Planned, not yet implemented
**Date:** 2026-08-24
**Origin:** Pivot from Reminders-on-Login work. Basheer described real
usage that the login-only reminders dialog can't cover: an admin (or
Area Manager) assigns an Opportunity's ownership to another user, and
that user currently has no way of finding out.

---

## Context

The Reminders-on-Login overlay only fires at explicit sign-in and is
hard-coded to one data source (`due_or_overdue_reminder_count`). A new
need has emerged that doesn't fit that shape: when one user assigns an
Opportunity to another (e.g. an admin creates a Karnataka-region
Opportunity with `owner_id = Shruthi`, or Shruthi later reassigns it to
the district sales rep covering that territory), the new owner needs to
find out — including if the assignment happens while they're already
mid-session, which a login-only dialog can never catch (relevant given
the PWA long-session pattern already seen in the UAT rollout).

Decision (confirmed with Basheer): build a small **generic notification
table**, not a single-purpose flag on `opportunity`. BR-OP-06 already
requires (but never implemented) a notification when an Opportunity goes
Stalled — the same mechanism will serve that later without rework.
Surface it as a **bell icon with a red-dot badge in the app header**
(WhatsApp-style, checked any time), separate from the reminders dialog.
A notification is marked read only when the recipient actually opens
that Opportunity's detail view — not merely by opening the bell dropdown.

Reminders-on-Login itself is untouched by this work.

**Added constraint — IndiaMART lead SLA:** Cabio must respond to an
IndiaMART-sourced lead within 4 hours to get credit for the buylead.
A quiet bell badge risks being missed for hours, which is not
acceptable for this case. Decision (confirmed with Basheer): add an
**urgency tier** — an assignment notification whose Opportunity's
`lead_source` is IndiaMART is flagged urgent and, in addition to
lighting the bell, pops an **interrupting dialog** the moment the
app (already open) next polls and sees it. This only reaches someone
who has the app open at the time — it cannot wake a fully closed
app/phone. Reaching a closed app requires real push notifications
(service worker + backend push sender), which is explicitly deferred
(see Out of scope) — Basheer chose the faster in-app-only version for
now and accepted that gap.

## Backend changes

**1. New table `notification`** (Alembic migration, run by Basheer per
the live-shared-DB rule in CLAUDE.md; add to `docs/Physical-Schema.sql`
alongside the other tables around line 479):
- `id uuid PK`
- `recipient_user_id uuid NOT NULL` FK → `user_profile`
- `type varchar(50) NOT NULL` — start with `'OPPORTUNITY_ASSIGNED'`
- `entity_type varchar(50) NOT NULL` — `'opportunity'`
- `entity_id uuid NOT NULL`
- `created_by uuid NOT NULL` FK → `user_profile` (the actor)
- `is_urgent boolean NOT NULL DEFAULT false` — set at creation time
  (see item 3 below); frozen at creation since a notification is a
  point-in-time event log entry, consistent with the rest of this table
- `created_at timestamptz DEFAULT now()`
- `read_at timestamptz NULL`

**2. New domain `backend/app/domains/notification/`** — mirror the
existing `activity`/reminder domain's structure (`models.py`,
`schemas.py`, `repository.py`, `service.py`, `router.py`):
- `NotificationRepository.create(...)`
- `NotificationRepository.list_for_user(user_id, limit=20)` — joins
  through to opportunity name, account name, and actor `display_name`
  so the dropdown can render without extra round-trips (no
  denormalization — resolve at read time, same pattern as
  `ReminderRepository`).
- `NotificationRepository.count_unread(user_id)`
- `NotificationRepository.mark_read_for_entity(user_id, entity_type, entity_id)`

**3. Hook into `backend/app/domains/opportunity/service.py`:**
- `create_opportunity` (~line 153-178): after `opp = self.repository.create(opportunity)`,
  if `data.owner_id != created_by`, call
  `NotificationService.notify_opportunity_assigned(recipient=data.owner_id, opportunity_id=opp.id, actor=created_by)`.
- `update_opportunity` (~line 184-212): it already computes
  `updates = data.model_dump(exclude_unset=True)` to distinguish
  explicitly-provided fields from omitted ones (same technique used for
  the recent zone_id null-vs-omitted fix). If `"owner_id" in updates`
  and the new value differs from the opportunity's current `owner_id`
  and differs from `updated_by` (skip self-assignment), notify the new
  owner the same way, before or after `setattr` — capture the old value
  first since `setattr` at line 210-212 overwrites it.

**4. Urgency determination** — in
`NotificationService.notify_opportunity_assigned`, look up the
Opportunity's `lead_source` name; if it matches a small constant set
(`URGENT_LEAD_SOURCE_NAMES = {"IndiaMART"}`, case-insensitive, easy to
extend later) set `is_urgent = True` on the created row, else `False`.

**5. New endpoints** (`backend/app/domains/notification/router.py`):
- `GET /notifications?limit=20` — recent notifications for
  `current_user`, most recent first.
- `GET /notifications/unread-count` — polled by the frontend for the
  badge; response distinguishes total unread from urgent unread, e.g.
  `{unread_count, urgent_unread_count}`.
- `GET /notifications/urgent-unread` — the (typically 0-1) urgent unread
  notifications with resolved opportunity/account/actor names, used to
  populate the interrupting dialog's content.

**6. Mark-as-read side effect** — in
`backend/app/domains/opportunity/router.py::get_opportunity` (line
117-124), after fetching the opportunity, call
`NotificationService.mark_read_for_entity(current_user.id, "opportunity", opportunity_id)`.
Piggybacks on the existing detail-fetch; no extra frontend call needed.

## Frontend changes

**1. New `sales-os-app/src/components/NotificationBell.tsx`** — MUI
`Badge` (`variant="dot"`, red) wrapping an `IconButton`, mounted in
`DemoApp.tsx`'s top header next to the existing Help `IconButton`
(~line 352-360). Click opens a MUI `Popover`/`Menu` listing recent
notifications (unread visually distinct).

**2. Polling** — fetch `GET /notifications/unread-count` on an interval
(~60s) and on window focus, so an assignment made mid-session lights up
the badge without requiring a fresh login. This is the reason it can't
live inside `LoginRemindersDialog`.

**3. Click-through** — clicking a notification item navigates to that
Opportunity's detail view (reuse whatever navigation
`handleReviewLoginReminders` already uses to open an opportunity by id).
The resulting `GET /opportunities/{id}` call marks it read server-side;
refetch unread-count afterward to clear the badge.

**4. New `sales-os-app/src/components/UrgentNotificationDialog.tsx`** —
an interrupting modal (same visual weight as `LoginRemindersDialog`,
but not gated by `justLoggedIn`). The same poll that refreshes the
bell badge also checks `urgent_unread_count`; if > 0, fetch
`GET /notifications/urgent-unread` and show this dialog listing them
("You've been assigned an IndiaMART lead: {account} — respond within
4 hours"), with a per-item "Review" button that navigates to the
Opportunity (marking it read, same as the bell's click-through) and
removes it from the dialog. Dismiss closes the dialog for now, but
since the notification stays unread until the Opportunity is actually
opened, it reappears on the next poll — it is not silence-forever-able
by accident.

**5. `LoginRemindersDialog` / `AuthContext.justLoggedIn` flow — no
changes.**

## Out of scope for this pass
- Notifying the *previous* owner when they're displaced by a
  reassignment.
- A full "Notifications" history page beyond the header dropdown's
  recent list.
- Wiring BR-OP-06 (Stalled-opportunity notifications) itself — the
  table is shaped to support it later, not built now.
- **Real push notifications** (service worker + backend push sender)
  that would reach a recipient whose app/phone is fully closed. The
  urgent dialog above only helps if the app is open when it polls;
  Basheer explicitly chose to defer push and accept that gap for now.

## Verification
- Backend: pytest coverage for `NotificationRepository`/`Service`
  (fires on owner mismatch at create; fires on owner_id change at
  update; does *not* fire when `owner_id` is unchanged, omitted, or
  self-assigned; `is_urgent` set correctly for IndiaMART-sourced vs.
  other opportunities) plus router tests for the three new endpoints
  and the mark-read side effect on `GET /opportunities/{id}`. Run
  `.venv/Scripts/python.exe -m pytest`.
- Frontend: `tsc --noEmit`, `eslint`, `vite build`.
- Manual E2E (Basheer runs, live dev DB):
  - Non-urgent: admin creates a Karnataka Opportunity (non-IndiaMART
    source) with `owner_id = Shruthi` → Shruthi's bell shows a red dot
    on next poll/focus, no interrupting dialog → she opens it → badge
    clears → she reassigns `owner_id` to the district rep → that rep's
    bell lights up.
  - Urgent: admin creates/assigns an IndiaMART-sourced Opportunity to a
    user → that user gets the interrupting dialog (not just the bell)
    on next poll while the app is open → Review navigates to the
    Opportunity and clears it.
