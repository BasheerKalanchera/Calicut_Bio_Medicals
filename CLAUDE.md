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
- **Backlog:** deferred/parked ideas and undecided product questions live in
  `docs/Backlog.md`, not active_progress.md.
- **Standing decisions:** anything durable (a business rule, an architecture call, an
  API shape, a convention) gets written directly into whichever authoritative doc
  governs that domain (see "Authoritative References" above) — never parked in a
  progress file, even temporarily.
- Update active_progress.md as work advances, not only at session end.
