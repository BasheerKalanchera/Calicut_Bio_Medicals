---
name: process-review
description: Cabio Sales OS end-of-session retro and process review (tracker docs/Process-Improvements.md). Load at the end of every session for the retro, and when the SessionStart hook says the process review is due.
---

# Cabio — end-of-session retro and process review

Origins of each rule: `docs/Process-Rules-History.md` (grep the date tag).
Moved here word for word from CLAUDE.md on 2026-10-08
(`docs/Process-Consolidation-Implementation-Plan.md`).

## Retros and process review
One retro per session, at its end: only what went wrong and what to change.
Before recording anything, read both tables in `docs/Process-Improvements.md`:
- Already on the open list → +1 on its Seen count ("repeated after merge
  <date>" if merged). Never a new P-number. *(2026-10-08)*
- On the watch list → move it to the open list as a new P-number, Seen 2.
- On neither → one line on the watch list (date, what happened). Exception:
  anything touching live data, UAT or lost work goes straight to the open
  list. *(2026-10-10)*
The retro names the items it checked. Full retro text stays in Progress-Archive.
At most 10 open items (the cap starts once the consolidation plan brings the
list to 10). If the open list goes over 10, process work stops until every
open item is fixed, then the list starts fresh; app work continues in the
parallel build session. Basheer lowers the cap step by step. *(2026-10-08)*
At each process review, watch-list lines with no repeat 7 days after their
"Added" date are deleted (git history keeps them). *(2026-10-10)*
Process review when the hook says it's due. *(2026-10-06)*
