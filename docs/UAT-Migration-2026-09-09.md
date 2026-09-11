# UAT Migration — 2026-09-09

**Status: complete.** `main` promoted to `uat`, no migrations involved,
smoke-tested, team notified. **Backfilled 2026-09-11** from
`.claude/active_progress.md`'s "UAT migration — status as of 2026-09-09"
section, for consistency with other promotions that got their own
dedicated record (`docs/UAT-Migration-2026-08-21.md`, `docs/UAT-Migration-
2026-09-08.md`, `docs/UAT-Migration-2026-09-11.md`) — written after the
fact, not a live-session log.

---

## Scope

8 commits, **no Alembic migrations** — a plain code-only fast-forward, the
day right after the large 2026-09-08 promotion:

1. Account picker silently truncated at 100 hospitals (found via
   "+Lead"), fixed across 4 files. **`a4cf3d9`**.
2. SBU Manager blocked from Add Hospital by two independent zone-gate
   checks that only exempted Admin/GM. **`c16b45a`**.
3. Add/Edit Hospital's rep-scoped zone picker (`search_zones_for_hospital`,
   originally built `e86d49a` 2026-08-31) only ever searched a rep's
   **primary** `zone_id`, ignoring any additional zones assigned via
   `user_zone` — found live 2026-09-09 (Vivek, Sales Staff: Alappuzha
   primary + 5 more districts, could only find Alappuzha; also affects
   Naeem's secondary zone Wayanad). Not a UAT-specific data problem —
   reproduced identically on Dev for Vivek before fixing. Not a
   regression from a recent change either: the bug existed since the
   picker was built, it just never got exercised on UAT until the prior
   day's (2026-09-08) batch shipped this feature there for the first
   time. Fixed: `ZoneRepository.search_by_name` now takes
   `within_zone_ids` (plural), `search_zones_for_hospital` scopes by
   `current_user.zones` (all assigned zones) instead of just `zone_id`.
   New regression test (`test_rep_with_additional_zones_searches_across_
   all_of_them`) reproduces Vivek's exact case. 711/711 backend tests
   pass, `ruff` clean. **`643256f`**.
4. Manager Note notification feature + its E2E close-out. **`356933d`,
   `38b8729`**.
5. UAT backup script's Docker-graceful-shutdown fix (an earlier pass at
   the same problem `docs/UAT-Migration-2026-09-11.md`'s referenced fix
   later completed — this commit handled the frontend/tray process, the
   later one also caught the separate `com.docker.*` backend processes).
   **`fbb1a77`**.
6. Two handover/doc-only commits. **`58a59ad`, `dad13ca`**.

## Pre-flight checks

Not separately recorded at the time — no migrations in this range meant
the usual migration-diff check didn't apply; a clean fast-forward was
confirmed before pushing.

## Execution log

1. **Code promotion.** `git push origin main:uat` — fast-forward,
   `origin/uat` advanced `dbfaea1`..`643256f`. No migrations in this
   range, so no DB step needed.
2. **Smoke test.** Manually tested by Basheer 2026-09-09, passed.
3. **Team notified**, UAT cleared to use for these features.
4. **Housekeeping found during this thread:** the local `uat` git branch
   ref was stale (still pointing at a 2026-08-21 commit, `81fded7`) —
   corrected to track `origin/uat`.

## Still open (tracked elsewhere, not resolved by this migration)

None from this promotion itself — no action was left pending at the time.

## References

- `.claude/active_progress.md`'s "UAT migration — status as of 2026-09-09"
  section — original record this doc was backfilled from
- `docs/UAT-Migration-2026-09-08.md` — the prior day's much larger
  promotion this one immediately followed
