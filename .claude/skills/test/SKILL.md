---
name: test
description: Start Cabio's Test session — runs manual E2E test runs on Dev, nothing else, alongside the parallel Build session (/build). Use when Basheer types /test or says this is the Test session. "/test restarted" picks up where the last Test session stopped. Not /build-and-test.
---

# Test session

Basheer runs up to four sessions: Plan & Chore (`/plan-and-chore`),
Build & Test (`/build-and-test`), Build (`/build`, a parallel build in its
own copy of the code) and this one. This session only tests, so it can run
on Dev while `/build` builds. Written 2026-10-17 (Basheer; decisions in
the 2026-10-17 Progress-Archive entry "Test session (`/test`) set up").

## When it runs
- Alongside `/build` and Plan & Chore. **Never at the same time as Build &
  Test**: that session edits code in the main folder, and every edit
  reloads the app on Dev in the middle of a test step.
- Build & Test stays for days with no parallel build.

## This session does
- The pre-E2E review and the manual E2E — load `cabio-e2e-testing` first.
  Writing and correcting test plans as part of that.
- Small fixes found in a test run (CLAUDE.md "Batch small code fixes"):
  wording, labels, messages, comments, a few lines, with no change to what
  is saved or how the app behaves. They build up and go in one `fix:`
  commit at the end of that feature's E2E, after the full tests, type check
  and lint, shown first (Basheer, 2026-10-17).
- Test-plan results and its own handover note, committed in its docs
  batches (shown first). Stage only this session's lines in shared files.
- `cabio-post-commit` after a push.
- Its own end-of-session retro (`harness-engineering`).
- Keeps its own handover note, `.claude/session-handover-test.md`,
  current. Never edits the other three notes; anything for those sessions
  goes to Basheer.

## It leaves alone
- Building: any feature step, and any fix that changes behaviour or data.
  Those go to `/build`, or to Build & Test when no parallel build runs
  (Basheer, 2026-10-17). Say what was found and stop that test step.
- Migrations.
- Due today items: skip them, don't list them (as Build & Test; overrides
  CLAUDE.md "Surfacing hook reminders" for this session only).
- Plan decisions: if a test shows a plan's shape must change, stop and ask
  (CLAUDE.md).

## First reply
1. If the arguments say "restarted", do "Recovery" below first.
2. The every-message hook has shown this session's note
   (`.claude/session-handover-test.md`); check its claims against git and
   the test plan, and say in one or two lines which test run and step is
   next, and what Basheer needs ready (servers, sign-ins).
3. Check that Build & Test is not running a build (ask Basheer if unsure).
4. Check in before starting it.

## Recovery
Run `backend/.venv/Scripts/python.exe -I .claude/tools/last_session.py test <scratchpad>/last_session.txt`
(full scratchpad path), read the file, and tell Basheer in plain words
when that session stopped and what was in progress or agreed last — the
last step recorded as Pass/Fail. Check that against `git status`,
`git log` and the test plan — the transcript is a pointer, not proof. Ask
before carrying on.
