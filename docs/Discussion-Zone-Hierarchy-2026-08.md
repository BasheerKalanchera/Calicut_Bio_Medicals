# Geography (Zones) & Role Visibility Redesign — Discussion Summary

**Status:** Draft — for review with Shruthi, Adarsh, and Haroon before any build
work starts. Nothing described here is built yet.
**Updated:** 2026-08-10 — answered a few of the open questions below after a
review discussion, then renamed "place" to "territory" throughout and added a
few more principles after a second review pass; then added a section on
corporate-parent decision-makers across territories (the Aster DM example).
**2026-08-11:** added a section on keeping data entry simple for reps and
who maintains the territory map itself, surfaced while gathering real
South Kerala/Karnataka geography data (see `Zone-Hierarchy-Territory-Data-
2026-08.md`).
**Date:** 2026-08-10
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Plain-language summary of how Cabio's geography (zones/districts)
and role-based visibility should be restructured so it survives expansion beyond
Kerala and Karnataka, written to be reviewed by non-technical stakeholders, not
just engineers. Related but separate topic: see
`Discussion-Buyback-Freetext-And-Intake-2026-08.md` for the trade-in/buyback
handling discussed the same day.

---

## Why this came up

Two separate, real needs surfaced at the same time:

1. Cabio wants finer geography than today's 5 zones — districts within Kerala,
   and sub-areas within the Bangalore metro (Shruthi and Adarsh's input needed on
   the actual list).
2. Some Area Managers already need to cover **more than one** zone (Fazal's
   situation — see `Multi-Zone-Assignment-Technical-Design.md`), and today's
   system only lets one person hold exactly one zone.

Digging into both together surfaced a naming problem: the role called **"Area
Manager"** was never about a sub-zone at all — when it was created (see
`Opportunity-Access-Hierarchy-Proposal.md`), "Area" was picked specifically as a
plain-English word for "the zone/region you're in charge of." So "Area" already
means "Zone," today, in the title of an existing role. Introducing a *new*,
smaller "Area" (a district, or part of Bangalore) creates two different things
with the same name. **Recommendation: rename "Area Manager" to "Zone Manager"**,
which frees up "Area"/"District" for the new, smaller subdivision and makes the
title match what the role actually does.

## The design: one flexible list of "territories," not fixed levels

The naive way to add districts would be a new "District" table sitting under the
existing "Zone" table. But if Cabio ever expands to a new state, that pattern
means adding *another* new table, and another, every time the business grows —
real engineering work each time.

**Better approach, and the one being recommended: keep a single table of
"territories," where each territory just knows what territory it sits inside.**
(Raised in review: "territory" is the better word for this than the earlier
draft's "place" — it's the actual sales/CRM term for "an area someone's
responsible for," not just a geography label. Updated throughout this document.)
Think of it like a folder structure on a computer — a folder can sit inside
another folder, which sits inside another, as many levels deep as needed,
without needing a different *kind* of folder for each level.

**Worth keeping separate: this is about the word used in conversation and in
this document, not necessarily the actual database table name.** Today's live
system already has a working "zone" table with real customer and user records
pointing at it. Whether that table itself gets renamed to "territory" — a real
piece of migration work — or just keeps its current name under the hood while
everyone calls it "territory" in conversation, is a call for the technical
design stage, not something decided here.

**Also worth being precise about, since the word "territory" has come up before
in a different context:** `Multi-Zone-Assignment-Technical-Design.md` already
considered and turned down a *different* idea that also used the word
"territory" — giving Fazal's specific combination of North Kerala + Mangalore
its own single named, reusable label (like "Fazal's Territory"), instead of just
listing his two zones separately. That idea is still turned down, for the same
reason as before (see "A person can be responsible for more than one territory"
below) — nothing here brings it back. This section is only about renaming the
individual tree nodes themselves (North Kerala, Kozhikode, and so on) from
"place" to "territory," not about grouping several of them under one new label.

Concretely, today's 5 zones plus new districts would look like this — all rows in
the same table:

```
Kerala                         (top-level)
 └── North Kerala              (sits inside Kerala)
      ├── Kozhikode District   (sits inside North Kerala)
      └── Kannur District      (sits inside North Kerala)
 └── South Kerala
 └── Central Kerala
Karnataka                      (top-level)
 └── Bangalore
      ├── Whitefield           (sits inside Bangalore)
      └── Electronic City
 └── Mangalore
```

**Why this is the extensible choice, specifically for going pan-India later:** if
Cabio opens up in, say, Tamil Nadu next year, that's just new rows —
"Tamil Nadu," then whatever zones and districts sit inside it — added the same
way North Kerala's districts were added. No new tables, no schema changes, no
engineering project. The system doesn't need to know in advance how many levels
deep the map goes, or how many states there will eventually be — it already
supports any depth, anywhere in the country, because "a territory sitting inside
another territory" is the only rule it needs.

## Who's in charge of what — clarified

Checked the actual current rules directly in the system, not just the org chart:

| Role | What they can see today |
|---|---|
| Admin | Everything, company-wide |
| General Manager | Everything, company-wide — **identical to Admin today**, no distinction currently built between the two |
| SBU Manager | Everything in their business unit (Imaging or Critical Care), any zone |
| Area Manager → **Zone Manager** *(rename recommended)* | Everything in their business unit, within their assigned zone(s) |
| Sales Manager | Only deals belonging to the people who report to them |
| Sales Staff | Only their own deals |

**Important, separate point:** none of this — today or after this redesign — has
ever restricted who can see a **customer record** (Account). Any zone-based
restriction only ever applies to **deals** (Opportunities). Every employee can
browse the full customer/hospital directory regardless of role. This redesign
doesn't change that.

## Three different things this design keeps separate — raised in review

It's easy to blur these together once territory, deals, and ownership are all
part of the same conversation. Worth naming them separately, because each one
answers a different question and changes independently of the others:

1. **Territory Assignment** — *"which territory is this person responsible
   for?"* Example: Fazal is responsible for North Kerala and Mangalore. This is
   the list described below, under "A person can be responsible for more than
   one territory."
2. **Opportunity Ownership** — *"who owns this particular deal?"* Example: deal
   #123 is owned by Rep A. This already exists today and doesn't change as part
   of this redesign.
3. **Opportunity Territory** — *"which territory does this deal belong to?"*
   This is **not** a new, separately-entered field, and nobody types it in by
   hand — a deal's territory is always simply whatever territory its customer
   (Account) is tagged with, exactly like today. A deal can never disagree with
   its own customer's territory.

Keeping these three separate matters especially when: a rep changes territory, a
rep temporarily covers someone else's territory, a customer sits right at a
boundary, two people overlap during a handover, or old reports need to still
make sense after the map changes later. A territory change is never an
ownership change, and an ownership change never requires a territory change —
the rest of this document keeps those apart.

## How "who's in charge of a territory" scales to cover the whole tree

Once territories can be nested (Kerala contains North Kerala, which contains
Kozhikode), a manager in charge of Kerala needs to see everything under it — not
just things tagged exactly "Kerala," but everything in North Kerala, South
Kerala, Central Kerala, and any districts under those too. Someone in charge of
just North Kerala should see North Kerala and everything under *that*, but not
South Kerala.

**How the system checks this quickly, in plain terms:** rather than recalculating
"what's underneath this territory" from scratch every single time someone opens
a screen, the system keeps a pre-built list per territory — like a coverage
binder — listing every single territory underneath it, all the way down. The
Kerala binder lists Kerala plus every zone and district underneath it. The North
Kerala binder lists just North Kerala and what's under it. Checking "can this
person see this deal?" becomes a quick look-up in their binder, instead of a
live recalculation. The binder only needs reprinting when the map itself changes
(a new district added, a zone moved) — a rare, deliberate action, not something
that happens every time someone views a deal.

**Raised in review — keeping the binders correct.** Two things need to be true:

- **Automatic, every time:** the moment someone edits the map (adds a district,
  moves a zone under a different one), reprinting the binders affected by that
  one change happens right then, as part of that same action — not a separate
  step someone has to remember to do afterward.
- **Manual, on demand, as a safety net:** separately, there should always be a
  way to say "ignore whatever's currently stored — throw it all away and rebuild
  every binder from scratch, based on today's actual map." This doesn't try to
  figure out what went wrong; it just recomputes everything fresh. Worth having
  because this kind of automatic bookkeeping is new to Cabio's system — if it
  ever has a bug, or a map change happens in a way the automatic step doesn't
  catch, this is how it gets fixed without anyone needing to hunt for the one
  wrong entry. The map itself will always be small (a few hundred territories
  even fully built out across the country), so rebuilding everything from
  scratch is cheap — there's no downside to always having it available.

This should be handled the same way Cabio already handles this kind of
"keep two related things in sync" problem elsewhere (see the "primary zone"
bookkeeping in `Multi-Zone-Assignment-Technical-Design.md`) — as part of the
normal save/update logic, not as separate automatic database-level machinery.
Zone-map edits are rare and deliberate (an admin action, not something that
happens while someone's just using the app), so this doesn't need to be
instant-fast, just correct.

## A person can be responsible for more than one territory

Separately, a person isn't limited to exactly one zone — this was already being
designed for Fazal's situation (covering both North Kerala and Mangalore). That
mechanism — a simple list of "this person is responsible for this territory" —
already works for any role, at any level of the tree: a Zone Manager covering two
zones, a Sales Manager covering one district, or a Sales Staff member covering a
single sub-area of Bangalore, all use the exact same mechanism.

**This list is still needed even with the tree in place — it isn't replaced by
it.** The tree only expands *downward* from one starting point: put someone in
charge of Kerala, and they automatically cover North/South/Central Kerala and
everything under those, because that's genuinely one branch of the map. But
Fazal's actual two zones — North Kerala and Mangalore — sit in different
branches entirely (different states), with no shared "parent territory" the
system could anchor him to without also handing him every other zone in
between. So his case still needs two separate entries on his list — one for
North Kerala, one for Mangalore — each of which then expands downward on its
own. The tree reduces how many entries a true whole-region assignment needs
(covering all of Kerala becomes one entry instead of three); it doesn't remove
the need for the list itself, since real coverage patterns often span branches
that don't share a sensible common parent.

## What happens if a rep's own deal falls slightly outside their assigned patch

Even with each rep responsible for their own exclusive patch, two everyday
situations can make "what's in my patch" and "what's actually mine" disagree:

- A rep has a long-standing relationship with a customer that's technically just
  outside their newly-drawn district line, but they're still the one working it.
- A new hire hasn't been assigned a patch yet, or a district hasn't been split up
  yet even though it should be.

**The recommended rule handles both:** a person can always see (a) their own
deals (or, for a manager, their team's deals), **and, in addition,** (b)
everything tagged inside whatever patch(es) they're responsible for. In the
clean, everyday case — one rep, one exclusive patch, everything correctly
tagged — both halves of that rule give the same answer, so nothing changes day to
day. The first half only matters at the edges, so a rep never loses sight of
their own work just because the map hasn't caught up with reality yet.

> **The rule, stated plainly (raised in review, to remove any ambiguity):**
> being responsible for a territory *adds* visibility — it never takes away
> visibility someone already has from owning a deal or managing a team. Every
> person can always see their own deals, plus their team's deals if they manage
> one, plus every deal inside any territory they're responsible for. Nobody's
> visibility is ever narrowed down to *only* their territory — that would mean a
> rep could lose sight of their own deal the moment a district line gets
> redrawn, which is exactly the failure this rule exists to prevent.

**Confirmed in review — this is needed, specifically for handovers.** If two
people are ever assigned to the *same* patch at the same time, they *would* see
each other's deals in that shared patch, because "everything tagged inside my
patch" doesn't check who owns it. The real case for this: a rep handing their
patch over to someone else, whether they're leaving the company or moving to
cover a different area. During that handover, both the outgoing and incoming rep
need to see the same deals, until the handover is finished. Nothing new needs to
be built for this — nothing stops two people from both being marked responsible
for the same patch at the same time, so the overlap just happens naturally for as
long as both are assigned. Ending it is one simple step: take the outgoing rep
off that patch once they've left or moved on. Outside of an active handover, a
patch should only ever have one person assigned to it — this is meant to be a
short, deliberate overlap, not a normal standing arrangement.

**Refined in review — this depends on *why* the handover is happening.** A rep
always sees their own deals regardless of patch, so if a deal's ownership never
formally moves to the incoming rep, the outgoing rep keeps seeing it long after
the handover is "done." Cabio already has two separate ways of representing
"whose deal is this," and each fits a different kind of handover:

- **The rep is leaving the company:** their deals should be **fully handed over**
  to the incoming rep — the incoming rep becomes the new owner, plain and simple.
  There's no reason to keep an ex-employee attached to a deal's ongoing credit
  once they're gone; if Cabio owes them anything for work already done, that's a
  payroll/HR matter to settle separately, not something the system needs to keep
  track of.
- **The rep is staying at Cabio, just moving to a different area:** the incoming
  rep still needs to become the owner going forward, but it's fair to give the
  outgoing rep a share of the credit for deals they'd already been working before
  the handover. Cabio already has a mechanism built for exactly this — the
  existing Split feature, used today to divide credit between multiple people
  working the same deal. The outgoing rep could hold a Split share reflecting
  their earlier work, without needing to remain "the owner" to get any credit for
  it at all.

Not a problem the system needs to solve on its own — just needs a clear answer on
which of these two cases applies, and specifically whether Cabio wants to use
Split for the "moved, didn't leave" case.

## Keeping history stable as the map changes — raised in review

Two more principles worth locking in now, even though exactly how they get
built is a technical-design question, not a business one:

**Editing the map should never quietly rewrite old numbers.** If Kozhikode ever
moves from being part of North Kerala to being part of Central Kerala, that's a
pure map edit — it should not change which territory last year's already-closed
deals get counted under when someone re-runs an old report today. A report for a
past period should keep reflecting the map as it stood back then, not today's
version of it.

**Editing the map should never touch who owns a deal, either.** This is a
separate rule from the one above, easy to blur together with it: moving
Kozhikode to a different parent territory is purely about how geography is
organised, and on its own must never reassign any deal's owner or rewrite who
gets credit for a deal that's already closed. Changing who owns a deal only ever
happens through an actual handover (described above) — never as a side effect of
redrawing a boundary.

**Separately: it's worth recording not just who covers a territory today, but
since when.** The simplest version of "who's responsible for this territory" is
just a plain list with no dates — good enough day to day, and what's described
above. But the handover case already shows time matters, so it's worth adding
*when* someone's responsibility for a territory started and ended, not just who
currently has it — a small addition (two dates per entry), and it also answers a
useful question later: "who was responsible for North Kerala when this deal was
created?" This is a different thing from the map-history point above, worth not
conflating with it — this is about who was assigned to a territory and when; the
map-history point is about what the territory tree itself looked like on a given
date. Both are worth having; they solve two different questions and likely need
two different mechanisms.

## Keeping data entry simple for reps, and who maintains the map itself — raised 2026-08-11

Two related concerns, both real, neither addressed anywhere above.

**Concern 1 — this must not become a data-entry burden for reps.** Nobody
tagging a customer Account should have to click through State → Zone →
District → Taluk every time. Two things keep it cheap:

- **Default to the rep's own territory.** The common case — a rep creating
  an Account inside their own patch — needs zero clicks: the Account
  defaults to whatever territory the creating rep is themselves
  responsible for, the same "default to caller's own, override only if
  needed" pattern already used for Opportunity SBU (`BR-OP-12`). Override
  is only needed for the genuine exception — a boundary case, a referral
  into someone else's patch, or an Admin/GM entering data on someone's
  behalf.
- **A search box, not a click-through tree, for the override case.**
  Typing a place name ("Kayamkulam," "Ernakulam") and resolving straight
  to the matching territory — the same shape as address autocomplete —
  beats forcing anyone to know or click through every intermediate level.
  A rep shouldn't need to know Kayamkulam sits under Alappuzha under South
  Kerala just to tag a hospital there.
- **Tagging stops at whatever level is actually meaningful — never forced
  deeper.** An Account in Ernakulam gets tagged "Ernakulam" and that's a
  complete entry; nothing should force drilling to taluk level unless the
  Account genuinely sits in one of the few places (Idukki, Alappuzha)
  where that precision actually matters for assignment. The tree already
  supports tagging any node, not just leaves — the UI needs to honor that
  rather than force maximum depth on every entry.

**Concern 2 — the tree needs its own management screen, not manual SQL.**
Confirmed real, not hypothetical, by `docs/Zone-Hierarchy-Territory-Data-
2026-08.md`: gathering real geography data for just two states in one
afternoon already needed a district re-parented to a different cluster
(Coorg), two cluster renames (Karnataka South/Central), and several
additions (Bhatkal, North Kerala's district set) — all done today as
document edits, because no live tree exists yet to edit directly. Once
this is real, it can't stay a developer-only SQL operation the way today's
5-row `zone` table is.

**Design, matching the pattern already set by other admin-only areas
(e.g., Product Catalog's role gate):**
- **Access:** Admin/GM only — matches this doc's own framing of map edits
  as "a rare, deliberate admin action," not a rep-facing feature.
- **Shape:** a tree view (expand/collapse), not a flat table — mirrors the
  data's own structure, so an admin can see exactly what they're about to
  change.
- **Actions:** add a territory (name + parent), rename a territory,
  re-parent a territory (move it under a different parent — exactly what
  happened to Coorg today), and deprecate/merge one (the still-open
  Central Kerala question from the territory-data doc needs exactly this).
- **Before a move, show its blast radius** — how many Accounts/Users
  currently sit under this territory or its children — not to block the
  move, but so the admin isn't acting blind. Reassures with this doc's own
  already-stated guarantee: moving a territory never touches deal
  ownership or rewrites past reports, only where it sits in the tree (see
  "Keeping history stable as the map changes" above).
- **Triggers the coverage-binder recompute** for the affected subtree
  automatically, as part of the same save — not a separate step, per the
  mechanism already described in "How 'who's in charge of a territory'
  scales to cover the whole tree" above.

**Not yet decided — carries forward to the eventual technical design and
implementation plan, not resolved here:** exact screen location/entry
point; whether non-Admin/GM roles get any read-only tree view (e.g., so a
rep can see the shape of their own patch); and whether "deprecate" is a
real, tracked state or a territory just gets emptied of assignments and
left orphaned.

## A deal's territory vs. where the buying decision actually happens

Real example that came up: **Aster DM Corporate** is based in Bangalore;
**Aster MIMS Calicut**, one of its hospitals, is in North Kerala. A deal tied to
Aster MIMS Calicut — demo happens in Calicut, equipment gets installed there —
but final pricing and negotiation is handled by Aster DM's Bangalore corporate
office, not the Calicut hospital itself. This isn't a one-off; it's a common
pattern for Indian hospital chains and groups, and worth a clear answer since
it touches both territory and ownership at once.

**This needs no new schema — it's already modeled today.** Every Account can
already have a parent (`Account.parent_account_id`), built for exactly this —
a hospital chain's individual hospitals point back to the parent corporate
account. So:

- Aster DM Corporate = one Account, territory Bangalore, no parent.
- Aster MIMS Calicut = a separate Account, territory North Kerala, parent =
  Aster DM Corporate.

**The deal itself stays with the child account.** The Opportunity is filed
under Aster MIMS Calicut, same as any deal — so its territory is North Kerala,
following the existing rule that a deal's territory is always whatever its own
Account is tagged with. The North Kerala team sees it exactly like any other
North Kerala deal.

**The Bangalore decision-maker is represented as a Stakeholder, not a
territory change.** Cabio already has a way to record who actually makes the
call on a deal, separate from which territory it's filed under — a
Stakeholder. The Aster DM Corporate contact gets recorded as a Stakeholder
under the *parent* Account (Aster DM Corporate), then linked to the Calicut
Opportunity with a role like "Final Pricing Authority." No new mechanism
needed.

**One real gap found while checking this — worth fixing alongside the
technical design.** Today, the screen where a rep picks stakeholders for a
deal only shows stakeholders belonging to that deal's own Account — so a rep
working the Calicut deal currently can't actually pick the Bangalore contact,
even though nothing underneath stops it. Small, contained fix: widen that
picker to also show the parent Account's stakeholders, clearly labelled so
it's obvious they're not on-site.

**Who owns the deal — Basheer's working assumption, pending confirmation from
Haroon:** the local North Kerala rep stays the deal owner in the normal case —
they own the site relationship, run the demo, and typically drive the
corporate conversation too. A Bangalore-based rep helping with the corporate
negotiation doesn't need a new mechanism — that's exactly what Split already
does (same business unit, any territory), giving the Bangalore rep a share
without changing who owns the deal. This only needs revisiting if Cabio has,
or plans to have, a dedicated corporate-accounts rep who should become the
actual deal owner instead of just assisting.

**One minor, non-blocking gap noted in passing:** `Account.customer_type` has
no "Corporate/Group HQ" option today — a corporate account like Aster DM would
have to go under "Other." Not a blocker, just worth knowing.

## What does NOT change

- The sales process, deal stages, and approvals are untouched.
- Customer/Account visibility stays company-wide for everyone, as it is today.
- Sales Manager and Sales Staff's day-to-day access doesn't disappear or shrink —
  it gains an additional geography-based layer on top of what they already have,
  it doesn't lose the "my own deals" / "my team's deals" guarantee.
- Editing the territory map never reassigns a deal's owner, and never rewrites
  how an already-closed deal shows up in past reports — see "Keeping history
  stable as the map changes" above.

---

## Open Decisions Needed Before Any Build Work Starts

1. **Confirm the rename:** Area Manager → Zone Manager.
2. **The actual district/sub-area list** — Shruthi and Adarsh's input on how
   Kerala districts and Bangalore sub-areas should actually be divided.
   **In progress, still converging** — see
   `docs/Zone-Hierarchy-Territory-Data-2026-08.md` (South Kerala from Adarsh
   and Vivek, Bangalore + wider Karnataka from Shruthi, gathered
   2026-08-11) — kept as a separate working document rather than inlined
   here since the actual list will keep changing as it's reviewed, while
   this document is meant to stay a stable design record.
3. **Resolved — how patch-based targets get recorded, without breaking Cabio's
   existing target rule.** Cabio's rule today is that targets are set per
   salesperson and business unit only — geography isn't part of it. This isn't
   actually a new question, though: a separate document
   (`Multi-Zone-Assignment-Technical-Design.md`) already recorded that Haroon
   confirmed the opposite for Fazal — he's measured against two separate targets,
   one per zone he covers. The way to support that without turning "patch" into a
   new required layer everyone has to go through: add patch as an **optional
   extra label** on a target, not a new step in the chain. A target still belongs
   to a person, for a business unit, for a time period — it just *additionally*
   says which patch it's for when that's relevant. A Sales Staff member gets one
   target per patch they cover; an SBU Manager, who isn't tied to any one patch,
   just leaves that label blank and their target covers the whole business unit
   as it does today. Nothing about the existing rule breaks — this only adds
   detail for the people it applies to. What's left is making sure Cabio's
   official rules document gets updated to say so, once target-setting is
   actually built (it doesn't exist as working software yet, so nothing today is
   being broken by this). Separately, still genuinely open: should a patch
   assignment also widen who a Sales Manager/Sales Staff can *see deals for* (the
   "everything in my patch" half of the rule above), independent of targets? That
   still needs a yes from Haroon/leadership.
4. **Resolved:** two people sharing the same patch at the same time is expected
   and needed — see the handover explanation above. It should only ever happen
   during an active handover, never as a standing arrangement.
5. **Should Admin and General Manager ever become functionally different roles**
   (e.g., only Admin can manage users/system settings), or should they stay
   identical as they are today? Not urgent, but worth a conscious answer rather
   than leaving it as an accident of how the system was first built.
6. **When a handover finishes because the rep is leaving Cabio, deals should
   fully transfer to the incoming rep — confirm that's acceptable as the
   default.** For the "moved to a new area, stayed at Cabio" case: should the
   outgoing rep get a Split share for their prior work on handed-over deals, or
   should ownership transfer just as cleanly as the leaving-company case? See the
   handover explanation above.
7. **Confirm with Haroon — corporate-parent decision-makers across
   territories.** Is the corporate-level negotiation always run by the local
   (child-account) rep, with a Bangalore-based rep only optionally assisting via
   Split? Or are there cases with a dedicated corporate-accounts rep who should
   become deal owner instead? See the Aster DM example above.

**Not yet scoped as build work.** This document exists so the above can be
reviewed and decided first — once confirmed, a technical design (schema, RLS,
screens) will follow the same pattern as
`Multi-Zone-Assignment-Technical-Design.md`, and will need to carry forward the
principles from "Keeping history stable as the map changes" above (protecting
past reports from map edits, keeping map edits separate from ownership changes,
and recording when a territory assignment started and ended) as real
requirements, not just good intentions.
