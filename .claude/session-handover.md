# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

## Zone tree in reports — built, E2E paused at step 1 (2026-09-27)

- Plan `docs/Zone-Tree-In-Reports-Implementation-Plan.md` (approved; both
  small choices confirmed). Test plan `…-Manual-E2E-Test-Plan.md` has Dev's
  real numbers (checked read-only as Haroon). Checkpoint commit — see
  `git log`. pytest 994 pass, tsc clean, lint 0 errors, `/code-review`
  medium: no findings.
- **Next:** Basheer runs E2E steps 1–8 (all Simple, start as Haroon);
  step 1 was handed over but paused for the UAT move, no result yet.
  Claude records results, then feature commit + post-commit checklist.
- End-of-testing list (existed before, from the review): reports' own
  zone filter is exact-zone (unused by any screen); Sales breakdown would
  drop a Won deal with no products (Won requires products).
## UAT promotion (main → uat) — steps 1–9 done, UAT live (2026-09-27)

- Plan: `docs/UAT-Promotion-2026-09-Plan.md`. Full record of steps 1–9:
  Progress-Archive 2026-09-27 "UAT move (main → uat, `143c78e`)".
- **Done:** UAT database applied, `alembic current` = `0054 (head)`; all
  after-move checks passed; both Render services Live on `143c78e`
  (backend Build Command now pins SQLAlchemy below 2.1 — see Backlog
  "Cap SQLAlchemy below 2.1"); look-only smoke test passed. Rollback
  point: `C:\Backups\CabioUAT\DB_Backups\cabio_uat_2026-09-27_pre-move-0041.dump`.
- SonoScape report (39 deals, 40 rows) and an all-open-Imaging version
  (70 deals, 31 no-product rows shaded) are on Basheer's Desktop; covering
  note to Haroon drafted in chat. Basheer sends.
- **Next:** step 10 — Haroon spot-checks Brand/Category/Model lists and
  the seven odd names (Progress-Archive entry lists them); then Claude
  drafts the team's what's-new message (mention: UAT Pipeline Report
  leaves out deals with no products until the next move). Then section 5
  paperwork (plan outcome, remove Backlog "main → UAT promotion" entry,
  product-name plan Status → "on UAT") and commit.

## Hospital-wise target planning — plan approved (2026-09-27)

- Discussion doc: `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
  (Design C; all open questions answered 2026-09-27, section 5).
- Plan: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
  (approved 2026-09-27, choices answered in section 3).
- **Deadline:** on UAT around 2 Oct 2026; fallback decision around 29 Sep.
- **Next:** build Part 1 (plan section 4 order) — unblocked: the main → UAT
  move, including the catalog clean-up, is on UAT (2026-09-27).
