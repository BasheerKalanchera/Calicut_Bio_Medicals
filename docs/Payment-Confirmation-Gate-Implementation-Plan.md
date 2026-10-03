# Payment Confirmation Gate Before Won — Implementation Plan

**Status:** Built and Dev-tested, 2026-10-03 — commits `b9e01e8`, `71f07b5`,
`0d0133d`, `75ac199`; manual E2E 18/18 (`docs/Payment-Confirmation-Gate-Manual-E2E-Test-Plan.md`).
Not on UAT yet: arrives with the next UAT move (migrations 0057/0058), its own
approval. Still with Haroon and Latheef Bhai: final stage name (~2026-10-05),
interim instruction to reps, timing vs Plan vs Actuals; tell them stall alerts
for Delivery & Installation are NOT live.
**Traceability rows:** none directly (no signed requirement changes status); adds a
rule beyond the signed scope — goes in "Commitment beyond contract" once shipped.
**Design / discussion:** `docs/Discussion-Payment-Confirmation-Gate-2026-09.md`;
Backlog "Payment Confirmation Gate before Won"; the MMC "Edan F6 CTG machine single
fhr" case (Won at stage Lead, 2026-10-03, Progress-Archive 2026-10).

## Decisions

- Won only from the new last stage, after full payment is confirmed — so every
  Opportunity passes through Order and Delivery & Installation first (option B; a
  payment tick at any stage would still allow Won at Lead) — Basheer, 2026-10-03;
  agreed by Haroon and Latheef Bhai, 2026-10-03
- The rule reads "Won cannot be set if full payment is not collected" — full, not
  partial or advance — Basheer, 2026-09-11
- No exceptions: REPEAT_ORDER (BR-OP-13) and Manager-Attested Fast-Track (BR-OP-14)
  Opportunities follow it too — Basheer, 2026-09-11
- Payment is self-attested in the app; no Tally or Finance connection — Basheer,
  2026-09-11
- New stage name: working name "Payment Pending" (alternatives "Awaiting Payment",
  "Collection Pending"). The name is one row of data, so the build can start now and
  the confirmed name is filled in before Dev testing — proposed (Haroon and Latheef
  Bhai to confirm the name, expected by ~2026-10-05)
- Who may confirm "full payment received": anyone who can already edit the
  Opportunity (the rep, or a manager above them); the app records who and when
  automatically — Basheer, 2026-10-03
- Confirmation is a required tick in the same Edit window where the status is set to
  Won ("I confirm full payment has been received"), not a separate screen — Basheer, 2026-10-03
- Moving from Delivery & Installation into the new stage needs nothing extra (no
  delivery date or installation-complete field yet) — the rep moving it there is the
  statement that delivery and installation are done — Basheer, 2026-10-03
- Lost and On Hold are unchanged: still allowed from any stage — Basheer, 2026-10-03
- Opportunities already Won stay as they are; the rule applies from go-live, forwards
  only — Basheer, 2026-10-03
- Opportunities in the new stage count in the open pipeline and the weighted forecast,
  like Delivery & Installation does today; default chance of winning 98% (Delivery &
  Installation is 95%) — Basheer, 2026-10-03
- ~~Creating an Opportunity directly as Won is refused unless it is created at the new
  stage with payment confirmed~~ — superseded after code review: **creating directly
  as Won is refused outright**; a past sale is entered as Active and moved through
  the stages — Basheer, 2026-10-03
- After code review: **the Opportunity must already be saved at Payment Pending**
  before it can be marked Won — reaching Payment Pending and marking Won are always
  two separate saves (option B; a one-save jump with a fast-track could repeat the
  MMC case) — Basheer, 2026-10-03
- After code review: the payment note is stored only with the move to Won; a Won or
  Lost Opportunity's stage can't be changed (BR-OP-09) — Basheer, 2026-10-03
- Interim, before the app enforces this: ask reps now to mark Won only after delivery,
  installation and full payment — proposed (asked of Haroon and Latheef Bhai, not yet
  answered)
- Timing: switch this on before Plan vs Actuals Tracking goes live on UAT, so "Won"
  only ever means one thing on that screen — proposed (asked, not yet answered)
- An optional payment note goes with the tick (e.g. "Final payment by cheque no.
  1234"), like loss notes and fast-track notes; new column `full_payment_note`
  (migration 0058) — Basheer, 2026-10-03
- One column per note, no shared Opportunity notes table for now; revisit if a
  repeating event (several holds, instalment payments) needs its own notes (Backlog)
  — Basheer, 2026-10-03
- Rule number: BR-OP-17 "Payment Confirmation Before Won" (BR-OP-15 and 16 are taken)
  — Basheer, 2026-10-03

## 1. In plain terms

Today a rep can mark an Opportunity Won at any stage once a PO number and a product
are entered. After that it's frozen, so delivery, installation and payment can't be
followed in the app.

After this change:
- A new last stage appears after Delivery & Installation: **Order → Delivery &
  Installation → Payment Pending** (working name). It shows on the pipeline board as a
  new column.
- **Won can only be chosen once the Opportunity has been saved at that last stage.**
  Until then the Won option is greyed out with a short note saying why ("save at
  Payment Pending first") — reaching Payment Pending and marking Won are two
  separate saves. An Opportunity can't be created directly as Won.
- When choosing Won, the rep (or their manager) must tick **"I confirm full payment has
  been received."** The Opportunity page then shows "Full payment confirmed by
  <name> on <date>".
- **Reports:** Won revenue is dated when the Opportunity is marked Won — which now
  means when payment is confirmed, not when the PO arrives. Won figures will appear
  later than today. Delivered-but-unpaid Opportunities stay in the open pipeline.
- Opportunities already Won are untouched.

This lands on **Dev** first, then reaches **UAT** with the next UAT move (it needs a
database change there).

## 2. Build order

1. **Database change (migration):** add the new stage (after Delivery &
   Installation) and two fields on the Opportunity — who confirmed full payment, and
   when. Apply to Dev, regenerate `docs/Physical-Schema.sql`. *Checkpoint commit.*
2. **Server rule + tests:** refuse Won unless the Opportunity is at the new stage and
   full payment is confirmed in the same save; record who/when; same check when
   creating an Opportunity. Update Business Rules and the rule matrix. Backend tests,
   ruff. *Checkpoint commit.*
3. **Screens:** Opportunity page Edit window (Won greyed out before the last stage,
   required payment tick, "confirmed by … on …" line); pipeline board gets the new
   column. tsc, lint.
4. **Review and test:** `/code-review high` (approval-workflow rule + migration), fix
   findings; written Dev test plan (Simple/Complex, checked against live Dev data;
   Basheer clicks for saves); Dev E2E; commit, push, post-commit checklist.
5. **UAT:** goes with the next UAT move (alongside Plan vs Actuals Tracking and the
   hospital-wise planning migrations), with its own approval. The confirmed stage name
   must be in before this step.

Estimate: about 3–4 working days.

## 3. Not in this plan (with reasons)

- **Automatic "stuck in Delivery & Installation" alerts.** The per-stage stall alerts
  (BR-OP-06) aren't built yet — they need the first scheduled background job, already
  tracked as scorecard row "Automated stagnant-deal alerts" (Partial). Until then, the
  Stagnant Deals report shows Opportunities that have gone quiet. The note sent to
  Haroon and Latheef Bhai on 2026-10-03 said the system "will flag" these — that needs
  correcting with them.
- **Delivery date / installation site fields** (BR-OP-01's Order → Delivery gate lists
  them; not in the schema). Separate, existing gap — not needed for this rule.
- **Partial or advance payment tracking, invoices, Tally.** Finance stays the system of
  record (PRD Appendix B.5).
- **Reopening or correcting old Won Opportunities** (e.g. MMC Edan F6). Forwards-only;
  any one-off correction is a separate UAT data fix with its own approval.

## 4. Business rules and records to update

- `docs/Business-Rules.md`: new BR-OP-17; BR-OP-05 (Won requirements) points to it;
  BR-OP-01 table gains the Delivery & Installation → new stage row ("no extra
  requirement"); BR-OP-13 and BR-OP-14 note they don't waive BR-OP-17.
- `docs/ADR.md` ADR-028: note that Won is still a status, now reachable only from the
  last stage.
- `docs/Business-Rule-Implementation-Matrix.md`: BR-OP-17 row.
- `docs/Seed-Data.sql`: new stage row.
- Discussion paper status → "Decided; plan written"; Backlog entry points here.
- User manual / in-app help: "how to mark an Opportunity Won" (rides with the
  manual/help catch-up in the Backlog).
- Traceability "Commitment beyond contract": new row once shipped and E2E-passed.

## 5. Technical addendum

- **Migration (next number after head):** insert `opportunity_stage` row
  (`stage_code` `PAYMENT_PENDING`, `stage_name` working name, `display_order` 80,
  `default_win_probability` 98.00, `is_active` true); add `opportunity.full_payment_confirmed_at
  timestamptz NULL` and `opportunity.full_payment_confirmed_by uuid NULL REFERENCES
  user_profile(id)`. Both columns are covered by the existing `opportunity` audit
  trigger (UPDATE).
- **Validators** (`backend/app/domains/opportunity/validators.py`): `_ORDER_PAYMENT_PENDING
  = 80`; `validate_status_transition` gains `current_stage_order` (before the save),
  `new_stage_order` (after it) and `full_payment_confirmed`; Won requires both stage
  orders ≥ 80 and the flag (option B), failing closed when any is missing. No new
  stage gate in `validate_stage_transition` (decision above).
- **Service** (`service.py`): `create_opportunity` refuses status WON outright;
  `update_opportunity` pops `confirm_full_payment` and `full_payment_note`, and on
  the move to Won sets `full_payment_confirmed_at = now()`, `_by = user_id` and the
  note; refuses a stage change while Won/Lost (BR-OP-09).
- **Schemas:** `OpportunityUpdate` gains `confirm_full_payment: bool = False` and
  `full_payment_note`; `OpportunityCreate` gains nothing; read schemas expose the
  confirmation fields and the confirmer's display name.
- **Frontend:** `OpportunityDetailScreen.tsx` Edit Opportunity modal (status picker,
  tick box, confirmed-by line; existing Won/PO check at ~L1490);
  `OpportunityPipelineScreen.tsx` `PIPELINE_STAGE_CODES` gains `PAYMENT_PENDING`.
  Stage-order constants elsewhere (Customer 360, Project Directory, Quick Lead) are
  creation-only and unaffected — verify during build.
- **Reports:** no query change — revenue already keys on `status_code = 'WON'` and
  `closed_at`; pipeline/forecast already include every non-terminal stage.
- **Tests:** validator unit tests (Won refused below stage 80, and in the same save
  that reaches it; refused without the flag; allowed when already at 80 with the
  flag; REPEAT_ORDER not exempt); service tests for who/when/note recording,
  create-as-Won refused, note ignored without Won, stage frozen once Won.
