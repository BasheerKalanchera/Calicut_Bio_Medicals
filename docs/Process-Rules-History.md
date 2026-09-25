# Process Rules — History

The incident behind each rule in `CLAUDE.md` and the `cabio-db-and-scripting`
skill, moved here verbatim on 2026-09-23 (`docs/CLAUDE-md-Refactor-Plan.md`) so
`CLAUDE.md` stays short. Rules carry a date tag, e.g. *(2026-09-18)*; grep this
file for that date to find the story. Not loaded at session start.

## Session handoff

- **Rule:** **Phase 1 planning/sequencing:** `docs/Phase1-Completion-Sprint-Plan.md` is deprecated as a planning source, as of ~2026-09-12 — it still exists in the repo, bu…
  **Why:** 2026-09-19, a build-order update was offered against the Sprint Plan doc before checking whether it was still the live planning artifact; Basheer had already told me this once before ("remember?") and it had never been written down anywhere authoritative.

- **Rule:** `active_progress.md` hard limit of 150 lines, enforced by a SessionStart hook warning; post-commit checklist step 1 removes the finished thread rather than adding a "DONE" summary.
  **Why:** 2026-09-24 — the prose rule failed twice. First failure: a "~1000 lines" size limit, ignored as the file reached 1,887 lines by 2026-07-27; pruned to 51 on 2026-07-30 (`7d7155d`), and the limit replaced with "current task and next step only". Second failure: that rule held through August (50–110 lines), then from ~2026-09-05 every finished thread was left in place as a dated "DONE" entry, reaching 1,722 lines by 2026-09-23. The file's top entry was a thread marked "Nothing left open". The post-commit checklist's bare "Update `active_progress.md`" step (added 2026-09-16, `1b7a4c5`) invited appending, and the 2026-09-23 CLAUDE.md shortening (`c8eac23`) dropped the "no narrative… doesn't linger as history" wording. Side effect found by an external review: Claude Code truncates large SessionStart output to a ~2 KB preview, so everything below the preview was invisible at startup. Two failed prose rules led to a mechanical guard instead of a third rewording.

- **Rule:** Handover file renamed `active_progress.md` → `session-handover.md`; it holds only the task actively in progress (waiting items → Progress-Archive, unstarted work → Backlog).
  **Why:** 2026-09-24, same review — Basheer: the name "active progress" invites logging progress, which is exactly how the file grew twice. The SessionStart hook also warns if the old filename reappears (a session started before the rename still has the old name in its instructions).

- **Rule:** UAT data-quality check every alternate day, run by Claude under Basheer's supervision; SessionStart hook reminds when due, based on the script's own run log (`C:\Backups\CabioUAT\data_quality_log.txt`).
  **Why:** 2026-09-24 — Basheer wants recurring data-quality monitoring of UAT. He chose supervised runs over running it himself, and chose not to grant a standing UAT exception. A startup check against the real last-run date can't be forgotten; a session-scoped timer would die at each 3–4 hour restart.

- **Rule:** Surfacing hook reminders — when the SessionStart hook reports something due, the session's first reply opens with a "Due today" list, asking whether to run each item.
  **Why:** 2026-09-25 — the hook flagged the UAT backup and doc tidy-up as due, but Basheer saw nothing: SessionStart output reaches only Claude's context, not the terminal. He had assumed the reminders appeared on screen at startup. Claude mentioned them only at the end of a reply about something else, where they read as an afterthought, since no rule said where to put them. Basheer declined a terminal banner (via the hook's `systemMessage`); top-of-first-reply was enough.

## Feature planning

- **Rule:** The moment a task's scope becomes feature-sized, write `docs/<Feature>- Implementation-Plan.md` as the primary planning artifact and present its actual content …
  **Why:** 2026-09-18, a plan was written to the ephemeral plan-mode file and submitted via `ExitPlanMode`; Basheer: "You are deviating from the process. First prepare an implementation plan and show me the plan."

- **Rule:** Say which environment a cross-environment dependency lands in; offer the lighter design alongside the heavy one.
  **Why (both above):** 2026-09-19, Brand-Level Target Planning — the first pass explained a Product Catalog dependency ambiguously about which environment it applied to, costing a clarifying round-trip; separately, a full top-down cascade was the working assumption until Basheer proposed a much simpler bottom-up rollup comparison himself, which should have been offered as an explicit option from the start.

- **Rule:** Check an approved plan's structural scope is still settled; surface interlocking structural questions together.
  **Why (both above):** 2026-09-20, Product Catalog Brand/Category/Model — the existing "Part 1" plan (a computed `name` column) was reviewed and drafted as ready to build before the real question (should Brand/Category/Model become real tables at all, and how do they relate) came up; once it did, the nesting question, the Model↔Category dependency, cascading dropdowns, and SBU-scoping each surfaced one at a time across separate rounds instead of together, and each answer invalidated part of the previous draft.

- **Rule:** When a bigger, adjacent design gap surfaces mid-task (an inconsistency between two related mechanisms, a spec-vs-build mismatch), lead with a proposed narrowly-…
  **Why:** 2026-09-22, a Split-attribution inconsistency between reporting and a report drill-down was described in full, including the underlying ADR conflict, but the actual fix shape (keep the drill strict, leave the report and plain-visibility both alone) was proposed by Basheer himself, not offered up front alongside the finding.

## Commit approval

- **Rule:** Every commit needs its own explicit approval, shown first (file list + message).
  **Why:** 2026-09-23, two commits landed back to back without approval: `fbf631f` (a docs follow-up, committed off a "Go ahead" to a plan ending "then commit and push") and `36385f2` (a Brand-Level Target Planning checkpoint, committed by a parallel session following the Checkpoint commits rule). The rule lived only in memory, not in this file.

## Checkpoint commits

- **Rule:** Propose a checkpoint commit at each safe, test-passing milestone on long builds.
  **Why:** a 2026-09-16 session built Target Planning's backend fully tested over ~3 hours with zero commits, then froze at the end (a hung Docker shutdown). Recovered only by reading the crashed session's own transcript — a less recoverable failure would have lost real verified work for no reason.

## Pre-E2E code review

- **Rule:** Run `/code-review` before manual E2E on a feature, and fix findings first.
  **Why:** a 2026-09-17 review of Target Planning, run right as its manual E2E pass was starting, caught two bugs that would have blocked most of that pass outright — see `docs/Target-Planning-Code-Review-Findings- 2026-09-17.md` for the full findings.

- **Rule:** This applies regardless of how small or pattern-mirroring a change feels — a change that "just adds one more filter matching an existing one" is exactly the siz…
  **Why:** 2026-09-22, after building a small `brand_id` filter mirroring an already-shipped `product_id` one, went straight from "tests pass" to asking whether to verify live, skipping the code-review and written E2E-plan steps entirely. Basheer: "Why are you taking short cuts inspite of detailed instructions in claude.md file?"

- **Rule:** For any feature whose correctness depends on a database trigger, generated column, or other server-side write the ORM doesn't already know how to re-read, add "…
  **Why:** 2026-09-22, three `/code-review` passes on Product Catalog Brand/Category/Model (one of them a full `high`-effort pass) all missed that `ProductRepository.create()`/`update()` never refreshed the row after `trg_product_sync_brand_category_name` populated `brand_id`/ `category_id`/`name` server-side — every real "Add Product" attempt crashed with a 500, only caught by actually clicking Save during manual E2E, not by any of the reviews.

- **Rule:** If the feature has migrations, confirm `alembic current` = head and `Physical-Schema.sql` regenerated before E2E starts. (Companion rules: CLAUDE.md Architecture › Migrations; skill "Every migration — completion checklist".)
  **Why:** 2026-09-23, Brand-Level Target Planning — the backend commit `36385f2` said migration `0053` was "not yet applied"; it was later applied to Dev without any commit or handover note saying so (only implied by `4185135`'s "0054 … Applied to the live Dev DB"), and `docs/Physical-Schema.sql` was never regenerated after either migration, although that step is already in `Backend-Implementation-Standards.md`'s migration workflow. Basheer spotted it during manual E2E; fixed in `4fdd259`. The rule was in place but buried in a long standards doc that nothing makes you reopen when a migration is applied.

## Mirroring an existing feature

- **Rule:** When mirroring a feature, checklist every surface the original touches.
  **Why:** 2026-09-18 — Lead Follow-up Comments initially dropped two things Activity Comments already had (a comment-count badge, full notification-bell coverage per role); both surfaced only once Basheer manually tested with real role switches, one of them being the exact problem the feature was built to solve for that role.

## Manual E2E testing

- **Rule:** Before executing a test case against a specific login, sanity-check that the test plan's assumed role relationship actually matches the record currently being t…
  **Why:** 2026-09-18 — a planned persona (a specific Area Manager) didn't manage the rep who owned the lead actually under test; caught only after switching to the wrong login.

- **Rule:** Record Pass/Fail into the test plan doc itself the moment each step completes, not retroactively from memory at session end.
  **Why:** 2026-09-22, 18 steps of a Product Catalog E2E pass were tracked only in chat; Basheer had to ask directly ("Have you documented the pass ones in the test plan?") before results were actually written into the doc.

- **Rule:** Editing frontend source files while a manual-test browser session is open against the same dev server can trigger a hot-reload that resets in-app state, includi…
  **Why:** 2026-09-22, a mid-session edit to `ProductCatalogScreen.tsx` triggered Vite's hot-reload, which silently logged the browser back to a previous test user (Fazal) and lost the Admin/GM session needed to continue Section D.

- **Rule:** Before running a test plan, tag every individual step Simple or Complex — not by section. **Simple** = a single click/type/verify-a-value action where "pass" is…
  **Why:** 2026-09-23, a single day's browser screenshots ran to roughly 300,000–700,000 tokens per session, dwarfing everything else including `CLAUDE.md` itself — routing the unambiguous steps through Basheer removes most of that cost without losing coverage.

- **Rule:** When writing a test plan, check its assumed data read-only against the live records — existing splits/values and what each picker actually offers — not just role relationships.
  **Why:** 2026-09-24, Split Editing Permission E2E: two steps rested on unchecked assumptions — USG 2 was assumed to have a split (it had none), and step 16 had Fazal hand a deal to Rudrappa, who isn't in Fazal's tier-scoped owner picker. Both cost time mid-test and needed the plan corrected live.

- **Rule:** Steps that save to the shared Dev DB: plan them as "Basheer clicks, Claude watches" from the start, and start request recording in the tab before he acts.
  **Why:** 2026-09-24, the auto-mode classifier blocked Claude's direct saves three times (steps 7, 15, 16), each switched to Basheer mid-step. Step 16 then had to be repeated because Claude's network recording wasn't live when Basheer acted, and Claude wrongly suggested he'd used a different tab.

## Troubleshooting & scripting

- **Rule:** When something fails repeatedly for an unclear reason, isolate the variable with a small/fast diagnostic before retrying the same large/slow operation again — d…
  **Why:** 2026-09-20, a ~300MB Docker image download was retried three times before testing whether *any* large download worked on the connection at all; a small test file would have found the real cause (connection instability, not the image or Docker) in one step.

- **Rule:** When writing a new PowerShell script that captures a native command's output via `2>&1` into a variable, account up front for the interpreter aborting immediate…
  **Why:** 2026-09-20, `restore_uat.ps1` hit this exact gotcha during testing (a successful restore looked like a crash) — a known PowerShell 5.1 quirk that should be applied proactively when writing new scripts, not discovered via a failed test run.

- **Rule:** Before asserting a capability is missing (a library, a tool), check what's actually available — including tools/skills separate from the project's own runtime e…
  **Why:** 2026-09-20, claimed the backend Python environment's missing `openpyxl` meant a corrected Product Catalog `.xlsx` couldn't be read, when the spreadsheet skill (already used two days earlier for the same file) could read it directly — caught only after Basheer pointed out the discrepancy ("You already used python library couple days back. Now what changed").

- **Rule:** When a local git branch is found behind its remote counterpart, pull the actual commit list and authorship for the gap immediately, not just the commit count — …
  **Why:** 2026-09-21, explaining why local `uat` was behind `origin/uat` took three rounds ("still not clear why") because the answer led with how `git push`/local branches work in general before surfacing the actual cause (an emergency hotfix pushed straight to `origin/uat`) — that detail was sitting in `git log` the whole time and should have been pulled up front.

- **Rule:** Before writing any migration that deletes, retires, or bulk-updates rows, query `pg_constraint` for the authoritative list of every table with a foreign key int…
  **Why:** 2026-09-21, migration 0049's first run failed on a `marketing_lead.product_id` FK that a manual reference check (opportunity_item/installed_asset/document only) had missed — caught safely by the migration's own transaction rollback, but the authoritative `pg_constraint` lookup that actually found the gap only happened after the failure, not before.

- **Rule:** Before investing real time analyzing one environment's exported data for a migration or data-cutover task, do a cheap check that the *target* environment (where…
  **Why:** 2026-09-21, a full session's Product Catalog reconciliation was built entirely against a UAT export before discovering Dev's `product` table was a completely different, smaller set of rows — caught only by accident (fetching SBU ids for seeding), not from a deliberate check done up front.

- **Rule:** Session-generated throwaway scripts (a one-off data-matching or migration-generator script) go in the session scratchpad directory, never a path inside the repo…
  **Why:** 2026-09-21, a migration- data generator script was written to `.claude/scratch/` inside this repo and had to be cleaned up before committing.

- **Rule:** When a question could be answered either with a plain-language explanation or a verification query, give the plain-language answer first — reach for the query a…
  **Why:** 2026-09-21, asked whether there were "34 old rows" left behind, the first instinct was to run another SQL query immediately; Basheer had to stop that tool call himself before getting a plain-language-framed answer.

- **Rule:** Before running any raw SQL check directly against this app's RLS-protected tables (not through the API), set and verify **all three** session settings together …
  **Why:** 2026-09-22, hit this exact trap three separate times in one session: a wrong "these products have zero references" claim stated as fact (all three unset), a still-wrong recount after fixing only one setting, and a third undercounted result (missing the SBU one specifically, required for Area Manager/SBU Manager tiers) while investigating an unrelated question. See the `cabio-uat-rls-silent-zero-rows` memory for the full mechanism.

- **Rule:** Never cut off a query's or check script's output; save it in full to a scratchpad file, then read from the file.
  **Why:** 2026-09-24, the first UAT data-quality run was piped through `head -300`; section 7c (double-submits) fell past line 300 and was discarded, forcing a second approved UAT connection to recover it.

## Show before you act

- **Rule:** **Investigative actions, not just writes** — state what a query or check will do, including a plain read-only one, before running it. UAT goes further: ask and …
  **Why:** 2026-09-18, a live Dev DB query ran with no explanation first — "what are you doing?"

- **Rule:** **Token-intensive or expensive jobs** (a full-repo code-review pass, a broad audit) — show scope, what it checks, and expected cost/duration, then wait for go-a…
  **Why:** 2026-09-17, a 45-migration RLS audit started immediately on "let's do that," before scope or cost had been shown.

- **Rule:** **Republishing anything client-visible** (a scorecard Artifact, a shared doc) — show the exact diff, not a prose summary, before publishing.
  **Why:** 2026-09-17, a prose description of a scorecard change prompted "what are the changes?"; a real diff let the next update get approved on sight.

- **Rule:** **A requested retrospective or reflective summary** — show it in chat, as its own turn, before writing it into Progress-Archive and committing. Pasting it in th…
  **Why:** 2026-09-18, a retrospective was pasted and committed/pushed in the same response — "Where is the retrospective? I have not seen it."

## Post-commit checklist

- **Rule:** **The feature/fix commit always lands first, as its own commit; this checklist runs after, as a separate commit** — never interleaved with or run before the fea…
  **Why:** 2026-09-18, Scorecard/Traceability regeneration started before the feature commit existed — "Shouldn't we first commit and then run the post-commit checklist?"

## Moved from Claude memory (2026-09-24)

These rules lived in Claude's private memory until 2026-09-24, when Basheer
moved working rules into CLAUDE.md so they are visible, in git, and checked.
The backstory below is copied verbatim from each memory note's **Why:**.

- **Rule:** Session handoff — check git before writing or trusting a commit-status claim in the handover.
  **Why:** On 2026-09-01, `active_progress.md` said BR-ACC-03 was "staged, awaiting Basheer's commit" — but it had actually been committed the previous day (`e86d49a`, 2026-08-31). The doc was authored in-session before the commit happened and never updated after, then got fed back as current fact at the next session's startup. Basheer flagged this directly: relying on unreviewed handover docs isn't working.

- **Rule:** Session handoff — Basheer restarts sessions every 3–4 hours; keep the handover current at every pause.
  **Why:** his own stated preference, not tied to a specific incident.

- **Rule:** Parallel sessions — `git status`/`git diff` a file before editing it.
  **Why:** Basheer told me a second session was migrating `ProjectDirectoryScreen.jsx` "and related screens." I planned Referral Credit's frontend work and judged `QuickLeadModal.tsx`, `Customer360Screen.tsx`, `OpportunityDetailScreen.tsx` as "zero file overlap" based on the plan doc's file list alone, without checking whether the other session was also live-editing those exact files. It was — the other session's manual-verification pass on the ProjectDirectory migration found and fixed real bugs in `QuickLeadModal.tsx` and `Customer360Screen.tsx` (a query-key collision, an SBU-filtering gap) concurrently with my referral-credit edits landing in the same two files. Both sessions' edits ended up interleaved line-by-line in the same live working-tree files (no worktree isolation — same filesystem, same repo). The other session had to do a careful zero-context-diff git-apply --cached split to separate the two sessions' work without losing either side — real rework that a five-second `git diff` on my end, before editing, would have avoided or at least flagged for a check-in first.

- **Rule:** Parallel sessions — check staged content of shared files before committing.
  **Why:** Working the Activity-comment-notification fix ([[cabio_feedback_check_before_touching_wip_files]]-adjacent but a different mechanism — I never edited the other content, just staged over it), `docs/Progress-Archive-2026-09.md` had picked up a second, unrelated section (`## 2026-09-10 (later still) — Activity log privacy hole...`) appended by another session after I'd written my own entry. I staged the whole file with a plain `git add`, which pulled that unrelated section into my staged diff too. Basheer explicitly asked "did you stage only the right files" and I had to catch it after the fact: split the file by temporarily removing the other session's section from the working copy, `git add`ing the now-clean file (staging just my content), then restoring the other section back to the working tree so it stayed available, unstaged, for whoever owns it to commit separately.

- **Rule:** Commit approval — a bare "yes" to an either/or offer means the plan-first option.
  **Why:** Basheer's global CLAUDE.md rule requires explaining planned changes and waiting for explicit approval before any edit. On 2026-09-15 I read a bare "Yes. Go ahead." as approval to build directly (the second option I'd offered), started implementing (`reporting` domain: schemas, repository, tests, frontend types/dropdown for a Forecast-by-Product breakdown) before writing anything down, and was interrupted mid-build — "Sorry I asked you to go ahead with preparing the implementation plan." The work itself was fine (kept, tested, no conflict with other in-flight work — see [[cabio_feedback_check_before_touching_wip_files]]), but the sequencing skipped the approval step the global rule exists to protect.

- **Rule:** Commit approval — a reply answering only part of a multi-part question leaves the rest open.
  **Why:** 2026-09-17 -- after Basheer relayed that Latheef Bhai confirmed the Lead Follow-up Comments idea, I proposed two things in one message: (1) update three docs to record the confirmation + regenerate/republish the scorecard, and (2) a recommendation on what to build next, ending with "Go ahead with the doc updates, and on that recommendation?" Basheer's reply addressed only the recommendation ("prepare an implementation plan first instead"). I treated the doc-update half as approved by default and executed it -- three file edits plus regenerating and republishing both client-facing scorecard Artifacts -- without a fresh explicit yes. Basheer's response: "Why did you update the scorecards?" followed by "Atleast check before you make such changes." This is a sibling failure to [[cabio_feedback_ambiguous_go_ahead]] (a bare "go ahead" resolved toward the aggressive branch) but distinct: here the reply wasn't ambiguous at all on the part it addressed -- the problem was assuming silence on the *other* part meant yes.

- **Rule:** Show before you act — state a risk once; don't repeat it after Basheer decides.
  **Why:** During the `ErrorBoundary.jsx` -> `.tsx` migration (2026-07-06), I kept re-adding the `check-no-tailwind.js` GRANDFATHERED-path caveat to the plain-rename commit message after he'd already rejected bundling it in once. He called this out twice ("why are you wasting time", "you are wasting my time now").

- **Rule:** Feature planning — no design cases just for symmetry.
  **Why:** During the Audit Trail plan (`docs/Audit-Trail-Implementation-Plan.md`, 2026-08-31), the first draft logged a full-row snapshot on every INSERT "for a complete history," alongside UPDATE and DELETE. Basheer pushed back twice in the same session — first on logging the *whole row* for updates (only the changed fields were actually needed), then on logging *creation at all* (the master row's `created_by`/`created_at` plus the first edit's `old_data` already recover everything a creation snapshot would add). Both were real, load-bearing simplifications, not just "keep it short" — dropping them removed genuine redundancy with zero information loss, once actually reasoned through.

- **Rule:** Feature planning — second occurrence of an avoidable problem → build the structural fix.
  **Why:** 2026-09-15 — `pg_dump --schema-only > docs/Physical-Schema.sql` destroys the file's hand-maintained header every single run (no pg_dump flag preserves a preamble; this is structural, not incidental). It had already bitten once (documented in an earlier progress-archive entry), and I ran the identical raw command again this session, requiring a second manual header restore, before Basheer had to explicitly ask why it keeps happening and what to fix. He was direct about the cost: "We are wasting unnecessary time with such admin things which should be done from get go without me having to point this out."

- **Rule:** Pre-E2E — run pytest/ruff/tsc/lint and report plainly first.
  **Why:** 2026-07-03, Basheer: "I will do the manual testing. You do rest of the testing and give me go ahead." Refined 2026-09-23 to cut screenshot cost while keeping Claude on the steps that need precise browser work.

- **Rule:** Pre-E2E — `/ultrareview` only for higher-risk changes.
  **Why:** 2026-09-15 — asked what the `PostToolUse:Bash` hook's ultrareview tip meant, then why it was needed for that particular commit. The feature being committed (Sales Report + Pipeline Report) already had 837/837 backend tests passing, `tsc` clean, and a full live manual E2E pass with numbers cross-checked against the database — the marginal value of an extra automated review pass was low, and it costs one of a limited number of free reviews.

- **Rule:** Architecture — keep the full per-file MUI migration ritual.
  **Why:** Basheer said so directly after `OpportunityDetailScreen.tsx`'s migration (2026-07-05): "this whole exercise was very good and we were able to catch a few bugs and inconsistencies in the codebase as a result... I am forced to do a lot more detailed testing of the features. Which otherwise I wouldn't have done." The ritual surfaced multiple real, pre-existing bugs that a faster "just convert the styling" pass would have missed entirely: stakeholder linking silently broken since its original build (calling backend routes that never existed), a floating-label/validation inconsistency repeated across two files, a missing stakeholder-edit capability that had never existed, BR-FIN-03 (dual-mode valuation) never actually implemented anywhere despite being documented, and a stale-cache bug where saved changes appeared to vanish after navigating away and back. None of these were migration regressions — the migration's discipline (full comparison tables, not summaries; verifying each tracker checkmark's claim instead of trusting it) is what surfaced them.

