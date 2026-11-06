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

## NOW (5 Nov) — Customer with No Activity E2E running
- Finished and pushed (detail in Progress-Archive 3–5 Nov): Tabs E2E, TvA E2E
  37 of 37, sign-out re-test 4 of 4, MUI step 8 pictures 26 of 26 and pair
  review (docs `44a1999`). Pictures cover the look check, so the step 8 E2E
  is to be short. Dev server on 5173: restart only when Basheer asks.
- **5 Nov, later: Customer with No Activity E2E is running** (plan
  `docs/Customer-No-Activity-Report-Manual-E2E-Test-Plan.md`, 37 steps).
  P1, P2, A1, A2 Pass = 4 of 37. P2 re-run on Dev 5 Nov: Nishad K V 22 (not
  21), Elite 125 days (E2E plan already in git). **Next: A3** (Basheer, his
  Basheer K login, on Dev), then A4–A7, then B.
- **Committed 6 Nov, NOT pushed:** `1b70908` fix: shared `listRepUsers` drops
  Marketing Users from Stagnant, Pipeline, Daily Activity, My Work Rep lists;
  `cff3635` feat: Customer with No Activity caption line (D16) + Zone picker
  follows the Rep picked (`GET /reporting/no-activity-customers/zones`,
  `user_id` required; `ZonePicker` `searchKey`; Zone cleared on Rep change) +
  Marketing Users out of its Rep list. Full pytest 1562, tsc, eslint, ruff
  clean; `/code-review medium` done, findings triaged. Left as is (Basheer):
  a GM or SBU Manager picking an Area Manager reads "<name>'s zones". 26 (GM)
  vs 27 (SBU Manager) never-contacted is by design (D5, D16).
- **E2E parked 6 Nov at 9 of 38 (24 %)** (plan now 38 steps: new B15
  Zone-follows-Rep). Pass: P1–P2, A1–A3, B1, B3, B15, C1 (Haroon's login;
  Dev now holds "zz NoActivity accessory"). New fields and zones endpoint
  were live. **Resume at A4** with the Basheer K login, then A5–A7, B2, then
  B4–B14 (one login each), then C2 onward (C2 uses C1's accessory).
- **Next, in order:** (1) docs batch (plan results, this note,
  Progress-Archive, Backlog Marketing sweep entry) — needs his yes; (2) push
  is his call (then `cabio-post-commit`); (3) update plan wording for A2
  (caption line) if he wants it. Marketing User sweep is parked in the
  Backlog (needs planning). Stray `B`, `BT`, `PC` files are not mine.
- Break 5 Nov; E2E resumes at A3 once the above is settled.
- MUI step 8 combined E2E (short, only what pictures can't show) is parked
  behind this one; fix plan wording "21 pictures" to 26 when resumed.
- Open: Sales Report and Opportunities On Hold likely need the same fixed
  header (Backlog, 3 Nov). Year view "of plan" parked for Plan & Chore.

## Earlier results (detail: Progress-Archive 2–5 Nov, committed)
- Target vs Actuals E2E 41 of 41 and Tabs E2E done; about 24 TvA steps not
  re-run for the wider regression (estimate, not counted).

## MUI round 1 Part 1 — step 8 is mine (Basheer, 1 Nov)
- Steps 1–7 are in main (1–4 `6a417cb`, `f8c61b3`, `394444a`; 5 `06a304b`,
  6 `0c4f728`; 7 `b1fdb3f`, `33293b8`, `5c26ed3`; all in main, git 5 Nov).
- Step 8: pictures done (26, see NOW); still to do: combined E2E. Remove
  Backlog "File deletes: ask 'Are you sure?' first" only when that E2E passes.
- Product Catalogue pictures done on both sides (see NOW).
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity contact-box name still to check.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea).
