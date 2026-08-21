# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-08-22_

## Current task — STOP HERE FIRST

**UAT migration, Part 2 — Users & Territories, staged rollout.** Part 1
(code promotion) is DONE and verified on UAT. Full narrative for
everything that happened 2026-08-21 (RLS lockout recurrence, zone_id
clear-bug fix, Central Kerala deprecation, Karnataka tree-flattening
decision) is in `docs/Progress-Archive-2026-08.md`'s 2026-08-21 entry —
not repeated here.

**Rollout stays staged:** Star Sales team's territory setup + their
sign-off comes before notifying anyone or extending to the broader team.
Training/rollout to the extended sales team is Mon 2026-08-24 (moved
from Sat 2026-08-22 — Basheer has a personal event needing weekend
errands).

**Immediate next step:** finish the Karnataka zone tree per the
2026-08-21 decision (Karnataka → District flat, except Bangalore keeps
its cluster node + Zone 1-6), then:
1. Fazal — North Kerala (Kasaragod, Kannur, Kozhikode) + Coastal
   Karnataka (Mangalore, Dakshin Kannada, Coorg, Udupi, Shimoga,
   Bhatkal) district assignments, all Imaging. In progress when the
   session ended.
2. Shruthi — needs an explicit district-level assignment for each of
   Mysore, Mandya, Ramnagara, Chamrajnagar, Tumkur, Chitradurga, Hassan,
   Dharwad (South/Central/North Karnataka districts) once those clusters
   flatten — not yet started. See the 2026-08-21 archive entry for why.
3. Confirm Territory Map's coverage pills show correctly for all 4 Area
   Managers.
4. Only then notify the Cabio Star Sales team on WhatsApp to refresh —
   remind them of the 2-step PWA refresh (force-close/reopen, then a
   fresh browser visit if that alone doesn't pick up the new build;
   `docs/PWA-UAT-MobileLaptop-Setup.md`).
5. Get explicit Star Sales sign-off before extending to the broader team
   ahead of Monday's training.

**Uncommitted right now:** `CLAUDE.md` and `docs/Zone-Hierarchy-
Territory-Data-2026-08.md` (Central Kerala deprecation + Karnataka
tree-shape decision, both 2026-08-21). Stage only these two by name when
committing — not a broad `git add` (see the 2026-08-21 archive entry for
why that matters this round).

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode
safety classifier regardless of chat approval. Basheer runs these
himself (`!`-prefixed or his own terminal) — confirmed working pattern
throughout 2026-08-21.

## Next up, after UAT migration lands

**Referral Credit Part 2 — Relationship-Support Activity.** Fully
scoped and ready to build — see `docs/Backlog.md`, not repeated here.
