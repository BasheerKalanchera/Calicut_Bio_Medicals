# Progress Archive — November 2026

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
