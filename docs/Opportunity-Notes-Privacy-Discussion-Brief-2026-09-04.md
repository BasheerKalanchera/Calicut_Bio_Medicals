# Hiding Senior Staff's Private Notes on Opportunities — Discussion Brief for Haroon

**Date:** 2026-09-04
**Raised by:** Haroon, after noticing Nishad and Fazal could see opportunities
Haroon had personally entered in their zones
**Status:** Discussion only — nothing built yet. Basheer wants Haroon's buy-in
on the approach below before an implementation plan gets written.

## The problem Haroon raised

Haroon works deals himself, not just from the office — he visits hospitals,
has discussions, and logs opportunities directly, the same as any rep. Today,
when he does that, the local Area Manager (Nishad or Fazal, depending on the
zone) can see everything about that opportunity — including Haroon's private
discussion notes. That's not a bug; it's how the system was deliberately
built: an Area Manager is meant to see everything happening in their own
territory, regardless of who entered it. But Haroon doesn't want his personal
notes visible to junior staff, even though the system is technically working
as designed.

Haroon's ask: apply the same kind of restriction juniors already have — "you
only see what's yours" — up the chain too, so an Area Manager can't see an
SBU Manager's or the GM's opportunities in their territory, and an SBU
Manager can't see the GM's.

## Why we didn't just do that

We looked at blocking the *entire* opportunity record — hiding the deal
completely from anyone below the level of the person who owns it. It solves
the privacy problem cleanly, but it has one serious side effect: **it removes
the only safeguard that currently exists against two people unknowingly
working the same hospital.**

Right now, before starting a new deal, the way a rep or manager checks
whether someone else is already working an account is by looking at that
hospital's page and seeing what's already there. If Haroon's opportunity at
a hospital in Nishad's territory becomes completely invisible to Nishad,
Nishad has no way to know it exists — and could start his own deal at the
same hospital without realizing Haroon already has one in progress. There's
no other check in the system today that would catch that.

One thing this change would *not* affect either way: **who gets credit for a
sale.** That's already based on who owns the deal, not who can see it. If
Haroon works a deal, it's already Haroon's number for reporting purposes —
that doesn't change under any of the options below.

## What we're proposing instead: hide the notes, not the deal

Keep the opportunity itself — hospital, product, deal value, stage — fully
visible to the territory/SBU owner, exactly as today. Only hide the
*discussion notes* (the Activity tab — call logs, meeting notes, visit
write-ups) logged by someone above the viewer's level.

In practice: Nishad would still see that Haroon has an active deal at a
hospital in Nishad's zone — deal name, product, value, stage — so he knows
not to start a competing conversation there. What he wouldn't see is the
content of Haroon's actual visit notes and discussions on that deal.

- **Pro:** Solves Haroon's privacy concern directly, while keeping the one
  safeguard that currently prevents duplicate outreach to the same hospital.
- **Con:** Doesn't fully separate "territory" from "hierarchy" the way
  Haroon's original ask implied — a junior person still knows a senior
  person's deal exists, just not what was discussed.
- **Effort:** Contained to one access-control rule (how notes are shown),
  no changes to how opportunities themselves are shown, no impact on
  existing dashboards/reports.

## Option we ruled out: hide the whole opportunity

- **Pro:** Complete privacy — a junior person wouldn't even know the deal
  exists.
- **Con:** Opens the duplicate-outreach risk described above, with nothing
  in the system today to catch it instead. Would also need extra care in
  any future Target-vs-Actual reporting to make sure team/SBU totals still
  count deals that became invisible to the manager pulling the report
  (attribution stays correct either way, but the manager's own screen could
  under-count without that extra care).

## Recommendation

Go with hiding the notes only, not the whole deal. It addresses exactly what
Haroon described as the actual concern (his private discussions being
readable by junior staff) without introducing a new blind spot the system
has no other way to guard against.

## Still open, pending Haroon's input

- Should this also apply to files/documents attached to an opportunity
  (photos, POs), or just the discussion notes?
- If someone is deliberately looped into a deal (e.g., asked to help close
  it), should they see everything on it regardless of rank, or still have
  senior-level notes hidden from them?
