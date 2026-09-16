# Scorecard Single Source of Truth — Implementation Plan

**Superseded 2026-09-16 by `docs/Scorecard-Maintenance-Process.md`** — this
file is kept for historical record of the original design decisions only;
for how the system is actually operated day to day, see that file instead.

**Status:** Draft, awaiting Basheer's review. **Problem:** feature status
currently gets hand-typed in three places that have each drifted
independently — `Signed-Requirements-to-PRD-Traceability.md`'s own header
tally (stale: "24 Done · 15 Partial · 11 Not started" vs. its real current
count), `Phase1-Delivery-Scorecard.md`'s summary banner (caught stale
2026-09-15, fixed by hand, will drift again the next time a row flips
without someone remembering to recount), and the published Artifact
(a static snapshot that's only as fresh as the last time someone
remembered to republish it). Goal: one file anyone ever hand-edits a
status in; everything else gets generated from it.

## What stays exactly as it is

- `Signed-Requirements-to-PRD-Traceability.md` remains a plain Markdown
  table, same columns, same module sections (1 through 7, plus 6b) — no
  new file format to learn, no new tool to run to *edit* a status.
- `Phase1-Completion-Sprint-Plan.md` stays hand-maintained. It buckets
  items by scheduling judgment (this week / next week / blocked), which
  isn't something a status field can generate — but whenever I touch it
  I'll check it against the same Traceability row rather than trusting my
  memory of where things stand.

## What becomes generated instead of hand-typed

1. **`Phase1-Delivery-Scorecard.md`** — every per-module table, the
   Summary banner (Done/Partial/Not-started counts), and both progress
   percentages, all computed from Traceability's rows. Never hand-edited
   again; edit Traceability, then re-run the script.
2. **A new client-facing dataset** — Signed Feature ID, Requirement, and
   Status for all 50 rows, plus a plain-language "what's left" Client Note
   on Partial rows only (Done needs no explanation; Not-started's own
   status already says everything). Nothing from the internal Notes column
   ever reaches this output — it's built from different source fields, not
   filtered/hidden at render time, so there's no internal text embedded in
   the published page for anyone to dig out.
3. **The published Artifacts** — internal Scorecard page (existing one,
   left alone until this is verified, then repointed) and a new, separate
   client-facing page reusing its visual design. Republishing both becomes
   a standard last step whenever a feature ships, not a remembered chore.

## Resolved: three note fields per row, one table, three readers

**Basheer's call:** keep the detailed internal notes internal, and the
notes the client sees need to read as plain business language, not
technical jargon. So the table carries three separate note columns —
same row, three tones, nobody ever retypes the same explanation twice by
hand once this is built:

- **`Notes`** (exists today) — full technical detail: doc/file
  references, internal decision trail, exact field/rule names. Never
  leaves Traceability.md.
- **`Leadership Note`** (new column) — what Scorecard.md shows today.
  Basheer already writes this by hand, one per row, condensed and
  presentation-ready but can still name Haroon/internal decisions freely
  (Cabio's own leadership already sees this). **No fresh writing needed
  for existing rows** — this is a straight move of the wording already
  sitting in today's Scorecard.md into this new column, row for row.
- **`Client Note`** (new column, filled in for the 14 Partial rows only)
  — plain business language, no technical jargon, no internal names, no
  internal doc references. What's actually new content to write.

The generator reads `Leadership Note` for Scorecard.md and `Client Note`
(Partial rows only) for the client dataset — `Notes` itself is never read
by either generator, only ever displayed inside Traceability.md.

## The "Commitment beyond contract" table (15 extra features)

Currently lives only in Scorecard.md, no Traceability equivalent. Moving
it into Traceability.md as a second table (same file, new section) so it's
generated too, not hand-copied. Its existing wording already reads as
external-safe (no internal names, already written for an outside reader)
— **recommend including it on the client dashboard as-is**, since it's
unambiguously positive, no-risk content. Flag if you'd rather hold it back.

## Build sequence

1. Add `Leadership Note` (populated by moving each row's existing wording
   straight over from today's Scorecard.md — no fresh writing) and
   `Client Note` (added empty, filled in at step 3) to Traceability.md;
   also move the "Commitment beyond contract" table in as a second
   section, and fix Traceability's own stale header tally.
2. `scripts/generate_scorecard.py` (Python, no new dependencies) — parses
   Traceability's tables, regenerates Scorecard.md using `Leadership
   Note`. **Verify it reproduces the current Scorecard exactly**
   (byte-diff) before trusting it for a real edit.
3. Draft the 14 Client Notes — plain business language, no jargon, no
   internal names — reviewed by you before anything downstream uses them.
4. Extend the script (or add a second script) to emit the client-facing
   dataset (`Signed Feature ID`, `Requirement`, `Status`, `Client Note`)
   from the same source.
5. Build the new client-facing Artifact, styled off the existing internal
   one's look. New URL — existing internal Artifact untouched until this
   is proven, then both get folded into the standard "republish on ship"
   step.

## Explicitly out of scope for this pass

True zero-touch live refresh (client's already-open tab updating itself
with no republish action) — would need the page reading from a live
database instead of a generated file. Bigger build, not warranted yet;
revisit if the manual-republish cadence turns out to be too slow in
practice.
