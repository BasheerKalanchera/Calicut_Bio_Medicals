---
name: cabio-e2e-testing
description: Cabio Sales OS checklist for the pre-E2E code review, writing or changing a manual E2E test plan, and running any manual E2E step (Claude in the browser or Basheer-run). Load once a feature or fix is built and before its manual E2E, before writing or editing a test plan, and before any E2E step.
---

# Cabio — pre-E2E review, writing a test plan, running an E2E

Three parts; read the one for the job in hand. Rule origins:
`docs/Process-Rules-History.md` (grep the date tag). The save-time guard
`test_plan_guard.py` already refuses a plan without the template, the
live-data section, a Simple/Complex tag on each step, or a phone-layout step.

## 1. Pre-E2E code review (after the build, before the first step)
- Run `/code-review` on the feature's commits (medium; high for RLS,
  migration or approval-workflow-heavy work) and fix findings first, however
  small the change. Order: review → E2E plan → test → commit → checklist.
  *(2026-09-17, 2026-09-22)*
- Code that lands after the review, mid-E2E included, is reviewed before the
  next step; the small-fixes batch is exempt. The build's docs batch comes
  after the review and its fixes; the plan's "Built:" lines name the fix
  commits. *(2026-10-28, 2026-10-31)*
- If correctness depends on a DB trigger, generated column or other
  server-side write the ORM doesn't re-read, add "did a real save complete"
  as a review item. *(2026-09-22)*
- Migrations: Dev's `alembic current` = head and `docs/Physical-Schema.sql`
  regenerated since. *(2026-09-23)*
- Run pytest, ruff, tsc and lint; report plainly, noting failures that
  already existed. *(2026-07-03)*
- Phone risks, from the code (no browser check before handover): tables
  through `TableOrCards`, no fixed width wider than a phone. *(2026-10-25)*
- MUI rules the automatic check can't see (Frontend standards §6.11), across
  each touched file, not just changed lines: pop-ups with fields use
  `FormModal`, a plain `Dialog` only for a short confirmation or list
  (rule 3); every table through `TableOrCards`, no hand-built phone copy
  (rule 2); each filter named above it with "All …" inside, each search box
  a 🔍 and an ✕ once typed in (rule 7). A miss is fixed before handover.
  *(2026-10-26)*
- Suggest `/ultrareview` only for high-risk changes (security, untested
  hotfix, large unreviewed change). *(2026-09-15)*

## 2. Writing or changing a test plan
- Start from `docs/templates/Manual-E2E-Test-Plan-Template.md`.
- Check the assumed data read-only against live records: role
  relationships, existing splits and values, who each picker offers (owner,
  split, assignee). *(2026-09-24)*
- Button labels, messages and the order of checks come from the code, not
  the design doc. *(2026-09-30)*
- Tag each step **Simple** (one click, type or value check, clear pass) or
  **Complex: <reason>** (multi-step, cross-screen or cross-role, a visual
  check). Nothing is skipped. *(2026-09-23)*
- **Group steps by login**: all steps for one person together; a step whose
  result is the same for anyone runs "as whoever is logged in". Regrouping a
  plan under way keeps the numbers already run (letter suffixes, 17b).
  *(2026-11-18)*
- Every Opportunity named has its hospital in brackets — "usg m/c" (aster
  medicity); one the test creates gets a fixed hospital. *(2026-10-17)*
- A `[Complex: phone layout]` step per screen, card or pop-up added or
  changed: Basheer checks 390, 768 and 1280 px, every row, arrow and tab
  opened, told exactly what to open. *(2026-10-25, 2026-10-29)*
- Permission or visibility features: a hide-check case — a real person who
  must NOT see a row, picked from live data. *(2026-10-04)*
- Saves to the shared Dev DB are planned as "Basheer clicks, Claude watches"
  and confirmed by reading the record back in the app, not the request
  recorder. *(2026-09-24, 2026-09-30)*

## 3. Running an E2E
- Before step 1: Dev backend restarted since the last backend change (its
  auto-reload can silently stop); re-run any hide-check scope check.
  *(2026-09-27, 2026-10-04)*
- Before each step, check the plan's role relationship still matches the
  record under test. *(2026-09-18)* Offer the next step for the login
  already open before one that needs a switch. *(2026-11-18)*
- **Basheer runs the steps** — Simple and most Complex — told exactly what
  to do and check. Claude drives the browser only when a step can't be
  judged by eye: measuring overflow (`scrollWidth > clientWidth` inside a
  card), a value the screen doesn't show, or a long sequence where one wrong
  click spoils it. Ask Basheer before starting any browser checks, and
  before each browser action say which step and why. *(2026-10-06,
  2026-10-08, 2026-10-29)*
- In the browser: screenshots only at checkpoints; `get_page_text`/`find`
  to confirm a value; `find` refs over coordinates after a layout shift.
- Flag the hot-reload risk before editing frontend files while a test
  browser is open — it can reset the logged-in user. *(2026-09-22)*
- Record Pass/Fail in the plan the moment each step completes; log bugs and
  notable findings to Progress-Archive briefly, unprompted. *(2026-09-22)*
- Every reply ends "Test run: N of M (P %)", counted from the plan.
  *(2026-10-24)*
