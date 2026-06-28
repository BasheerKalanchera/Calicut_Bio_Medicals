# Plan: Option A — Customer + Stakeholder CRUD Forms

## Context

The June 29 customer demo currently shows a read-only browsing experience (Login → Browse Customers → Customer 360 → Product Catalog → Logout). To make the demo more compelling, we're adding Create/Edit capability for Customers and Stakeholders. This is **frontend-only work** — all 4 backend APIs exist, are tested (21 unit tests), and the frontend service functions already call them. The only gap is the UI: no forms, no buttons, no modals.

## Scope

4 modal forms, 2 new files, 2 modified screens:

| Form | Trigger Location | API (exists) | Frontend Service (exists) |
|------|-----------------|--------------|--------------------------|
| Create Customer | "+ Add Customer" button in CustomerDirectoryScreen header | `POST /accounts` | `createAccount(data)` |
| Edit Customer | "Edit" button on Customer360 Overview tab | `PUT /accounts/{id}` | `updateAccount(id, data)` |
| Create Stakeholder | "+ Add" button on Customer360 Stakeholders tab | `POST /accounts/{id}/stakeholders` | `createStakeholder(id, data)` |
| Edit Stakeholder | "Edit" button on each stakeholder card | `PUT /stakeholders/{id}` | `updateStakeholder(id, data)` |

## Files to Create

### 1. `sales-os-app/src/services/masterData.js` (~5 lines)
Fetches SBU list for the customer form's SBU dropdown. Pattern: identical to `accounts.js` / `products.js`. Calls `GET /api/v1/master-data/sbus`, unwraps `response.data.data`.

### 2. `sales-os-app/src/components/FormModal.jsx` (~80 lines)
Reusable modal shell. All 4 forms share identical chrome (backdrop, card, title, error display, submit/cancel buttons, loading state). Form-specific fields are passed as `children`.

**Props**: `isOpen`, `onClose`, `title`, `onSubmit` (async), `submitLabel` (default "Save"), `children`
**Internal state**: `submitting` (bool), `error` (string|null)
**Behavior**:
- Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]` (matches DemoApp sidebar overlay)
- Card: centered, `max-w-md w-full`, `rounded-2xl shadow-2xl`, `max-h-[90vh]` with scroll
- Escape key + backdrop click = close (when not submitting)
- `onSubmit` wrapped in try/catch; errors displayed inline; parent closes modal on success
- Submit button disabled during submission

## Files to Modify

### 3. `sales-os-app/src/screens/CustomerDirectoryScreen.jsx`
- Add imports: `createAccount`, `listSbus`, `FormModal`
- Add state: `showCreateModal`, `sbus[]`, form fields (`formName`, `formSbuId`, `formPayerBehavior`)
- Add SBU fetch: lazy-load on first modal open
- Add `handleCreateAccount()`: validates name not empty, calls `createAccount()`, resets form, closes modal, calls `fetchAccounts()` to refresh list
- Add "+ Add Customer" button in the header (next to "Customer Directory" title)
- Add `<FormModal>` with 3 fields: name (text, required), SBU (dropdown from master data), payer behavior (dropdown: Good/Average/Problematic/Unknown)

### 4. `sales-os-app/src/screens/Customer360Screen.jsx`
Three modals, all refreshing workspace on success via existing `fetchWorkspace()`:

**Edit Account modal:**
- State: `showEditAccount`, `editAccountName/SbuId/Payer`
- `openEditAccount()` pre-populates from `account` data
- "Edit" button added to `OverviewTab` (new `onEdit` prop)
- Same 3 fields as Create Customer, pre-populated

**Create Stakeholder modal:**
- State: `showCreateStakeholder`, `newStakeholderName/Nps/Sentiment`
- "+ Add" button added to `StakeholdersTab` header (new `onAdd` prop)
- 3 fields: name (text, required), NPS score (number, -100 to 100), sentiment (dropdown: Positive/Neutral/Negative)

**Edit Stakeholder modal:**
- State: `editingStakeholder` (object or null controls open/close), `editStakeholder*` fields
- "Edit" button on each stakeholder card (new `onEdit` prop on `StakeholdersTab`)
- Same 3 fields as Create Stakeholder, pre-populated

## What NOT to Change

- `DemoApp.jsx` — modals live inside screens, not the shell
- `src/services/accounts.js` — all 4 functions already exist
- `src/lib/api.js` — no changes
- Backend — zero changes, 154 tests untouched
- No new npm dependencies

## Implementation Order

| Step | What | Est. |
|------|------|------|
| 1 | Create `masterData.js` service | 2 min |
| 2 | Create `FormModal.jsx` component | 15 min |
| 3 | Add Create Customer to `CustomerDirectoryScreen.jsx` | 15 min |
| 4 | Add Edit Account to `Customer360Screen.jsx` (OverviewTab) | 10 min |
| 5 | Add Create Stakeholder to `Customer360Screen.jsx` (StakeholdersTab) | 10 min |
| 6 | Add Edit Stakeholder to `Customer360Screen.jsx` (StakeholdersTab) | 10 min |
| 7 | Visual test all 4 flows in browser | 15 min |
| **Total** | | **~75 min** |

## Verification

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd sales-os-app && npm run dev`
3. Test each flow:
   - Login → Customer Directory → click "+ Add Customer" → fill form → submit → new customer appears in list
   - Click new customer → Customer 360 → Overview → click "Edit" → change name → submit → name updates in header
   - Click "Stakeholders" tab → click "+ Add" → fill form with NPS -15 → submit → card appears with red NPS
   - Click "Edit" on stakeholder card → change NPS to 80 → submit → card shows green NPS
   - Click "← Back" → verify customer still in directory
4. Verify error handling: submit empty name → error message shown in modal
5. `npm run build` — clean, 0 errors
