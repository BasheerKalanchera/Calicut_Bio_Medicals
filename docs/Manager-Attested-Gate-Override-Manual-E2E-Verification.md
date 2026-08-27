# Manager-Attested Gate Override (BR-OP-14) — Manual E2E Verification

**Status:** Complete, 2026-08-27. All 22 cases run against Dev (as Fahad/
Fazal), logged in the Results log below. 20 Pass, 2 Skipped (TC-13: not
representative of real usage; TC-15: no live test user matches that data
shape). No open issues found during this pass — see the Results log's notes
column for how TC-14/16 (API-level) and TC-19/21/22 (audit stamp +
notification) were verified.

**Prepared:** 2026-08-25. **Revised:** 2026-08-26 — original checklist
assumed the override box auto-appeared from Stage + blank date. That design
was rejected during manual E2E (it showed the override on every opportunity
reaching Demo stage, override intended or not) and replaced with an explicit
checkbox as the sole trigger. This revision reflects that design and adds a
dedicated section (A) to regression-test the trigger mechanism itself, since
that's exactly what broke last time. **Revised again 2026-08-27** — the
checkbox label is now **"Fast-Track this Deal"** (reads as an action for
the rep rather than a compliance notice; the Approver field's helper text
still states the manager-approval requirement), and the redundant second
banner that used to repeat inside the revealed box once checked has been
removed. **Also added 2026-08-27:** the named approver now gets a one-time,
non-urgent bell-icon notification, plus a fix so the audit stamp
(`gate_override_set_at`/`set_by`) and that notification only fire on a
genuine new approver assignment, not on every later edit — see TC-19/21/22.
**Also fixed 2026-08-27 (see TC-6):** unchecking the override while sitting
at a gated stage with the required date still blank used to silently
succeed instead of re-blocking the save — Implementation Plan step 15.

## Setup

- A Sales Staff rep (**R**) whose `manager_id` points to an Area Manager
  (**M**). Live Dev data: **Fahad** (R) → **Fazal** (M, Area Manager,
  active) — use this pair so the Approver picker has a real
  immediate-manager option to show, not just the GM escalation path.
- A second active General Manager (**G**) who is *not* R's manager — for
  the escalation-path tests. Live Dev data: **Haroon Sidheeq**.
- Browser DevTools (Network tab) for the API-level checks in section D.

## What the feature actually does (context for why these test cases are
shaped this way)

An explicit **"Fast-Track this Deal" checkbox** on the Opportunity form
is the sole trigger — not Stage, not whether a date field happens to be
blank.

- **Unchecked (default, every normal opportunity):** no override UI is
  shown at all. `BR-OP-01`'s gates apply exactly as if this feature didn't
  exist — Demo Date is required to reach Demo, Expected Closure Date is
  required to reach Negotiation.
- **Checked:** reveals Approver / Reason / Note. Demo Start Date and Demo
  End Date disappear immediately, regardless of Stage — a skipped demo is
  never relevant at any stage. Expected Closure Date behaves differently:
  it stays visible (optional, never mandatory) while Stage = Negotiation,
  since it's still meaningful to forecast a closure date even without a
  demo — and disappears only once Stage = Order or beyond.
- There is no role restriction on who can *check the box* — `_validate_gate_override`
  checks only the named approver's identity/role, never the creator's/editor's
  role — so a Sales Staff rep can create a brand-new Opportunity straight
  into Negotiation or Order, not just edit an existing one into that state.

The primary real-world scenario (a referral that declines a demo outright)
never puts the Opportunity into Demo or Clinical Evaluation stage at all —
the rep checks the box and jumps it directly from Qualified straight to
Negotiation (or further) in one move.

---

## A. Checkbox as sole trigger — regression check

This section exists specifically to catch the bug found in the original
build: the override UI appearing automatically instead of on deliberate
opt-in. Run this section first, before anything else.

- [ ] **TC-1 — Normal Demo-stage entry, checkbox untouched.** Create an
  Opportunity, set Stage = Demo, leave Demo Start Date blank, do **not**
  check "Fast-Track this Deal".
  **Expect:** save is blocked with "Demo Start Date is required to advance
  to Demo stage." No override UI ever appears — confirms the auto-trigger
  bug is gone.

- [ ] **TC-2 — Normal Negotiation-stage entry, checkbox untouched.** Set
  Stage = Negotiation, leave Expected Closure Date blank, checkbox
  unchecked.
  **Expect:** blocked with "Expected Closure Date is required..." — same
  as TC-1, confirms the second gate isn't silently bypassed either.

- [ ] **TC-3 — Checking the box reveals the right fields and hides Demo
  Date immediately.** Check "Fast-Track this Deal" at any Stage (e.g.
  still at Qualified).
  **Expect:** Approver, Reason, and Note fields appear. Demo Start Date and
  Demo End Date disappear from the form immediately — even though Stage
  hasn't reached Demo yet.

- [ ] **TC-4 — Expected Closure Date stays visible and optional at
  Negotiation.** With the box checked, set Stage = Negotiation.
  **Expect:** Expected Closure Date field is still shown. Leave it blank
  and confirm the form does not block on it (it's optional here, not
  hidden, not mandatory).

- [ ] **TC-5 — Expected Closure Date disappears at Order.** Continuing from
  TC-4, change Stage to Order.
  **Expect:** Expected Closure Date field disappears once Stage = Order.

- [ ] **TC-6 — Unchecking before save reverts everything.** With the box
  checked and Approver/Reason filled in (from TC-3-5), uncheck "Fast-Track
  this Deal" before saving.
  **Expect:** Approver/Reason/Note disappear. Demo Date and/or Expected
  Closure Date fields reappear per the normal Stage rules (i.e. whichever
  ones the current Stage would normally require). Attempting to save
  without them now blocks again, same as TC-1/TC-2.
  **Bug found and fixed 2026-08-27 (Implementation Plan step 15):** stage
  gates only fire on a forward stage move (`validators.py`'s
  `validate_stage_transition`), so a save that only unchecks the override
  (Stage unchanged) used to sail through even with the required date still
  blank — silently erasing the one signal (the named approver) that a
  shortcut was ever taken, while keeping its effect. Fixed by re-checking
  the current stage's gates as if arriving there fresh whenever a save
  clears the override. Covered by 3 new backend tests, but this is exactly
  the kind of thing that needs confirming live, not just under the mocked
  test suite — don't skip this case.

## B. Create straight into Negotiation/Order (the primary scenario)

- [ ] **TC-7 — Create at Negotiation via QuickLeadModal, as R.** Fill
  Name/Account/Owner=R, check "Fast-Track this Deal", Stage = Negotiation directly,
  Lead Source + Indicative Value + at least one product (Qualified gate
  still applies). Approver picker: confirm **Fazal (M) appears in the
  list** alongside the GM escalation option. Select Approver = M, pick a
  Reason, leave Expected Closure Date blank, save.
  **Expect:** creates successfully, lands at Negotiation stage.

- [ ] **TC-8 — Same, but Approver = G (escalation, not R's manager).**
  **Expect:** succeeds — confirms GM escalation needs no reporting-line
  match, and that G still appears in the list alongside M.

- [ ] **TC-9 — Create at Negotiation, repeat via Customer 360's create form
  and Project Directory's create form.**
  **Expect:** same result in both places, including the checkbox behavior
  from section A and the Approver list fix — confirms parity across entry
  points, not just QuickLeadModal.

- [ ] **TC-10 — Push further: create directly at Order stage** (skip
  Negotiation too) with the box checked.
  **Expect:** Demo Date fields and Expected Closure Date are all hidden
  (per TC-5's rule, since target Stage is Order) — but Order Value and
  Product Details are still required (Negotiation→Order gate is untouched
  by BR-OP-14) — you must supply items/value to get this far, override or
  not.

## C. Edit path — existing Opportunity jumping stages

- [ ] **TC-11 — Edit an existing Qualified-stage Opportunity, jump its
  Stage straight to Negotiation** (not stopping at Demo) via Opportunity
  Detail's Edit modal. Check "Fast-Track this Deal", fill
  Approver+Reason.
  **Expect:** Demo Date fields hidden immediately on check; Expected
  Closure Date visible/optional at Negotiation; save succeeds.

- [ ] **TC-12 — Repeat TC-11 via Customer 360's edit form and Project
  Directory's edit form.**
  **Expect:** consistent behavior across all three edit surfaces.

- [ ] **TC-13 — Isolate a single gate (optional, narrower check):** edit an
  Opportunity from Qualified to Demo *only* (not past it), box checked.
  **Expect:** Demo Date hidden and not required — confirms the Demo Date
  waiver works independent of Negotiation ever being reached.

## D. Approver validation — security-relevant, test via API directly

The UI picker only ever offers valid choices (R's manager + all GMs), so
these confirm the *server* actually enforces the rule, not just the form.
Use DevTools Network tab or a REST client against
`PATCH /api/v1/opportunities/{id}` or `POST /accounts/{id}/opportunities`.

- [ ] **TC-14 — Random approver** (not R's manager, not any GM). Send
  `gate_override_approver_id` = some unrelated Sales Staff user's id, with
  a valid reason id.
  **Expect:** `403` — "Gate override approver must be the opportunity
  owner's immediate manager, or a General Manager."

- [ ] **TC-15 — Correct manager relationship but wrong role** (if you have
  a test user who is R's `manager_id` but doesn't actually hold the Area
  Manager role — e.g. was reassigned).
  **Expect:** `403` — "...must hold the Area Manager role."

- [ ] **TC-16 — Reason omitted, approver set.** Via API, send
  `gate_override_approver_id` with no `gate_override_reason_id`.
  **Expect:** `422` validation error — "Gate override reason is required
  whenever an approver is set." Also confirm the same thing is blocked
  *client-side*: check "Fast-Track this Deal" in the UI, fill Approver,
  leave Reason blank, attempt to save — it should never reach the server.

## E. Clearing an override

- [ ] **TC-17 — Reopen an Opportunity with an override already set,
  uncheck "Fast-Track this Deal", save.**
  **Expect:** the checkbox loads pre-checked on open (state is derived from
  `gate_override_approver_id` being non-null). Unchecking and saving clears
  `gate_override_approver_id`/`reason_id`/`note` all together — not just
  hides them client-side. Then try re-advancing its stage without a
  demo/closure date — should now correctly block again (gate re-enforced
  once the override is gone).

## F. Display & audit

- [ ] **TC-18 — Overview tab read-only display.** After TC-7/TC-11, confirm
  Opportunity Detail's Overview shows "Gate Override Approved By," "Reason,"
  and Note (if set).

- [ ] **TC-19 — Audit stamping, and no re-stamp on an unrelated edit.** In
  DevTools, inspect the save response for `gate_override_set_at`/
  `gate_override_set_by` — populated only on the save that *sets* the
  approver. Then make an unrelated edit (e.g. rename the deal) and save
  again. **Expect:** those two fields stay unchanged (not re-stamped) —
  this regression-tests the 2026-08-27 fix (previously, the frontend
  resending the same approver on every save caused a silent re-stamp on
  every edit, not just the one that actually set it).

- [ ] **TC-20 — Master data.** With the checkbox checked, confirm the
  Reason dropdown lists exactly the 3 seeded values: "Customer declined
  demo," "Deal closed outside normal process, entered after the fact,"
  "Other — see notes."

- [ ] **TC-21 — Approver gets a one-time awareness notification.** As R,
  create or edit an Opportunity, check "Fast-Track this Deal", set
  Approver = M (Fazal), save. Log in as M (or check M's bell icon).
  **Expect:** a new, non-urgent notification reading something like
  "[R] named you as approving manager for [Opportunity]." It must **not**
  pop the interrupting `UrgentNotificationDialog` — bell badge only.

- [ ] **TC-22 — Notification does not repeat on an unrelated edit.**
  Continuing from TC-21, as R, make an unrelated edit to the same
  Opportunity (e.g. rename it) and save, leaving the approver untouched.
  **Expect:** no second notification appears for M — ties to TC-19's fix;
  the notification fires only when the approver value actually changes,
  not on every save.

---

## Results log

Fill in as each test case is run — pass/fail plus any notes (unexpected
behavior, UI issue, etc.). Move a summary of the overall outcome to
`docs/Progress-Archive-2026-08.md` once the full pass is complete, per this
project's session-handoff convention.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   |       |
| 2  | Pass   |       |
| 3  | Pass   |       |
| 4  | Pass   |       |
| 5  | Pass   |       |
| 6  | Pass   | Confirms the 2026-08-27 fix — uncheck now correctly re-blocks the save. |
| 7  | Pass   |       |
| 8  | Pass   |       |
| 9  | Pass   |       |
| 10 | Pass   |       |
| 11 | Pass   |       |
| 12 | Pass   |       |
| 13 | Skipped | Not representative of real usage — see TC-13 discussion above. |
| 14 | Pass   | Live API check as Fahad: 403 "Gate override approver must be the opportunity owner's immediate manager, or a General Manager." |
| 15 | Skipped | No live test user matches this data shape (manager_id set but role isn't Area Manager) — synthetic scenario, not present in current data. |
| 16 | Pass   | Live API check: 422 "Gate override reason is required whenever an approver is set." Rejected before reaching the DB. |
| 17 | Pass   | Live UI test (Opportunity "Test Gate override oppotunity"): checkbox loaded pre-checked; unchecking + save with Demo Start Date still blank was correctly BLOCKED with "Demo Start Date is required to advance to Demo stage." (confirms the step-15 fix live); filled in a date, saved successfully; confirmed via API that gate_override_approver_id/reason_id/note were all null afterward, not just hidden client-side. |
| 18 | Pass   | Confirmed incidentally during TC-17: Overview tab showed "Gate Override Approved By: Fazal" / "Reason: Customer declined demo" before the override was cleared. |
| 19 | Pass   | Live API test as Fahad on a fresh override-set: `gate_override_set_at` populated at 13:00:31 on the setting save. An immediately following unrelated rename save kept `gate_override_set_at`/`set_by` byte-identical — confirmed via response body, not just eyeballing the UI. |
| 20 | Pass   | Reason dropdown data confirmed via the `/master-data/gate-override-reasons` API response (used live in TC-14/16) and visually in the TC-17 screenshots: exactly 3 values — "Customer declined demo," "Deal closed outside normal process, entered after the fact," "Other — see notes." |
| 21 | Pass   | DB-level check (admin connection, since Fazal wasn't logged in to check his own bell icon directly): a `GATE_OVERRIDE_NAMED` row for Fazal was created at 13:00:31, matching the PATCH that set the override, with `is_urgent=false`. Also retroactively confirms TC-7-12 correctly notified Fazal/Haroon throughout. |
| 22 | Pass   | Same DB check after the unrelated rename in TC-19: no new `GATE_OVERRIDE_NAMED` row appeared for this Opportunity — still exactly 3 total (from this and earlier test runs), none newer than the notify-triggering save. |
