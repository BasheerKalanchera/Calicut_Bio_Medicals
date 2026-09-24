# Session Handover — Cabio Sales OS
_Only the task actively in progress and its immediate next step. Limit 150
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog._

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
After that commit: fix the 6 stale `active_progress.md` pointers in frontend
code comments (sorted mention list pending Basheer's review).
