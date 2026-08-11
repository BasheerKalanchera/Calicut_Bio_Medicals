# Opportunity Document Upload — Implementation Plan

**Status:** Planned — approved for build, not yet started.
**Date:** 2026-08-11
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete implementation plan for real document/photo upload on
the Opportunity 360 screen (`docs/Backlog.md`'s "Document/photo upload on
Opportunity" entry, sales staff feedback 2026-08-11) — a new "Documents"
tab on `OpportunityDetailScreen.tsx`, backed by real file storage, not the
URL-paste pattern Product Catalog uses today.

---

## Context

**The Backlog entry's "existing precedent" is not what it sounds like.**
`ProductCatalogScreen.tsx`'s collateral-link flow — the pattern the
Backlog note points to — is explicitly labeled in its own code comments as
*"Milestone 1 — URL-only, no real upload yet"* (`document/router.py`).
Today a rep pastes a link to an already-hosted file; no bytes ever leave
the browser. **There is zero file-upload infrastructure anywhere in this
codebase** — no storage integration, no multipart handling on the backend,
confirmed by grep (no matches for storage/bucket/upload in `backend/`).
What sales staff actually asked for — photographing a PO on their phone
and attaching it — needs real upload: a file/camera picker, actual bytes
stored somewhere retrievable, and a security model for who can download
them. Confirmed with Basheer (2026-08-11): this plan covers **real
upload**, not the smaller URL-paste stopgap.

**The good news, confirmed directly against the model:** the `Document`
table was already built with real uploads in mind — **zero schema
changes needed.** `file_size_bytes` is nullable specifically because
"URL-only collateral links... have no real file to size" (existing
comment, `document/models.py:22-24`); `storage_path`'s own comment says
"Real uploads, if built later, would populate this with a Supabase
Storage path instead — same column, no schema change needed."
`file_type`'s comment: "Left unconstrained so real uploads (actual MIME
types) can populate it later." This was deliberately designed forward-
compatible. This plan only adds behavior, not columns.

## Confirmed current state (verified directly against the codebase)

**`Document` model** (`backend/app/domains/document/models.py`) — already
polymorphic, `opportunity_id` already a valid context per
`chk_document_context`. No changes needed.

**`DocumentRepository`** (`document/repository.py`) — has
`product_exists`/`list_by_product` only. Needs `opportunity_exists`/
`list_by_opportunity`, mirroring the exact same shape (this codebase
already has `opportunity_exists()` precedent in several other
repositories — reuse the pattern, not a new one).

**`DocumentService.delete_document`** (`document/service.py:33-37`) —
today only deletes the DB row, because nothing has ever really been
stored. **Must be extended to also delete the underlying Storage
object** — a real, necessary behavior change, not previously needed.

**RLS is already correct, no policy change needed.** `document_tier_
visibility` (confirmed earlier this session, `Physical-Schema.sql`)
already gates a Document row's visibility by inheriting its parent
Opportunity's own tier visibility — `(opportunity_id IS NULL) OR
(opportunity_id IN (SELECT id FROM opportunity))`. Uploading against
`opportunity_id` slots into an already-correct policy.

**Backend config** (`backend/app/core/config.py:15-17`): `SUPABASE_URL`
and `SUPABASE_ANON_KEY` already exist. **`SUPABASE_SERVICE_ROLE_KEY` does
not exist yet** — privileged server-side Storage operations (uploading to
a private bucket on a user's behalf, generating signed download URLs)
require the service-role key, not the anon key. **New secret to
provision** — a real infrastructure/ops action (Render env var, per
`docs/Deployment-Topology.md`'s existing conventions), not just code.

**No HTTP client as a runtime dependency.** `httpx` exists only under
`[project.optional-dependencies].dev` (`backend/pyproject.toml:28`, used
by FastAPI's `TestClient`) — not available at runtime today. Calling
Supabase Storage's REST API needs either promoting `httpx` to a runtime
dependency, or adding the `supabase` Python SDK fresh. Recommend
promoting `httpx` — smaller dependency footprint, this codebase doesn't
need the full SDK for one feature's worth of Storage calls.

**Frontend tab structure** (`OpportunityDetailScreen.tsx:59-68`): `TABS`
is a plain `{id, label}` const array (`overview`/`activity`/
`next-actions`/`products`/`splits`/`stakeholders`), `TabId` derived from
it, rendered via `{activeTab === "x" && <XTab .../>}` branches (line
~1350 onward). Adding `documents` is a one-line array addition plus one
new render branch — same shape as every existing tab, no new navigation
pattern.

**No existing precedent for camera-capture file inputs anywhere in this
app** — this is genuinely new frontend UX, not a port of an existing
pattern.

## Architecture decisions — recommended, flagged for confirmation

**1. Storage: Supabase Storage, one private bucket** (e.g. `documents`).
Already the same platform hosting Postgres — no new infrastructure
provider. Private, not public — a public bucket would let anyone with a
URL bypass the RLS tier-visibility that already correctly gates the
Document *row*; the file *bytes* need the same protection.

**2. Upload flow: proxied through the backend, not direct-to-storage.**
Frontend sends `multipart/form-data` to a new endpoint; the backend
validates (size/MIME type), then uploads to Supabase Storage server-side
using the service-role key. Recommended over a signed-upload-URL flow
(frontend uploads directly to Storage) for simplicity and consistency
with this codebase's existing "backend brokers every write" pattern —
no other feature in this app has the frontend write directly to any
store bypassing the API. Tradeoff: file bytes route through the API
server rather than going straight to Storage — acceptable given expected
file sizes (a phone photo or a scanned PDF, not bulk media).

**3. Download: backend-issued short-lived signed URLs, gated by the
same RLS-scoped read.** A new endpoint (e.g. `GET /documents/{id}/
download-url`) first fetches the Document row through the normal
RLS-scoped session — a user who can't see the row gets the same 404 any
other RLS-protected read would give — then, only if visible, calls
Storage to mint a signed URL (short expiry, e.g. 5 minutes) and returns
it. This is the piece that correctly composes two separate security
layers: Postgres RLS governs row visibility; Storage's own bucket
policies govern byte visibility; without this endpoint, a private bucket
would need its own parallel RLS-equivalent policy to keep in sync with
the table's — routing every download through this check avoids that
duplication entirely.

**4. File type/size limits — confirmed by Basheer, 2026-08-11: PNG, JPEG,
PDF only; 4MB per file.** (HEIC dropped from the original proposal; size
cut from the originally-proposed 10MB.) Enforced both client-side
(immediate feedback) and server-side (never trust the client alone) —
both need the exact same three MIME types
(`image/png`, `image/jpeg`, `application/pdf`) and the same `4 * 1024 *
1024` byte ceiling, wired from one shared constant, not duplicated as two
numbers that could drift apart.

**5. Mobile capture, not just a generic file browser.** `<input
type="file" accept="image/png,image/jpeg,application/pdf"
capture="environment">` — opens the camera directly on a phone, matching
how this app is actually used in the field (per the PWA/mobile context
established elsewhere in this project), not an afterthought bolted onto a
desktop-first picker. **`accept` deliberately lists the three confirmed
MIME types explicitly, not a broad `image/*`** — matches the confirmed
type restriction exactly rather than silently allowing HEIC (and every
other image format) through the picker before being rejected server-side.

## Implementation steps

### 1. Infrastructure provisioning (manual, one-time, per environment)

- Create the `documents` bucket in Supabase Storage (Dev first, then
  UAT/Prod when this ships there) — **outside the Alembic migration
  chain entirely**, same category of out-of-band infra step as
  `rls_auto_enable()` (flagged earlier this session) — must be documented
  somewhere durable (e.g. `docs/Deployment-Topology.md`) so it isn't lost
  when this gets replicated to UAT/Prod.
- Add `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env` (Dev) and to Render's
  environment config for UAT/Prod when deployed. **Treat as sensitive as
  any other secret** — never commit it, never log it.

### 2. Backend dependency

Promote `httpx` from `[project.optional-dependencies].dev` to the main
`dependencies` list in `backend/pyproject.toml`.

### 3. `document/repository.py`

Add `opportunity_exists(opportunity_id)` and `list_by_opportunity
(opportunity_id)`, mirroring `product_exists`/`list_by_product` exactly.

### 4. New storage client module — `backend/app/core/storage.py` (or
similar, confirm placement at build time)

Thin wrapper around Supabase Storage's REST API via `httpx`, using
`SUPABASE_SERVICE_ROLE_KEY`: `upload(path, file_bytes, content_type)`,
`delete(path)`, `create_signed_url(path, expires_in_seconds)`. Isolated
here so no other module needs to know Storage's actual REST shape.

### 5. `document/schemas.py`

New `DocumentUploadResponse` if the upload endpoint's response shape
differs from the existing `DocumentResponse` (likely doesn't — reuse
`DocumentResponse` as-is, confirm at build time). New
`DocumentDownloadUrl` schema (`url: str`, `expires_at: datetime`).

### 6. `document/service.py`

- `upload_document(opportunity_id, file, *, uploaded_by)`: validate
  `opportunity_exists`; validate MIME type is one of `image/png`,
  `image/jpeg`, `application/pdf` and size is ≤ 4MB (`4 * 1024 * 1024`
  bytes), raising `BusinessRuleViolation` otherwise — reject before
  ever calling the storage client, not after an upload attempt; build a
  storage path (e.g. `opportunity/{opportunity_id}/{uuid4()}-
  {original_filename}` — avoid collisions, keep traceable); call the
  storage client's `upload`; create the `Document` row with the real
  `file_size_bytes`/`file_type` (actual MIME type, not Product Catalog's
  free-form label) this time.
- `get_download_url(document_id)`: fetch the Document row (RLS-scoped
  session already gates this correctly — no extra check needed in
  application code); call storage client's `create_signed_url`.
- `delete_document`: extend to call the storage client's `delete` for
  the row's `storage_path` before deleting the DB row. Decide
  transaction ordering carefully — delete storage first, then the DB row
  (if storage delete fails, the DB row survives and the orphan is
  visible/retryable; the reverse order could leave an orphaned file with
  no DB record pointing at it, harder to ever clean up).

### 7. `document/router.py`

- `POST /opportunities/{opportunity_id}/documents` — `multipart/
  form-data`, `UploadFile` (FastAPI's built-in), calls
  `upload_document`.
- `GET /opportunities/{opportunity_id}/documents` — calls
  `list_by_opportunity`, mirrors `list_product_documents` exactly.
- `GET /documents/{document_id}/download-url` — calls `get_download_url`.
- Existing `DELETE /documents/{document_id}` — unchanged route, updated
  service behavior underneath.

### 8. Frontend service — `sales-os-app/src/services/documents.ts`

- `listOpportunityDocuments(opportunityId)`.
- `uploadOpportunityDocument(opportunityId, file: File)` — builds
  `FormData`, posts as `multipart/form-data` (not JSON, unlike every
  other service function in this file — first one that needs this).
- `getDocumentDownloadUrl(documentId)`.
- `deleteDocument` already exists, reused as-is.

### 9. Frontend — new `DocumentsTab` in `OpportunityDetailScreen.tsx`

- Add `{ id: "documents", label: "Documents" }` to `TABS` (line ~65), new
  `{activeTab === "documents" && <DocumentsTab opportunityId={opp.id} />}`
  render branch, same shape as every other tab.
- `DocumentsTab` component: `useQuery` for the list; file input (with
  `capture="environment"` per the mobile-first decision above) +
  `useMutation` for upload, invalidating the list query on success;
  per-row download (calls `getDocumentDownloadUrl`, opens the signed URL)
  and delete (`useMutation`, matching Product Catalog's own
  delete-confirmation UX for consistency).
- Client-side validation before the upload even starts — same three MIME
  types and 4MB ceiling as step 6, sourced from one shared constant (not
  a second hardcoded copy that could drift) — fast feedback, not a
  substitute for the server-side check.

### 10. Business rules — `docs/Business-Rules.md`

New rule under Activity/Document rules (next free `BR-ACT-` number,
confirm at build time) documenting: real upload is now supported on
Opportunities (not just Product Catalog's URL-only links), file type/size
limits, and that download access is gated through the signed-URL endpoint
specifically so Storage-level access never diverges from the Document
row's own RLS visibility.

### 11. Tests

- `upload_document`: rejects oversized files, rejects disallowed MIME
  types, persists correct `file_size_bytes`/`file_type`, calls the
  storage client with the expected path shape.
- `get_download_url`: a document under an Opportunity outside the
  caller's tier visibility is not found (proves the RLS-gated read, not
  just that an endpoint exists).
- `delete_document`: storage client's `delete` is called before the DB
  row is removed; DB row survives if storage delete raises.
- Storage client module: mock the `httpx` calls, don't hit real Supabase
  Storage in unit tests.
- Router tests for the 3 new/changed endpoints.

### 12. Manual verification on Dev

1. Upload a photo from an actual phone (not just desktop drag-drop) —
   confirm the camera opens directly via `capture="environment"`.
2. Upload a PDF — confirm it's accepted; upload something disallowed
   (e.g. a `.exe`, or a HEIC photo straight off an iPhone — a real case
   given the camera-capture flow, not just a theoretical one) — confirm
   client- and server-side rejection.
3. Upload a file over 4MB — confirm rejection with a clear message, not a
   silent failure. Also confirm a file just under 4MB succeeds — the
   boundary itself, not just comfortably-over/comfortably-under cases.
4. Download a document as the uploader — works. As a user with no
   tier visibility into that Opportunity (cross-SBU, no split/owner/
   reminder) — confirm the download-url endpoint 404s, not just that
   the UI happens to hide the button.
5. Delete a document — confirm it's actually gone from Supabase Storage
   (check the bucket directly), not just the DB row.
6. Confirm the signed URL actually expires — wait past the expiry
   window, confirm a stale URL no longer works.

## Ordering

Infrastructure provisioning (1) → backend dependency (2) → repository
(3) → storage client module (4) → schemas (5) → service (6) → router (7)
→ tests (11) → frontend service (8) → frontend tab (9) → business rules
doc (10) → manual verification on Dev (12), including the actual-phone
and cross-tier-denial checks, not just desktop happy-path.

### Critical files
- backend/app/core/config.py
- backend/app/core/storage.py (new)
- backend/app/domains/document/repository.py
- backend/app/domains/document/schemas.py
- backend/app/domains/document/service.py
- backend/app/domains/document/router.py
- backend/pyproject.toml
- backend/tests/domains/document/ (new test files)
- sales-os-app/src/services/documents.ts
- sales-os-app/src/screens/OpportunityDetailScreen.tsx
- docs/Business-Rules.md
- docs/Deployment-Topology.md
