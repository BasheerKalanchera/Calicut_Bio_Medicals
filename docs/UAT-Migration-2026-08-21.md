# UAT Migration — 2026-08-21

**Status: complete.** `main` promoted to `uat` twice the same day (a morning
code+migration batch, then one same-day follow-on fix), 8 migrations
applied, two live bugs found and fixed, Territory data cleanup done
separately afterward. **Backfilled 2026-09-11** from
`docs/Progress-Archive-2026-08.md`'s 2026-08-21 entry, for consistency with
later promotions that got their own dedicated record (`docs/UAT-Migration-
2026-09-08.md`, `docs/UAT-Migration-2026-09-11.md`) — written after the
fact, from the archive narrative and git history, not a live-session log.

---

## Scope

39 commits (morning push) + 1 same-day follow-on commit, 8 Alembic
migrations (`0016` → `0023`) — the prior promotion was the last one before
this backfilled sequence starts, covering Aug 7–19's work (also captured
for leadership as `docs/Demo-Narrative-UAT-Migration-2026-08-19.md`, a
briefing document, not a promotion record):

1. **Zone Hierarchy & Territory Admin** — self-referencing zone tree +
   closure table (migration `0019`), Territory Admin screen, ZonePicker +
   coverage view, zone reactivate/deactivate (renamed from "deprecate"),
   multi-zone user assignment (Milestone 1, migration `0018`), zone
   filters on Account Management and Opportunity Pipeline, zone-name
   trigram search index (`0020`), Mangalore zone added.
2. **Sales Manager tier collapsed into Area Manager** (migration `0021`)
   — a full role-tier removal, not just a rename.
3. **Admin/General Manager made SBU- and zone-agnostic** — `user_profile.
   sbu_id` made nullable (migration `0022`), Fazal/Naeem North Kerala
   split corrected.
4. **Referral Credit (BR-FIN-07)** + Add/Edit Opportunity UX overhaul
   (migration `0023`).
5. **Product Lifecycle** — trade-ins, refurbished stock, accessories;
   Buyback free-text line items; unified Product/Accessory/Buyback picker
   across every opportunity entry point (migrations `0016`/`0017`).
6. Real document upload on Opportunities via Supabase Storage.
7. User deactivate/reactivate, with a login-gate fix for inactive
   accounts.
8. Three MUI migrations: `ProductCatalogScreen`, `CustomerDirectoryScreen`,
   `ProjectDirectoryScreen` (React Query + TypeScript each).
9. Smaller fixes riding along: default landing screen changed to
   Pipeline; multi-line Activity notes and buyback/product descriptions
   now preserve line breaks; `manager_id`-resend and clear-Manager-on-
   SBU-change bugs; BR-OP-10 (initial Opportunity status restricted to
   Active) and BR-OP-12 (SBU-override parity on Project Directory) gaps
   closed; Territory Map staleness and mobile UX fixes; list-row card
   styling/Tailwind hover-on-touch fix.

## Pre-flight checks

Not separately recorded at the time (this promotion predates the
pre-flight-checklist habit later promotions followed) — the archive
narrative starts directly at code promotion.

## Execution log

1. **Code promotion (morning).** `main` (`5aa4731`, 39 commits ahead of
   `uat`'s `7a3c8d7`) fast-forward pushed to `uat`
   (`git push origin main:uat`). Render redeployed both
   `calicut-bio-medicals` (backend) and `cabio-sales-os-uat-frontend` --
   both confirmed Live, health check healthy.
2. **Migrations.** The 8 pending migrations (`0016`-`0023`) applied
   cleanly against UAT by Basheer via Git Bash (DB-mutating commands are
   outside Claude Code's tool access on this project by design):
   `ADMIN_DATABASE_URL` from `backend/.env.uat`, `.venv/Scripts/
   python.exe -m alembic upgrade head`, `0015 -> 0023`, no errors.
3. **Bug found and fixed live: UAT-wide RLS lockout, 2nd occurrence.**
   Territory Map's "Show Coverage" pills came back empty despite Area
   Managers having zone assignments. Root cause: UAT's out-of-band
   `rls_auto_enable()` Supabase event trigger (flagged as an open item
   since 2026-08-05, never closed) force-enables RLS with zero policies
   on any newly created table -- today's migrations created `user_zone`
   (`0018`) and `zone_closure` (`0019`), neither with an RLS policy of
   its own by design. Reads silently returned empty rows; writes hit a
   genuine RLS violation that the browser reported as a misleading CORS
   error (the 500 response skipped CORS headers). Confirmed via a
   read-only `pg_class`/`pg_policies` check, fixed with `ALTER TABLE
   user_zone/zone_closure DISABLE ROW LEVEL SECURITY` (run by Basheer,
   same DB-access-blocked pattern). Logged to `docs/Backlog.md` as a
   standing item -- 2nd occurrence, not yet a permanent fix (that came
   later, 2026-09-10: the trigger itself was finally dropped from UAT).
4. **Bug found and fixed live: `zone_id` couldn't be cleared once set.**
   Blocked "Admin/GM shouldn't have a territory" cleanup. Two bugs, not
   one: (a) frontend sent `zone_id: form.zone_id || undefined`, which
   `JSON.stringify` drops entirely, so a cleared picker never reached the
   request body -- fixed to `|| null`; (b) backend's `effective_zone_id
   = data.zone_id if data.zone_id is not None else user.zone_id` couldn't
   distinguish an explicit `null` from an omitted key -- fixed to check
   `"zone_id" in data.model_fields_set` instead. New regression test
   added (`test_zone_id_explicit_null_clears_primary_zone`). Verified on
   both Dev and UAT (UAT needed a second PWA hard-refresh before the new
   bundle took, per `PWA-UAT-MobileLaptop-Setup.md`'s documented
   fallback). **Committed `81fded7`** (accidentally swept in unrelated
   handover/backlog files via an unscoped `git commit` -- left as-is,
   nothing sensitive, not worth a `main` rewrite to un-bundle).
5. **Code promotion (afternoon, same day).** `81fded7` promoted `main` ->
   `uat` the same way as the morning's push, carrying the `zone_id` fix
   live.
6. **Territory data cleanup, done directly in the app, not via
   migration:** Central Kerala deprecated -- hospital accounts moved to
   South Kerala, zone deactivated once confirmed empty (resolving an open
   question from 2026-08-11). Zone tree shape decided: Kerala keeps its
   existing 3-level shape (Kerala -> North/South Kerala -> District);
   Karnataka flattens to 2 levels (Karnataka -> District) except
   Bangalore, which keeps its cluster node + Zone 1-6 children. Known,
   accepted cost: Shruthi's Karnataka coverage needs explicit per-district
   `user_zone` rows once those clusters flatten, and won't auto-inherit
   any brand-new Karnataka district added later outside Bangalore.

## Still open (tracked elsewhere, not resolved by this migration)

- **`rls_auto_enable()` permanent fix** -- this was its 2nd occurrence
  (1st: 2026-08-03). Recurred a 3rd time on 2026-09-08, finally removed
  from UAT permanently on 2026-09-10 -- see `docs/UAT-Migration-2026-09-
  08.md` and `docs/Progress-Archive-2026-09.md`'s 2026-09-10 entry.
- **Territory Part 2 (Users & Territories)** -- Fazal's North Kerala +
  Coastal Karnataka district assignments and the Karnataka tree
  flattening were still being worked on directly in Territory Admin when
  this session ended; not confirmed complete in this entry. Full detail
  (if resolved) would be in a later Progress Archive entry, not this one.

## References

- `docs/Progress-Archive-2026-08.md`'s 2026-08-21 entry — original session
  narrative this doc was backfilled from
- `docs/Demo-Narrative-UAT-Migration-2026-08-19.md` — leadership briefing
  on the work this promotion carried (not a promotion record itself)
- `docs/Zone-Hierarchy-Territory-Data-2026-08.md` — zone tree shape
  decision detail
- `docs/Backlog.md` — `rls_auto_enable()` standing item, updated with this
  occurrence
