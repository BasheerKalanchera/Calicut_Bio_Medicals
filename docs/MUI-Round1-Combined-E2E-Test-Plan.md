<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# MUI Round 1 (Part 1) — Manual E2E Test Plan

**Covers:** `docs/MUI-Good-Practice-Implementation-Plan.md`, step 5 Part 1
(steps 1–7) and step 8, the one combined E2E for round 1 (D15). Written and
run 7 Nov 2026.
**Built:** `6a417cb` (Customer 360 and the shared `ConfirmDialog`),
`f8c61b3` (Opportunity Detail), `394444a` (Product Catalogue), `06a304b`
(Account Management), `0c4f728` (Daily Activity Report), `b1fdb3f` (Next
Actions screen and panel), `33293b8` (Close Next Action pop-up), `5c26ed3`
(Log Activity "Logged For" name). All in `main` (plan Status line).
**Where:** Dev.

**What this run proves.** Only what the 26 before-and-after pictures cannot
show: the two file-delete buttons now ask "Delete this file?" first and still
delete when confirmed, and a few buttons and filters still work after the
restyle. The look at 390, 768 and 1280 px was checked by Claude from the 26
pairs (archive 5 Nov), not in this run.

## Checked against live data

Not queried: round 1 changes how screens look, not what is fetched or saved
(plan section 3), so no live-data check was run for this plan.

- **Who sees:** n/a — no visibility change.
- **Who can approve:** n/a — nothing is approved.
- **Who can save:** Product Catalogue links: Admin and General Manager only
  (former Backlog entry "File deletes", removed 9 Nov; code `canEdit`); step 1–3 run as Haroon Sidheeq
  (General Manager). Opportunity documents: owner, Admin or General Manager
  (same Backlog entry). Login and record for step 4 were Basheer's pick at
  the run and were not written down.
- **Existing values:** Product Catalogue record is SonoScape E2 (archive 5
  Nov, found from the before pictures). Other records were Basheer's pick.

Button labels, messages and the order of checks are taken from the code
(`ProductCatalogScreen.tsx`, `OpportunityDetailScreen.tsx`,
`LogActivityModal.tsx`, `Customer360Screen.tsx`), not the design doc.

## Figures and sources

- Seven steps, all passed — counted from this plan, 7 Nov.
- "Delete this file?" and "This can't be undone." — code,
  `ProductCatalogScreen.tsx` and `OpportunityDetailScreen.tsx` (read 7 Nov).
- "Logged For" label, "Me (default)" first item, then staff names — code,
  `LogActivityModal.tsx` lines 428–439 (read 7 Nov).
- SonoScape E2, Al Shifa Hospital Perinthalmanna — archive 5 Nov.
- Test link name "zz MUI test link", URL example.com, file "zz MUI test.txt" —
  made-up examples.
- Haroon Sidheeq (General Manager), Basheer K (SBU Manager) — Customer with
  No Activity test plan, "Checked against live data" (5 Nov).
- Results — Basheer, 7 Nov.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Saves to Dev are "Basheer clicks,
Claude watches".

**Phone:** step 5 is the phone-width check of the Stakeholders card; the
rest of the look is in the 26 pictures.

**Opportunities:** step 4 uses an Opportunity Basheer picked at the run
(name and hospital not recorded).

## Pre-flight

- P1. [Simple] Dev backend restarted since the last backend change. No
  backend change in round 1 (plan section 3). **Result 7 Nov — Pass (n/a,
  nothing to restart).** —
- P2. [Simple] Dev app running with the current code, signed in as Haroon
  for steps 1–4 as the plan says. **Result 7 Nov — Pass (Basheer ran the
  steps).** —

## A — File deletes (Dev saves; Basheer clicks, Claude watches)

1. [Complex: saves to Dev] Product Catalogue, SonoScape E2 (Haroon): click
   "+ Add Link", name "zz MUI test link", URL https://example.com, click
   "Add Link". **Expected:** the link is listed. **Result 7 Nov — Pass
   (Basheer).** —
2. [Simple] Click the link's ✕. **Expected:** pop-up "Delete this file?" with
   "This can't be undone."; Cancel closes it and the link stays. **Result 7
   Nov — Pass (Basheer).** —
3. [Complex: saves to Dev] Click ✕ again, then Delete. **Expected:** the
   pop-up closes and the link is gone; reopening the product shows it still
   gone. **Result 7 Nov — Pass (Basheer).** —
4. [Complex: saves to Dev] Opportunity Detail, Documents tab: upload
   "zz MUI test.txt"; click its ×, then Cancel; click × again, then Delete.
   **Expected:** the file stays after Cancel and is gone after Delete.
   **Result 7 Nov — Pass (Basheer).** —

## B — Buttons and filters after the restyle

5. [Complex: phone layout] Phone width (390 px), Customer 360, Al Shifa
   Hospital Perinthalmanna, Stakeholders tab: tap Edit on a stakeholder.
   **Expected:** the edit pop-up opens with that person's details and fits
   the phone; closed without saving. **Result 7 Nov — Pass (Basheer).** —
6. [Simple] Daily Activity Report: pick a Date and a Team Member. Account
   Management: pick a Zone. **Expected:** each filter has its name above it
   and the list narrows when you pick. **Result 7 Nov — Pass (Basheer).** —
7. [Simple] Open Log Activity at phone width. **Expected:** the box has the
   name "Logged For" above it; its list starts with "Me (default)", then the
   staff names; closed without saving. (First draft said "that account's
   contacts" — wrong, read from the code and corrected before the run.)
   **Result 7 Nov — Pass (Basheer).** —
