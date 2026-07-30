# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST

**Phase 2E task checklist (see `docs/Phase-2E-Build-Estimate.md` §6 for the
original 10-item source list; Task 1a was inserted ahead of Task 2 mid-build,
2026-07-26, so numbering below reflects actual build order, not the doc):**
1. [x] Migration: `manager_id`, role rename/new tiers, `cabio_app` role+grants — DONE
2. [x] User Directory screen: create + update `user_profile` (Admin/GM gated) — DONE, Basheer's manual E2E passed 2026-07-27 (see note below)
3. [ ] **PARKED, not blocking** — Assign real staff to Area Manager / Sales Manager tiers (via the Task 1a screen, not raw SQL). Per `Phase-2E-Build-Estimate.md` (line 151/157), this was always scoped as "Basheer's call on names/reporting lines, not build work," and the plan's own RLS verification step (Item 8) explicitly says Area Manager/Sales Manager testing happens via *reassigning an existing test account*, not real staff — so nothing in Tasks 4-9 depends on this. Test accounts already stood up (2026-07-27, see note below) fully cover Task 7/8's verification needs. **Do this before UAT rollout** (once real names/reporting lines are confirmed with Cabio leadership), not before continuing the RLS build.
4. [x] 4-var `set_rls_context()` + `cabio_app_uid`/`sbu_id`/`role_id`/`zone_id` SQL helper functions — DONE, applied to live dev DB 2026-07-27 (see note below), real bug found + fixed before it could hit Tasks 5-7
5. [x] RLS policies: `opportunity`, `split`, `opportunity_item`, `opportunity_stakeholder` (clean join-back bucket) — DONE, applied to live dev DB 2026-07-27 (see note below)
6. [x] RLS policies: `activity`, `document`, `reminder` (conditional/two-hop — highest-risk item, see §2 of the estimate doc) — DONE, applied to live dev DB 2026-07-27 (see note below), scope grew mid-build to also widen `opportunity`'s own policy (participant visibility)
7. [x] RLS policy: `product` (flat SBU check) — DONE, applied to live dev DB 2026-07-27 (see note below)
8. [x] Local verification loop (all 6 tiers × every table above) — DONE 2026-07-27 (see note below), 56/56 checks passed
9. [x] Cutover to `cabio_app` on dev — DONE and committed (`7d7155d`,
   2026-07-30); full detail (read-path + Basheer's manual write-path retest,
   both regressions found/fixed, ADR-037/BR-FIN-06/BR-ACT-06/BR-ACT-07)
   archived in `docs/Progress-Archive-2026-07.md`.
10. [ ] Doc fixes: `Physical-Schema.sql`, `Backend-Implementation-Standards.md`, ADR-009, `Phase-2E-Security-Architecture.md` (now also needs its exact `cabio_app_*()` SQL snippet corrected, see Task 4 note below — not just the zone_id addendum already tracked), `CLAUDE.md` zone list
    *(fast-follow, not blocking, not numbered above: Admin/GM "Edit User" screen upgrade to full Supabase-Admin-API self-service signup — deferred until Cabio staff take autonomous ownership of onboarding)*

**2026-07-30 — 3 UI gaps from the Task 9 retest, fixed (uncommitted, this
session):** mobile Owner-field truncation on Opportunity Detail (wraps
instead of ellipsis-cutting long names), a new read-only "Next Actions" tab
on Opportunity Detail (opportunity-scoped reminder list, backed by a new
`GET /opportunities/{id}/reminders`, relies on existing RLS join-back for
visibility — no new authorization logic), and "Logged by" now shown on every
reminder (`ActivityContextNested` gained `user`, data was already
eager-loaded). Deliberately **not** wired with a "mark complete" action from
the new tab — unlike the standalone Next Actions screen, this list isn't
scoped to "reminders assigned to me," and reminder completion has no DB-level
`WITH CHECK` restricting it to the assignee, so exposing it here would be a
real (undocumented) authorization change, not a UI convenience. Extracted the
inline `ReminderRow` (was in `NextActionsScreen.tsx`) into shared
`components/ReminderRow.tsx`. Backend: 365/365 passed, ruff clean.
Frontend: `tsc --noEmit` / `npm run lint` clean. `types/api.ts` regenerated
against local backend; hand-written alias block re-appended (regeneration
wipes it — see the comment at the top of that block). Basheer's manual
E2E pass still pending before commit.

**Next session starts here:** confirm this session's commit landed, then
either Task 10 (doc fixes above), the still-open hierarchy build-out
(blocked on Basheer creating 3 new Supabase Auth accounts — see
`docs/Progress-Archive-2026-07.md`'s Task 9 write-up), or BR-ACT-05 (require
logging what was done to close out a reminder — see `docs/Backlog.md`,
open product decision: hard requirement vs. soft prompt). All three
independent, any can go first.
