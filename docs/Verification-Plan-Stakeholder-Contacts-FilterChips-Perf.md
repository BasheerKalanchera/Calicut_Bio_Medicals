# Verification Plan: Stakeholder Contacts, Filter Chips, Performance & Bug Fixes

---

## Prerequisites (Run Before Any Manual Testing)

```bash
# 1. Install new dependency
cd backend && pip install -e .

# 2. Apply database migration
alembic upgrade head

# 3. Run the full test suite
pytest
```

All tests must pass before proceeding to manual verification. There should be no failures outside the known pre-existing stale tests (`managing_sbu_id` / `sbu_exists` references in the old account tests).

---

## Section 1 — Stakeholder Contact Details

### 1.1 Create Stakeholder — all fields saved
1. Open Customer 360 for any account → Stakeholders tab → **+ Add**
2. Fill in: Name, Designation, Email, Phone, NPS Score, Sentiment → click **Create**
3. Modal closes immediately
4. The new stakeholder card appears in the list showing the designation below the name and email/phone as small text
5. Click **Edit** on the same stakeholder → confirm all five fields are pre-populated with the values just saved

### 1.2 Create Stakeholder — optional fields omitted
1. Open **+ Add** → enter Name only → click **Create**
2. Card appears with no designation, email, or phone visible
3. Click **Edit** → designation, email, phone inputs are empty

### 1.3 Create Stakeholder — email validation
1. Open **+ Add** → enter a valid name → enter `not-an-email` in the Email field → click **Create**
2. Expect a **422 validation error** from the backend (Pydantic `EmailStr` rejects it)
3. Repeat with a valid email (e.g. `dr.test@hospital.com`) → expect success

### 1.4 Edit Stakeholder — updating contact fields
1. Open **Edit** on a stakeholder that has existing designation/email/phone
2. Change all three values → click **Save**
3. Modal closes; list refreshes in the background
4. Click **Edit** again → confirm updated values are shown

### 1.5 Edit Stakeholder — clearing contact fields
1. Open **Edit** on a stakeholder that has a saved designation, email, and phone
2. Clear all three fields → click **Save**
3. Click **Edit** again → designation, email, and phone inputs must be **empty** (not showing old values)
4. The card in the list must not show designation, email, or phone text

### 1.6 List card display
1. Find a stakeholder with designation, email, and phone set
2. Verify: designation appears as small gray text below the name
3. Verify: email and phone appear as small `10px` gray text below the sentiment badge
4. Find a stakeholder with none of those fields set — verify none of those lines appear (no blank space)

### 1.7 API verification (optional — via Swagger or curl)
```bash
# Create with all contact fields
POST /api/v1/accounts/{id}/stakeholders
{ "name": "Dr. Test", "designation": "Chief Radiologist", "email": "dr@hospital.com", "phone": "+91-9876543210" }
# → 201, response includes designation/email/phone

# Update clearing all contact fields
PUT /api/v1/stakeholders/{id}
{ "designation": null, "email": null, "phone": null }
# → 200, response shows all three as null
```

---

## Section 2 — Filter Chips Mobile Tab Navigation

### 2.1 Visual appearance on mobile
1. Open the app in Chrome DevTools → set viewport to **390 × 844** (iPhone 14)
2. Navigate to any Customer 360 screen
3. Verify: tabs render as **rounded pill chips**, not rectangular buttons
4. Verify: the active chip has a **blue filled background** and a **checkmark icon** to the left of the label
5. Verify: unselected chips have a white background with a gray border
6. Verify: **no scrollbar is visible** on the chip row

### 2.2 Horizontal scrolling
1. On the 390px viewport, the chip row should not fit all 5 chips without scrolling
2. Swipe / drag the chip row left → all 5 chips (Overview, Stakeholders, Projects, Opportunities, Installed Base) must be reachable
3. Verify the **right-edge gradient fade** is visible when chips extend off-screen, and disappears as you scroll to the end
4. Verify the gradient blends seamlessly with the `bg-gray-50` background (no colour band)

### 2.3 Active chip auto-scroll
1. Tap **Installed Base** (the last chip, likely off-screen initially)
2. The chip row must **smoothly scroll** so the "Installed Base" chip is centred in view
3. Tap **Overview** → chip row scrolls back left, "Overview" chip centred

### 2.4 Tab content switching
1. Tap each chip in sequence: Overview → Stakeholders → Projects → Opportunities → Installed Base
2. Verify the correct content section renders for each tab
3. Verify the previously active chip loses its blue fill and checkmark when a new chip is selected

### 2.5 Touch feedback
1. On a mobile device or touch-simulation mode, tap a chip and hold briefly
2. The chip should visibly **scale down slightly** (`active:scale-95`) on press, then return to normal on release

### 2.6 Desktop behaviour
1. Open on a desktop browser (full width)
2. All chips should be visible without horizontal scrolling
3. No scrollbar visible
4. Hovering an unselected chip should show the blue border/text hover style
5. Clicking each chip switches content correctly

---

## Section 3 — Backend Performance (No Regression)

These verify that the `get_for_update()` / `noload()` changes did not break any CRUD operations.

### 3.1 Account update
1. Open any account → **Edit** → change the name → **Save**
2. Modal closes immediately; account name updates in the header

### 3.2 Stakeholder update
1. Edit any stakeholder → change name → **Save**
2. Modal closes immediately; updated name appears in the list

### 3.3 Project update
1. Edit any project → change name → **Save**
2. Modal closes immediately; updated name appears in the list

### 3.4 Opportunity update
1. Edit any opportunity → change name → **Save**
2. Modal closes immediately; updated name appears in the list

### 3.5 Customer 360 initial load
1. Open Customer 360 for an account that has stakeholders, projects, opportunities, and installed assets
2. Verify all four sub-sections load correctly
3. Check browser DevTools Network tab — the initial load should fire one `GET /accounts/{id}` followed by four parallel sub-resource calls, with no extra redundant calls

---

## Section 4 — Fire-and-Forget Modal Performance

### 4.1 Modal close speed
For each of the following flows, measure the time from clicking **Create / Save** to the modal closing:
- Add Stakeholder
- Edit Stakeholder
- Add Project
- Edit Project
- Add Opportunity
- Edit Opportunity
- Edit Account

**Expected:** Modal closes within ~100–200ms (the write round-trip only). The list/count behind it updates a moment later without any perceptible delay on the modal itself.

---

## Section 5 — Bug Fixes

### 5.1 Win probability auto-updates on stage change
1. Open **Edit Opportunity** on any opportunity
2. Change the **Stage** dropdown to a different stage
3. Verify the **Win Probability** field immediately updates to that stage's default value
4. Verify this works in both directions (e.g. Qualified → Demo, Demo → Qualified)

### 5.2 Decimal indicative values accepted
1. Open **Edit Opportunity**
2. Enter `15.5` in the Indicative Value field → click **Save**
3. Expect success (no HTML validation error)
4. Re-open edit → confirm `15.5` is shown

### 5.3 BR-FIN-06 — Indicative value required at Qualified and above
1. Open **Add Opportunity** or **Edit Opportunity**
2. Set Stage to **Qualified** (or any stage above it) and leave Indicative Value **empty** → click **Create / Save**
3. Expect error: *"Indicative value is required for Qualified stage and above"*
4. Set Stage to **Lead** (below Qualified) with empty Indicative Value → expect **success**
5. Set Stage to **Qualified** and enter a value → expect **success**

---

## Section 6 — Regression Checks

Quick smoke test to confirm nothing else broke.

| Flow | Expected Result |
|---|---|
| Customer Directory loads | Account list renders with search/filter working |
| Open Customer 360 | Overview tab loads account details correctly |
| Create a new Account | 201 created, appears in directory |
| Create a new Opportunity with all fields | 201 created, appears in Opportunities tab |
| Installed Base tab | Installed assets render correctly |

---

## Sign-off Checklist

- [ ] `pytest` — all tests pass (excluding known pre-existing stale tests)
- [ ] Stakeholder create with all contact fields — saved and displayed correctly
- [ ] Stakeholder edit clearing contact fields — values cleared in DB
- [ ] Filter chips render as pills on mobile viewport
- [ ] All 5 chips reachable by scrolling; active chip auto-scrolls into view
- [ ] Gradient blends with background, no scrollbar visible
- [ ] Modal close is fast (fire-and-forget confirmed)
- [ ] Win probability auto-updates on stage change
- [ ] BR-FIN-06 blocks save at Qualified stage with no indicative value
- [ ] No regression on Account / Project / Opportunity CRUD
