# Opportunity Edit From Customer/Project Pages (UAT Hotfix) — Implementation Plan

**Status:** Draft, 2026-09-30 — **Parked** by Basheer 2026-09-30 before the
approach decisions below were answered. Nothing built.
**Traceability rows:** none (bug fix to existing opportunity editing; no signed requirement changes status)
**Design / discussion:** 2026-09-30 conversation; summary in
`docs/Progress-Archive-2026-09.md` "2026-09-30 — UAT bug: deal edit with
products and stage change together". Backlog entry "UAT bug: deal edit from
customer/project page fails when products and stage change together".

## Decisions

- Ship as an emergency fix straight to UAT, same route as the 2026-09-14 Admin/GM split fix: branch off `origin/uat`, push to `uat`, then merge `uat` back into `main` (not cherry-pick) — Basheer, 2026-09-30
- Fix both places the bug exists (Customer 360 and Project Directory), not only the screen in the video — Basheer, 2026-09-30
- Products and stage/status are two separate edits and are saved separately (as on the deal page), not bundled into one "all or nothing" save — Basheer, 2026-09-30
- EDIT on a deal in Customer 360's and Project Directory's Opportunities tabs opens the deal page (Opportunity Detail); the two duplicate edit forms are removed — proposed
- Add a Project dropdown to the deal page's Edit window (listing that customer's projects), so the ability to attach/move a deal to a project is not lost; it becomes the single place to change it — proposed
- EDIT lands on the deal page in its normal view (rep then taps its Edit), not with the Edit window already open — proposed
- The Project dropdown includes a "No project" choice to detach a deal attached by mistake (no screen allows this today); server support to be checked before building — proposed

## 1. In plain terms

**The bug (reported from UAT 2026-09-30).** A rep opened a deal from a
customer's Opportunities tab, tapped EDIT, added a product, moved the stage
from Lead to Order and the status to Won, and saved. Save failed with "At
least one product must be added to advance to Qualified stage". The form has
one Save button, but behind it the screen sends the stage change first and
the product second — so the server checks for a product before it has
arrived, and refuses. Nothing was saved. The project page's edit form has
the same flaw.

**Why the deal page doesn't have it.** The deal page has two separate
panels — Products, and the Edit window for stage/status/other details —
each with its own Save and Cancel. Products are always saved before the
stage is changed, so the check passes.

**Workaround given to the rep (Basheer, 2026-09-30):** save the product
first, then edit again to change the stage and status; or open the deal
from the pipeline and use the deal page (Products Save first, then Edit).

**The fix (proposed).** There is no single shared "edit a deal" form: the
customer page, project page and deal page each carry their own copy. Rather
than patch two copies, EDIT on the customer and project pages opens the
deal page — one way to edit a deal everywhere. The deal page's Edit window
lacks one field the customer-page form has (Project), so it gets added.
Screen-only change; no database change.

## 2. Build order (once the decisions are answered)

On a branch `hotfix/opportunity-edit-via-deal-page` taken from `origin/uat`.

1. Check the server accepts clearing a deal's project (for "No project").
2. Deal page: Project dropdown in the Edit window.
3. Customer 360 and Project Directory: EDIT opens the deal page; remove the
   old edit forms; confirm Back returns to the page and tab the rep came
   from (already true for Customer 360; to verify for Project Directory).
4. pytest, ruff, tsc, lint; `/code-review`; fix findings.
5. Written Dev test plan (Simple/Complex, checked against live Dev data;
   Dev backend restarted first); Basheer clicks, Claude watches for saves.
6. Commit (shown first) → push to `uat` (separate approval) → Basheer
   re-tries on UAT → merge `uat` into `main`, re-test, commit, push →
   post-commit checklist. Add an "editing a deal" line to the UAT user manual.

## 3. Not in this plan (with reasons)

- **One-package "all or nothing" save** (products and deal sent together,
  server change) — considered first, dropped: products and stage/status
  are separate edits.
- **Wider clean-up of duplicated screen code** — separate Backlog entry
  "Front-end consistency audit".
- **Bid submission date** — belongs to the project, edited in the project's
  own form; not part of deal editing (an earlier suggestion otherwise was
  wrong).

## 4. Business rules and records to update

- `docs/Business-Rules.md`: no rule changes (product-required gates stay).
- UI-Inventory / Frontend-Implementation-Standards: note that deal editing
  lives only on the deal page.
- UAT user manual: how to edit a deal.

## 5. Technical addendum

- **Root cause:** `Customer360Screen.tsx` awaits `updateOpportunity`
  (~line 1404) and only then posts new items via `addOpportunityItem` /
  `deleteOpportunityItem`, each with `.catch(() => {})` (failures hidden).
  `update_opportunity` reads `has_items` from the DB
  (`backend/app/domains/opportunity/service.py`, `repository.has_items`),
  so the Lead→Qualified gate (`validators.py:80`) sees no items.
  `ProjectDirectoryScreen.tsx` (~413–420) has the same order. Confirmed on
  `origin/uat` as well as `main`. Fast-Track (`gate_override_approver_id`)
  waives only the Demo Start Date gate, never the product gates.
- **Deal page:** products panel keeps local `editItems`; Cancel drops them,
  Save calls `replaceOpportunityItems` then `patchOpportunity({indicative_value})`
  (BR-FIN-03). The "Edit Opportunity" `FormModal` has no item editor and no
  `project_id`; project shown read-only (`OpportunityDetailScreen.tsx:229`).
- **Project link today:** set at create (Customer 360, Project Directory,
  QuickLeadModal) and changed only via Customer 360's edit select
  (`Customer360Screen.tsx:1836`), sent only when set (`:1374`) — cannot be
  cleared. `OpportunityUpdate.project_id` exists (`schemas.py:277`);
  whether an explicit `null` clears it is unverified.
- **Navigation:** Customer 360's `OpportunitiesTab` card already calls
  `onSelectOpportunity`; `DemoApp.tsx` keeps the return view/tab for Back.
- **Merge-back:** `main` has newer changes to `opportunity/*` and
  `Customer360Screen.tsx` than `origin/uat` (48 commits ahead on 2026-09-30).
