# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-24_

## Current task — Opportunity-Assignment Notifications built; manual E2E next

**Build is done and committed** (`b772416`, 2026-08-24): header bell
with unread badge (60s poll) plus an interrupting dialog for
IndiaMART-sourced leads (4-hour buylead-credit SLA), per
`docs/Opportunity-Assignment-Notifications-Implementation-Plan.md`.
Backend domain (`notification`), migrations 0024-0026, hooks in
`create_opportunity`/`update_opportunity`, frontend `NotificationBell`
+ `UrgentNotificationDialog`, and backend tests are all in. **Two RLS
bugs found and fixed during manual testing** (also in `b772416`): the
recipient-scoped policy's implicit `WITH CHECK` blocked any INSERT
where the actor differs from the recipient (i.e. every real
assignment); after that fix, SQLAlchemy's read-your-write `RETURNING`
was still filtered by the original narrow `USING`, since `RETURNING`
on INSERT is checked against `USING`, not `WITH CHECK`.

**Not yet done: full manual E2E pass.** Basheer still needs to walk
through the feature end-to-end and, in the same pass, confirm the
still-open Reminders-on-Login checklist items (overdue+due-today
dialog content, dismiss/review, no-dialog-when-none-due, refresh
doesn't retrigger, Review pre-filter, date-range filter, latency — see
`docs/Reminders-on-Login-Implementation-Plan.md`'s Verification
section). The two features don't touch the same code —
`LoginRemindersDialog`/`AuthContext.justLoggedIn` are unchanged — this
is bundled for convenience since both surface in the app header, not
because one verifies the other. Log actual per-item results in
`docs/Progress-Archive-2026-08.md` once known, not assumed here.

## UAT migration — status as of 2026-08-24

**Done:** Karnataka zone tree (Karnataka → District flat, except
Bangalore keeps its cluster node + Zone 1-6), Fazal's and Shruthi's
district-level assignments. Full narrative:
`docs/Progress-Archive-2026-08.md`'s 2026-08-21 and 2026-08-24 entries;
underlying territory data: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`.

**Staged rollout is on track and unchanged in shape:** only the Star
Sales team has been given UAT access so far, and they are currently
testing. **The extended sales team has NOT been rolled out or started
testing** — that step, and Monday-style training for them, is still
gated behind explicit Star Sales sign-off, which has not been received
yet. Don't assume the extended team has any access until that sign-off
lands and the next rollout step actually happens.

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode
safety classifier regardless of chat approval. Basheer runs these
himself (`!`-prefixed or his own terminal). **Partial nuance,
2026-08-23:** read-only SQL (SELECT queries via a python/psycopg2
script) ran fine without tripping the classifier — the blocker may be
scoped to writes/DDL specifically, not tested further.

## Next up, after the manual E2E pass above

**Referral Credit Part 2 — Relationship-Support Activity.** Fully
scoped and ready to build — see `docs/Backlog.md`, not repeated here.
