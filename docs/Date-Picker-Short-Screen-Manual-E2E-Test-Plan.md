<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Date Picker on Short Screens — Manual E2E Test Plan

**Covers:** `docs/Backlog.md` "Date picker cut off on short laptop screens" (Haroon,
26 Nov 2026). Fix approved by Basheer, 26 Nov 2026; cut-off raised from 760 to 820
pixels after the code review (Basheer, 26 Nov 2026).
**Built:** not committed yet.
**Where:** Dev only. Nothing is saved: close each window without pressing Log,
Complete or Close next action.

## Checked against live data

No database check was run: nothing is saved and the result doesn't depend on the
record or the login.

- **Who sees:** n/a — no visibility change
- **Who can approve:** n/a — no approval
- **Who can save:** n/a — nothing is saved
- **Existing values:** n/a — any open next action will do

Button labels, messages and the order of checks are taken from the code,
not the design doc.

## Figures and sources

- 820 pixel cut-off — `sales-os-app/src/utils/datePicker.ts`; estimate from the date
  library's view height (336 pixels) plus its buttons, twice, plus the field; not
  measured in a browser (code review, 26 Nov 2026)
- 660 pixel header cut-off — `sales-os-app/src/utils/datePicker.ts`; estimate from the
  centred box's height (587 pixels, measured by Claude in Chrome on Dev, 26 Nov 2026)
  plus its margins
- 390, 768 and 1280 pixel widths — the project's phone, tablet and laptop widths
  (`cabio-e2e-testing` skill)
- 1788 passed, 10 skipped, ruff, tsc and lint results — run on this computer,
  26 Nov 2026
- Month 02 with day 31 — made-up example of an impossible date
- Report of the problem — Haroon via Basheer, 26 Nov 2026

**Tags:** every step starts with `[Simple]` or `[Complex: <reason>]`; Basheer runs
all of them. Any login (the result doesn't depend on who it is).

**Phone:** step 8.

**Heights:** "screen area" is the visible part of the browser where the app shows.
Below 820 pixels the date box opens in the centre; at 820 or more it opens attached
to its field. Below 660 pixels the centred box also has no large date-and-time
header at its top (added 26 Nov after the scrolling finding; Basheer approved, by
height only on any device): it starts at the calendar and clock tabs, and AM/PM is
chosen in the clock tab.

## Pre-flight

- P1. [Simple] Dev backend restart — not needed: no server or database change.
  Checks on 26 Nov 2026: pytest 1788 passed / 10 skipped, ruff clean, tsc clean,
  lint 0 errors. Pass (26 Nov, nothing to restart)
- P2. [Simple] Dev screens running, any user signed in. Pass (26 Nov)

## A — Short and tall windows (as whoever is logged in)

1. [Simple] Drag the browser window short (about two-thirds of the screen). Open an
   open next action's "Close Next Action" window, "Details" tab, and open "Date &
   Time". **Expected:** a centred box; the whole month shows; a date and a time can
   be picked and confirmed with OK. Pass (26 Nov, Basheer, temporary switch on, with
   the header change)
2. [Simple] Same window, "Follow-up" tab, open "Due Date". **Expected:** as step 1.
   Pass (26 Nov, Basheer, with the temporary switch that ignores the mouse check;
   before it, the attached box was cut off). Re-run after the header change: Pass
   (26 Nov, Basheer, temporary switch on).
3. [Simple] Same window size: open "Log Activity" where you have no open next action
   of your own (otherwise its "Next Action" tab is hidden). "Details" tab, open
   "Date & Time". **Expected:** as step 1. Pass (26 Nov, Basheer, temporary switch on)
4. [Simple] Same window, "Next Action" tab, open "Next Action Due Date".
   **Expected:** as step 1. Pass (26 Nov, Basheer, temporary switch on)
5. [Simple] Make the window much shorter (about half the screen) and open one date
   box. **Expected:** OK is visible; report if you have to scroll to reach it. —
   Finding (26 Nov, Basheer, during the short-window steps, temporary switch on):
   the centred box has to be scrolled to reach Cancel and Next.
6. [Simple] Maximise the window on a large or zoomed-out screen (Ctrl and minus)
   and open one date box in each window. **Expected:** attached to its field, as
   before, nothing cut off. —
7. [Complex: finds an older problem] In one date box, type a month or day that
   doesn't exist (month 02 with day 31). **Report:** what the field shows and any
   message. —
8. [Complex: phone layout] At 390, 768 and 1280 pixels wide, open one date box in
   each window. **Expected:** the whole box is on screen and a date can be picked. —
