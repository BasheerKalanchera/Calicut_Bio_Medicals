# Audit Trail for Key Master Tables — Implementation Planning Brief

**Date:** 2026-08-31
**Purpose:** Input for a planning session to produce an implementation plan.
This document scopes the problem and constraints — it is not the plan itself,
and the planning session should not treat it as final on the open questions
listed near the bottom.

## Problem

No audit trail exists today for who changed what on business-critical
records. `AuditMixin` (`backend/app/db/base.py`) gives every row
`created_by`, `updated_by`, `created_at`, `updated_at` — but that's a single
"last touched" snapshot, overwritten on every edit. If a record is changed
three times, only the third editor is known; the first two edits, and what
the field values used to be at each step, are gone. The API doesn't even
expose `updated_by` today (only `updated_at`) — so right now nobody can see
"who" from the app itself, even for just the latest edit.

## Decision already made — do not re-litigate the mechanism

**ADR-017** ("Phase 1 Audit Logging Strategy", `docs/ADR.md`, **Status:
Accepted**) already decided the mechanism: PostgreSQL triggers writing to a
centralized `audit_log` table, specifically because it's "immutable
server-side auditability independent of application logic" — i.e. it
captures every change regardless of how it happened (app code, a bulk fix,
a migration), not just the paths a developer remembered to instrument.
**This brief scopes which tables and when — the trigger-based approach
itself isn't up for re-debate** unless the planning session finds a real
technical blocker.

## Scope for this phase

Four tables, all already named in ADR-017's original "Affected Modules"
list:

- `account` (Customer/Hospital directory)
- `user_profile` (User Management)
- `product` (Product Catalog)
- `opportunity` (Opportunity Pipeline)

**Explicitly out of scope for this phase** (deferred, not rejected) — also
named in ADR-017's original list but not part of this request: Target
Planning, Coverage Planning. Don't expand into those without a separate
go-ahead.

**Why Opportunity is in, not just Account/User/Product:** restricted
visibility (RLS tiers by owner/manager/SBU Manager/Area Manager/Admin/GM)
limits who can *see* a deal, but doesn't reduce who can *edit* one — that
set is actually broader than most other master tables — and Opportunity
carries deal value, stage, and Won/Lost status, which feed forecasting and
(via `Split`) commission-adjacent numbers. BR-OP-14 (Manager-Attested Gate
Override) already needed manual approval + notification guardrails around
one sensitive Opportunity field, and surfaced "audit-integrity bugs" along
the way — a signal this data already needs accountability, just built
piecemeal so far rather than systematically.

## Explicit non-goals (per ADR-017 itself)

- No audit dashboard, no audit search screen, no reporting API in this
  phase — the table is a technical/infrastructure artifact only.
- Not a business/EDM entity — no Pydantic schema, no domain service
  wrapping it, per ADR-017's own wording ("must not be modeled as an EDM
  business entity").

## Starting shape (not final — planning session should confirm/adjust)

One shared table, not one per entity:

```
audit_log(
  id            uuid primary key default gen_random_uuid(),
  table_name    text not null,
  record_id     uuid not null,
  action        text not null,        -- INSERT / UPDATE / DELETE
  changed_by    uuid,                 -- nullable: some writes may be system/migration-driven
  changed_at    timestamptz not null default now(),
  old_data      jsonb,
  new_data      jsonb
)
```

Populated by a DB trigger — most likely one generic trigger function
attached to all four tables (`CREATE TRIGGER ... FOR EACH ROW EXECUTE
FUNCTION`), rather than four bespoke ones, if that fits Postgres/this
codebase's existing conventions cleanly. Confirm during planning.

## Existing patterns to reuse — don't reinvent

- `changed_by` should come from `public.cabio_app_uid()` — the same
  session-context function RLS policies already use to identify the acting
  user (see `docs/Physical-Schema.sql`'s RLS policies, e.g.
  `opportunity_tier_visibility`). No new "who is doing this" plumbing is
  needed.
- `AuditMixin` already gives `created_by`/`updated_by`/`created_at`/
  `updated_at` on all four tables — `audit_log` is additive (full history),
  not a replacement for those columns.
- Migrations are Alembic-based (`alembic/versions/`). **DB-mutating changes
  (including creating the trigger function and triggers) are run by
  Basheer directly, not via Claude Code's tool access**, per this project's
  standing rule — the plan should produce a migration file for Basheer to
  apply himself, not assume the implementing session can run it live.

## Known open questions for the planning session to resolve

1. **DELETE actions:** `account` has no DELETE endpoint today (rows are
   effectively permanent, mirroring `Activity`'s own immutability
   convention). Confirm which of the four tables have a real DELETE path
   worth capturing vs. INSERT/UPDATE only.
2. **Read access to `audit_log` itself:** should it be RLS-protected (e.g.
   Admin/GM-only read), given it will contain full historical field values
   including Opportunity's financial data?
3. **Retention/volume:** Opportunity is likely the highest-write-volume of
   the four tables. No pruning/retention policy exists yet — decide if
   that's in scope for this phase or explicitly deferred.
4. **Field scope:** log every column change, or exclude some (e.g.
   `updated_at` churn, other system-only fields)? Simplest default is "log
   everything, let readers filter" — confirm that's acceptable.
5. **Backfill:** no historical audit trail exists for changes already made
   before this ships. Confirm audit starts from ship date forward, not
   retroactively reconstructed.

## Deliverable expected from the planning session

An implementation plan: the migration(s) for the `audit_log` table +
trigger function + per-table triggers, an RLS policy for the table itself,
and resolved answers to the open questions above. Code/migration authoring
comes after the plan is reviewed — this step is plan-only.
