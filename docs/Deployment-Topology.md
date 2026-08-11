# Deployment Topology — Dev / UAT / Prod

**Status:** Decided, not yet executed — no accounts/projects created as of 2026-07-14.

**Revision (2026-07-25) — two-phase rollout, deferring the Pro spend:** rather than upgrading to
Supabase Pro and creating all 3 projects up front, **Dev and UAT run on the free tier** (2
projects fit within the free cap) while RLS (Phase 2E) is built and proven out with the Cabio
Star Sales team. The **Pro upgrade and Prod project creation are deferred until after UAT
sign-off** — no reason to pay for Prod-tier infrastructure before Prod is actually needed.
Auto-pause (free tier's 7-day-inactivity pause) was raised as a risk and ruled out: the Star
Sales team will use UAT daily once it starts, so the inactivity window is never reached.

---

## Purpose

Milestone 1 gap-closure is complete (`42fa050`) and the demo is scheduled for
July 20. After that, the plan is to roll the app out to a small pilot group
of star sales reps — real users, real customer data — while Milestone 2
development continues. This doc records why a single shared environment is
no longer sufficient, the 3-tier topology decided on, and the hosting choices
behind it.

---

## Why a single environment stopped being enough

Today everything — active development and the manual verification Basheer
does himself — runs against one shared Supabase project (`backend/.env`,
flagged in `CLAUDE.md` as live and not disposable). That was fine while the
only audience was Basheer. It stops being fine the moment real pilot reps
depend on the data being there and correct, because Milestone 2 work
(stalled-opportunity detection, delivery/handover fields, RLS itself — the
latter has since landed, see the Open Items update below) means **active
schema migrations will keep happening at the same time pilot reps are using
the app.** Without separation, every migration's first real test would be
production, on top of real pipeline data.

This mirrors Basheer's own enterprise background running dev/UAT/prod for
prior employers — the same pattern, right-sized for this project's scale.

---

## Approved Decisions

| Decision Area | Approved Approach |
|---|---|
| Environment count | 3 tiers: Dev, UAT (bugfix/staging), Prod |
| Dev | The **existing** Supabase project — reused as-is, no new project. **Free tier.** |
| UAT | New Supabase project — migrations land here first, mirrors Prod config, realistic-but-fake data. **Free tier** (Dev + UAT = 2 projects, within the free cap). |
| Prod | New Supabase project — pilot reps only, no ad-hoc writes, migrations only after UAT sign-off. **Created only once UAT signs off; requires the Pro upgrade at that point (3rd project exceeds the free cap).** |
| Frontend hosting | **Render Static Sites** (free) for UAT and Prod |
| Backend hosting | UAT: **Render Web Service, Free tier** (actual — spins down after ~15 min idle; mitigated by an external keep-alive ping, see "Keep-alive" below). Prod: planned **Starter tier** ($7/mo), which does not spin down. |
| Frontend hosting — rejected option | Vercel — Hobby tier's ToS explicitly prohibits commercial use ("personal or non-commercial use" only); Pro tier ($20/mo/seat) would have worked but is an unnecessary extra vendor once Render already hosts the backend |
| Local Dev hosting | Stays local — `uvicorn`/`npm run dev` against the Dev Supabase project, no hosting needed |

---

## Cost — two phases

**Phase A (now — Dev + UAT, free tier):**

| Component | Cost | Notes |
|---|---|---|
| Supabase — Dev + UAT | $0/mo | Free tier, 2 projects, within the free cap |
| Render — backend × 1 (UAT, Free tier) | $0/mo | Spins down after ~15 min idle; mitigated via external keep-alive ping — see "Keep-alive" below |
| Render — frontend × 1 (UAT, static) | $0/mo | Free tier, no commercial-use restriction |
| **Phase A total** | **~$0/month** | |

**Phase B (later — adding Prod, once UAT signs off):**

| Component | Cost | Notes |
|---|---|---|
| Supabase — Pro org plan | $25/mo | Charged once per organization, not per project; required once a 3rd project (Prod) is created |
| Supabase — compute (3 projects × Micro) | $20/mo | $10/mo each; one Micro is covered by the Pro plan's included $10 credit |
| Render — backend × 1 (Prod, Starter) | $7/mo | |
| Render — frontend × 1 (Prod, static) | $0/mo | |
| **Phase B addition** | **~$52/month** | |
| **Grand total once Prod exists** | **~$59/month** | Matches the original single-phase estimate — this plan only changes *when* the spend starts, not the eventual total |

Supabase's free tier caps at 2 active projects per org and auto-pauses after
a week of inactivity. **Auto-pause is not a concern for UAT here** — the Cabio
Star Sales team will use it daily once testing starts, so the 7-day-idle
threshold never triggers. The Pro upgrade becomes necessary only when Prod
(the 3rd project) is created.

**Keep-alive (Render backend, UAT):** unlike Supabase's 7-day pause, Render's
free-tier web service spins down after ~15 min of *any* idle time (not just
daily-usage-scale gaps), and a cold start after spin-down costs ~30-50s on
the next request — too disruptive during a live walkthrough or ad-hoc
testing. Mitigated with a free external monitor (UptimeRobot) pinging the
unauthenticated `GET /api/v1/health` endpoint on
`https://calicut-bio-medicals.onrender.com` every 5 minutes — safely under
the 15-min spin-down window. No repo code involved; this is third-party
config only. Prod avoids this entirely by running on the Starter tier
(doesn't spin down), so the keep-alive ping is a UAT-only, Phase-A concern.
**Set up and verified 2026-08-03** (UptimeRobot free plan, monitor named
`calicut-bio-medicals.onrender.com`, email alert contact enabled, "No
delay, no repeat"). This mitigates the *idle spin-down* failure mode only —
it is not a general uptime guarantee, and it does not by itself mean the
UAT site is usable yet (no UAT Auth roster exists — see Open Items).

---

## Topology

```
GitHub repo (single source, three long-lived branches)

  feature/*  ──PR──▶  main   (Dev, local — Milestone 2 integration, unchanged workflow)
                         │
                         │  merge when a batch is ready for real users
                         ▼
                        uat   (hosted — Render UAT service tracks this branch)
                         │
                         │  merge once Cabio Star Sales signs off
                         ▼
                        prod  (hosted — Render Prod service tracks this branch, Phase B)
```

| | **Dev** | **UAT / bugfix** | **Prod** |
|---|---|---|---|
| Branch | `main` | `uat` | `prod` |
| Who uses it | Basheer only | Basheer + Cabio Star Sales team (daily) | Pilot sales reps (real users) |
| Frontend | `npm run dev` on `localhost:5173` | Render Static Site | Render Static Site |
| Backend | `uvicorn` on `localhost:8000` | Render Web Service (Starter) | Render Web Service (Starter) |
| Database | Supabase project #1 (current, free tier) | Supabase project #2 (new, free tier) | Supabase project #3 (new, **created after UAT sign-off**, requires Pro) |
| Data | Freely disposable, test writes OK | Realistic fake data (à la `Seed-Data-Demo.sql`) | Real customer/opportunity data — no test writes, ever |
| Migrations | Authored and run here first | Applied second, verified against `Regression-Test-Plan.md` | Applied last, only after UAT passes |

### Promotion flow

**Branches**
- `main` — Milestone 2 integration branch. Local Dev tracks this, same as today's workflow; feature branches merge here via PR.
- `uat` — cut from `main` when UAT goes live (Phase A). Render's UAT service tracks this branch; nothing reaches UAT except what's merged here.
- `prod` — cut from `uat` once UAT signs off (Phase B). Render's Prod service tracks this branch.

**Feature promotion (planned batches)**
1. Milestone 2 feature work happens on `main` — unchanged from today's workflow.
2. When a batch is ready for real users, merge `main` → `uat`. The new Alembic migration(s) run there first, followed by the regression pass and any manual verification (e.g. the 4-role Catalog gate test pattern).
3. Once UAT is clean **and the Cabio Star Sales team has signed off**, promote the *same tested commit* — `uat` → `prod`. Never re-fix or re-derive the build for Prod; it must be the exact code that already passed UAT.

**Hotfix flow (bug reported by UAT or Prod users)**
UAT is always the gate — a fix never reaches `prod` without first running on `uat`, even when the bug was found directly in `prod`.
1. Branch `fix/*` off the branch where the bug lives (`uat`, or `prod` once it exists) — not off `main`, which may already contain unreleased Milestone 2 changes.
2. Develop and sanity-check the fix locally against Dev.
3. Merge `fix/*` → `uat`. Render redeploys UAT; verify the fix there, including the regression pass.
4. If the bug was in `prod`, promote that same tested commit `uat` → `prod` once verified — not before.
5. Cherry-pick the fix into `main` too, so Milestone 2 doesn't lose it or reintroduce the same bug at the next promotion.

**Migration caveat:** Alembic migrations form a strict chain (`down_revision`). If a hotfix on `uat` adds a migration after `main` has already added its own newer ones, cherry-picking that migration file into `main` will likely produce two competing heads — reconcile by hand (rewire `down_revision`, or use `alembic merge`) rather than letting `alembic upgrade` fail on divergent heads.

---

## Open Items (not yet done)

**Phase A — now:**
- [x] Create the UAT Supabase project (free tier) — `cabio-sales-os-uat`, Mumbai (ap-south-1), created 2026-08-02
- [x] Cut the `uat` branch from `main`; pushed to origin 2026-08-02 — still needs Render's UAT service pointed at it once that service exists
- [x] Create Render backend Web Service for UAT — `calicut-bio-medicals` (Free tier, Oregon region — no Mumbai/Singapore option available at signup time), branch `uat`, root `backend`, build `pip install .`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, `PYTHON_VERSION=3.11.9` pinned to match local dev. Live and health-checked 2026-08-02 (`/api/v1/health` returns 200). DB connectivity from Render's network specifically not yet proven end-to-end (every business endpoint requires an authenticated Supabase JWT; `warm_pool()` swallows connection errors silently so its log line isn't proof) — real test deferred to the Auth roster step.
- [x] Create Render static frontend site for UAT — `cabio-sales-os-uat-frontend`, branch `uat`, root `sales-os-app`, build `npm install --legacy-peer-deps && npm run build` (repo has a pre-existing `typescript@^6.0.3` vs. `openapi-typescript@7.13.0`'s `typescript@^5.x` peer conflict — see `docs/Backlog.md`), publish dir `dist`, `SKIP_INSTALL_DEPS=true` (Render static sites auto-run a plain `npm install` before the Build Command otherwise, which bypasses `--legacy-peer-deps` and fails the same way regardless of Build Command content). SPA rewrite rule added (`/*` -> `/index.html`, action Rewrite) — required, confirmed `/login` 404'd before and returns 200 after. Live and verified 2026-08-02.
- [x] Per-environment secrets for UAT, local (`backend/.env.uat`): `DATABASE_URL`, `ADMIN_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CABIO_APP_DB_PASSWORD` — all set 2026-08-02. `SUPABASE_JWT_SECRET` deliberately omitted: unused by the backend (JWKS-based verification, see `security.py`), despite being listed in `.env.example`. Same values pasted into the Render backend service's environment 2026-08-02, including `CORS_ORIGINS` — initially a `localhost` placeholder, updated to `["https://cabio-sales-os-uat-frontend.onrender.com"]` once the frontend existed; verified via a preflight `OPTIONS` request returning the matching `access-control-allow-origin` header. Frontend's own env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL=https://calicut-bio-medicals.onrender.com/api/v1`) set the same day.
- [x] Run Alembic migrations against the new UAT DB, including creating the `cabio_app` role — done 2026-08-02. Non-trivial: `docs/Physical-Schema.sql` at `HEAD` turned out to be stale (missing migrations 0002/0003/0004/0007/0013-0015 — see `docs/Backlog.md`), so UAT was bootstrapped from the pre-migration-0001 snapshot (git commit `a09794d`) + `Seed-Data.sql`, then `alembic upgrade head` ran the full 0001-0015 chain for real, same as Dev's actual history. Verified against the live DB afterward (role, RLS, and recent columns all confirmed present), not just Alembic's own bookkeeping. Also fixed a latent bug in `alembic/env.py`: `configparser` chokes on a literal `%` in a percent-encoded password (e.g. `%40`) — `ADMIN_DATABASE_URL`'s `%` now gets escaped to `%%` before being handed to `config.set_main_option`.
- [x] Land RLS (Phase 2E) — implemented and live on Dev since 2026-07-27, committed `7d7155d` (2026-07-30); see `Phase-2E-Security-Architecture.md`
- [x] Set up UptimeRobot keep-alive monitor for the UAT backend — done 2026-08-03, see "Keep-alive" note above
- [x] Re-create the 6-person roster (+ Basheer) in the UAT Supabase project's Auth — done 2026-08-03; also uncovered and fixed a UAT-wide RLS lockout bug (18 tables had RLS enabled with no policies, blocking all `cabio_app` access), see `docs/Progress-Archive-2026-08.md`. Login now confirmed working — first real proof the Render backend reaches the UAT database end-to-end.
- [ ] Prove out RLS (Phase 2E) on UAT with the Cabio Star Sales team
- [ ] Supabase Storage `documents` bucket + `SUPABASE_SERVICE_ROLE_KEY` secret (Opportunity Document Upload, `docs/Opportunity-Document-Upload-Implementation-Plan.md`) — private bucket, provisioned per-environment **outside the Alembic migration chain entirely**, same out-of-band category as `rls_auto_enable()`. Dev: being provisioned 2026-08-11 (bucket in the Supabase dashboard, key added to `backend/.env`). **Must be repeated for UAT and Prod when this feature ships there** — bucket creation + `SUPABASE_SERVICE_ROLE_KEY` added to Render's env config, same treatment as the other per-environment secrets above (never logged, never committed).

**Phase B — once UAT signs off:**
- [ ] Upgrade the Supabase org to the Pro plan
- [ ] Create the Prod Supabase project — **decline Supabase's "enable RLS
      for the whole database" setup prompt.** This app's RLS design
      deliberately scopes RLS to 8 tables only (`activity`, `document`,
      `opportunity`, `opportunity_item`, `opportunity_stakeholder`,
      `product`, `reminder`, `split`), each with real Alembic-authored
      policies; every other table is meant to stay RLS-disabled, matching
      Dev. Accepting that prompt hit UAT on 2026-08-03 — flipped RLS on for
      all 18 other tables with zero policies behind them, default-denying
      the `cabio_app` role and locking out every login (see
      `docs/Progress-Archive-2026-08.md`). If it happens again, the fix is
      auditing `pg_class.relrowsecurity` + `pg_policies` count against Dev
      for every `public` table and disabling RLS on any mismatch.
- [ ] Cut the `prod` branch from `uat` at the sign-off commit; point Render's Prod service at `prod`, not `uat`
- [ ] Create Render account/services for Prod (backend + static frontend)
- [ ] Per-environment secrets for Prod
- [ ] Decide and document the actual promotion mechanism (manual trigger vs. CI/CD on tag/merge) — see "Promotion flow" above for the branch-level flow already decided; this item is about the trigger tooling only

---

## References

- `Phase-2E-Security-Architecture.md` — RLS implementation, landed on Dev 2026-07-27; must be proven out on UAT before Prod is real
- `Prototype-Production-Parity-Audit.md` §6 — Milestone 1/2 scoping
- `CLAUDE.md` — current Dev Supabase project is live/shared, not disposable
- `.claude/active_progress.md` — session-to-session handoff status
