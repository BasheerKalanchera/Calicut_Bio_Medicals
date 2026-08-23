# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-23_

## Current task — STOP HERE FIRST

**E2E-verify Reminders-on-Login before anything else.** Built
2026-08-22 (`dc826b2`), then revised 2026-08-23: banner → overlay
dialog (Basheer's UX call), plus two latency fixes (see the 2026-08-23
entry in `docs/Progress-Archive-2026-08.md`). Not yet manually walked
through. Full design in `docs/Reminders-on-Login-Implementation-Plan.md`.

**What it does:** an overlay dialog appears right after an explicit
login (never on page refresh/session restore) if the user has any Next
Actions due today or overdue; clicking Review opens Next Actions
pre-filtered to that same set. Next Actions also gained a manual
"Due from / Due to" date-range filter.

**Checklist for the manual pass:**
- Log in as a user with ≥1 overdue and ≥1 due-today reminder → dialog
  shows the correct count, closes on Dismiss or on Review.
- Log in as a user with none due/overdue → no dialog appears.
- Refresh the page after logging in → dialog does **not** reappear.
- Click Review → Next Actions opens pre-filtered to today.
- Manually adjust the new date-range filter on Next Actions → results
  match the selected range.
- Dialog should now appear essentially instantly after login (no
  separate fetch/wait) — confirm it doesn't lag behind the pipeline
  screen the way the original banner did.

Automated coverage is already green (528 backend tests, `tsc --noEmit`,
`vite build`, `eslint`) — this is purely the manual walkthrough. Not
yet committed.

**Once verified:** drop this section from this file. If the walkthrough
finds a bug, fix it, then log the fix in the 2026-08-23 Progress Archive
entry (append, don't rewrite) before moving on to UAT migration.

## Then: resume UAT migration, Part 2 — Users & Territories, staged rollout

Part 1 (code promotion) is DONE and verified on UAT. Full narrative for
everything that happened 2026-08-21 (RLS lockout recurrence, zone_id
clear-bug fix, Central Kerala deprecation, Karnataka tree-flattening
decision) is in `docs/Progress-Archive-2026-08.md`'s 2026-08-21 entry —
not repeated here.

**Rollout stays staged:** Star Sales team's territory setup + their
sign-off comes before notifying anyone or extending to the broader team.
Training/rollout to the extended sales team is Mon 2026-08-24 (moved
from Sat 2026-08-22 — Basheer has a personal event needing weekend
errands).

**Immediate next step:** finish the Karnataka zone tree per the
2026-08-21 decision (Karnataka → District flat, except Bangalore keeps
its cluster node + Zone 1-6), then:
1. Fazal — North Kerala (Kasaragod, Kannur, Kozhikode) + Coastal
   Karnataka (Mangalore, Dakshin Kannada, Coorg, Udupi, Shimoga,
   Bhatkal) district assignments, all Imaging. In progress when the
   session ended.
2. Shruthi — needs an explicit district-level assignment for each of
   Mysore, Mandya, Ramnagara, Chamrajnagar, Tumkur, Chitradurga, Hassan,
   Dharwad (South/Central/North Karnataka districts) once those clusters
   flatten — not yet started. See the 2026-08-21 archive entry for why.
3. Confirm Territory Map's coverage pills show correctly for all 4 Area
   Managers.
4. Only then notify the Cabio Star Sales team on WhatsApp to refresh —
   remind them of the 2-step PWA refresh (force-close/reopen, then a
   fresh browser visit if that alone doesn't pick up the new build;
   `docs/PWA-UAT-MobileLaptop-Setup.md`).
5. Get explicit Star Sales sign-off before extending to the broader team
   ahead of Monday's training.

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode
safety classifier regardless of chat approval. Basheer runs these
himself (`!`-prefixed or his own terminal) — confirmed working pattern
throughout 2026-08-21. **Partial nuance, 2026-08-23:** read-only SQL
(SELECT queries via a python/psycopg2 script, used to root-cause the
reminders-dialog latency) ran fine without tripping the classifier —
the blocker may be scoped to writes/DDL specifically, not untested here.

## Next up, after UAT migration lands

**Referral Credit Part 2 — Relationship-Support Activity.** Fully
scoped and ready to build — see `docs/Backlog.md`, not repeated here.
