# Handover — Build session (parallel, `/build`)
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
and Build & Test keep their own notes (`.claude/session-handover-plan.md`,
`.claude/session-handover-build.md`). Only the Build session edits this
note. While a `/build` worktree exists, the live copy is the one in it, on
the build branch, and reaches `main` at the merge (Basheer, 2026-10-17)._

## State on 2 Nov: seven code commits + docs batch on `worktree-build`, pushed, NOT merged
- **Merged into `main` and pushed (2 Nov): `main` = `a1c9d67`** (fast-forward,
  28 files, no migration): Planning tabs fixes D12–D16, Target vs Actuals
  fixes (wording, Fix 4, tab row hidden on a person's own screen), Insights
  Overdue tab, Sales Report dates/labels. Details and the review (ten
  findings, none taken) are in Progress-Archive 2026-11 (1 and 2 Nov
  Build entries). Build & Test / `/test` must restart the Dev backend
  (Overdue `is_active`) before re-checking.
- **On the branch since, not merged:**
  - `a07e97d` — Opportunity Pipeline screen to the MUI standard (theme
    colours and text sizes, Owner/Zone named above the box, icon
    search/clear). Not seen in a browser; re-check at 390/768/1280. tsc,
    ESLint, MUI check clean. Backlog edited, uncommitted (2 Nov): screen
    removed from "Front-end standardisation fixes, by screen", counts now
    24 files / 325 lines.
  - `bd81bcb` — Sign out no longer reloads the page (login screen loaded
    twice): `api.ts` skips its 401 sign-out + reload while a deliberate
    sign-out is on (`setDeliberateSignOut`, set in `signOut()`, cleared in
    `signIn()`). A hypothesis from reading code, not reproduced. Dev only
    sees it after the merge; Basheer re-tests sign-out then. Backlog entry
    "Sign out loaded the login screen twice" added, uncommitted.
  - `cfa886c` — Tabs plan step 4 (D17): My Targets tab, My Plans rename,
    new tab order/opening tab, GM's SBU-target card, filled Annual "Plan"
    button. `main` merged in first (`3b82bf9`). Plan Status/progress lines
    still to update in the docs batch.
  - `14888f8` — Target vs Actuals Quarter view: "of plan ₹X L" under each
    person's percentage (Basheer's write-up; Simpler Table D13 not yet in
    that plan). `ab6a039` — Overdue tab "Sort by" box, Most overdue first /
    Name A–Z (D14 not yet in that plan either).
  - **Pre-E2E code review done (2 Nov, medium, `main..HEAD`):** 8 findings
    checked against code; 3 taken in `19141b8` (My Targets spinner while
    the GM's SBU loads; "deal" → "Opportunity" in the Pipeline file;
    sign-out flag also cleared when a session is restored), 5 not real.
    "No deals" remains in `src/App.jsx:7686` (outside this review).
  - All: screen only, tsc/ESLint/MUI check clean, not seen in a browser;
    E2E checks 390/768/1280 px.
- **MUI round 1 Part 1:** steps 1–7 done (last `5c26ed3`); step 8 (21
  "after" screenshots, before-and-after page, combined E2E) is Build &
  Test's. Plan: `docs/MUI-Good-Practice-Implementation-Plan.md`.

## Next
- Docs batch at session refresh (Basheer, 2 Nov): Backlog edits + this
  note + a Progress-Archive line, shown first, one commit on the branch.
- Still open from 1 Nov: check the "Me (default)" wording in Frontend
  standards and Process-Improvements (Backlog block "Found in MUI round 1
  steps 5–7"). Don't edit the E2E plans (Build & Test's).
- Then build whatever Build & Test sends, each fix its own shown-first commit.
- **Merge to `main`:** only when Basheer says go: bring `main` in, re-run
  tests, push the branch, `ExitWorktree` keep, merge, push, then
  `cabio-post-commit`.
- **To tell Plan & Chore (via Basheer):** add ◀ and "← Back" to
  `check-mui-standard.js`; the commit check prints "no staged .ts/.tsx
  files" even when some are staged (seen again 2 Nov on both commits).
- **After the E2Es (Build & Test's):** `cabio-post-commit` paperwork
  (Traceability, scorecard, plan Status). User manual and in-app help wait
  for the UAT move (Simpler Table D8).
- Migration number last chosen: none.
