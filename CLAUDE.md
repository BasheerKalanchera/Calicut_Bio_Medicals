# Cabio Sales OS — Project Rules

Rule origins (the incident behind each dated tag) live in
`docs/Process-Rules-History.md` — grep it for the date.

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
- **Safety:** `backend/.env` points at a live, shared Supabase dev DB, not
  local/disposable — never write test data through the live API without checking
  first. `Activity` rows are immutable (no DELETE endpoint), so test writes there
  are permanent. Investigative actions (e.g. a read-only query) need announcing
  first too — see "Show before you act".
- **Safety:** never connect directly to the UAT Supabase project (`backend/.env.uat`)
  — no queries, size checks, dumps, or scripts, even read-only — without asking
  Basheer first. State exactly what will run and wait for explicit go-ahead.
- **Raw SQL on RLS tables:** never trust a zero/low count until all three session
  settings (user, role, SBU) are set and verified — a missing one silently returns
  too few rows. Full recipe in the `cabio-db-and-scripting` skill. *(2026-09-22)*
- **Migrations:** a migration isn't done until it's applied, the apply is recorded
  ("applied to Dev, `alembic current` = …") in a commit or handover, and
  `docs/Physical-Schema.sql` is regenerated and committed. Checklist in the
  `cabio-db-and-scripting` skill. *(2026-09-23)*

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
- Phase 1 scorecard process: `docs/Scorecard-Maintenance-Process.md`.
- DB queries, migrations, scripts, git-branch gaps: the `cabio-db-and-scripting`
  skill — load it before any of those tasks.

## Session handoff
- `.claude/session-handover.md` (renamed from `active_progress.md` 2026-09-24)
  is a handover note, not a log: the task actively in progress and its
  immediate next step, nothing else. Waiting-on-someone items go to
  Progress-Archive; unstarted work to Backlog. Once a thread resolves, its
  detail moves out. Update it as work advances, not only at session end.
  Hard limit 150 lines — the SessionStart hook (`.claude/hooks/session-start.sh`)
  warns above that; prune before any other work. *(2026-09-24)*
- **Documentation homes:** each kind of fact lives in one doc. Everywhere else
  links to it and never restates it. Feature status → Traceability; E2E
  result → that feature's test plan; environments/rollout/UAT→Prod gates →
  `docs/Deployment-Topology.md`; open or deferred work → Backlog; rules and
  decisions → Business-Rules / ADR; history → Progress-Archive; current task
  → `session-handover.md`. Rules for how Claude works go in CLAUDE.md, not
  Claude memory; memory holds only short-lived context, never project status
  or standing rules. A `TODO`/`FIXME` note in code is only a short pointer to an open
  Backlog entry (e.g. `see docs/Backlog.md "<entry title>"`); the details
  live in the Backlog. *(2026-09-24)*
- **Daily documentation tidy-up:** when the SessionStart hook says it's due,
  load the `doc-integrity-sweep` skill and offer to run it. *(2026-09-24)*
- **UAT data-quality check:** every alternate day, run by Claude under
  Basheer's supervision (still ask first, per the UAT rule). The SessionStart
  hook reminds when it's due. *(2026-09-24)*
- **Running commentary** (root causes, design debates, verification results) goes
  directly to `docs/Progress-Archive-<year>-<month>.md` as the work happens. Roll
  to a new monthly file when the month changes.
- **Testing narration:** during manual/E2E testing, log bugs found/fixed and
  notable findings to Progress-Archive promptly — a brief note, unprompted, but
  not routine back-and-forth.
- **Backlog:** deferred ideas and undecided product questions live in `docs/Backlog.md`.
- **Phase 1 sequencing** comes from `docs/Signed-Requirements-to-PRD-Traceability.md`'s
  Partial/Not-started rows. `docs/Phase1-Completion-Sprint-Plan.md` is deprecated
  (~2026-09-12) — don't propose edits to it or treat it as current. *(2026-09-19)*
- **Standing decisions** (business rule, architecture call, API shape, convention)
  go straight into the authoritative doc for that domain — never a progress file.
- Write handover notes **after the fact** with real values (commit hashes, test
  counts) — never a placeholder to fill in later.
- New generated/exported files go to the session scratchpad by explicit full path
  from the first write — never a bare relative filename.

## Feature planning
- The moment a task's scope becomes feature-sized, write
  `docs/<Feature>-Implementation-Plan.md` and present its actual content as chat
  text — not the CLI's plan-mode file/`ExitPlanMode`. *(2026-09-18)*
- When a conversation escalates from a quick question into a real
  architecture/feature decision, say so explicitly in the moment.
- When a dependency crosses environments (Dev vs. UAT, any system boundary), say
  which environment it lands in, in the plain-language pass itself. *(2026-09-19)*
- When there's an obvious heavy design and a lighter one that gets most of the
  value, offer both as a real choice up front. *(2026-09-19)*
- Before building on an already-approved plan, check its structural scope is still
  settled; surface interlocking structural questions (table shape, nesting,
  cascading, scoping) together in one round. *(2026-09-20)*
- When an adjacent design gap surfaces mid-task, lead with a proposed
  narrowly-scoped fix alongside the problem — don't just describe it. *(2026-09-22)*

## Commit approval
- **Every commit needs its own explicit approval, shown first.** Before running
  `git commit`, show the exact file list and full commit message as their own step
  and wait for a yes to *that*. A "go ahead" to a plan that merely *mentions*
  committing ("…then commit and push") approves the edits only, not the commit.
- Applies to every commit: feature, fix, docs-only follow-ups, checklist commits,
  checkpoint commits. No size exemption. *(2026-09-23)*

## Checkpoint commits
- On a long or largely unattended build (new domain, multi-file feature,
  migration + code pair), *propose* a commit at each safe, test-passing milestone
  (e.g. backend compiles and tests pass) — per "Commit approval", never run it
  unasked. Don't wait for the whole feature. *(2026-09-16)*
- A checkpoint commit needn't be feature-complete or trigger the Post-commit
  checklist — say plainly it's partial (e.g. "Part 1, frontend pending").
- If a routine command (test run, lint) takes far longer than normal, flag it —
  don't silently wait it out.

## Pre-E2E code review
- Before manual E2E on a feature, run `/code-review` (medium by default; high for
  RLS/migration/approval-workflow-heavy features) on its commits and fix findings
  first. *(2026-09-17)*
- Applies however small or pattern-mirroring the change — follow the full sequence
  (code-review → written E2E plan → test → commit → checklist) by default, without
  being asked. *(2026-09-22)*
- If correctness depends on a DB trigger, generated column, or other server-side
  write the ORM doesn't re-read, add "did a real save actually complete" as an
  explicit review item — static review can't see a stale in-memory object.
  *(2026-09-22)*
- If the feature has migrations, confirm before E2E starts: Dev's `alembic current`
  = head, and `docs/Physical-Schema.sql` has been regenerated since the last one.
  *(2026-09-23)*

## Mirroring an existing feature
- When a feature is modeled on an existing one, checklist every surface the
  original touches — notification-bell coverage per recipient role, list-view
  badges/counts, every screen a parallel role would expect — before finalizing
  scope. If leaving one out, give a real behavioral reason, not "the plan didn't
  mention it." *(2026-09-18)*

## Manual E2E testing
- Before each test case, check the plan's assumed role relationship matches the
  record actually under test, not just the plan's original setup. *(2026-09-18)*
- Tag every step Simple or Complex before running the plan. **Simple** = one
  click/type/verify-a-value with an unambiguous pass — Basheer runs these, told
  exactly what to do and check, and reports back. **Complex** = precise targeting
  after a layout shift, multi-step/branching, cross-screen/cross-role, or a genuine
  visual check — Claude drives these in the browser. Nothing is skipped; every step
  is recorded. *(2026-09-23)*
- Screenshot only at meaningful checkpoints; use `get_page_text`/`find` to confirm
  a value when a visual check isn't the point. Prefer `find` element refs over
  screenshot coordinates for clicks, especially after a layout shift.
- Record Pass/Fail in the test plan doc the moment each step completes.
  *(2026-09-22)*
- Flag the hot-reload risk before editing frontend files while a test browser
  session is open — it can silently reset the logged-in user. *(2026-09-22)*

## Show before you act
When an action is hard to undo, spends real time/cost, or is visible to Basheer,
show what's about to happen and wait — don't act first and narrate afterward.
- **Investigative actions, not just writes** — say what a query or check will do,
  even read-only, before running it. UAT: ask and wait, never just announce.
- Before asking Basheer a factual question, search the archive, docs and git;
  ask only what they can't answer. *(2026-09-24)*
- When work is pending, end with one status line — done and saved / done, not
  saved / not started — instead of repeated commit reminders. *(2026-09-24)*
  *(2026-09-18)*
- When a question can be answered in plain language or by a query, answer in plain
  language first; offer the query as a follow-up. *(2026-09-21)*
- **Expensive jobs** (full-repo review, broad audit) — show scope and expected
  cost/duration, then wait. A single feature's routine `/code-review` is exempt.
  *(2026-09-17)*
- **Republishing anything client-visible** — show the exact diff, not a prose
  summary, before publishing. *(2026-09-17)*
- **A requested retrospective** — show it in chat as its own turn before writing it
  to Progress-Archive and committing. *(2026-09-18)*

## Post-commit checklist
Feature commits (`feat:`/`fix:`) are committed **and pushed** by Claude Code so
this checklist fires; if one is made elsewhere, Basheer will say "run the
post-commit checklist." The feature/fix commit always lands first as its own
commit; the checklist is a separate, later commit. *(2026-09-18)*

Right after the push, before other work:
1. Update `session-handover.md`: remove the finished thread (its detail goes
   to Progress-Archive) — don't add a "DONE" summary. *(2026-09-24)*
2. Add a Progress-Archive entry with a short retro line (what worked, what to
   improve, any process change).
3. Check `docs/Backlog.md` for newly-surfaced deferred ideas.
4. If a signed requirement closes/advances: update Traceability and regenerate the
   scorecard (see "Scorecard integrity").
5. Run `python scripts/generate_scorecard.py --check`; republish the client
   Artifacts if client-visible.

## Scorecard integrity
Full lifecycle: `docs/Scorecard-Maintenance-Process.md`. Hard rules:
- Never hand-edit `docs/Phase1-Delivery-Scorecard.md`, the `.scratch/*.html`
  scorecards, or Traceability's "Current tally" line — all generated by
  `scripts/generate_scorecard.py`.
- A row moves to Done only when built **and** its manual E2E plan is fully checked
  off — flip it, regenerate, and (if client-visible) republish in the same commit.
- `generate_scorecard.py --check` must pass before any commit touching
  Traceability, the Scorecard, or the HTML — a non-zero exit is a blocker.
