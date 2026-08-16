# Vivek — Sales Staff Account Setup Plan

**Status:** Superseded by execution, 2026-08-16 — see "What actually
happened" below. The approach below (create a separate new user) was the
original plan; Basheer chose a different, better-informed approach once
more data surfaced mid-session, and that's what was actually built. Kept
here for the original context/reasoning, not as a to-do list.
**Date:** 2026-08-16

## What actually happened (2026-08-16, supersedes "What's in scope" below)

Two things changed the plan after it was written:
1. Basheer confirmed Amit R and Vivek aren't two people who both need
   accounts — Amit R's `user_profile` row was itself the mis-labeled
   placeholder for what should have been Vivek's account all along (same
   manager, same SBU, just the wrong name and a too-coarse zone
   assignment). So the fix was a correction of that existing row, not a
   second new user.
2. Reviewing Amit R's 2 opportunities turned up a real, separate finding:
   they were stamped `sbu_id = Imaging` despite Amit R's own `sbu_id`
   being Critical Care — not a bug, but the documented "SBU Transfers —
   Frozen Attribution" behavior (`Opportunity-Access-Hierarchy-Technical-
   Design.md` §7/§8: an opportunity's SBU is frozen at creation, never
   auto-follows the owner's later SBU changes). Basheer resolved this the
   documented way — manually reassigned both opportunities' ownership to
   Basheer K (Imaging) — independent of the Vivek correction below.

**Executed:** Basheer created a real Supabase Auth account for Vivek
(`vivek@cabio-demo.com`) via the Dashboard. Since `user_profile.id` must
match the Auth UUID and the old placeholder row's id was a synthetic
demo-seed value with no matching Auth account, an in-place ID change
wasn't possible (all 39 FKs referencing `user_profile` are `NO ACTION`,
confirmed via `pg_constraint`). Instead: created a new `user_profile` row
on the real Auth UUID (Sales Staff, Critical Care, manager Arun Adarsh),
migrated everything still referencing the old placeholder id to it (a
50% split on "New USG m/c," a pending reminder, and 3 owned Projects —
found via a full FK sweep, not just the opportunities originally
suspected), replaced the coarse "South Kerala" zone assignment with the 6
specific districts from the territory doc (see below — the taluk-split
question turned out moot, the territory doc was independently simplified
to district-level only during this session), then deleted the old
placeholder row. Verified clean afterward: old row gone, new row correct,
all migrated data intact.

---

## Original plan (superseded, kept for context)

## Context

A background check (2026-08-16, triggered outside this session's visible
context — see chat log) into "can we rename Sales Staff Amit R to Vivek"
found they're two different real people, not a naming inconsistency:

- **Amit R** — existing Sales Staff account, Critical Care, reports to
  **Arun Adarsh**, owns 2 live opportunities.
- **Vivek** — a separate real field rep, already documented in
  `docs/Zone-Hierarchy-Territory-Data-2026-08.md` (confirmed 2026-08-11):
  reports to Adarsh, Critical Care, covers specific South Kerala
  sub-district territory. **He has no user account in the system at
  all.**

Renaming Amit R's `display_name` to "Vivek" would silently misattribute
Amit R's 2 existing opportunities and leave the real Vivek's territory
work invisible under someone else's login — not a fix, a data-integrity
problem. This plan is the actual correction: create Vivek as his own
user, leave Amit R untouched.

## What's in scope

**Create one new Sales Staff user**, via the existing User Directory
"Add User" flow — no code change needed:
- Display name: **Vivek**
- Role: Sales Staff
- SBU: Critical Care
- Manager: **Arun Adarsh**
- Supabase Auth account: create alongside (the "create Supabase Auth
  accounts" blocker noted in `active_progress.md`'s carried-over Phase 2E
  item is already resolved for Dev — this is no longer blocked).

**Zone assignment (`user_zone`, responsibility-record only — inert for
RLS per the 2026-08-12 Zone Hierarchy decision, Sales Staff visibility
stays owner-only regardless)**, per `Zone-Hierarchy-Territory-Data-2026-
08.md`'s South Kerala table:
- Assign the **4 whole districts** Vivek owns outright — confirmed to
  exist as zones already: **Kottayam, Pathanamthitta, Kollam,
  Trivandrum**.
- **Not assignable yet, flagged not solved here:** Vivek's two
  sub-district slices — Chengannur/Harippad/Kayamkulam within Alappuzha,
  and Thodupuzha within Idukki. Checked live Dev: **none of these four
  taluk-level zones exist yet.** Creating them cleanly also requires
  splitting Adarsh's "rest of Alappuzha"/"rest of Idukki" into named
  taluk nodes on the other side of each split — an already-open item in
  the territory data doc (§"Remainder of Alappuzha/Idukki needs the real
  taluk names"), not something to solve as a side effect of onboarding
  one user.

## What's explicitly out of scope

- No change to Amit R's account.
- No taluk-level zone creation for Alappuzha/Idukki splits — separate,
  already-tracked open item.
- No RLS/visibility impact — Sales Staff zone assignment is a
  responsibility record only.

## Open questions (Basheer's call)

1. Create Vivek now with just the 4 clean districts assigned, and
   revisit the taluk split later? Or hold the whole account until the
   taluk zones exist so his record is complete from day one?
2. Login credentials — same onboarding flow as any other new Sales
   Staff, or anything Vivek-specific to confirm first (e.g. is he
   actually starting to use the system now, or is this purely a
   territory-record correction)?

## Verification

Once created: confirm Vivek appears in User Directory (Sales Staff,
Critical Care, reports to Adarsh), confirm his 4 assigned zones show up
under his name in Territory Admin's coverage view, confirm Amit R's
existing 2 opportunities are unaffected (still owned by Amit R, not
Vivek).
