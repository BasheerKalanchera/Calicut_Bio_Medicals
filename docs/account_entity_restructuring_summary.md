# Account Entity Restructuring: Implementation Summary

This document summarizes the architectural changes required to align the `Account` entity with the core Sales OS design principles.

## Core Architectural Changes

1.  **Decouple Accounts from SBUs:**
    *   Accounts must be elevated to the **Organization level**.
    *   Accounts no longer belong to or are tied to any specific Strategic Business Unit (SBU).
    *   Multiple SBUs (e.g., Imaging, Critical Care) will interact with the same global Account.

2.  **Geographical Zone Assignment:**
    *   Accounts must be assigned to a **Zone** reflecting the physical geography of that account.
    *   Zones are used strictly for reporting, coverage analysis, and performance insights — *not* for target allocation.
    *   **Default behaviour:** On creation, the Account's Zone defaults to the creating user's (KAM's) Zone (`created_by → UserProfile.zone_id`).
    *   **Override:** Zone is always exposed as an editable dropdown in the Account form. Admins or managers entering an account on behalf of a different territory must manually select the correct Zone before saving.
    *   **`zone_id` is NOT NULL** on the `Account` table. Every account is a physical entity and must belong to a Zone. If the creating user has no Zone (e.g., a national admin), the Zone dropdown has no default and the field becomes a required selection.

3.  **Zone does NOT propagate through the parent-account hierarchy:**
    *   Each account holds its own `zone_id` independently.
    *   A corporate parent can be in a completely different zone from its branch accounts (e.g., Aster DM HQ → Bangalore Zone; Aster Calicut → Kerala North Zone).

4.  **Opportunity SBU Scoping (explicit FK required):**
    *   Opportunities must carry a direct `sbu_id` FK (NOT NULL) to the `sbu` table.
    *   **Why not inherit from the owner?** If a rep moves to a different SBU, implicit inheritance (`owner_id → UserProfile.sbu_id`) would silently re-classify all their historical opportunities to the new SBU — breaking target rollup and reporting. The opportunity must stay with the SBU it was created under, regardless of where the owner moves.
    *   **Default behaviour:** On creation, `sbu_id` is stamped from the creating user's current SBU (`UserProfile.sbu_id`). It is stored on the row and never changes automatically.
    *   **Override:** A manager or admin can explicitly reassign an opportunity to a different SBU if needed (e.g., a mis-classification).

## Developer Action Items

### Database Schema & Models

*   **Remove SBU References from Account:** Drop `managing_sbu_id` (FK column) and `managing_sbu` (relationship) from the `Account` model. Drop the corresponding `managed_accounts` backref from the `SBU` model.
*   **Add Zone to Account:** Add `zone_id` as a **NOT NULL** FK to the `zone` table on the `Account` model. Add the corresponding `accounts` backref on the `Zone` model.
*   **DB Migration:** Write an Alembic migration that:
    1.  Drops `managing_sbu_id` from `account` and adds `zone_id` (NOT NULL FK to `zone`). Pre-existing rows need a default zone UUID before the NOT NULL constraint is applied.
    2.  Adds `sbu_id` (NOT NULL FK to `sbu`) to `opportunity`. Pre-existing rows need a default SBU UUID before the NOT NULL constraint is applied.

### API Schemas

*   **Account schemas:** Remove `managing_sbu_id` and the `SBUNested` response model. Add `zone_id` (required) and a `ZoneNested` response model (`id`, `name`).
*   **Opportunity schemas:** Add `sbu_id` (required on create; read-only after creation except for manager/admin override). Add an `SBUNested` response model (`id`, `name`) to the Opportunity response.

### Business Logic & Service Layer

*   **Zone defaulting on Account create:** In `AccountService.create()`, if `zone_id` is not explicitly supplied in the request, look up the creating user's zone (`UserProfile.zone_id`) and apply it. If neither the request nor the creating user provides a zone, raise a validation error — zone is mandatory.
*   **SBU stamping on Opportunity create:** In `OpportunityService.create()`, set `sbu_id` from the creating user's current `UserProfile.sbu_id`. This value is written once and never updated automatically, even if the owner later moves SBUs.
*   **Update Queries & Endpoints:** Refactor any existing queries that filtered or scoped Accounts by SBU. Accounts are globally visible. Opportunities and Targets beneath the Account remain SBU-scoped through their explicit `sbu_id`.

### Frontend

*   **Account Create / Edit form:** Replace the SBU dropdown with a Zone dropdown populated from `GET /reference/zones`. Pre-fill with the authenticated user's zone. The field is required and must always be submitted.

> [!IMPORTANT]
> **To the Developer:** The relationship flow is: `Account (Global, Zone-assigned) -> Project (Global) -> Opportunity (SBU-scoped via explicit sbu_id FK)`. The `sbu_id` on `Opportunity` is stamped at creation from the owner's SBU and is the authoritative SBU reference — do NOT derive SBU from `owner_id → UserProfile.sbu_id` at query time, as the owner may have moved SBUs since the opportunity was created.
