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

## NOW (7 Nov) — Customer with No Activity closed; next is MUI step 8
- E2E 39 of 39, fixes `0756234` and `2ac7f25`, and the paperwork (row 11.1
  Done, scorecard 36 Done / 11 Partial, plan Status) are all pushed, docs
  batch `6ad9c20`. Detail: Progress-Archive 7 Nov.
- **Waiting on Basheer:** republishing the two client scorecard pages (he
  said "later"; `docs/Scorecard-Maintenance-Process.md` step 5; show the
  diff first). The live pages still show 35 Done / 12 Partial.
- **Next:** (1) MUI step 8 paperwork after the E2E passed (below); (2) tell
  Plan & Chore about the not-reloading risk on Stagnant Opportunities, Sales
  Report, Opportunities On Hold (not checked); (3) end-of-session retro line
  for the later session (1 correction so far: P3 logins from one page).
- Not mine: Progress-Archive-2026-08.md, Target-Plan-Training plan, the
  Plan & Chore "second session" archive entry, stray `B`, `BT`, `PC` files.

## Earlier results (detail: Progress-Archive 2–6 Nov, committed)
- Target vs Actuals E2E 41 of 41 and Tabs E2E done; about 24 TvA steps not
  re-run for the wider regression (estimate, not counted).
- Search box (D17) `28d1516`; MUI step 8 pictures 26 of 26.

## MUI round 1 Part 1 — step 8 is mine (Basheer, 1 Nov)
- Steps 1–7 are in main (1–4 `6a417cb`, `f8c61b3`, `394444a`; 5 `06a304b`,
  6 `0c4f728`; 7 `b1fdb3f`, `33293b8`, `5c26ed3`; all in main, git 5 Nov).
- Step 8: pictures done (26); combined E2E 7 of 7 Pass 7 Nov (plan
  `docs/MUI-Round1-Combined-E2E-Test-Plan.md`, uncommitted). Still to do,
  waiting on Basheer's yes:
  fix MUI plan wording ("21 pictures" to 26; "contact box" to "Logged For
  box"), then remove
  Backlog "File deletes: ask 'Are you sure?' first" (it passed).
  **Note from Plan & Chore, 9 Nov (Basheer's yes to write here):** all of
  the above was done in Plan & Chore on 9 Nov — plan wording, Backlog entry
  removed, test plan pointer reworded (archive 9 Nov). Nothing left; drop
  this item.
  **Also committed for you (Basheer's yes, 9 Nov):** your three unsaved
  7 Nov items went into Plan & Chore's 9 Nov docs batch ("docs: Plan &
  Chore, 9 Nov — UAT backup …"): the test plan
  `docs/MUI-Round1-Combined-E2E-Test-Plan.md`, your two archive entries
  (combined E2E 7 of 7; later-session retro, 2 corrections), and this
  note as it stood. Nothing of yours is left uncommitted; check `git log`
  for the hash.
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity "Logged For" name checked (E2E step 7, Pass).

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea, shared search box proposal).
