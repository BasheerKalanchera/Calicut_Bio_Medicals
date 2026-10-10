# Cabio Sales OS — Project Rules

Rule origins (the incident behind each dated tag) live in
`docs/Process-Rules-History.md` — grep it for the date.

## Product
- This is a Sales OS, not a CRM — see PRD for the full definition.
- Pipeline model: Target → Coverage → Opportunity → Revenue (see PRD and ADR-013).
- Stage/Status decoupling: Won/Lost are statuses, not pipeline stages — preserve this modeling invariant (see ADR-028).
- Terminology: say "Opportunity", never "deal", in code, comments, docs,
  commit messages and chat with Basheer. *(2026-10-01)*

## Architecture
- Stack: PostgreSQL 17 (Supabase) · FastAPI · React + Vite + TypeScript
- UI framework: Material UI (MUI) is the sole styling/component framework (ADR-031). Tailwind is being removed — do not add Tailwind classes to any component. Legacy Tailwind screens are mid-migration; see docs/Frontend-Implementation-Standards.md for the tracking list. Keep the full per-file migration ritual (property-diff, honest tracker updates) — it has repeatedly caught real bugs. *(2026-07-05)*
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
  detail moves out. Update it as work advances, not only at session end —
  Basheer restarts sessions every 3–4 hours, so keep it current at every pause, including each checkpoint within a build.
  Before starting a step of an approved plan, read the plan, this note and the
  archive first. Before writing or trusting any claim in the note — commit
  status or otherwise — check it against git, the docs and the code; the note
  is a pointer, not proof. *(2026-10-06, 2026-10-07)* Hard limit 150 lines — the SessionStart hook (`.claude/hooks/session-start.sh`)
  warns above that; prune before any other work. *(2026-09-24)*
- **Documentation homes:** each kind of fact lives in one doc. Everywhere else
  links to it and never restates it. Feature status → Traceability; E2E
  result → that feature's test plan; environments/rollout/UAT→Prod gates →
  `docs/Deployment-Topology.md`; open or deferred work → Backlog; rules and
  decisions → Business-Rules / ADR; history → Progress-Archive; current task
  → `session-handover.md`; process suggestions → `docs/Process-Improvements.md`. Rules for how Claude works go in CLAUDE.md, not
  Claude memory; memory holds only short-lived context, never project status
  or standing rules. A `TODO`/`FIXME` note in code is only a short pointer to an open
  Backlog entry (e.g. `see docs/Backlog.md "<entry title>"`); the details
  live in the Backlog. *(2026-09-24)*
- **When a fact or decision changes:** in the same commit, search the docs for
  the old wording and for the open question's title, and update every
  living-doc hit — not just the doc you're working in. *(2026-09-26)*
- **Retros and process review:** one retro at the end of every session, and
  the process review when the hook says it's due — load the `process-review`
  skill for both. *(2026-10-06, 2026-10-08)*
- **Documentation tidy-up, every alternate day:** the day after the UAT
  data-quality check, so the two take turns. When the SessionStart hook says
  it's due, load the `doc-integrity-sweep` skill and offer to run it.
  *(2026-09-24, 2026-10-07)*
- **UAT data-quality check:** every alternate day, run by Claude under
  Basheer's supervision (still ask first, per the UAT rule). The SessionStart
  hook reminds when it's due. Steps in the `cabio-db-and-scripting` skill.
  *(2026-09-24)*
- **Surfacing hook reminders:** Basheer never sees SessionStart hook output —
  only Claude does. Whenever it reports something due, the first reply of the
  session opens with a short "Due today" list, asking whether to run each item,
  before answering anything else — even if his first message is unrelated.
  *(2026-09-25)*
- **Running commentary** (root causes, design debates, verification results) goes
  directly to `docs/Progress-Archive-<year>-<month>.md` as the work happens. Roll
  to a new monthly file when the month changes.
- **Backlog:** deferred ideas and undecided product questions live in `docs/Backlog.md`.
- **Phase 1 sequencing** comes from `docs/Signed-Requirements-to-PRD-Traceability.md`'s
  Partial/Not-started rows. `docs/Phase1-Completion-Sprint-Plan.md` is deprecated
  (~2026-09-12) — don't propose edits to it or treat it as current. *(2026-09-19)*
- **Standing decisions** (business rule, architecture call, API shape, convention)
  go straight into the authoritative doc for that domain — never a progress file.
  An agreed design decision for a feature goes into its plan doc the same turn.
  *(2026-10-05)*
- Write handover notes **after the fact** with real values (commit hashes, test
  counts) — never a placeholder to fill in later.
- New generated/exported files go to the session scratchpad by explicit full path
  from the first write — never a bare relative filename.
- A task that runs a script cleans up the Python cache it leaves behind;
  for `scripts/` the `clean-pycache` hook does it automatically. The
  backend's cache stays (the running server uses it). *(2026-10-07)*

## Feature planning
- The moment a task's scope becomes feature-sized, write
  `docs/<Feature>-Implementation-Plan.md` and present its actual content as chat
  text — not the CLI's plan-mode file/`ExitPlanMode`. *(2026-09-18)*
- Start new plans from `docs/templates/Implementation-Plan-Template.md`; every
  choice goes in its Decisions list as "proposed" until Basheer answers. A
  save-time hook refuses Approved while any is proposed. *(2026-09-29)* The
  template's opening comment holds the planning rules (environments, lighter
  option, no symmetry cases, mirroring an existing feature). *(2026-10-08)*
- When a conversation escalates from a quick question into a real
  architecture/feature decision, say so explicitly in the moment.
- When asking Basheer to decide several things, write each as its own question
  with a real example from the app and a recommendation — never a list of short
  labels. *(2026-09-30)*
- Before building on an already-approved plan, check its structural scope is still
  settled; surface interlocking structural questions (table shape, nesting,
  cascading, scoping) together in one round. *(2026-09-20)*
- **Approved plans, step by step** — check in before starting each next step,
  even when the whole plan is approved, and say what that step stops working
  on Dev until the next one lands. If building shows the plan's shape must
  change, stop and ask before writing that code. *(2026-10-06, 2026-10-07)*
- When an adjacent design gap surfaces mid-task, lead with a proposed
  narrowly-scoped fix alongside the problem — don't just describe it. *(2026-09-22)*
- When the same avoidable problem happens a second time, build the structural
  fix then — don't wait to be asked. *(2026-09-15)*

## Parallel sessions
- Before editing any file, run `git status` / `git diff` on it — another session
  may be mid-edit, whatever a plan's file list says. *(2026-08-18)*
- Before committing a shared file (e.g. Progress-Archive), check the staged
  *content* (`git diff --cached`), not just file names, and leave out anything
  another session wrote. *(2026-09-10)* Also check the file's last 3 commits
  for an entry of mine that another session already committed, so it isn't
  filed twice. *(2026-10-05)*
- When an agreement between sessions changes (e.g. commit order), write it the
  same turn where the other session looks — its plan's progress table or its
  handover section. *(2026-10-06)*

## Commit approval
- **Every commit needs its own explicit approval, shown first.** Before running
  `git commit`, show the exact file list and full commit message as their own step
  and wait for a yes to *that*. A "go ahead" to a plan that merely *mentions*
  committing ("…then commit and push") approves the edits only, not the commit.
- Applies to every commit: feature, fix, docs-only follow-ups, checklist commits,
  checkpoint commits. No size exemption. *(2026-09-23)*
- **Batch docs-only commits:** docs-only changes (handover, Backlog,
  Progress-Archive, plan tweaks) accumulate and are committed together at a
  natural pause — end of a task, before a break, or before a session
  restart — not one commit per edit. Feature/fix commits stay separate and
  first; the post-commit checklist may ride in the next docs batch. Each
  batch still needs its own explicit approval. *(2026-10-03)*  
- A bare "yes" to an either/or offer means the plan-first option; otherwise ask.
  If a reply answers only part of a multi-part question, the rest is still
  open. *(2026-09-15, 2026-09-17)*

## Checkpoint commits
- On a long or largely unattended build (new domain, multi-file feature,
  migration + code pair), *propose* a commit at each safe, test-passing milestone
  (e.g. backend compiles and tests pass) — per "Commit approval", never run it
  unasked. Don't wait for the whole feature. *(2026-09-16)*
- A checkpoint commit needn't be feature-complete or trigger the Post-commit
  checklist — say plainly it's partial (e.g. "Part 1, frontend pending") and
  what stops working on Dev until the next step lands. *(2026-10-06)*
- If a routine command (test run, lint) takes far longer than normal, flag it —
  don't silently wait it out.

## E2E testing
- Once a feature or fix is built and before its manual E2E, before writing or
  changing a test plan, and before any E2E step: load the `cabio-e2e-testing`
  skill — it starts with the pre-E2E code review. *(2026-10-08)*

## Show before you act
When an action is hard to undo, spends real time/cost, or is visible to Basheer,
show what's about to happen and wait — don't act first and narrate afterward.
This includes small housekeeping edits (handover note, logs). *(2026-10-08)*
- **Investigative actions, not just writes** — say what a query or check will do,
  even read-only, before running it. UAT: ask and wait, never just announce.
  *(2026-09-18)*
- Before asking Basheer a factual question, search the archive, docs and git;
  ask only what they can't answer. *(2026-09-24)*
- **Verify before claiming:** before stating what a migration, script or
  feature does or risks, read its code — never describe behaviour from its
  name or memory. *(2026-09-26)* When summarising a report for others, draft
  from the finished report itself, never its raw data or logs; if it can't be
  opened, get access first. *(2026-09-27)* During an incident, state only
  what the evidence shows, and label guesses as guesses. *(2026-10-05)*
  Before a doc describes what a screen does today, read that screen's code.
  *(2026-10-06)*
- **Differences from what was approved** — if what's built, or the order of
  steps, differs from what Basheer approved, say so before acting when it's
  known in advance; otherwise in the same report, and offer the choice.
  *(2026-10-06)*
- When work is pending, end with one status line — done and saved / done, not
  saved / not started — instead of repeated commit reminders. *(2026-09-24)*
- **Side topics during a chore** — before switching, say what's left of the
  chore: finish it (commit proposal included), or say plainly it's paused and
  what remains. *(2026-10-08)*
- **Name the screen first:** when explaining a change, finding or E2E step,
  start with the screen (and card/tab) it affects — several screens are
  often in one E2E. *(2026-10-10)*
- State a risk once. If Basheer decides otherwise, do what he asked without
  repeating the warning. *(2026-07-06)*
- When a question can be answered in plain language or by a query, answer in plain
  language first; offer the query as a follow-up. *(2026-09-21)*
- **Expensive jobs** (full-repo review, broad audit) — show scope and expected
  cost/duration, then wait. A single feature's routine `/code-review` is exempt.
  *(2026-09-17)*
- **Republishing anything client-visible** — show the exact diff, not a prose
  summary, before publishing. *(2026-09-17)*
- **A requested retrospective** — show it in chat as its own turn before writing it
  to Progress-Archive and committing. *(2026-09-18)*

## After a push
- After any `git push`, and before any commit touching Traceability, the
  Phase 1 Scorecard or its HTML: load the `cabio-post-commit` skill (2-hour
  checkpoint, post-commit checklist for a finished `feat:`/`fix:`, scorecard
  rules). Scorecard files are generated — never hand-edit them. *(2026-10-08)*
