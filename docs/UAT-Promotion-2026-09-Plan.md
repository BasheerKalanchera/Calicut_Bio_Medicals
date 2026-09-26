# UAT Promotion — September 2026 — Plan

**Status:** Draft, 2026-09-26. Not started — nothing has touched UAT yet
except one read-only product check (below).
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

**Downtime:** a few minutes between the code update and the database update
when parts of the app will show errors. Do it at a quiet time and tell the
team beforehand.

---

## 2. Scope

- **Code:** `origin/main` → `origin/uat`, 104 commits (30 feat/fix) as of
  2026-09-26, `origin/uat` `7ddd439` → `origin/main` `fc76145`. Clean
  fast-forward: UAT has no commits of its own (`origin/main..origin/uat` = 0).
  Re-check the count on the day — `main` keeps moving.
- **No dependency or settings changes:** `backend/requirements.txt`,
  `sales-os-app/package.json` and backend config are identical between the
  two branches. No new env vars on Render.
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
default.

1. **(B) Tell the team** UAT will be unavailable for ~15 minutes.
2. **(C) Re-run the product check** (read-only). Proceed only if it matches
   section 3 exactly. Anything new → stop and review.
3. **(C) Fresh UAT backup** — `scripts\backup_uat.ps1` (now writes to
   `C:\Backups\CabioUAT\DB_Backups`). Confirm the new dump and its TOC count.
   This is the rollback point at revision `0041`.
4. **(B) Push the code:** `git push origin main:uat`. Wait until Render shows
   both `calicut-bio-medicals` (backend) and `cabio-sales-os-uat-frontend`
   Live. From here until step 5 finishes, catalog and target screens will
   error — expected.
5. **(B) Run the 13 database changes** (Git Bash, from the repo root):
   ```bash
   set -a; source backend/.env.uat; set +a
   unset CORS_ORIGINS        # 2026-09-08 gotcha: pydantic rejects the non-JSON value
   cd backend
   .venv/Scripts/python.exe -m alembic upgrade head
   .venv/Scripts/python.exe -m alembic current     # expect: 0054 (head)
   ```
   If `0049` aborts, the whole migration rolls back on its own (single
   transaction) — stop, don't retry, and share the error.
6. **(C) Post-move checks** (read-only script, written before the day):
   - `alembic_version` = `0054`.
   - Products: 61 rows, 59 active; the 2 stands inactive under Legacy; EDAN
     F9 present; every active product has brand/category/model set.
   - Brands 10 (9 active), categories 21 (20 active), models 60 (59 active).
   - Deal lines and deal totals unchanged vs. the step-2 run (same count of
     `opportunity_item`, same sum of `extended_value_lakhs`).
   - Every new table: RLS on **and** policies present (the `rls_auto_enable`
     check).
7. **(B) Smoke test**, 3 logins (rep / manager / Admin), per
   `docs/Deployment-Topology.md`:
   - Rep: open a deal, add a product line — brand → model pickers work.
     Open Target Planning, see own quarter.
   - Manager: approve/return a target plan; Pipeline and Sales reports load.
   - Admin: Product Catalog lists brand/category/model; Brand Target
     Tracking loads; Product Performance → By Brand drill-down works.
8. **(B) Haroon spot-checks** the Brand / Category / Model lists (plan's
   "second reviewer" step).
9. **(B) Tell the team** UAT is back, with a short what's-new list.

**Rollback** (only if step 5 or 6 fails in a way that can't be fixed
forward): restore the step-3 dump with `scripts\restore_uat.ps1`, then
`git push --force origin 7ddd439:uat` to put the old code back. Both
Basheer's call, on the day.

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

- **When:** Basheer picks a quiet slot (weekend or evening).
- Post-move check script (step 6): Claude writes it in advance; shown
  before use.
