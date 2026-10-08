# <Feature> — Implementation Plan

**Status:** Draft, YYYY-MM-DD. <Change to "Approved YYYY-MM-DD (Basheer)"
only once every line in "Decisions" names Basheer — a save-time check
refuses Approved while any decision is still "proposed".>
**Traceability rows:** <row numbers and names>
**Design / discussion:** <link, if any>

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

<Numbered steps, with checkpoint commits.>

## 3. What could be affected

For any change to how data is fetched or saved, list every way into it,
found by a code search:
- (a) screens that request it directly;
- (b) reports or links that open those screens with a filter;
- (c) other screens that reuse or pre-fetch its data, including saves that
  update it in place.

Each item gets a check before and after the change. Write
"None — <reason>" if the change has no such reach. Fill this in before
the plan is approved.

## 4. Not in this plan (with reasons)

## 5. Business rules and records to update

## 6. Technical addendum

<Files, tables, endpoints, tests.>
