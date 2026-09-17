# Cabio Sales OS — Project Rules

## Product
- This is a Sales OS, not a CRM — see PRD for the full definition.
- Pipeline model: Target → Coverage → Opportunity → Revenue (see PRD and ADR-013).
- Stage/Status decoupling: Won/Lost are statuses, not pipeline stages — preserve this modeling invariant (see ADR-028).

## Architecture
- Stack: PostgreSQL 17 (Supabase) · FastAPI · React + Vite + TypeScript
- UI framework: Material UI (MUI) is the sole styling/component framework (ADR-031). Tailwind is being removed — do not add Tailwind classes to any component. Legacy Tailwind screens are mid-migration; see docs/Frontend-Implementation-Standards.md for the tracking list.
- SBUs: Imaging, Critical Care (also RLS security boundaries)
- Zones: North Kerala, South Kerala, Bangalore, Mangalore (Central Kerala deprecated 2026-08-21 — accounts moved to South Kerala, zone deactivated; see docs/Zone-Hierarchy-Territory-Data-2026-08.md)
- Fiscal year: Indian FY April–March; period format YYYY-Qn
- Currency: all financial values in INR Lakhs, NUMERIC(15,2)
- **Safety:** `backend/.env` points at a live, shared Supabase dev DB, not local/disposable —
  never write test data through the live API without checking first. `Activity` rows are
  immutable (no DELETE endpoint), so test writes there are permanent.
- **Safety:** never connect directly to the UAT Supabase project (`backend/.env.uat`) —
  no queries, size checks, dumps, or scripts against it — without asking Basheer first,
  even read-only ones. Ask, state exactly what will run, and wait for explicit go-ahead.

## Authoritative References
These documents are the source of truth. Consult the relevant one before writing
code or changing structure. On any conflict, the document wins over this file.
- Backend standards: `docs/Backend-Implementation-Standards.md` — read before any
  model / schema / repository / service / router / test change.
- Frontend standards: `docs/Frontend-Implementation-Standards.md` — read before any
  new screen or component.
- Business rules: `docs/Business-Rules.md` — authority for validation, stage gates,
  and state transitions. Both backend and frontend must honor these.
- Decisions & schema: ADRs in `docs/ADR.md`; `Physical-Schema.sql` is authoritative
  for all DB object names. Consult before any structural change.
- Phase 1 scorecard process: `docs/Scorecard-Maintenance-Process.md` — the
  ledger/photocopy lifecycle and commands behind the "Scorecard integrity"
  rules below.

## Session handoff
- `.claude/active_progress.md` is a live handover doc, not a log: the current task and
  the immediate next step, nothing else. No narrative, no root-cause write-ups, no
  standing decisions, no backlog — those have their own homes (below). Once a thread
  resolves, its detail moves out; it doesn't linger here as history.
- **Running commentary:** detailed write-ups (root causes, design debates, verification
  results) are written directly to `docs/Progress-Archive-<year>-<month>.md` as the work
  happens, not drafted in active_progress.md first. Roll to a new monthly file when the
  month changes. Not loaded at session start; grep it for the detail behind a decision.
  Exception: a thread actively in progress *this session* stays in active_progress.md
  until it resolves — moving it mid-flight makes it harder to follow, not easier.
- **Testing narration:** during manual/E2E testing, when a bug is found and fixed, or a
  notable decision/finding comes up in discussion, log it to the current
  Progress-Archive file promptly — a brief note, not a full write-up, so it doesn't
  slow down the testing flow. Don't wait to be told to "write it down," but don't log
  routine back-and-forth either.
- **Backlog:** deferred/parked ideas and undecided product questions live in
  `docs/Backlog.md`, not active_progress.md.
- **Standing decisions:** anything durable (a business rule, an architecture call, an
  API shape, a convention) gets written directly into whichever authoritative doc
  governs that domain (see "Authoritative References" above) — never parked in a
  progress file, even temporarily.
- Update active_progress.md as work advances, not only at session end.
- Write handover notes **after the fact**, referencing real values (commit hashes,
  exact test counts, etc.) — never a placeholder (`<hash>`) meant to be filled in
  later. Get the real value first, then write the note.

## Checkpoint commits
- On any build expected to run long or largely unattended (a new domain, a
  multi-file feature, a migration + code pair), commit as soon as each safe,
  test-passing milestone is reached — e.g. once the backend compiles and its
  tests pass, before moving on to the migration or the next layer. Don't wait
  for the whole feature, or a whole day's plan, to be finished before saving
  anything.
- **Why:** a 2026-09-16 session built the Target Planning approval-workflow
  backend start to finish — fully tested, migration applied to Dev — over
  roughly three hours with zero commits, then froze at the very end (a hung
  Docker Desktop shutdown command). The work was only recovered intact
  because the next session read the crashed session's own saved transcript
  directly; a less recoverable failure would have put three hours of
  verified work at real risk for no reason.
- A checkpoint commit doesn't need to be feature-complete or trigger the
  Post-commit checklist below — say plainly that it's partial (e.g. a `feat:`
  message noting what's still missing, as `1d9d46a` did: "Part 1, frontend
  pending") so it's clear on review that it isn't the finished thing.
- If a routine command (a test run, a lint pass) takes far longer to return
  than normal, treat that as a signal, not something to silently wait out —
  flag it rather than continuing as if nothing happened.

## Pre-E2E code review
- Before starting manual E2E verification on a feature, run `/code-review`
  (medium effort by default; high for RLS/migration/approval-workflow-heavy
  features) against that feature's commits and fix findings first. Catches
  defects for free that would otherwise surface mid-testing as confusing
  manual-test failures.
- **Why:** a 2026-09-17 review of Target Planning's backend+frontend, run
  right as its manual E2E pass was starting, caught two bugs that would
  have blocked most of that pass outright (a wrong profile field breaking
  every "Set Target" submission, and a silently-empty SBU rollup for two
  roles) — plus two smaller correctness gaps and one RLS-scope question
  worth confirming. Full findings:
  `docs/Target-Planning-Code-Review-Findings-2026-09-17.md`.

## Post-commit checklist
Feature-work commits (`feat:`/`fix:`) should be committed **and pushed** by
Claude Code, not from another tool — this is what lets the checklist below
actually fire. If a feature commit is ever made outside a Claude Code
session, Basheer will say so (e.g. "run the post-commit checklist") so it
can be run retroactively.

Immediately after such a commit is pushed to GitHub — before moving to
other work — go through this checklist:
1. Update `active_progress.md`.
2. Add an entry to the current `docs/Progress-Archive-<year>-<month>.md`,
   including a short retro line: what worked, what to improve, any
   process/best-practice change.
3. Check `docs/Backlog.md` for any newly-surfaced deferred idea from this
   feature.
4. If this feature closes/advances a signed requirement: update
   `docs/Signed-Requirements-to-PRD-Traceability.md` and regenerate the
   scorecard per "Scorecard integrity" below.
5. Run `python scripts/generate_scorecard.py --check` before the docs
   commit, and republish the client Artifact if the change is client-visible.

## Scorecard integrity
- `docs/Signed-Requirements-to-PRD-Traceability.md` is the single source of
  truth for Phase 1 delivery status. `docs/Phase1-Delivery-Scorecard.md` and
  `.scratch/phase1-scorecard.html` (the published client Artifact) are both
  generated from it by `scripts/generate_scorecard.py` — never hand-edit
  either one, and never hand-edit the Traceability file's own "Current
  tally" line (it's auto-written by the same script).
- A row only moves to Done once its feature has been built **and** its
  manual E2E test plan is fully checked off — not on "code is written" or
  "smoke-tested." Until then it stays Partial/Not started with an honest
  Note on what's outstanding, even if the code is already merged.
- The commit that flips a row's status must, in the same commit: update the
  Status/Notes/Client Note in Traceability.md, run
  `python scripts/generate_scorecard.py` to regenerate the tally and both
  derived files, and (if the change is client-visible) republish
  `.scratch/phase1-scorecard.html` to the Artifact. Flipping the status and
  propagating it are one step, not two.
- Before committing any change that touches Traceability.md, the Scorecard,
  or the HTML, run `python scripts/generate_scorecard.py --check` — it
  exits non-zero and names whichever file(s) are stale relative to the
  Traceability table without writing anything. Treat a non-zero exit as a
  blocker, not a warning.
