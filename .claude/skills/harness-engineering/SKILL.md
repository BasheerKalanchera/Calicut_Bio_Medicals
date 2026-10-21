---
name: harness-engineering
description: Cabio Sales OS end-of-session retro and weekly Harness Engineering review (was "process review"; tracker docs/Process-Improvements.md). Load at the end of every session for the retro, and when the SessionStart hook says the Harness Engineering review is due.
---

# Cabio — end-of-session retro and weekly Harness Engineering review

Origins of each rule: `docs/Process-Rules-History.md` (grep the date tag).
Moved here from CLAUDE.md on 2026-10-08
(`docs/Harness-Engineering-Implementation-Plan.md`). Renamed from `process-review` 2026-10-15 (Basheer).
Cut down 2026-10-21 (Basheer): counting judgement slips cost his time and
did not bring them down; two trial guards for them failed their tests. The
one measure now is how often Basheer had to correct Claude.

## End-of-session retro (every session, short)
At the session's end, write in Progress-Archive:
- **Corrections from Basheer this session: N** — each time he had to
  correct, re-ask or undo something of mine, a few words each (e.g. "Why
  should we delete the /build's handover note?"). Count from the session's
  messages, not from memory.
- Only if a slip could be stopped by a guard (a tool check), or touched
  live data, UAT or lost work: +1 on its tracker item in
  `docs/Process-Improvements.md`, or a new P-number if none fits.
  Everything else is just a correction in the count; no tracker line,
  no watch-list line. *(2026-10-21)*
Show it in chat first only when Basheer asked for the retro.

## Harness Engineering review (weekly)
Weekly from 2026-10-21 (was every other day; Basheer). Only after Basheer
says yes. Aim: his time on process work comes down to zero.
1. Add up the corrections in the retros since the last review; compare
   with the week before.
2. Name any correction that came back two or more times and could be
   stopped by a guard; Basheer picks build it or leave it. Build at most
   one, shown first.
3. Watch-list lines with no repeat 14 days after "Added" are deleted.
4. Add one line under "Reviews" in the tracker: date, corrections this
   week vs last, what was built. The SessionStart hook (block 2d) reads
   this line's date.
5. Changes go in the next docs batch (own approval).
