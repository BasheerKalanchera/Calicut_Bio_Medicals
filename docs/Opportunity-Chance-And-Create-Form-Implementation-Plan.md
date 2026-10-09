# Opportunity Chance Rules and One Create Form — Implementation Plan

**Status:** Draft, 2026-10-09.
**Traceability rows:** none (business-rule gap BR-OP-08, new rule BR-OP-19,
front-end clean-up).
**Design / discussion:** chat with Basheer 2026-10-09 (Backlog "Business
rules vs code" gap BR-OP-08; Cabio leadership's request on high-chance
Leads). Steps 2–3 fold in the 2026-10-04 draft
`docs/Opportunity-Create-Form-Unification-Implementation-Plan.md`
(another session's, never committed), which this plan replaces; its
useful points are folded in and it was deleted 2026-10-09.

## Decisions

- D1. BR-OP-08 stands; the code is fixed to match: a chance still equal to
  the outgoing stage's default follows the new stage's default, any other
  value is kept — Basheer, 2026-10-09
- D2. New rule BR-OP-19: a chance of 50 % or more needs an Expected
  Closure Date — Basheer, 2026-10-09
- D3. BR-OP-19 covers every stage before Negotiation (Lead, Qualified,
  Demo, Clinical Evaluation) — Basheer, 2026-10-09
- D4. Existing Opportunities over the limit are held to it on their next
  save; leadership chases them meanwhile with the Expected Closure Dates
  report — Basheer, 2026-10-09
- D5. One plan, three steps in order: (1) server check + Opportunity page
  fix, (2) merge the create forms with no change in behaviour, (3) the
  rule's message on the merged form — Basheer, 2026-10-09
- D6. Everything reaches UAT with the next full promotion from Dev,
  together with Target vs Actuals; no hotfix trip — Basheer, 2026-10-09
- D7. On every form, the Expected Closure Date box appears before
  Negotiation as soon as the chance is 50 % or more (today it is hidden
  until Negotiation, so the rule could not be met) — Basheer, 2026-10-09
- D8. BR-OP-19 applies to REPEAT_ORDER and to a manager-attested gate
  override too: those waive the demo and Negotiation-entry checks, not the
  date behind a high chance — Basheer, 2026-10-09
- D9. BR-OP-19 is checked only on the Opportunity's own save (create, the
  edit form's save, and a stage change, which uses the same save);
  separate saves of products, splits, stakeholders or documents are not
  refused — Basheer, 2026-10-09
- D10. The single create form is the existing top-bar "+ Lead" form, which
  gains a locked hospital (and locked project) when opened from Customer
  360 or the Project Directory — Basheer, 2026-10-09
- D11. The merged form brings the PO Date box to Customer 360 and the
  Project Directory, closing Backlog "Customer 360 and Project Directory
  create forms have no PO Date box" — Basheer, 2026-10-09
- D12. Frontend standards gain a rule: every Opportunity creation uses the
  one create form; no inline create forms — Basheer, 2026-10-09
- D13. Editing stays on the Opportunity page; this plan does not merge the
  edit form with the create form — Basheer, 2026-10-09
- D14. An Opportunity already over the limit shows a notice on its page
  until fixed: "Chance is 50 % or more but there's no expected closure
  date — add one." It does not block anything; it covers Opportunities
  nobody re-saves (D4, D9) — Basheer, 2026-10-09
- D15. Clinical Evaluation's standard chance is 55 % (Seed-Data.sql; Dev
  not yet checked), so every Opportunity at Clinical Evaluation needs a
  date unless the rep lowers the chance; accept this rather than lower
  the stage's standard figure — proposed
- D16. BR-OP-19 and the D14 notice apply only while the Opportunity stays
  Active; marking it Lost, On Hold or Won is never refused by it — proposed
- D17. The gate-override tick box "Fast-Track this Deal" is renamed
  "Fast-Track this Opportunity" on the merged form (step 2) and on the
  Opportunity page if it appears there — proposed

## 1. In plain terms

**Today:**
- A rep's own chance of winning is replaced by the stage's standard figure
  whenever they change the stage on the Opportunity page, even if they had
  lowered it for a reason.
- A rep can put a brand-new Lead at 80 % or 100 % with no idea when it will
  close. On UAT on 9 Oct, 24 open Leads were above 50 % and 8 more at
  exactly 50 %. The weighted forecast counts them at that chance, so it
  looks bigger than it is, and leadership has no date to plan cash flow.
- There are three separate "new Opportunity" forms (top bar, a hospital's
  Customer 360 page, a project's page), each with its own copy of the
  rules. Two of them lack the PO Date box, so they cannot create an
  Opportunity at Delivery or later.

**After:**
- Moving an Opportunity to another stage keeps a chance the rep typed in;
  a chance nobody touched still follows the stage.
- Up to Clinical Evaluation, a chance of 50 % or more cannot be saved
  without an Expected Closure Date. The date box appears on the form as
  soon as the chance reaches 50 %. An existing Opportunity already over
  the limit must get a date (or a lower chance) the next time it is
  saved or moved to another stage; until then its page shows a notice
  asking for the date. Adding a product, document, stakeholder or split
  is never blocked by this.
- Every "new Opportunity" button opens the same form. From a hospital or
  project page the hospital (and project) is filled in and locked. The PO
  Date box is on every form.

All of it is built and tested on Dev and reaches UAT with the next full
move from Dev, together with Target vs Actuals.

## 2. Build order

1. **Server check and Opportunity page fix.**
   - Server: refuse a save that breaks BR-OP-19, on create and update.
   - Opportunity page: changing the stage keeps a chance the rep typed in;
     the Expected Closure Date box appears when the chance is 50 % or more;
     an Opportunity already over the limit shows the D14 notice.
   - Backend tests for the rule; pytest, ruff, tsc, lint.
   - *Checkpoint commit.* On Dev until step 3: the three create forms are
     refused by the server with its message but have no date box before
     Negotiation, so a rep creating a high-chance Lead must lower the
     chance or pick Negotiation. Nothing else changes.
2. **Merge the create forms** (no change in behaviour).
   - Before deleting anything: confirm the Customer 360 and Project
     Directory forms have nothing the "+ Lead" form lacks (products,
     referral credit, manager overrides, stage-by-stage fields).
   - The "+ Lead" form gains a locked hospital / locked project and
     refreshes the lists itself after a save. A locked hospital or
     project shows as a fixed name; the search box and the "+ Add
     Hospital" shortcut are hidden.
   - The Project Directory (smaller) first, then Customer 360: each drops
     its own form (~260 and ~310 lines) and opens the shared one instead,
     along with the lists it loaded only for that form.
   - Frontend standards rule (D12); UI inventory updated.
   - *Checkpoint commit per screen.* Nothing stops working on Dev.
3. **The rule on the merged form.**
   - The date box appears at 50 % or more; the form explains why the save
     needs a date before sending it.
   - *Commit*, then the pre-E2E review and one manual E2E covering all
     three steps, creating an Opportunity from all four ways in: the top
     bar "+ Lead", a hospital's Customer 360 page, a project's page, and
     Marketing Lead "Convert".

## 3. What could be affected

From the code search, 2026-10-09 (D15–D17 came out of it):
- (a) Saves that send a chance or stage: the top-bar "+ Lead" form, the
  Marketing Lead review queue's "Convert" (same form), Customer 360's and
  the Project Directory's create forms, the Opportunity page's edit form.
  The server has one create and one update path
  (`opportunity/router.py:144`, `:184`); no other code creates an
  Opportunity or changes its stage (`accounts.ts:114 updateOpportunity`
  has no callers). The edit form also carries Lost / On Hold / Won (D16).
  The Opportunity page's products panel saves the value through the same
  update (`OpportunityDetailScreen.tsx:420`): the server check fires only
  when a save changes the chance, stage or closure date, so product saves
  are never refused (D9).
- (a2) Repeat Orders: every form hides the Expected Closure Date box for
  REPEAT_ORDER today (`QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx:1953`,
  both inline forms); under D8 the box must show for them at 50 % or more.
- (b) Reports that read the chance: the weighted pipeline value
  (`reporting/repository.py:136`), Target vs Actuals
  (`planning/repository.py:528`), the Pipeline's ordering
  (`opportunity/repository.py:275`). They read the stored figure only;
  the change alters which figure gets stored, not how they compute.
- (c) Lists refreshed after a create: Customer 360's Opportunities tab,
  the Project Directory's list, the Pipeline.
- (d) Features of the two inline forms: the "+ Lead" form already has all
  of them (products, referral credit, manager overrides, stage-by-stage
  fields, Admin/GM SBU choice, project choice) plus hospital search, "+ Add
  Hospital" and PO Date. It already pre-fills the hospital from Customer
  360 (editable); the merge locks it. Project Directory today doesn't
  refresh the hospital's own record after a create; the shared form does.
- (e) Data the two screens load only for their inline forms, removed with
  them. Customer 360: stages, statuses, lead sources, referral users,
  override reasons, SBUs (keeps users and products: its stakeholder,
  project and asset forms use them). Project Directory: those plus its
  users and products copies (keeps its own users list for project forms).
  The shared form loads its lists only when opened (`enabled: isOpen`),
  so each page open makes fewer calls.
- (f) Backend tests mostly use a 5 % chance; any that create or move to
  50 %+ before Negotiation without a date get one (seen at the test run).

## 4. Not in this plan (with reasons)

- **Merging the edit form with the create form:** creating shows fields
  stage by stage; editing must show every saved field so nothing appears
  lost, and products and stage moves on the Opportunity page have their
  own panels (ADR-028, hotfix `eb89fa7`).
- **Bulk-fixing the existing high-chance Leads:** reps know the dates;
  leadership chases them with the Expected Closure Dates report (D4).
- **Server changes to the create endpoint beyond BR-OP-19:** its other
  checks are already shared by every form.

## 5. Business rules and records to update

- `docs/Business-Rules.md`: BR-OP-08 decision note and new BR-OP-19
  (done 2026-10-09).
- `docs/Business-Rule-Implementation-Matrix.md`: BR-OP-08 and BR-OP-19
  rows (planned, done 2026-10-09; update to built at step 3).
- `docs/Backlog.md`: rule gaps 7 → 6 (done); at ship, remove the PO Date
  box entry and note the create-form part of "Front-end consistency
  audit" as resolved.
- `docs/Frontend-Implementation-Standards.md` (D12), `docs/UI-Inventory.md`.
- User manual and in-app help: the new date requirement.
- `docs/Opportunity-Create-Form-Unification-Implementation-Plan.md`:
  deleted 2026-10-09 (Basheer); Backlog links point here instead.

## 6. Technical addendum

- **Server (step 1):** in `OpportunityService.create_opportunity` and
  `update_opportunity`, after the merged values are known: stage
  `display_order` below Negotiation's, `win_probability >= 50`, no
  `expected_closure_date` → `BusinessRuleViolation` with the BR-OP-19
  message. Tests in the opportunity domain's service tests (create, update,
  boundary 49/50, Negotiation unaffected, REPEAT_ORDER and gate override
  still held (D8)).
- **Opportunity page (step 1):** `OpportunityDetailScreen.tsx` Stage
  `onChange` (`:1835`) replaces `editWinProb` only when it equals the
  outgoing stage's `default_win_probability`; the closure-date box's
  condition (`:1953`) also shows it when `editWinProb >= 50`. D14 notice:
  an `Alert` on the page when the saved stage is below Negotiation,
  `win_probability >= 50` and `expected_closure_date` is empty. Stage
  changes go through the same update path (`opportunity/router.py:191`),
  so BR-OP-19 fires on them (D9).
- **Merge (step 2):** `QuickLeadModal.tsx` gains `lockAccount`,
  `lockProject`, `initialAccountName`, `initialProjectName`, and
  invalidates `["opportunities","byAccount",accountId]`,
  `["account",accountId]`, `["pipeline"]` after create; re-exported as
  `OpportunityCreateModal`. `Customer360Screen.tsx` (form around `:1214`,
  `:1535`, `:1586`) and `ProjectDirectoryScreen.tsx` (around `:256`,
  `:430`, `:514`) replace their inline `FormModal` with it, and drop the
  queries used only by it (`oppStages`, `oppStatuses`, `oppUsers`,
  `leadSources`, `referralUsers`, `gateOverrideReasons`, `sbus` — confirm
  each has no other use). `lockAccount` hides the Autocomplete and "+ Add
  Hospital". Callers don't repeat the modal's own invalidation in
  `onCreated`. Callers unchanged: `DemoApp.tsx:927`,
  `MarketingLeadReviewQueueScreen.tsx:216`. Lessons taken from the
  2026-10-04 draft.
- **Rule on the form (step 3):** `QuickLeadModal.tsx` closure-date
  condition (`:546`) also shows the box when the chance is 50 % or more;
  a client-side message mirrors the server's.
- No migration; no schema change.
