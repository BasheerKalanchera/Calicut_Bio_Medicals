# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
- UAT runs `8b2ec8a` (moved 25 Oct, `b294865`). Until the first Part 2
  commit, main's app code = UAT's; after it, UAT fixes go by the
  hotfix-branch route (`docs/Deployment-Topology.md` "Fix to UAT ahead
  of a full promotion").

## NOW (7 Nov) — Customer with No Activity: pushed; paperwork waiting for approval
- E2E 39 of 39 and both fixes pushed 7 Nov (`0756234`, `2ac7f25`); detail in
  Progress-Archive 7 Nov. Scorecard check passes (35 Done, 12 Partial).
- **Waiting on Basheer (proposed, not done):** flip Traceability row 11.1 to
  Done and regenerate the scorecard; plan Status line in
  `docs/Exception-Report-Implementation-Plan.md` (still says "E2E pending").
- Uncommitted docs for one docs batch (needs approval): the test plan, this
  note, Progress-Archive-2026-11.md (not all mine). Progress-Archive-2026-08.md,
  stray `B`, `BT`, `PC` files and other sessions' untracked docs are not mine.
- **Next:** (1) paperwork above; (2) docs batch commit + retro
  (`harness-engineering`); (3) tell Plan & Chore about the not-reloading risk
  on Stagnant Opportunities, Sales Report, Opportunities On Hold; (4) ask
  whether `cabio-post-commit` was ever run for `1b70908` and `cff3635`.

## Earlier results (detail: Progress-Archive 2–6 Nov, committed)
- Target vs Actuals E2E 41 of 41 and Tabs E2E done; about 24 TvA steps not
  re-run for the wider regression (estimate, not counted).
- Search box (D17) `28d1516`; MUI step 8 pictures 26 of 26.

## MUI round 1 Part 1 — step 8 is mine (Basheer, 1 Nov)
- Steps 1–7 are in main (1–4 `6a417cb`, `f8c61b3`, `394444a`; 5 `06a304b`,
  6 `0c4f728`; 7 `b1fdb3f`, `33293b8`, `5c26ed3`; all in main, git 5 Nov).
- Step 8: pictures done (26); still to do: combined E2E (short, only what
  pictures can't show; fix plan wording "21 pictures" to 26). Remove
  Backlog "File deletes: ask 'Are you sure?' first" only when it passes.
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity contact-box name still to check.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea, shared search box proposal).
