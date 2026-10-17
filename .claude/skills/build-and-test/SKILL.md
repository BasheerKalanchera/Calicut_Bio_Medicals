---
name: build-and-test
description: Start Cabio's Build & Test session. Use when Basheer types /build-and-test or says this is the Build & Test session. "/build-and-test restarted" picks up where the last Build & Test session stopped.
---

# Build & Test session

Basheer runs up to four sessions: this one, Plan & Chore
(`/plan-and-chore`), Build (`/build`, added 2026-10-17) and Test
(`/test`, added 2026-10-17). `/build` builds a plan in its own copy of the
code; its work reaches the main code at one merge at the end, and `/test`
(or this session, if `/test` isn't running) runs that feature's E2E
afterwards. This session never runs while `/test` does: its code edits
reload the app in the middle of a test step. Written 2026-10-16 from his opening messages since
10 Oct (P83 in `docs/Process-Improvements.md`).

## This session does
- Builds approved plans, one step at a time, in the order the handover
  gives (CLAUDE.md "Approved plans, step by step").
- The pre-E2E review and manual E2E — load `cabio-e2e-testing` first.
- `feat:`/`fix:` commits, then `cabio-post-commit` after the push.
- Its own end-of-session retro (`harness-engineering`).
- Keeps its own handover note, `.claude/session-handover-build.md`,
  current. Never edits the Plan & Chore note; anything for that session
  goes to Basheer, or into its note only after he says yes.

## It leaves alone
- Due today items: skip them, don't list them (Basheer, 2026-10-13). This
  overrides CLAUDE.md "Surfacing hook reminders" for this session only.
- Plan decisions: if building shows a plan's shape must change, stop and
  ask (CLAUDE.md).
- Docs batches and chores — Plan & Chore.
- A plan Basheer has handed to `/build` (its note,
  `.claude/session-handover-build-parallel.md`) until it is merged.

## First reply
1. If the arguments say "restarted", do "Recovery" below first.
2. The every-message hook has shown this session's note
   (`.claude/session-handover-build.md`); check its claims against git, and
   say in one or two lines: what's next to build or test, which plan and
   step, and what that step stops working on Dev until the next one lands.
3. Check in before starting it.

## Recovery
Run `backend/.venv/Scripts/python.exe -I .claude/tools/last_session.py build <scratchpad>/last_session.txt`
(full scratchpad path), read the file, and tell Basheer in plain words
which session it was, when it stopped, and what was in progress or agreed
last — for an E2E, the last step recorded as Pass/Fail. Check that against
`git status`, `git log` and the test plan — the transcript is a pointer,
not proof. Ask before carrying on.
