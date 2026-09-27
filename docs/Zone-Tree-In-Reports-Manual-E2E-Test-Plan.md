# Zone Tree in Reports — Manual E2E Test Plan

**Feature:** `docs/Zone-Tree-In-Reports-Implementation-Plan.md` — the Zone
view in Pipeline Report, Sales Report and the Insights Dashboard becomes a
rolled-up tree.

**Built:** not yet committed.

**Environment:** Dev. Read-only — no step saves anything.

**Test data (Dev), checked read-only 2026-09-27 as Haroon:**

Active pipeline by zone (each row includes the rows under it):

| Row | Deals | Value |
|---|---|---|
| Karnataka | 6 | ₹79.0L |
| &nbsp;&nbsp;Bangalore | 6 | ₹79.0L |
| Kerala | 42 | ₹428.0L |
| &nbsp;&nbsp;North Kerala | 35 | ₹397.0L |
| &nbsp;&nbsp;&nbsp;&nbsp;Kannur | 1 | ₹5.0L |
| &nbsp;&nbsp;&nbsp;&nbsp;Malappuram | 10 | ₹129.0L |
| &nbsp;&nbsp;&nbsp;&nbsp;North Kerala (not in a sub-zone) | 24 | ₹263.0L |
| &nbsp;&nbsp;South Kerala | 7 | ₹31.0L |
| &nbsp;&nbsp;&nbsp;&nbsp;Ernakulam | 5 | ₹7.0L |
| &nbsp;&nbsp;&nbsp;&nbsp;South Kerala (not in a sub-zone) | 2 | ₹24.0L |

Karnataka + Kerala = 48 deals / ₹507.0L = the headline tile. Bangalore's 6
deals are all tagged to Bangalore itself, so it has no sub-rows. Zones
with no deals (the Karnataka districts, Central Kerala, Kasaragod, …) don't
appear.

Won (all time): one deal, "USG 2", ₹4.0L, tagged to North Kerala directly.

**Tags:** S = Simple (Basheer runs it and reports back), C = Complex
(Claude drives it in the browser).

---

1. **(S)** As Haroon: Pipeline Report → **Zone**.
   **Expected:** the tree above, rows indented by level, each with its
   deal count; a note under it: "Each zone includes the zones indented
   beneath it."
2. **(S)** Click **North Kerala**.
   **Expected:** banner "Showing: North Kerala · 35 deals"; list has 35.
3. **(S)** Back; click **Malappuram**.
   **Expected:** "· 10 deals"; list has 10.
4. **(S)** Back; click **North Kerala (not in a sub-zone)**.
   **Expected:** "· 24 deals"; list has 24, none of them Malappuram or
   Kannur hospitals.
5. **(S)** Sales Report → All Time → **Zone**.
   **Expected:** Kerala 1 deal ₹4.0L, North Kerala 1 deal ₹4.0L (no
   sub-rows); the note shows. Click North Kerala → "USG 2" only.
6. **(S)** Insights Dashboard → "Pipeline by…" → **Zone**.
   **Expected:** same tree and figures as step 1; note shows.
7. **(S)** As **Fazal** (Area Manager): Pipeline Report → Zone.
   **Expected:** only zones with his team's deals; the top-level rows add
   up to his "Active Pipeline Value" tile.
8. **(S)** Log back in as Haroon: Pipeline Report → **Stage**.
   **Expected:** unchanged — flat list, no indent, no note (regression).

---

## Results

| Step | Result | Notes |
|---|---|---|
