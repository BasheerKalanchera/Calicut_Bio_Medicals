# Duplicate Hospital Prevention — Implementation Plan

**Status:** Draft, 2026-10-08.
**Traceability rows:** "What we built" #3 (near-duplicate hospital warning);
business rule BR-ACC-03.
**Design / discussion:** UAT findings in `docs/Progress-Archive-2026-10.md`
(2026-10-08, duplicate hospitals); evidence log
`C:\Backups\CabioUAT\data_consistency_reports\evidence\Render-UAT-duplicate-override-log-2026-10-01-to-10-08.txt`;
report `C:\Backups\CabioUAT\data_consistency_reports\drafts\Duplicate-Hospitals-Check-2026-10-08.pdf`.

## Decisions

- Part A (the button fix) goes to UAT straight away by the "fix to UAT
  ahead of a full promotion" route, on its own; Parts B–D follow later
  — proposed
- Part A also covers the "Change Anyway" button on the hospital page
  (renaming a hospital), which has the same gap — proposed
- Until Part A is on UAT, Haroon tells the field team: after pressing
  "Create Anyway", wait for the form to close; never press it twice —
  proposed
- Part B (fewer false alarms): ignore town and area names when they are
  the only match, using a list of place names — proposed; the list is
  chosen after testing both options in step B1 (see section 1)
- Part C: "Life Line" and "Lifeline" count as the same name — proposed
- Part D: the database itself refuses a second hospital with the same name
  (ignoring capitals and spaces at either end), after the exact copies are
  cleaned up — proposed
- Cleaning up the 13 near-duplicate pairs found on UAT stays out of this
  plan (it needs the field team's confirmation per pair) — proposed
- Three extra safeguards (manager notified when the warning is passed;
  Admin merge tool; Admin approval to pass the warning): about a week
  after Part A is live on UAT, check UAT again for new duplicates; propose
  them only if duplicates still appear — decided (Basheer, 2026-10-08)

## 1. In plain terms

**What went wrong.** On 5 October three copies of "Radians health care
Thrissur" were saved. The server's log shows three separate presses of
"Create Anyway". The server was stuck for about 10 seconds, nothing
seemed to happen, and that button — unlike the main Create button —
stays pressable while saving. The app's check for an identical name
could not stop the copies, because the first save had not finished when
the others checked.

The same log shows the similar-name warning was passed 42 times in 8 days.
Most of those were genuinely new hospitals that only shared a town name
(Yelahanka, Payyannur, Magadi Road, Thrissur) or a word like "Cooperative"
with another hospital. When most warnings are false alarms, people stop
reading them — which is how the real duplicates got through.

**Part A — the button (urgent, UAT first).** "Create Anyway" and the main
Create button both grey out and show "Saving..." while a save is in
progress, so only one save can be sent. The same for "Change Anyway" when
renaming a hospital. If the save fails, the error shows on the form
instead of nothing happening. Screen-only change; nothing in the
database changes.

**Part B — fewer false alarms.** A match on a town or area name alone no
longer sets off the warning; the hospital's own name has to match too.
"Radians health care Thrissur" would no longer warn against "Jubilee
Hospital, Thrissur", but "St Thomas Hospital, Malakkara" would still warn
against "St .Thomas Hospital,Malakkara". Two ways to decide what counts
as a place name — both tested in step B1 against the 42 real warnings
and the 13 known duplicates before you choose:
- **A list of place names (recommended).** Seeded from our territory
  names, plus towns seen in UAT hospital names. Precise, but someone adds
  to it when a new town shows up.
- **Lighter: words that appear in many hospital names in the same
  territory are ignored.** No list to look after, but a hospital chain's
  name ("Aster", "Baby Memorial") also appears many times, so a genuine
  second Aster entry might stop warning.

**Part C — names with and without a space.** "Lifeline" and "Life Line",
"SM" and "S M" are treated as the same.

**Part D — a safety net in the database.** Even if a screen gets it
wrong, the database refuses a second hospital with exactly the same name
and the person sees the usual "already exists" message. Before it can be
switched on, exact copies must be removed: on UAT that is the two empty
Radians copies (no Opportunities, visits or contacts). A read-only check
on Dev and UAT lists any others first.

**Where each part lands.** Part A: UAT first (hotfix), then merged back
into `main`. Parts B–D: built and tested on Dev, then to UAT with the next
full promotion — or as a second hotfix if you want them sooner. Part D
needs a database change on UAT, applied after a fresh backup.

## 2. Build order

**Part A — hotfix, UAT first**
- A1. Branch `hotfix/create-anyway-guard` from `uat`. Grey out both
  buttons while saving; show save errors on the form. Same on the rename
  warning. Type check, lint, frontend build.
- A2. Basheer tests on the local app against Dev: press "Create Anyway"
  several times quickly; exactly one hospital is created. This leaves one
  test hospital, "Test duplicate guard", on the shared Dev database — the
  app has no way to delete a hospital, so it stays (renamed "zz Test" if
  you prefer).
- A3. Commit (own approval), merge into `uat`, deploy (own approval);
  Basheer opens the New Customer form once on UAT.
- A4. Merge `uat` back into `main` (after the Query Load trip 3 merge-back,
  which is still open, so the two don't tangle).

Nothing stops working on Dev or UAT during Part A.

**Parts B and C — the name check, on `main`**
- B1. Offline test of both Part B options and Part C against the 42 log
  names, the 13 duplicate pairs and the existing test cases; results to
  Basheer; he picks the Part B option.
- B2. Build the chosen option and Part C, with tests. Checkpoint commit
  (own approval).

**Part D — the database rule, on `main`**
- D1. Read-only check on Dev, and on UAT (asked first), for hospitals
  whose names match once capitals and end spaces are ignored.
- D2. Clean-up plan for any copies found (UAT: the two empty Radians
  records, plus any others) — own approval; fresh UAT backup; Basheer
  runs it.
- D3. Database change and "already exists" message; full backend tests;
  apply on Dev; schema file regenerated. Commit (own approval).

Until D3 lands, nothing changes; after D3, a second identical name is
refused as it is today, just more reliably.

## 3. What could be affected

- (a) **Screens that create or rename a hospital:** the New Customer form,
  opened from the Customer Directory and from Quick Lead; the rename on
  the hospital page. Each checked before and after.
- (b) **Reports or links:** none — no report opens these forms.
- (c) **Other screens reusing the data:** the hospital lists refresh after
  a save (Customer Directory, Quick Lead's hospital picker); checked that
  the new hospital appears once.

## 4. Not in this plan (with reasons)

- **Merging the 13 near-duplicate pairs on UAT** — each needs the field
  team to confirm it is the same hospital, and merging moves Opportunities,
  visits and contacts; it gets its own plan (Backlog "Duplicate hospitals
  on UAT — clean-up and prevention").
- **Manager notified when the warning is passed; Admin merge tool; Admin
  approval to pass the warning** — UAT is checked again about a week
  after Part A is live; proposed only if duplicates still appear
  (Basheer, 2026-10-08; see Decisions).
- **Why the server stalled for 10 seconds** — not known; the Query Load
  fixes are already working on UAT slowness.
- **Raising the warning threshold** — rejected: it would also stop real
  warnings (Bharathi and the Life Line rename both scored exactly 0.5).

## 5. Business rules and records to update

- BR-ACC-03: add the place-name rule (Part B), the joined-words rule
  (Part C) and the database rule (Part D). Also correct its "Enforcement"
  line: the warning shows on the New Customer form (Customer Directory and
  Quick Lead) and on the hospital rename, not only the Customer Directory.
- `docs/Business-Rule-Implementation-Matrix.md`: BR-ACC-03 row.
- Backlog entry closed when all parts are on UAT.

## 6. Technical addendum

- **Part A:** `sales-os-app/src/components/AddHospitalModal.tsx` —
  `handleCreateAnyway` (no `disabled`, no catch; line 198 on `uat`);
  disable it and FormModal's submit while `createMutation.isPending`
  (FormModal has no prop for that today — add `submitDisabled?` or keep
  the warning's own button state; settle at build). Catch errors and show
  them in the modal. `sales-os-app/src/screens/Customer360Screen.tsx` —
  `handleRenameAnyway` / "Change Anyway" (line 1380 on `uat`), same
  treatment. No backend change.
- **Part B:** `backend/app/domains/account/duplicate_matching.py` —
  `score_query_containment`: matched place-name tokens don't count
  towards the score (or: tokens above a frequency in the pool are
  dropped). Place list either in code beside `STOPWORDS` or built from
  `zone.name` at query time. Tests in `test_duplicate_matching.py`
  covering each of the 42 logged names that should no longer warn and
  each true duplicate that must still warn.
- **Part C:** same file — match query tokens also against adjacent
  candidate-token pairs joined together, and the reverse.
- **Part D:** Alembic migration `CREATE UNIQUE INDEX uq_account_name_normalised
  ON account (lower(btrim(name)))`; `AccountService.create_account` and
  the rename path map the `IntegrityError` to `ConflictError` (409).
  `exists_by_name` switches to the same `lower(btrim(...))` comparison.
  Regenerate `docs/Physical-Schema.sql`.
- **Root-cause evidence:** account `created_at` (transaction start)
  10:05:40.806 / 42.046 / 43.211 UTC; override log lines 10:05:41.162 /
  53.155 / 53.177 UTC, three correlation ids; READ COMMITTED, request 1
  uncommitted when 2 and 3 ran `exists_by_name`.
