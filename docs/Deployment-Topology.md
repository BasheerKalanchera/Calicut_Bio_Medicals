# Deployment Topology — Dev / Prod

**Status:** Decided, not yet executed — no Prod environment exists as of 2026-08-25.

**Revision (2026-08-25) — collapsed to 2 tiers (Dev / Prod), retiring the recurring UAT
rehearsal tier:** the 3-tier model below (Approved Decisions, Cost, Topology sections)
is superseded. Driver: **cognitive load on the Cabio Sales team**, not cost. Asking a
non-technical sales team to track "is this a real bug, or am I in UAT" is real overhead,
and it compounds with every feature that ships. Two supporting factors made this an
acceptable trade rather than a safety regression:

1. **Most of Milestone 2 (Target, Coverage planning, Reporting) is Manager-scoped.** RLS
   already restricts these screens to the Manager role, so a weekly batch's blast radius
   is naturally contained to a small, engaged audience — not the full rep force logging
   Activities/Opportunities daily. This gives an informal canary group for free, with no
   separate environment required.
2. **Small weekly batches are themselves a risk mitigant.** A bug in a small increment is
   easier to isolate and roll back than one in a milestone-sized drop — this substitutes
   for some of the safety that a separate rehearsal tier provided.

What this changes: no more "fresh empty UAT project for the next dev/test cycle" (the old
Phase B open item) — once the current UAT project is promoted to Prod, **Dev → Prod is
the only remaining hop**, on a weekly cadence, through a scheduled deploy window (see
Promotion Flow). What this does **not** change: migrations are still authored and run in
Dev first; Prod still never receives untested code. The former UAT → Prod promotion step
(2026-08-20 revision below) still happens once — it's the *ongoing* recreate-UAT cycle
that's retired, not the original promotion.

**Escape hatch, not a standing tier:** for a migration judged genuinely risky (touches
RLS policy definitions, auth, or a schema change on a large rep-facing table), spin up a
throwaway Supabase project for that one migration, verify, tear it down. This is
deliberately ad hoc — it must not regrow into a standing 3rd environment, which is the
exact cognitive-load problem this revision exists to remove.

---

**Revision (2026-07-25) — two-phase rollout, deferring the Pro spend (historical):**
rather than upgrading to Supabase Pro and creating all 3 projects up front, Dev and UAT
ran on the free tier while RLS (Phase 2E) was built and proven out with the Cabio Star
Sales team. Superseded by the 2026-08-25 revision above — there is no longer a Phase B
Pro-tier upgrade, since Dev + Prod is only 2 projects, within the free cap.

---

## Purpose

Milestone 1 gap-closure is complete (`42fa050`) and the demo was held July 20. After
that, the plan was to roll the app out to a small pilot group of star sales reps — real
users, real customer data — while Milestone 2 development continues. This doc records
why a single shared environment stopped being enough, and the topology decided on.

---

## Why a single environment stopped being enough

Today active development and the manual verification Basheer does himself run against
one shared Supabase project (`backend/.env`, flagged in `CLAUDE.md` as live and not
disposable). That was fine while the only audience was Basheer. It stops being fine the
moment real pilot reps depend on the data being there and correct, because Milestone 2
work (RLS, Target/Coverage/Reporting, notifications) means **active schema migrations
keep happening while pilot reps use the app.** Without any separation, every migration's
first real test would be production. The 2026-08-25 revision doesn't remove this
concern — it keeps Dev as the place migrations are authored and run first, and adds a
scheduled deploy window plus manager-scoped soft launch as the mitigation for what a
2nd rehearsal tier used to catch.

---

## Approved Decisions (current — 2-tier model)

| Decision Area | Approved Approach |
|---|---|
| Environment count | **2 tiers: Dev, Prod.** No recurring UAT/rehearsal project. |
| Dev | The existing Supabase project — reused as-is. **Free tier.** Basheer's local dev + all demos happen here before a weekly batch promotes. |
| Prod | **The current UAT Supabase project, promoted in place** once the extended-team UAT period signs off — same connection details, no new project, no data migration (real inflight opportunity/activity data already in it carries forward). All subsequent weeks: `main` → `prod` directly, through the scheduled deploy window. |
| Frontend hosting | Render Static Sites (free) for Prod |
| Backend hosting | Prod: Render Web Service, **Starter tier** ($7/mo, does not spin down) — the only ongoing paid line item |
| Rehearsal for risky migrations | Not a standing tier — a throwaway Supabase project, spun up and torn down per-migration, only when a change touches RLS/auth/large rep-facing tables |

### Historical decisions (superseded 2026-08-25)

**Revision (2026-08-20) — UAT-to-Prod data carry-forward (historical, still relevant to
the one-time promotion):** the original 3-tier plan assumed UAT would only ever hold
realistic-but-fake data and Prod would always be a brand-new empty Supabase project. That
broke once the Cabio Star Sales team began entering real inflight opportunities directly
into UAT. Decision: **Prod is the existing UAT Supabase project, promoted in place** (same
connection URL/keys, just relabeled) — avoids remapping Supabase Auth UUIDs and RLS
`auth.uid()` ownership across projects. This part of the 08-20 decision still stands; it's
the *next* clause ("a fresh empty UAT project is created afterward") that the 08-25
revision retires.

---

## Cost

| Component | Cost | Notes |
|---|---|---|
| Supabase — Dev + Prod | $0/mo | Free tier, 2 projects total, within the free cap — **no Pro upgrade needed under the 2-tier model** |
| Render — backend (Prod, Starter) | $7/mo | Avoids spin-down for real users |
| Render — frontend (Prod, static) | $0/mo | Free tier, no commercial-use restriction |
| **Total, once Prod exists** | **~$7/month** | vs. ~$59/mo under the retired 3-tier plan |

**Free-tier caveat to monitor:** Supabase's free tier has row/storage/bandwidth caps
beyond just the 2-project limit. Not a blocker today, but worth revisiting if Prod usage
grows — flagged here rather than resolved, since it wasn't sized under the old plan
either.

**Keep-alive:** no longer needed once Prod runs on Render's Starter tier (doesn't spin
down). The UptimeRobot monitor set up 2026-08-03 for the free-tier backend can be
retired once Prod is live on Starter.

---

## Topology

```
GitHub repo (single source, two long-lived branches)

  feature/*  ──PR──▶  main   (Dev, local — ongoing feature work, unchanged workflow)
                         │
                         │  weekly batch, merged during the scheduled deploy window
                         ▼
                        prod   (hosted — Render Prod service tracks this branch)
```

| | **Dev** | **Prod** |
|---|---|---|
| Branch | `main` | `prod` |
| Who uses it | Basheer only (demos happen here) | Cabio Sales team (daily); Managers are the first-touch group for new Manager-scoped features |
| Frontend | `npm run dev` on `localhost:5173` | Render Static Site |
| Backend | `uvicorn` on `localhost:8000` | Render Web Service (Starter) |
| Database | Supabase project #1 (current, free tier) | The promoted former-UAT Supabase project |
| Data | Freely disposable, test writes OK | Real customer/opportunity data — no test writes, ever |
| Migrations | Authored and run here first | Applied during the weekly deploy window, after Dev verification (incl. RLS/role smoke test) |

### Promotion flow

**Branches**
- `main` — ongoing feature work. Local Dev tracks this, unchanged from today.
- `prod` — the promoted former-UAT branch. Render's Prod service tracks this branch;
  nothing reaches Prod except what's merged here.

**Weekly batch promotion**
1. Feature work happens on `main` — unchanged.
2. Before merge, run an RLS/role smoke-test pass in Dev: a handful of test accounts
   across roles (rep, manager, admin) exercising the week's changes. This is the
   lightweight stand-in for what UAT's multi-user testing used to catch — it's what
   surfaced both real RLS bugs found during the notification feature build.
3. Merge `main` → `prod` **during the scheduled deploy window** (day/time: TBD — see Open
   Items). Alembic migrations run against Prod at this point; a brief service restart is
   the expected worst case, not a long freeze, for the additive/RLS-policy-shaped
   migrations seen so far.
4. Any user-reported fixes found in Prod during the week ride along in the *next* weekly
   batch, or go out same-week via the hotfix flow below if urgent.

**Hotfix flow (bug reported in Prod)**
1. Branch `fix/*` off `prod`.
2. Develop and sanity-check the fix locally against Dev.
3. Merge `fix/*` → `prod` directly (no intermediate rehearsal tier) — deploy during the
   next available window, or immediately if severity warrants an off-cycle deploy.
4. Cherry-pick the fix into `main` too, so ongoing feature work doesn't lose it or
   reintroduce the same bug at the next weekly promotion.

**Migration caveat:** Alembic migrations form a strict chain (`down_revision`). If a
hotfix on `prod` adds a migration after `main` has already added newer ones, cherry-
picking that migration file into `main` will likely produce two competing heads —
reconcile by hand (rewire `down_revision`, or use `alembic merge`) rather than letting
`alembic upgrade` fail on divergent heads.

---

## Open Items (not yet done)

**One-time promotion (UAT → Prod):**
- [ ] Prove out RLS (Phase 2E) on UAT with the Cabio Star Sales team, and get sign-off
      from the extended team's rollout (still gated — see `.claude/active_progress.md`)
- [ ] Promote the existing UAT Supabase project to be Prod — relabel only, same
      connection URL/keys/project ref, no dump/restore, no new project created
- [ ] **Decide:** rename the `uat` branch to `prod`, or cut `prod` fresh from `uat` at
      the sign-off commit and retire the `uat` branch name — either works, pick one
- [ ] **Decide:** keep the existing Render service URLs as-is (they currently carry
      `-uat-` in the name, e.g. `cabio-sales-os-uat-frontend.onrender.com`) or create
      cleanly-named Prod services and repoint. Renaming avoids permanent "uat" branding
      in a URL the sales team bookmarks; keeping avoids re-doing CORS/env config and
      breaking existing bookmarks during the promotion itself. Flagged as a decision,
      not resolved here.
- [ ] Upgrade the Prod Render backend to Starter tier (whichever service ends up
      Prod-branded, per the decision above)
- [ ] Update Prod backend's `CORS_ORIGINS` if the frontend URL changes
- [ ] Smoke-test Prod end-to-end against the real (inherited) data before announcing
      cutover
- [ ] Retire the UptimeRobot keep-alive monitor once Prod is confirmed on Starter tier

**Ongoing 2-tier operation:**
- [ ] Pick and document the weekly deploy window (day + time, IST) — recommend a
      weekday evening after reps have logged the day's activity
- [ ] Communicate the deploy-window ritual to the Cabio Sales team once (what to expect,
      how long, who to report issues to) — this replaces "how UAT works" onboarding
- [ ] Define the RLS/role smoke-test checklist referenced in the Promotion Flow above —
      which test accounts, which roles, run against which screens
- [ ] Supabase Storage `documents` bucket + `SUPABASE_SERVICE_ROLE_KEY` secret must be
      provisioned for Prod when Opportunity Document Upload ships there (per-environment,
      outside the Alembic migration chain — same treatment as Dev's existing setup)

---

## References

- `Phase-2E-Security-Architecture.md` — RLS implementation, landed on Dev 2026-07-27
- `Prototype-Production-Parity-Audit.md` §6 — Milestone 1/2 scoping
- `CLAUDE.md` — current Dev Supabase project is live/shared, not disposable
- `.claude/active_progress.md` — session-to-session handoff status
