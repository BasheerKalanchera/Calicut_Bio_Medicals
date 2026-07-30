# Phase 2E Task 9 — Write-Path Retest Plan

**Status:** Scratch/working doc — delete once manual retest is complete and results are folded into `active_progress.md`.
**Date:** 2026-07-27
**Purpose:** The `cabio_app` cutover is live (app now connects with RLS enforced). Task 8's automated
verification only ever exercised `SELECT`. These policies have no `FOR SELECT` clause and no
separate `WITH CHECK`, so `INSERT`/`UPDATE` are gated by the identical `USING` expression — untested
until now. `Activity` rows are immutable (no DELETE endpoint), so this is real, permanent live data —
manual pass, not automated.

## Setup
1. Start backend (`uvicorn app.main:app --reload --port 8000` from `backend/`) — connects as `cabio_app` now.
2. Start frontend (`npm run dev` from `sales-os-app/`).
3. Test accounts: `admin@cabio-demo.com`, `gm@cabio-demo.com`, `sbumanager@cabio-demo.com`,
   `areamanager@cabio-demo.com`, `salesmanager@cabio-demo.com`, plus your own account and Amit R's
   for the two Sales Staff tiers.

## Baseline sanity — one normal write per tier
(Proves ordinary usage isn't broken by RLS.)

| Role | Action | Why |
|---|---|---|
| Basheer K (Sales Staff) | Log a new Activity on one of your own opportunities | Simplest case — `owner_id = caller` branch |
| Test - Sales Manager | Edit/create an Opportunity you own | Same branch, different tier |
| Test - Area Manager | Log an Activity on one of the 12 opportunities they can see | Exercises the *combined* `sbu_id AND zone` condition on write, not just read — the most complex `WITH CHECK` clause in the build |
| Test - SBU Manager | Create a brand-new Opportunity (any account) | **Note:** all 21 test opportunities are `Imaging` SBU, and SBU Manager is `Critical Care` — no existing Critical Care opportunity to edit, so this only proves the `owner_id = self` branch, not their SBU-specific branch on write. Same test-data gap Task 8 already flagged; not fixable without new seed data |
| Admin or GM | Edit any Opportunity regardless of SBU/owner | Unrestricted branch |

## Targeted edge cases
(These specifically stress the boundaries a naive fix could get wrong.)

1. **Cross-SBU "Next Action" reassignment** — As Basheer K, log an Activity on your own opportunity
   and assign the "Next Action" owner to **Amit R** (different SBU/zone) via the dropdown.
   **Expect: succeeds.** Checks that the `reminder`/`activity` insert only needs *your* visibility
   of the opportunity — the assignee's tier shouldn't matter for the write to go through.
2. **Split to someone outside your reporting chain** — As Test - Sales Manager, add a Split on one
   of your opportunities to a colleague who doesn't report to you.
   **Expect: succeeds** (split insert only needs *you* to see the opportunity, not the recipient).
   Then — **as that colleague** — confirm they can now see that opportunity in their own pipeline
   (the permanent `cabio_app_has_split()` carve-out actually taking effect after a live write, not
   just Task 8's synthetic data).
3. **Product-only Document — REVISED 2026-07-30, was: expect cross-SBU visibility.** Investigated
   live and found the original Task 6 assumption doesn't hold: `GET /products/{id}/documents` gates
   on `product_exists()` first, which is itself SBU-restricted (Task 7's `product_sbu_visibility`
   policy) — a cross-SBU user 404s before the document's own (technically permissive) policy is ever
   reached, and there's no UI path to a product's documents other than Product Catalog → click into
   the product, which is correctly SBU-filtered. **Decision (BR-ACT-07): drop the cross-SBU intent,
   keep the SBU restriction** — no code change. **New expectation for this check:** upload/link a
   collateral document to a Product with no Opportunity attached, then confirm a user in the *other*
   SBU correctly **cannot** see that product (or its documents) at all — this now belongs with the
   expected-to-fail checks below, not the succeed-path edge cases.
4. **Reminder completion as the assignee, not the owner** — Have whoever got assigned in step 1
   (Amit R) mark that reminder complete. **Expect: succeeds** — the carve-out is permanent, not
   conditioned on completion status.

## Expected-to-fail check
(Proves enforcement is real, not just permissive.)

5. Confirm a Sales Staff account genuinely cannot reach an Opportunity outside their visibility to
   edit it at all — it shouldn't even appear in their pipeline list to click into. If you can find a
   way to reach an edit form for something outside your tier (e.g. via a stale browser tab/URL) and
   submit a change, **expect either a clean error or — if the app doesn't handle it gracefully — a
   raw 500** with "new row violates row-level security policy." If you hit that, flag it — it'd be a
   UX gap to fix as a fast-follow, not a sign the security itself failed.

## Housekeeping
Label anything you create as `TEST - ...` where the UI allows a name field, same convention as the
existing test accounts, so it's identifiable later.

## Report back
What you found — especially anything from step 5 or any unexpected failure in the baseline/edge-case
steps — so the next step (commit + doc fixes, Task 10) can proceed with full confidence.
