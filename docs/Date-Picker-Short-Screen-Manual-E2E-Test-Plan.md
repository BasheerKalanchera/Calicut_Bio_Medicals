<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Date Picker on Short Screens — Manual E2E Test Plan

**Covers:** date picker cut off on short laptop screens, Close Next Action and Log
Activity windows (Haroon, 26 Nov 2026;
[photo](screenshots/2026-11-26-date-picker-cut-off.jpeg)). Fix approved by Basheer,
26 Nov 2026; cut-off raised from 760 to 820 pixels after the code review (Basheer,
26 Nov 2026); replaced on 27 Nov (see "Design change" below).
**Built:** `ba67000` (27 Nov 2026).
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

- 820 pixel cut-off (the first design, used up to step 6; removed 27 Nov 2026) — code
  review, 26 Nov 2026; an estimate, never measured
- 660 pixel header cut-off (removed 27 Nov 2026) — an estimate from the centred box's
  height with its header (587 pixels, measured by Claude in Chrome on Dev,
  26 Nov 2026) plus its margins
- 390, 768 and 1280 pixel widths — the project's phone, tablet and laptop widths
  (`cabio-e2e-testing` skill)
- 1788 passed, 10 skipped, ruff, tsc and lint results — run on this computer,
  26 Nov 2026; run again after the 27 Nov change, same counts, 134 lint warnings
- Month 02 with day 31 — made-up example of an impossible date
- Report of the problem — Haroon via Basheer, 26 Nov 2026

**Tags:** every step starts with `[Simple]` or `[Complex: <reason>]`; Basheer runs
all of them. Any login (the result doesn't depend on who it is).

**Phone:** step 8.

**Design change, 27 Nov (Basheer):** the date box now opens in the centre on every
device and at every screen size. The 820 pixel cut-off, the mouse check and the
temporary test switch are gone. Steps 1–4 and 6 were run before this change, with
the switch on; steps 1a and 6a re-check it.

**Header:** since 27 Nov (second change, Basheer, during step 8) the centred box
has no large date-and-time header on any screen: it starts at the calendar and
clock tabs, and AM/PM is chosen in the clock tab. Before that it was hidden only
below a 660 pixel screen height; steps run earlier saw the header on taller screens
("screen area" is the visible part of the browser where the app shows). Step 6b
re-checks.

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
1a. [Simple] Added 27 Nov, after the design change: short window, "Close Next
   Action" window, "Details" tab, open "Date & Time". **Expected:** as step 1. Pass
   (27 Nov, Basheer)
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
   the centred box has to be scrolled to reach Cancel and Next. Re-run 27 Nov after
   the header and design changes: Pass (Basheer)
6. [Simple] Maximise the window on a large or zoomed-out screen (Ctrl and minus)
   and open one date box in each window. **Expected:** attached to its field, as
   before, nothing cut off. Pass (27 Nov, Basheer, temporary switch on; replaced by
   step 6a)
6a. [Simple] Added 27 Nov: maximise the window and open all four date boxes ("Close
   Next Action": "Details" and "Follow-up"; "Log Activity": "Details" and "Next
   Action"). **Expected:** each opens in the centre with its date-and-time header (if
   the screen area is 660 pixels or taller), nothing cut off; a date and time can be
   picked and confirmed with OK. Pass (27 Nov, Basheer)
6b. [Simple] Added 27 Nov, after the header change: maximise the window and open
   all four date boxes, as in step 6a. **Expected:** no large header; the box starts
   at the calendar and clock tabs; a date, a time and AM/PM can be picked and
   confirmed with OK. Pass (27 Nov, Basheer)
7. [Complex: finds an older problem] In one date box, type a month or day that
   doesn't exist (month 02 with day 31). **Report:** what the field shows and any
   message. Pass (27 Nov, Basheer): typing in the field doesn't open the centred box,
   and the field doesn't accept the impossible date
8. [Complex: phone layout] At 390, 768 and 1280 pixels wide, open one date box in
   each window. **Expected:** the whole box is on screen and a date can be picked.
   Pass (27 Nov, Basheer, with the header hidden)

**Result:** 13 of 13 passed (27 Nov 2026).
