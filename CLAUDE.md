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
  immutable (no DELETE endpoint), so test writes there are permanent. Investigative actions
  (e.g. a read-only query) need announcing first too — see "Show before you act" below.
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
- **Phase 1 planning/sequencing:** `docs/Phase1-Completion-Sprint-Plan.md` is
  deprecated as a planning source, as of ~2026-09-12 — it still exists in the
  repo, but don't propose edits to it or treat its "this week/next week"
  framing as current. Phase 1 build sequencing now comes directly from
  `docs/Signed-Requirements-to-PRD-Traceability.md`'s Partial/Not-started
  rows instead (its Status/Notes/Client Note columns are already the single
  source of truth for delivery status — see "Scorecard integrity" below;
  this extends the same file to sequencing, not just status). **Why:**
  2026-09-19, a build-order update was offered against the Sprint Plan doc
  before checking whether it was still the live planning artifact; Basheer
  had already told me this once before ("remember?") and it had never been
  written down anywhere authoritative.
- **Standing decisions:** anything durable (a business rule, an architecture call, an
  API shape, a convention) gets written directly into whichever authoritative doc
  governs that domain (see "Authoritative References" above) — never parked in a
  progress file, even temporarily.
- Update active_progress.md as work advances, not only at session end.
- Write handover notes **after the fact**, referencing real values (commit hashes,
  exact test counts, etc.) — never a placeholder (`<hash>`) meant to be filled in
  later. Get the real value first, then write the note.
- A requested retrospective is written to Progress-Archive only after being shown in
  chat first — see "Show before you act" below.
- Default any new generated or exported file to the session scratchpad directory, by
  its explicit full path, from the very first write — never a bare relative filename
  that lands wherever the shell's current directory happens to be.

## Feature planning
- The moment a task's scope becomes feature-sized, write `docs/<Feature>-
  Implementation-Plan.md` as the primary planning artifact and present its actual
  content as chat text — don't rely on, or start with, the CLI's built-in plan-mode
  file/`ExitPlanMode` review as if it were the review step. Matches this repo's
  existing convention (`docs/Target-Planning-Implementation-Plan.md`, `docs/High-
  Priority-Deal-Flag-Implementation-Plan.md`, etc.). **Why:** 2026-09-18, a plan was
  written to the ephemeral plan-mode file and submitted via `ExitPlanMode`; Basheer:
  "You are deviating from the process. First prepare an implementation plan and show
  me the plan."
- When a conversation's scope visibly escalates from a quick question into a real
  architecture/feature decision, say so explicitly in the moment — don't keep going
  conversationally until the missing plan doc causes friction on its own.
- When flagging a dependency on another environment (Dev vs. UAT, or any other
  system boundary), state up front which environment it actually lands in — in
  the plain-language pass itself, not buried in a technical addendum to untangle
  after confusion already shows up.
- When a feature has both an "obvious heavy version" (e.g. a new cascade/push
  mechanism) and a lighter version that gets most of the value (e.g. aggregating
  what already exists), surface both as a real choice up front — don't default to
  the heavier design and wait to be redirected to the lighter one.
- **Why (both above):** 2026-09-19, Brand-Level Target Planning — the first pass
  explained a Product Catalog dependency ambiguously about which environment it
  applied to, costing a clarifying round-trip; separately, a full top-down
  cascade was the working assumption until Basheer proposed a much simpler
  bottom-up rollup comparison himself, which should have been offered as an
  explicit option from the start.

## Checkpoint commits
- On any build expected to run long or largely unattended (a new domain, a
  multi-file feature, a migration + code pair), commit as soon as each safe,
  test-passing milestone is reached — e.g. once the backend compiles and its
  tests pass, before moving on to the migration or the next layer. Don't wait
  for the whole feature, or a whole day's plan, to be finished before saving
  anything.
- **Why:** a 2026-09-16 session built Target Planning's backend fully tested
  over ~3 hours with zero commits, then froze at the end (a hung Docker
  shutdown). Recovered only by reading the crashed session's own transcript —
  a less recoverable failure would have lost real verified work for no reason.
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
- **Why:** a 2026-09-17 review of Target Planning, run right as its manual
  E2E pass was starting, caught two bugs that would have blocked most of
  that pass outright — see `docs/Target-Planning-Code-Review-Findings-
  2026-09-17.md` for the full findings.

## Mirroring an existing feature
- When a feature is explicitly modeled on an existing one (e.g. Lead Follow-up
  Comments mirroring Activity Comments), checklist every surface the original
  touches — notification-bell coverage for every recipient role, list-view
  badges/counts, every screen a parallel role would expect it on — before
  finalizing scope. Don't drop an item reasoning "the plan doc doesn't mention
  it, so it's scope creep"; check whether the analog feature already has it
  first, and if leaving it out, say why (a real behavioral difference), not
  just that it wasn't spelled out.
- **Why:** 2026-09-18 — Lead Follow-up Comments initially dropped two things
  Activity Comments already had (a comment-count badge, full notification-bell
  coverage per role); both surfaced only once Basheer manually tested with
  real role switches, one of them being the exact problem the feature was
  built to solve for that role.

## Manual E2E testing
- Before executing a test case against a specific login, sanity-check that the
  test plan's assumed role relationship actually matches the record currently
  being tested — not just the plan's original setup section, if testing has
  since moved to a different record. **Why:** 2026-09-18 — a planned persona
  (a specific Area Manager) didn't manage the rep who owned the lead actually
  under test; caught only after switching to the wrong login.
- In browser automation, prefer `find`-returned element refs over screenshot
  coordinates for clicks — especially right after an expand/collapse or any
  layout-shifting action, where a stale coordinate can miss silently (the
  click lands, but on the wrong element) rather than erroring.

## Show before you act
Same discipline across several situations: when an action is hard to undo,
spends real time/cost, or is visible to Basheer, show him what's about to
happen and wait for a reaction — don't act first and narrate afterward.

- **Investigative actions, not just writes** — state what a query or check
  will do, including a plain read-only one, before running it. UAT goes
  further: ask and wait for explicit go-ahead, never just announce (see
  Architecture's Safety bullets). **Why:** 2026-09-18, a live Dev DB query
  ran with no explanation first — "what are you doing?"
- **Token-intensive or expensive jobs** (a full-repo code-review pass, a
  broad audit) — show scope, what it checks, and expected cost/duration,
  then wait for go-ahead. A single feature's routine `/code-review` is
  exempt (see "Pre-E2E code review" above). **Why:** 2026-09-17, a
  45-migration RLS audit started immediately on "let's do that," before
  scope or cost had been shown.
- **Republishing anything client-visible** (a scorecard Artifact, a shared
  doc) — show the exact diff, not a prose summary, before publishing.
  **Why:** 2026-09-17, a prose description of a scorecard change prompted
  "what are the changes?"; a real diff let the next update get approved on
  sight.
- **A requested retrospective or reflective summary** — show it in chat, as
  its own turn, before writing it into Progress-Archive and committing.
  Pasting it in the same message you commit it in isn't "showing" it.
  **Why:** 2026-09-18, a retrospective was pasted and committed/pushed in
  the same response — "Where is the retrospective? I have not seen it."

## Post-commit checklist
Feature-work commits (`feat:`/`fix:`) should be committed **and pushed** by
Claude Code, not from another tool — this is what lets the checklist below
actually fire. If a feature commit is ever made outside a Claude Code
session, Basheer will say so (e.g. "run the post-commit checklist") so it
can be run retroactively.

**The feature/fix commit always lands first, as its own commit; this
checklist runs after, as a separate commit** — never interleaved with or
run before the feature commit itself. (This is about ordering *between*
commits; Scorecard integrity's "one commit" rule below is about what
belongs *inside* the checklist's own commit once you're running it — the
two aren't in tension.) **Why:** 2026-09-18, Scorecard/Traceability
regeneration started before the feature commit existed — "Shouldn't we
first commit and then run the post-commit checklist?"

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
  propagating it are one step, not two — this governs what's *inside* that
  commit, same as the checklist commit described above.
- Before committing any change that touches Traceability.md, the Scorecard,
  or the HTML, run `python scripts/generate_scorecard.py --check` — it
  exits non-zero and names whichever file(s) are stale relative to the
  Traceability table without writing anything. Treat a non-zero exit as a
  blocker, not a warning.
