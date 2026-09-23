# Brand-Level Target Planning — Manual E2E Test Plan

**Feature:** `docs/Brand-Level-Target-Planning-Implementation-Plan.md` — a
brand-level slice of PRD §6.5, built on top of Target Planning (already
Done, `docs/Target-Planning-Manual-E2E-Test-Plan.md`). Every quarterly
target now carries an optional-but-mandatory-once-applicable per-brand
split (decision #1); GM/Admin separately record what each brand vendor
actually promised for the quarter (decision #2); no top-down cascade
(decision #3) — each person still sets and splits their own number, the
system only adds it up and shows the gap against the vendor's number.

**Scope built:** `TargetPlanningScreen.tsx`'s Set/Revise Target dialog now
shows a "Split by Brand" section whenever the target's SBU has at least one
active brand — both SBUs do today (Imaging 1, Critical Care 9) — with a
brand picker, per-row amount, and a running "remaining to allocate"
indicator; save is blocked until the split sums to exactly the total. New
**Brand Target Tracking** screen (Admin/GM only, under Administration) sets
each brand's vendor target per quarter and shows it next to the team's
committed total and the gap. A target set before this feature existed
(zero split rows, SBU now has a brand) shows a **"Needs Brand Split"** flag
on "My Target" and the SBU Rollup, prompting a revise — not retroactively
blocked (Basheer's call, 2026-09-23).

**Built across four commits, 2026-09-23:**
- `36385f2` — backend: migration `0053` (`target_plan_brand_split`,
  `brand_vendor_target`), service/repository/router, 13 new tests.
- `9514655` — frontend: the split editor, Brand Target Tracking screen.
- `053c017` — fixes from a high-effort `/code-review` pass (below) plus
  the requested cleanup items, done together.
- `f8606b4` — logged one deferred item (a DB-level split-sum constraint,
  intentionally not built — matches how Opportunity's own contributor
  splits are enforced today, app-layer only) to `docs/Backlog.md`.

**Fixed by `/code-review` (high effort) before this pass runs, all in
`053c017` unless noted:**
- **Migration `0054`, its own commit `4185135`** — `target_plan_brand_
  split_read`'s RLS policy was copied from `target_plan_read`'s *pre-0045*
  buggy version (2026-09-17's already-fixed cross-SBU leak), reopening it
  one layer down: any user who was someone's `manager_id`, in any role, in
  any SBU, could read that person's brand-split rows across SBU
  boundaries. **Step G below is the direct regression test for this fix —
  the single most important step in this plan; if it fails, stop and
  report before continuing**, same standing as Product Catalog's own
  `docs/Product-Catalog-Brand-Category-Model-Manual-E2E-Test-Plan.md` step
  19.
- **`TargetPlanService._apply_brand_splits`** — splitting is now mandatory
  server-side, not just gated by the frontend's dialog (a direct API call,
  or a click that beat the brand-list fetch, previously bypassed decision
  #1 entirely); a duplicate `brand_id` in one split is now rejected
  cleanly instead of crashing with a raw 500; an update that changes the
  amount can no longer leave the old, now-mismatched splits in place.
- **`GET /planning/targets/brand-rollups`** — now Admin/GM only (was open
  to any authenticated user) and batched into one call per SBU instead of
  one round trip per brand.
- **Split-sum tolerance** — the screen's "does it add up" check now
  matches the backend's exact `NUMERIC(15,2)` equality via a small shared
  utility (`allocationSplit.ts`), also adopted by Opportunity's existing
  contributor-split editor to close the same drift risk there. **Step K
  below is the regression check that Opportunity Splits still behaves
  identically** — its on-screen markup/styling was deliberately left
  untouched, only the shared sum/balance math changed underneath it.
- **`tests/test_persistence.py`** — a model-registry canary test the
  original `36385f2` commit should have updated but didn't (table/
  relationship counts); caught by running the full suite, not just the
  planning domain's own tests.

**Automated test coverage:** 46 planning-domain tests (up from 28 before
this feature), 941/941 full backend suite passing, `tsc`/`eslint`/
Tailwind-guard clean on the frontend.

**Test users needed:** reusing Target Planning's own cast for continuity —
Vivek (Sales Staff, Critical Care), Arun Adarsh (Vivek's actual Area
Manager, also Critical Care), Nishad K V (a *different* Area Manager, same
SBU as Vivek but a different zone — the RLS negative case), Haroon
(General Manager), Abdul Latheef (the separate Admin account). Ideally one
more Critical Care person (any role) for Section F's multi-person rollup
sum.

**Setup:** pick a quarter nobody has already set a target for, for Vivek
and Arun, in Critical Care (Group C's own note about clean starting state
still applies — no Delete UI exists). For Section I, reuse a target from
Target Planning's own 2026-09-17 pass (e.g. Vivek's `2026-Q3` target, set
before this feature existed) as the "predates the feature" case.

**Simple vs. Complex, per CLAUDE.md's Manual E2E testing rule:** tagged
per step below. Simple steps are Basheer's to run, told what to click and
check; Complex steps (cross-role visibility, RLS negatives, direct API
calls) are Claude's, driven in the browser.

---

## A — Sales Staff sets a target with a brand split for the first time (Simple)

1. Log in as Vivek (Sales Staff, Critical Care), open Target Planning, the
   clean test quarter. **Expected:** "My Target" reads "No target set,"
   **Set Target** button present.
2. Click **Set Target**, enter an amount (e.g. `60`). **Expected:** a
   "Split by Brand \*" section appears below the amount field, with a
   "Remaining to allocate" indicator reading the full amount (`₹60.0L`) in
   warning color, since no brand is picked yet.
3. Add one brand at `40` and a second at `20` (any two of Critical Care's
   9). **Expected:** the remaining-to-allocate indicator updates live as
   each row is added, turning green and reading `₹0.0L` once both rows are
   in.
4. Try to Save with only one brand added (e.g. `40` of `60`, leaving `20`
   unallocated). **Expected:** blocked with a clear message naming the
   current split total vs. the target amount — nothing saved.
5. Add the second brand's row, Save. **Expected:** modal closes; "My
   Target" shows the amount, **Pending Approval** chip, no "Needs Brand
   Split" flag (see Section I) since a real split now exists.
6. Hard-refresh, reopen Target Planning, click **Revise** on this target.
   **Expected:** both brand rows reappear pre-filled with their saved
   amounts — confirms the split persisted server-side, not just a local
   screen update.

## B — Revising the split without changing the total (Simple)

7. Still as Vivek, **Revise** the same target. Remove one brand row, add a
   different brand instead, keeping amounts so the total still sums to the
   same `₹60.0L`. Save. **Expected:** saves cleanly, no error — the total
   didn't change, only which brands carry it.

## C — Split-only revision on an APPROVED target resets approval (Complex)

8. As Arun (Vivek's Area Manager), approve Vivek's target from Group A/B.
   **Expected:** works exactly as Target Planning's own Group C — status
   flips to **Approved** on Vivek's screen.
9. As Vivek, **Revise** the approved target — change only the brand split
   (re-shuffle amounts between the same two brands), leave the total
   amount field untouched, Save. **Expected:** the info banner about
   revising an approved target still shows; after saving, status flips
   back to **Pending Approval** — confirms a split-only change (same
   total) resets approval exactly like a total change does, per the
   2026-09-23 decision this plan's own commit `053c017` codified.

## D — GM records a brand's vendor target (Simple)

10. Log in as Haroon (GM), open **Brand Target Tracking** (under
    Administration). **Expected:** the nav item is present; screen shows a
    quarter picker, an SBU picker, and a table of that SBU's brands with
    Vendor Target / Team Committed / Gap / Actions columns.
11. Pick Critical Care, the same quarter used in Groups A-C. **Expected:**
    the brand(s) Vivek split against show a non-zero "Team Committed"
    figure already (from Groups A/B/C), "Vendor Target" reading "Not set."
12. Click **Set Target** on one of those brands, enter an amount (e.g.
    `100`), Save. **Expected:** row updates to show `₹100.0L` as Vendor
    Target and a computed Gap (`vendor − committed`).
13. Click **Revise** on the same brand, change the amount, Save.
    **Expected:** updates in place (upsert) — confirms decision #2's "can
    be corrected, not just entered once."

## E — Non-Admin/GM cannot see or touch Brand Target Tracking (Complex)

14. As Vivek (Sales Staff), check the sidebar. **Expected:** no
    Administration section at all, so no path to Brand Target Tracking —
    same as every other admin-only screen.
15. As Vivek, attempt `GET /planning/targets/brand-rollups` and
    `POST /planning/brand-vendor-targets` directly (dev tools or an API
    client, Vivek's own session). **Expected:** both `403`, matching the
    `_require_admin_or_gm` gate added in `053c017` — re-check via
    `GET /planning/brand-vendor-targets` (open read) that nothing was
    created.

## F — Brand rollup adds up correctly across people (Simple, needs a second Critical Care person)

16. Have a second Critical Care person set a target with a split against
    the *same* brand Vivek split against in Group A (any amount).
17. As Haroon, reopen Brand Target Tracking for that brand/quarter.
    **Expected:** "Team Committed" equals Vivek's split amount for that
    brand plus the second person's — confirms the rollup sums across
    people, not just showing one person's row.

## G — Cross-SBU RLS boundary on the new brand-split table (Complex) — **direct regression test for the 0054 fix, most important step**

18. As Nishad K V (a *different* Area Manager, same SBU as Vivek but a
    different zone, per Target Planning's own Group F negative case),
    attempt to read Vivek's brand-split rows for the target from Groups
    A-C — via the Target Planning screen if Vivek isn't in Nishad's zone
    tree, and/or a direct `GET` on whatever endpoint surfaces
    `target_plan_brand_split` rows.
    **Expected:** Nishad sees nothing for a target that isn't his own,
    his direct report's, or in his zone tree — before the `0054` fix, a
    user who happened to be *anyone's* `manager_id` (not necessarily
    Vivek's) could read across SBU boundaries; confirm that's now closed.
19. If a person in the **other** SBU (Imaging) is available, log in as
    them and attempt the same read against Vivek's (Critical Care)
    brand-split rows directly. **Expected:** nothing returned — the fixed
    policy's `sbu_id = cabio_app_sbu_id()` wrapper is what this step is
    actually proving.

## H — Imaging: single-brand SBU still works (Simple)

20. Log in as an Imaging Sales Staff, set a target for a clean quarter.
    **Expected:** the Split by Brand section still appears (Imaging has 1
    active brand, per decision #1's "most Imaging users will just have
    one 100% row"), pre-filterable to that one brand at 100% of the
    amount, saves cleanly.

## I — "Needs Brand Split" flag on a pre-existing target (Simple)

21. As Vivek, navigate to `2026-Q3` (or whichever quarter has a target set
    from Target Planning's own 2026-09-17 pass, before this feature
    existed). **Expected:** a **"Needs Brand Split"** warning chip shows
    next to the status chip, since that target has zero split rows and
    Critical Care now has active brands.
22. As Arun or Haroon, check the SBU Rollup table for that same quarter.
    **Expected:** the same flag shows next to Vivek's row there too.
23. Click **Revise** on that target, add a valid split, Save. **Expected:**
    the flag disappears from both "My Target" and the SBU Rollup after a
    refresh.

## J — Validation edge cases (Complex, direct API)

24. As Vivek, attempt `POST /planning/targets` (or the update endpoint)
    with two split rows using the *same* `brand_id`. **Expected:** a
    clean rejection ("Each brand can only appear once in the split"), not
    a raw 500 — the UI itself already prevents this via its filtered
    picker, so this is an API-level check only.
25. Attempt a save where the split sums to one cent off the total (e.g.
    total `50.00`, splits summing to `50.01`). **Expected:** rejected by
    the backend; separately confirm in the browser that the same mismatch
    is *also* caught client-side before the request is even sent (the
    tolerance-consistency fix from `053c017`).

## K — Regression: Opportunity Splits unaffected (Simple)

26. Open any Opportunity with existing contributor splits (or create a
    new one), use its **Splits** tab exactly as before — add/remove a
    contributor, confirm the running percentage total and its
    green/amber coloring behave identically to before this session's
    changes. **Expected:** no visible difference at all — only the
    underlying sum/balance-check code was shared with the new Brand split
    feature, not the markup or styling.

## L — Regression: nav and unrelated screens (Simple)

27. Confirm **Target Planning** and **Brand Target Tracking** (Admin/GM
    only) both appear correctly per role, same as Target Planning's own
    Group K.
28. Spot-check Pipeline and Insights still load normally after visiting
    both screens.

---

## Not re-tested live (already covered by automated tests)

The core Target Planning approval workflow (resolved-manager approval,
nobody-approves-their-own-row, non-owner revision rejection) is unchanged
by this feature and already signed off in `docs/Target-Planning-Manual-
E2E-Test-Plan.md` — not re-proven here. Split-sum validation, duplicate-
brand rejection, mandatory-when-brands-exist enforcement, and the
Admin/GM gates on vendor-target write and brand-rollup read all have
passing unit tests in `test_target_plan_service.py`/`test_target_plan_
repository.py` (46 tests) — this live pass is about the screen's wiring
and the RLS boundary specifically (Section G), not re-proving the
underlying rules those tests already cover.

## Sign-off

Record Pass/Fail per step, who tested each role, and any live findings
(fixed or deferred), same format as Target Planning's and Product
Catalog's own test plans. This feature isn't added to `Signed-
Requirements-to-PRD-Traceability.md`'s "Commitment beyond contract" list
until every section above passes.
