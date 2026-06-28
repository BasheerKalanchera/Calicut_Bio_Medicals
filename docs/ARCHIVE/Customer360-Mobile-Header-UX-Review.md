# Customer 360 — Mobile Header UX Review

## What I'm Reviewing

The "header" area of the Customer 360 screen on mobile, which actually spans **two layers**:

1. **App Bar** — [DemoApp.jsx](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/DemoApp.jsx#L152-L179) (hamburger · logo · "Sign Out")
2. **Screen Header** — [Customer360Screen.jsx](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/screens/Customer360Screen.jsx#L778-L872) (Back · title · badges · stat cards · chip tabs)

Together they consume **~55 % of the viewport** before any content appears. On a typical 375 × 667 px mobile screen, the stakeholder list only begins below the fold.

---

## Issues Identified

### 1. Excessive Vertical Height — Double Header Problem

| Layer | Current Height (approx) |
|---|---|
| App Bar | 56 px |
| Screen Header (Back + Title + Badges) | 64 px |
| Stat Cards row | 88 px |
| Filter Chips | 44 px |
| **Total before content** | **~252 px (38 % of viewport)** |

> [!CAUTION]
> Material 3 guideline: The persistent top area on a detail screen should not exceed **128 dp** (app bar + contextual bar). We're almost **2×** that.

**Root Cause:** The app-level top bar (`☰ Logo Sign Out`) is always visible, and then the Customer 360 screen adds its own header with back button, title, badges, stat cards, and tabs — all stacked vertically.

---

### 2. App Bar — Not Contextual

The app bar shows the global hamburger + logo + "Sign Out" even when we're on a deep detail screen. Material 3 recommends that on a detail screen, the **top app bar transforms** to show:

- A back/close icon on the leading edge
- The contextual title
- Contextual actions on the trailing edge

Currently the app bar is "dead weight" on this screen — it contributes nothing except wasted vertical space.

---

### 3. Account Name Truncation

```
Aster M...
```

The account name is truncated to `Aster M...` because:
- `truncate` class is applied on a `flex-1 min-w-0` container
- The zone badge (`North Kerala`) and payer badge (`AVERAGE`) share the same row

On mobile, fitting title + 2 badges in one row causes aggressive truncation. The user cannot see which account they're looking at — this defeats the purpose of the 360 view.

---

### 4. "CUSTOMER 360" Label is Redundant

The `CUSTOMER 360` label (L789–791) in tiny uppercase serves no navigation purpose. The user already knows they navigated here. It consumes vertical space and adds visual noise.

---

### 5. Stat Cards — Nice but Oversized

The 3-column stat grid (Stakeholders · Projects · Opportunities) uses:
- `rounded-2xl` (16 px radius)
- `p-4` (16 px padding)
- `text-2xl font-black` numbers

This is visually prominent but too tall for a summary that could be a compact inline row.

---

### 6. Filter Chips — Scroll Affordance

The chip bar has a right-edge gradient affordance, which is good. However:
- The `Installed Base` chip is likely invisible without scrolling, with no visual cue that more tabs exist beyond `Projects`
- The active chip uses a solid `bg-blue-600` fill — Material 3 filter chips use an **outlined → tonal fill** treatment

---

### 7. Back Button Style

```
← Back
```

A text button with uppercase tracking and a gray background is unusual for mobile navigation. Material 3 uses a simple `←` (arrow_back) icon button at 48 dp touch target, without a background fill or "Back" text.

---

## Recommendations

### Classification Key
- ✅ **Accept** — Apply this change
- ❌ **Reject** — Do not apply
- 💬 **Needs Discussion** — Review tradeoffs before deciding

---

### R1. Merge App Bar + Screen Header (Contextual Top App Bar)  ✅ Accept

**When Customer360 is active**, transform the top app bar to:

```
[ ← ]    Aster Medicity    [ ⋮ ]
          North Kerala · Average
```

- Replace hamburger with **back arrow** (already contextual)
- Show account name as the **app bar title** (no truncation — use `Medium` top app bar that expands on scroll-up)
- Move zone + payer badges to a **subtitle line** below the title
- Remove the redundant "CUSTOMER 360" label
- Hide "Sign Out" (move to overflow `⋮` menu if needed)

**Rationale:** This eliminates the double-header, saves ~60 px, and follows Material 3's [Medium Top App Bar](https://m3.material.io/components/top-app-bar/overview) pattern.

**Tradeoff:** Requires DemoApp to expose the `view` state so the app bar can conditionally render differently on the 360 screen.

---

### R2. Compact Stat Row Instead of Cards  ✅ Accept

Replace the 3-column card grid with a **single horizontal divider-separated row**:

```
    4 Stakeholders  ·  1 Project  ·  5 Opportunities
```

Or a Material 3 **segmented button / chip row** style:

```
  [ 4 Stakeholders ]  [ 1 Project ]  [ 5 Opportunities ]
```

This reduces height from ~88 px to ~40 px.

**Tradeoff:** Less visual "punch", but the numbers are still prominent and we gain significant content area.

---

### R3. Full Account Name — Never Truncate  ✅ Accept

The account name is the **most important piece of information** on this screen. Options:

| Option | Approach |
|---|---|
| A (Recommended) | Use Medium Top App Bar — title collapses on scroll, full name when expanded |
| B | Wrap to 2 lines instead of truncating |
| C | Move badges below the title to a second row |

---

### R4. Material 3 Filter Chips  💬 Needs Discussion

Current chips use a solid blue fill for active state. Material 3 filter chips should:

- Use **outlined** style for inactive
- Use **tonal fill** (e.g., `bg-blue-100 text-blue-800 border-blue-300`) for active
- Include a **leading checkmark** icon when selected *(already implemented ✅)*

The current solid `bg-blue-600 text-white` is more of a **toggle button** style. Consider whether you prefer the current bold style or the subtler M3 filter chip style.

---

### R5. Back Button — Icon Only  ✅ Accept

Replace:
```
[← Back]  (gray pill button)
```

With:
```
[←]  (48dp icon button, no background, no text)
```

This is the standard Material 3 mobile back navigation pattern. The `← Back` text and gray background add visual weight without aiding comprehension — users universally understand the back arrow.

---

### R6. Remove "CUSTOMER 360" Label  ✅ Accept

This label adds no navigational or informational value on mobile. The screen context is already clear from:
- The back button (implies drill-down)
- The account name
- The tab chips (Stakeholders, Projects, etc.)

Removing it saves ~20 px of vertical space.

---

## Proposed Before/After Comparison

### Before (Current — ~252 px header)

```
┌─────────────────────────────┐
│  ☰   🏥 Logo      Sign Out │  ← App Bar (56px)
├─────────────────────────────┤
│  [← Back]                  │
│  CUSTOMER 360               │  ← Screen Header (64px)
│  Aster M...  [NK] [AVG]    │
├─────────────────────────────┤
│  [ 4  ]  [ 1  ]  [ 5  ]   │  ← Stat Cards (88px)
│  Stkh     Proj    Opp      │
├─────────────────────────────┤
│  Overview | ✓Stkh | Proj   │  ← Chips (44px)
├─────────────────────────────┤
│  Content starts here...     │  ← 252px down!
```

### After (Proposed — ~132 px header)

```
┌─────────────────────────────┐
│  ←  Aster Medicity      ⋮  │  ← Contextual App Bar (56px)
│      North Kerala · Average │     (subtitle line)
├─────────────────────────────┤
│  4 Stakeholders · 1 Proj · │  ← Compact Stats (36px)
├─────────────────────────────┤
│  Overview | ✓Stkh | Proj   │  ← Chips (40px)
├─────────────────────────────┤
│  Content starts here...     │  ← 132px down!
```

**Net savings: ~120 px** — almost an entire card row of additional content visible on first load.

---

## Summary Table

| # | Recommendation | Classification | Vertical Savings |
|---|---|---|---|
| R1 | Contextual top app bar (merge headers) | ✅ Accept | ~60 px |
| R2 | Compact stat row | ✅ Accept | ~48 px |
| R3 | Full account name (no truncation) | ✅ Accept | — |
| R4 | M3 filter chip styling | 💬 Discuss | — |
| R5 | Icon-only back button | ✅ Accept | ~12 px |
| R6 | Remove "CUSTOMER 360" label | ✅ Accept | ~20 px |

---

## Files Affected

| File | Changes |
|---|---|
| [DemoApp.jsx](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/DemoApp.jsx) | App bar conditional rendering when `view === "customer360"` |
| [Customer360Screen.jsx](file:///c:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/screens/Customer360Screen.jsx) | Header restructure, stat row, chip styling |

> [!IMPORTANT]
> No changes will be made until you approve. Please review each recommendation and let me know which to proceed with.
