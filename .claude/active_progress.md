# Active Progress — Cabio Sales OS
_Session: 2026-08-21_

## Current task — STOP HERE FIRST

**UAT migration — promote everything on `main` to `uat`, then set up real
Users and Territories in the UAT database.** Decided after the 2026-08-19
leadership demo went well; full context in `docs/Progress-Archive-
2026-08.md`'s 2026-08-19 entries.

**Rollout is staged, not all-at-once:** training/rollout to the extended
sales team moved from Sat 2026-08-22 to Mon 2026-08-24 (Basheer has a
personal event needing weekend errands). Star Sales team gets territory
setup first and must sign off on UAT before the extended team's users/
territories go in — see `docs/Progress-Archive-2026-08.md`'s 2026-08-21
entry.

**Two parts:**

1. **Code promotion — DONE 2026-08-21.** `main` (`5aa4731`) fast-forward
   pushed to `uat` (`git push origin main:uat`, `7a3c8d7..5aa4731`).
   Render redeployed both `calicut-bio-medicals` (backend) and
   `cabio-sales-os-uat-frontend` — both confirmed Live, health check
   healthy. The 8 pending Alembic migrations (`0016`-`0023`: product
   type/line, zone hierarchy tree/closure, `user_zone`, Sales Manager
   Tier Collapse, SBU nullable, Referral Credit) applied cleanly against
   UAT by Basheer via Git Bash (`ADMIN_DATABASE_URL` from
   `backend/.env.uat`, `alembic upgrade head`, `0015 -> 0023`, no
   errors). Confirmed working end-to-end: a pre-migration login attempt
   surfaced `GET /api/v1/master-data/zones` → 500 (old schema missing
   Zone Hierarchy tables) — expected, resolved by the migration run.
   **Still needed:** Basheer to confirm the zones call now returns 200
   after logging in post-migration, then a full Dev-parity smoke pass on
   the deployed UAT app before calling code promotion fully done.
2. **Users & Territories setup on UAT — staged (see above).** Star Sales
   subset first (zone tree + their users/assignments), get their
   buy-in, then the extended team. UAT's `zone`/`zone_closure`/
   `user_zone` tables don't yet reflect the real field org that's been
   live on Dev since the Zone Hierarchy build — the territory tree,
   multi-zone assignments, and SBU-split (Imaging/Critical Care) recorded
   in `docs/Zone-Hierarchy-Territory-Data-2026-08.md`. Basheer is doing
   the actual user/zone creation himself this round.

**Known blocker, hit again during code promotion:** direct DB-touching
commands (migrations, raw queries) get blocked by the Claude Code
auto-mode safety classifier — chat approval alone doesn't satisfy it.
Basheer runs these himself (`!`-prefixed or his own terminal) — confirmed
working pattern for the `alembic upgrade head` run above.

## Recently shipped, all committed (context for the migration above)

- `ProjectDirectoryScreen.tsx` MUI migration (`1d51b6d`).
- Referral Credit Part 1 (`BR-FIN-07`) — backend + all 4 create/edit
  entry points, plus the Add/Edit Opportunity UX overhaul it prompted
  (`ea19bd1`).
- Territory Map fixes — staleness and mobile UX (`9e32fb2`).

Manually verified end-to-end on Dev by Basheer across all of the above,
then demoed live to leadership 2026-08-19. `tsc --noEmit`/`npm run lint`
clean throughout. Full narrative in `docs/Progress-Archive-2026-08.md`.

## Next up, after UAT migration lands

**Referral Credit Part 2 — Relationship-Support Activity.** Fully
scoped and ready to build — see `docs/Backlog.md`, not repeated here.
