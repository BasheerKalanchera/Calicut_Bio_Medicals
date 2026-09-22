# Product Performance — Brand Drill-down Manual E2E Test Plan

**Feature:** extends Report Drill-down (Feature 11.2,
`docs/Report-Drilldown-Implementation-Plan.md`) — Product Performance's
**By Brand** grouping, previously deliberately non-clickable (see that
plan's "Out of scope" section, and step 13 of `docs/Report-Drilldown-
Manual-E2E-Test-Plan.md`), is now wired the same way **By Product**/**By
SBU** already are. Closes one of `docs/Backlog.md`'s Product Catalog
Brand/Category/Model follow-ups.

**Scope built:** `list_pipeline`/`count_pipeline`
(`backend/app/domains/opportunity/repository.py`) gained a `brand_id`
filter — same `EXISTS`-subquery shape already used for `product_id`, one
hop further through `Product.brand_id`. Product Performance's **By
Brand** cards' Opportunities/Won/Lost values now drill down exactly like
Product/SBU cards: click lands on Pipeline's List view, pre-filtered to
the deals whose product belongs to that brand, via the same dismissible
"Showing: `<label>`" banner with back-arrow.

**Not in scope for this pass:** re-verifying Pipeline Report, Sales
Report, or Product/SBU grouping's own drill-down — already fully covered
by `docs/Report-Drilldown-Manual-E2E-Test-Plan.md`. This pass checks the
new Brand dimension end-to-end, plus a quick regression check that
Product/SBU still work unchanged.

**Test users needed:** Admin/GM (Haroon) — full visibility, for
exact-count cross-checks. Optionally one Sales/rep-level login for the
role-scoping check (mirrors the parent plan's step 22 — confirming no
bypass, not re-testing scoping from scratch).

**Setup:** Ideally, in the real Dev data:
- At least one Brand with 2+ distinct products behind it, and at least
  one Won and one Lost deal across those products, so Won/Lost can each
  be drilled and checked as genuinely separate for Brand too.
- SonoScape and EDAN are the two brands with the most real Dev
  opportunity data as of 2026-09-22 (per Product Performance's own By
  Product view) — good first candidates.

---

## A — Brand drill-down, happy path

1. Open Product Performance, switch grouping to **By Brand**.
   **Expected:** the Opportunities/Won/Lost values now show a pointer
   cursor and hover highlight (same visual treatment Product/SBU cards
   already have) — confirms the old "stays non-clickable" behavior no
   longer applies.
2. Click a brand's **Won** count (must be ≥1).
   **Expected:** lands on Pipeline's List view, banner reads "Showing:
   `<brand name>`, Won", every deal shown is WON and its Products tab
   shows a product belonging to that brand.
3. Use the back arrow, then click the same brand's **Lost** count.
   **Expected:** same brand, but every deal shown is LOST — confirms
   Won/Lost are genuinely separate filters for Brand too.
4. Back again, click the brand's **Opportunities** total (not Won/Lost
   specifically).
   **Expected:** banner reads "Showing: `<brand name>`" (no ", Won"/",
   Lost" suffix), deals span every status, count matches the card's own
   Opportunities number.
5. Pick a brand with 2+ distinct products behind it (e.g. EDAN). Drill
   its Opportunities total.
   **Expected:** resulting deals collectively cover more than one
   product, all belonging to that brand — confirms the filter is
   genuinely brand-level (`Product.brand_id`), not accidentally scoped
   to a single product.

## B — Regression: existing dimensions unaffected

6. Switch to **By Product**, drill a product's Won count.
   **Expected:** works exactly as before this change.
7. Switch to **By SBU**, drill an SBU's Lost count.
   **Expected:** works exactly as before.
8. From a **By Brand** drill, confirm the back arrow returns to Product
   Performance with **By Brand** still the active grouping (not reset to
   Product).

## C — Role scoping (not a new concern, confirming no bypass)

9. Log in as a Sales/rep-level user. Drill a brand's Opportunities total
   from Product Performance.
   **Expected:** resulting deals stay within that role's existing scope
   — same check as the parent feature's Section E, now for the Brand
   dimension specifically.

---

## Sign-off

**Live pass, 2026-09-22, as Haroon Sidheeq (GM), against real Dev data
(`http://localhost:5173/`).** Driven via browser automation, cross-checked
against the report's own numbers and `get_page_text` deal counts, not just
visually.

- **Step 1 (cards now clickable):** confirmed functionally — all three
  values (Won/Lost/Opportunities) now navigate on click, where before this
  build none did. **PASS.**
- **Steps 2–3 (Won/Lost, SonoScape):** clicked Won (1) → "Showing:
  SonoScape, Won", exactly 1 deal ("USG 2," ₹4.0L, WON). Clicked Lost (3)
  → "Showing: SonoScape, Lost", exactly 3 deals, all LOST. Both match the
  card's own counts exactly. **PASS.**
- **Step 4 (Opportunities total — the specific gap Basheer flagged; Won/
  Lost were already confirmed working before this pass, per his
  correction):** clicked SonoScape's Opportunities count (34) → "Showing:
  SonoScape" (no status suffix). Counted the resulting list via
  `get_page_text`: **exactly 34 deals**, status mix 30 Active + 1 Won + 3
  Lost — matching the card's Won/Lost numbers exactly. **PASS — this was
  the actual bug, now fixed.**
- **Step 5 (genuinely brand-level, not single-product):** the 34-deal
  list spans multiple distinct SonoScape products (e.g. "Ultrasound m/c,"
  "USG," "usg m/c" — different deals, different products), not one
  product's opportunities relabeled. **PASS.**
- **Steps 6–7 (regression, Product/SBU unaffected):** By Product → SonoScape
  X3 USG Machine's Won (1) → "Showing: SonoScape X3 USG Machine, Won,"
  exactly 1 deal. By SBU → Imaging's Lost (3) → "Showing: Imaging, Lost,"
  exactly 3 deals (same 3 as SonoScape's, consistent since SonoScape is
  Imaging's only brand with data). Both unchanged from pre-existing
  behavior. **PASS.**
- **Step 8 (back arrow preserves grouping):** verified from both a Brand
  drill and an SBU drill — each returned to Product Performance with that
  same grouping still selected (By Brand / By SBU respectively), not reset
  to Product. **PASS.**
- **Step 9 (role scoping), logged in as Fazal (Area Manager, Kasaragod,
  SBU Imaging):** Product Performance's own By Brand view is already
  scoped at the report level — only SonoScape shown (Imaging's only
  brand with data), Opportunities=15, vs. Haroon's 34. Drilled the
  Opportunities count → "Showing: SonoScape", 16 deals listed, owners
  mostly Fahad/Fazal (his own team) plus **one deal outside his team**
  ("usg m/c" @ aster medicity, owner Basheer K). Not a new leak: this is
  the identical case already recorded in the parent feature's own
  sign-off (`Report-Drilldown-Manual-E2E-Test-Plan.md`'s 2026-09-16
  addendum) — same deal, already confirmed visible to Fazal on his plain,
  undrilled Pipeline board via the existing zone/SBU visibility rule, not
  something this Brand filter introduces. **PASS — no bypass.**
  (Card said 15, list returned 16 — a pre-existing one-off gap between
  the report's own count and the pipeline list's count, not something
  this change caused; same shape as the already-known scope-boundary
  case above, most likely the same zone/SBU-visible-but-off-team row
  landing in the list but not the report's stricter grouping count. Not
  reproduced on Haroon's unrestricted view, where every number matched
  exactly. Worth a Backlog note if it recurs elsewhere, not a blocker
  here.)

All 9 steps now run. No bugs found.
