# CLAUDE.md — Bloat Analysis

> **Superseded by `docs/CLAUDE-md-Refactor-Plan.md` (2026-09-23)** — only the
> Troubleshooting & scripting extraction was adopted.

**File:** `CLAUDE.md` · 332 lines · **21,880 bytes** (~5,500 tokens)  
Loaded into **every Claude Code session**, regardless of what you're doing.

> For comparison, `GEMINI.md` is 7,401 bytes (~1,850 tokens).  
> `CLAUDE.md` is **3× larger** and loaded in addition to it.

---

## Overall Verdict

`CLAUDE.md` is **not bloated in the traditional sense** — it's not padded.  
Every line here was written for a real reason (usually a past mistake).  

But it has a **structural problem**: it mixes two very different types of content:

| Type | Should load | How much |
|---|---|---|
| **Behavioral constraints** — always needed | Every session | ~40% of file |
| **Process workflows** — only needed for specific tasks | On-demand | ~60% of file |

The 60% is what can move to skills.

---

## Section-by-Section Classification

### ✅ KEEP — Always-loaded behavioral rules

These are **active guardrails** Claude must apply to every interaction.
Removing them risks repeating past mistakes.

| Section | Lines | Tokens (approx) | Why keep |
|---|---|---|---|
| Product | 3–6 | ~60 | Core identity — shapes every answer |
| Architecture | 8–21 | ~280 | Stack, safety rules — critical every session |
| Authoritative References | 23–36 | ~220 | "Read this before changing X" — applies always |
| Session handoff | 38–80 | ~600 | active_progress.md rules — applies every session |
| Checkpoint commits | 126–143 | ~260 | Safety habit — applies every build session |
| Show before you act | 252–277 | ~410 | Core behavioral constraint — applies always |
| Post-commit checklist | 279–307 | ~430 | Applies after every feat/fix commit |
| Scorecard integrity | 309–332 | ~360 | Applies whenever Traceability.md is touched |

**Estimated always-load total: ~2,620 tokens** (after extraction)

---

### 🔵 MOVE TO SKILL — On-demand process workflows

These sections are only relevant **when doing a specific type of work**.
Loading them in every session wastes tokens for nothing.

#### 1. `feature-planning` skill
**Extracted from:** Feature Planning (lines 82–124) — ~560 tokens  
**Trigger:** When starting a new feature, escalating scope, or writing an implementation plan  
**Contents:**
- Implementation plan must be a `docs/<Feature>-Implementation-Plan.md`
- Don't use CLI's built-in plan-mode file as the review step
- Surface heavy vs light design variants up front
- Check structural questions aren't still open before drafting mechanisms

#### 2. `pre-e2e-code-review` skill
**Extracted from:** Pre-E2E code review (lines 145–154) + Mirroring an existing feature (lines 156–169) — ~280 tokens  
**Trigger:** When about to start E2E testing on a completed feature  
**Contents:**
- Run `/code-review` at medium effort (high for RLS/migration/approval-workflow features) before E2E
- When mirroring an existing feature, checklist every surface the original touches
- Don't drop notification/badge coverage assuming "it's not in the plan"

#### 3. `hybrid-e2e-test-plan` skill *(we already designed this)*
**Extracted from:** Manual E2E testing (lines 171–181) — ~180 tokens  
**Trigger:** When preparing or executing a test plan  
**Contents:**
- Role-check test personas against actual record ownership before switching logins
- Prefer `find`-returned element refs over screenshot coordinates in browser automation

#### 4. `troubleshooting-and-scripting` skill
**Extracted from:** Troubleshooting & scripting (lines 183–250) — ~900 tokens  
**Trigger:** When something is failing, debugging, or writing scripts/migrations  
**Contents:**
- Isolate variables with small diagnostic before retrying large operations
- PowerShell `$ErrorActionPreference` + `2>&1` gotcha
- Check `pg_constraint` before any migration that touches a FK-referenced table
- Dev vs UAT data environment mismatch — always verify target environment first
- Scratchpad scripts go to session scratchpad, never repo paths
- Plain-language answer first, verification query as follow-up

---

## Estimated Token Impact

| State | Tokens per session |
|---|---|
| Current (everything always loaded) | ~5,500 tokens |
| After extraction (keep only behavioral rules) | ~2,620 tokens |
| Skills loaded only when triggered | 0–900 tokens on-demand |
| **Savings on a typical coding session** | **~2,880 tokens saved (~52%)** |

On a session doing 50 turns, that's **~144,000 tokens saved** just from context reduction —
before any change to prompting habits.

---

## What NOT to extract

These sections look verbose but **must stay** because they encode specific past mistakes
that apply to any session type:

- **Session handoff rules** — the `active_progress.md` discipline applies every session
- **Show before you act** — applies to investigative queries, not just feature work
- **Checkpoint commits** — applies to any build of meaningful size
- **Scorecard integrity** — any session could touch `Traceability.md`

---

## Recommended Skill Files to Create

```
.claude/skills/
├── feature-planning/
│   └── SKILL.md          (~560 tokens, extracted from lines 82–124)
├── pre-e2e-code-review/
│   └── SKILL.md          (~280 tokens, extracted from lines 145–169)
├── hybrid-e2e-test-plan/
│   └── SKILL.md          (~180 tokens from CLAUDE.md + full framework we designed)
└── troubleshooting-and-scripting/
    └── SKILL.md          (~900 tokens, extracted from lines 183–250)
```

> **Note on location:** Claude Code reads skills from `.claude/` by default.
> Skills for Claude Code go in `.claude/skills/` (not `.agents/` which is for Antigravity/AGY).

---

## Recommended Next Steps

1. **Extract** the 4 sections above into skill files
2. **Remove** those sections from `CLAUDE.md`
3. **Keep** everything else exactly as-is — the remaining content is well-written
4. **No trimming** of the kept sections — the "Why:" rationale in each rule is valuable
   and shouldn't be removed just to save tokens (those are the anti-regression guards)

> **One important note:** The `Why:` rationale blocks in CLAUDE.md serve as institutional
> memory for past mistakes. Don't strip them — they're why the rules stick.
> Move the whole section (rule + rationale) to the skill, don't truncate.
