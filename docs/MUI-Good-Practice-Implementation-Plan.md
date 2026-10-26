# MUI Good Practice on Phone, Tablet and Laptop — Implementation Plan

**Status:** Approved 2026-10-26 (Basheer) — every decision below answered
by him the same day. Step 1 done; step 2 with Build & Test.
**Traceability rows:** 14.1, 14.2 "Responsive Web App (iOS/Android), simple
UI minimizing manual entry" (already Done; this plan keeps it true).
**Design / discussion:** Backlog "MUI good practice on phone, tablet and
laptop" (raised by Build & Test 26 Oct, handed to Plan & Chore).

## Decisions

- D1. Write the MUI way of building for phone, tablet and laptop into the
  frontend standards; every new screen follows it from then on —
  Basheer, 2026-10-26
- D2. An automatic check at commit time, run with the existing lint, does
  the review itself; not a line in the commit message — Basheer,
  2026-10-26
- D3. No separate automatic browser test: the phone, tablet and laptop
  check is done in E2E testing — Basheer, 2026-10-26
- D4. The 25–26 Oct phone fixes (Target & Coverage Planning, Rate
  Hospitals, Brand Target Tracking) go to UAT as built and are redone to
  the new standard here — Basheer, 2026-10-26 (Option A)
- D5. Lighter review first: the screens reps use most on a phone; the
  rest in a second round, planned after the first — Basheer, 2026-10-26
- D6. Colours (`statusColors.ts`, the repeated greys) and the shared zone
  filter style are in this plan; duplicate forms for other objects (the
  Opportunity edit copies were removed 1 Oct, `a430152`) stay a separate plan (Backlog "Front-end consistency audit") —
  Basheer, 2026-10-26
- D7. Order: the standard and the automatic check first, so My Work is
  built the right way; fixes to existing screens only after My Work is
  built — Basheer, 2026-10-26
- D8. The three widths checked: phone 390 px, tablet 768 px, laptop
  1280 px — Basheer, 2026-10-26
- D9. Round 1 screens come from the UAT usage analysis of 4–10 Oct
  (Progress-Archive-2026-10, 11 Oct): Account Management (hospital
  search), Customer 360, the Log Activity, Close Next Action, New
  Stakeholder and New Customer pop-ups, Opportunity Detail with Edit
  Opportunity, Next Actions, Daily Activity Report — Basheer, 2026-10-26
- D10. Any screen changed in a commit must follow the whole standard, not
  just the changed lines; from now on no screen is committed unless it
  does. The automatic check (step 2) enforces it per changed file —
  Basheer, 2026-10-26
- D10a. Urgent bug fixes are exempt from D10 for one week, until Sun
  1 Nov 2026 — Basheer, 2026-10-26
- D13. The standard and the automatic check land today, 26 Oct; the
  standard applies to every screen commit from today. Round 1 is done by
  Sun 1 Nov 2026; every other screen is cleaned up when it is next
  changed (D10), with no separate round 2 — Basheer, 2026-10-26
  (replaces "all MUI changes this week", same day)
- D14. My Work is built to the standard — Basheer, 2026-10-26
- D15. Round 1 is tested with one combined E2E — Basheer, 2026-10-26
- D16. The phone cut-off is 600 px wide: below it the app treats the
  device as a phone (cards, full-screen forms); an upright tablet
  (768 px) keeps the laptop layout, following Google's width classes —
  Basheer, 2026-10-26
- D17. Because D10 applies from today, the shared colour set, text
  styles, full-screen pop-up and table-or-cards part (step 4) are built
  with the check today, by Build & Test; the three screens of its
  uncommitted phone fixes (D4) are moved onto the new parts before that
  commit, instead of shipping as built — Basheer, 2026-10-26 (changes
  D4's "as built")
- D11. Pop-up forms fill the whole screen on a phone (MUI's guidance for
  long forms), changed once in the shared pop-up so every form gets it —
  Basheer, 2026-10-26
- D12. The three screens from D4 move to the shared table-or-cards block
  in the step that builds it, and the hand-written phone CSS is deleted —
  Basheer, 2026-10-26

## Figures and sources

- 22 screens, 30 shared components — counted with `ls`
  (`sales-os-app/src/screens`, `src/components`), 2026-10-26
- 562 lines with a hard-coded colour in 35 files, 64 distinct colours,
  `#9ca3af` 125 times, `#f3f4f6` 111; 406 lines with a hand-set font
  size; 2 files with `className` — Backlog entry, grep 2026-10-26
  (pattern matches, not reviewed findings)
- Pop-ups capped at 28rem, never full screen — `FormModal.tsx` lines 47,
  92–94, read 2026-10-26
- 3 screens use the hand-written phone CSS (`phoneTable.ts`) — grep
  2026-10-26
- Zone filter: 3 filter uses, 5 form uses of `ZonePicker` — Backlog
  "Filters and search boxes" bullet (Build & Test, 26 Oct)
- Round 1 screens — UAT server log 4–10 Oct (Progress-Archive-2026-10,
  11 Oct): 290 of about 590 app opens started with a hospital search;
  main loop search → hospital page → log a visit, open or edit an
  Opportunity, add a contact; about 400 visits logged; Next Actions in
  17 % of sessions, Daily Activity Report in 15 %; Pipeline filters used
  34 times. Report screens load at sign-in, so they can't be ranked
- MUI's default width steps: xs 0, sm 600, md 900, lg 1200, xl 1536 px,
  with no phone/tablet labels — mui.com/material-ui/customization/
  breakpoints, read 2026-10-26
- Google's width classes: under 600 = 99.96 % of phones held upright;
  600–839 = 93.73 % of tablets held upright; 840–1199 = 97.22 % of
  tablets held sideways — developer.android.com "Use window size
  classes", read 2026-10-26
- MUI documents a responsive full-screen pop-up (`useMediaQuery` +
  `fullScreen`) as a supported option, with no rule on when to use it —
  mui.com/material-ui/react-dialog, read 2026-10-26
- 390 / 768 / 1280 px — 390 and 1280 used in Build & Test's 26 Oct Dev
  measurements; 768 is an upright tablet (Google's 600–839 class); D8

## 1. In plain terms

The app works on phones today, but several screens were made to fit by
hand, one by one, rather than the way MUI (the screen toolkit we use)
expects. Colours and text sizes are also typed into each screen
separately, so screens slowly drift apart. This plan does three things:

1. **Writes down the rules** in the frontend standards: how a table turns
   into cards on a phone, that pop-up forms fill a phone's screen, that
   colours and text sizes come from one shared set, and how filters and
   search boxes look. You approve the wording before anything is built.
2. **Adds an automatic check** that runs every time code is committed,
   next to the existing lint. A commit that changes a screen is refused
   unless the whole screen follows the standard (D10) — so any screen
   touched for any reason gets cleaned up in full at that point.
3. **Cleans up the screens.** Round 1, by Sun 1 Nov, covers the screens
   reps use most, from the UAT usage analysis (D9). Each is photographed
   at phone, tablet and laptop width, the findings are ranked by what
   users would notice, and fixes go in one screen at a time. Every other
   screen is cleaned up when it is next changed (D13).

My Work, which is about to be built, follows the new rules from the start.

### On a phone

- Tables become one card per row on a phone, built by one shared part;
  on a tablet and laptop they stay tables.
- Pop-up forms (New Opportunity, Log Activity, New Stakeholder and the
  rest) fill the whole phone screen instead of a small box with a dimmed
  edge.
- Filters show their name above the box ("Zone"), with "All Zones" inside
  it; search boxes start with a magnifying glass and get an ✕ once typed
  in.
- Exact layout of each round 1 screen comes from the review findings and
  is shown to Basheer before it is built.

## 2. Build order

1. **Standard (Plan & Chore).** New section in
   `docs/Frontend-Implementation-Standards.md`; Basheer approves the
   wording. Docs only — nothing changes on Dev. **Done 2026-10-26:**
   §6.11 written (wording approved by Basheer), §6.6 rule 10 shortened
   to point to it.
2. **Today, 26 Oct (Build & Test, D17).** The automatic check plus the
   shared building blocks: colour set in the theme, text styles,
   full-screen pop-ups on a phone, the table-or-cards part, the zone
   filter style. The three D4 screens move onto them (whole file to
   §6.11) before their phone-fix commit; `phoneTable.ts` is deleted.
   Measured on Dev at 390 / 768 / 1280 px, round 1 pop-ups at 390 px.
3. **My Work** is built to §6.11 (D14), whenever its turn comes.
4. **Round 1 review (Plan & Chore with Build & Test).** Screenshots of
   the D9 screens at three widths; ranked findings shown to Basheer.
   Scope and time shown before it starts.
5. **Round 1 fixes (Build & Test), by Sun 1 Nov.** One screen per
   commit; one combined E2E for round 1 at the end (D15).
6. **Other screens** — cleaned up when next changed (D10, D13); no
   separate round.

Everything lands on Dev first and reaches UAT with the normal moves
(`docs/Deployment-Topology.md`).

## 3. What could be affected

No change to how data is fetched or saved — this plan changes only how
screens look. Steps 2 and 5 change shared parts used across the app
(every pop-up, every zone filter, every colour), so their E2E covers each
screen that uses them, found by a code search at that step.

## 4. Not in this plan (with reasons)

- Duplicate forms for other objects (the Opportunity edit copies were
  removed 1 Oct, `a430152`) — about how the code is organised, not
  how it looks; mixing them would make each screen's fix much bigger
  (D6). Stays Backlog "Front-end consistency audit".
- An automatic browser test at each width — D3.
- A round 2 — other screens are cleaned up when next changed (D13).

## 5. Business rules and records to update

- `docs/Frontend-Implementation-Standards.md`: new section (step 1);
  §6.5 status colours marked built (step 2); §6.6 rule 10 points to the
  new section instead of the hand-written phone CSS.
- Backlog: "MUI good practice…" points here; "Filters and search boxes"
  and the `statusColors.ts` line point here; "Front-end consistency
  audit" notes it stays separate.
- No business rules or ADR changes.

## 6. Technical addendum

- Phone switch: `useMediaQuery(theme.breakpoints.down("sm"))` in one
  shared component that renders `Table` on `sm` and up and a list of
  `Card`s below it; replaces `src/theme/phoneTable.ts`
  (`STACK_ON_PHONE`, `data-label`, `phone-hidden`, `phone-chevron`).
- Pop-ups: `FormModal.tsx` passes `fullScreen` when below `sm` (600 px —
  phones only; MUI's example uses `md`, 900 px, which would catch an
  upright tablet); the `maxWidth` prop keeps its meaning on wider
  screens. 16 files use `FormModal` (grep 2026-10-26). Five pop-ups use
  their own `Dialog` and don't change with it: AddHospitalModal's "No
  territory assigned yet", Customer 360's StakeholderOpportunitiesModal,
  Opportunity Detail's document viewer, LoginRemindersDialog,
  UrgentNotificationDialog — each decided in the review. Fields side by
  side inside a form are not changed by this; checked per form.
- Colours: palette entries in `src/theme/index.ts` plus
  `src/theme/statusColors.ts` (§6.5); screens use theme keys, not hex.
- Text sizes: theme `typography` variants instead of `fontSize` in `sx`.
- Check: a script beside `sales-os-app/scripts/check-no-tailwind.js`, run by
  `npm run lint` (so `.githooks/pre-commit` already calls it). Counts per
  file: hex colours in `.tsx`, `fontSize:` literals in `sx`, `className=`,
  and the retired phone classes; fails if any staged `.tsx` file has any
  (D10). Exact rules fixed in step 2.
- Zone filter: `ZonePicker` gains a filter style (name "Zone", "All
  Zones" inside); its 3 filter uses switch, its 5 form uses stay.
