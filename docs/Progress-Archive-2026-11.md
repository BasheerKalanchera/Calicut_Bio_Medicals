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
