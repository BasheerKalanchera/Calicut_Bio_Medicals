# Discussion Paper: Opportunity Support Attribution

**Prepared for:** Discussion with Haroon Sidheeq (General Manager & Sales Head), Latheef
Bhai, and the Cabio leadership team.
**Prepared:** 2026-09-12.
**Status:** DRAFT — core shape decided by Basheer (separate `support_staff` reference
table, no login for support staff, rep's own manager approves, manager must enter a
suggested % to approve, GM gets automatic edit access); one technical gap found while
drafting this paper (§4.1) needs a decision before this is scoped for build.

---

## 1. Where this came from

Raised on a leadership concall: Cabio has no way today to record who — beyond the
opportunity owner — contributed to closing a sale, when that person isn't a co-owner of
the deal. Two concrete cases came up:

- **Application Support** — pre-sales/demo or post-sales/training help (e.g. Anisha runs
  the demo while Naim, the owner, handles the rest of the opportunity).
- **Service/Installation Support** — a service engineer installs the equipment and, for
  some product categories, also provides application training.

Today, Finance identifies and pays incentives for this kind of support entirely outside
Sales OS: at quarter-end, Finance calls the relevant manager/GM to decide the %. The ask
is not to automate that decision — it's to give Finance a structured, manager-reviewed
report to work from instead of starting that conversation from scratch each quarter.

## 2. The current gap

Checked directly against `Business-Rules.md` and `Physical-Schema.sql`:

- **`split` is the only existing attribution mechanism** — percentage-based, records a
  second salesperson formally co-owning the opportunity within the same BU
  (`split_opportunity_id_fkey`, `split_user_id_fkey`, `split_percentage` 0–100). It has
  no concept of support *type* (demo/training/installation) and assumes the person
  being credited is a Cabio sales user.
- **`RELATIONSHIP_SUPPORT` (`BR-ACT-10`) is a different, narrower thing** — it lets
  someone with *no standing access* to an opportunity log an informal note (an
  introduction, a favor) with no percentage, no approval step, and no reporting
  attribution. It was explicitly designed to stay disconnected from incentive
  calculation. Reusing it here would conflict with its own rule.
- **Application/Service Support staff are not Cabio users at all** — they don't log in,
  don't hold a `user_profile` row, and (per Basheer, 2026-09-12) don't need one. Any
  attribution mechanism has to identify them without granting them system access.
- **No approval/review workflow exists anywhere else in the schema** for this kind of
  manager sign-off — the closest precedent is the Won-gate override fields
  (`gate_override_approver_id`/`gate_override_reason_id`), which confirm a single
  decision point, not a pending/approved/rejected review queue.

So Split and informal Relationship Support both exist, but nothing covers "a named
non-sales person helped close this deal, and a manager needs to confirm it and put a
number on it before Finance sees it."

## 3. Proposed design — decided by Basheer, 2026-09-12

**Two new tables, no new user accounts:**

- **`support_staff`** — a lightweight reference/master-data table (`id`, `name`,
  `support_area`: `APPLICATION` / `SERVICE`, `active`). No login, no auth, no RLS
  concerns — the same kind of plain reference data `ADR-028` already established for
  `OpportunityStage`/`OpportunityStatus`. Exists purely so a name can be attached
  consistently to a support entry and counted correctly in reports (avoids "Anisha" vs
  "Anisha K" splitting one person's stats).
- **`opportunity_support`** — the attribution record itself:

  | column | notes |
  |---|---|
  | `opportunity_id` | which deal |
  | `support_staff_id` | FK to `support_staff` — who provided the support |
  | `support_type` | reference data: `DEMO`, `TRAINING`, `INSTALLATION`, … (exact list — §4.2) |
  | `notes` | what was actually done / which product-model, mirroring `BR-ACT-09`'s reasoning that a credit with no description of the work is not useful |
  | `status` | `PENDING_APPROVAL` / `APPROVED` / `REJECTED` |
  | `suggested_incentive_percentage` | numeric(5,2), 0–100 (same bounds as `split.split_percentage`) — **NOT NULL when `status = APPROVED`**, enforced by a check constraint, same pattern as `chk_activity_account_required` |
  | `created_by` | the opportunity owner (rep) who logged it |
  | `reviewed_by`, `reviewed_at` | the rep's own manager, who approved/rejected it |

**Workflow:**

1. The opportunity owner logs a support entry — who helped, what kind of support, what
   they did. No percentage at this point. Status: `PENDING_APPROVAL`.
2. It goes to **the rep's own manager** (not the support person's manager — confirmed by
   Basheer, since the sales manager is close to the deal and can judge whether the
   claimed support genuinely contributed to closing it).
3. The manager either:
   - **Approves** — must enter `suggested_incentive_percentage` in the same action; the
     API rejects an approval with no percentage.
   - **Rejects** — excluded from everything downstream.
4. The manager can revise the % any time after approving, up until that quarter's report
   is generated (useful for comparing numbers across their team before Finance sees
   them).
5. **GM gets automatic edit access** to any entry, not just their own direct reports' —
   see §4.1 for a real gap this creates against how the schema currently implements
   manager-hierarchy access.

**Reporting — quarterly Opportunity Support Report:**

- Scoped to a fiscal quarter (`YYYY-Qn`), one row per `APPROVED` entry only —
  `PENDING`/`REJECTED` entries never reach Finance.
- Joins out to the opportunity's account, product/model, current stage, and Won/Lost
  outcome, alongside the support type and the manager's suggested %.
- Finance uses this as an input to their existing manual %-decision process — it does
  **not** compute or store a final incentive amount. That decision, and any actual
  payout figure, stays entirely in Finance's own system, same boundary the PRD already
  draws around Invoice/Payment/Collections (Appendix B.5).
- Delivery mechanism (in-app screen for Finance vs. a generated export someone in Sales
  sends them) — not yet decided, §4.3.

**Split stays untouched** — it continues to mean formal co-ownership with a
BU-scoped percentage between two salespeople. `opportunity_support` is a parallel,
separate mechanism; both can exist on the same opportunity at once, which is the direct
product distinction the concall raised (Split ≠ Support).

## 4. Open questions — not yet decided

1. **GM automatic access is not actually automatic in the current schema — needs a
   decision.** Checked the existing manager-visibility RLS policies (e.g. the
   `activity`/`opportunity` policies at `Physical-Schema.sql:2535`, `:2606`): they all
   check `user_profile.manager_id = cabio_app_uid()` — a single level up, direct reports
   only. There is no existing recursive "anyone above me in the chain" mechanism
   anywhere in this codebase. So if a GM sits two or more levels above a rep (e.g.
   rep → zone/SBU manager → GM), today's pattern would **not** give the GM edit access
   to that rep's support entries without new work. Two ways forward:
   - Confirm GMs are literally set as the direct `manager_id` for every rep whose
     entries they need to edit (no gap, if Cabio's actual org chart is flat enough)
     — needs checking against real `user_profile` data, not assumed.
   - Build a new recursive-hierarchy RLS check (a `WITH RECURSIVE` walk up
     `manager_id`) — a real, if small, new technical mechanism, not a reuse of an
     existing pattern as originally assumed in this discussion.
2. **Fixed list of `support_type` values.** The call named Demo, Training, Installation
   — is that the complete set, or are there others (e.g. a distinct "Application
   Support" type separate from "Demo")?
3. **Report delivery to Finance.** In-app screen Finance logs into, or a
   scheduled/on-demand export (CSV) someone in Sales sends them each quarter-end? Changes
   whether Finance needs any Cabio access at all.
4. **Visibility of rejected entries to the owner.** Should a rep see that their logged
   entry was rejected (so they know it won't count), even though it's excluded from the
   report?
5. **Can the owner edit or withdraw an entry before their manager reviews it** (e.g. they
   logged the wrong support type by mistake)?

## 5. What this does not do

- Does not calculate or store a final incentive amount or ₹ payout — Finance decides
  that manually, using this report as an input, same as today.
- Does not create logins, roles, or system access for Application/Service Support staff
  — `support_staff` is a name-only reference list, not a user account.
- Does not change `split` in any way — Sales Support via Split remains a fully separate
  mechanism from Application/Service Support attribution.
- Does not connect to Finance/Tally systems — same boundary already drawn around
  Payment/Invoice/Collections (PRD Appendix B.5), consistent with the approach taken in
  the sibling Payment Confirmation Gate paper.

## 6. Reference

- `docs/Business-Rules.md` — `BR-ACT-10` (Relationship Support — why this is a
  different mechanism, not reused here), `BR-ACT-09` (six Sales Development Activity
  types — precedent for `notes` being mandatory when a description is the only record
  of what was done).
- `docs/ADR.md` — `ADR-028` (Stage/Status as configurable master data — the pattern
  `support_type` and `support_staff` follow, rather than hardcoded enums).
- `docs/Physical-Schema.sql` — `split` table (existing Sales Support mechanism, lines
  ~688–701), `activity`/`opportunity` manager-visibility RLS policies (lines ~2535,
  ~2606 — the single-level `manager_id` check behind §4.1's gap).
- `docs/Discussion-Payment-Confirmation-Gate-2026-09.md` — sibling paper on the
  Won/Closed lifecycle payment step also raised in the same concall; no scope overlap,
  cross-referenced for context only.
- `docs/Cabio Sales OS – Phase 1 - PRD.md` — Appendix B.5 (System of Record table:
  Payment/Invoice/Collections under Finance, not Sales OS — same boundary this paper's
  incentive-amount exclusion follows).
