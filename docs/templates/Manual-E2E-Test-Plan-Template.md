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

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Simple] <screens running, users signed in>. —

## A — <section name>

1. [Simple] <action>. **Expected:** <exact text/value from the code>. —
2. [Complex: <reason>] <action>. **Expected:** <…>. —
