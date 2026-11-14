<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Marketing Lead Discard Reason — Manual E2E Test Plan

**Covers:** one small fix, no implementation plan (Basheer's request of 13 Nov):
the Discard dialog on the Marketing Lead Review Queue drops the Reason
dropdown and asks for one required typed Reason. The decision is recorded in
`docs/Lead-Management-Implementation-Plan.md` section 4 ("Changed (Basheer,
2026-11-13)"); detail in `docs/Progress-Archive-2026-11.md`.
**Built:** `b4f6b42` (13 Nov; checkpoint commit — includes moving both lead
screens to the MUI standard, which the commit guard required) and `8a59b20`
(14 Nov, below). Both pushed 14 Nov.
**Added 14 Nov (Basheer, mid-E2E; built in `8a59b20`, no migration):** both
lead screens show a grey "Converted by <name>" / "Discarded by <name>" line, so
a Marketing User and the managers see who acted (it can differ from the
assigned rep). Server sends `reviewed_by_user`; helper
`marketingLeadReviewedByText`. Steps 6, 7 and 9 gained a check for it and step
10 is new; steps 6 and 7 passed before this and were re-looked at for the new
line only. `8a59b20` also moves the four pill colours to the identical theme
colours (the MUI guard required it).
**Where:** Dev.

## Checked against live data

Checked read-only on Dev, 13 Nov 2026, with all three RLS settings (user,
role, SBU) set and verified, impersonating the first active Admin in the user
list (Abdul Latheef P). Admin's SBU setting is empty by design; the check
showed role and user set. Dev's `alembic current` = 0065.

- **Who sees:** Admin sees all 11 marketing leads (3 New, 5 Converted, 3
  Discarded). The Review Queue shows the assigned rep their own New leads in
  the personal list; managers and Admin also see the rest in "Team Marketing
  Leads". Dev has two active Marketing Users: Marketing Test User and
  Marketing User.
- **Who can approve:** n/a — nothing in this fix is approved or rejected.
- **Who can save:** creating a lead needs Marketing User, Admin or General
  Manager (the New Marketing Lead pop-up). The "Assign To" picker offers every
  user in the chosen SBU except Admin, General Manager and Marketing User
  (read from `MarketingLeadCreateModal.tsx`), so with SBU Imaging it offers
  Basheer K (SBU Manager, Imaging — Dev query, 13 Nov), Shruthi (Area Manager),
  Fazal (Area Manager) and Rudrappa (Sales Staff). The assigned rep, their
  manager, or Admin/GM can discard. This plan assigns the test lead to
  Basheer K so he discards it as the assigned rep, from his own queue.
- **Existing values:** three leads were discarded on Dev before this fix and
  carry a category code. Named by the rep each is assigned to (the card's
  "Assigned to" line): Fazal's (Junk, "This guy is nuisanse"; discarded by
  Fazal), Vivek's (Duplicate, "I am already working on this opportunity with
  the hospital. It is already in demo stage."; discarded by Vivek) and a
  second one of Fazal's (Junk, "This is junk. We've got similar request
  before."; discarded by Haroon Sidheeq, not by Fazal). They must still read
  "Reason: Junk — …" and "Reason: Duplicate — …". (Corrected 14 Nov: this
  plan first named the third lead after its discarder, which made the card's
  "Assigned to Fazal" look wrong; Dev query 14 Nov confirmed the card is right.) The three New leads belong to other tests
  (rep reassignment, unviewed-by-SBU); this plan does not touch them.

Button labels, messages and the order of checks are taken from the code,
not the design doc.

## Figures and sources

- 11 marketing leads on Dev: 3 New, 5 Converted, 3 Discarded; alembic 0065 — Dev query, 13 Nov 2026.
- Two active Marketing Users (Marketing Test User, Marketing User) — Dev query, 13 Nov 2026.
- The three old discarded leads, their codes and notes — Dev query, 13 Nov 2026. Their assigned reps (Fazal, Vivek, Fazal) and discarders (Fazal, Vivek, Haroon Sidheeq) — Dev query, 14 Nov 2026, Admin, alembic 0065.
- Basheer K is SBU Manager in Imaging — Dev query, 13 Nov 2026 (as recorded in `docs/Small-Batch-12-Nov-Manual-E2E-Test-Plan.md`).
- Who "Assign To" offers (every user in the SBU except Admin, General Manager, Marketing User) — `MarketingLeadCreateModal.tsx` (`NON_REP_ROLES`, `repOptions`). Shruthi, Fazal, Rudrappa as Imaging users — Dev query, 13 Nov 2026 (their SBU shown as Imaging on the three New leads).
- Labels and messages ("Discard Marketing Lead", "Reason *", "Discard", "Reason is required", "Marketing Lead Review Queue", "Team Marketing Leads", "New Marketing Lead", "Assign To *", "Create") — `MarketingLeadDiscardModal.tsx`, `MarketingLeadReviewQueueScreen.tsx`, `MarketingLeadCreateModal.tsx`.
- The test leads' notes "Discard-reason test, 13 Nov" and "Discard-reason test 2, 13 Nov", and the typed reason "Test lead, not a real enquiry" — made-up examples.
- Source INDIAMART as a marketing source — Dev query, 13 Nov 2026 (the three New leads use it).

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; nobody drives a browser unless a step
says `[Complex: Claude — <reason>]`. Steps 1 and 5 save to Dev: Basheer
clicks, and the saved record is read back through the app in step 6.

**Phone:** the discard pop-up and the discarded-lead card on both screens get
a `[Complex: phone layout]` step (step 9) at 390, 768 and 1280 px. Nobody
checks in a browser before this run.

**Opportunities:** n/a — no Opportunity is named or created. A Discard never
creates one.

## Pre-flight

- P1. [Simple] Dev backend restarted since the discard fix (the server now
  needs a typed reason and refuses the old dropdown request; without a
  restart Dev runs the old code and step 5 behaves differently). — Pass (Basheer restarted it, 13 Nov).
- P2. [Simple] Dev frontend running and the page hard-refreshed, so the new
  pop-up is live. — Pass (Basheer ran step 1 on it, 13 Nov; refresh not confirmed in words). Both servers restarted again 14 Nov (Basheer), so P1 and P2 hold for this run.

## A — Discard pop-up

1. [Complex: save + two sign-ins] Sign in as Marketing Test User. Open
   **Marketing Leads**, create a lead (button opens "New Marketing Lead"):
   SBU **Imaging**, Lead Source **INDIAMART**, Note "Discard-reason test, 13
   Nov", **Assign To** Basheer K, press **Create**. Create a second one the
   same way with Note "Discard-reason test 2, 13 Nov". **Expected:** both
   leads appear on this screen with the NEW pill. (Saves two test leads on
   Dev; the first is discarded in step 5, the second is only opened in step
   9 and left alone.) — Pass (Basheer, 13 Nov).
2. [Simple] Sign in as Basheer K, open **Marketing Lead Review Queue**.
   **Expected:** the test lead is in the personal list with **Convert**,
   **Discard** and **Reassign** buttons. — Pass (Basheer, 14 Nov).
3. [Simple] Click **Discard**. **Expected:** a pop-up titled "Discard
   Marketing Lead <ref>" with **one** box labelled "Reason *" — no dropdown,
   no "Select reason", no box labelled "Note". — Pass (Basheer, 14 Nov).
4. [Simple] Click **Discard** with the box empty, then type only spaces and
   click **Discard** again. **Expected:** both times the pop-up stays open and
   shows "Reason is required"; the lead is still in the queue. — Pass (Basheer, 14 Nov).
5. [Simple] Type Test lead, not a real enquiry (without quote marks) and click **Discard**.
   **Expected:** the pop-up closes and the lead leaves the personal list. — Pass (Basheer, 14 Nov). Saved on Dev: "Discard-reason test, 13 Nov" is now DISCARDED.

## B — Where the reason shows

6. [Complex: second sign-in, read-back] Sign in as Marketing Test User, open
   **Marketing Leads**. **Expected:** the test lead card shows the red
   DISCARDED pill and a red line "Reason: Test lead, not a real enquiry" —
   the typed text only, with no category word and no dash in front of it.
   **Added 14 Nov:** under it a grey line "Discarded by Basheer K". —
   Pass (Basheer, 14 Nov): the Reason line and the "Discarded by" line both show. Note: the
   saved text has quote marks around it (Dev query 14 Nov) and the card shows
   them, reading Reason: "Test lead, not a real enquiry" (Basheer, 14 Nov);
   most likely typed from the plan's old quoted wording (a guess) — not an
   app fault either way, since the box saves exactly what is typed. Basheer
   confirmed the Marketing User created this test lead.
7. [Complex: cross-screen, old and new side by side] Sign in as Admin
   (Abdul Latheef P), open **Marketing Lead Review Queue**, scroll to **Team
   Marketing Leads**. **Expected:** the test lead reads "Reason: Test lead,
   not a real enquiry"; the old lead assigned to Fazal (discarded by Fazal)
   reads "Reason: Junk — This guy is nuisanse"; the one assigned to Vivek
   reads "Reason: Duplicate — I am already working on this opportunity…"; the
   other one assigned to Fazal (discarded by Haroon Sidheeq) reads "Reason:
   Junk — This is junk. We've got similar request before."
   **Added 14 Nov:** each card also shows a grey "Discarded by …" line: the
   test lead "Discarded by Basheer K"; the first Fazal lead "Discarded by
   Fazal"; Vivek's "Discarded by Vivek"; the second Fazal lead "Discarded by
   Haroon Sidheeq" (so a card assigned to Fazal visibly says Haroon discarded
   it). — Pass (Basheer, 14 Nov): Reason lines and "Discarded by" lines
   (names from Dev query 14 Nov). He first thought the third card's
   "Assigned to Fazal" was wrong; the query showed it is assigned to Fazal and
   discarded by Haroon Sidheeq, so the card is right and this plan's earlier
   wording was not.
8. [Simple] Still as Admin: the test lead has no Convert, Discard or
   Reassign buttons (it is already reviewed). — Pass (Basheer, 14 Nov).

## C — Phone layout

9. [Complex: phone layout] At 390, 768 and 1280 px: (a) as Basheer K, open
   the Discard pop-up on the second test lead ("Discard-reason test 2") and
   close it without saving;
   (b) as Admin, look at the Team Marketing Leads discarded cards (the three
   old ones and the test lead); (c) as Marketing Test User, look at the whole
   **Marketing Leads** screen (the screen's colours and text sizes were moved
   to the theme in the same commit, so also check the card look). **Expected:**
   the pop-up fits the screen with "Reason *" and the buttons visible; every
   "Reason: …" line wraps inside its card, nothing runs past the card edge or
   off the screen; the grey ref tag, the coloured status pill, the heading and
   the card text look as they did before (same colours, same sizes). The new
   grey "Discarded by …" / "Converted by …" line also wraps inside its card
   and is the same grey and size as the "Assigned to" line above it. — Pass (Basheer, 14 Nov).
10. [Simple] **Added 14 Nov.** As Marketing Test User on **Marketing Leads**
    (or Admin on Team Marketing Leads), find a lead with the green CONVERTED
    pill. **Expected:** a grey line "Converted by <name>" under it; the name is
    the person who converted it (check against what you know; Dev has 5
    converted leads — Dev query 13 Nov). A NEW lead shows no such line. — Pass (Basheer, 14 Nov).

## Sign-off

Run by: Basheer (Claude read-only Dev queries) — Date: 14 Nov 2026 — Result:
12 of 12 Pass (P1, P2, steps 1–10). Mid-E2E additions built and reviewed
before steps 6, 7, 9 and 10: "Converted by / Discarded by" lines on both lead
screens. Code and this plan uncommitted at sign-off; the `fix:` commit
follows.
