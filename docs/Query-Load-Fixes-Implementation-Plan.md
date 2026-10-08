# Query Load Fixes — Implementation Plan

**Status:** Approved 2026-10-06 (Basheer). Deadline Sun 2026-10-11: fixes 1–3 fixed and on UAT; fix 4 committed on `main` (it reaches UAT with the next full promotion, D9) — Basheer, 2026-10-07.
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
  Basheer, 2026-10-06. Changed 2026-10-07 (Basheer): no trip 4. Fix 4
  (Audit Log, zone tree, workspace removal) is built and checked on Dev
  and committed to `main`, then reaches UAT with the next full `main` →
  UAT promotion (with Target vs Actuals and the Audit Trail Redesign).
  Reason: UAT still runs the old Audit Log, so the Audit Log fix can't
  go before the redesign does.

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
| 1 | **Activity comment threads** (on Customer 360, the Opportunity page and the Project Directory; corrected 2026-10-06 from the code) | Everyone | ~40 ms, 94 shelves | Same cause as Next Actions |
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
   5. Old-vs-fixed run on Dev. Each case names the user and the values
      expected on the old code. With the old code loaded, run every case
      (what the screen shows, plus the server's answer from the script);
      then restore the fix, restart, run the same cases again and compare
      (Basheer, 2026-10-06).
   6. `fix:` commit on `main` (own approval); tick the row in section 6.
   7. UAT move (D7, D8; own approval): same change on the `uat` branch,
      tests there, deploy, Basheer opens the screen once on UAT, merge `uat`
      back into `main`.
      - Before/after check, every trip: the measuring script runs only on
        Dev and refuses UAT (D4), so the check on UAT is done on the
        screens themselves, with the same pages both times:
        0. Before the "before" timings, Claude searches the code and
           lists every way the changed request is reached, in three
           groups: (a) screens that request it directly; (b) reports or
           links that open that screen with a filter, each filter listed
           separately; (c) other screens that reuse or pre-fetch its
           data, including saves that update it in place. Basheer
           approves the list; every item on it is checked before and
           after the deploy, not just timed (Basheer, 2026-10-08, after
           trip 3 timed only the plain Pipeline).
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
        - No trip 4 (D9, changed 2026-10-07): the Audit Log and the
          Territory Admin zone tree are timed on UAT before and after the
          full promotion that carries fix 4. The unused workspace request
          has no screen to time.
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
| Opportunity page (open + save) | `90ae253` (2026-10-06) | `34737e7` + `30d545f` (2026-10-07; no payment-confirmer join, so 10 joins). Header 0.7–1.5 → 0.62–0.74 s; tabs 0.6–1.9 → 0.49–1.0 s | Detail 35 → 11 joins, ~16–24 → ~4.5 ms; lists 41–59 → 5; saves 41–45 → ≤14 |
| Activity comments | `bc09b28` (2026-10-06) | `4e8c47d` (2026-10-07). 0.9–1.6 → 0.57–0.68 s | Thread 61 → 5 joins, ~35–42 → ~1 ms; old vs fixed code as Haroon: same 6 comments and writers |
| Opportunity Pipeline | `8e8e075` + merge `f7d25b1` (2026-10-07) | `569209f` (2026-10-08; 10 joins, no payment-confirmer). Hard refresh: Nishad (Area Manager) 1.93 → ~1.4 s; Basheer K (Admin) 2.88 → 1.8–3.3 s, no clear change (network delay dominates). Same card counts both rounds. Only the plain view timed; full Dev comparison pending (section 9) | 36–37 → 11–12 joins, 4–10 → 4 statements; ~167–276 → ~6–35 ms across unfiltered, zone, stage, team-only and product views; old vs fixed code as Basheer K: same screens (section 8) |
| Daily Activity Report | `bc09b28` (2026-10-06) | `4e8c47d` (2026-10-07). 5 Oct: 5.6 / 2.1 → 0.72 / 0.70 s | 57 → 6 joins, 11 → 4 statements, 60–77 → ~5 ms; old vs fixed code as Haroon (27 Aug): same 14 cards |
| Product documents | `90ae253` (with Opportunity documents) | `34737e7` (2026-10-07). 0.84 / 1.06 → 0.55 s | List 59 → 5 joins (the 5 are the signed-in-user lookup) |
| Audit Log | — | — | |
| Zone tree | — | — | |
| Account workspace (remove) | — | — | |

## 7. Regression check on Dev — fixes 1 and 2 (before UAT trip 1)

Added 2026-10-06 (Basheer): the automatic checks proved the same data comes
back, but no one had clicked through the app. Risk being checked: a linked
record the fix stopped fetching shows up blank instead of failing loudly.
Rebuilt the same day to cover every way into the changed screens (the first
version covered 2 of 10; Basheer caught it).

**Where the changed code is reached** (from the code, 2026-10-06):
- Opportunity page: 10 entry points, all through one route
  (`DemoApp.tsx` `handleSelectOpportunity`). Every one re-asks the server
  for the header (`OpportunityDetailScreen.tsx` `initialDataUpdatedAt: 0`),
  so each entry point exercises fix 1. Tabs and saves don't depend on the
  entry point, so they are checked once (part B).
- Comment threads: 3 places — Customer 360 (hospital), Opportunity page,
  Project Directory (`ActivityTimeline`). The Daily Report and Pipeline don't
  show comment threads (section 1 said they did; corrected).
- Daily Activity Report: its own screen.
- Logging an activity and activity timelines: not changed by fix 2, not
  checked (and test activities can't be deleted).

**Set-up:** all steps as Haroon Sidheeq (General Manager, sees and edits
every Opportunity; Basheer's choice). The three-role check is the
automatic comparison already done. Dev backend restarted before part A.
Part B saves to the shared Dev database: Basheer clicks, Claude watches,
each save undone by a second save (both stay in the Audit Log). Records
looked up read-only on Dev 2026-10-06; names repeat across hospitals, so
each is given with its hospital. "Pass" = header (hospital, stage, status,
owner, SBU) and Overview show names, no blanks.

### A. Opening the Opportunity page from every entry point

| # | Step | Type | Result |
|---|---|---|---|
| A1 | Pipeline → "usg m/c" (aster medicity) | Simple | Pass (Basheer, 2026-10-06) |
| A2 | Customer 360 → aster medicity → Opportunities tab → "usg m/c" | Simple | Pass (Basheer, 2026-10-06) |
| A3 | Project Directory → "ICU Monitoring System Upgrade" (KIMS Hospital Trivandrum) → "New USG m/c" | Simple | Pass (Basheer, 2026-10-06) |
| A4 | Next Actions → reminder on "Test opportunity" (Al Shifa Hospital Perinthalmanna) | Simple | Pass (Basheer, 2026-10-06) |
| A5 | Audit Log → a row for "Test +lead screen" (Aster MIMS Calicut) → open the Opportunity | Simple | Pass (Basheer, 2026-10-06) |
| A6 | Daily Activity Report, 27 Aug → click an Opportunity name on a card | Simple | Pass (Basheer, 2026-10-06) |
| A7 | Stagnant Deals → first Opportunity listed | Simple | Not run: no stagnant Opportunities on Dev; same route and name-only hand-over as A4–A9 |
| A8 | Opportunities On Hold → "New ICU Monitor deal" (Aster DM) | Simple | Pass (Basheer, 2026-10-06) |
| A9 | Sign out, sign in as Haroon → the due-reminders pop-up → "Test opportunity" (Al Shifa) | Simple | Pass (Basheer, 2026-10-06) |
| A10 | Bell → an Opportunity notification. Haroon has none on Dev; only Basheer K has one ("New USG Machine - referral test", Aster MIMS Calicut). Run as Basheer K, or skip: same route and same name-only hand-over as A4 and A9 | Simple | Pass (Basheer, 2026-10-06) |
| A11 | Urgent-notice pop-up: no urgent notification on Dev; same route as the bell. Not run, for that reason | — | Not run |

### B. Opportunity page tabs and saves (once)

| # | Step | Type | Result |
|---|---|---|---|
| B1 | "New USG m/c" (aster medicity, owner Fazal): Products, Splits, Stakeholders (Ajmal), Documents (the PDF) tabs all show names | Simple | Pass (Basheer, 2026-10-06) |
| B2 | "usg m/c" (aster medicity) → Products: add a line, change its product, remove it. Right product name after each save | Complex | Pass (Basheer, 2026-10-06) |
| B3 | "usg m/c" → Splits: change the percentages, save; put them back, save. Names stay filled | Complex | Pass (Basheer, 2026-10-06) |
| B4 | "usg m/c" → Stakeholders: add one, edit its role, remove it. Name shown after each save | Complex | Pass (Basheer, 2026-10-06) |
| B5 | "usg m/c" → Documents: upload a small file, open it, delete it. Then Product Catalogue → a product with documents: list and uploader names show | Complex | Pass (Basheer, 2026-10-06) |

### C. Comment threads, from each place they appear

| # | Step | Type | Result |
|---|---|---|---|
| C1 | Opportunity "New opportunity for hospital pick" (Al Shifa) → Activity tab → Manager Note of 8 Sep → 6 comments, every writer's name shown | Simple | Pass (Basheer, 2026-10-06) |
| C2 | Customer 360 → Al Shifa Hospital Perinthalmanna → Activity → hospital-level Manager Note of 9 Sep → 2 comments, writers' names shown | Simple | Pass (Basheer, 2026-10-06) |
| C3 | Project Directory: no project activity on Dev has a comment; same server request as C1 and C2. Not run unless Basheer adds a comment (permanent on Dev) | — | Not run |

### D. Daily Activity Report

| # | Step | Type | Result |
|---|---|---|---|
| D1 | 27 Aug: 14 cards; names, hospitals and Opportunity names filled | Simple | Pass (Basheer, 2026-10-06) |

## 8. Old-vs-fixed check on Dev — fix 3 (Pipeline), 2026-10-07

Plan step 5 for fix 3. Signed in as Basheer K (SBU Manager, Imaging).
Round 1 on the old code (`3a754f5`); then the fix merged into `main`
(`f7d25b1`), Dev backend restarted, round 2. Claude drove both rounds in
the browser. The cases were written in the handover, not in this plan
before the build (P28); recorded here after the fact.

| # | Check (expected) | Old code | Fixed code | Result |
|---|---|---|---|---|
| P1 | Stage tabs (Lead 26, Qualified 4, Demo 4, Clinical Evaluation 0, Negotiation 6, Order 3, Delivery 0, Payment Pending 2 = 45) | 45 | 45 | Pass |
| P2 | Order tab (3 Fahad cards: ₹30.0L, ₹10.0L, ₹1.0L) | Same 3 cards | Same 3, same order | Pass |
| P3 | Zone North Kerala (total 31) | 31 | 31, same order | Pass |
| P4 | Open "New Fastrack deal direct to Order" (opens at once, same details) | Al Shifa, Order, Active, ₹30.0L, Fahad | Same | Pass |
| P5 | Pipeline Report → SonoScape HD-550 Endoscopy ("Showing: … · N" and its cards) | "· 7 deals", 7 cards | Same 7, same order | Pass |

North Kerala split, both rounds: Lead 17, Qualified 2, Demo 3, Clinical
Evaluation 0, Negotiation 4, Order 3, Delivery 0, Payment Pending 2.

Server side (`scripts/query_audit.py --only /opportunities/pipeline`, as
Abdul Latheef (Admin), Vivek (SBU Manager) and Basheer K): 15 of 15
responses identical.

| View | Joins, old → fixed | Planning time, old → fixed |
|---|---|---|
| Unfiltered | 36 → 11 | 167–182 → 18–21 ms |
| Zone | 37 → 12 | 250–259 → 33–35 ms |
| Stage | 36 → 11 | 103–110 → 13 ms |
| Team only | 36–37 → 11–12 | 68–164 → 6–21 ms |
| Product | 36 → 11 | 248–276 → 24 ms |

Seen on both rounds (existing, Backlog): the zone picker shows "No
options" until a zone name is typed; cards with the same priority and
chance can swap order.

## 9. Full Dev comparison — fix 3 (Pipeline), approved 2026-10-08

Why: UAT trip 3 (`569209f`, 2026-10-08) timed only the plain Pipeline;
section 8 compared five views. This closes the gap with the step 7 "step
0" list (Basheer, 2026-10-08). Method: the comparison tool
(`scripts/query_audit.py`) runs the server code in-process from the folder
it sits in, so the old code runs from a separate copy and the Dev server
is not touched or restarted. Read-only on Dev. Between `3a754f5` (old) and
`f7d25b1` (fix) only `opportunity/repository.py` and its test changed.

Users, every Pipeline view: Abdul Latheef P (Admin), Basheer K (SBU
Manager), Vivek (Sales Staff), one Dev Area Manager (looked up in step 2).

| # | View | Where users reach it | Compared before |
|---|---|---|---|
| 1 | No filter | Pipeline screen | Yes (section 8) |
| 2 | One stage | Stage tab, report click-through | Yes |
| 3 | One zone | Pipeline filter, report click-through | Yes |
| 4 | Team only | Every report click-through | Yes |
| 5 | One product | Pipeline Report, Product Performance | Yes |
| 6 | One owner | Pipeline filter, Sales Report | New |
| 7 | One brand | Product Performance "By Brand" | New |
| 8 | One status (Won) | Report click-throughs by status | New |
| 9 | One SBU | Pipeline filter, report click-through | New |
| 10 | One account | Pipeline opened from an account | New |
| 11 | Exact zone only | Zone filter without sub-zones | New |
| 12 | With trade-in; with no products | Pipeline quick filters | New |
| 13 | Closed between two dates | Sales Report click-through | New |
| 14 | Team only + product together | A report click-through as sent | New |
| 15 | Opportunity page | Opened from a card (reuses card data) | New |

The card updating after a save on the Opportunity page asks the server
nothing new: the app writes the saved values onto the card list it already
holds. That list is the answer to views 1–14, so it is covered if all of
them match.

Checklist:
- [x] 1. List approved (Basheer, 2026-10-08).
- [ ] 2. Add views 6–15 and the Area Manager to the tool (permanent; show
  the change first); find each view's record read-only on Dev (busy owner,
  brand, account; Won status; a date range with closed Opportunities).
- [ ] 3. Separate copy at `3a754f5` under `.claude/worktrees/`; copy in
  `backend/.env` and the updated tool for the run.
- [ ] 4. Old code: run the tool from the copy, `--save-responses`.
- [ ] 5. Fixed code: run from the main folder straight after,
  `--compare-responses`; re-run any differing view once (a Dev save
  between runs gives a false difference).
- [ ] 6. Delete the copy, the `.env` copy and temporary files.
- [ ] 7. Plain-language report: matched / differed and why / any view
  slower. Results go in this section.
- [ ] 8. Basheer decides UAT: all match → fix 3 closed; real difference →
  rollback or correction in the next early-morning window (sooner if
  users would notice).
- [ ] 9. Paperwork, each with its own approval: merge `uat` back into
  `main` (resolve to `main`: 11 joins and its filters; pytest; push;
  then remove `.claude/worktrees/uat-fix3` and the local `uat` branch);
  the tool change as its own commit; results in the docs batch.
