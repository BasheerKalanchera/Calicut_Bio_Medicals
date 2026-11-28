# UAT Promotion — 29 November 2026 — Plan

**Status:** Approved 2026-11-27 (Basheer). Move on Sun 29 Nov, 07:00 IST.
**Traceability rows:** none change status by the move itself; each
feature's own row already records it.
**Design / discussion:** model `docs/UAT-Promotion-2026-11-Plan.md` (10 Nov
move); procedure `docs/Deployment-Topology.md`; request: Build & Test's
handover note, "UAT move, Sunday 29 Nov" (27 Nov).

## Decisions

- D0. **Full move**, replacing the date picker hotfix; includes the date fix
  `ba67000` and the header name `2ac7f25` (kept for good) — Basheer,
  2026-11-27
- D1. **Margin Report goes;** no fallback planned. Its E2E passed 54 of 54
  (27 Nov) and only the last formalities remain, done by end of day Sat
  28 Nov — Basheer, 2026-11-27
- D2. **Sales Loss Report is planned to go too.** Its E2E starts once the
  Build session's work is joined into `main` (expected Sat 28 Nov); it goes
  only if its E2E is complete by the Sat 6 pm cut-off, and only with Margin
  — Basheer, 2026-11-27
- D2a. **If Sales Loss isn't complete:** UAT gets `main` as it was just
  before the Build work was joined in. Build & Test finishes every Margin
  fix before that join, on 27 Nov; no message to them needed — Basheer,
  2026-11-27
- D3. **Price sheet:** Haroon's revised sheet if it arrives by end of day Sat
  28 Nov (he is adding product variations Cabio usually sells, with prices
  and cost); otherwise the current sheet — Basheer, 2026-11-27. Basheer asks
  Haroon for it by Saturday afternoon — Basheer, 2026-11-27
- D3a. **Load order on the day:** database changes up to 0067, then the price
  load, then 0068 (and 0069). This follows Margin D12 (Basheer, 2026-11-24).
  It now matters: if the sheet has costs, 0068's one-time fill copies them onto
  old Won lines (marked "cost filled in later"); a load after 0068 would leave
  those lines empty — Basheer, 2026-11-27
- D3b. **New product variations in the revised sheet:** added by the load
  script, Dev first (dry run, then apply, Basheer checks on the screen), then
  UAT on the day with its own yes (Pricing D7) — Basheer, 2026-11-27
- D3c. **If the sheet has no costs (likely, Basheer 27 Nov):** old Won sales
  show on the Margin Report under "No cost entered — not in the margin" until
  a cost is typed. Haroon types each product's cost once on the Product
  Catalog; that first cost fills all of that product's old Won lines, marked
  "filled in later" (Margin D16). Saturday's read-only check (D6) counts how
  many products are on old Won Opportunities, so Haroon knows the size of the
  job — Basheer, 2026-11-27
- D3d. **Costs sent later as a sheet:** the load script also fills that
  product's empty old Won lines, the same way as typing the first cost (only
  empty lines, same mark), tested on Dev first — Basheer, 2026-11-27
- D4. **Load script kept, not in a temporary folder:** rewritten and committed
  to `scripts/` the same day, with no client data inside — the sheet's path
  is given when it runs; removed only once the changes reach UAT. Standing
  rule now in the `cabio-db-and-scripting` skill — Basheer, 2026-11-27
- D4a. **Excel reader:** the load script reads Haroon's Excel file directly;
  its reader (`openpyxl`) is installed only in the app's Python on Basheer's
  computer (`backend/.venv`, not in git), not in the live app's package list
  — Basheer, 2026-11-28
- D4b. **New variations add new models only:** a sheet row whose brand or
  category isn't in the app stops the load, and the preview names it; it is
  added on the screen first — Basheer, 2026-11-28
- D4c. **Revised sheet still has a mistake at 10 pm Sat:** Sunday's load
  uses the current sheet (the 23 Nov one, already passed on Dev); the
  revised sheet is loaded later on its own day, Dev first, then UAT with
  Basheer's yes. New products in the revised sheet carry a "Product type"
  column (New / Refurbished / Accessory); a new row without one is saved as
  New equipment and listed in the preview — Basheer, 2026-11-28
- D5. **When:** Sun 29 Nov, app off 07:00–08:00 IST, told to the team as
  1 hour — Basheer, 2026-11-27
- D6. **No practice run;** a read-only UAT check on Sat 28 Nov afternoon
  (database version, what the changes rely on, and Build & Test's people
  check), with Basheer's yes before connecting — Basheer, 2026-11-27
- D7. **Backup:** Sunday's daily backup is the rollback point if it is taken
  that morning and the step 2 check shows nothing saved after it (as on
  10 Nov); otherwise a fresh one at step 3 — Basheer, 2026-11-27
- D8. **Team message** (Claude drafts Sat once the outcome is known; Haroon
  sends): the hour off; what's new; people who share an Opportunity or hold
  a reminder on it no longer see its Manager Notes. No new passwords —
  Basheer, 2026-11-27. Plus, for Haroon only: past sales stay under "No cost
  entered" on the Margin Report until he types each product's cost (D3c) —
  Basheer, 2026-11-27
- D9. **After the move, Sunday, each with its own yes:** switch off the 13
  unsold products on the screen; Basheer times Weekly Follow-up in F12;
  client scorecard republished with the exact diff shown first — Basheer,
  2026-11-27
- D10. **Sat 6 pm:** Claude reads Build & Test's recorded E2E results and
  git, says which outcome applies and the exact commit; Basheer confirms —
  Basheer, 2026-11-27

## Figures and sources

- UAT is on `0756234` (7 Nov) — `git rev-parse origin/uat`, 2026-11-27
- 100 commits wait on `main` (`origin/uat..origin/main`), a fast-forward —
  `git rev-list --count`, `git merge-base --is-ancestor`, 2026-11-27
- Database changes: 0066, 0067, 0068 on `main`; 0069 on `worktree-build` —
  `git diff --name-status`, 2026-11-27
- UAT database expected at 0065 — November plan outcome (10 Nov); re-read
  on Saturday (D6)
- No new libraries on `main` — `git diff origin/uat origin/main` of
  `pyproject.toml`, `package.json`, `package-lock.json`, empty, 2026-11-27;
  `worktree-build` not yet checked
- Margin commits `18ae6c3`…`1852540`; last earlier commit `3c91f94`; trial
  copy of `ba67000` onto `3c91f94` clean — `git log`, `git merge-tree`,
  2026-11-27
- Margin E2E 54 of 54 Pass — Progress-Archive, 27 Nov (Build & Test)
- E2E results of the other features — each plan's Status line or test plan,
  read 2026-11-27 (section 1)
- Current sheet on Dev: 58 products priced, 13 blank, Cost blank — Pricing
  plan Status line (23 Nov)
- A direct load doesn't fill old Won lines; only a cost typed on the screen
  does — `backend/app/domains/product/repository.py:71`
  (`fill_empty_won_costs`), and 0068's fill — read 2026-11-27

## 1. In plain terms

UAT runs the app as it was on 7 November. Everything built and tested on
Dev since then moves across in one go (E2E on Dev):

- **Customer wording** — "hospital" becomes "Customer" (38 of 38).
- **Product prices and cost** — prices on the catalog (GM and Admin), a
  price line and below-lowest warning on Opportunity lines (51 of 51).
- **Manager Notes private** — seen only by the rep, the writer and the rep's
  managers (26 of 27, 1 not applicable).
- **Switch products off and on** (27 of 27).
- **Marketing Lead discard reason** (12 of 12); small batch of 12 Nov.
- **Keeps what you typed** after a failed "Why this change?" or
  "First activity" save (11 of 11).
- **Date boxes open in the centre** (13 of 13); **your name in the header**.
- **Margin Report** (54 of 54) (D1).
- **Sales Loss Report** — if its E2E is complete by Sat 6 pm (D2).

On the morning: the database gets up to 4 changes; Haroon's prices (and any
new product variations) are loaded in the middle (D3a); the code is
updated. No new passwords.

**Safety net:** the backup (D7). If anything goes wrong, UAT is restored
from it and the old code is put back.

### On a phone

No screen changes beyond what each moved feature already approved.

## 2. Build order

Before the day:
1. Fri 27 Nov: Build & Test finishes the Margin fixes before the join (D2a).
2. Sat: load script rewritten, committed, run on Dev (D3b, D4).
3. Sat afternoon: read-only UAT check, with Basheer's yes (D6).
4. Sat 6 pm: the outcome and exact commit (D10); team message (D8).
5. Sat evening: if Haroon's revised sheet arrived, its Dev load and check.

On the day (**B** = Basheer; **C** = Claude, after Basheer's go-ahead):

| # | Who | Step | Time |
|---|---|---|---|
| 1 | B | Switch off both Render services | 2 min |
| 2 | C | Read-only before-check: UAT at 0065; counts of Opportunities, value total, activities, customers, products | 2 min |
| 3 | C | Backup, or the daily one (D7) | 2 min |
| 4 | B | Database changes up to 0067 | 1 min |
| 5 | C | Price load (and new variations): dry run, then apply (Basheer's yes) | 5 min |
| 6 | B | Remaining database changes (0068, and 0069 if Sales Loss goes) | 1 min |
| 7 | C | After-checks: "ALL CHECKS PASSED" or stop | 2 min |
| 8 | B | Push the code, switch both services on, confirm both Live on that commit | 5–10 min |
| 9 | B | Smoke test, look only (section 3) | 15 min |
| 10 | B | Tell Haroon UAT is back; D9 items | — |

**Rollback** (steps 4–7 fail, or step 9 finds a problem that can't be fixed
forward): restore the backup with `scripts\restore_uat.ps1`; if the code was
already pushed, push `0756234` back. Basheer's call on the day.

## 3. What could be affected

Smoke test (step 9), look only (open and **Cancel**, never save). People
to re-check against UAT's User Directory on Saturday:

- **A rep (Imaging):** screens say "Customer"; an Opportunity line shows
  the price line; Log Activity's date box opens in the centre; Cancel.
- **Basheer K (Admin):** Product Catalog shows prices and cost, "Show
  inactive"; Margin Report loads (if it went); Sales Loss Report loads (if
  it went); name in the header.
- **Haroon Sidheeq (GM):** Product Catalog prices; a Manager Note he wrote
  still shows.

## 4. Not in this plan (with reasons)

- Activity Type table, payment terms — not built yet.
- User Manual and in-app help — own move later (User Manual plan D15).

## 5. Business rules and records to update

After the move, same day: this doc records the outcome; each moved plan's
Status line says "on UAT 2026-11-29"; Progress-Archive entry and retro;
scorecard updated and both pages republished (D9).

## 6. Technical addendum

| Rev | What | Touches existing rows? |
|---|---|---|
| 0066 | `product`: 5 price columns, nullable, non-negative check | No |
| 0067 | `activity_select` policy replaced; Manager Notes narrowed | No (who can read) |
| 0068 | `opportunity_item.cost_at_won_lakhs`, `cost_filled_in_later`; one-time fill from catalog cost, audit triggers paused | Won lines, only where the product has a cost |
| 0069 | `opportunity.competitor_product_name`, nullable | No |

- `backend/alembic/env.py` runs each `upgrade` call in one transaction.
- Step 4: `alembic upgrade 0067`; step 6: `alembic upgrade head` (commands
  as in the November plan, section 6, with `backend/.env.uat`).
