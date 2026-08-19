# Active Progress — Cabio Sales OS
_Session: 2026-08-19_

## Current task — STOP HERE FIRST

**UAT migration — promote everything on `main` to `uat`, then set up real
Users and Territories in the UAT database.** Decided after tonight's
leadership demo went well; full context in `docs/Progress-Archive-
2026-08.md`'s 2026-08-19 entries.

**Two parts, in order:**

1. **Code promotion.** `origin/uat` is still at `7a3c8d7` (2026-08-06);
   `origin/main` has moved on 36 commits since, ending at `9e32fb2`
   (Territory Map fixes) — includes the Zone Hierarchy, Multi-Zone
   Milestone 1, Sales Manager Tier Collapse, Admin/GM SBU-agnostic work,
   the 3-screen MUI migration, and Referral Credit (`BR-FIN-07`), all
   demoed tonight. Needs the usual merge/deploy path to `uat`, then a
   Dev-parity smoke pass on the deployed UAT app before calling it done.
2. **Users & Territories setup on UAT.** UAT's `zone`/`zone_closure`/
   `user_zone` tables don't yet reflect the real field org that's been
   live on Dev since the Zone Hierarchy build — the territory tree,
   multi-zone assignments, and SBU-split (Imaging/Critical Care) recorded
   in `docs/Zone-Hierarchy-Territory-Data-2026-08.md`. This needs to be
   built out on UAT the same way it was on Dev (Territory Admin screen,
   or direct data entry), plus the corresponding `user_profile` rows for
   anyone in that doc who doesn't have a UAT login yet.

**Known blocker, will hit again here:** direct DB reads/writes via
`psycopg2` get blocked by the Claude Code auto-mode safety classifier —
chat approval alone doesn't satisfy it (hit tonight trying a plain
read-only `SELECT` against `user_profile`; also hit applying migration
`0019` back on 2026-08-11). Either Basheer runs DB-touching commands
himself (`!`-prefixed, executes directly in the session) or grants a
Bash permission rule for them — decide which before starting part 2.

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
