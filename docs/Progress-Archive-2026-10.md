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
