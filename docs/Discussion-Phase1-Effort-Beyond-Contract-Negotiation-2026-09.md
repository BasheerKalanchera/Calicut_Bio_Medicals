# Discussion Paper: Phase 1 Effort Reconciliation — "Commitment Beyond Contract" vs. Remaining Signed Scope

**Status:** Draft, seeking a second opinion before acting. **Author's intent:**
Basheer is weighing a negotiating position with Cabio leadership — either
compensation for work delivered beyond the signed SOW, or an agreed trade of
some remaining signed scope to Phase 2 — and wants that position checked
before (a) presenting it to Cabio and (b) shipping the 16 commits currently
sitting on `main` but not yet on UAT.

## Background

- The Phase 1 SOW covers 50 signed requirements, tracked row-by-row in
  `docs/Signed-Requirements-to-PRD-Traceability.md` as Done / Partial / Not
  started.
- Separately, `docs/Signed-Requirements-to-PRD-Traceability.md`'s "Commitment
  beyond contract" section lists 16 features built that were never part of
  the signed scope — shown to Cabio on the client-facing scorecard as-is.
- **Cabio's own understanding of "delivered":** they've been shown a
  scorecard (as of ~2 days ago, not the latest version) and already know it
  reflects Dev status, not what's actually usable by their sales team in
  UAT. So "not in UAT = not delivered," from their side, is not a new or
  contested claim — it's already how they read these updates.
- Separately from the SOW-status tracking, `main` currently has **16
  `feat:`/`fix:` commits** that are fully built, tested, and merged, but not
  yet promoted to the UAT environment Cabio actually uses.

## The core question

Basheer's instinct: "We delivered 16 things beyond contract — that's real
extra effort. If Cabio won't pay for it, some signed-but-not-yet-delivered
scope should be fair trade instead, to keep total effort even." The question
put to this discussion: is that reasoning sound, and specifically — does
holding back the 16 main-only commits help make that case, or hurt it?

## The data

**16 "Commitment beyond contract" items, by rough size:**

| Size | Items |
|---|---|
| Large | RLS enforced at the database level everywhere (not just app checks); the marketing-lead review queue (IndiaMART etc.) with its own role; the full notification system (bell + urgent alerts); the audit log screen (7 tables) |
| Medium | Activity comment replies; gate-override approval workflow; repeat-order auto-detection; trade-in/buyback netting; Lead Follow-up Comments |
| Small | PWA install; duplicate-hospital warning; deal-introduction credit tracking; training/certification activity logging; cross-team supportive-contact exception; refurbished/accessory product category |
| Process, not code | Live data entry into the test environment + backup verification on a production-grade schedule |

**The 16 main-only commits, mapped to what they actually are:**

| Commit(s) | What it is | Is it "extra," or signed scope? |
|---|---|---|
| `1d9d46a`, `abaf8fa`, `4927502`, `f8213ee` | Target Planning (approval workflow, frontend, Annual view) | **Signed Feature 3.1** |
| `44e6d8c`, `6bb0d31`, `9023965` | Sales/Pipeline Report, Product Performance, Report Drill-down | **Signed Features 11.1, 11.2** |
| `d7a0e6f`, `087c284`, `34d0170` | Insights Dashboard batches, product-forecast breakdown | **Signed Features 2.5, 3.2** |
| `b000a09`, `90a752a` | High Priority Deal Flag + Kanban sort | **Signed Feature 2.2** |
| `e1db0e8` | Product Catalog collateral gating | Minor scope-adjacent fix |
| `6d333ef` | RLS gaps closed (activity, marketing_lead, document, notification) | Security fix — not scope either way |
| `d899b15`, `a16c22c` | Lead Follow-up Comments | **Genuinely extra — beyond-contract item #16** |

**14 of 16 are signed-scope completions, not extras.** Only Lead Follow-up
Comments is a genuine bonus sitting unshipped; the RLS-gaps fix is a security
patch, not scope at all.

**Remaining Partial + Not-started gap** (after assuming the 16 commits ship):

| Size | Items |
|---|---|
| Large | Coverage/Beat Planning (fully scoped, zero code — comparable in size to Target Planning) |
| Medium | Margin Report, Weekly Follow-up Report, Competitive Loss Report, GM-specific dashboard widgets, forecast by month/quarter, stagnant-deal auto-alert scheduler, Brand/Category free-text → pick-list conversion |
| Small | Tier 1/2 dropdown, competitor-product field, demo outcome field, demo-to-sale conversion report |
| Already mutually settled, not contested | A/B/C/D account class, pipeline-aging analytics, product-category targets — Haroon already agreed these move to Phase 2 |
| Unscoped, can't size yet | Account segmentation by size/specialty/revenue, Account Manager role — need Cabio's own scoping input first |

## The reasoning chain worked through in this discussion

1. **First framing tried:** is the 16-item beyond-contract effort roughly
   equal to the remaining Partial/Not-started effort? Beyond-contract edges
   it out, mainly on Large items (4 vs. 1).
2. **Correction — UAT-visibility reframing:** since Cabio already treats
   "not in UAT" as "not delivered," the 16 main-only commits should logically
   join the "not delivered" pool too — this seemed to strengthen the case
   further, since it made the "not delivered" pool bigger.
3. **Critical correction — an item can't be double-counted.** 14 of the 16
   main-only commits are completions of *signed* requirements (Target
   Planning, the Reports, High Priority Flag), not extras. They can be
   counted as "delivered" (ship them — they satisfy real obligations, at
   zero additional effort since the work is already done) or as "not yet
   delivered" (an actual SOW shortfall) — but not simultaneously claimed as
   both "extra leverage" and "still owed." Holding them back doesn't save
   any effort (the cost is already sunk) and creates real contractual risk
   for no benefit.
4. **Resulting recommendation:** ship the 16 commits — it costs nothing
   additional and removes 3 of the "still owed" items (Target Planning,
   Reporting Suite, High Priority) from the ledger entirely. What's left,
   genuinely unbuilt, shrinks to one real Large item (Coverage Planning)
   plus a short, partly-cheap Medium/Small tail — small relative to the 16
   delivered extras (4 major systems among them).

## Recommended position (pending second opinion)

1. **Ship all 16 commits from `main` to UAT now** — no reason to hold any of
   them back; the effort is already spent, and withholding them only
   creates risk without any offsetting benefit.
2. **Then negotiate from the clean comparison:** 16 delivered items beyond
   contract (including 4 major standalone systems) vs. a short remaining
   list anchored by one real Large item (Coverage Planning). Either ask for
   compensation for the extras, or propose Coverage Planning (optionally
   plus 1-2 Medium items, e.g. Margin Report + Weekly Follow-up Report) move
   to Phase 2 in lieu of additional payment.

## Open questions for the second opinion

- **Is it commercially/contractually sound to condition anything on this at
  all?** An alternative view: signed scope must be delivered regardless of
  what else was built; "extras" are goodwill with no negotiating leverage
  attached, full stop. This discussion has assumed a trade is a reasonable
  ask — that assumption itself deserves scrutiny before it's put to Cabio.
- Does the relative sizing above (Large/Medium/Small, a qualitative
  judgment based on session history, not tracked hours) hold up, or does the
  reviewer weight any of these items differently?
- Is Coverage Planning genuinely the right single item to propose trading,
  or does its status as a real, oft-discussed roadmap item make it a worse
  choice than something less anticipated by Cabio?
