# Duplicate Hospital Names — Decision Needed from Haroon

**Date:** 2026-08-29
**Raised by:** Basheer, during the extended sales team walkthrough
**Status:** Awaiting Haroon's decision. Option B has been built and validated as a
prototype (2026-08-30) against two real incidents that happened while this brief
was still pending — see BR-ACC-03 in `docs/Business-Rules.md` for what was built
and its known trade-offs. It is not rolled out to the sales team; that's still
Haroon's call between Option A and Option B below.

## The problem

Adding a new hospital to the Customer Directory only blocks an exact-name
match. A name that's just one character different from an existing hospital
is allowed through — so two records for what's really the same hospital can
end up in the system (a typo, an extra space, a small spelling variation).

## Option A — Only Admins can add a new hospital

Today, any rep can add a new hospital while entering a lead. Under this
option, that changes: if a rep visits a hospital that isn't in the system
yet, they can no longer add it themselves. They'd have to ask an Admin
(Basheer or Abdul) to add it first, then come back and log their visit.

- **Pro:** Simplest possible fix — no duplicate hospitals ever get created,
  because only a few trusted people can create one at all.
- **Con:** Slows the team down in the field. "Walk in and add the hospital
  on the spot" is part of how the app is meant to work today — this option
  removes that.
- **Effort:** ~half a day to build.

## Option B — The system warns you before creating a near-duplicate

A rep adds a new hospital name as usual. If the system notices an existing
hospital with a very similar name (e.g., "City Hospital" vs. "City
Hosptial," or a stray extra word), it pops up a message like: *"Did you
mean: City Hospital (already in the system)? [Use this one] [No, this is a
different hospital — create it anyway]"*. The rep sees the possible match,
decides in one tap, and moves on. If it's genuinely a different hospital (a
different branch, a coincidence in naming), they just confirm and it's
created — no admin needed.

- **Pro:** Keeps the "add hospitals on the spot" freedom the team already
  has, while catching typos before they become two records for the same
  hospital.
- **Con:** Takes more work to build (roughly 2–3x the effort of Option A),
  and the "how similar is too similar" sensitivity will likely need a bit
  of real-world tuning in the first few weeks — so it neither misses
  obvious typos nor nags reps about genuinely different hospitals that
  happen to share common words like "Hospital" or "Medical College."
- **Effort:** ~1–1.5 days to build, plus follow-up tuning time.

## Recommendation

Option B better matches how the field team is expected to work, at a
moderate extra cost. Option A is the fallback if speed-to-ship matters more
right now than field-workflow friction.
