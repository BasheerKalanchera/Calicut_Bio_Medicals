<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Marketing User with no SBU (BR-ORG-03) — Manual E2E Test Plan

**Covers:** fix `4163971` (BR-ORG-03; no implementation plan — a
one-commit fix, history in Progress-Archive-2026-10, 2026-10-10).
**Built:** `4163971`. Pre-E2E: `/code-review` done, its finding fixed
before the commit; pytest 1231, ruff, tsc, lint clean.
**Where:** Dev.

**Result 2026-10-10:** all steps Pass, run by Basheer.

## Checked against live data

Checked read-only on Dev, 2026-10-10, with all three RLS settings set and
verified (as Admin Abdul Latheef P; session a2d89b82 scratchpad
`lead_owner_check_out.txt`).

- **Who sees:** n/a — no lead is saved; step 4 only opens the New lead form.
- **Who can approve:** n/a — no approval step.
- **Who can save:** Admin saves users on User Directory (steps 1–3).
- **Existing values:** marketinguser@cabio-demo.com had SBU Imaging and
  no leads; Fahad had entered all 11 leads. Neither is touched by this
  plan — a separate test login is used.

Button labels, messages and the order of checks are taken from the code,
not the design doc. Step 3's message comes from the screen's own check
(`UserDirectoryScreen.tsx:139`); the server refuses the same save with
"SBU is required for this role" (`organization/service.py:118`).

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

## Pre-flight

- P1. [Simple] Dev backend restarted since `4163971`. — Pass (Basheer)
- P2. [Simple] Frontend running; Basheer signed in as Admin. — Pass

## A — User Directory (as Admin) and New lead (as the test user)

0. [Simple] Supabase (Dev) → Authentication → Add user: create a test
   login. **Expected:** login created, UID noted. — Pass (Basheer)
1. [Simple] User Directory → add that login as **Marketing User**.
   **Expected:** no SBU box shown; save succeeds. — Pass (Basheer)
2. [Simple] Open the same user, change nothing, save. **Expected:** the
   user still has no SBU. — Pass (Basheer)
3. [Simple] Same user: change role to **Sales Rep**, leave SBU empty,
   save. **Expected:** refused with "SBU is required" — a role that
   needs an SBU still needs one. — Pass (Basheer)
4. [Complex: cross-role, rep list must follow the SBU picked] Log in as
   the test user → **New lead**; pick Imaging, then Critical Care; close
   without saving. **Expected:** both SBUs can be picked; the rep list
   follows the SBU. — Pass (Basheer ran it himself)
5. [Simple] As Admin, User Directory → open marketinguser@cabio-demo.com
   (had SBU Imaging), change nothing, save. **Expected:** its SBU column
   is now blank — editing clears an existing SBU. — Pass (Basheer)
