---
name: build
description: Start Cabio's parallel Build session — builds an approved plan in its own copy of the code (a git worktree) while Build & Test runs an E2E on Dev. Use when Basheer types /build or says this is the parallel Build session. "/build restarted" picks up where the last Build session stopped. Not /build-and-test.
---

# Build session (parallel)

Basheer runs up to four sessions: Plan & Chore (`/plan-and-chore`),
Build & Test (`/build-and-test`), Test (`/test`, added 2026-10-17) and
this one. This session builds a plan while `/test` or Build & Test is
testing on Dev, without disturbing that testing.
Written 2026-10-17 (Basheer; decisions in the 2026-10-17 Progress-Archive
entry "Parallel Build session").

## Why its own copy of the code
The app on Dev runs from the main folder and reloads whenever a file there
changes (`uvicorn --reload`, Vite). So this session never edits code in the
main folder. It works in a git worktree, `.claude/worktrees/build`, on its
own branch, and the main code only gets its work at **one merge, at the end
of the build**, after Build & Test's E2E is done and Basheer says go
(Basheer, 2026-10-17).

## This session does
- Builds the approved plan named in its handover note, one step at a time
  (CLAUDE.md "Approved plans, step by step"), in the worktree.
- Automated tests, type check and lint in the worktree; checkpoint commits
  on its branch, each shown first (CLAUDE.md "Commit approval"); pushes the
  branch.
- Writes and tests a migration in the worktree, but **applies it to Dev
  only after the merge**. It records the migration number it last chose
  in its handover note (Basheer, 2026-10-17).
- **All its docs stay on the branch** until the merge, edited in the
  worktree copy (Basheer, 2026-10-17): its handover note, the plan's
  Status line and progress, Backlog, Progress-Archive, Process-Improvements,
  and the feature docs (Business-Rules, ADR, Traceability, user manual,
  in-app help). Its docs batches are commits on the branch, each shown
  first. Claude Code blocks a worktree session from editing files outside
  the worktree, and the other sessions don't need its progress before the
  merge.
- The merge, when Basheer says go: bring `main` into the branch, settle
  any text clashes in shared docs (Backlog, Progress-Archive,
  Process-Improvements — keep both sides' lines), re-run the tests and push
  the branch. Then step out to the main folder (`ExitWorktree` with
  `action: "keep"` — never "remove"), merge into `main` and push, apply
  any migration (CLAUDE.md "Migrations"), then `cabio-post-commit`.
- Its own end-of-session retro (`harness-engineering`), on the branch.
- Keeps its own handover note, `.claude/session-handover-build-parallel.md`
  in the worktree, current; the hooks show it from there. Never edits the
  other two notes; anything for those sessions goes to Basheer.

## It leaves alone
- Code, config and migrations in the main folder; starting, stopping or
  restarting the servers; any write to the Dev database before the merge
  (a read-only Dev check a plan asks for is fine, announced first, with
  `cabio-db-and-scripting` loaded); UAT, as everywhere (CLAUDE.md).
- The browser and every E2E. The feature's E2E is run by `/test` (or
  Build & Test if `/test` isn't running) after the merge (Basheer,
  2026-10-17). No second running copy of
  the app for now; revisit when the build reaches its first screen
  (Basheer, 2026-10-17).
- `npm run generate:types`: it reads the main folder's running server,
  which doesn't have this branch's routes. Edit the types by hand.
- Due today items: skip them, don't list them (as Build & Test; overrides
  CLAUDE.md "Surfacing hook reminders" for this session only).
- Plan decisions: if building shows a plan's shape must change, stop and
  ask (CLAUDE.md).

## First reply
1. If the arguments say "restarted", do "Recovery" below first.
2. Move into the worktree: `EnterWorktree` with
   `path: .claude/worktrees/build` if `git worktree list` shows it,
   otherwise with `name: build` (branches from `origin/main`). Say which
   folder and branch you are on. If `main` has commits the branch
   doesn't, bring them in (`git merge main`) so the copy has the latest
   skills and hooks; say so first.
3. First use only: `npm install` in `sales-os-app/` of the worktree (a few
   minutes; say so before running it).
4. The every-message hook has shown this session's note (the worktree
   copy once it exists); check its claims
   against git (branch and `main`), and say in one or two lines what's
   next to build, which plan and step.
5. Check in before starting it.

## Running tests in the worktree
- Backend: the main folder's interpreter,
  `<main folder>/backend/.venv/Scripts/python.exe -m pytest`, run from the
  worktree's `backend/`. The worktree has no `backend/.env`; tests use
  `backend/tests/conftest.py`'s local-database defaults, never Dev.
- Frontend: `npx tsc --noEmit` and `npm run lint` in the worktree's
  `sales-os-app/`.

## Recovery
Run `backend/.venv/Scripts/python.exe -I -X utf8 .claude/tools/last_session.py parallel <scratchpad>/last_session.txt`
(main folder; full scratchpad path), read the file, and tell Basheer in
plain words when that session stopped and what was in progress or agreed
last. Check that against the branch's `git log`, `git status` in the
worktree, and the plan — the transcript is a pointer, not proof. Ask before
carrying on.
