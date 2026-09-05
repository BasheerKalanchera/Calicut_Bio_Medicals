# Hide Senior-Tier Notes from Area Manager / SBU Manager — Implementation Plan

**Status:** Draft — direction agreed (Haroon signed off 2026-09-05), not yet built.
**Date:** 2026-09-05
**Implements:** the "hide the notes, not the deal" recommendation from
`docs/Opportunity-Notes-Privacy-Discussion-Brief-2026-09-04.md`.

## Context

Haroon works deals himself and logs Activity notes directly, the same as any rep. Today,
because Area Manager/SBU Manager visibility is zone/SBU-scoped (`opportunity_tier_visibility`,
ADR-009), it applies regardless of the opportunity owner's own rank — so Nishad/Fazal (Area
Manager) can read Haroon's private discussion notes on any deal in their zone, and an SBU
Manager can read a GM's. Haroon doesn't want that; the brief ruled out hiding the whole
opportunity (it would remove the only existing safeguard against duplicate outreach to the same
hospital) and recommended hiding only the Activity-tab notes instead. **Haroon agreed to this on
2026-09-05.**

## Decisions locked in (2026-09-05)

1. **Scope: notes only.** `document_tier_visibility` is untouched — attached files/photos/POs
   stay visible to the territory/SBU owner exactly as today.
2. **Hidden pairs:** Area Manager cannot see notes logged by SBU Manager, General Manager, or
   Admin. SBU Manager cannot see notes logged by General Manager or Admin. Admin/GM are
   unaffected (top tier, see everything, unchanged). Sales Staff is not part of this rule —
   Haroon's ask named Area Manager/SBU Manager specifically; Sales Staff's own visibility is
   already narrow (own opportunities + existing split/reminder carve-outs) and wasn't raised as a
   concern.
3. **Looped-in carve-out:** a viewer holding an existing Split or an assigned Reminder on that
   opportunity sees **all** notes on it regardless of rank — deliberately bypasses the hierarchy
   hide, not just the deal-visibility check. Reuses the two carve-out functions already used for
   `opportunity_tier_visibility` (`cabio_app_has_split`, `cabio_app_assigned_reminder`), applied
   here to `activity.opportunity_id`.
4. **Own notes always visible**, regardless of rank — unchanged from today
   (`user_id = cabio_app_uid()`).
5. **No UI indicator for a hidden note.** It simply doesn't appear in the timeline, same as every
   other RLS-filtered case in this app (Document, Reminder) — consistent with the privacy intent,
   and avoids leaking "a note exists here you can't see."

## What changes

### 1. New helper function — `cabio_app_user_role_name(p_user_id uuid)`

The existing `cabio_app_role_name()` only resolves the **caller's own** role. The policy also
needs to resolve the **note owner's** role. Same shape/style as the existing helper; no
`SECURITY DEFINER` needed — `role` and `user_profile` carry no RLS (confirmed against
`docs/Physical-Schema.sql`).

```sql
CREATE FUNCTION public.cabio_app_user_role_name(p_user_id uuid) RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT r.role_name FROM user_profile up JOIN role r ON r.id = up.role_id WHERE up.id = p_user_id $$;
```

### 2. RLS policy — `activity_tier_visibility`

Single `ALTER POLICY` (same mechanism as migrations 0021/0029), migration `0039`.

Current (live, set by migration `0029_relationship_support_activity_rls.py`):
```sql
CREATE POLICY activity_tier_visibility ON activity USING (
    opportunity_id IS NULL
    OR opportunity_id IN (SELECT id FROM opportunity)
    OR user_id = cabio_app_uid()
);
```

New:
```sql
ALTER POLICY activity_tier_visibility ON activity USING (
    opportunity_id IS NULL
    OR user_id = cabio_app_uid()
    OR cabio_app_has_split(opportunity_id)
    OR cabio_app_assigned_reminder(opportunity_id)
    OR (
        opportunity_id IN (SELECT id FROM opportunity)
        AND NOT (
            (cabio_app_role_name() = 'Area Manager'
             AND cabio_app_user_role_name(user_id) = ANY (ARRAY['SBU Manager','General Manager','Admin']))
            OR
            (cabio_app_role_name() = 'SBU Manager'
             AND cabio_app_user_role_name(user_id) = ANY (ARRAY['General Manager','Admin']))
        )
    )
);
```

**Walk-through against Haroon's own scenario:** Haroon (General Manager) logs a note on an
opportunity tied to an account in Nishad's (Area Manager) zone. Nishad's role is Area Manager,
the note owner's role is General Manager → matches the first hidden-pair clause → note hidden,
unless Nishad separately holds a split or assigned reminder on that opportunity → then visible in
full. Nishad still sees the opportunity itself in full (name/value/stage) — `opportunity_tier_visibility`
is untouched — so the duplicate-outreach safeguard the brief was built to preserve stays intact.

### 3. `reminder_via_activity` — no change needed

Confirmed: this policy already reads `activity_id IN (SELECT id FROM activity)`, so it
automatically inherits the tightened Activity visibility — a Reminder tied to a now-hidden
Activity becomes correspondingly hidden too, at zero extra migration cost. This is the correct
outcome, not a side effect to work around: if the viewer is the Reminder's own assignee, the
looped-in carve-out (`cabio_app_assigned_reminder`) already grants them the Activity too, so
nothing is lost.

### 4. `document_tier_visibility` — untouched

Per the "notes only" scope decision. No change.

### 5. Python layer — no change expected

No Python-side duplicate of Activity's tier-visibility logic exists (unlike
`organization/repository.py`'s deliberate mirror of `opportunity_tier_visibility` for non-RLS
contexts) — Activity reads rely solely on RLS as the enforcement layer, consistent with
ADR-009's "joined-back child/context entities" framing. Grep `backend/app/domains/activity/` for
`"Area Manager"`/`"SBU Manager"` before merging as a final confirmation, not because one is
expected.

## Migration

`0039_hide_senior_activity_notes.py` (`down_revision = "0038"`):
- `upgrade()`: `CREATE FUNCTION cabio_app_user_role_name`, then the `ALTER POLICY` above.
- `downgrade()`: `ALTER POLICY` back to migration `0029`'s text, then
  `DROP FUNCTION cabio_app_user_role_name`.

## Verification plan (manual, live against Dev)

1. **Baseline — own notes:** Haroon logs an activity on his own opportunity — visible to Haroon.
   Unaffected control.
2. **Hierarchy hide — Area Manager blocked from a GM's note:** Haroon (GM) logs a note on an
   opportunity tied to an account in Nishad's zone. Confirm Nishad sees the opportunity
   (name/value/stage) but not Haroon's note in the Activity tab. Fazal (different zone) — the
   opportunity itself is correctly invisible too (existing zone scoping, unaffected by this
   change).
3. **Hierarchy hide — SBU Manager blocked from a GM's note:** same note; confirm the relevant
   SBU Manager also can't see it, but does see the opportunity.
4. **Admin/GM unaffected:** Admin and GM logins both see Haroon's note in full, as today.
5. **Looped-in carve-out:** give Nishad a Split (or assign him the closing Reminder) on that same
   opportunity — confirm Haroon's note becomes visible to Nishad afterward, in full.
6. **Reverse direction sanity check:** an Area Manager's own note, viewed by their SBU
   Manager/GM, must remain visible — the hierarchy hide only fires when the viewer is junior to
   the note owner, never the other way.
7. **Regression:** a Sales Staff rep's own opportunities/notes, viewed by themselves — unaffected.
   Pre-existing split/reminder carve-out behavior on opportunities (unrelated to this change) —
   spot-check unaffected.
8. **Document tab unaffected:** confirm Haroon's uploaded documents on the same opportunity
   remain visible to Nishad throughout, per the "notes only" scope decision.

## Open / deferred

- No UI indicator for a hidden note (decision 5 above) — revisit only if this actually confuses
  someone in practice, not speculatively.
- Sales Staff is deliberately out of scope for this hierarchy-hide rule (decision 2 above).
