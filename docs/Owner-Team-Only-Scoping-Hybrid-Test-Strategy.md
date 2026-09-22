# Hybrid Testing Strategy
## Owner-Team-Only Drill-down Scoping — remaining checks

> **Context:** `docs/Product-Performance-Brand-Drilldown-Manual-E2E-Test-Plan.md`
> is fully signed off (9/9 PASS). Its own step 9 (role scoping) surfaced a real
> gap — a drilled-into Pipeline list didn't match its report card's count,
> because Split-shared deals are RLS-visible but not report-attributed. Fixed
> via `owner_team_only` (`backend/app/domains/opportunity/repository.py`),
> applied automatically whenever the Pipeline list is reached via a report
> drill (`Boolean(initialFilter)` in `OpportunityPipelineScreen.tsx`), off
> otherwise. Confirmed already, live: Fazal's SonoScape drill now shows 15,
> matching the report exactly; Haroon (Admin/GM) unaffected at 34; the
> plain-Pipeline 17-vs-15 gap traced and explained (a real deal with zero
> product line items — correctly excluded from any brand-scoped view, not a
> bug). Full detail: this session's transcript, 2026-09-22.

**What's left to check, and why it wasn't covered by the checks above:**
1. The same fix via **Pipeline Report** or **Sales Report** drill (only
   Product Performance was exercised so far) — same code path
   (`Boolean(initialFilter)`), so it should generalize, but not yet clicked.
2. **"Clear filter"** after a drill reverting the Pipeline board back to full,
   non-strict visibility — implied by the code (`owner_team_only` derives
   from `initialFilter`, which "Clear filter" resets to `undefined`), not
   yet clicked.
3. A **Sales Staff**–level login (only Admin/GM and Area Manager tested so
   far) — `TEAM_SCOPE_BUILDERS` has no explicit "Sales Staff" entry, so it
   falls back to the bare `self_row` (own deals only) — worth confirming
   that fallback behaves correctly under `owner_team_only` too, not just
   under reporting's existing, already-verified use of the same helper.

---

## Summary Split

| Mode | Checks | Count |
|---|---|---|
| ✋ You do it manually | Clear-filter visual check (#2) | **1 check** |
| 🤖 Claude browser testing | Pipeline/Sales Report drill as Fazal (#1), Sales Staff drill (#3) | **2 checks** |

Both 🤖 checks need you to log in first (I can't type passwords, even for
test accounts) — same hand-off pattern as the Fazal check earlier: you sign
in, tell me, I drive the click-through and count-matching from there.

---

## ✋ Do Yourself — One Visual Glance

### Clear Filter reverts to full visibility (#2)
**Why manual:** Pure visual check — does the banner disappear, does the
list get longer. You'll see it instantly.
- While on any drilled-into Pipeline list (e.g. from a Product Performance
  card), click **"Clear filter."**
- **Expected:** banner disappears, list reverts to the full, normal
  Pipeline view — including any Split-shared deals that the drilled view
  had excluded (e.g. Basheer K's shared "usg m/c" deal, if you're logged
  in as Fazal).

**Time: ~30 seconds**

---

## 🤖 Use Claude Browser Testing — Numeric Cross-Checks

### Pipeline Report / Sales Report drill, as Fazal (#1)
**Why Claude:** Same shape as the Product Performance check already done —
cross-checking a report card's number against the drilled list's actual
count is exactly the tedious, easy-to-miscount-by-hand work Claude should
do, not you.

> 💡 **Prompt to use (after you've logged in as Fazal and told me so):**
> ```
> Open Pipeline Report, pick any breakdown (Rep/Zone/SBU/Product), click one
> bar with a non-zero count. Count the resulting drilled list via page text,
> confirm it matches the bar's own number exactly. Repeat once on Sales
> Report (any breakdown, All Time). Report both counts and whether either
> included a deal NOT owned by Fazal or his direct report Fahad (there
> shouldn't be any, split-shared or otherwise). Stop after these two drills.
> ```

---

### Sales Staff drill, as Vivek or Rudrappa (#3)
**Why Claude:** Same reasoning — a role with no `TEAM_SCOPE_BUILDERS` entry
falls back to "own deals only," and confirming that fallback holds under
the new strict mode is a precise count check, not a visual one.

> 💡 **Prompt to use (after you've logged in as Vivek or Rudrappa and told
> me so):**
> ```
> Open Product Performance (or Pipeline Report), pick a breakdown with a
> non-zero count for this user, drill into it. Confirm every deal in the
> resulting list is owned by this user themselves — none from a manager,
> teammate, or a split. Cross-check the drilled count against the report
> card's own number. Report pass/fail. Stop after this one check.
> ```

---

## Recommended Execution Order

```
1. You: Clear-filter check (#2) — 30 seconds, whenever convenient.
2. You: log in as Fazal → tell me → I run Pipeline/Sales Report drill (#1).
3. You: log in as Vivek or Rudrappa → tell me → I run the Sales Staff drill (#3).
```

No fixed order between 2 and 3 — whichever login is easier to grab first.

---

## Sign-off

**All 3 checks run live, 2026-09-22, by Basheer himself (all three, not
delegated to browser automation — straightforward enough to do directly).**

- **#2, Clear Filter (as Fazal):** drilled SonoScape count (15) → "Clear
  filter" → count grew to 17, exactly matching the earlier-traced full
  RLS-visible total (8 own + 8 Fahad's + 1 split from Basheer K). **PASS.**
- **#1, Pipeline Report drill (as Fazal):** drilled bar count matched the
  resulting list exactly, no deal outside Fazal/Fahad. **PASS.** Sales
  Report: no Won deals exist for Fazal/Fahad right now, so this specific
  report couldn't be exercised — not a failure, same data-limitation shape
  already accepted in the parent Report-Drilldown plan's own sign-off, and
  Pipeline Report already proved the identical code path correct.
- **#3, Sales Staff drill (as Vivek):** turned into a cleaner test than
  planned. Vivek owns zero deals outright — only two Split-shared ones (one
  from Fazal, one from Basheer K). Every report (Product Performance,
  Pipeline Report, Sales Report) correctly showed **0** for him — reports
  only ever count literal ownership, never a split, confirming the "no
  `TEAM_SCOPE_BUILDERS` entry" fallback (`self_row` only) works exactly as
  intended. His **plain** Pipeline board (Kanban and List both checked)
  correctly showed **2** — the two split deals, via the broader RLS
  visibility this fix deliberately leaves untouched outside a drill.
  **PASS** — this is the purest possible confirmation of the
  visibility-vs-attribution split this whole fix exists to enforce.

**All 3 checks pass. No bugs found. Ready to commit.**
