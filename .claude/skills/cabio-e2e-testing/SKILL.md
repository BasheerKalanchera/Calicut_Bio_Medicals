---
name: cabio-e2e-testing
description: Cabio Sales OS checklist for the pre-E2E code review, writing or changing a manual E2E test plan, and running any manual E2E step (Claude in the browser or Basheer-run). Load once a feature or fix is built and before its manual E2E, before writing or editing a test plan, and before any E2E step.
---

# Cabio — pre-E2E review and manual E2E testing

Origins of each rule: `docs/Process-Rules-History.md` (grep the date tag).
Moved here word for word from CLAUDE.md on 2026-10-08
(`docs/Process-Consolidation-Implementation-Plan.md`).

## Pre-E2E code review
- Before manual E2E on a feature, run `/code-review` (medium by default; high for
  RLS/migration/approval-workflow-heavy features) on its commits and fix findings
  first. *(2026-09-17)*
- Applies however small or pattern-mirroring the change — follow the full sequence
  (code-review → written E2E plan → test → commit → checklist) by default, without
  being asked. *(2026-09-22)*
- If correctness depends on a DB trigger, generated column, or other server-side
  write the ORM doesn't re-read, add "did a real save actually complete" as an
  explicit review item — static review can't see a stale in-memory object.
  *(2026-09-22)*
- If the feature has migrations, confirm before E2E starts: Dev's `alembic current`
  = head, and `docs/Physical-Schema.sql` has been regenerated since the last one.
  *(2026-09-23)*
- Before manual E2E, run pytest, ruff, tsc and lint and report plainly, noting
  any failures that already existed. *(2026-07-03)*
- Suggest `/ultrareview` only for higher-risk changes (security, untested hotfix,
  large unreviewed change), not routine commits. *(2026-09-15)*

## Manual E2E testing
- Before each test case, check the plan's assumed role relationship matches the
  record actually under test, not just the plan's original setup. *(2026-09-18)*
- Tag every step Simple or Complex before running the plan. **Simple** = one
  click/type/verify-a-value with an unambiguous pass — Basheer runs these, told
  exactly what to do and check, and reports back. **Complex** = precise targeting
  after a layout shift, multi-step/branching, cross-screen/cross-role, or a genuine
  visual check — Claude drives these in the browser. Nothing is skipped; every step
  is recorded. *(2026-09-23)* Before each browser action, say which step it is
  and why it's Complex; a Simple step goes to Basheer. *(2026-10-06)* Check
  with Basheer before starting browser checks of the screens for any E2E
  test plan. *(2026-10-08)*
- Screenshot only at meaningful checkpoints; use `get_page_text`/`find` to confirm
  a value when a visual check isn't the point. Prefer `find` element refs over
  screenshot coordinates for clicks, especially after a layout shift.
- Record Pass/Fail in the test plan doc the moment each step completes.
  *(2026-09-22)*
- Flag the hot-reload risk before editing frontend files while a test browser
  session is open — it can silently reset the logged-in user. *(2026-09-22)*
- Before the first step of any manual E2E run, have the Dev backend restarted
  (or confirm it restarted after the feature's last backend change) — its
  auto-reload can silently stop, leaving the screen on old code. *(2026-09-27)*
- When writing a test plan, check its assumed data read-only against the live
  records — existing splits/values, and who each picker actually offers (owner,
  split, assignee) — not just role relationships. *(2026-09-24)*
- When writing a test plan, take button labels, messages and the order of
  checks from the code, not the design doc. *(2026-09-30)*
- A test plan for any permission or visibility feature must include a
  hide-check case — a real person who must NOT see a given row, picked from
  live data — and re-run the scope check just before E2E, not only when the
  plan was written. *(2026-10-04)*
- Steps that save to the shared Dev DB: plan them as "Basheer clicks, Claude
  watches" from the start (the auto-mode classifier blocks Claude's own writes).
  Confirm each save by reading the record back through the app in the
  tester's session — don't rely on the request recorder, which loses data on
  page load and sign-in. *(2026-09-24, 2026-09-30)*
- **Testing narration:** during manual/E2E testing, log bugs found/fixed and
  notable findings to Progress-Archive promptly — a brief note, unprompted, but
  not routine back-and-forth.
