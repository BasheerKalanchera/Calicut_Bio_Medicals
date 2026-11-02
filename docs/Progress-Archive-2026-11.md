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
