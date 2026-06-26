# Verification Plan: Account Zone / Opportunity SBU Restructuring + Mobile Demo Wrappers

Covers changes from the account entity restructuring (Phase 2D.9) and mobile demo wrapper additions.

---

## 1. Mobile Wrappers

- Open `http://localhost:5173/Mobile-Prototype.html` — phone frame should appear loading the **prototype** (mock data, no login prompt)
- Open `http://localhost:5173/Mobile-Demo.html` — phone frame should appear loading the **login screen** (since `/demo` requires auth)

---

## 2. Hamburger Menu Navigation

**Prototype → Demo:**
- Go to `http://localhost:5173/prototype`
- Open the hamburger menu
- Confirm a **"PRODUCTION"** section appears at the bottom with a **"Demo (Live API)"** link
- Click it — should navigate to `/demo` and show the login screen

**Demo → Prototype:**
- Log into `http://localhost:5173/demo`
- Open the hamburger menu
- Confirm a **"DEVELOPMENT"** section appears with a **"Prototype (Mock Data)"** link
- Click it — should navigate to `/prototype` with no login required

---

## 3. Account Creation — Zone Required

- In the Demo app, go to **Customer Directory**
- Click **+ Add Customer**
- Confirm the form shows **Zone \*** dropdown (not SBU)
- Try submitting with **no zone selected** — should get a validation error "Zone is required"
- Select a zone, fill in the name, submit
- The new account should appear in the list with a **teal zone badge**

---

## 4. Account Zone Default (KAM Default)

- Create a new account **without manually changing the zone dropdown**
- The zone should be **pre-selected to the logged-in user's zone**
- Confirm the created account shows that zone in the list

---

## 5. Account Edit — Zone Override

- Click into any account → **Overview tab** → click **Edit**
- Confirm the form shows **Zone \*** dropdown (not SBU) pre-filled with the account's current zone
- Change the zone to a different one and save
- Confirm the zone badge in the Customer 360 header and Overview tab reflects the new zone

---

## 6. Customer Directory — Zone Badge & Filter

- Confirm all accounts in the directory show a **teal zone badge** (no SBU badge anywhere)
- If the backend filter is wired to the UI (zone filter), filter by zone and confirm only matching accounts appear

---

## 7. Opportunity Creation — SBU Stamping

- Inside any account, go to the **Opportunities tab**
- Click **+ Add**, fill in the form, and create an opportunity
- Open the browser DevTools → Network tab → find the `POST /accounts/.../opportunities` response
- Confirm the response JSON contains `sbu_id` and `sbu.name` matching the **logged-in user's SBU**

---

## 8. Opportunity SBU Persists After Edit

- Edit an existing opportunity — change the Owner to a user from a **different SBU**
- Save and re-fetch the opportunity (check the Network response)
- Confirm `sbu_id` is **unchanged** — it should still reflect the original creating user's SBU, not the new owner's SBU

---

## 9. Database Integrity Check

Run directly in Supabase SQL editor:

```sql
-- All accounts must have a zone
SELECT COUNT(*) FROM account WHERE zone_id IS NULL;  -- expect 0

-- All opportunities must have an sbu
SELECT COUNT(*) FROM opportunity WHERE sbu_id IS NULL;  -- expect 0

-- No account should have managing_sbu_id column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'account' AND column_name = 'managing_sbu_id';  -- expect 0 rows
```
