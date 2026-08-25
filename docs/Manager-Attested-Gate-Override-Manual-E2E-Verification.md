# Manager-Attested Gate Override (BR-OP-14) — Manual E2E Verification

**Status:** Not yet run. Backend (steps 1-11) and frontend (step 12-13) are built and
applied to Dev — see `docs/Manager-Attested-Gate-Override-Implementation-Plan.md`.
This doc is the manual verification checklist for that build, run by Basheer against
Dev before considering the feature done.

**Prepared:** 2026-08-25.

## Setup

- A Sales Staff rep (**R**) whose `manager_id` points to an Area Manager (**M**).
- A second active General Manager (**G**) who is *not* R's manager — for the
  escalation-path tests.
- Browser DevTools (Network tab) for the API-level checks in section C.

## What the feature actually does (context for why these test cases are shaped
this way)

The gate is a checkpoint on the *stage transition*, not a requirement to sit in Demo
stage. The primary real-world scenario (a referral that declines a demo outright)
never puts the Opportunity into Demo or Clinical Evaluation stage at all — the rep
jumps it directly from Qualified straight to Negotiation (or further) in one move,
which crosses both the Demo Date gate and the Expected Closure Date gate at once.
There is no role restriction on who can *set* an override — `_validate_gate_override`
checks only the named approver's identity/role, never the creator's/editor's role —
so a Sales Staff rep can create a brand-new Opportunity straight into Negotiation or
Order, not just edit an existing one into that state.

---

## A. Create straight into Negotiation/Order (the primary scenario)

- [ ] **TC-1 — Create at Negotiation via QuickLeadModal, as R.** Fill Name/Account/
  Owner=R, Stage = Negotiation directly, Lead Source + Indicative Value + at least
  one product (Qualified gate still applies). Leave Demo Start/End and Expected
  Closure Date blank. Gate Override box should appear. Set Approver = M, pick a
  Reason, save.
  **Expect:** creates successfully, lands at Negotiation stage, no demo/closure date
  ever entered.

- [ ] **TC-2 — Same, but Approver = G (escalation, not R's manager).**
  **Expect:** succeeds — confirms GM escalation needs no reporting-line match.

- [ ] **TC-3 — Create at Negotiation, repeat via Customer 360's create form and
  Project Directory's create form.**
  **Expect:** same result in both places — confirms parity across entry points, not
  just QuickLeadModal.

- [ ] **TC-4 — Push further: create directly at Order stage** (skip Negotiation too)
  with the override set.
  **Expect:** Demo Date/Expected Closure Date still waived, but Order Value and
  Product Details are still required (Negotiation→Order gate is untouched by
  BR-OP-14) — you must supply items/value to get this far, override or not.

## B. Edit path — existing Opportunity jumping stages

- [ ] **TC-5 — Edit an existing Qualified-stage Opportunity, jump its Stage straight
  to Negotiation** (not stopping at Demo) without filling either date, via
  Opportunity Detail's Edit modal.
  **Expect:** Gate Override box appears (both thresholds crossed in one move), save
  succeeds with approver+reason.

- [ ] **TC-6 — Repeat TC-5 via Customer 360's edit form and Project Directory's edit
  form.**
  **Expect:** consistent behavior across all three edit surfaces.

- [ ] **TC-7 — Isolate a single gate (optional, narrower check):** edit an
  Opportunity from Qualified to Demo *only* (not past it), no Demo Date, override
  set.
  **Expect:** succeeds at just the Demo Date gate — confirms that gate's skip works
  independent of the Negotiation one.

## C. Approver validation — security-relevant, test via API directly

The UI picker only ever offers valid choices (R's manager + all GMs), so these
confirm the *server* actually enforces the rule, not just the form. Use DevTools
Network tab or a REST client against `PATCH /api/v1/opportunities/{id}` or
`POST /accounts/{id}/opportunities`.

- [ ] **TC-8 — Random approver** (not R's manager, not any GM). Send
  `gate_override_approver_id` = some unrelated Sales Staff user's id, with a valid
  reason id.
  **Expect:** `403` — "Gate override approver must be the opportunity owner's
  immediate manager, or a General Manager."

- [ ] **TC-9 — Correct manager relationship but wrong role** (if you have a test user
  who is R's `manager_id` but doesn't actually hold the Area Manager role — e.g. was
  reassigned).
  **Expect:** `403` — "...must hold the Area Manager role."

- [ ] **TC-10 — Reason omitted, approver set.** Via API, send
  `gate_override_approver_id` with no `gate_override_reason_id`.
  **Expect:** `422` validation error — "Gate override reason is required whenever an
  approver is set." Also confirm the same thing is blocked *client-side* in the UI
  (never reaches the server) by trying it through any of the forms directly.

## D. Clearing an override

- [ ] **TC-11 — Reopen an Opportunity with an override already set, clear the
  Approver picker back to "No override," save.**
  **Expect:** `gate_override_approver_id`/`reason_id`/`note` all clear together.
  Then try re-advancing its stage without a demo/closure date — should now
  correctly block again (gate re-enforced once the override is gone).

## E. Display & audit

- [ ] **TC-12 — Overview tab read-only display.** After TC-1/TC-5, confirm
  Opportunity Detail's Overview shows "Gate Override Approved By," "Reason," and
  Note (if set).

- [ ] **TC-13 — Audit stamping.** In DevTools, inspect the save response for
  `gate_override_set_at`/`gate_override_set_by` — populated only on the save that
  *sets* the approver. Then make an unrelated edit (e.g. rename) and confirm those
  two fields stay unchanged (not re-stamped).

- [ ] **TC-14 — Master data.** Confirm the Reason dropdown lists exactly the 3
  seeded values: "Customer declined demo," "Deal closed outside normal process,
  entered after the fact," "Other — see notes."

---

## Results log

Fill in as each test case is run — pass/fail plus any notes (unexpected behavior,
UI issue, etc.). Move a summary of the overall outcome to
`docs/Progress-Archive-2026-08.md` once the full pass is complete, per this
project's session-handoff convention.

| TC | Result | Notes |
|----|--------|-------|
| 1  |        |       |
| 2  |        |       |
| 3  |        |       |
| 4  |        |       |
| 5  |        |       |
| 6  |        |       |
| 7  |        |       |
| 8  |        |       |
| 9  |        |       |
| 10 |        |       |
| 11 |        |       |
| 12 |        |       |
| 13 |        |       |
| 14 |        |       |
