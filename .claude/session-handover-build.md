# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Next-action rules — close several at once (plan D22), then UAT Wed 21 Oct
- Haroon saw the demo 19 Oct and wants the rules on UAT by Wednesday
  21 Oct (Basheer). Full move needed (see Progress-Archive 2026-10,
  entry "2026-10-19 — Next-action rules: demo to Haroon…").
- Gap: two or more of one's own open next actions on an Opportunity
  never come down (closing one needs a follow-up). Basheer chose the
  "middle way" 19 Oct: close several at once with one "what happened"
  and one follow-up, in the close form and Log Activity's warning; the
  "Why this change?" pop-up stays pick-one. Written in BR-ACT-05, plan
  D22, matrix — committed and pushed `85cba34` (19 Oct).
- 20 Oct: Basheer chose nothing ticked, follow-up = ticked ones' text
  (details in plan D22, uncommitted). **Built, uncommitted:**
  `also_close_ids` in `ReminderUpdate` + `ReminderService._others_to_close`
  (9 new test cases; backend 1323 passed, ruff clean); `CloseReminderModal`
  ticks + `closeChoices` prop; `LogActivityModal` per-row Close buttons
  gone. tsc clean, eslint 2 old warnings. Not tried on Dev yet.
- `src/types/api.ts` regenerated (+556/−89, was stale since early Oct;
  archive 20 Oct entry), tsc clean, uncommitted — its own commit after
  the D22 `fix:`. Prevention passed to Plan & Chore's note (Basheer's yes).
- Pre-E2E `/code-review medium` done 20 Oct: 9 findings. Proposed to
  Basheer (not yet answered) — fix 5: (1) keep line breaks where next
  action text shows (`ReminderRow.tsx:104`, `LogActivityModal.tsx:443`,
  close form's top box); (2) Won/Lost empties the follow-up box unless
  typed in (effect ~`CloseReminderModal.tsx:230`); (3) follow-up box
  multi-line only with tick boxes (`:571`); (4) two tests: Won with no
  follow-up, manager closing a rep's several; (5) BR-ACT-05 (`:629`) and
  matrix row (`:73`) still say "not yet built". Leave 4: same-second
  double close (old pattern, Backlog if he wants), "main" pick (no
  effect), produced-Opportunity path (already refused, `service.py:556`),
  50-row cap (UAT max 5). Also Close on the Opportunity page is as agreed
  (BR-ACT-05 names it) — earlier flag withdrawn.
- **Next:** his yes on fixes 1–5; make them; re-run pytest, ruff, tsc,
  lint; add ~4 D22 steps to `docs/Next-Action-Rules-Manual-E2E-Test-Plan.md`
  (503 lines, sections A–G; new section H; read-only Dev check of the
  data first, announced); run on Dev; one `fix:` commit, shown first;
  then `api.ts` commit.
- Then the UAT move plan `docs/UAT-Promotion-2026-10-Plan.md` (model:
  `docs/UAT-Promotion-2026-09-Plan.md`): 245 commits, migrations
  0055–0061; fresh-install check the day before, RLS smoke test on Dev,
  UAT backup (ask first); D8 WhatsApp message for Haroon (not drafted);
  after the move delete `.claude/dq-check-paused` and run the UAT
  data-quality check (ask first).

## Waiting on Basheer
- Republish of both scorecard pages (exact diff shown 19 Oct, not yet
  answered): https://claude.ai/artifact/7qRxCt4BTooYDSzvvg1xPB and
  https://claude.ai/artifact/VcwUvDNArFv22x2Aghvx3Z — could go out with
  the UAT move.

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
- Annual Target Planning: plan being replanned, "do not build" (`107bccc`,
  2026-10-17); this session runs its E2E once it is rebuilt and merged.

## From Plan & Chore (Basheer's yes, 2026-10-20)
- Annual Target Planning approved 2026-10-20; `/build` builds Part 1.
  Its E2E runs on Dev after `/build` merges, never alongside another E2E.
- After the D22 `fix:`, commit the regenerated `api.ts` (own commit).
  Plan & Chore switches its new `api.ts` commit guard on only after both.
