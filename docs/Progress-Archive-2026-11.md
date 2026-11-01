# Progress Archive — November 2026

## 2026-11-01 — Pre-E2E tidy-up of the Planning tabs and Simpler Table builds; back-button and arrow standard (Build, parallel)

**Pre-E2E review closed.** `/code-review` of both builds was run 31 Oct
(8 findings, 2 taken; fix `03ac0ea`). Today: the whole-file MUI-standard
read of `TargetPlanningScreen.tsx`, `ChipTabs.tsx` and the three Target vs
Actuals components. Pass, with three small points, all handled in
`3937558` (pushed): (1) the Target vs Actuals SBU and Quarter/Year
drop-downs had no visible name — now "SBU" and "View"; (2) the one-person
screen's "Back" was a text button — now the round arrow-only button
(Frontend standards §6.6 item 7); (3) Target & Coverage Planning's quarter
and year arrows were typed ◀ ▶ — now chevron icons with labels. Neither
build has been seen in a browser; the E2E (run by `/test` after the merge)
is the first look. Backend tests 1,504 passed, tsc clean.

**Found while committing:** the back arrow was first written with a typed
`fontSize: 20`, which the commit check refuses. Fixed to
`fontSize="small"` (MUI's 20 px) before the commit; §6.6 item 7's
reference wording corrected the same way. Also, the commit-time lint
printed "MUI standard: no staged .ts/.tsx files" while three such files
were staged — the checked-file list looked empty in the worktree. I
verified the three files with the check's report mode instead. Not yet
investigated; for Plan & Chore with the harness message.

**Standards written (Basheer's decisions, 1 Nov).** Frontend standards
§6.6 item 7 (back button) reworded; §6.11 rule 8 (previous/next arrows are
chevron icons in an `IconButton`, never typed ◀ ▶) and rule 9 (which arrow
means what: back = `ArrowBackIcon` round button, previous/next = chevrons,
"this row opens" = `ChevronRightIcon`). The shared `BackButton` component
stays banked, low priority. The grey hex chevron on the Customers,
Pipeline, Product Catalog and Project Directory lists is left to the
"fixed when next changed" rule (Customers and the rest are not in MUI
round 1 except Account Management).

**Rule: order of a build** (Basheer, 31 Oct, written 1 Nov): build, then
pre-E2E review and its fixes, then one docs batch — in `CLAUDE.md` "Batch
docs-only commits", `.claude/skills/build/SKILL.md`,
`.claude/skills/cabio-e2e-testing/SKILL.md`, origin in
`docs/Process-Rules-History.md`.

**Backlog:** new section "Front-end standardisation fixes, by screen" — one
heading per screen with everything it still owes the standards, counts
from the check's report mode (34 files, 863 lines on 1 Nov, before
Customer 360 was excluded); Customer 360 left out, its MUI round 1 is with
another session (its error-view "← Back" is already fixed in the main
folder). Plan & Chore was asked to add ◀ and "← Back" to the commit check.

**E2E plans:** `03ac0ea` and `3937558` added to the "Built:" lines of both;
Tabs plan gains C4 (chevron arrows and their labels); Redesign plan gains
B6 (drop-down names, arrows) and C4 now checks the round Back button.

**Merge:** `main` (3 commits) merged into `worktree-build` as `e7461ea`;
the Progress-Archive-2026-10 clash settled by keeping both entries. Branch
pushed to `3937558`. Merge into `main` only on Basheer's go, after `/test`
finishes the E2E.

**Retro (1 Nov, Build):** corrections from Basheer this session: 1 —
"I am still not clear. Tell me what is the standard back button option you
are proposing…" (my first explanation of the back-button standard was not
plain enough). Counted from his 34 messages in the transcript. Two slips
of mine caught by me before they cost anything: I called six screens
"previous/next" chevron users when only one is (the other five are "row
opens" markers), and I reported lint as clean although the commit check
only reads staged files (it would have refused the typed `fontSize: 20` on
the Back arrow; changed to `fontSize="small"` before the commit). No
tracker line: the staged-files gap and the commit-time "no staged
.ts/.tsx files" printout are already with Plan & Chore in the harness
message. Nothing touched live data, UAT or lost work.
