# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Next-action rules — close several at once (plan D22): E2E section H
- Built and committed as a checkpoint: `60410cd` (fix: D22, with pre-E2E
  review fixes 1–5, BR-ACT-05 + matrix status, E2E plan section H) and
  `c9d8d2b` (api.ts regenerated) — both pushed 20 Oct. Backend 1325
  passed, ruff, tsc clean, eslint old warnings only.
- Review findings left as they are (Basheer's yes 20 Oct): same-second
  double close (old pattern, Backlog if he wants), "main" pick (no
  effect), produced-Opportunity path (already refused, `service.py:556`),
  50-row cap (UAT max 5).
- **E2E section H done 21 Oct:** H0–H4 all Pass, recorded in
  `docs/Next-Action-Rules-Manual-E2E-Test-Plan.md`; no fixes, so no
  `fix:` commit. Findings in Progress-Archive-2026-10 (H2 first try lost
  to a page reload; the error message that stays on screen is how every
  form works, not a bug). Committed and pushed `abee672`.
- **Next:** post-commit checklist for D22 (`cabio-post-commit`), then
  the UAT move plan below. Check in first.
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

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
- Annual Target Planning Part 1: `/build` builds it; this session (or
  `/test`) runs its E2E on Dev after the merge, never alongside another.
