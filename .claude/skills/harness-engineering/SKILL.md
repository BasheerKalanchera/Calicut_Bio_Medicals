---
name: harness-engineering
description: Cabio Sales OS end-of-session retro and Harness Engineering review (was "process review"; tracker docs/Process-Improvements.md). Load at the end of every session for the retro, and when the SessionStart hook says the Harness Engineering review is due.
---

# Cabio — end-of-session retro and Harness Engineering review

Origins of each rule: `docs/Process-Rules-History.md` (grep the date tag).
Moved here word for word from CLAUDE.md on 2026-10-08
(`docs/Harness-Engineering-Implementation-Plan.md`). Renamed from `process-review` 2026-10-15 (Basheer).

## Retros and Harness Engineering review
One retro per session, at its end: only what went wrong and what to change.
Before recording anything, read both tables in `docs/Process-Improvements.md`:
- Already on the open list → +1 on its Seen count ("repeated after merge
  <date>" if merged). Never a new P-number. *(2026-10-08)*
- On the watch list → move it to the open list as a new P-number, Seen 2.
- On neither → one line on the watch list (date, what happened). Exception:
  anything touching live data, UAT or lost work goes straight to the open
  list. *(2026-10-10)*
The retro names the items it checked.
Spot-check 3 figures, names or examples from this session's replies or
saved docs against their source, and name them in the retro. A wrong or
unsourced one is a P1 repeat (+1). *(2026-10-14)*
Also check 2 of this session's explanations to Basheer: does the plain part
stand on its own, without the technical part? A failure is a P3 repeat
(+1). *(2026-10-14)* Full retro text stays in Progress-Archive.
At most 10 open items (the cap starts once the consolidation plan brings the
list to 10). If the open list goes over 10, process work stops until every
open item is fixed, then the list starts fresh; app work continues in the
parallel build session. Basheer lowers the cap step by step. *(2026-10-08)*
At each Harness Engineering review, watch-list lines with no repeat 14 days after their
"Added" date are deleted (git history keeps them); kept that long so a
later repeat is still recognised. *(2026-10-10, 2026-10-17)*
Harness Engineering review when the hook says it's due. *(2026-10-06)*

## Harness Engineering review (every other day)
Every other day until mistakes fall; Basheer sets the frequency step by
step (weekly until 2026-10-08, decided daily then, every other day from
2026-10-16). *(2026-10-08, 2026-10-15)* Only after Basheer
says yes. Keep it short: the aim is that his daily time on process work
comes down to zero.
1. Read the retros since the last review (Progress-Archive) and both
   tables in `docs/Process-Improvements.md`.
2. Show only the items whose Seen count went up since the last review,
   with old → new count.
3. For each one already covered by a written rule, Basheer picks:
   **enforce with a tool**, or **accept as is**.
4. Build at most 3 items, each shown first with its own approval. An open
   item skipped for 7 days is dropped or parked with a date — Basheer
   picks which. *(2026-10-15)*
5. Delete watch-list lines with no repeat 14 days after their "Added" date.
6. Count the open items (with a tool) and say the number.
7. Say whether repeats went down since the last review, so Basheer can
   decide whether to review less often.
8. Add one line under "Reviews" in the tracker: date, open count before →
   after (counted), what was built or dropped. The SessionStart hook
   (block 2d) reads this line's date.
9. Changes go in the next docs batch (own approval).
