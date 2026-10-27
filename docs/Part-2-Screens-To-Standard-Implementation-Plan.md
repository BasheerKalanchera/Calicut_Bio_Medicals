# Annual Target Part 2 Screens to the Full Standard — Implementation Plan

**Status:** Approved, 2026-10-26 (D1–D11 answered by Basheer). Step 5 shipped `65ab36a` (2026-10-27).
**Traceability rows:** 14.1, 14.2 "Responsive Web App (iOS/Android), simple
UI minimizing manual entry"; Annual Target Planning's rows (unchanged in
what they do).
**Design / discussion:** `docs/MUI-Good-Practice-Implementation-Plan.md`
(Plan & Chore, Draft) — this plan uses its standard and shared parts;
`docs/Annual-Target-Planning-Implementation-Plan.md` Part 2.

## Decisions

- D1. Every screen Annual Target Part 2 built or changed is brought to the
  full frontend standard before it is committed or tested — Basheer,
  2026-10-26 (answer "1" to "Does it apply to today's changes?")
- D2. Today's phone fixes are not committed as built; they are redone to
  the standard. This replaces MUI plan D4 (Option A) and its proposed D17
  for these screens — Basheer, 2026-10-26 (Plan & Chore to update its
  plan)
- D3. Screens in scope: Target & Coverage Planning with its four parts
  (SBU Target box, Team Targets, Team Plans with plan details, plan
  pop-up); Brand Target Tracking with its pop-ups; Insights Dashboard's
  Target vs Actuals card (Quarter and Year views) and the shared report
  display pieces it uses; the notification bell. Also Rate Hospitals and the
  zone picker, changed today, which can't be committed otherwise (MUI
  plan D10). The bell keeps its 🔔 emoji rather than an MUI icon —
  Basheer, 2026-10-26
- D4. The shared parts these screens need (colour set and text styles in
  the theme, table-or-cards part, full-screen pop-up on a phone, zone
  filter style — MUI plan step 4) are built now, before My Work, instead
  of after it. Changes MUI plan D7 — Basheer, 2026-10-26
- D5. The Part 2 E2E (Annual Target plan step 7) runs once, on the
  finished screens, with the phone, tablet and laptop checks folded in —
  not twice — Basheer, 2026-10-26
- D6. No early UAT update: Target & Coverage Planning and Rate Hospitals
  reach UAT after round 1's combined E2E (MUI plan D15), not on the
  hotfix branch; the 27 Oct update is dropped — Basheer, 2026-10-26
  (changes the same day's "as soon as their part is done")
- D8. Text sizes used 10 or more times get a named theme style with the
  same size; rarer sizes round to the nearest named style when their
  file is cleaned (about a pixel) — Basheer, 2026-10-26
- D9. The commit check looks only at the files in the commit (44 files
  match a breach pattern today; whole-app would block every commit) —
  Basheer, 2026-10-26
- D10. Cards on a phone use MUI's Card and List parts: the row's name as
  the card title, other columns as "Label: value" lines, actions on the
  right. MUI documents no table-to-cards pattern (its Table page offers
  only sideways scrolling); §6.11 rule 2 already chose cards — Basheer
  asked Claude to follow MUI, 2026-10-26
- D7. Insights Dashboard itself, and the five report screens that share
  the report display pieces, are not cleaned up here (MUI plan D13: when next
  changed); their look is checked in the E2E because the shared parts
  change under them — Basheer, 2026-10-26
- D11. Step 5 also replaces every "deal" with "Opportunity" on the Sales
  Report, Pipeline Report, Stagnant Deals and Insights Dashboard screens,
  and renames the "Stagnant Deals" menu entry and page title to "Stagnant
  Opportunities". Because the commit check covers the whole of each
  changed file (MUI plan D10), those four screens and the app's outer
  frame (`DemoApp.tsx`, 86 lines flagged on 2026-10-26) are cleaned in full in step 5.
  This changes D7 for them — Basheer, 2026-10-26

## Figures and sources

- Part 2 commits and the files they touched: `f5d30d5`, `99c64ad`,
  `51d4fe8`, `19c2593` — `git show --stat`, 2026-10-26
- Pattern matches in the in-scope files (not reviewed findings): 28
  lines with a typed colour, 41 with a hand-set text size, 5 with a style
  label (`className`) — grep, 2026-10-26 (per-file table in section 6)
- Report display pieces shared with 5 other report screens (On Hold,
  Pipeline Report, Product Performance, Sales Report, Stagnant
  Opportunities) — grep, 2026-10-26
- Standard not yet written; Plan & Chore is writing it today (MUI plan
  step 1, D13) — `.claude/session-handover-plan.md`, 2026-10-26
- 390 / 768 / 1280 px, phone cut-off 600 px — MUI plan D8, D16
- Lint failure on the phone fixes: 4 lines flagged by the no-style-label
  check — `npm run lint`, 2026-10-26

## 1. In plain terms

Annual Target Part 2 added or changed five places in the app: Target &
Coverage Planning, Brand Target Tracking, the Target vs Actuals card on
the Insights Dashboard (including the new Year view), and the
notification bell. Today's phone fixes also touched Rate Hospitals and the
zone filter box. None of them yet follows the full standard: colours and
text sizes are typed into each screen, and the phone layout is done by
hand-written styling that the commit check rejects.

This plan brings each of those to the standard before anything is
committed:

1. **The standard is written first** (Plan & Chore, today). Basheer
   approves its wording. Nothing can be built to it before then.
2. **The shared parts are built** — one colour and text-size set, one
   "table on a laptop, cards on a phone" part, pop-ups that fill a phone
   screen, the zone filter style — together with the automatic commit
   check. This moves ahead of My Work.
3. **Each screen is redone, one at a time,** using the shared parts, and
   checked at phone, tablet and laptop width before it is shown to
   Basheer.
4. **One E2E test run** covers Part 2's features and the new look
   together.

What changes for users: the screens look and behave the same in what they
show and save; colours and text sizes come out consistent, tables become
proper cards on a phone, and pop-ups fill the phone screen.

**Effect on UAT:** tomorrow's phone fixes for the team (Target & Coverage
Planning, Rate Hospitals) wait until those two screens are redone and
tested — a delay of a few days (estimate, not counted). Everything else
here is Part 2 and was already waiting for its own UAT move.

### On a phone

- Target & Coverage Planning: each table (Team Targets, Team Plans and
  the rest) becomes cards, one per person, pushed in under their manager;
  the plan pop-up fills the screen.
- Rate Hospitals: search on its own line with a magnifying glass and ✕;
  "Zone" and "Rating" filters on line 2; each hospital a card (name, zone,
  rating box, notes, Save).
- Brand Target Tracking: each brand a card with its quarters inside; its
  pop-ups fill the screen.
- Target vs Actuals: each person a card in both the Quarter and Year
  views, opening to their detail.
- Notification bell: the list fills the phone screen width.
- Exact layout of each screen is shown to Basheer (screenshots at three
  widths) before that screen's commit.

## 2. Build order

1. **Standard wording** — Plan & Chore (MUI plan step 1). Docs only.
2. **Shared parts and the commit check** — MUI plan steps 2 and 4
   together (D4), one commit. Every pop-up in the app changes on a phone,
   so its own quick phone check of the pop-ups used in this plan.
   *Stops working on Dev:* nothing; any screen still using the old phone
   styling keeps working until it is redone.
3. **Target & Coverage Planning, Rate Hospitals, zone picker** — redone,
   measured at three widths, shown to Basheer, one commit. Hand-written
   phone styling removed from these. They reach UAT after round 1's
   combined E2E (D6).
4. **Brand Target Tracking** — redone, one commit; the hand-written phone
   styling file is deleted here (its last user).
5. **Target vs Actuals card and the shared report display pieces** — one
   commit; the five report screens sharing those parts looked at on Dev
   (D7).
6. **Notification bell** — one commit.
7. **Part 2 E2E** (Annual Target plan step 7, test plan sections I–K
   plus a phone/tablet/laptop step per screen) — D5. Then the
   post-commit checklist and Part 2's UAT move as planned.

Every step lands on Dev first; only step 3's two screens go to UAT early.

## 3. What could be affected

No change to what is fetched or saved — only how screens look.
- (a) The screens in D3.
- (b) None — no report or link opens them with a filter that changes.
- (c) Shared parts used elsewhere: every pop-up in the app (step 2), the
  zone picker's other 7 uses (3 filters, 5 forms — one is Rate Hospitals),
  the report display pieces on 5 report screens (step 5), the bell on every
  screen. Each gets a look before and after in the E2E.

## 4. Not in this plan (with reasons)

- Insights Dashboard's other cards and the five report screens'
  own layout — MUI plan D13 (cleaned up when next changed).
- Round 1 screens (Account Management, Customer 360, etc.) — MUI plan.
- Any change to what a screen shows or saves.

## 5. Business rules and records to update

- MUI plan: D4, D7, D17 changed by this plan (Plan & Chore updates it).
- Annual Target plan: step 7 notes the E2E waits for this plan (D5).
- Build & Test handover; Backlog "MUI good practice…" points here.
- No business rules or ADR changes.

## 6. Technical addendum

Pattern counts per file (grep 2026-10-26: typed colour `#hex` / `fontSize`
/ `className=`):

| File | Colour | Text size | className |
|---|---|---|---|
| screens/TargetPlanningScreen.tsx | 0 | 1 | 1 |
| components/SbuTargetBox.tsx | 0 | 1 | 0 |
| components/TeamTargetsPanel.tsx | 0 | 0 | 0 |
| components/TargetPlanDetails.tsx | 0 | 0 | 0 |
| components/TargetPlanDialog.tsx | 0 | 2 | 0 |
| screens/RateHospitalsScreen.tsx | 0 | 2 | 0 |
| components/ZonePicker.tsx | 0 | 0 | 0 |
| screens/BrandTargetTrackingScreen.tsx | 0 | 2 | 4 |
| components/TargetVsActualsSection.tsx | 8 | 12 | 0 |
| components/TargetVsActualsParts.tsx | 0 | 1 | 0 |
| components/TargetVsActualsYear.tsx | 1 | 4 | 0 |
| components/ReportingUI.tsx | 13 | 11 | 0 |
| components/NotificationBell.tsx | 6 | 5 | 0 |

- `src/theme/phoneTable.ts` (`STACK_ON_PHONE`, `data-label`,
  `phone-hidden`, `phone-chevron`) is replaced by the MUI plan's
  table-or-cards component (`useMediaQuery(theme.breakpoints.down("sm"))`)
  and deleted in step 4.
- Each screen step: type check, lint (with the new check), pytest
  unchanged, measured at 390 / 768 / 1280 px (`scrollWidth >
  clientWidth` inside each card) before handover.
