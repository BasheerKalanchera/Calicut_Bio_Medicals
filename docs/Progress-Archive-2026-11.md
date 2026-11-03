# Progress Archive — November 2026

## 2026-11-01 — Pre-E2E tidy-up of the Planning tabs and Simpler Table builds; back-button and arrow standard (Build, parallel)

**Pre-E2E review closed.** `/code-review` of both builds was run 31 Oct
(8 findings, 2 taken; fix `03ac0ea`). Today: the whole-file MUI-standard
read of `TargetPlanningScreen.tsx`, `ChipTabs.tsx` and the three Target vs
Actuals components. Pass, with three small points, all handled in
`3937558` (pushed): (1) the Target vs Actuals SBU and Quarter/Year
drop-downs had no visible name — now "SBU" and "View"; (2) the one-person
screen's "Back" was a text button — now the round arrow-only button
(Frontend standards §6.6 item 7); (3) Target & Coverage Planning's quarter
and year arrows were typed ◀ ▶ — now chevron icons with labels. Neither
build has been seen in a browser; the E2E (run by `/test` after the merge)
is the first look. Backend tests 1,504 passed, tsc clean.

**Found while committing:** the back arrow was first written with a typed
`fontSize: 20`, which the commit check refuses. Fixed to
`fontSize="small"` (MUI's 20 px) before the commit; §6.6 item 7's
reference wording corrected the same way. Also, the commit-time lint
printed "MUI standard: no staged .ts/.tsx files" while three such files
were staged — the checked-file list looked empty in the worktree. I
verified the three files with the check's report mode instead. Not yet
investigated; for Plan & Chore with the harness message.

**Standards written (Basheer's decisions, 1 Nov).** Frontend standards
§6.6 item 7 (back button) reworded; §6.11 rule 8 (previous/next arrows are
chevron icons in an `IconButton`, never typed ◀ ▶) and rule 9 (which arrow
means what: back = `ArrowBackIcon` round button, previous/next = chevrons,
"this row opens" = `ChevronRightIcon`). The shared `BackButton` component
stays banked, low priority. The grey hex chevron on the Customers,
Pipeline, Product Catalog and Project Directory lists is left to the
"fixed when next changed" rule (Customers and the rest are not in MUI
round 1 except Account Management).

**Rule: order of a build** (Basheer, 31 Oct, written 1 Nov): build, then
pre-E2E review and its fixes, then one docs batch — in `CLAUDE.md` "Batch
docs-only commits", `.claude/skills/build/SKILL.md`,
`.claude/skills/cabio-e2e-testing/SKILL.md`, origin in
`docs/Process-Rules-History.md`.

**Backlog:** new section "Front-end standardisation fixes, by screen" — one
heading per screen with everything it still owes the standards, counts
from the check's report mode (34 files, 863 lines on 1 Nov, before
Customer 360 was excluded); Customer 360 left out, its MUI round 1 is with
another session (its error-view "← Back" is already fixed in the main
folder). Plan & Chore was asked to add ◀ and "← Back" to the commit check.

**E2E plans:** `03ac0ea` and `3937558` added to the "Built:" lines of both;
Tabs plan gains C4 (chevron arrows and their labels); Redesign plan gains
B6 (drop-down names, arrows) and C4 now checks the round Back button.

**Merge:** `main` (3 commits) merged into `worktree-build` as `e7461ea`;
the Progress-Archive-2026-10 clash settled by keeping both entries. Branch
pushed to `3937558`. Merge into `main` only on Basheer's go, after `/test`
finishes the E2E.

**Retro (1 Nov, Build):** corrections from Basheer this session: 1 —
"I am still not clear. Tell me what is the standard back button option you
are proposing…" (my first explanation of the back-button standard was not
plain enough). Counted from his 34 messages in the transcript. Two slips
of mine caught by me before they cost anything: I called six screens
"previous/next" chevron users when only one is (the other five are "row
opens" markers), and I reported lint as clean although the commit check
only reads staged files (it would have refused the typed `fontSize: 20` on
the Back arrow; changed to `fontSize="small"` before the commit). No
tracker line: the staged-files gap and the commit-time "no staged
.ts/.tsx files" printout are already with Plan & Chore in the harness
message. Nothing touched live data, UAT or lost work.

## 2026-11-01 — UAT backup; rollout of planning: three of four questions decided (Plan & Chore)

**UAT backup:** `cabio_uat_2026-11-01_0709.dump` (844,004 bytes, 535
TOC entries); pruned `cabio_uat_2026-10-17_0626.dump`; 14 kept. Docker
took about 5 minutes to start (07:04 to 07:09 by the log), though the log
says "50s" — the script counts only its sleeps, not the time each
`docker info` check takes. Drive copy by hand: Basheer.

**Rollout: when planning starts to count** (Backlog entry of that name).
Read first: the first quarter that counts is fixed in code, not a
setting — `FIRST_SAVED_PERIOD = "2026-Q3"`
(`backend/app/domains/planning/service.py:649`), used both for which
brand quarters are saved (D46a) and for what the Year view adds up (D66).
Basheer decided, 1 Nov:
- Q1: Oct–Dec 2026 is the team's learning quarter (a third over when
  planning began; screens may be tweaked from what is learnt); Jan–Mar
  2027 is the first quarter planned properly.
- Q2: Target vs Actuals shows Oct–Dec labelled "Learning quarter, not
  counted"; FY 2026-27's Year view counts from Jan–Mar 2027. Built as a
  `fix:` after today's Simpler Table merge, during its E2E. Annual Target
  D66 marked changed. Simpler Table plan, its E2E plan and Business-Rules
  updated after the merge (unmerged Build edits there until then).
- Q3: Jul–Sep and Oct–Dec paper targets stay on paper; paper is their
  official record.
Open: Q4, readiness conditions for paper to stop (proposed: screens
settled by 5 Dec; every rep's Jan–Mar target and plan saved and approved
by 20 Dec; two manager reviews from the screen) and who confirms them.
Then an ADR.

**Backlog entry added:** "MUI-standard check: refuse typed ◀ and
"← Back"" (Basheer, from the Build session). Grep of both copies, 1 Nov,
found one place more than the request listed: Target & Coverage
Planning's ◀ (main folder only; gone on the Build copy). Which session
builds it: open.

**Session retro:** 2 corrections — said the Target vs Actuals screen was
not built (it is, on Dev since 29 Oct); then said the Simpler Table had
nothing built, having checked `main` only and not the Build branch
(`c490eb9`, pushed). No tracker line.

## Build & Test, 1 Nov — MUI round 1 "Part 1", steps 1–3

- **Decided (Basheer, 1 Nov):** the round 1 work is split. **Part 1** = move
  the round 1 screens onto the theme, add "Delete this file? This can't be
  undone." before the two file-delete buttons, and fix the round 1 findings;
  one commit per screen, no wording changes. **Part 2** = the "Hospital" →
  "Customer" and "deal" → "Opportunity" sweep, separate and after Part 1,
  and after `/build`'s Target vs Actuals simpler table and Target & Coverage
  Planning tabs plans merge (the sweep edits `DemoApp.tsx`, `MyWorkScreen.tsx`,
  `TargetPlanningScreen.tsx`, `TargetVsActuals*.tsx`). The A/B/C split and
  the renames "Rate Customers" and "My customers" are still unanswered; ask
  at Part 2. Other screens (not round 1) are cleaned when next changed; no
  round 2 (plan D10/D13).
- **Order:** 1 shared `ConfirmDialog`; 2 Customer 360; 3 Opportunity Detail;
  4 Product Catalogue; 5 Account Management (zone filter named "Zone");
  6 Daily Activity Report (named filters); 7 Close Next Action and Next
  Actions; 8 21 "after" screenshots, before-and-after page, one combined E2E.
- **Shipped, pushed:** `6a417cb` — steps 1 and 2: `ConfirmDialog.tsx` (plain
  MUI Dialog, not used yet) and Customer 360 (165 → 0 MUI-check breaches;
  Next Actions tab right after Activity; Stakeholders card stacks on a
  phone; the "couldn't load this account" view gets the round arrow-only Back
  button). `f8c61b3` — step 3: Opportunity Detail (172 → 0 breaches; the
  Documents tab "×" asks first, via `ConfirmDialog`). Whole-app check, same
  report: 33 files / 862 lines on 1 Nov before, 31 files / 525 lines after
  step 3.
- **Colours checked:** each screen's new theme names were mapped back to hex
  and compared with the old file: Customer 360 170 of 171 identical,
  Opportunity Detail 149 of 150; the one left in each is the fade at the
  right edge of the tab bar, now the theme's background colour (same value).
- **Not checked / honest limits:** neither screen has been seen in a
  browser; text moved to MUI's caption / body2 / lead / h6 styles can shift
  line spacing slightly (tiny and micro are size-only). The phone-width
  check (390 / 768 / 1280 px) is in the combined round 1 E2E (step 8). No
  frontend tests exist. No backend or data change; nothing on Dev stops
  working.
- **Still open:** steps 4–8; Part 2 (own plan, own E2E); post-commit
  checklist waits for the finished feature.

**Session retro (Build & Test, MUI round 1 Part 1 steps 1–3, 1 Nov) —
corrections from Basheer this session: 2.** (1) I suggested committing
steps 1 and 2 together after saying the pop-up would go in with step 3; he
said "I thought you were planning to make the commit after step 3." (2) I
restyled Customer 360 but missed the "couldn't load this account" view's
grey "← Back" text button (not a MUI-check breach, so the check did not
flag it); he pasted it in as an extra item. Counted from the messages
visible after the context summary plus the summary's list of his earlier
messages. No tracker line: neither was a slip a tool check could stop, and
neither touched live data. Process note (not a correction): for step 3 I
showed the file and subject line, not the full message body, before
"commit + push"; the full message is shown first from now on.

## Build & Test, 1 Nov — manual E2E of what `/build` merged (`515a2f2`)

- **Where it stands:** Target vs Actuals Redesign plan 33 of 41 run
  (Sections P, A, B, C, D; E and F not run), 3 Fails. Tabs plan 8 of 25,
  on hold until `/build`'s fixes D12–D16 (`30766c7`, `8d0d0b3`) merge. Test
  run 41 of 66.
- **Tabs findings:** B1 failed — Needs Your Approval counted 4 plans (3
  from other quarters) because its list ignores period and SBU. My P3 check
  looked at two periods only, so the plan expected 1. Decided with Basheer:
  plan D12–D16 (period and SBU on every tab, "N more waiting in other
  periods", tab order, opening-tab rule, Annual "Your target" line).
- **Target vs Actuals findings, all for `/build` (write-ups given to
  Basheer):** (1) the SBU row reads "SBU" — show the SBU's name (A2/B2);
  (2) "No plan" instead of the dash for a person with no counted plan, Quarter
  view only (B2); (3) the Quarter/Year arrows have no hover text (B6, Fail);
  (4) a person's own screen opens scrolled down, and Basheer wants, at all
  widths, the title/drop-downs/period arrows hidden and the name row fixed
  (C6, Fail); (5) the Overdue tab is hand-built rows on one card — rebuild
  with the shared table component, headings once, one block per person on a
  phone (D10, Fail), and show inactive accounts in their own colour with
  "Inactive account" (needs an `is_active` flag from the server; D9
  suggestion). "Test - Area Manager" (inactive, manager also inactive)
  appears on Haroon's Overdue tab with 2 overdue.
- **Plan corrections made:** D8 reworded (names on the Overdue tab are not
  links; it now checks Fahad's lists in My Work have no Done / Log Activity
  buttons); D2 says what P4's number was (2); D9 expected list updated from
  the 1 Nov Dev check (total 30, was 31).
- **After the merge:** re-run A2, B2, B6, C1, C6, D9, D10, plus a wider
  regression of both plans (Basheer, 1 Nov).

**Session retro (Build & Test, manual E2E, 1 Nov) — corrections from
Basheer this session: 9.** Counted from his 60 messages in the transcript:
(1) the missing "before" pictures, raised twice, counted once; (2) Tabs B1,
my P3 check looked at two periods only; (3) he expected me to fix the Tabs
issues here, not hand them to `/build`; (4) he asked how `/build` would get
the plan updates without a docs commit; (5) my plan described Imaging and
Critical Care rows the screen does not show; (6) I summarised the person-
screen fix as phone-only after he had clarified, and he asked "all 3
layouts?"; (7) he asked for the full `/build` wording after I gave only a
correction; (8) D2 said "same as P4" without P4's number; (9) D8 told him
to click a name that is not a link. No tracker line: none was a slip a
tool check could stop, and none touched live data. Pattern for the watch:
(5), (8) and (9) are plan steps written without checking the built screen
(rule "take labels and the order of checks from the code", 2026-09-30).

## 2026-11-01 (afternoon) — weekly Harness Engineering review; three checks built (Plan & Chore)

**Review** (tracker `docs/Process-Improvements.md`, Reviews line
2026-11-01). Corrections counted from the retros: 126 in 24 sessions
21–27 Oct (5.2 a session) vs 79 in 21 sessions 28 Oct–1 Nov (3.8).
Counting measures but does not stop a slip; the drops came where a tool
check went in. Basheer chose to build all three proposed checks:
- **P98 session clock:** after each successful push, a note tells Claude
  the session's real running time and Basheer's message count, read from
  the session transcript. First live use on `277efa7`: 6 h 4 min, 8
  messages (the time includes breaks).
- **P77 gap:** an inline edit script fed to python named through a shell
  variable (`$P - <<EOF`, the 28 Oct archive edit) is now refused.
- **P102 docs-batch reminder:** a commit with only docs/`.claude` files
  staged gets a reminder to check for code fixes still awaiting their
  pre-E2E review. Never a block. Basheer turned down a blocking design
  as over-complicated. First live check: this docs batch.
Tests: 18 of 18 passed (scratch script). 27 watch-list lines past 14 days
deleted. Committed and pushed `277efa7`.

**"← Back" check (item 4):** read against the code: not built.
`check-mui-standard.js` has no ◀ or "← Back" rule. The only typed ◀ ▶
left in `src` are Brand Target Tracking's year arrows (lines 384, 388).
Fix: two new rules in the check and chevron icons on that screen; ▶ in
Territory Admin stays. Basheer: /build builds it after its MUI round 1
fixes. Still to do, waiting for his yes: Backlog entry (owner, and
"quarter" → "year") and /build's note line saying it waits on Plan & Chore.
Not looked at: /build's report that the check prints "no staged .ts/.tsx
files" with three staged.

**Session retro:** 4 corrections:
(1) "I don't understand the issue here — Docs committed before the code
review": the P102 explanation was unclear.
(2) "Why unnecessarily complicate this": the P102 check was designed to
block, when a reminder was enough.
(3) "I am saying check the code for 4": answered from the Backlog and
notes, not the code.
(4) "Which screen are we talking about here?": the item 4 explanation
didn't say it was the commit check, not a screen.
No tracker line: all four are judgement slips no tool check could stop,
and none touched live data.

## 2026-11-02 — Build & Test: Target vs Actuals E2E Sections E and F done; waiting on `/build`

- **Results:** E1–E4 and F1–F4 all Pass (Basheer, as Fazal, Fahad,
  Shruthi, Haroon and Basheer K). Recorded in
  `docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md` with "Result
  2 Nov". Target vs Actuals plan now 41 of 41 recorded; the 3 Fails from
  1 Nov (B6, C6, D10) stand. Test run 49 of 66 (41 on 1 Nov + 8); Tabs
  plan still 8 of 25, on hold.
- **Plan correction:** F2 said "same as P5", which was wrong. Target &
  Coverage Planning shows "No hospitals on this plan — it was set before
  hospital-wise planning" for Rudrappa's plan (`TargetPlanDetails.tsx:48`);
  "Not assigned to a hospital" is Target vs Actuals' wording for the same
  ₹10.0 L (`backend/app/domains/planning/service.py:1334`). F2 reworded;
  not an app fault.
- **New findings, neither an E/F fail (both for `/build`, write-ups given
  to Basheer):**
  1. Target vs Actuals, a person's own screen (Shruthi on Rudrappa's): the
     other Insights tabs stay clickable and show the signed-in person's
     own data; leaving the tab closes the person screen and the back
     button is gone on return (open person is local state,
     `TargetVsActualsSection.tsx:44`; the tab is mounted only while
     active, `InsightsDashboardScreen.tsx:216`). **Decided (Basheer,
     2 Nov): hide the other tabs while a person's screen is open**;
     "view as Rudrappa" not wanted. In the plan under E4.
  2. Sales Report: the period box says "This Quarter" and nothing shows
     which dates; a quoted figure can't be traced to a quarter. Pre-
     existing (no change to the screen since `515a2f2`, counted with git
     log). Fix: a small line with the period ("Oct–Dec 2026", "Nov 2026",
     "All time"), display only; small-fixes batch. Drill banners that say
     "This Quarter" (`SalesReportScreen.tsx:77`) left as they are.
- **Waiting on `/build`:** to fix, commit and merge to `main`: the Target
  vs Actuals fixes from 1 Nov (SBU name in the SBU row, "No plan", arrow
  hover text, person screen at top with header hidden and name row fixed,
  Overdue tab rebuilt with inactive accounts marked) and the Tabs D12–D16
  fixes (`30766c7`, `8d0d0b3`), plus the two findings above. Seen on
  `worktree-build`, unmerged: `f2b72c6` (person screen), `22e3526`
  (Overdue tab), `84772e9` (docs). Not checked: whether the SBU name, "No
  plan" and arrow-hover fixes are among its commits.
- **After the merge, in this order:** review the new code (pre-E2E);
  re-run A2, B2, B6, C1, C6, D9, D10, plus E2 (Overdue tab rebuilt) and E4
  (person screen); a wider regression of both plans to check nothing else
  broke (Basheer wants it); rewrite and re-run the Tabs plan (B1, C2,
  A2–A5 order, new steps; D–F not yet run). Then MUI step 8 pictures.
- **Why Sales Report is in the plan (Basheer asked):** the Redesign
  Implementation Plan 4(c) (lines 226–232) lists it under "must not
  change" — the zone and brand tables left Target vs Actuals and live in
  Sales Report (lines 180–182, 236–237). Test plan Section F is those
  "after" checks (F1 Sales Report, F2/F3 plans, F4 My Work). Basheer
  has asked `/build` to fix the two findings; if its MUI work also changes
  Sales Report, review it (§6.11, whole file) and re-run F1 as "changed",
  plus a step for the period line at 390/768/1280 px.
- **Session clock (Basheer asked):** the P98 check runs only after a
  successful `git push`, as built on 1 Nov; this session had none, so it
  said nothing when 2 h 23 min / 22 messages passed (run by hand against
  the transcript). Basheer: keep it as it is, tighten later if needed.

**Session retro (Build & Test, 2 Nov) — corrections from Basheer this
session: 4.** Counted from his 22 typed messages (session clock, 2 h 23
min). (1) My first reply said nothing could be tested until `/build`
merges; he had to ask "instead of continuing with E & F?" (E and F could
run on the current app). (2) My answer then read as a "3rd option", and
I had suggested a pre-E2E code review in the middle of a run already
started ("I didn't understand the need for doing the pre-E2E code
review?"). (3) F2 said "same as P5" with no values and was wrong for that
screen; he asked three times (what P5 was; status Approved missing, typo
or fail; the different hospitals message), counted once. (4) I was about
to give E1 without saying which steps fit his Fazal login; he interrupted
with "Any test cases in section E & F can be done with his login id?".
Not counted: his two findings (other tabs on a person's screen; Sales
Report dates), write-up requests, and his questions on the session clock
and on Sales Report. Tracker: new P103 (a step must not point to another
step for its expected value) — 2nd sighting, after D2 "same as P4" on
1 Nov; proposal only, the weekly review decides.

## 2026-11-01 (evening) — MUI steps 5–7, Planning tabs fixes, Target vs Actuals and Overdue fixes (Build, parallel)

All on `worktree-build`, pushed, **not merged into `main`** (Build & Test is
mid-E2E; merge only when Basheer says go). None seen in a browser. Last
checks at `22e3526`: pytest 1,508 passed, tsc clean, lint 0 errors (135
warnings, as before), MUI check 0 breaches in the touched files.

- **MUI round 1 steps 5–7** (taken over from Build & Test by Basheer):
  `06a304b` Account Management (27 → 0, zone filter named "Zone"),
  `0c4f728` Daily Activity Report (24 → 0, date and team filters named),
  `b1fdb3f` Next Actions screen and panel (12 + 10 → 0), `33293b8` Close
  Next Action pop-up (23 → 0), `5c26ed3` Log Activity "Logged For" box.
  Line spacing may shift a hair where text moved to caption / body2: look
  in the E2E screenshots. Step 8 is Build & Test's.
- **Planning tabs fixes D12–D16:** `30766c7`; `8d0d0b3` makes the opening
  tab Needs Your Approval whenever anything waits, in any period or SBU
  (Basheer's question "why not show it irrespective of the quarter?"). The
  pre-E2E `/code-review` found Admin and General Manager would wait on the
  SBU list and could meet a blank screen; removed in `8d0d0b3`.
- **Target vs Actuals, from Build & Test's E2E:** `52e8397` — the row under
  Company shows the SBU's name; Quarter person rows read "No approved plan"
  (Basheer's wording; empty percent also covers Draft and Rejected plans,
  so "No plan" would have been wrong); arrows show "Previous/Next quarter
  or year" on hover. `f2b72c6` — Fix 4: a person's own screen opens at the
  top, hides the card title and pickers, name row stays fixed while the
  boxes and tables scroll (one commit, my recommendation; Basheer did not
  object).
- **Insights Overdue tab:** `22e3526` — headings once; a block per person
  on a phone; zeros grey and inert, counts above zero red and open My Work;
  inactive accounts (e.g. "Test - Area Manager") stay listed in a muted
  colour with "Inactive account". Server: `is_active` on `OverdueActionRow`
  from both overdue queries and the merge; `api.ts` regenerated; no
  migration. Dev backend must be restarted before the E2E re-check.
- **Build & Test re-checks after the merge:** A2, B2, B6, Fix 4 (390 / 768
  / 1280), D9, D10 and the My Work links in D4–D6; the Planning tabs
  E2E for D12–D16. E2E plans not edited by this session.
- **Docs batch:** MUI plan Status and Tabs plan build progress updated;
  Backlog "Front-end standardisation fixes" rechecked (six screens
  cleared; counts of the rest unchanged at 25 files / 400 lines) with a
  new block for the 1.625 line spacing, the Pipeline zone filter name,
  "Logged For" and the "Me (default)" wording check.

**Retro (1 Nov evening, Build):** corrections from Basheer: 2 — (1) "Please
explain this - One honest caveat…" — a caveat I had worded too
technically for him; (2) "What
merge commit you are referring to? Merge commit was already done right?" —
my reference did not match what had been done. Counted from his typed
messages in the transcript after the earlier retro's cut-off; "Not yet…",
"Why not show the Needs Approval tab…" and "Why 2 commits for Fix 4?" are
not corrections. No tracker line: neither could be stopped by a tool check
and nothing touched live data, UAT or lost work. The handover note passed
its 75-line limit (82); pruned before the commit.

## 2026-11-02 — `main` merged in; person-screen tab fix; Sales Report dates and labels (Build, parallel)

All on `worktree-build`, pushed, **not merged into `main`**. None seen in a
browser. Checks on each fix: `tsc`, ESLint and the MUI check pass; lint 0
errors, 135 warnings (as before). No backend change, so no pytest.

- **`b01dcb0` — `main` brought into the branch** (3 commits: hook changes,
  Build & Test's E2E docs, the 1 Nov Plan & Chore entry). One clash, in
  this file; both sides kept, `main`'s entries first.
- **`1c1c78c` — Target vs Actuals:** the tab row (Pipeline, Team Activity,
  Overdue) hides while a person's own screen is open and returns on Back.
  The section reports the open person to the dashboard through a new
  optional `onPersonOpenChange` prop; it clears on unmount. Re-check with
  Fix 4 at 390 / 768 / 1280: the card may sit close to the top edge (no
  gap added, so the sticky name row is not disturbed).
- **`35e9156` — Sales Report:** a grey line beside the period box says
  which dates it covers ("Oct–Dec 2026" for This Quarter, 2026-Q3 per
  `scripts/quarter.py` on 2 Nov; "Nov 2026"; "All time"), reusing
  `formatPlanningPeriod`. The Period and Group by boxes now carry names
  (standards §6.11 rule 7). Display only. Drill-down banners left as they
  were (their wording feeds the Pipeline list's filter label). Found in the
  Target vs Actuals E2E, step F1. Re-check at 390 / 768 / 1280: the card
  header with the labelled Group by box.
- **Noted, not done:** the Pipeline Report has the same unnamed-box gap.
  The commit-time MUI check printed "no staged .ts/.tsx files" on both
  `1c1c78c` and `35e9156` although a .tsx file was staged in each (the same
  slip `/build` reported on 1 Nov; run by hand with the file staged it
  checks correctly). Still to go to Plan & Chore via Basheer.
- **Pre-E2E review (2 Nov):** medium `/code-review` of the five fix
  commits since the 1 Nov review (`52e8397`, `f2b72c6`, `22e3526`,
  `1c1c78c`, `35e9156`), with the touched files read against standards
  §6.11. Ten findings, none taken, each checked against the code. The
  "tab row can stay hidden" finding is wrong: the section is only on screen
  while its tab is selected and clears the flag when it goes
  (`TargetVsActualsSection.tsx:83-86`, `InsightsDashboardScreen.tsx:221`).
  "No approved plan" on a blank percent is right: submitting a plan needs a
  total above zero (`planning/service.py:204-206`) and only submitted plans
  count, so a blank percent means no counted plan. The Sales Report date
  line and the quarter bounds use the same calculation (`formatter.ts`).
  `OverdueActionRow` is built in one place, which passes `is_active`. The
  Period and Group by names are box labels, like the SBU and View boxes
  accepted on 1 Nov. Phone-layout points (sticky name row, card near the
  top edge) stay with Basheer's 390 / 768 / 1280 step.
- **Checks at `35e9156`:** pytest 1,508 passed; `tsc` clean; ESLint 0
  errors, 135 warnings (as before); ruff 2 line-length errors (E501) in
  `backend/tests/domains/reporting/test_reporting_service.py` lines 92 and
  129, left by the test edits in `22e3526`. Fixed by wrapping the two lines
  (`a8e971f`, tests only); ruff check then clean and the 131
  reporting tests pass. `ruff format --check` still flags other spots in
  that file, in tests this build didn't touch; left alone.
- **Open:** the merge, when Basheer says go.

**Retro (2 Nov, Build):** corrections from Basheer: 1 — "can you also apply
the MUI guidelines check and fix the screen for that too?" I had reported
the Sales Report's MUI check as passing, but that script covers only
typed colours / sizes / class names / tables; the judgement rules (here, a
filter's name above it) are read by hand and I hadn't. Counted from his 11
messages this session; the mangled `/build`, the approvals, "commit +
push" and the two fix write-ups are not corrections. No tracker line: not
a slip a tool check could stop, and nothing touched live data, UAT or lost
work. Session clock at the checkpoint: 2 h 29 min, 10 messages.

## 2 Nov (Build & Test) — Tabs re-run: "My Targets" tab proposed

- Re-run on `main` (`a1c9d67`), Fazal: Tabs A2 and B3 Pass. At A2 Basheer
  asked why the Oct–Dec row of his Annual plan table was blank beside "Your
  target for FY 2026-27: ₹160.0 L". Answer, read from the code: the line is
  his target (set by Haroon, `own_target_lakhs`); the table is his own plan
  (none for Oct–Dec, so "—", "Not set", "Plan"). Working as built, but
  confusing; Annual "Plan" is also a plain link where Quarter's is a
  filled button.
- Basheer's design call, written up as D17 in the Tabs plan: new My
  Targets tab, My Plan → My Plans, order Needs Your Approval / My Targets /
  My Plans / Team Targets / Team Plans, rep opens on My Plans, a manager
  with nothing waiting opens on My Plans (was Team Plans), Admin hides
  both. GM point: he said the GM has a target per SBU; the rules and Dev
  (Haroon "-") say not. Decided with him: the GM's My Targets shows the
  SBU target of the chosen SBU (no new rule). One point still open: keep
  or hide the SBU Target card on Team Targets (Admin has no My Targets
  tab, so removing it would hide the SBU target from Admin). Write-up for
  `/build` handed to Basheer via Plan & Chore.
- Re-checks recorded on `a1c9d67` (backend started 11:29, after the files
  changed): Tabs P1, A2, B3 Pass; Target vs Actuals P1b, E4, F2 Pass, B2
  half (Shruthi's "No approved plan" Pass). P3b re-read of Dev data (2 Nov,
  read-only): Overdue total 32, Fahad 3, Vivek 3, Fazal's tab total 5;
  everything else unchanged. 53 of 66 recorded; 3 of 24 re-checks done.
- Decision: pause the Tabs re-runs (every Tabs step names the tabs) until
  `/build` lands D17; continue the Target vs Actuals re-checks, which it
  doesn't touch. Tabs E2E D–F stay unrun.

**Retro (2 Nov, Build & Test, second half):** corrections from Basheer: 1
— "Give me the full description of these test cases": my Fazal steps were
a short list. Borderline, not counted: he asked which steps use Shruthi's
login, because my list didn't say which login each step needs. My own
slips, not corrections: I said the backend ran old code from a
`/openapi.json` check (404, docs are off), retracted by me and verified by
process start time; a wrong B5 expectation, caught by me; a stale
"1 Nov counts" line in the Target vs Actuals plan's D9, found at the
write-up and fixed. No tracker line: no tool check could have stopped
these, and nothing touched live data, UAT or lost work (Dev only read).
Session clock at 15:09: 4 h 27 min wall-clock (about 2 h 12 min active
after gaps of 63 and 72 min), 21 messages.

## 2026-11-02 (second Build session) — My Targets tab, plan amount, Overdue sort, pre-E2E review (Build, parallel)

All on `worktree-build`, **not merged into `main`**. None seen in a browser.
Screen-only changes, no server change, no migration. Checks on each: `tsc`
and the MUI check clean; ESLint 0 errors, 135 warnings (as before).

- **`cfa886c` — Tabs plan step 4 (D17):** My Targets tab, "My Plans"
  rename, new tab order and opening tab, the General Manager's SBU-target
  card (Annual view: "Imaging SBU target" over four quarters and a total,
  agreed with Basheer 2 Nov), filled "Plan" button in the Annual view, the
  "Your target" line off the plans tab. `main` merged in first (`3b82bf9`).
- **`14888f8` — Target vs Actuals, Quarter view:** each person's row reads
  "of plan ₹X L" under the percentage (`TargetVsActualsSection.tsx:218`).
  Basheer's write-up; Simpler Table D13 is not yet written into that plan
  (Plan & Chore's job).
- **`ab6a039` — Insights Dashboard, Overdue tab:** a "Sort by" box (Most
  overdue first, the default / Name A–Z), choice not saved. Basheer's
  write-up; D14 not yet in the Simpler Table plan either.
- **Pre-E2E review (medium, `main..HEAD`, held until Basheer said):** 8
  findings, each checked against the code. **Three taken, `19141b8`:**
  (1) My Targets showed a blank panel for the General Manager while the SBU
  list loaded; now a spinner. (2) The Opportunity Pipeline file still said
  "deal" in its visible text, names and comments; now "Opportunity"
  (CLAUDE.md terminology; same behaviour). (3) The deliberate-sign-out flag
  (`bd81bcb`) was cleared only by `signIn()`; a session restored another way
  (a login in another tab) left it on, so a later expiry would not reach the
  login screen; now also cleared when a session is applied. **Five not
  taken:** the Overdue list is not paged and is sorted on the server;
  the hook-order worry is wrong; the plan amount and the percent come from
  the same `planned_lakhs` (`service.py:1355/1360`); the General Manager's
  "Not set yet" is the intended wording; the My Plan / My Plans heading is
  D17 as decided. Noted, not taken: the Annual total counts set quarters
  only, as the old line did.
- **Noted, not fixed:** `src/App.jsx:7686` still says "No deals match this
  report filter" (old file, outside the review). The commit-time MUI check
  again printed "no staged .ts/.tsx files" with a .tsx file staged (known).
  Shell guard blocked the first review-fix commit for the word "deal" in
  its message; reworded.
- **Open:** the push and the merge (when Basheer says go); the "Me
  (default)" wording check in Frontend standards and Process-Improvements;
  D13/D14 for the Simpler Table plan and the MUI-check quirk go to Plan &
  Chore via Basheer; Basheer's 390 / 768 / 1280 px looks at E2E.

**Retro (2 Nov, Build, second session):** corrections from Basheer: 1 —
"Please explain this": my question about the General Manager's card heading
in the Annual view was in jargon, so he had to ask for a plain version.
Counted from the 16 messages in the transcript (including the retro request
and one mangled "eys."); the approvals, the two write-ups, "hold off on the
review" and "do the code review now" are not corrections. No tracker line:
no tool check could stop it, and nothing touched live data, UAT or lost
work. Session clock: 6 h 24 min wall-clock (first to last message,
transcript timestamps).

## 2 Nov (Build & Test, evening) — Target vs Actuals re-checks; plan figure missing beside Won % of plan
- Re-checks recorded as Pass (Basheer), on the merged code: Overdue tab D2,
  D3, D4, D5, D6, D8, E2 (as Fazal); Year view A2 and Quarter view B2 (as
  Haroon). D2: Fazal's card title reads "Overdue — 5 overdue next
  actions" (his 2 + Fahad's 3), not the team-wide 32 Haroon sees. D8: the
  hospital and Opportunity names on Fahad's rows are clickable — expected
  (`MyWorkScreen.tsx:698,701`); only "Done" depends on whose list it is.
- **Finding (Basheer, during B2):** on the Quarter view a person's Won % is
  Won ÷ their approved plan (`service.py:1360`, `percent_of_target(won,
  planned)`), labelled "of plan" (`TargetVsActualsSection.tsx:218`), but
  the plan amount itself is not on the row; the "Target" column beside it
  is the target (`:213`). So Fahad's 44.00 % and Basheer K's 41.82 % cannot
  be checked by eye. Confirmed by code read; the plan figure is already in
  the response (`planned_lakhs`, `service.py:1355`). **Decided (Basheer,
  2 Nov):** show the plan amount under the percentage ("of plan ₹25.0 L"),
  front-end only — D13 in the Simpler Table plan; write-up handed to
  `/build`. Re-check: TvA B2 and B5 once built.
- **Finding (Basheer, during D9):** the Overdue rows are not in "Who" order
  — the server sends most-overdue first (`reporting/service.py:284-287`),
  no documented decision. **Decided (Basheer, 2 Nov):** keep that as the
  default and add a "Sort by" box (Most overdue first / Name A–Z) — D14;
  write-up handed to `/build`. Re-check: TvA D9 and D10 once built.
- Also recorded as Pass this evening: B6, C1, C6, D9 (with the finding).

**Retro (2 Nov, Build & Test, evening):** corrections from Basheer: 2 —
(1) "How do you remember which steps we parked for re-check? Have you
written it somewhere?": the parked list was not in the handover note or the
archive; written into both after he asked. (2) "What is this re-check — 'no
explicit re-test lines for D13 and D14'?": jargon, re-explained in plain
words. Borderline, not counted: "Go ahead. Give me A2's full details" (my
next-step line was shorter than the full steps). My own slips, not
corrections: the closing status line counted each re-check as a new
recording and climbed to "66 of 66 (100 %)" — re-runs don't add to recorded
steps; the right figure is 53 of 66 (80 %) from the handover note, not
recounted, plus 17 Target vs Actuals re-checks Pass (my count of this
session's results; E4 and F2 earlier today), noticed at the retro; a
pointer in the test plan to this entry was added before the entry existed;
the handover's "24 re-checks" never reconciled with the plan's markers and
was left unresolved. No tracker line: no tool check would have stopped
these, and nothing touched live data, UAT or lost work (Dev not written to).
Findings handed to `/build`: D13 and D14.

## 2 Nov (Plan & Chore) — UAT backup; Tabs plan D17 settled for `/build`

**UAT backup:** `cabio_uat_2026-11-02_0813.dump` (847,841 bytes, 535
checked entries); the oldest, `cabio_uat_2026-10-19_0703.dump`, pruned, 14
kept. Docker had to be force-closed at the end (30 s timeout). Basheer
copies the file to Google Drive by hand.

**Doc tidy-up:** skipped today (Basheer). His idea of moving it to every 3
days is parked, not decided; nothing changed.

**Tabs plan D17 (My Targets tab), reviewed from Build & Test's write-up.**
Read against `TargetPlanningScreen.tsx`, `TeamTargetsPanel.tsx` and
`SbuTargetBox.tsx` at `bd81bcb`. Found: the GM's "My Target" heading would
present the SBU target as the GM's own (BR-PL-12); the plan left a
decision to `/build` (remove Team Targets' "Your target for the year"),
though the code shows it is the team-total comparison, not a copy; D17's
order line said "as D14" while reversing it; the SBU Manager's own target
was unchecked. Basheer, 2 Nov: SBU Target card stays on Team Targets
(Admin, GM, SBU Manager); the GM's card is headed with the SBU ("Imaging
SBU target ₹280.0 L"); Team Targets keeps its "Your target" comparisons.
Dev check (read-only, admin connection, 2 Nov): one SBU Manager, Basheer K
(Imaging), reports to the GM, no reports, no target in any quarter; the
four Area Managers report to the GM, who set their Oct–Dec (2026-Q3)
targets: Fazal ₹160, Shruthi ₹120, Arun Adarsh ₹100, Nishad K V ₹85 L.
Business-Rules and Traceability name no tabs; Frontend standards' wording
examples changed to "My Targets" / "My Plans"; UAT User Manual waits for
the UAT move. Plan sections updated for D17 (older decisions marked
replaced, plain terms, phone, build step 4, addendum). Committed and
pushed `c23478a`. Brief for `/build` step 4 given to Basheer in chat.

**Session clock:** after the push the P98 hook reported "8 h 6 min" for a
window opened 08:07 and idle most of the day (about 1 h 10 min of work);
logged under "For the next review" in Process-Improvements (Basheer).

**Session retro:** 1 correction:
(1) "This session just started 1hr ago. Where are you getting 8 hrs window
from?": passed on the session clock's figure and suggested `/exit`
without checking it against the message times. Already logged for the
Harness review (the hook counts idle time); no extra tracker line.
