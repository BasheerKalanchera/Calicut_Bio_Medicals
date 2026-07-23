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
(stalled-opportunity detection, delivery/handover fields, RLS itself) means
**active schema migrations will keep happening at the same time pilot reps
are using the app.** Without separation, every migration's first real test
would be production, on top of real pipeline data.

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
| Backend hosting | **Render Web Service, Starter tier** ($7/mo each) for UAT and Prod |
| Frontend hosting — rejected option | Vercel — Hobby tier's ToS explicitly prohibits commercial use ("personal or non-commercial use" only); Pro tier ($20/mo/seat) would have worked but is an unnecessary extra vendor once Render already hosts the backend |
| Local Dev hosting | Stays local — `uvicorn`/`npm run dev` against the Dev Supabase project, no hosting needed |

---

## Cost — two phases

**Phase A (now — Dev + UAT, free tier):**

| Component | Cost | Notes |
|---|---|---|
| Supabase — Dev + UAT | $0/mo | Free tier, 2 projects, within the free cap |
| Render — backend × 1 (UAT, Starter) | $7/mo | 512 MB RAM / 0.5 CPU |
| Render — frontend × 1 (UAT, static) | $0/mo | Free tier, no commercial-use restriction |
| **Phase A total** | **~$7/month** | |

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

---

## Topology

```
                    ┌─────────────────────────────────────────────────────┐
                    │                     GitHub repo                     │
                    │            (single source, branch-based)            │
                    └───────────────┬───────────────────┬─────────────────┘
                       feature/*    │        main        │      release tag
                       branches     │      (merged PRs)   │    (promote to prod)
                                    ▼                     ▼
        ┌───────────────┐   ┌───────────────┐    ┌───────────────┐
        │      DEV      │   │      UAT      │    │     PROD      │
        │  (your laptop)│   │   (hosted)    │    │   (hosted)    │
        └───────────────┘   └───────────────┘    └───────────────┘
```

| | **Dev** | **UAT / bugfix** | **Prod** |
|---|---|---|---|
| Who uses it | Basheer only | Basheer + Cabio Star Sales team (daily) | Pilot sales reps (real users) |
| Frontend | `npm run dev` on `localhost:5173` | Render Static Site | Render Static Site |
| Backend | `uvicorn` on `localhost:8000` | Render Web Service (Starter) | Render Web Service (Starter) |
| Database | Supabase project #1 (current, free tier) | Supabase project #2 (new, free tier) | Supabase project #3 (new, **created after UAT sign-off**, requires Pro) |
| Data | Freely disposable, test writes OK | Realistic fake data (à la `Seed-Data-Demo.sql`) | Real customer/opportunity data — no test writes, ever |
| Migrations | Authored and run here first | Applied second, verified against `Regression-Test-Plan.md` | Applied last, only after UAT passes |

### Promotion flow

1. Milestone 2 feature work happens against **Dev** — unchanged from today's workflow.
2. Merge to `main` → deploy triggers **UAT**: the new Alembic migration runs there first, followed by the regression pass and any manual verification (e.g. the 4-role Catalog gate test pattern).
3. Once UAT is clean **and the Cabio Star Sales team has signed off**, upgrade the Supabase org to Pro, create the Prod project, and promote the same already-tested build and migration to **Prod**.

---

## Open Items (not yet done)

**Phase A — now:**
- [ ] Create the UAT Supabase project (free tier)
- [ ] Create Render account/services for UAT (backend + static frontend)
- [ ] Per-environment secrets for UAT: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`
- [ ] Land RLS (Phase 2E — see `Phase-2E-Security-Architecture.md`) and prove it out on UAT with the Cabio Star Sales team

**Phase B — once UAT signs off:**
- [ ] Upgrade the Supabase org to the Pro plan
- [ ] Create the Prod Supabase project
- [ ] Create Render account/services for Prod (backend + static frontend)
- [ ] Per-environment secrets for Prod
- [ ] Decide and document the actual promotion mechanism (manual trigger vs. CI/CD on tag/merge)

---

## References

- `Phase-2E-Security-Architecture.md` — RLS implementation, must land before Prod is real
- `Prototype-Production-Parity-Audit.md` §6 — Milestone 1/2 scoping
- `CLAUDE.md` — current Dev Supabase project is live/shared, not disposable
- `.claude/active_progress.md` — session-to-session handoff status
