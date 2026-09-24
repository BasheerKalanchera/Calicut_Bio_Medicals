# Active Progress — Cabio Sales OS
_Live handover: current task + next step only. Limit 150 lines (the startup
hook warns above that). Finished threads move to Progress-Archive._

## IN PROGRESS — Opportunity split-editing permission (BR-FIN-08)

Rule BR-FIN-08 + plan `docs/Split-Editing-Permission-Implementation-Plan.md`
committed `050a7a7`, approved. **Backend built** (Part 1): service check
`_split_edit_refusal` in `replace_splits` (403), `GET
/opportunities/{id}/splits/can-edit`, BR-FIN-06 error now names the person.
Full backend suite 969 passed. No migration.
**Frontend built, uncommitted on purpose** (commits after E2E):
`OpportunityDetailScreen.tsx` `SplitsTab` hides Edit / + Add unless
`can_edit`, query keyed on status + owner; `services/opportunities.ts`,
`types/api-aliases.ts`, `types/api.ts` (regenerated). `tsc` clean.
`/code-review` (medium) done: 1 Low finding (owner reassignment didn't
re-ask can-edit), fixed. E2E plan
`docs/Split-Editing-Permission-Manual-E2E-Test-Plan.md` (22 steps, A–G)
written; starting splits checked read-only (usg m/c 80/20 Basheer K/Fazal;
New USG m/c 50/50 Basheer K/Vivek).
**Next step:** Basheer runs step 1 as Basheer K (usg m/c → Splits: 80/20,
Edit shown), then step 2. Then commit frontend → post-commit checklist.

## WAITING ON BASHEER — Production handover & support options draft

Internal draft (not customer-facing, deliberately kept out of the repo since
the customer will inherit it). Recommends Option C: in-house developer +
capped Basheer support contract for 6–12 months; 7 gaps to close first;
5 open questions for Basheer.
- Online (editable): https://claude.ai/code/artifact/dda07fb3-ba85-4073-9ad7-caadc579559d
- Offline copy: `C:\Users\Basheer\Downloads\Production-Handover-Support-Options-DRAFT-2026-09-23.html`

**Next step:** Basheer answers the open questions, then write the
customer-facing version.

## Open, not started — pointers only (detail lives elsewhere)

- **main → UAT promotion:** `origin/uat` is 83 commits behind `origin/main`
  (27 feat/fix) as of 2026-09-24; local `uat` branch is stale. Leadership
  hasn't named which features to hold back. Detail: Progress-Archive
  2026-09-18 and 2026-09-21 entries.
- **Lead Management Group G (regression)** — no recorded result in
  `docs/Lead-Management-Manual-E2E-Test-Plan.md`; confirm with Basheer
  whether it was run.
- **UAT data-quality talking points for the team** (missing next-actions
  concentrated on two users; one bulk-import Lead cluster) —
  `docs/UAT-Data-Quality-Findings-2026-09-15.md`.
- **Everything else parked** (WON/LOST immutability BR-OP-09, Activity
  log privacy hole, UAT backup scheduled task + offsite copy, Engagement
  History LLM decision, Pricing/Discount paper) — `docs/Backlog.md`.
