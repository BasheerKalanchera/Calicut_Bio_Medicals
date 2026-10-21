# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## D22 post-commit checklist (21 Oct, in progress)
- Done: handover trimmed, archive line, Traceability unchanged (row 19
  stays "being rolled out" until UAT), no Backlog entry for D22,
  `generate_scorecard.py --check` OK (34 Done, 11 Partial, 5 Not started).
- Proposed to Basheer, not yet written: D22 hashes (`60410cd`, `c9d8d2b`)
  and the section H pass in the Next-action rules plan's Status line and
  its E2E plan's "Built" line. Edits go in the next docs batch (Basheer).
- Retro addendum for the next docs batch: after the D22 push, the
  checklist was left out of the docs batch without saying so; Basheer
  asked why. P80 4 → 5.
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Next: Annual Target Planning Part 1, built here
- Basheer 21 Oct: this session takes Part 1 over from `/build` after the
  D22 checklist. `/build` has no code for it (worktree `f48f8ff` = docs
  only). Built in the main folder, so 0062 is applied to Dev at step 1
  as the plan says (no merge wait). Proposed: `/build` commits its
  unsaved note edit and exits; Plan & Chore merges `worktree-build`
  (docs only) into main and removes the worktree/branch, asking first.
- Step 1 check-in shown 21 Oct: read-only Dev count of brand and SBU
  quarterly targets (SBU Manager count already done 21 Oct, plan D57).

## UAT move
- Basheer 20 Oct: "move everything together" — no Wednesday 21 Oct
  move; the one full move waits for the User Manual and Annual Target
  Part 1 (D52). Haroon needs telling the new date (not drafted).
- Then the UAT move plan `docs/UAT-Promotion-2026-10-Plan.md` (model:
  `docs/UAT-Promotion-2026-09-Plan.md`): include D22, Part 1, migration
  0062; fresh-install check the day before, RLS smoke test on Dev, UAT
  backup (ask first); WhatsApp message for Haroon (not drafted); after
  the move delete `.claude/dq-check-paused` and run the UAT data-quality
  check (ask first).

## Waiting on Basheer
- Republish of both scorecard pages (exact diff shown 19 Oct, not yet
  answered): https://claude.ai/artifact/7qRxCt4BTooYDSzvvg1xPB and
  https://claude.ai/artifact/VcwUvDNArFv22x2Aghvx3Z — could go out with
  the UAT move.

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
