# UAT Promotion — October 2026 — Plan

**Status:** Done 2026-10-25 — UAT on `8b2ec8a`, database at 0063; outcome
in section 7. Approved 2026-10-24 (Basheer).
**Traceability rows:** none change status by the move itself; each
feature's own row already records it.
**Design / discussion:** model `docs/UAT-Promotion-2026-09-Plan.md`;
procedure `docs/Deployment-Topology.md` ("Fresh-install check", "Weekly
batch promotion"); Query Load Fixes plan section 9.

## Decisions

- D1. **What goes:** everything on `main` when the Annual Target Planning
  Part 1 E2E finishes (with its small-fixes batch); no feature held back.
  Next Action Rules is the reason for the move (Haroon wants it live) —
  Basheer, 2026-10-24
- D2. **When:** the move starts once the Part 1 E2E is finished and
  committed; the manual and in-app help follow a day or two later in their
  own move (User Manual plan D15) — Basheer, 2026-10-24
- D3. **First step:** Query Load plan section 9, steps 2–9 (check UAT's
  separate Pipeline fix against `main`'s, then fold UAT's copy back into
  `main`) — Basheer, 2026-10-14
- D4. **No new app code lands on `main` between the end of the Part 1 E2E
  and the move** (Annual Target Part 2 and My Work steps 2–5 wait, or are
  built in the `/build` copy and merged after) — Basheer, 2026-10-24
- D5. **Dress rehearsal on a copy:** restore that morning's UAT backup into
  a throwaway database on the laptop, run all 9 database changes there and
  run the after-move checks against it. About 20–30 minutes; never touches
  UAT. (Lighter option: skip it, as in September.) Do it — Basheer,
  2026-10-24
- D6. **Read-only check of UAT the day before** (with Basheer's go-ahead
  on the day): which database version it is on, the stage list, how many
  open next actions there are, target plans by status — Basheer,
  2026-10-24
- D7. **Downtime:** both Render services suspended for the whole move;
  tell the team **one hour** (same as September) — Basheer, 2026-10-24
- D8. **Day and time:** early morning, Sunday 2026-10-25, before the team
  starts — Basheer, 2026-10-24
- D9. **Team message** (Claude drafts, Haroon sends): what's new; Won now
  only from the new "Payment Pending" stage; old open next actions to be
  closed first (Next Action Rules D8) — Basheer, 2026-10-24
- D10. **Render's temporary SQLAlchemy pin** stays during the move and is
  removed as the last step (step 11), once UAT runs fine on the new code,
  which carries its own cap (`0ffe00c`) — Basheer, 2026-10-24
- D11. **Client scorecard republish** (both pages) after the move: first
  update the scorecard with the features moved to UAT, then republish
  (exact diff shown first) — Basheer, 2026-10-24

## Figures and sources

- `main` is 286 commits ahead of UAT — `git rev-list --count`,
  2026-10-24
- 6 fixes sent straight to UAT since 27 Sep (`a430152`, `fa61bd8`,
  `34737e7`, `4e8c47d`, `30d545f`, `569209f`); the first 5 are already in
  `main` (fold-back `18b9148` and earlier), only `569209f` is not —
  `git log 143c78e..origin/uat`, `git merge-base --is-ancestor`,
  2026-10-24
- 9 database changes, 0055–0063 — files in `backend/alembic/versions`
  that differ between `origin/uat` and `origin/main`, 2026-10-24
- UAT database expected at 0054 — September plan's outcome (27 Sep); to
  be re-read in D6
- Part 1 E2E 40 of 64 Pass — commit `38c0c58`, 23 Oct
- No new dependencies: only the SQLAlchemy cap (already pinned on Render)
  and lint settings differ in `backend/pyproject.toml`; `package.json`
  differs only in its type-generation script — `git diff origin/uat
  origin/main`, 2026-10-24
- Feature list in section 1 — each plan's Status line and the Plan &
  Chore handover, 2026-10-24
- Newest UAT backup `cabio_uat_2026-10-24_1039.dump` — backup run,
  2026-10-24

## 1. In plain terms

UAT runs the app as it was on 27 September, plus six urgent fixes sent
across separately between 1 and 8 October. Five of them are already back
in the main copy; the 8 October Pipeline fix is folded back in step 1. Everything built and tested on
Dev since then moves across in one go:

- **Next Action Rules** — the rules for when a follow-up must be logged,
  including closing several at once.
- **Annual Target Planning, Part 1** — yearly brand targets, seasonal
  patterns, and quarterly targets per person; SBU Target and Team Targets
  as their own cards.
- **Target vs Actuals and hospital-wise target plans** — planned
  hospitals, visit frequency, the SBU target the GM enters, the team
  roster.
- **Payment confirmation before Won** — a new last stage, "Payment
  Pending"; an Opportunity can be marked Won only from there, with "full
  payment received" ticked.
- **Audit Trail redesign** — the history shows only what really changed,
  and covers more records.
- **Win Probability rule and one create form** for Opportunities.
- **Rep plan wording**, **duplicate-hospital warning** (Part A), and the
  app opening on Account Management, with a new hospital opening its own
  page.
- **Reports** — Pipeline, Sales Report and Dashboard show Active
  Opportunities only, with Brand and Zone breakdowns and counts on the
  bars; Insights Dashboard sections as tabs, with Plan vs Actuals.

Two things happen on the day:
1. **The database is updated with 9 changes.** Eight only add new fields,
   tables or access rules. The ninth replaces how the history log records
   changes; old history stays as it is. One adds the "Payment Pending"
   stage. None rewrites existing Opportunities, hospitals or activities.
2. **The app's code is updated**, screens and server, by Render a few
   minutes after the push.

**What users will notice:** Opportunities at Delivery & Installation must
move to Payment Pending before they can be marked Won; old open next
actions should be closed first (the team message says how).

**Safety net:** a fresh backup just before the change, and the dress
rehearsal on a copy (D5). If anything goes wrong, UAT is restored from the
backup and the old code is kept.

## 2. Build order

Before the day:
1. Query Load section 9, steps 2–9 (D3): compare the two Pipeline fixes
   on Dev, then fold UAT's copy back into `main` (own commit, own
   approval) and remove the old working copy.
2. Part 1 E2E finished, small fixes committed, post-commit checklist done
   (Build & Test).
3. Fresh-install check the day before (Deployment-Topology): the backend
   built from scratch on the laptop exactly as Render does, and it starts.
4. RLS / role smoke test on Dev: section 3's 14 steps, same people,
   Abdul Latheef P as Admin, step 2 as Vivek (Rudrappa has no next
   actions on Dev; read-only Dev query, 2026-10-25); no SBU Manager check (none on UAT; Basheer,
   2026-10-24), look only.
5. Read-only UAT check (D6), with your go-ahead.
6. Claude writes the after-move check script (scratchpad) and the team
   message (D9); you send Haroon the date.

On the day (**B** = Basheer runs it; **C** = Claude, after your go-ahead):

| # | Who | Step | Time |
|---|---|---|---|
| 1 | B | Tell the team UAT is unavailable for about **1 hour** | — |
| 2 | B | Suspend both Render services (`calicut-bio-medicals`, `cabio-sales-os-uat-frontend`) | 2 min |
| 3 | C | Read-only "before" check: UAT at 0054, saves counts of Opportunities, value total, activities, hospitals, target plans. Anything unexpected → stop and resume | 2 min |
| 4 | C | Fresh backup (`scripts\backup_uat.ps1`) — the rollback point | 2 min |
| 5 | C | Dress rehearsal (D5): restore that backup into a throwaway local database, run the 9 changes and the step-7 checks there. Any failure → stop and resume, UAT untouched | 20–30 min |
| 6 | B | Run the 9 database changes on UAT (commands in section 6) | 1 min |
| 7 | C | After-move checks (read-only), "ALL CHECKS PASSED" or stop | 2 min |
| 8 | B | Push the code (`git push origin <commit>:uat`), resume both services, confirm both are Live on that commit | 5–10 min |
| 9 | B | Smoke test, look only, nothing saved (section 3) | 15 min |
| 10 | B | Tell the team UAT is back; Haroon sends the message (D9) | — |
| 11 | B | Render `calicut-bio-medicals` → Settings → Build Command back to `pip install .`; let it redeploy and confirm it is Live and the health check answers (D10) | 5–10 min |

**Rollback** (step 6 or 7 fails, or step 9 finds a problem that can't be
fixed forward): restore the step-4 backup with `scripts\restore_uat.ps1`;
if the code was already pushed, also push the old UAT commit back.
Basheer's call on the day. Rolling back loses anything saved after step 8.

## 3. What could be affected

All screens changed since 27 Sep. Smoke test (step 9), look only (UAT is
live data; open and **Cancel**, never save). One real person per role
and SBU, from UAT's User Directory (read-only query, 2026-10-24); UAT has
no SBU Manager (Basheer, 2026-10-24). Basheer signs in as each:

- **Rudrappa Deevatagi** (Imaging rep, reports to Shruthi):
  1. The app opens on **Account Management** (everyone except the
     Marketing User).
  2. **Next Actions:** the list loads; **Mark to complete** on one row
     opens "Close Next Action"; Cancel.
  3. **Pipeline:** a **Payment Pending** column; Imaging Opportunities
     only.
  4. **+ Lead** (top bar): the "New Opportunity" form opens; Cancel.
  5. **Account Management → + Add:** typing "Aster" shows the
     similar-name warning (it lists up to 5 similar hospitals in the
     rep's own zone, which the form fills in — not every Aster); Cancel,
     never Create.
  6. **Target & Coverage Planning:** loads; no SBU Target card.
- **Vivek** (Critical Care rep, reports to Arun Adarsh):
  7. **Pipeline:** Critical Care Opportunities only, none from Imaging.
- **Shruthi** (Imaging Area Manager):
  8. **Target & Coverage Planning:** Team Targets and Team Plans show her
     team (Dhanushma, Om Hiremath, Ravi Kumar, Rudrappa), Quarterly and
     Annual views; no SBU Target card.
  9. **Target vs Actuals:** loads, Imaging only.
- **Arun Adarsh** (Critical Care Area Manager):
  10. **Target vs Actuals:** loads, Critical Care only.
- **Basheer K** (Admin on UAT; Basheer's own login):
  11. **Brand Target Tracking:** loads, with the yearly targets.
  12. **Audit Log:** opens; a filter works.
  13. **Target & Coverage Planning:** the SBU Target card shows both SBUs.
- **Haroon Sidheeq** (GM):
  14. **Target vs Actuals:** both SBUs and the company row.

## 4. Not in this plan (with reasons)

- User Manual PDF and in-app help — own move a day or two later (D2, User
  Manual plan D15); the help editor isn't built yet.
- Query Load fix 4 — after this move, no date set (Basheer, 2026-10-14).
- Annual Target Part 2 and My Work steps 2–5 — not built.

## 5. Business rules and records to update

After the move, same day: this doc records the real outcome; each moved
plan's Status line says "on UAT"; Progress-Archive entry and retro;
delete `.claude/dq-check-paused` and run the UAT data-quality check (ask
first, Next Action Rules plan step 5). After step 11: Deployment-Topology's
"Render backend Build Command" line and Backlog "finish the SQLAlchemy cap
follow-ups" item (1) updated. Scorecard updated with the moved features,
then both pages republished (D11).

## 6. Technical addendum

- Code: `origin/uat` `569209f` → the `main` commit at the end of the Part
  1 E2E (after step 1's merge, a fast-forward).
- Migrations:

| Rev | What | Touches existing rows? |
|---|---|---|
| 0055 | `account` Business Potential columns, `target_plan` DRAFT + `change_note`, `target_plan_account` + RLS, `cabio_app_plan_overlap()` | No (new columns with defaults; status check widened) |
| 0056 | `target_plan.previous_approved_total_lakhs` | No |
| 0057 | Stage `PAYMENT_PENDING` (order 80) + full-payment who/when columns | Adds 1 stage row |
| 0058 | `opportunity.full_payment_note` | No |
| 0059 | Audit trigger v2, more tables audited | No (old log kept; downgrade deletes INSERT history — back up first) |
| 0060 | `opportunity.po_date`, `sbu_target` + RLS | No |
| 0061 | `sbu_target` read policy for Area Managers | No |
| 0062 | `brand.year_start_month` (default January), `brand_annual_target`, `sbu_seasonal_pattern`, `person_quarter_target` + RLS | Brands get the default |
| 0063 | `person_quarter_target` delete policy | No |

- Every new table enables RLS and creates its policies in its own
  migration, so UAT's `rls_auto_enable()` trigger is harmless; checked
  again in step 7.
- Step 6 commands (Git Bash, repo root):
  ```bash
  set -a; source backend/.env.uat; set +a
  unset CORS_ORIGINS
  cd backend
  .venv/Scripts/python.exe -m alembic upgrade head
  .venv/Scripts/python.exe -m alembic current     # expect: 0063 (head)
  ```
- Step 7 checks: `alembic_version` = 0063; counts and value totals equal
  step 3's; stage list has Payment Pending at order 80; every new table
  has RLS on and policies present.

## 7. Outcome (2026-10-25)

- Steps 1–11 done the same morning; UAT back for the team after Haroon's
  message. 13 features moved (plan Status lines say "On UAT 2026-10-25").
- Step 3 before-check: UAT at 0054; 701 hospitals, 216 Opportunities,
  1,750 activities; 15 target plans. Step 4 backup
  `cabio_uat_2026-10-25_0727.dump` (also copied to Google Drive by
  Basheer).
- Step 5 rehearsal first failed: the restore script's "database ready"
  check passed too early on a fresh copy. Fixed in `scripts/restore_uat.ps1`
  (asks over the network instead), rerun passed.
- Steps 6–7: 0054 → 0063 applied by Basheer; after-check ALL PASSED,
  counts and value totals unchanged, Payment Pending at order 80.
- Step 8: `uat` 569209f → 8b2ec8a (fast-forward); both services Live.
- Step 9: 14 of 14 passed. Found: the Marketing User appeared on Target
  vs Actuals' people list for Haroon and Basheer K (an SBU left on his
  login from before BR-ORG-03). Re-saved in the User Directory on UAT;
  code fix in Backlog (Target vs Actuals follow-ups).
- **Order changed:** step 11 ran before step 10 (Basheer), so the team was
  told only after the rebuild: Build Command `pip install .`, SQLAlchemy
  2.0.55, Live 08:15.
- After the move: Target vs Actuals' quarter picker overflows its card on
  a phone — Annual Target plan D77, fixed in Part 2.
