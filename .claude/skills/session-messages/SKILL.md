---
name: session-messages
description: Cabio's messages between sessions (Plan & Chore, Build & Test, Build). Load before sending another session anything — work that belongs to it, a question only it can answer, an agreement that changes its plan — and when the mailbox hook shows this session a message.
---

# Messages between sessions

Replaces "Paste this into …" (Harness review item 4, Basheer 2026-11-27). A
copy-and-paste gap gave the 23 Nov double E2E plan.

Mailboxes: `<main folder>/.claude/inbox/to-plan-and-chore.md`,
`to-build-and-test.md`, `to-build.md` — git-ignored; `/build`'s worktree
uses the main folder's. The `inbox.py` hook shows a session its own mailbox
on each of Basheer's messages while it holds anything.

## Sending
- Only work that belongs to the other session, a question only it can
  answer, or an agreement that changes its plan or order.
- Show it in the reply first, headed "Message for <session>", and write it
  only on Basheer's yes. Never write one unasked.
- Say: what to do and when ("after your current work"); which files or note
  sections to read; what not to do (e.g. no UAT connection without his yes);
  what is still his to decide. Point to files; no client names in it.
- Append to the mailbox as `## From <session> — <d Mon yyyy HH:MM>` and the
  text. Never edit or clear another session's message.

## Receiving
- Open the reply with each message (sender, time, text), then ask Basheer
  whether to take it up now or after the current work.
- Once he has answered: one Progress-Archive line per message (what it
  asked, his answer), the work into this session's handover note, then empty
  the mailbox file. Until then the hook keeps showing it.
- A reply to the sender is a new message, shown to Basheer first.
