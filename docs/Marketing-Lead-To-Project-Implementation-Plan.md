# Marketing Lead Conversion to a Project — Implementation Plan

**Status:** Draft, 2026-11-04.
**Traceability rows:** none signed — extends row 1.1 (Lead Capture, Done) and the marketing lead review queue (Traceability's "beyond signed scope" table, item 11). Where it is listed depends on D9.
**Design / discussion:** `docs/Lead-Management-Implementation-Plan.md` (today's Convert and Discard); ADR-014 (Account → Project → Opportunity); ADR-022 (Project owner); BR-OP-21 (first activity).

## Decisions

- D1. Convert first asks "New Opportunity" or "New Project", and the lead becomes one of them. Opportunities are added to the Project afterwards from the Project screen's existing + Add. The heavier choice, a Project and its first Opportunity in one form, is left out — proposed
- D2. The Project form asks what New Project asks today (Hospital, Name, Status, Owner, optional Bid Submission Date). Hospital comes from the lead and can be changed or added as a new customer; Owner starts as the lead's assigned rep; Status starts as Active — proposed
- D3. Saving also needs a first activity and next action, using the same pop-up as an Opportunity, with the lead's note filled in as "what happened". It is recorded on the Project. Other ways of creating a Project do not change — proposed
- D4. The Project, its first activity and the lead's Converted mark save together or not at all. The Opportunity route keeps its two separate saves; fixing that is a separate Backlog item — proposed
- D5. The lead records which Project it became. A lead can point to an Opportunity or a Project, never both — proposed
- D6. The Project keeps the lead's source, and + Add on that Project fills it into Lead Source (still changeable), so every Opportunity under it keeps its marketing origin, whoever adds it — proposed
- D7. If the hospital already has Projects, the form lists them with a line saying to use New Opportunity to add to one, so a second Project isn't created by mistake. It is a reminder and blocks nothing — proposed
- D8. The Marketing Leads screen and the Team section keep the same Converted pill; neither names the Project, just as neither names the Opportunity today — proposed
- D9. This is added to Traceability as work beyond the signed scope, requested by Basheer on 4 Nov 2026 (say if it came from Haroon) — proposed

## Figures and sources

- Request: the conversion process must also be able to add a new Project — Basheer, 2026-11-04.
- Today's Convert behaviour — `sales-os-app/src/screens/MarketingLeadReviewQueueScreen.tsx`, read 2026-11-04.
- New Project form fields — `sales-os-app/src/screens/ProjectDirectoryScreen.tsx`, read 2026-11-04.
- A Project has no SBU and no row-level access rules — `docs/Physical-Schema.sql`, read 2026-11-04.
- "Active" as a Project status — `docs/Business-Rules.md` BR-PROJ-01 lists ACTIVE as a suggested status; the list on Dev is not checked yet (build step 1 checks it first, read-only).
- Example hospital and Project names (Sunrise Hospital, New Cath Lab Block, SonoScape E1 Exp) — made-up examples.

## 1. In plain terms

Today, pressing Convert on a marketing lead opens the New Opportunity form. The form can place the Opportunity under a Project the hospital already has, but the rep can't create a Project there. A rep whose lead turns out to be a bigger programme has to leave the queue, create the Project elsewhere, and come back.

After this change, Convert first asks which one the lead has become.

- **New Opportunity:** exactly today's form and steps.
- **New Project:** a short form with the lead's details filled in. The rep records the first conversation and next action, and saves. The lead shows as Converted and leaves the queue, and the Project appears in the Project Directory and on the hospital's Customer 360.

The rep then adds Opportunities from the Project screen's + Add, as they do today, one per SBU. Each one starts with the lead's source already filled in.

Example (made-up): marketing logs a conference lead for Sunrise Hospital's new cath lab block. The rep converts it to a Project, "New Cath Lab Block", then adds a SonoScape E1 Exp Opportunity under Imaging; a Critical Care rep adds another later.

Two new pieces of stored information: the lead remembers its Project, and the Project remembers its lead source.

Who can convert does not change: the assigned rep, their manager, Admin or GM. This lands on Dev first; UAT follows the normal rollout after its E2E passes.

### On a phone

- The choice appears as a small pop-up with two full-width buttons, one above the other.
- The Project form is one column, like today's New Project form. Any existing Projects appear as a short list above the Name box.
- The first activity pop-up is the existing one, unchanged.

## 2. Build order

1. **Server and database:** a read-only Dev check of the Project status list, then the two new stored fields, then the one save that does everything, and tests. Nothing visible changes, and nothing stops working on Dev. Checkpoint commit proposed.
2. **Screens:** the choice pop-up, the Project form, and + Add's Lead Source. Nothing stops working during this step. Feature commit proposed.
3. **Records:** E2E test plan, pre-E2E code review, E2E on Dev, then the rules and manual updates in section 5.

## 3. What could be affected

- (a) Screens that request or save lead data directly: Marketing Lead Review Queue (Convert), Marketing Leads entry screen (status pill). Check each: Convert to an Opportunity, and Discard and Reassign, behave as before.
- (b) Reports or links that open those screens: notification bell clicks on marketing leads. No reports use the conversion link (search of the reporting domain, 2026-11-04). Check: the bell still opens the queue.
- (c) Other screens fed by the same data:
  - Project Directory list and Customer 360's Projects tab show the new Project.
  - Project screen's Activity and Next Actions tabs show the first activity.
  - The owner's My Work shows the next action.
  - Audit Trail names the Project on the lead's Converted change.
  - The one create form is used from several screens; only + Add on a Project gets the new pre-fill. Check: Lead Source starts empty from Customer 360's + Add and from the header's + Lead.

## 4. Not in this plan (with reasons)

- One form creating a Project and its first Opportunity together: a Project often needs several Opportunities across SBUs, so the one form would still leave most of them to + Add (D1).
- Converting a lead onto an existing Project without any Opportunity: New Opportunity already covers adding to an existing Project.
- Choosing Project or Opportunity when marketing enters the lead: marketing usually doesn't know yet, and the rep decides at review.
- A first-activity rule for every Project: this plan applies it only at conversion (D3).
- Filling the lead's product into the Opportunity form: not done today either; a separate Backlog item if wanted.
- A new notification to the Project owner: creating a Project sends none today. Before approval I'll check whether the next action's owner is told when a manager converts on a rep's behalf.
- Changing the Opportunity route's two separate saves: existing behaviour, so a separate Backlog item (D4).

## 5. Business rules and records to update

- `docs/Business-Rules.md`: new BR-PROJ-02 (a lead converted to a Project), and BR-OP-21's cross-reference.
- `docs/Business-Rule-Implementation-Matrix.md`: the new rule's row.
- `docs/Lead-Management-Implementation-Plan.md`: section 4's Convert pointer to this plan.
- `docs/Signed-Requirements-to-PRD-Traceability.md`: as D9 decides.
- `docs/UAT-User-Manual.md` (Convert mentions at its lines 93, 260, 476) and in-app help: per User Manual plan D15.
- `docs/Physical-Schema.sql`: regenerated after the migration.
- New: `docs/Marketing-Lead-To-Project-Manual-E2E-Test-Plan.md`.

## 6. Technical addendum

**Database (migration, Dev first)**
- `marketing_lead.converted_project_id` uuid, nullable, FK `project.id`.
- Check constraint: not both `converted_opportunity_id` and `converted_project_id`. It does not require one of them, so existing rows can't fail it.
- `project.lead_source_id` uuid, nullable, FK `lead_source.id`. Stored on the Project because `marketing_lead_select` hides the lead from reps outside it, and those reps are the ones adding Opportunities from another SBU.

**Backend**
- New `POST /marketing-leads/{lead_id}/convert-to-project` (`backend/app/api/routers/marketing_leads.py`): body holds `account_id`, the Project fields and the first activity.
- `MarketingLeadService`: reuses `_get_reviewable_lead` for the NEW-only and rights checks. Creates the Project, the activity and the status change in one request; `get_db` commits once at the end (`backend/app/db/session.py:25`), which gives D4.
- `ActivityService.log_first_activity` (`backend/app/domains/activity/service.py:282`) needs `opportunity_id` to become optional, or a sibling method for Projects. Its non-Project use is unchanged.
- `MarketingLeadResponse` and the router's response builder gain `converted_project_id`; `ProjectResponse` and `WorkspaceProject` gain `lead_source_id`.
- Audit: `converted_project_id` → `Project` in `_FIELD_RESOLVER_MAP` (`backend/app/domains/audit/repository.py`).

**Frontend**
- `MarketingLeadReviewQueueScreen.tsx`: both Convert buttons (personal queue and Team section) open the choice pop-up.
- New `MarketingLeadProjectConvertModal` component: reuses `FormModal`, the New Customer pop-up and `CloseReminderModal`'s first-activity mode. MUI only (ADR-031).
- `ProjectDirectoryScreen.tsx`: + Add passes `initialLeadSourceId` from the Project to `QuickLeadModal`, which already accepts it.
- Query caches to refresh on save: `marketingLeads`, `projects`, `activities`, `reminders`.
- `src/types/api.ts` regenerated.

**Tests**
- `backend/tests/domains/marketing_lead/test_marketing_lead_service.py`: success; lead not NEW; caller without rights; missing hospital; all-or-nothing on a failed activity; both-links constraint.
