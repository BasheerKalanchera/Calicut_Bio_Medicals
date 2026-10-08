# <Feature> — Implementation Plan

**Status:** Draft, YYYY-MM-DD. <Change to "Approved YYYY-MM-DD (Basheer)"
only once every line in "Decisions" names Basheer — a save-time check
refuses Approved while any decision is still "proposed".>
**Traceability rows:** <row numbers and names>
**Design / discussion:** <link, if any>

<!-- Planning rules (moved here word for word from CLAUDE.md, 2026-10-08):
- When a dependency crosses environments (Dev vs. UAT, any system boundary), say
  which environment it lands in, in the plain-language pass itself. (2026-09-19)
- When there's an obvious heavy design and a lighter one that gets most of the
  value, offer both as a real choice up front. (2026-09-19)
- Don't add a design case just for symmetry; each case must add something that
  would otherwise be lost. (2026-08-31)
- Mirroring an existing feature: when a feature is modeled on an existing one,
  checklist every surface the original touches — notification-bell coverage
  per recipient role, list-view badges/counts, every screen a parallel role
  would expect — before finalizing scope. If leaving one out, give a real
  behavioral reason, not "the plan didn't mention it." (2026-09-18)
Delete this comment block from the finished plan. -->

## Decisions

Every choice this plan depends on, one line each. Claude's suggestions end
in `— proposed`; once Basheer answers, change the ending to
`— Basheer, YYYY-MM-DD`. Wording added by Claude that changes scope (a new
table, screen, column or rule) is a decision and goes here too.

- <choice> — proposed
- <choice> — Basheer, YYYY-MM-DD

## 1. In plain terms

<What changes for the people using it, no jargon.>

## 2. Build order

<Numbered steps, with checkpoint commits. If the build lands in partial
steps, say for each step what stops working on Dev until the next step
lands.>

## 3. What could be affected

For any change to how data is fetched or saved, list every way into it,
found by a code search:
- (a) screens that request it directly;
- (b) reports or links that open those screens with a filter;
- (c) other screens that reuse or pre-fetch its data, including saves that
  update it in place.

Each item gets a check before and after the change. Browser checks cover
only the items on this list; a path the change doesn't reach gets no
browser check. Write
"None — <reason>" if the change has no such reach. Fill this in before
the plan is approved.

## 4. Not in this plan (with reasons)

## 5. Business rules and records to update

## 6. Technical addendum

<Files, tables, endpoints, tests.>
