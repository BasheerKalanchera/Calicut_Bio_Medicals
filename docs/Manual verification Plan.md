Manual Verification Plan — June 29 Customer Demo

Prerequisites

[ ] Seed data loaded (Seed-Data.sql first, then Seed-Data-Demo.sql)
[ ] Supabase auth user created and UUID matches user_profile.id
[ ] Backend running: cd backend && uvicorn app.main:app --reload
[ ] Frontend running: cd sales-os-app && npm run dev
[ ] Open browser to http://localhost:5173/demo

---
FLOW 1: Login (2D.1 + 2D.5)

[ ] /demo shows login form — "Cabio Sales OS" heading visible
[ ] Enter Supabase test email + password → click "Sign In"
[ ] Lands on Customer Directory — header shows Cabio logo + "Sales OS" + "Sign Out"
[ ] Sidebar hamburger (☰) button visible in top-left

FLOW 2: Customer Directory — Browse (2D.2)

[ ] Customer cards load (not stuck on "Loading customers...")
[ ] At least 3 accounts visible from seed data
[ ] Each card shows: name, avatar initial, SBU badge (Imaging/Critical Care), payer behavior badge
[ ] Type "Medical" in search box → list filters after ~300ms debounce
[ ] Clear search → full list restores
[ ] Pagination controls appear if >50 accounts (likely not needed with seed data)

FLOW 3: Customer Directory — Create Customer (2D.6)

[ ] Click "+ Add Customer" button in header → modal opens
[ ] Submit with empty name → error "Customer name is required" shown inline
[ ] Press Escape → modal closes
[ ] Reopen modal → fill name "Test Hospital", select SBU, select "Good" payer → Submit
[ ] Modal closes, "Test Hospital" appears in the directory list with correct badges
[ ] Click backdrop area outside a reopened modal → modal closes

FLOW 4: Customer 360 — Overview (2D.3)

[ ] Click a seeded account card → Customer 360 loads
[ ] Header shows: "Customer 360" label, account name, SBU badge, payer badge
[ ] Summary stats bar shows 3 cards: Stakeholders count, Projects count, Opportunities count
[ ] Overview tab (default) — "Account Details" card with name, SBU, payer behavior
[ ] "Edit" button visible on Overview tab

FLOW 5: Edit Account (2D.6)

[ ] Click "Edit" on Overview → modal opens pre-populated with current name/SBU/payer
[ ] Change name to "Updated Hospital" → Submit
[ ] Modal closes, header immediately shows "Updated Hospital"
[ ] Change name back if desired (for demo cleanliness)

FLOW 6: Stakeholders — Browse + Create + Edit (2D.3 + 2D.6)

[ ] Click "Stakeholders" tab → stakeholder cards with NPS scores and sentiment badges
[ ] NPS color coding: green (≥50), amber (0-49), red (<0)
[ ] Click "+ Add" → Create Stakeholder modal opens
[ ] Fill name "Dr. Test", NPS = -15, Sentiment = Negative → Submit
[ ] Card appears with red NPS and red "NEGATIVE" badge
[ ] Click "Edit" on that card → modal pre-populated
[ ] Change NPS to 80, Sentiment to Positive → Submit
[ ] Card now shows green NPS (80) and green "POSITIVE" badge

FLOW 7: Projects — Browse + Create + Edit (2D.3 + 2D.7)

[ ] Click "Projects" tab → project cards with status badge, owner name, bid date
[ ] "+ Add" button visible in tab header
[ ] Click "+ Add" → Create Project modal opens
[ ] Submit with empty name → error "Project name is required"
[ ] Submit without owner → error "Owner is required"
[ ] Submit without status → error "Status is required"
[ ] Fill name "CT Scanner Tender", select a status, select an owner, pick a bid date → Submit
[ ] New project card appears with correct status badge and owner name
[ ] Click "Edit" on the project card → modal opens pre-populated
[ ] Change status → Submit → badge updates on card

FLOW 8: Opportunities — Browse + Create + Edit (2D.7)

[ ] Click "Opportunities" tab → opportunity cards (or empty state if none seeded)
[ ] "+ Add" button visible in tab header
[ ] Click "+ Add" → Create Opportunity modal opens with 7 fields
[ ] Verify dropdowns load: Stage list, Status list, Owner list, Project list (from this account)
[ ] Submit with empty name → error "Opportunity name is required"
[ ] Fill: Name "MRI Deal", select Project (optional), Stage, Status, Owner, Win Prob = 60, Value = 15 → Submit
[ ] Card appears showing: name, stage badge (amber), status badge (blue), Owner, "Win %: 60%" (amber color), "Value: 15L"
[ ] Click "Edit" on the opportunity → modal opens pre-populated with all values
[ ] Change Stage, change Win Prob to 85 → Submit
[ ] Stage badge updates, Win % shows 85% in green (≥70 threshold)
[ ] Verify summary stats bar at top shows correct Opportunities count

FLOW 9: Installed Base (2D.3)

[ ] Click "Installed Base" tab
[ ] Own product assets show normal border
[ ] Competitor assets show red border + "COMPETITOR" badge
[ ] Each card shows: product name, OEM, model, department, install date

FLOW 10: Navigation — Back to Directory (2D.2 + 2D.5)

[ ] Click "← Back" button → returns to Customer Directory
[ ] Previously created "Test Hospital" still visible in the list
[ ] Click it again → Customer 360 loads correctly

FLOW 11: Product Catalog (2D.4)

[ ] Click hamburger (☰) → sidebar opens with smooth animation
[ ] Sidebar shows: user profile card at bottom (name, role, SBU, zone, green dot)
[ ] Click "Product Catalog" → sidebar closes, "Product Catalog" heading visible
[ ] Product cards load — each shows: name, SBU badge, OEM name, model number
[ ] Type in search box → list filters
[ ] Type in brand filter box → list filters by OEM
[ ] Click a product card → "Product Detail" view with all fields (name, description, OEM, model, category, SBU)
[ ] Click "← Back" → returns to product list

FLOW 12: Sidebar Navigation (2D.2 + 2D.5)

[ ] From Product Catalog, click hamburger → sidebar opens
[ ] Click "Account Management" → returns to Customer Directory
[ ] "Prototype (Mock Data)" link visible under Development section

FLOW 13: Logout + Session Persistence (2D.1 + 2D.5)

[ ] Click "Sign Out" in top header → login form appears
[ ] Navigate to /demo → still on login form (not auto-logged in)
[ ] Login again → navigate around → refresh browser (F5)
[ ] Still logged in and on the same view (Supabase session survives refresh)

FLOW 14: Error Resilience (2D.5)

[ ] Stop backend → refresh frontend → error states appear with "Retry" buttons
[ ] Restart backend → click "Retry" → data loads successfully
[ ] Submit a CRUD form while backend is down → inline error shown in modal (not a crash)

---
Build Verification

[ ] cd backend && python -m pytest -q           → 154 passed, 0 failed
[ ] cd sales-os-app && npm run build            → 0 errors

---
Demo Script (5 min golden path for June 29)

This is the suggested narration order for the actual demo:

1. Login → show Cabio Sales OS branding
2. Customer Directory → browse, search, show badges
3. "+ Add Customer" → create live, show it appear
4. Click into Customer 360 → show Overview, edit account name
5. Stakeholders tab → show NPS colors, create one with negative NPS
6. Projects tab → create a project with status + owner
7. Opportunities tab → create opportunity linked to that project, show win % color
8. Installed Base tab → show competitor highlighting
9. ← Back → navigate to Product Catalog via sidebar
10. Search products, view detail
11. Sign Out

---
This covers every feature across 2D.1–2D.7. The critical CRUD flows (3, 5, 6, 7, 8) are the new capabilities — test those first since they hit the most code paths. The browse/navigation flows (2, 4, 9, 10, 11, 12) are lower risk since they've been working since 2D.2–2D.4.