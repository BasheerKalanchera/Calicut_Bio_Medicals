# Query Load Fixes — Implementation Plan

**Status:** Approved 2026-10-06 (Basheer). Deadline: all rows fixed and on UAT by Sun 2026-10-11.
**Traceability rows:** none (no signed requirement; reliability work after the
Next Actions outage).
**Design / discussion:** query audit on Dev, 2026-10-06 — results in
Progress-Archive-2026-10 (2026-10-06 entry).

## Decisions

- D1. Lighter approach: fix each listed screen's own database requests one
  screen at a time; do **not** change the app-wide loading defaults (the
  heavier option: rework all 74 auto-loading settings in 17 files at once,
  which risks every screen) — Basheer, 2026-10-06
- D2. Any work on a listed screen, backend or frontend, includes that
  screen's fix as its own `fix:` commit, landing before the other work's
  commit — Basheer, 2026-10-06
  - Exception 2026-10-06: Target vs Actuals step 4 (`2c189d7`) landed
    before the Opportunity-page fix, by Basheer's choice; the fix goes on
    top. No overlap: step 4 is screen code only, the fix is backend only.
- D3. Deadline: every row in section 6 is fixed this week (by Sun 2026-10-11), not "as touched";
  rows go in priority order, and D2 only moves a row earlier — Basheer,
  2026-10-06
- D4. Keep the measuring script in the repo as `scripts/query_audit.py` (Dev
  only, read-only, refuses to run against UAT), so any later session can
  measure a screen before and after its fix — Basheer, 2026-10-06
- D5. "Done" for each fix: the screen returns exactly the same data as before
  (automatic before/after comparison on Dev); no single database question
  above 15 shelves or 10 ms planning; pytest and ruff clean; Basheer opens
  the screen once to confirm. No full written E2E plan, since nothing the
  user sees changes — Basheer, 2026-10-06
- D6. Add a rule to the backend standards: every screen's list or detail
  request states exactly which linked records it loads (the Next Actions
  fix pattern), so new code doesn't add to the problem — Basheer, 2026-10-06
- D7. Each fix moves to UAT as soon as it is done, not with the next feature
  promotion; each UAT move is its own approval; no separate UAT measurement
  unless a screen is reported slow there — Basheer, 2026-10-06. (The
  before/after screen timing in Chrome, step 7, is not this: it uses the
  website, not the database — Basheer, 2026-10-06.)
- D8. Route to UAT: the Next Actions hotfix route — build and check on `main`
  against Dev, then carry the same change onto the `uat` branch, run the
  tests there, deploy, and merge `uat` back into `main`. A plain `main` →
  `uat` merge is not possible: `main` is 128 commits ahead, with unreleased
  migrations and the half-built PO date rule — Basheer, 2026-10-06
- D9. UAT trips: four, one per fix group — Opportunity page (with Product
  documents); Activity comments and Daily Report; Pipeline; the three
  priority-4 rows together — not one combined move at the end of the
  week — Basheer, 2026-10-06. Exception: if fix 2 is finished and
  checked on Dev before trip 1's deploy (morning of 2026-10-07), trips 1
  and 2 go as one hotfix, timed together; otherwise trip 1 goes alone —
  Basheer, 2026-10-06.

## 1. In plain terms

Some screens fetch far more than they show. Every record is set up to "bring
along" its linked records, and those bring along theirs, so opening one
Opportunity can pull in about 360 linked lookups. That's what took Next
Actions down. The fix teaches each screen to fetch only what it displays.
Nothing changes on screen: same data, same layout, just less work behind it.

Screens, in priority order (impact = cost × how often it is used):

| Priority | Screen | Used by | Cost today (Dev) | What gets fixed |
|---|---|---|---|---|
| 1 | **Opportunity page**: opening it (from Customer 360, Pipeline, bell or reminder) and saving products, splits or stakeholders | Reps, many times a day, mostly to edit | Open: ~135 ms, ~33 questions, ~360 shelves. Saves: products ~46 ms, splits ~68 ms (loads the bundle 3 times), stakeholder ~35 ms | Detail, products, splits, stakeholders, documents: open and save |
| 1 | **Activity comment threads** (on Account, Opportunity, Project, Daily Report and Pipeline) | Everyone | ~40 ms, 94 shelves | Same cause as Next Actions |
| 2 | **Opportunity Pipeline** | Mostly managers | ~165–185 ms, the slowest single screen | Main list request; cause still to be read |
| 2 | **Daily Activity Report** | Managers, daily | ~35–40 ms, up to 100 activities per page | Same Activity fix as comments |
| 3 | **Product Catalogue**, a product's documents | Occasional | ~35 ms, 78 shelves | Comes free with the Opportunity documents fix |
| 4 | **Audit Log** (admin) | Admin, rarely | 43 questions per page | Fix when touched |
| 4 | **Territory Admin**, zone tree (admin) | Admin, rarely | 93 questions | Fix when touched |
| 4 | **Unused Account "workspace" request** | Nobody: no screen calls it | 13 questions, 37 shelves | Remove it, not fix it |

Already fine, no change: logging an activity, editing Opportunity details,
Customer 360 itself (including its Opportunity tab), Activity timelines,
Next Actions, Accounts, Reports, Notifications, Products list, Projects and
Marketing Leads.

## 2. Build order

0. **Now (setup, one docs batch plus one script commit):** this plan, a
   Backlog entry pointing here, the D6 rule in the backend standards, the
   audit results in Progress-Archive, and `scripts/query_audit.py` (D4).
1. **Then, this week, in priority order (D3):** Opportunity page first (its
   PO date box, being added by the Target vs Actuals work, is the D2
   trigger), then Activity comments and Daily Report, Pipeline, and
   the priority-4 rows. Each fix:
   1. Measure the screen and save its current responses.
   2. Trim that request's loading.
   3. Measure again; confirm the responses are identical (D5).
   4. pytest and ruff; `/code-review` (medium).
   5. Basheer opens the screen once on Dev.
   6. `fix:` commit on `main` (own approval); tick the row in section 6.
   7. UAT move (D7, D8; own approval): same change on the `uat` branch,
      tests there, deploy, Basheer opens the screen once on UAT, merge `uat`
      back into `main`.
      - Before/after check, every trip: the measuring script runs only on
        Dev and refuses UAT (D4), so the check on UAT is done on the
        screens themselves, with the same pages both times:
        1. Before the deploy: Basheer picks the pages (below). Each is
           opened on UAT, twice, and the second opening's load time is
           noted.
        2. After the deploy: the same pages, opened the same way, timed
           again.
        Pages per trip:
        - Trip 1 (Opportunity page and Product documents): 3–5 busy
          Opportunities (many products, splits, stakeholders or
          documents) with their tabs, and one product with documents.
        - Trip 2 (Activity comments and Daily Report): comment threads on
          2–3 busy activities, and the Daily Activity Report for a busy day.
        - Trip 3 (Pipeline): the Opportunity Pipeline, as a manager.
        - Trip 4 (priority-4 rows): the Audit Log and the Territory Admin
          zone tree. The unused workspace request has no screen to time.
        Timing: Claude reads the request times in Chrome, signed in to the
        UAT website as Basheer (no database connection). Result in section
        6's "On UAT" column and Progress-Archive (Basheer, 2026-10-06).

## 3. Not in this plan (with reasons)

- App-wide change of loading defaults: see D1; too broad for a single change.
- UAT measurement: see D7; Dev data is enough to rank, and the fixes reduce
  work regardless of data size.
- Wall-clock timings: unreliable in this method (the measuring itself adds
  round trips); planning time and question count are used instead.

## 4. Business rules and records to update

- No business rule changes. Responses must stay identical.
- Backend standards: the D6 rule, plus a note that the "single reference =
  joined" default is no longer enough on its own.
- Backlog: one entry, "Query load fixes — in progress, deadline Sun
  2026-10-11", linking here.
- Progress-Archive-2026-10: audit results and save checks (2026-10-06).

## 5. Technical addendum

- Root cause: chained `lazy="joined"` on many-to-one relationships
  (`opportunity/models.py` 20 settings, `activity/models.py` 10,
  `document/models.py` 5), as Backend standards prescribe
  ("`joined` for single references").
- Fix pattern (already used for Next Actions / reminders):
  `joinedload(rel).load_only(...).lazyload("*")` or `noload(...)`; see
  `activity/repository.py:239-244` (`_activity_display_options`).
- Requests and code, by row:
  - Opportunity page: `GET /opportunities/{id}` (35 joins);
    `…/items` `list_items` (`opportunity/repository.py:380`, 45);
    `…/splits` `list_splits` (`:464`, 42; `PUT …/splits` re-runs it 3×);
    `…/stakeholders` `list_opportunity_stakeholders` (`:553`, 41) and
    `get_stakeholder_link` (`:564`, used by `PATCH`); `…/documents`
    `document/repository.py:30` `list_by_opportunity` (59, 114 total).
    `PUT …/items` loads `opportunity_item` 45-join before and after.
  - Product documents: `document/repository.py:19` `list_by_product` (59).
  - Activity: `list_for_activity` (`activity/repository.py:219`, 61 joins);
    `list_by_date` (`:168`, 57 joins; only `reminders` noloaded).
  - Pipeline: `list_pipeline` (`opportunity/repository.py:98`); 36 joins but
    159–182 ms planning on one statement, so the cause isn't join count
    alone. Read it before proposing the fix.
  - Audit Log: 45 joins, 43 statements. Zone tree (`/admin/zones/tree`): 93
    statements (per-node loading). Account `…/workspace`: unused by the
    frontend (`getWorkspace` has no caller).
- Measuring method: FastAPI TestClient in-process against Dev; each request
  in a transaction that is always rolled back; statements captured by a
  `before_cursor_execute` listener; `EXPLAIN (SUMMARY ON)` for planning time.
  Saves measured the same way, with a before/after checksum confirming
  nothing was kept.
- Each fix needs a regression test asserting the screen's request stays at or
  below its new statement/join budget.

## 6. Progress

| Row | Fixed on `main` | On UAT | Before → after |
|---|---|---|---|
| Opportunity page (open + save) | `90ae253` (2026-10-06) | — | Detail 35 → 11 joins, ~16–24 → ~4.5 ms; lists 41–59 → 5; saves 41–45 → ≤14 |
| Activity comments | — | — | |
| Opportunity Pipeline | — | — | |
| Daily Activity Report | — | — | |
| Product documents | `90ae253` (with Opportunity documents) | — | List 59 → 5 joins (the 5 are the signed-in-user lookup) |
| Audit Log | — | — | |
| Zone tree | — | — | |
| Account workspace (remove) | — | — | |
