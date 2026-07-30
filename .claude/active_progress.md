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
10. [x] Doc fixes — DONE 2026-07-30: `Physical-Schema.sql` (`manager_id`
    column + new §10 RLS object-name summary), `Backend-Implementation-Standards.md`
    (§12 config fields, §9 RLS Context Propagation rewritten from prospective
    to descriptive), `ADR-009` (rewritten — wrong role name, wrong 2-tier
    model, wrong JWT-claims mechanism all corrected to match the actual
    6-tier + participant-carve-out build), `Phase-2E-Security-Architecture.md`
    (all 7 `cabio_app_*()` functions + `NULLIF` guard, not just 3; Deferred
    Decisions/Implementation Checklist/Testing Strategy sections brought
    current), `CLAUDE.md` zone list (added Bangalore). Two more found along
    the way and also fixed: `backend/.env.example` (was missing
    `ADMIN_DATABASE_URL` entirely — a new dev following it would hit a
    startup crash, `Settings()` has no default for that field; added, plus
    `CABIO_APP_DB_PASSWORD` with a comment that it's a one-time migration-0008
    bootstrap value); `Enterprise-Data-Model.md:186`'s Account security note
    (corrected the `set_rls_context()` no-op claim — it's live since
    2026-07-27 — while keeping its "Accounts are globally readable" conclusion,
    which is still true: `account` was never given `ENABLE ROW LEVEL SECURITY`
    in any Phase 2E migration, unlike its 8 sibling tables).
    *(fast-follow, not blocking, not numbered above: Admin/GM "Edit User" screen upgrade to full Supabase-Admin-API self-service signup — deferred until Cabio staff take autonomous ownership of onboarding)*

**Phase 2E build is now fully complete and documented (Tasks 1-10).** The 3
UI gaps from the Task 9 retest (mobile Owner truncation, Next Actions tab,
"Logged by" on reminders — see `docs/Progress-Archive-2026-07.md` for detail
if needed) were committed `e124d94` before this session.

**Next session starts here — two independent threads, either can go first:**
- Hierarchy build-out (Critical Care/Imaging manager chains) — blocked on
  Basheer creating 3 new Supabase Auth accounts; see
  `docs/Progress-Archive-2026-07.md`'s Task 9 write-up.
- BR-ACT-05 (require logging what was done to close out a reminder) — open
  product decision, hard requirement vs. soft prompt; see `docs/Backlog.md`.
