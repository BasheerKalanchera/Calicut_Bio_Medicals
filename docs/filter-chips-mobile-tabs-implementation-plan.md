# Implementation Plan: Filter Chips for Tab Navigation (Mobile)

## Goal

Replace the current broken rectangular tab bar in the **Customer 360** screen with a **Material Design Filter Chips** pattern — a horizontally scrollable row of rounded pill-shaped chips. This improves discoverability, touch-friendliness, and overall mobile UX.

---

## Scope

**Only one file changes:** `Customer360Screen.jsx`

No backend changes. No routing changes. No new npm packages required. Tab content logic is **completely unchanged** — this is a pure UI/UX improvement.

---

## Proposed Changes

---

### Component: Customer360Screen

#### [MODIFY] [Customer360Screen.jsx](file:///C:/Users/Basheer/GitHub/Calicut_Bio_Medicals/sales-os-app/src/screens/Customer360Screen.jsx)

Three distinct areas of the file change:

---

#### Change 1 — Add a `useRef` for auto-scrolling the active chip (Line 1)

Import `useRef` alongside the existing `useEffect`, `useState`, `useCallback`:

```diff
- import { useEffect, useState, useCallback } from "react";
+ import { useEffect, useState, useCallback, useRef } from "react";
```

**Why:** When the user switches sections, the active chip must auto-scroll into view if it's off-screen. This requires a ref on the scroll container.

---

#### Change 2 — Replace the Tab Bar with Filter Chips Row

> **Note on line numbers:** The plan was written before recent stakeholder contact changes added new state variables and modal blocks. The tab bar has shifted from the originally noted Lines 790–804 to approximately Lines 820–835. Search by code content, not line number.

**Remove this (current broken tab bar):**
```jsx
<div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-x-auto">
  {TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-black uppercase
                  tracking-wider transition-all whitespace-nowrap ${
        activeTab === tab.id
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

**Replace with Filter Chips pattern:**
```jsx
{/* Filter Chips — Material Design scrollable chip row */}
<div className="relative mb-4">
  <div
    ref={chipBarRef}
    className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: "none" }}
  >
    {TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
                      text-sm font-bold whitespace-nowrap transition-all duration-200
                      border focus:outline-none active:scale-95 ${
            isActive
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {isActive && (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {tab.label}
        </button>
      );
    })}
  </div>
  {/* Right-edge scroll affordance gradient — tells user more chips exist */}
  {/* IMPORTANT: the stop colour (#f9fafb = gray-50) must match the parent container's
      background colour. If the parent is white (#ffffff), change the stop to #ffffff. */}
  <div
    className="absolute right-0 top-0 h-full w-10 pointer-events-none"
    style={{ background: "linear-gradient(to left, #f9fafb, transparent)" }}
  />
</div>
```

**Key design decisions:**
- `rounded-full` → the pill/capsule shape that defines a chip
- `shrink-0` → chips don't compress; they scroll
- `[&::-webkit-scrollbar]:hidden` (Tailwind) + `scrollbarWidth: "none"` (inline style) → hides the scrollbar in Chrome/Safari and Firefox respectively; both are needed for full cross-browser coverage
- Checkmark SVG icon → appears only on selected chip (Material Design standard)
- Right-edge gradient → scroll affordance (the visual "hint" that more chips exist off-screen)
- `active:scale-95` → subtle press animation for touch feedback

---

#### Change 3 — Add `chipBarRef` and `handleTabChange` function (after existing state declarations)

> **Note on line numbers:** Due to recent additions, the state block has shifted from the originally noted ~Line 464. Place these declarations directly after the last stakeholder/project/opportunity state variable block.

Add these alongside the existing state and `loadAccount` callback:

```jsx
// Ref for the chip scroll container
const chipBarRef = useRef(null);

// Tab change handler that also auto-scrolls the active chip into view
const handleTabChange = useCallback((tabId) => {
  setActiveTab(tabId);
  // Scroll active chip into view after state update
  setTimeout(() => {
    if (chipBarRef.current) {
      const activeChip = chipBarRef.current.querySelector(`[data-tab="${tabId}"]`);
      if (activeChip) {
        activeChip.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, 50);
}, []);
```

**Why `setTimeout`:** React batches state updates. We wait one tick for the active chip to re-render with its `data-tab` attribute before scrolling to it.

---

## Visual Behaviour Summary

| Behaviour | How It Works |
|---|---|
| Chip selected (active) | Blue filled background + checkmark icon |
| Chip unselected | White background + grey border |
| Overflow | Row scrolls horizontally; scrollbar hidden |
| Scroll hint | Right-edge gradient fade |
| Active chip off-screen | Auto-scrolls into view on tab switch |
| Touch feedback | `active:scale-95` micro-animation on tap |

---

## What Does NOT Change

- ❌ No backend changes
- ❌ No routing changes  
- ❌ No new npm dependencies
- ❌ No changes to `FormModal`, tab content components, or data fetching logic
- ❌ No changes to other screens (`CustomerDirectoryScreen`, `ProductCatalogScreen`)

> [!NOTE]
> The `TABS` array definition (Lines 25–31) stays exactly as-is. Only the rendering of that array changes.

---

## Verification Plan

### Manual Verification (Mobile)
1. Open the app on a phone browser (or DevTools mobile viewport ~390px)
2. Navigate to any Customer → Customer 360 screen
3. Verify chips render as rounded pills, not rectangular tabs
4. Verify the active chip shows a blue fill + checkmark
5. Swipe the chip row left → confirm all 5 chips are reachable
6. Tap "Installed Base" (last chip) → confirm the chip auto-scrolls into view
7. Tap each chip → confirm content area switches correctly

### Desktop Verification
8. Open on desktop browser → chips should still work (will all be visible without scrolling)
9. On desktop Chrome, inspect the chip row — the scrollbar must not be visible (confirms `[&::-webkit-scrollbar]:hidden` is working)
10. Confirm the right-edge gradient blends seamlessly with the parent background — no visible colour band at the edge

---

## Open Questions

> [!IMPORTANT]
> **Should this pattern be applied to other screens too?**
> Currently only `Customer360Screen` has tabs. `CustomerDirectoryScreen` and `ProductCatalogScreen` do not. Confirm whether the Filter Chip pattern should become a reusable `<FilterChipBar>` component for future screens, or remain inline for now.

> [!NOTE]
> **Reusable Component Option (Future Enhancement):** If more screens adopt this pattern, we can extract a `FilterChipBar` component to `src/components/FilterChipBar.jsx` to avoid duplication. This is Phase 2 and not required for this change.
