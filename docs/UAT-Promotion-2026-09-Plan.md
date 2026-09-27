# UAT Promotion — September 2026 — Plan

**Status:** **Done 2026-09-27.** UAT on `143c78e`, `alembic current` =
`0054 (head)`; all after-move checks and the smoke test passed; team told.
One unplanned fix: the backend's Render Build Command now pins SQLAlchemy
below 2.1. Haroon's catalog spot-check (step 10) still pending, tracked in
Backlog. Execution log and retro: Progress-Archive 2026-09-27 "UAT move
(main → uat, `143c78e`)".
**Decision:** Basheer, 2026-09-26 — everything demoed to Latheef Bhai and
Haroon on 2026-09-24 is cleared for UAT; no features held back. This closes
the Backlog entry "main → UAT promotion — waiting on leadership's park list".
**Why now:** unblocks the SonoScape vendor report (needs the Brand/Category/
Model catalog on UAT) and keeps the ~2 Oct hospital-wise planning rollout
small, instead of stacking it on top of this much larger move.

---

## 1. In plain words

UAT is running a version of the app from mid-September. Everything built
since — Target Planning with approval, brand-wise targets, the cleaned-up
product catalog (brand → category → model instead of hand-typed names),
reports and drill-downs, High Priority deals, lead comments, split editing,
and many fixes — moves across in one go.

Two things happen:
1. **The app's code is updated** (both screens and server). Render does this
   automatically a few minutes after the push.
2. **UAT's database is updated with 13 changes.** Ten only add new fields or
   tables. Two matter:
   - **The product catalog clean-up** rewrites every product so it points at
     its brand, category and model. The 26 Sep check showed UAT's product
     list is exactly what the clean-up expects, so it should go smoothly.
     Seven products you decided to drop on 21 Sep are retired (five deleted;
     the two wall-mount stands switched off but kept, because 3 deal lines
     use them). One new product, EDAN F9, is added.
   - **Tighter access rules** on activities, leads, documents and
     notifications — closes loopholes the app never used; nothing a user
     does today should change.

**Safety net:** a fresh backup is taken just before. If anything goes wrong,
UAT is restored from it. No full dress rehearsal — decided unnecessary
because the product check came back clean (see section 3).

**Downtime:** the code and database updates themselves take about 10
minutes, but checking the catalog properly and leaving room to roll back
needs more. Tell the team **one hour** (Basheer, 2026-09-27); it will
likely be back sooner. Both Render services are **suspended** for the whole
move, so nobody can save anything while it runs (Basheer, 2026-09-27).

---

## 2. Scope

- **Code:** `origin/uat` `7ddd439` → **`143c78e`** (Basheer, 2026-09-27),
  the last commit before the Brand-report work (`b4d6f18` onwards), which
  is still mid-testing and follows in a later move. `fc76145` → `143c78e`
  adds only docs and the vendor report script (`de48ca6`, run by Claude,
  not used by the app); no new migrations. Clean fast-forward: UAT has no
  commits of its own (`origin/main..origin/uat` = 0, re-checked 2026-09-27).
- **No dependency or settings changes:** `backend/pyproject.toml`'s
  dependency list, `sales-os-app/package.json` and backend config are
  identical between the two branches (`pyproject.toml` differs only by a
  3-line lint exception for migration 0049, from `cd0d8ab`). No new env vars on Render.
- **Database:** UAT `alembic current` = `0041` (read 2026-09-26). Runs
  `0042` → `0054`:

| Rev | What | Touches existing rows? |
|---|---|---|
| 0042 | `opportunity.high_priority_manual` | No (new column, default false) |
| 0043 | `opportunity.closed_at` | No (nullable, no backfill) |
| 0044 | Target plan approval columns + RLS | No live target plans on UAT |
| 0045 | Target plan decision note + read-RLS fix | No |
| 0046 | Tighten 4 RLS policies (activity, marketing_lead, document, notification) | Changes access, not data |
| 0047 | `marketing_lead_comment` table + RLS | No |
| 0048 | `brand` / `category` / `model` tables + RLS | No |
| 0049 | **Catalog cutover** — seed 10 brands / 21 categories / 60 models, re-point products, retire 7 | **Yes** |
| 0050 | Catalog read opened company-wide | No |
| 0051 | Legacy placeholder hidden + product SBU trigger fix | Minor |
| 0052 | One active product per model (partial unique index) | No — can't collide (see 3) |
| 0053 | `target_plan_brand_split`, `brand_vendor_target` + RLS | No |
| 0054 | Cross-SBU read fix for 0053 | No |

- **New tables and UAT's `rls_auto_enable()` trigger** (forces RLS on with
  zero policies on any new table — hit on 2026-09-08 with
  `gate_override_reason`): every new table here (`marketing_lead_comment`,
  `brand`, `category`, `model`, `target_plan_brand_split`,
  `brand_vendor_target`) enables RLS and creates its own policies in its
  migration, so the trigger should be harmless. Verified after the run
  anyway (step 6).

---

## 3. Pre-flight (done 2026-09-26)

Read-only product check against UAT (Basheer approved; script
`uat_product_check.py`, session scratchpad):
- 65 products, all active; none created or edited since 2026-09-21.
- All 58 names `0049` matches on are present exactly; no duplicate names
  (so `0049`'s abort-on-duplicate guard won't trip).
- Not on `0049`'s list: EDAN elite V Series, Edan H100B Handheld
  Pulseoxymeter, EDAN i15, EDAN i20, Magnamed Ventmeter (unreferenced →
  deleted); Monitor Wall mount stand (2 deal lines), Wall- Monitor Stand
  (1 deal line) → deactivated under the hidden "Legacy Data" brand. Matches
  the 2026-09-21 decision.
- `0049`'s own list: 59 products → 59 distinct models, so `0052`'s
  one-active-product-per-model index can't fail.

**Conclusion:** no dress rehearsal on a restored copy needed.

---

## 4. Steps on the day

Each step waits for the previous one. **(B)** = Basheer runs it; **(C)** =
Claude runs it after Basheer's go-ahead. UAT-writing steps are Basheer's —
the auto-mode classifier blocks Claude's UAT access, and that's the right
default. Check scripts are in
`C:\Users\Basheer\AppData\Local\Temp\claude\C--Users-Basheer-GitHub-Calicut-Bio-Medicals\b77f7022-d573-40ab-afa8-9c35d7c41815\scratchpad\`.

| # | Who | Step | Time |
|---|---|---|---|
| 1 | B | **Tell the team** UAT will be unavailable for about **1 hour**. | — |
| 2 | B | **Suspend both Render services:** `calicut-bio-medicals` (backend) and `cabio-sales-os-uat-frontend`, each via Settings → **Suspend Service**. From here nobody can save anything; the app shows "unavailable". | 2 min |
| 3 | C | **Check first (read-only):** `uat_product_check.py` must match section 3 exactly (65 products, the same 5 to delete, the same 2 stands to switch off) and UAT must be at `0041`; then `uat_promotion_check.py pre` saves the "before" snapshot. **Anything unexpected → stop** (resume both services; nothing has changed). | 2 min |
| 4 | C | **Fresh backup:** `scripts\backup_uat.ps1`; confirm the new dump and its TOC count. Rollback point at `0041`, taken with the data frozen. | 2 min |
| 5 | B | **Run the 13 database changes** (commands below; they go straight to the database, so they work with the services suspended). If `0049` aborts, it rolls back on its own (single transaction) — stop, don't retry, share the error. | 1 min |
| 6 | C | **Automatic checks (read-only):** `uat_promotion_check.py post` — prints OK/XX per line and "ALL CHECKS PASSED" (details below). Also saves the full catalog listing to `uat_catalog_after_move.csv` (this session's scratchpad). | 2 min |
| 7 | B | **Catalog review:** read the listing line by line for any wrong brand, category, model or product name. Anything wrong → decide: fix forward, or roll back (below). | 10–15 min |
| 8 | B | **Update the code and resume:** `git push origin 143c78e:uat`, then **Resume Service** on both. Confirm in Render that both are Live on `143c78e`; if either still shows the old commit, **Manual Deploy → Deploy latest commit**. | 5–10 min |
| 9 | B | **Smoke test — look only, nothing saved** (UAT is live data): rep — open a deal, click Add product, check the brand → model pickers, then **Cancel**; open Target Planning. Manager — Pipeline and Sales reports load. Admin — Product Catalog shows brand/category/model; Brand Target Tracking loads; Product Performance → By Brand drill-down works. | 10 min |
| 10 | B | **Haroon spot-checks** the Brand / Category / Model lists, then **tell the team** UAT is back, with a short what's-new list (Claude drafts). | his time |

**Step 5 commands** (Git Bash, from the repo root):
```bash
set -a; source backend/.env.uat; set +a
unset CORS_ORIGINS        # 2026-09-08 gotcha: pydantic rejects the non-JSON value
cd backend
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m alembic current     # expect: 0054 (head)
```

**Step 6 checks:**
- `alembic_version` = `0054`.
- Products: 61 rows, 59 active; the 2 stands inactive under Legacy; EDAN F9
  present; every active product has brand/category/model set; no model with
  more than one active product.
- Brands 10 (9 active), categories 21 (20 active), models 60 (59 active).
- Deal data unchanged vs. the step-2 snapshot: opportunity count and value
  total, deal-line count / quantity / price totals, every deal line still
  pointing at the same product record, activity and hospital counts.
- Every new table: RLS on **and** policies present (the `rls_auto_enable`
  check).

**Why the smoke test changed (2026-09-27):** the earlier version said "add
a product line" and "approve/return a target plan" — on UAT those write to
real deals and plans. Every step now looks and cancels instead.

**Why the services are suspended (2026-09-27):** with the backend
running, anyone with the app open could save mid-move, and step 6 would
flag their edit as a false alarm. Suspended, the snapshot, the backup and
the after-move check all see the same frozen data. Suspending only the
frontend isn't enough: an already-open page talks to the backend directly.

**Rollback** (only if step 5, 6 or 7 finds a problem that can't be fixed
forward): the new code hasn't gone live yet, so restore the step-4 dump
with `scripts\restore_uat.ps1` and **resume both services on the old
code**; no force-push needed. If a problem only shows after step 8, also
`git push --force origin 7ddd439:uat` to put the old code back. Basheer's
call, on the day.

---

## 5. After the move (paperwork, same day)

- This doc → record the real outcome (execution log, like
  `docs/UAT-Migration-2026-09-08.md`).
- Remove the Backlog entry "main → UAT promotion — waiting on leadership's
  park list".
- Product-name plan's Status line → "on UAT".
- Progress-Archive entry with a short retro.
- Next: SonoScape vendor report, once Haroon has the inflated deal amounts
  corrected (UAT data-quality report, 2026-09-26).

---

## 6. Open before the day

- **When:** Sunday 2026-09-27, starting around **3 pm** (Basheer), leaving
  the rest of the afternoon to recover if anything goes wrong.
- Check scripts read by Claude 2026-09-27; `uat_promotion_check.py` gained
  the catalog listing for step 7 the same day.
