# Split Editing Permission — Manual E2E Test Plan

**Feature:** `docs/Split-Editing-Permission-Implementation-Plan.md`, rule
`docs/Business-Rules.md` BR-FIN-08. Only a deal's owner, the managers above
them (SBU Manager in the deal's business unit; Area Manager in the deal's
business unit whose zones cover the hospital, or who the owner reports to
directly) and GM/Admin may change an Active / On Hold deal's split. Won
deals: General Manager only. Lost deals: nobody. Split participants and
people who only see the deal through a follow-up task are read-only.

**Built:**
- `584d218` — backend: the check in `replace_splits` (403 with a reason),
  `GET /opportunities/{id}/splits/can-edit`, and the "not in this
  Opportunity's SBU" error now names the person instead of their user id.
- Frontend (committed after this pass): the Splits tab hides **Edit** /
  **+ Add** unless the server says yes; re-asks when the deal's status or
  owner changes.

**Fixed by `/code-review` (medium) before this pass:** the "may I edit?"
answer wasn't refreshed when the owner was changed on the same screen — the
old owner still saw Edit and got a refusal on save. Now keyed on owner too;
Section E is its regression check.

**Automated coverage:** 21 new service cases (every role row, Won, Lost,
On Hold; each checks the screen's answer and the save agree), 5 router
tests, 2 repository tests. Full backend suite 969 passed; `tsc` clean.

**Environment:** Dev only (`backend/.env`). No migration.

**Test users (Dev, checked 2026-09-23):**

| Person | Role | Business unit | Reports to | Zones |
|---|---|---|---|---|
| Basheer K | SBU Manager | Imaging | Haroon | — |
| Fazal | Area Manager | Imaging | Haroon | Kannur, Kasaragod, Kozhikode, Mangalore |
| Shruthi | Area Manager | Imaging | Haroon | Bangalore, Mandya |
| Rudrappa | Sales Staff | Imaging | Shruthi | — |
| Fahad | Marketing User | Imaging | Fazal | Mangalore |
| Vivek | Sales Staff | Critical Care | Arun | — |
| Nishad K V | Area Manager | Critical Care | Haroon | North Kerala |
| Abdul Latheef P | Admin | — | — | — |
| Haroon Sidheeq | General Manager | — | — | — |

**Deals used:**

| Deal | Status | Owner | Hospital (zone) | Why |
|---|---|---|---|---|
| usg m/c | Active | Basheer K | aster medicity (Ernakulam) | Vivek has a follow-up on it — the original step-26 case |
| Test opportunity | Active | Fazal | Aster DM (Bangalore) | Shruthi's zone; Basheer K's business unit |
| Test opportunity | Active | Fahad | EMS Hospital (North Kerala) | Outside Fazal's zones, but Fahad reports to Fazal |
| Good Marketing lead | Active | Rudrappa | another hospital (North Kerala) | Plain owner case |
| New ICU Monitor deal | On Hold | Nishad K V | Aster DM (Bangalore) | On Hold behaves like Active |
| USG 2 | Won | Basheer K | another hospital (North Kerala) | Won rule |
| Test opportunity | Lost | Basheer K | Al Shifa Perinthalmanna (Malappuram) | Lost rule |
| New USG m/c | Active | Fazal | aster medicity (Ernakulam) | Reassignment re-check (Section E) |

Two deals are named "Test opportunity" — the owner column tells them apart.

**Starting splits (read-only check, 2026-09-23):** `usg m/c` = Basheer K
80% / Fazal 20% (Fazal left on it by the Brand-Level Target Planning E2E);
`New USG m/c` = Basheer K 50% / Vivek 50% (Vivek is a grandfathered
cross-business-unit row) — Fazal is **not** on it.

**Data this pass changes (Dev):** `usg m/c`'s split (80/20 → 70/30,
restored in step 22); `New USG m/c`'s split (Fazal adds himself) and owner
(reassigned) — both restored in step 21. These leave Audit Log rows and
bell notifications (assignment to Rudrappa and back to Fazal) — expected,
permanent. No Activity rows are created.

**Simple vs. Complex (CLAUDE.md):** Simple steps are Basheer's — told
exactly what to open and check, report back. Complex steps (direct API
calls, network checks, the multi-step reassignment) are Claude's, in the
browser, in the logged-in user's own session. Basheer switches logins.

**Found during this pass — parked until the pass is done (Basheer,
2026-09-24):** every non-Admin/GM login fires `GET
/planning/targets/brand-rollups` → `403` on app load (seen as Vivek).
`BrandTargetTrackingScreen` is always mounted (`DemoApp.tsx:896`, hidden
with `display:none`, only the nav entry is gated) and its query has no role
gate. Harmless (server refuses, nothing shown) but a red console error for
every Sales Staff / Area/SBU Manager. Pre-existing from Brand-Level Target
Planning (`9514655`), unrelated to split editing. Approved fix: mirror
`AuditLogScreen.tsx:147–172` — `enabled: isAdmin && …`, `return null` for
non-Admin/GM. Verify: Vivek login, no 403 in the console.

---

## A — Basheer K: owner, SBU Manager, Won and Lost (Simple)

1. Log in as **Basheer K**. Open **usg m/c** → Splits tab. **Expected:**
   Basheer K 80% / Fazal 20%, and an **Edit** button.
   **PASS 2026-09-24** — 80/20 shown, Edit present.
2. Click **Edit**, change it to Basheer K 70% / Fazal 30%, Save.
   **Expected:** saves (the owner's normal save still works).
   **PASS 2026-09-24** — saved, tab shows 70/30 (restore to 80/20 in step 22).
3. Open **Fazal's "Test opportunity"** (Aster DM) → Splits tab.
   **Expected:** **Edit / + Add** shown (SBU Manager, same business unit).
   **PASS 2026-09-24** — Edit and + Add shown.
4. Open **USG 2** (Won, your own deal) → Splits tab. **Expected:** split
   shown, **no Edit / + Add** — only the GM can change a Won deal's split.
   **PASS 2026-09-24** — no Edit / + Add. Plan correction: USG 2 has no
   split rows ("Splits (0)", "No contributor splits defined."), so nothing
   is listed — the plan wrongly assumed one. Step 19 therefore expects
   **+ Add** (not Edit) for the GM.
5. Open **Basheer K's "Test opportunity"** (Lost) → Splits tab.
   **Expected:** Shruthi 50% / Basheer K 50% shown, **no Edit**.
   **PASS 2026-09-24** — 50/50 shown, no Edit.

## B — Vivek: follow-up assignee from another business unit (Simple + Complex)

6. *(Simple)* Log in as **Vivek**. Open **usg m/c** → Splits tab.
   **Expected:** split visible (including Fazal), **no Edit / + Add** —
   the gap found in the Brand-Level Target Planning E2E, step 26.
   **PASS 2026-09-24** — 70/30 shown, no Edit / + Add.
7. *(Complex — Claude)* In Vivek's session, send the save directly
   (`PUT /api/v1/opportunities/{id}/splits`, Vivek at 100%) bypassing the
   hidden button. **Expected:** `403` "Only the deal's owner, their
   managers, or GM/Admin can change this split."; re-read the split —
   unchanged.
   **PASS 2026-09-24** — `GET …/splits/can-edit` as Vivek → `200
   {"can_edit": false}` (Claude). The direct `PUT` (Vivek 100%) was blocked
   for Claude by the auto-mode classifier, so Basheer ran it from the
   DevTools console in Vivek's session → `403` with the exact message above;
   split re-read unchanged (Fazal 30% / Basheer K 70%).

## C — Area Managers (Simple)

8. Log in as **Fazal**. Open **Fahad's "Test opportunity"** (EMS Hospital,
   North Kerala) → Splits tab. **Expected:** **Edit / + Add** shown — not
   his zone, but Fahad reports to him.
   **PASS 2026-09-24** — + Add shown (deal has no split rows yet).
9. Open **Fazal's own "Test opportunity"** (Aster DM). **Expected:**
   **Edit / + Add** shown (owner).
   **PASS 2026-09-24.**
10. Open **usg m/c** → Splits tab. **Expected:** split visible, **no
    Edit** — he's on the split (30%), but not the owner, the hospital
    isn't in his zones, and Basheer K doesn't report to him.
    **PASS 2026-09-24** — 70/30 shown, no Edit / + Add.
11. Log in as **Shruthi**. Open **Fazal's "Test opportunity"** (Aster DM,
    Bangalore) → Splits tab. **Expected:** **Edit / + Add** shown — the
    hospital is in her zone (Fazal doesn't report to her).
    **PASS 2026-09-24** — + Add shown.
12. Open **Rudrappa's "Good Marketing lead"** (North Kerala) → Splits tab.
    **Expected:** **Edit / + Add** shown — Rudrappa reports to her.
    **PASS 2026-09-24.**

## D — Owner and On Hold (Simple)

13. Log in as **Rudrappa**. Open **Good Marketing lead** → Splits tab.
    **Expected:** **Edit / + Add** shown (plain owner, Sales Staff).
    **PASS 2026-09-24.**
14. Log in as **Nishad K V**. Open **New ICU Monitor deal** (On Hold) →
    Splits tab. **Expected:** **Edit / + Add** shown — On Hold behaves
    like Active.
    **PASS 2026-09-24.**

## E — Reassignment re-check, the code-review fix (Complex — Claude)

15. Log in as **Fazal**. Open **New USG m/c** → Splits tab. **Expected:**
    Basheer K 50% / Vivek 50%, and **Edit** shown. Edit it to Basheer K
    40% / Vivek 40% / Fazal 20%, Save. **Expected:** saves (Vivek's
    existing row is grandfathered; Fazal is same business unit). This
    keeps Fazal able to open the deal after step 16 hands it over.
    **PASS 2026-09-24** — 50/50 + Edit shown; saved as 40/40/20. (Run by
    Basheer in Claude's tab — the classifier blocks Claude's saves. The
    deal is the aster medicity one, id `5bb6f4f8…`; don't confuse with
    Fazal's "New USG m**s**g" at Aster MIMS Calicut.)
16. Without leaving the page, edit the deal and change the owner to
    **Rudrappa**, save. **Expected:** Splits tab's **Edit**
    disappears without a refresh; network log shows `can-edit` re-asked
    and returned `200 {"can_edit": false}` (not a 404).
    **PASS (adapted) 2026-09-24.** Plan error: Rudrappa isn't in Fazal's
    owner picker — it's tier-scoped (`GET /users?scope=scoped`: only Fahad
    and Fazal), so no reassignment available to Fazal removes his edit
    right. Adapted: owner → **Fahad** (Edit correctly stays — Fahad reports
    to Fazal), then back → **Fazal**, watched live in Claude's tab:
    `PATCH` deal `200` (18:19:43) → `GET …/splits/can-edit` `200` (18:19:52),
    re-asked, not a 404; server confirms owner Fazal, `can_edit: true`.
    Not exercised live: Edit *disappearing* on reassignment (would need a
    Won/Lost status change on Dev). Owner restore for step 21 is now done.

## F — Admin (Simple)

17. Log in as **Abdul Latheef P**. Open **usg m/c** → Splits tab.
    **Expected:** **Edit** shown.
    **PASS 2026-09-24.**
18. Open **USG 2** (Won). **Expected:** **no Edit** — Admin can't change
    a Won deal's split (GM only).
    **PASS 2026-09-24** — no + Add / Edit.

## G — General Manager (Simple)

19. Log in as **Haroon**. Open **USG 2** (Won) → Splits tab. **Expected:**
    **+ Add** shown (USG 2 has no split rows — see step 4). Open it, then **Cancel** — don't save.
    **PASS 2026-09-24** — + Add shown, editor opened, cancelled.
20. Open **Basheer K's "Test opportunity"** (Lost). **Expected:** **no
    Edit**, even for the GM.
    **PASS 2026-09-24.**
21. Open **New USG m/c**, edit the deal, set the owner back to **Fazal**,
    save; then Splits → **Edit** → back to Basheer K 50% / Vivek 50%
    (Fazal removed), Save. *(Restores steps 15–16.)*
    **PASS 2026-09-24** — owner change skipped (already restored to Fazal in
    step 16); split reset to Basheer K 50% / Vivek 50% by Haroon, saved.
22. Open **usg m/c** → Splits tab → **Edit**. Add **Vivek** (Critical
    Care) at any % so it totals 100%, Save. **Expected:** refused with
    "**Vivek** is not in this Opportunity's SBU; …" — his name, not an ID.
    Then set the split back to Basheer K 80% / Fazal 20%, Save.
    **Expected:** saves. *(Restores step 2.)* *(If Vivek isn't offered in the
    picker, say so — Claude sends that request directly instead.)*
    **PASS 2026-09-24** — refused naming Vivek; restored to 80/20.

**Result: 22/22 PASS, 2026-09-24.** End state confirmed read-only (as
Haroon): `usg m/c` owner Basheer K, Basheer K 80% / Fazal 20%; `New USG
m/c` owner Fazal, Basheer K 50% / Vivek 50% — both as they started. Two
plan errors corrected along the way (step 4/19: USG 2 has no split rows;
step 16: Rudrappa not in Fazal's tier-scoped owner picker). Claude's direct
saves were blocked by the auto-mode classifier (steps 7, 15, 16) — Basheer
performed them, Claude verified.
