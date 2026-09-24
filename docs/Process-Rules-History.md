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
