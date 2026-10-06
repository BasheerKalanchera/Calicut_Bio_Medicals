# Progress Archive — October 2026

## 2026-10-01 — Hospital-wise Part 1 E2E: section I (steps 26–29) pass; approval-refused messages reworded

**Test-plan gap:** step 27 assumed Haroon could approve Vivek's plan.
He can't: only the rep's own manager (Arun) gets Approve/Reject on
screen. Admin/GM may decide on the server, but the screen shows them
no buttons for someone else's rep (Basheer checked Latheef Bhai's
login). The step was run with Arun in two windows instead. That tests
the same thing, since the refusal depends only on the plan already being
decided, not on who presses Approve. Lesson: the 2026-09-24 rule (check
who each picker actually offers) should also cover who can approve.

**Result:** the late Approve was refused and the plan stayed Rejected;
"Last approved target ₹30" was kept after the rejection.

**Wording change (Basheer):** both refusal messages now point to the
refreshed plan: "…already been decided. Please check the latest version
below." and "The rep changed this plan while you were reviewing it.
Please check the latest version below and review again." The "--" in
the first became "—". Business-Rules, the implementation plan's as-built
section and test plan step 24 were updated to match. Planning tests: 111
pass.

**Step 30 (section J) pass; two screen fixes (Basheer: option A, fix
now).** The brand split tripped the run a second time (step 20, then
30): when hospital amounts drop, the brands keep the old total and the
screen said only "Remaining to allocate: ₹-10.00L" / "currently ₹60.00L
of ₹50.00L". Now: "Over by ₹10.00L — reduce brand amounts" (or "…still
to allocate" / "Fully allocated"), and the Submit error names the
direction and amount. Auto-scaling the brands (option B) was turned
down: it would quietly change the rep's numbers. Also the test plan
assumed EDAN alone; Vivek's Q3 split had two brands. Second fix: the
"Needs Your Approval" list re-checks every 60 s (it only refreshed on
reload or window focus). tsc + lint clean.

**Open question for Backlog (not decided):** should the Admin/GM screen
show Approve/Reject on any plan, since the server already allows it?
(Now in Backlog.)

## 2026-10-01 — Hospital-wise Part 1 finished: E2E 38/38, scorecard Done

- **Steps 31–33 (server guards):** the auto-mode classifier blocked
  Claude's own write requests to Dev, so Basheer pasted each request in
  the browser console and read back the reply: 403 own-SBU, 422
  three-decimal amount, 422 missing version stamp. Nothing saved
  (checked after).
- **Step 34 (who can read hospital lines):** read-only on Dev as Vivek,
  Arun, Nishad, Rudrappa; connection role can't bypass RLS; all three
  settings verified. Pass. Basheer asked whether Dev proves UAT. Claude
  first said no, citing UAT's `rls_auto_enable()` trigger, but that
  trigger was removed 2026-09-10 (stale comment in migration 0055, not
  checked against the history). No separate UAT re-run: the move's
  standard check already confirms RLS and policies on new tables.
- **Help/manual:** `docs/UAT-User-Manual.md` and the in-app `?` help
  were last updated 2026-08-01; none of the screens moved on 2026-09-27
  have help pages. A per-screen section was never a move step (Claude's
  own 2026-09-29 note). Basheer's decision: bring the whole manual and
  help up to date in the next UAT move (Backlog entry, Part 2 plan step 5).
- **Steps 35–38:** pass (Basheer). Step 37's ₹85 was checked read-only
  against the live splits first.
- **Scorecard:** Beat Planning (6.1), Account Segmentation (1.2) and
  Customer Tiering (1.3) → Done; 34 Done · 11 Partial · 5 Not started.
  Specialty = hospital type; size not wanted yet (Latheef Bhai/Haroon via
  Basheer). Client pages republished. Commit `6b4c5d8`.
- **Retro.** *Worked:* fixing live and saving checkpoints mid-run;
  reading every save back through the app; the race tests (sections H
  and I) proved the version check end to end. *To improve:* three test
  plan assumptions were wrong: who can approve (step 27, Haroon),
  Vivek's Q3 brand split (step 30), and that Claude could send the
  section K requests. Also two claims made from notes without checking
  the history (UAT trigger, manual step); Basheer caught both.
  Note: the "manual step" catch led to a wider fix, the whole manual
  and help updated with the next move.
  *Process change (proposed):* when writing a test
  plan, check who can approve and who can save, not only who sees what,
  and plan every Dev write, including deliberately refused requests, as
  "Basheer sends, Claude watches".

## 2026-10-01 — UAT data-quality check; hospital filing level added

- **Script:** `uat_data_quality_check.py` section 16 — all hospitals by
  filing level (counts only) and a list of those filed at region level
  or above, with per-region counts; the count goes into the run log.
  Trialled on Dev, then run on UAT.
- **Filing:** 85 of 443 hospitals at region level (North Kerala 43,
  South Kerala 24, Bangalore 18), same as 30 Sep; the 11 added since
  were filed correctly. All 210 cluster-level hospitals are in Bangalore
  (East 88, North 54, West 51, South 17), so Bangalore's 18 go to a
  cluster and Kerala's to a district. Dealers are genuine customers
  (Basheer). Re-filing still held for the Haroon discussion.
- **Other results vs 29 Sep:** deals with no activity 62 → 63; missing
  next action 121 → 127; everything else unchanged.
- **Report:** `C:\Backups\CabioUAT\data_consistency_reports\UAT-Data-Quality-Report-2026-10-01.pdf`.
  Rule added: only the approved PDF goes in that folder (CLAUDE.md).
- **Note:** the auto-mode classifier blocked an approved read-only UAT
  query; Basheer ran it via `!`. The `!` prefix runs bash, not
  PowerShell.

## 2026-10-01 — Close dates for the 37 closed deals: proposal sent to Haroon

Basheer asked whether "last updated" could stand in for the 23 deals
closed before the change history began (2026-09-08). Read-only UAT
checks (scratchpad scripts, run by Basheer via `!`):
- **Last updated:** usable for 11, entered-already-Won for 3, lost for 9.
  Those 9 were all edited 24–29 Sep, and the audit log kept no copy of
  the earlier timestamp: UPDATEs that change only `updated_at` (e.g.
  line-item saves touching the parent deal) leave no audit row.
- **Created date** (Basheer's question): right quarter, but wrong month
  for 3 of the 9 — the deal is opened as a lead, not when it's won.
- **Activity notes** gave the best evidence ("got the order", "PO
  collected", "order lost to …"), including for 4 of the 14 audited
  deals, which were marked closed days after the order (e.g. Dhanvantri
  lost 12 Sep, marked 24 Sep). Reps also log several notes at once after
  the event (Fazal on 5 Sep about July), so note dates aren't always event
  dates.
- **Result:** all 37 fall in Jul–Sep 2026 (Jul 1, Aug 16, Sep 20), so
  Part 2's quarter totals are right whichever date is used. The Sales
  Report has no past-period filter yet (Basheer), so no screen is wrong
  today.
- **Sent to Haroon** (Basheer, 2026-10-01): PDF of all 37 with proposed
  date, evidence and an answer column; Excel version held. Three
  questions: commitment or PO date, 2 deals with no information, IQRAA
  Padne S50 Elite. Files in `C:\Backups\CabioUAT\data_consistency_reports\`.
  Backlog entry "UAT: fill in missing 'date closed'" updated.

## 2026-10-01 — UAT hotfix built and Dev-tested: Opportunity edit via its own page + Customer 360 Active-only filter

- **Decisions (Basheer):** the quick fix's 4 open decisions all taken as
  recommended. EDIT on Customer 360 and Project Directory opens the
  Opportunity page, and their duplicate edit forms are removed. The
  Opportunity page's Edit window gets a Project dropdown with "No project"
  (the server already accepts `project_id: null`). EDIT opens the page in
  its normal view.
- **Built** in worktree `.claude/worktrees/hotfix` off `origin/uat`;
  committed `a430152` (4 files, +116/−890). Medium `/code-review` found
  one issue: saving products on the Opportunity page didn't refresh the
  Project Directory list (that screen stays mounted). Fixed before E2E.
- **Dev E2E steps 1–16 pass**
  (`docs/Opportunity-Edit-Hotfix-and-Active-Filter-Manual-E2E-Test-Plan.md`).
  The original bug no longer reproduces: product saved, then stage →
  Qualified with no error. Screen tweaks during the run, at Basheer's
  request:
  - heading "Showing Active Opportunities (2 Active of 4)", or "Showing
    All Opportunities (4)";
  - the heading row wraps on a phone (checked at phone width);
  - in the no-Active state the Show All button stays in the heading row;
  - no Show All button when nothing is hidden (decision 13).
- **Process notes:**
  - Claude ran section A's single-click steps itself after tagging them
    Complex. Basheer pointed out the cost, and the remaining steps were
    retagged Simple. When tagging, judge each step, not the section.
  - Basheer asked for "Opportunity", never "deal"; added to CLAUDE.md.
  - A background `npm` dev server left its `vite` child running on Windows
    after the task was stopped; it had to be stopped by its process id.
- **Next:** push to UAT on the morning of 2026-10-02 (Basheer: quiet
  hours), then step 17 on UAT, then merge `uat` into `main`.

## 2026-10-01 — Expected Closure Dates report; UAT read scripts lost their RLS context

While going through the forecast-by-closing-period questions (Latheef Bhai's
audio message, 2026-09-30; the discussion doc is not yet updated with it):
- **Finding:** of 112 open Opportunities on UAT, only 3 had a future
  Expected Closure Date (₹48 L); 17 had a passed date (₹309 L); 92 had none
  (₹1,086 L). A "by date" forecast would be near-empty until reps add
  dates, so Q4 is parked until the dates are corrected (Basheer).
- **Lead-stage chance:** 28 of 56 open Leads were raised above the 5%
  default by hand (₹530 L value, ₹296 L weighted; two Opportunities give
  ₹234 L of it). None ticked High Priority: reps use the chance to say
  "this one is real".
- **Report:** four-step "Expected Closure Dates" PDF (passed dates, Demo
  stage or later with no date, Lead stage with a higher chance, early stage
  for information), gentle and sorted by owner. Approved by Basheer and sent
  to Cabio leadership; `C:\Backups\CabioUAT\data_consistency_reports\Expected-Closure-Dates-2026-10-01.pdf`.
  Now `scripts/uat_closure_date_report.py`, run with the data-quality
  check; its counts go into the run log so the next report shows progress.
- **Connection bug:** a UAT run printed "28 above default" and then an
  empty list for the same rows. UAT connects through the transaction
  pooler (port 6543; Dev uses 5432), so the scripts' session-level RLS
  settings could be missing for later statements under autocommit, and
  could linger for other clients. Fixed in `uat_data_quality_check.py`
  and the new script: one read-only transaction, transaction-local
  settings, checked again before the run log is written. Re-ran today's
  UAT check (20:45): every zero still zero; the small differences match
  the day's work, so the morning report stands.
- **Filing:** Arun re-filed 21 South Kerala hospitals into districts today
  (Basheer); region-level 85 → 64 (North Kerala 43, Bangalore 18, South
  Kerala 3).

## 2026-10-01 — session retro (operations and planning session)

**Done:** UAT backup; data-quality check with a new region-level filing
section (85 → 64 after Arun's re-filing); doc tidy-up (4 fixed); proposed
close dates for the 37 old Opportunities sent to Haroon; user manual and
help catch-up plan approved; forecast questions answered from Latheef
Bhai's transcript (Q4 parked); Expected Closure Dates report sent to
leadership and saved as a script; UAT read-script connection fix. Commits
`c4aaaff`, `3132e0e`, `49b22f8`, `53d6b6c`, `9a8726c`, `8bacee6`.

**What worked:** Basheer's "first understand the ask" got the transcript,
which answered three questions outright; checking the data before
designing the screen (3 of 112 open Opportunities with a future date)
redirected the work to fixing dates at the source; evidence over guesses
for close dates (activity notes beat "last updated" and the created date);
committing only this session's lines while other sessions were mid-edit.

**What to improve (Claude):** handed Basheer a `!` command for a script
not yet written; first `!` line used PowerShell syntax (`!` runs bash); a
scripted edit turned `\n` into a real line break (second time after
2026-09-27); a commit failed because PowerShell split the message at its
quotes; one command used `cd` (blocked by the guard rail); the
data-quality PDF wasn't saved until Basheer asked.

**Process changes proposed, parked to 2026-10-02 morning (Basheer):**
A. cabio-db-and-scripting skill: UAT uses the transaction pooler (port
6543), so read scripts use one read-only transaction with
transaction-local settings, re-checked at the end. B. Guard rail refusing
Bash heredocs that write or patch source files (second occurrence of the
`\n` problem). C. CLAUDE.md "Commit approval": always commit with
`git commit -F <message file>`. D. Option for Basheer: allow Claude to run
the two named read-only UAT data-quality scripts after his yes, instead of
typing each `!` command himself.

## 2026-10-03 — UAT hotfix shipped: pushed to UAT, checked, merged back into main

- Render log (UAT backend) showed only health checks 06:24–07:18, so
  pushed `hotfix/opportunity-edit-via-deal-page` to `uat` (143c78e →
  a430152, fast-forward). Only the frontend redeployed; correct, since no
  backend file changed (and avoids the fragile backend rebuild, see
  2026-09 SQLAlchemy/psycopg entry).
- Step 17 run look-only by Basheer's choice (no test data on UAT), on
  Kmct Medical college Hospital and project Mobile ICU (picked by a
  read-only UAT lookup): all 5 checks pass.
- Found: MMC "Edan F6 CTG machine single fhr" (the reported record) is
  now Won with its product but still at stage Lead (rep meant Order).
  Allowed by BR (Won from any stage); Won locks the stage, so delivery
  and installation can't be tracked on any Won Opportunity. Basheer wants
  the Payment Confirmation Gate moved up; checking with Haroon (Backlog).
  No change made to the record.
- Merged `uat` into `main` (no conflicts, contrary to the expected
  `Customer360Screen.tsx` clash): tsc/lint 0 errors, backend 1069/1069,
  Dev re-check passed (Basheer). Commit `eb89fa7`, pushed; `uat` is now 0
  ahead / 82 behind `main`. Ruff reports 62 findings on `main`, none from
  this change (Backlog "Backend style checker (ruff) not clean").
- Closed: both plans (Shipped), test plan, both Backlog entries;
  leadership request "Active-only filter" moved to Commitment beyond
  contract #17, scorecard regenerated.
- **Retro:** worked: checking the Render log before pushing; a
  dry-run merge before touching main; a look-only UAT check instead of
  test data on live sales records. Improve (Claude): said "safe to run"
  about the tests before checking what they connect to (Basheer stopped
  it and asked); made doc edits before showing them first. No new process
  rule — both are existing CLAUDE.md rules ("Verify before claiming",
  "Show before you act").
- Side finding: half the UptimeRobot checks use HEAD and get 405 from
  `/api/v1/health`; the monitor may show UAT as down. Offered to log it
  (Basheer hasn't decided).
- Process: the auto-mode classifier blocked Claude's approved read-only
  UAT script; Basheer ran it via `!`. Second instance of proposal D in
  the 2026-10-01 retro.

## 2026-10-03 — UAT backup, data-quality check and Expected Closure Dates report

- **Backup:** `cabio_uat_2026-10-03.dump` (472 TOC entries); pruned
  `cabio_uat_2026-09-11.dump`. Docker again needed a forced close (also
  2 Oct) — harmless.
- **Data quality vs 1 Oct report:** region-level hospitals 85 → 64 (21
  South Kerala hospitals now filed at district; all added since 1 Oct
  filed correctly); Opportunities with no activity 63 → 61; Won with PO
  but no activity 7 → 8 (MMC "Edan F6 CTG machine single fhr", PO "0" —
  same record as in the hotfix entry above); everything else unchanged.
  Report: `UAT-Data-Quality-Report-2026-10-03.pdf`, now saying
  "Opportunity" instead of "deal".
- **Expected Closure Dates:** no rep has updated a date since the 1 Oct
  report (Steps 1–2 unchanged: 17 passed, 18 with no date); 2 new
  Opportunities with no date; Step 3 28 → 29 (Fazal, Khaira, Lead at
  99%). The script adds "Thank you to everyone who updated…" whenever
  any count changes, even when nothing improved; corrected by hand in
  this draft.

## 2026-10-03 — SQLAlchemy capped below 2.1; payment gate option B chosen

- `0ffe00c` caps `sqlalchemy>=2.0.0,<2.1` in `backend/pyproject.toml`
  (fresh-install dry run resolves 2.0.54; nothing else needs 2.1 — alembic
  needs >=1.4.23). Backend 1069/1069. Backlog entry narrowed to the two
  follow-ups: revert the UAT Render Build Command at the next move; review
  other open-ended dependencies.
- Payment Confirmation Gate: Basheer chose option B (Won only from the new
  last stage after full payment, so Order and Delivery & Installation are
  passed through), pending Haroon and Latheef Bhai; note drafted for them.
  Found while reviewing the gate: the rule as written (payment tick only)
  would still allow Won at Lead — the MMC case.
- **Retro:** worked: checking installed versions and dependants before
  answering "will the cap break anything". Improve: nothing new.

## 2026-10-03 — Payment Confirmation Gate (BR-OP-17) built and E2E-passed

- Commits `b9e01e8`, `71f07b5`, `0d0133d`, code-review fixes `75ac199`.
  Dev `alembic current` = 0059 (head); backend 1091/1091.
- Manual E2E on Dev, 18/18 pass (Basheer clicked saves, Claude read back
  in its own tab after fresh loads): Won greyed out before Payment Pending
  (incl. Fast-Track and Lead); PO required for Delivery & Installation;
  untick refused; Won stores confirmer, date and note; Order → Payment
  Pending in one save works.
- Findings: a Won Opportunity drops off the Kanban board (found via List
  view search) — looks like existing behaviour, not checked. A list filter
  hid *New opportunity test* from Basheer at the start (data was fine).
- Dev test data is permanent: *New opportunity test* and *Test usg oder
  with Buyback* are Won. Traceability "Commitment beyond contract" row 18
  added. UAT: arrives with the next UAT move (0057/0058).
- **Retro:** worked: the code-review pass before E2E, so the run found no
  defects; reading records back after a full reload. Improve: I truncated
  tsc output with `tail` and had to flag the count as unverified — save to
  a file instead (already a rule).

## 2026-10-03 — Repeat mistakes now refused by guard rails (retro fixes A, B, E, F)

Basheer: fewer mistakes, and self-correction when one repeats, without a
decision round per proposal. So the 2026-10-01 retro fixes were built
directly:
- **A:** `cabio-db-and-scripting` skill — UAT goes through the transaction
  pooler; scripts use one read-only transaction with transaction-local
  settings (pattern: `uat_data_quality_check.py`).
- **B + F:** `.claude/hooks/shell_guard.py` refuses shell-scripted writes
  to code files under backend/ and sales-os-app/ (the `\n` breakage,
  27 Sep and 1 Oct) and commit messages saying "deal" (file paths are
  ignored). 10 test cases; live dry-run refused.
- **E:** `docs/templates/Manual-E2E-Test-Plan-Template.md` +
  `.claude/hooks/test_plan_guard.py`: a new test plan must start from the
  template, fill the four "Checked against live data" lines from real
  records, and tag every step `[Simple]` or `[Complex: <reason>]`. Older
  plans (no template marker) are unaffected. Live check refused an
  untagged plan.
- **C dropped** (PowerShell quoting; commits now run from Bash). **D:**
  Basheer adds the two UAT check scripts to his personal allow list.
- **Retro:** worked: building the fixes instead of proposing them. Improve
  (Claude): repeat mistakes had piled up as open proposals for two days,
  which CLAUDE.md already said not to do ("build the structural fix then").

## 2026-10-03 — Audit Trail Redesign: steps 2 and 4 done

- Step 4 (`8842d67`): audit-log size and entry count added to the UAT
  data-quality check.
- Step 2 (`c91e51e`): `replace_zones`, `replace_brand_splits` and
  `replace_accounts` now delete only dropped rows, add only new ones and
  update changed ones in place, so unchanged rows no longer appear as
  fake remove/add pairs in the audit log. 168 tests pass in organization
  + planning.
- The fourth path, the Opportunity contacts "replace all" save, had no
  caller (checked frontend and backend). Basheer chose removal over a
  rewrite; `9a6d98d` (1094 tests pass).
- Retro: worked: checking for callers before rewriting saved a rewrite.
  Improve: a safety-check denial on one edit mid-batch needed a
  plain-language round trip; ask earlier when a cleanup edit is not
  covered by the approved plan.

## 2026-10-03 — Maintenance quick wins: ruff clean, backup file names

- `ruff check backend` went from 62 findings to 0. B008 (FastAPI
  `Depends()` in defaults) is now handled by one `extend-immutable-calls`
  setting in `pyproject.toml`; the 279 `# noqa: B008` comments it made
  redundant were removed. Old migrations are exempt from import-order (I001).
  Fixed: one long line, one nested `if` (asset service), one `Callable`
  import. The three nested-`if` gate validators in the Opportunity stage
  gates keep a `# noqa: SIM102` so each gate's header stays apart from its
  rule. Standard command recorded in Backend-Implementation-Standards
  (Ruff section). 1095 tests pass.
- `.gitignore` now ignores `.coverage` / `htmlcov/`.
- `scripts/backup_uat.ps1` dump names now carry the time
  (`cabio_uat_<date>_<HHmm>.dump`); not yet run (needs a UAT connection and
  approval). The session-start hook reads only the date part, so the
  backup-due reminder is unaffected.
- Retro: worked: the one-setting fix beat 47 per-line comments. Improve
  (Claude): running ruff's auto-fix with only one rule selected also
  stripped 38 still-needed `noqa` comments (F401, E712, SIM102) — caught
  because ruff was re-run in full straight after; select RUF100 together
  with the project's full rule set, or review the diff first.

## 2026-10-03 — session retro (Payment Gate close-out and maintenance session)

- Done: Payment Confirmation Gate (BR-OP-17) E2E 18/18 on Dev, shipped as
  `4561ad5`, checklist run, both scorecard Artifacts republished (Beyond
  Contract at 18). `cdf1611`: SQLAlchemy-cap follow-ups + Natural Transition
  Checkpoint rule. `2ae24f8`: ruff clean-up (62 to 0), `.gitignore`,
  time-stamped UAT backup names, matching docs; 1095 tests pass.
- Worked: one setting replaced 47 per-line comments; ruff re-run in full
  straight after the auto-fix caught the damage before any commit; code and
  docs went in one approved batch with the staged list checked, keeping the
  other session's files out.
- Improve (Claude): (1) ruff auto-fix run with only one rule selected also
  stripped 38 still-needed comments — check the diff before running tests,
  not after. (2) Said Audit Trail step 4 was next when the handover note
  already showed it done — read the file, not an old summary. (3) Told
  Basheer a Progress-Archive entry was cut off when it had only been moved —
  check the file itself before claiming damage. The shell guard correctly
  blocked a `sed -i` on a code file; Edit was used instead.
- Process change: none new; the existing "scan the diff after a scripted
  bulk edit" rule covers (1) — the gap was timing, not the rule.
- Open: backup script's new file name untested against UAT; pytest is 1095
  vs 1094 recorded earlier (not investigated); Audit Trail step 5 is in the
  other session.

## 2026-10-03 — Audit Trail Redesign, step 5 (Dev E2E) and retro

- Done: Dev E2E for migration 0059 and the save-by-diff changes, every step
  Pass (sections A–F, 31 steps). Pre-flight: pytest 1120 passed, ruff, tsc
  and lint clean. Checked on Dev: unchanged resubmit logs nothing; creating a
  record logs nothing; adding or removing a line under an existing record
  logs ADDED/REMOVED; a hospital added and an amount rebalanced in one save
  group together with no total row (total unchanged, correct). Audit Log
  paging showed "Page 1 of 3 (106 saves)" with no save split.
- Accepted: the Audit Log screen stays mounted, so it needs F5 to show new
  changes. Admin/GM don't need live refresh; no fix.
- Left on Dev: test Opportunity "Activity visibility test" at Qty 2, ₹50L
  (was Qty 1, ₹25L); Vivek's 2026-Q3 plan note reads "Added one extra
  hospital → Removed that hospital".
- Worked: "Basheer clicks, Claude watches" for every Dev save; asking for the
  full cards instead of accepting "B1–B4 pass" on one combined save.
- Improve (Claude): (1) E1 first assumed a product name field without
  reading the form code — read the form before writing the step. (2) The
  code-review findings 5, 6, 7, 9, 10 were noted only by number, so their
  text was lost with the context — log each finding in the Backlog the moment
  the review finishes, not "later in the docs batch".
- Process change: none new; (2) is covered by "write handover/Backlog notes
  with real values", the gap was timing.
- Open: UAT move (0059 + steps 2–4) needs its own approval; take a UAT
  `audit_log` backup first.
## 2026-10-04 — Audit Trail Redesign: code review redone, one fix shipped (`51deecc`)

- Re-ran `/code-review` on steps 1–4. Five findings; each checked against the
  code. Only one was real: saves sharing a timestamp could page in an
  unstable order (a save could show on two pages or none). Fixed with a
  `changed_by` tie-break in `list_saves` plus a test (`51deecc`; pytest for
  the audit tests 18 passed).
- Left as designed: a payment note sent with a non-Won save is silently
  dropped (optional later change: reject it with an error; Basheer's call).
- Dismissed with evidence: three findings that did not hold up in the code.
- Worked: reading the code for each finding before editing; only the real
  one got a change.
- Improve: the 2026-10-03 lesson held — findings were verified and recorded
  the same day.
- Open: UAT move (0059 + steps 2–4), own approval, UAT `audit_log` backup
  first. Traceability row 13 wording and the scorecard wait for that move.

## 2026-10-04 — One-time plan sweep and doc tidy-up (retro)

Commit `7e2e9b9` (21 docs files). Sweep: found 18, fixed 17, deferred 1.

- What happened: a very old feature's plan still said "Not started". A
  one-time sweep of every plan Status line against git found 18 stale
  plans. 17 now show the shipped hash (and E2E where a passed test plan
  exists), plus targeted "superseded" tags and ticked "docs to update"
  items; reasoning left untouched. ZonePicker deferred (needs a code/record
  check).
- Worked: a question about one old feature exposed that the daily check
  only looked at recent changes. Hashes verified against git; exact
  before → after shown before editing; history never rewritten.
- Improve: Item 13 was first described without naming its section in a big
  document, and the "needs a decision" case was jargon-heavy until Basheer
  asked for clarity. Apply script failed on a doubled filename (nothing
  written); one tick edit failed on different line wrapping.
- Process change: the daily tidy-up skill gains check 7 (plan Status lines
  against git). Every finding names its exact section and states plainly
  what is needed.

## 2026-10-04 — Audit log wrap-up and Plan vs Actuals review fixes (retro)

Commits `51deecc`, `4958fd4` (Audit log) and `903ad41` (Plan vs Actuals).

- What happened: Audit log finished on Dev (E2E 31/31, one real fix: stable
  page order). Plan vs Actuals code review found a real leak: plans were
  listed across a whole zone area while actuals were owner-limited, so a
  Sales Executive saw colleagues' plans. Fixed (plans shown only within the
  viewer's scope), labels now "Company total" / "Total (your view)",
  `/zone-rollup` retired end to end. E2E plan revised against live Dev data
  re-checked 2026-10-04 and pushed. E2E itself not yet run.
- Worked: reviews taken one by one with findings verified before fixing; a
  announced read-only Dev query exposed the E2E plan's wrong assumptions
  before any test; hide-check cases built from real people and figures;
  every commit shown and approved first, other sessions' files left out.
- Improve: two code reviews launched in parallel errored and one report was
  wrong, so one was repeated; the leak passed the first review because the
  plan list's visibility rule and the actuals' rule were never compared; the
  2026-10-03 live-data note had wrong roles and amounts; `rg` is not
  installed so the Grep tool fails (Bash grep used).
- Process change: new CLAUDE.md rule (Manual E2E) — visibility/permission
  test plans need a hide-check case from live data and a scope re-check
  just before E2E. Run code reviews one at a time.

## 2026-10-04 — Doc tidy-up leftovers closed (retro)

Commits `7e2e9b9`, `58063fb`.

- What happened: tidy-up leftovers 1-4 closed. ZonePicker plan Status shipped
  (`4f814e3`), Phase-2E-Task9 retest plan deleted, Pipeline product-filter
  plan header now says delivered via the Pipeline Report (Traceability 2.2,
  Done 2026-09-15). The product filter traces to signed Feature 2.2; the
  Account Directory filters trace to our own 2026-09-13 scorecard review, not
  a customer ask, so that Backlog entry was removed. Left: Traceability item
  13 (with the UAT move) and fixing the three Antigravity plans.
- Worked: every "is this done?" answered from code and records before acting;
  both requirement sources traced to documents.
- Improve: recommended on the product filter before reading its plan and
  Backlog entry; deleted the Backlog entry before showing before/after;
  wrote our own parked question up as if it were for the customer; a `cd` was
  blocked by the hook again.
- Process change: every edit, even a decided one, gets before/after shown
  first. A parked question we raised ourselves is labelled "our idea, not a
  customer ask" in the Backlog from the start.

## 2026-10-04 — Plan vs Actuals E2E, first run (retro)

Built on `0f7d75a`, `231fbd0`, `903ad41`; the change below is uncommitted.

- What happened: Pre-flight and Section A passed as Haroon (Dev, 2026-Q3
  Imaging and 2026-Q4 Critical Care). Basheer K (Imaging manager) showed in
  the Critical Care list because he owns a Dev test Opportunity, "Test +lead
  screen" (created 2026-08-18 by an Admin, no referrer). Decision (Basheer):
  people from another SBU get no row (unless they have a plan in the viewed
  SBU); their wins and Expected still count in the totals. Imaging people
  may refer Critical Care Opportunities but Critical Care people close them,
  so this case is not a concern. A first fix hid everyone with no plan;
  Basheer corrected it (a person of the SBU with no plan must still show,
  at Planned 0), and the rule became "home SBU = viewed SBU, or has a plan
  there". Sections S, W, C, L, E, R not yet run.
- Worked: Basheer's "why are we over engineering this" replaced a tag, two
  messages and a wording debate with one filter line; the owner question was
  settled by a read-only Dev lookup, not a guess; keeping totals on everyone
  means real wins by unplanned owners are never lost.
- Improve: built the red label before asking whether the row belonged at all
  (wording changed five times, then the label was deleted); recommended
  "relabel it" before checking why the row appeared; a wrong click (sidebar
  closed) and a guessed column name (`sbu_name`, real column `name`) in the
  lookup script, both harmless; context ran out three times in about two hours;
  the first fix hid the wrong group (no plan, instead of not in the SBU), a
  rule I should have restated back to Basheer before coding.
- Process change: when someone reports an unexpected row or value, answer
  "why is it there" and "should it be there" first, saying whether the cause
  is data or design, before offering wording or styling options. After a
  milestone in a long E2E, commit and update the handover first.

## 2026-10-04 — Plan vs Actuals E2E stopped: who-is-listed rule was never designed (retro)

Basheer stopped testing: "this feature is not built properly." Nothing from
the fixes below is committed; `.claude/session-handover.md` holds the state
and the open decisions.

- What happened: after the owner-scope fix (`903ad41`) held in its
  hide-checks, the people list changed three times mid-E2E. (1) Basheer K
  showed in Critical Care; the first fix hid everyone with no plan (wrong).
  (2) Basheer's rule: hide people outside the SBU, show members even at
  Planned 0; built, 146 planning tests green, Basheer K verified hidden in all
  quarters. (3) Basheer then found Vivek (Critical Care, Sales Staff, no
  Opportunities; plans Q2 approved, Q3 pending, Q4 rejected) missing in Q1
  and Q4: the list is built only from plans, wins, Expected and late
  Opportunities, so a member with no activity never gets a row. (4) A
  read-only UAT check (Basheer approved): 160 Opportunities, none owned by
  someone from another SBU; only Haroon (GM, no home SBU, sells in both SBUs)
  owns Opportunities outside a home SBU (29 Critical Care, 13 Imaging). Under
  the built rule he would have no row without a plan, while his wins count in
  the totals.
- Worked: the scope fix and its hide-checks held; live Dev and UAT lookups
  found each cause fast; Basheer's look at real people caught what stubbed
  unit tests could not.
- Improve: the membership rule (who appears, who appears at zero, people with
  no home SBU) was never written in the plan, so it was patched three times;
  treated a visibility symptom as a filter problem twice instead of asking what
  the list should contain; called the second fix "members of the SBU" without
  checking that members with no activity get rows (the test passed only
  because that person had a Won row); did not ask how a GM who sells across
  SBUs fits before designing the rule.
- Process change (proposed, not yet in CLAUDE.md): (1) a plan for any list or
  table screen states its membership rule, including zero rows and people with
  no home SBU; (2) its test plan includes a "member with no activity" case and
  a "dual-role person" case, both from live data. A rule change found mid-E2E
  is already covered by the existing escalate-to-a-decision rule.

## 2026-10-04 — Plan vs Actuals design review, round 1 (retro)

- What happened: E2E paused for a full design review (Basheer: design → gap
  analysis → fix → new E2E plan → E2E). Agreed: every active SBU member
  expected to plan gets a row every quarter on both Target Planning and Plan
  vs Actuals, with a status per person and an "N of M haven't submitted"
  line, so managers can chase non-submitters. Checked in code that Target
  Planning also lists only people with a plan, so the same gap sits in the
  feature finished on 1 Oct; it reopens (Dev only). Managers see only the
  word "Draft" for a team member's draft. A read-only Dev query surfaced two
  cases: Fahad was temporarily a Marketing User (Basheer will move him back
  to Imaging sales and create a separate Marketing user), and Haroon (GM, no
  home SBU) sells and has targets in both SBUs, so he is on both rosters.
  Four points parked for 2026-10-05 (see handover).
- Worked: pausing for design instead of a third patch; checking Basheer's
  belief about Target Planning in the code before agreeing; one real-data
  query before continuing, which found the Fahad and Haroon cases.
- Improve: the approved plan already said "people with no plan still
  appear", but the build, code review and E2E plan all missed it, because
  nothing checked plan decisions against the built screen. Patched symptoms
  twice instead of asking who the list is for. Gave invented or wrong
  examples (Vivek placed in Imaging; "Fahad ₹40 L"), breaking the
  real-examples rule.
- Process change (proposed, Basheer to review 2026-10-05; not yet in
  CLAUDE.md): (1) before E2E, trace each plan decision to its code and its
  test step; any decision with neither blocks E2E; (2) start every design
  discussion with a read-only query of the real people and records involved,
  and take every example from it; (3) the two rules from the previous entry
  (membership rule in plans; "member with no activity" test case).

## 2026-10-05 — UAT outage: Next Actions screen exhausted database memory

- What happened: UAT slowed from ~2 pm (Haroon: Next Actions screen) and
  froze ~3:50 pm; sign-ins failed (Supabase 522s, then a pooler
  "too many authentication failures" lock). Basheer restarted the UAT
  Supabase project, then the Render backend; app restored.
- Cause: `GET /reminders` loads each reminder through chained
  `lazy="joined"` relationships (Reminder → Activity → account,
  opportunity, user…), one statement with ~100 joins over ~12 tables. On
  the free Nano tier this pushed memory into swap; slow requests piled up
  connections (peak 24 of the database's 60) until it froze. The pooler
  lock was a side-effect, cleared by the Render restart.
- Done: Render pool lowered to 5 + 5 (guard rail, not the fix).
- Pending: the query fix (load only displayed names, per query), and a
  Production sizing note. Open: whether a UAT backup overlapped.
- Fix built and pushed `945253d` (Dev only). Each reminder list now joins
  only what the screen shows: Pending 6 joins (by-Opportunity 7), Completed
  11 (12), down from ~118. On Pending, the closing note loads in a separate
  lookup that fires only for a reopened row (none exist on Dev or UAT).
  Dev check, 3 concurrent × 3 rounds, pool 5 + 5: statement 41,018 → 1,556
  characters; planning 649 → 4.4 ms; connection-held total 26.1 → 6.8 s;
  slowest request 4.2 → 1.4 s. Responses identical to the old loading in 8
  list cases; 1 SQL statement per list. pytest 1130, ruff clean.
- Review (medium): no change needed. Its main worry (hidden extra lookups)
  was checked on Dev and did not occur. Join-count tests kept exact on
  purpose. Its other findings concerned the separate Target vs Actuals work.
- Reopen path: the back-end lets a completed Next Action be reopened but no
  screen does, and the old closing note stays; logged in Backlog. Read-only
  check: 0 open reminders carry a closing activity (Dev 24 open, UAT 610).
- Retro: worked: measuring before and after on Dev, and comparing responses
  byte for byte, caught a dropped field (created-by name) in my first
  version. Improve: the peak-connection metric turned out unreliable (it
  counts every session on the shared login); I should have checked that
  before quoting it, and relied on time-held and statement size instead.
  Also, I wrongly called Dev a bigger machine than UAT; both are free tier.

## 2026-10-05 — Target vs Actuals design settled; UAT outage (retro)

- Worked: every open design question closed in one sitting, using real UAT
  data (Basheer's split query) and industry practice (Salesforce, Zoho,
  Dynamics) for the PO-vs-payment and SBU-target calls. The outage was
  traced to one screen within about an hour, and a guard rail went in
  the same day.
- Improve: (1) I explained the outage before checking the code and
  numbers: "100 files per reminder" (really one query, ~100 lookups),
  connections as the cause (they were a symptom), and "24 of 30" (it was
  24 of the database's 60). Basheer had to ask four times. (2) The design
  decisions sat only in chat for hours; when the outage broke in, the
  plan-doc text, split note and Haroon message were left unapproved.
  (3) Explanations needed deeper everyday analogies than I first gave.
- Process change (proposed, not yet in CLAUDE.md): (1) during an incident,
  state only what the evidence shows and label any guess as a guess;
  (2) once a design decision is agreed, write it into the plan doc
  (uncommitted) the same turn, so an interruption can't strand it.

## 2026-10-05 — UAT checks and what moved (retro)

- **UAT backup:** taken and saved.
- **Data-quality report:** saved to `C:\Backups\CabioUAT\data_consistency_reports\`.
  Hospitals filed at region level fell from 64 to 11. Two more Opportunities
  have no activity logged and two more activities have no next action;
  everything else unchanged. The "added but not used yet" list is now sorted
  by Area (`scripts/uat_data_quality_check.py`, section 3 query).
- **Closure-date report:** saved over the earlier copy, with a "since the last
  check" comparison (red for increases, green for decreases).
- **Why values rose with no change in count** (read-only UAT change-history
  query): Haroon Sidheeq raised "Heart Lung Machine", renamed "CVTS OT
  Equipment", from ₹30 L to ₹55 L on 3 Oct, and added three Opportunities at
  IQRAA Malaparamba on 5 Oct (₹0.28 L, ₹2.30 L, ₹12.5 L; about ₹15.1 L).
  Fahad added an E10 at AJ Hospital (₹20 L); Nishad added a CX12 (₹1.68 L).
  Haroon's +₹50.8 L cannot be matched to the rupee without the exact 3 Oct list.
- **Two wrong guesses of mine, corrected:** the E10 portable moved to
  Negotiation (not closed); the CTG was marked Lost (not moved to a later date).
- **Retro:** compare the actual lists first, then explain any change in value.
- **Doc tidy-up:** Insights Dashboard plan Status corrected to Built; its E2E
  plan deferred to Backlog (to be written with the Plan vs Actuals plan).

## 2026-10-05 — Housekeeping session (retro)

All five due items were finished and pushed (`9a23a4e`): UAT backup, data-quality report, closure-date report, documentation tidy-up and the report sort by Area. The handover note was cut from 141 to about 130 lines by moving the Plan vs Actuals build history here (see the 2026-10-04 entries).

- **Worked:** the reports were checked against live data before being shared, which corrected two of my guesses (one Opportunity had moved to Negotiation, not closed; one had been marked Lost, not moved to a later date). The tidy-up caught one stale plan Status, and the missing E2E plan went into the Backlog.
- **Improve:** I filed my Progress-Archive entry a second time. Another session had already committed it in `cb60b87`, and I did not look at what was already committed before staging. Caught before the push; one amend fixed it. The existing rule covers my writing into another session's work, not another session having already written mine.
- **Process change (proposed, not adopted):** before committing a shared doc, run `git log -3 -- <file>` and search `HEAD` for my own heading. First occurrence, so no hook yet.
- **Handover:** the Plan vs Actuals block had grown to 82 of 141 lines because it was kept as a running diary. Rule of thumb from now on: when a thread's Done and Next lines are separable, the history goes to the archive at the next pause.

## 2026-10-05 (evening) — Target vs Actuals: redesign into plan, gap analysis, migration 0060 (retro)

Wrote the agreed redesign into `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (Redesign decisions block, revised Section 2, revised 7-step build order; file keeps its old name until the build, as eight docs link to it). Gap analysis: 13 items, two large (PO date + "PO received" column; the GM-entered SBU target). Decisions: light first, so the roster is built on Target vs Actuals now; the Target & Coverage Planning screen is a separate second pass; the UAT move comes only after both are built and tested. Step 1 built: migration 0060 (`opportunity.po_date`, `sbu_target` table with audit trigger and RLS), committed and pushed as `1821c30`; applied to Dev, `alembic current` = `0060 (head)`; `Physical-Schema.sql` regenerated in the same commit.

- **Worked:** plain-language-first drafts plus a TLDR let Basheer approve three drafts in one reply. Reading the real code before the gap analysis showed the "SBU Target Rollup" is only a sum of people's plans, so the SBU target is genuinely new. The migration copied the 0053 pattern, so triggers, RLS and the schema refresh went through first time.
- **Improve:** I used "Target Planning" and "Target & Coverage Planning" as if they were two screens; they are the same (`TargetPlanningScreen`), which cost Basheer a question. Use "Target & Coverage Planning" only. Two Bash calls were blocked by the no-cd guard; use absolute paths from the start.
- **Machine note:** alembic needs the backend folder as the working directory, so with no `cd` run it as `python -c "import os,sys; os.chdir(<backend>); sys.path.insert(0,'.'); from alembic.config import main; main(argv=[...])"`.
- **Parked for 2026-10-06:** step 2 (Opportunity side: PO date field, Order → Delivery rule, audit-log fallback, tests); Haroon's split-credit answer expected.
- **Process change:** none.

## 2026-10-06 — Next Actions hotfix live on UAT (retro)

- **Shipped:** pre-checks passed (branch still `fa61bd8` on `a430152`,
  `origin/uat` unmoved). Basheer pushed `fa61bd8` to `uat`; Render "Deploy
  live" 06:16. Merged back into `main` as `6d9c068` (no file changes: main
  already had `945253d` + `0e3d81f`), so the next UAT promotion is a clean
  fast-forward.
- **Real-user check (Basheer's idea):** signed in as Om Hiremath (99 open)
  on UAT, hard-reloaded the home page, which fetches the Next Actions list
  among ~30 API calls; browser resource timings.

  | | Next Actions list | Rest of page (median) |
  |---|---|---|
  | Before (old code) | 3.0 / 6.8 / 7.5 s | ~1.5 / 2.0 / 1.5 s |
  | After, warming up | 3.5 / 3.2 s | 4.1 / 3.2 s |
  | After, warm | 1.9 / 2.3 / 2.1 / 3.8 s | 1.9 / 2.2 / 1.7 / 2.9 s |

  Before, the list was 3–5× slower than everything else; after, it moves
  in step with the page. The page shows ~4× (7.5 → 1.9 s), not Dev's ~10×,
  because ~30 requests queue through the 5 + 5 pool and the list waits its
  turn; its own DB work was ~0.2 s in the 2026-10-05 check. Clicking Next
  Actions in the menu reuses the home page's copy (no new request), so the
  hard reload is the right trigger. Haroon's check is now optional.
- **Next:** lighter query audit on Dev (approved), to find other screens
  with the same chained-loading trap.
- **Retro:** worked: a before/after on a real heavy user's login, same
  method both times. Improve: plan a queue-free measurement up front, not
  only page reloads; and do each browser reading in one step, not
  refresh/wait/read as three (Basheer: "wasting calls"). Process change:
  none.

## 2026-10-06 — Target vs Actuals step 2 (PO date) + session retro

- **Step 2 shipped as a checkpoint, `ebc9613`** (backend only, frontend in
  step 4). PO Date required at Order → Delivery & Installation (also on a
  one-shot jump or a create at a later stage) and at Won; never later than
  today (IST), checked on every save that sends one. Basheer's calls: no
  audit-log fallback ("keep it simple"); older records aren't forced, and
  step 3 shows a "no PO date" note; Won also checks PO Date because reps
  sometimes rush an Opportunity through to Won. pytest 1145, ruff clean.
  Until step 4, Dev can't move an Opportunity to Delivery or mark Won from
  the screen.
- **Om Hiremath "27 overdue vs 99":** not a bug. UAT read-only count: 104
  open = 27 overdue + 77 due later (one item dated 2029-09-22, likely a
  typo).
- **Session retro:**
  - Done: Next Actions hotfix live on UAT and verified as Om (entry above);
    `uat` merged back to main (`6d9c068`); old branches and the worktree
    removed; step 2 above.
  - Worked: a real-login before/after instead of waiting for Haroon;
    one-question-at-a-time decisions with examples; the shell guard
    blocked a scripted code edit, so it went through the edit tool; the
    other session's files stayed out of both commits.
  - Improve: (1) browser readings took three steps each (Basheer:
    "wasting calls"); take each in one. (2) For older records, the heavy
    design (history lookup) was offered first, without the light option
    side by side, as CLAUDE.md asks; this cost a round. (3) Step 1
    (`1821c30`) left `test_persistence.py`'s table and relationship counts
    stale, because the full suite wasn't run before that commit.
  - Process change: the migration checklist in the `cabio-db-and-scripting`
    skill now requires the full backend pytest before a migration/model
    commit, with the pass count in its message (origin in
    Process-Rules-History, 2026-10-06).

## 2026-10-06 — Retro review: suggestions now tracked, weekly review added

- **Why (Basheer):** improvements from the last ~10 days of retros were
  being skipped. Reviewed every retro from 2026-09-26 to 2026-10-06.
- **Found:** ~43 retros in 11 days. Guard rails that got built all held;
  the repeats are judgement mistakes: claims or examples not checked (×9),
  test-plan assumptions wrong (×5), explanations needing a second pass
  (×6), heavy option offered first (×4). Seven one-off suggestions had no
  follow-up anywhere.
- **Correction (Claude):** the first summary listed two suggestions as open
  that were already built: the fresh-install check
  (`docs/Deployment-Topology.md`) and "who can approve / who can save" (the
  test-plan template). Caught on checking before the edits.
- **Done:** `docs/Process-Improvements.md` (P1–P11), SessionStart reminder
  for a Monday review (block 2d), CLAUDE.md "Retros and weekly review"
  plus the Documentation homes and post-commit step 2 wording, origin in
  Process-Rules-History. The parked 2026-10-01 retro was closed: its fixes
  shipped 2026-10-03 and its text exists only in an old chat.
- **Next:** first weekly review Monday 2026-10-12; P1 is its first
  candidate.
