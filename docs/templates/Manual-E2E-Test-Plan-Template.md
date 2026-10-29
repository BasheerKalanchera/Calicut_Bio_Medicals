<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# <Feature> — Manual E2E Test Plan

**Covers:** `docs/<Feature>-Implementation-Plan.md`.
**Built:** <commit hashes, filled in after the fact>.
**Where:** Dev (or UAT, say which).

## Checked against live data

Checked read-only on <environment>, <date>, with all three RLS settings
(user, role, SBU) set and verified. Each line names real users and records
from the database, or says `n/a — <reason>`.

- **Who sees:** <which test user sees which records, with counts>
- **Who can approve:** <who the approve/reject picker actually offers>
- **Who can save:** <owner, split, assignee: who each picker offers>
- **Existing values:** <current values/splits on the records under test>

Button labels, messages and the order of checks are taken from the code,
not the design doc.

## Figures and sources

Every number, name and example in this document, one line each, with where
it came from: a Dev query and its date, a file, Basheer, or "made-up
example". Counts are counted with a tool; quarters come from
`scripts/quarter.py`. A save-time check refuses a new document without
this section filled in.

- <figure or example> — <source>

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; a step Claude drives in the browser
says so — `[Complex: Claude — <reason>]` — and only when it can't be judged
by eye (e.g. measuring whether something runs past its card), to save
usage credits (Basheer, 2026-10-29). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Phone:** this is a phone app (PWA). Every screen, card and pop-up the
feature adds or changes gets its own `[Complex: phone layout]` step: at
phone width, every row, arrow and tab opened, nothing runs past the card
and nothing looks squashed. A save-time check refuses a plan without at
least one. Basheer runs it at 390, 768 and 1280 px; nobody checks in a
browser before handover (Basheer, 2026-10-29), so this step is the first
look. Claude measures in the browser only if something looks off.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets, e.g. "usg m/c" (aster medicity). An Opportunity the
test creates has its hospital fixed in this plan, never "any hospital".

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Simple] <screens running, users signed in>. —

## A — <section name>

1. [Simple] <action>. **Expected:** <exact text/value from the code>. —
2. [Complex: <reason>] <action>. **Expected:** <…>. —
3. [Complex: phone layout] Phone width, <screen → card>, every row and
   arrow opened. **Expected:** <how the plan's "On a phone" says it
   looks>; nothing runs past the card. —
