<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# "Why this change?" and "First activity" Pop-ups Keep What the Rep Typed — Manual E2E Test Plan

**Covers:** two small fixes of the same kind, no separate plan documents.
- **Part A — "Why this change?" pop-up (the Opportunity Edit form's Save):** `2ee250c`,
  Haroon's request (Backlog, decided 17 Nov). When Save is refused, the pop-up keeps what
  the rep typed and shows it again on reopen. Its results were recorded only in
  `docs/Progress-Archive-2026-11.md` (18 Nov entry); they are carried into this plan
  as recorded, not re-run, apart from one new regression step (A12).
- **Part B — "First activity" pop-up (the New Opportunity form's Create):** Basheer's fix
  request, 24 Nov 2026. When Create is refused by the server or the screen, the pop-up keeps
  its six fields (type, date, what happened, next action, due date, owner) and shows them
  again when it reopens for the same form; what was typed replaces the pre-fill. Cleared when
  the Opportunity is created, when the form is closed, and when it opens afresh. A line under
  the error reads "Press Cancel, fix this on the New Opportunity form, then Create again —
  what you typed here is kept." It shows only when the server or the screen refused, not on a
  dropped connection or a server fault. Left out (decided, Basheer, 24 Nov): the pop-up's own
  checks (an empty box) do not keep the typing, as in `2ee250c`; Log Activity → Close Next
  Action is untouched.

**Not tested here (covered by the pre-E2E `/code-review medium`, 24 Nov):** the help line is
not shown when the Opportunity was already saved and a later step fails (e.g. marking a
Marketing Lead converted) — hard to trigger on Dev. Review fixes: that case, and an old help
line is cleared at the start of Create.

**Built:** Part A `2ee250c` (pushed 18 Nov). Part B `121216e` (pushed 24 Nov) —
`CloseReminderModal.tsx` and `QuickLeadModal.tsx`, frontend only.
**Where:** Dev. Basheer clicks, Claude watches (the steps save to the shared Dev DB).

## Checked against live data

Part A's records were chosen from a read-only Dev query on 18 Nov (recorded in the archive).
Part B and step A12 are not yet checked on Dev: a read-only check (announced to Basheer
first, all three RLS settings set and verified) is to be done before the run, for the lines
below.

- **Who sees:** n/a for the keep-typing behaviour (no visibility rule changes). To check:
  KIMS Hospital Trivandrum is visible to Basheer K; a convertible Marketing Lead exists for
  step B7.
- **Who can approve:** n/a — nothing here needs approval.
- **Who can save:** the pop-up's "Assign To" lists every user (read from
  `CloseReminderModal.tsx`); to check: Basheer K can create an Opportunity at KIMS Hospital
  Trivandrum.
- **Existing values:** step A12's record "zz Chance E2E – Customer 360" (Aster MIMS Calicut)
  is below Demo stage with no Demo Start Date (it must be, for the refusal); the name
  "zz First-activity keep E2E" is unused before step B1.

Button labels, messages and the order of checks are taken from the code,
not the design doc.

## Figures and sources

- Part A steps 1–11, their results, dates and Basheer's notes — `docs/Progress-Archive-2026-11.md`, "18 Nov 2026 — Build & Test: Why this change? keeps the typing…" (read 24 Nov). Steps 1–6 are the archive's one-line summary of them, not a fuller wording.
- "zz Chance E2E – Customer 360" (Aster MIMS Calicut), "zz E2E B4 follow-up call", "zz NA E2E – from hospital visit" (KIMS Hospital Trivandrum), "zz NA E2E – project" (Aster MIMS Calicut), "zz regression Lost" — same archive entry.
- Basheer K as the tester, and KIMS Hospital Trivandrum — same archive entry; Part B's use of them not re-checked on Dev yet.
- Part B request, scope and "left out" list — Basheer's fix request, 24 Nov 2026 (pasted in chat); the "pop-up's own checks" decision — Basheer, 24 Nov 2026.
- "Demo Start Date is required to advance to Demo stage." and its use at creation — `backend/app/domains/opportunity/validators.py` and `service.py:214` (read 24 Nov).
- "zz First-activity keep E2E", "zz First-activity keep E2E 2", "Showed the SonoScape demo unit", "Send the quote" — made-up examples (SonoScape is a brand Cabio sells).
- Help-line wording and button labels — taken from the code (`CloseReminderModal.tsx`, 24 Nov).
- 390, 768 and 1280 px — the phone-layout rule below.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; a step Claude drives in the browser
says so — `[Complex: Claude — <reason>]` — and only when it can't be judged
by eye (e.g. measuring whether something runs past its card), to save
usage credits (Basheer, 2026-10-29). Steps are grouped by login: switch
only when the next step needs a different person; a step whose result is
the same for any role runs as whoever is logged in (Basheer, 2026-11-18).
Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Phone:** this is a phone app (PWA). Every screen, card and pop-up the
feature adds or changes gets its own `[Complex: phone layout]` step: at
phone width, every row, arrow and tab opened, nothing runs past the card
and nothing looks squashed. A save-time check refuses a plan without at
least one. Basheer runs it at 390, 768 and 1280 px; nobody checks in a
browser before handover (Basheer, 2026-10-29), so this step is the first
look. Claude measures in the browser only if something looks off.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets, e.g. "usg m/c" (aster medicity). An Opportunity the
test creates has its hospital fixed in this plan, never "any hospital".
Part B creates **"zz First-activity keep E2E" (KIMS Hospital Trivandrum)**. Every step is
done as Basheer K.

**Result, 24 Nov 2026 (Basheer):** the 10 new steps (A12, B1–B8, C9) all Pass; Part A's
11 steps stand as recorded on 18 Nov. 0 Fail. Done as a time-boxed run: the read-only Dev
check of the records was skipped and Basheer picked them himself, so "Checked against live
data" above stays "not checked".

## Pre-flight

- P1. [Simple] Dev frontend confirmed running the latest code (both parts are frontend-only; confirm the app reloaded). — **Done** (Basheer, 24 Nov; the first steps ran on the new code)
- P2. [Simple] Signed in as Basheer K. — **Done** (Basheer, 24 Nov)

## A — "Why this change?" pop-up (`2ee250c`)

Steps 1–11: carried from the Progress-Archive, 18 Nov 2026; not re-run. Step A12 is new.

1–6. [Complex: multi-step] **Recorded summary:** a missing Demo Start Date is refused with the line shown; Cancel, fill, Save again keeps history and follow-up; the save lands; changing the status to Won drops only the follow-up; reopening the Edit form starts blank. — **Pass** (Basheer, 18 Nov; all six)
7. [Simple] Edit form, change nothing, Cancel — on "zz Chance E2E – Customer 360" (Aster MIMS Calicut). **Expected:** it closes normally. — **Pass** (Basheer, 18 Nov)
8. [Simple] New Opportunity form, fill the required fields, Create → "First activity" pop-up opens with a required next action; Cancel, Create again → empty; close the form without saving. Any hospital. **Expected:** as described. — **Pass** (Basheer, 18 Nov). *This was the pre-fix behaviour of the First activity pop-up; Part B changes it on purpose when Create is refused (see B8).*
9. [Simple] Edit form, change one plain field (no stage or status change), Save — on "zz Chance E2E – Customer 360" (Aster MIMS Calicut). **Expected:** saves and closes, no pop-up. — **Pass** (Basheer, 18 Nov). The step said to change "Value"; Basheer found Value cannot be typed on the Edit form (it comes only from the Products tab). Which field he changed instead was not recorded.
10. [Simple] My Work → Done on "zz E2E B4 follow-up call" — on "zz NA E2E – from hospital visit" (KIMS Hospital Trivandrum); add a follow-up, Complete. **Expected:** closing Activity saved and the follow-up appears. — **Pass** (Basheer, 18 Nov)
11. [Simple] Edit form, status → Lost with a Loss Reason, Save; in the pop-up type a history, leave the follow-up empty, Save — on "zz NA E2E – project" (Aster MIMS Calicut). **Expected:** saved as Lost, history Activity appears, no follow-up created; the person's own open next action is closed by that Activity (BR-OP-22). Permanent (Lost cannot be reopened, BR-OP-09). — **Pass** (Basheer, 18 Nov): the history Activity "zz regression Lost" appeared, no follow-up created; Basheer's own open next action "zz E2E E3 project follow-up" was closed by it, by design.
12. [Complex: multi-step] **New regression, 24 Nov — today's edit shares `CloseReminderModal.tsx` with this pop-up.** Edit form on "zz Chance E2E – Customer 360" (Aster MIMS Calicut): move it to Demo stage with Demo Start Date left empty → Save → in the "Why this change?" pop-up type a history → Save. **Expected:** the error "Demo Start Date is required to advance to Demo stage." with the line "Press Cancel, fill this in on the Edit form, then Save again — what you typed here is kept." Then Cancel → Save again. **Expected:** the pop-up shows what was typed. Close the Edit form without saving. — **Pass** (Basheer, 24 Nov). Which Opportunity he used was not recorded.

## B — "First activity" pop-up (this fix)

1. [Simple] "+ Lead" → fill the New Opportunity form (hospital KIMS Hospital Trivandrum, name "zz First-activity keep E2E", stage **Demo**, **Demo Start Date left empty**, other required fields as normal) → Create. **Expected:** the "First activity" pop-up opens with the boxes empty. — **Pass** (Basheer, 24 Nov)
2. [Simple] In the pop-up: type Visit, what happened "Showed the SonoScape demo unit", next action "Send the quote", a due date, Assign To someone other than the owner → Create. **Expected:** the error "Demo Start Date is required to advance to Demo stage." with the line "Press Cancel, fix this on the New Opportunity form, then Create again — what you typed here is kept." under it. — **Pass** (Basheer, 24 Nov)
3. [Simple] Cancel → Create again on the form. **Expected:** the pop-up shows all six fields exactly as typed in step 2. — **Pass** (Basheer, 24 Nov)
4. [Simple] Cancel → fill **Demo Start Date** on the form → Create → (pop-up shows the typed values) Create. **Expected:** "zz First-activity keep E2E" (KIMS Hospital Trivandrum) saves; its Activity tab shows the first activity and the next action as typed. — **Pass** (Basheer, 24 Nov)
5. [Simple] "+ Lead" again, fill the form (hospital KIMS Hospital Trivandrum, name "zz First-activity keep E2E 2"), Create. **Expected:** the pop-up boxes are empty (cleared after the success in step 4). — **Pass** (Basheer, 24 Nov)
6. [Simple] In that pop-up repeat step 2's typing and a refusal (stage Demo, no Demo Start Date) → Cancel → close the New Opportunity form → reopen "+ Lead", fill, Create. **Expected:** the pop-up boxes are empty (cleared on close). — **Pass** (Basheer, 24 Nov)
7. [Complex: cross-screen] Marketing Lead queue: convert a lead; the pop-up starts with the lead's note as "what happened". Edit the note, force a refusal as in step 2, Cancel, Create. **Expected:** your edited note, not the lead's. Needs a convertible Marketing Lead on Dev (checked read-only before the run). — **Pass** (Basheer, 24 Nov). The lead was not recorded as still in the queue afterwards; no Dev check was done before the run.
8. [Simple] Regression, as A8: form → Create → pop-up → Cancel with nothing refused → Create. **Expected:** the boxes are empty. — **Pass** (Basheer, 24 Nov)

## C — Phone layout

9. [Complex: phone layout] The "First activity" pop-up with the help line showing (as in B2), at 390, 768 and 1280 px. **Expected:** the error and the help line sit under the fields, nothing runs past the pop-up, and the line reads clearly. — **Pass** (Basheer, 24 Nov)
