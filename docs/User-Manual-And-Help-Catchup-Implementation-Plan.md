# User Manual and In-App Help Catch-up — Implementation Plan

**Status:** Approved 2026-10-01 (Basheer). Not started. Steps 1–2 can
start any time; step 3 waits for Part 2's screens; ships with the
hospital-wise Part 1+2 UAT move.
**Traceability rows:** none (supports the UAT rollout; Backlog "Bring the
user manual and in-app `?` help up to date").
**Design / discussion:** this plan. Original manual and help: Progress-Archive
2026-08, entry for `3cfa132` (2026-08-01).

## Decisions

- D1. Approach: **Lighter** — rewrite the manual and the help text by hand,
  as today, and add a guard that stops them drifting again (D7). The
  heavier option (one shared source shown both in the app and as the
  manual) is described in section 3 — Basheer, 2026-10-01
- D2. The manual and help describe what UAT will have **after the
  hospital-wise Part 1+2 move** (including Target & Coverage Planning,
  Rate Hospitals and plan-versus-actual). Written now from Dev, published
  with that move — Basheer, 2026-10-01
- D3. The manual is organised **by role first** ("How do I…" for Sales
  Rep, Area Manager, Admin/GM, Marketing User), followed by a short
  reference section per screen — Basheer, 2026-10-01
- D4. **Every menu screen gets a `?` help page**: refresh the 8 that exist,
  write the 14 that are missing (list in section 5) — Basheer, 2026-10-01
- D5. The manual reaches the team as a **PDF sent with each UAT move**
  (same style as the data-quality reports); the in-app `?` stays the
  everyday help — Basheer, 2026-10-01
- D6. **No screenshots** — they go stale with every screen change; button
  names in bold instead — Basheer, 2026-10-01
- D7. Keeping it current: (a) a frontend test that fails when a menu screen
  has no help page; (b) CLAUDE.md "Post-commit checklist" gains a line:
  a feature that changes a screen updates that screen's help text and
  manual section in the same feature commit — Basheer, 2026-10-01
- D8. Basheer reviews the manual text before the PDF goes out; Haroon
  receives it with the UAT move — Basheer, 2026-10-01

## 1. In plain terms

The user manual and the `?` help button were written on 1 Aug. Since then
about 70 features have been built, so both are out of date. Eight screens
have help that is partly wrong or missing new buttons. Fourteen screens have
no help at all: when a user presses `?` there, nothing happens.

After this work:
- Every screen in the menu has a `?` page explaining what it is for and
  what each button does, using the exact words on the screen.
- The manual becomes a short guide per role: for example, a Sales Rep sees
  "How do I log a visit", "How do I mark a deal Won", "How do I plan my
  quarter's target", while an Admin sees "How do I rate hospitals" and
  "How do I approve a target".
- A test stops a new screen from shipping without help, and each future
  feature updates its own help as part of the same change.

## 2. Build order

1. **Inventory (half a day).** List every menu screen per role from the
   code, and map each feature built since 1 Aug to the screen it changed.
   Output: a checklist table at the end of this plan.
2. **Manual rewrite (about 1 day).** `docs/UAT-User-Manual.md`: role
   guides plus the screen reference. Basheer reviews (D8).
   *Checkpoint commit (docs only).*
3. **In-app help (about 1 day).** `helpContent.tsx`: refresh 8, add 14;
   the help-coverage test (D7a). tsc, lint, frontend tests.
   *Checkpoint commit.*
4. **Review and test (half a day).** `/code-review` (medium); short manual
   E2E: open `?` on every screen as each role (Simple steps, Basheer).
5. **Ship with the Part 1+2 UAT move.** PDF to the team (D5); CLAUDE.md
   line (D7b); post-commit checklist.

Total about 3 days. Steps 1–2 can start any time; step 3 touches the same
frontend as the Part 2 build, so it waits until Part 2's screens are
settled.

## 3. Not in this plan (with reasons)

- **Heavier option: one shared source.** The manual's screen sections
  would live in one file that the app shows directly in the `?` drawer and
  that is also printed as the PDF, so the two can never disagree. Adds a
  Markdown display library to the app and about 1 more day. Not chosen
  (D1) because the guard in D7 catches the main risk (a screen with no
  help) at lower cost, and help text (short, per screen) and the manual
  (task guides per role) are written for different moments.
- **Videos or walkthrough tours:** rejected on 2026-08-01 for a pilot of
  this size; nothing has changed that.
- **Translations:** not requested.

## 4. Business rules and records to update

- None in Business-Rules (no behaviour changes).
- CLAUDE.md "Post-commit checklist" (D7b).
- Backlog entry "Bring the user manual and in-app `?` help up to date":
  replaced by a pointer to this plan; removed when shipped.

## 5. Technical addendum

- **Files:** `docs/UAT-User-Manual.md` (124 lines);
  `sales-os-app/src/utils/helpContent.tsx` (202 lines, keyed by
  `DemoApp.tsx`'s `view` value; `HelpDrawer.tsx` shows `HELP_CONTENT[view]`,
  and the `?` button is hidden when there is no entry — `DemoApp.tsx:581`).
- **Help that exists (8):** `customers`, `customer360`, `projectDetail`,
  `opportunities`, `opportunityDetail`, `nextActions`, `catalog`, `users`.
- **Help missing (14):** `marketingLeads`, `marketingLeadQueue`,
  `insights`, `targetPlanning`, `dailyActivity`, `stagnantDeals`,
  `opportunitiesOnHold`, `productPerformance`, `pipelineReport`,
  `salesReport`, `territories`, `auditLog`, `rateHospitals`,
  `brandTargetTracking`.
- **Coverage test (D7a):** a Vitest test that collects every `id` from the
  nav item lists in `DemoApp.tsx` (moved to an exported constant if
  needed) and asserts `HELP_CONTENT` has a key for each.
- **Wording source:** button labels, tab names and messages taken from the
  screen code, not from design docs (CLAUDE.md, 2026-09-30).
- **PDF:** HTML built from the manual, printed with Edge headless, saved to
  `C:\Backups\CabioUAT\` only after Basheer approves it (folder to confirm
  at step 5).
