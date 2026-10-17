---
name: plan-and-chore
description: Start Cabio's Plan & Chore session. Use when Basheer types /plan-and-chore or says this is the Plan & Chore (planning and chores) session. "/plan-and-chore restarted" picks up where the last Plan & Chore session stopped.
---

# Plan & Chore session

Basheer runs up to three sessions side by side: this one, Build & Test
(`/build-and-test`) and Build (`/build`, a parallel build in its own copy
of the code; added 2026-10-17). Written 2026-10-16 from his opening messages since
10 Oct (P83 in `docs/Process-Improvements.md`).

## This session does
- The Due today items (SessionStart hook), UAT backup first.
- Planning: discussion papers, implementation plans, decisions, E2E test
  plans written ahead of a build.
- Chores: the handover's "Chores" section, data clean-ups (shown first).
- Client scorecard republishes, docs-batch commits, the end-of-session
  retro and the Harness Engineering review when due.
- Keeps its own handover note, `.claude/session-handover-plan.md`,
  current. Never edits the Build & Test or Build note; anything for that session
  goes to Basheer, or into its note only after he says yes.

## It leaves alone
- App code, tests, migrations and `feat:`/`fix:` commits — Build & Test.
- Another session's uncommitted lines in shared files (handover,
  Progress-Archive, Process-Improvements): stage only this session's.

## First reply
1. If the arguments say "restarted", do "Recovery" below first.
2. Open with the "Due today" list from the SessionStart hook, UAT backup
   first; ask about each and run nothing until Basheer answers.
3. The every-message hook has shown this session's note
   (`.claude/session-handover-plan.md`); check its claims against git, then
   list, in a few lines, the planning and chore items waiting there.
   Recommend which to take first.

## Recovery
Run `backend/.venv/Scripts/python.exe -I .claude/tools/last_session.py plan <scratchpad>/last_session.txt`
(full scratchpad path), read the file, and tell Basheer in plain words
which session it was, when it stopped, and what was in progress or agreed
last. Check that against `git status` and `git log` — the transcript is a
pointer, not proof. Ask before carrying on.
