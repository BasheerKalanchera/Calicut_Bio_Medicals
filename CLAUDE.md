# Cabio Sales OS — Project Rules

## Product

- This is a Sales OS, not a CRM — see PRD for the full definition.
- Pipeline model: Target → Coverage → Opportunity → Revenue (see PRD and ADR-013).
- Stage/Status decoupling: Won/Lost are statuses, not pipeline stages — preserve this modeling invariant (see ADR-028).
- Design is formalized in ADRs, business rules, and a documented schema — consult these before any structural change.

## Architecture

- **Stack:** PostgreSQL 16 (Supabase) · FastAPI · React + Vite + Tailwind
- **SBUs:** Imaging, Critical Care (also RLS security boundaries)
- **Zones:** North Kerala, South Kerala, Central Kerala
- **Fiscal year:** Indian FY April–March; period format `YYYY-Qn`
- **Currency:** All financial values in INR Lakhs, `NUMERIC(15,2)`

## Backend Rules

- Never create a repository subclass that adds no methods beyond `BaseRepository`/`ReferenceRepository`. Instantiate the base directly.
- All list endpoints enforce `page_size` `le=100`. Never pass a higher value from the frontend.
- On list queries, apply `noload()` to every `lazy="select"` relationship.
- For count queries, use `select(func.count(Model.id)).where(*filters)` — never wrap the list statement in a subquery.

## Frontend Rules

- Master-data dropdowns needed only in modals (SBUs, zones, etc.) must be fetched inside the modal component with `useEffect([], [])`, not on parent screen mount.
- List screens fire the items request and count request in parallel. Render the list after items resolve; update pagination controls when the count resolves. `ProductCatalogScreen` is the reference implementation.
