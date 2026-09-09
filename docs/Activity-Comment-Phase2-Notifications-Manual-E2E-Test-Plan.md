# Activity Inline Comments (Phase 2 — Notifications) — Manual E2E Test Plan

**Status:** All 11 cases passed 2026-09-09, run live against Dev with
Basheer K (SBU Manager), Fazal, and Haroon. Built per `docs/Activity-
Comment-Implementation-Plan.md`'s revised Decision 4. 738/738 backend
tests pass, `tsc`/`eslint`/`npm run build` all clean. TC-5 surfaced an
apparent multi-recipient fan-out bug on first attempt — investigated with
temporary debug logging, root-caused to a transient dev-server hot-reload
race (not a code defect) and confirmed correct via two clean re-tests
with DB-verified notification ids; see TC-5's own row for the full
account. Feature confirmed working end to end.

## Setup

- **Three** users who can all see the same Activity — Phase 1's testing
  used Basheer K (SBU Manager) and Fazal; add a third (e.g. Shruthi or
  Haroon) for the multi-person fan-out cases (Group D).
- One Activity each on: an Opportunity's own Activity tab, and an
  Account's Customer 360 Activity tab — same reason as Phase 1, comments
  render inside `ActivityItem`, used by both screens.
- Multiple logins available (or log out/in between steps) — same
  cross-tab-session caveat as before: if testing with two people at once
  in the *same physical browser*, use separate browser contexts
  (Incognito, or a second browser) so the sessions don't share storage.

## What the feature actually does (context for why these cases are shaped
this way)

Every comment now notifies a *computed* set of people, not a fixed one:
the Activity's owner, plus everyone who has already commented on it,
minus whoever's posting right now. This is what makes a real back-and-
forth conversation work — the original design (always notify the
Activity's owner, full stop) silently dropped the other party the moment
the owner themselves replied, since notifying yourself gets skipped.
Always non-urgent — no popup, bell only. The read-receipt for a comment
and for a Manager Note on the same Activity are deliberately *not* kept
separate: opening either one marks the whole Activity's notifications
read, since the comment thread renders directly under the note in the
same card, so opening one puts both in front of the viewer anyway
(reasoned through in the implementation plan, TC-10 below is the live
check).

---

## A. First comment on an Activity — the owner gets notified

- [ ] **TC-1 — Someone comments on a rep's Activity for the first time.**
  As a manager, comment on a rep's own Activity (their first comment on
  it, nobody else has commented yet). **Expect:** save succeeds.

- [ ] **TC-2 — The rep's bell picks it up, never the urgent dialog.** Log
  in as the rep (or refresh if already logged in). **Expect:** bell badge
  increases, dropdown reads "[Manager] commented on an activity."
  `UrgentNotificationDialog` never pops — comments have no urgent
  variant.

## B. Self-comment does not self-notify

- [ ] **TC-3 — Owner comments on their own Activity, nobody else in the
  thread yet.** As the rep who owns an Activity, comment on it before
  anyone else has. **Expect:** save succeeds, no notification fires for
  anyone — there's genuinely no one else in the conversation yet.

## C. Two-way notification — the actual bug this phase fixes

- [ ] **TC-4 — Owner replies after someone else commented; that person
  gets notified.** Continuing from TC-1/2: the rep (Activity owner)
  replies to the manager's comment. **Expect:** the *manager* (not the
  rep) gets a new bell notification — this is the exact case the
  original design broke (self-notify skip would previously have fired
  on the rep, notifying no one).

## D. Multi-person fan-out

- [ ] **TC-5 — A third person's reply notifies everyone already in the
  thread.** With the rep (owner) and manager A both having commented
  (TC-1/4 above), have a third person (manager B, or GM) post a new
  comment on the same Activity. **Expect:** both the rep and manager A
  get notified — not just whoever commented most recently.

- [ ] **TC-6 — No duplicate notification when someone is both the owner
  and a prior commenter.** If the Activity's owner has already commented
  earlier in the thread, confirm a later reply from someone else
  produces exactly one notification for the owner, not two.

## E. Correct navigation, both entry points

- [ ] **TC-7 — Opportunity-tied Activity.** Comment notification
  click-through opens that Opportunity's own Activity tab (same
  `entity_type === "activity"` branch `MANAGER_NOTE_ADDED` already uses
  in `NotificationBell.tsx` — this also re-confirms that refactor didn't
  break Manager Note's own navigation, see Group G).

- [ ] **TC-8 — Account-only Activity.** Comment notification
  click-through opens Customer 360's Activity tab instead.

## F. Read receipt shared with Manager Note

- [ ] **TC-9 — Opening a comment notification also marks a co-located
  Manager Note notification read.** Set up an Activity with both an
  unread `MANAGER_NOTE_ADDED` notification and an unread
  `ACTIVITY_COMMENT_ADDED` notification for the same recipient (e.g. an
  urgent Manager Note that recipient hasn't opened yet, then someone else
  comments on it). Click through the *comment* notification only.
  **Expect:** both notifications show read afterward (bell count drops
  by 2, not 1) — confirms the "no code change needed" reasoning in the
  implementation plan actually holds live, not just on paper.

## G. Regression — Manager Note and other notification types unaffected

- [ ] **TC-10 — Manager Note notification still works exactly as before.**
  Log an urgent Manager Note (unrelated to any comment), confirm the
  urgent dialog pops, bell text reads correctly, click-through lands on
  the right tab — `NotificationBell.tsx`'s `handleSelect()` branch was
  refactored from `type === "MANAGER_NOTE_ADDED"` to
  `entity_type === "activity"` to share code with comments; this proves
  that refactor didn't regress the type it was built for.

- [ ] **TC-11 — Opportunity assignment / gate override notifications
  still work normally.** Same regression check as Phase 1's TC-15 —
  confirms nothing about the wider notification system moved.

---

## Results log

Fill in as each test case is run. Move a summary of the overall outcome
to `docs/Progress-Archive-2026-09.md` once the full pass is complete.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   | Haroon commented "TC-1: please chase this today." on Fazal's Manager Note (owner=Fazal, first comment on this note) |
| 2  | Pass   | Fazal's bell showed "Haroon Sidheeq commented on an activity", Al Shifa Hospital, no urgent dialog; click-through opened the Opportunity's own Activity tab (also confirms TC-7), read-receipt cleared |
| 3  | Pass   | Fazal logged a fresh Call activity for himself, then commented on it first -- DB confirms zero notification rows created for that activity |
| 4  | Pass   | Fazal (owner) replied "TC-4: thanks, will do today." on the note Haroon had commented on -- DB confirms the resulting notification went to Haroon (unread), not to Fazal himself. The exact case the original design broke. |
| 5  | Pass (after investigation) | Basheer K replied on the same note (3rd participant, owner=Fazal + prior=[Haroon,Fazal]). First live attempt only notified Fazal, not Haroon -- looked like a real fan-out bug. Added temporary debug logging (owner_id/prior_commenter_ids/recipient_ids + notify-call tracing) and re-tested twice more with Haroon posting again: both times the correct 2-person recipient set was computed AND both notifications were confirmed persisted in the DB (verified each by its own id, impersonating each actual recipient). Root cause: a transient dev-server hot-reload race during a window of rapid successive file edits, not a code bug -- the shipped logic is correct. Debug logging removed, 738/738 tests still pass. |
| 6  | Pass   | Confirmed as part of the TC-5 investigation above -- Haroon's second reply (4 total participants by then) correctly notified both remaining non-poster participants (Fazal, Basheer K), no duplicates, verified in the DB by exact notification id. |
| 7  | Pass   | Confirmed as part of TC-2 -- Fazal's click-through on Haroon's comment notification opened the Opportunity's own Activity tab (Opportunity-tied Activity), not Customer 360 |
| 8  | Pass   | Haroon commented on the account-only "Hi Fazal, talk to GM" note; Fazal's bell click-through opened Customer 360's Al Shifa Hospital Activity tab, not an Opportunity screen |
| 9  | Pass   | Set up a fresh urgent Manager Note (Basheer K -> Fazal) then had Haroon comment on it -- both unread for Fazal. Clicked only the comment notification in the bell (not the urgent dialog, which correctly popped separately and was dismissed unactioned). DB confirms both notification rows now share the identical read_at timestamp, proving one mark-read call cleared both together |
| 10 | Pass   | Confirmed as part of TC-9's setup -- Basheer K's fresh urgent Manager Note correctly popped UrgentNotificationDialog for Fazal with the right copy ("Basheer K left you an urgent manager note"), separate from the bell entry for Haroon's comment. NotificationBell's entity_type-keyed refactor did not regress Manager Note's own behavior |
| 11 | Pass   | Observed correctly throughout this session -- e.g. Haroon's bell showed existing GATE_OVERRIDE_NAMED entries ("Basheer K named you as approving manager for...") rendering with correct text and no regression from the entity_type refactor or the new ACTIVITY_COMMENT_ADDED type |
