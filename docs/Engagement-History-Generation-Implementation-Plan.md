# Engagement History Generation — Implementation Plan

**Status:** Planned, not built. One decision (data privacy / provider choice,
§6) needs leadership sign-off before implementation starts — everything
else is resolved.

**Supersedes:** `docs/Relationship-Note-Implementation-Plan.md`. That plan
proposed a new `ENGAGEMENT_NOTE` Activity type reps would manually log.
Superseded 2026-09-01 after discussion converged on a stronger design that
asks reps for **zero additional input**: synthesize the same "durable
account context" need entirely from Activity and Next Action data reps
already enter. See §1 for why the manual-entry approach was dropped.

**Raised:** 2026-08-31 discussion (durable-context gap) → 2026-09-01
working session that built a hand-verified prototype against real UAT data
(58 accounts) and a leadership-ready deck from it. This plan is the
build-out of that prototype.

---

## 1. Problem, and why not manual entry

Activity is a timestamped, immutable log — a call, a visit, a demo. That's
not the same thing as "what do we currently understand about this
account/deal," which accumulates *across* activities and is expensive to
reconstruct by reading every entry in order.

The first design considered (`Relationship-Note-Implementation-Plan.md`)
solved this by adding a new Activity type reps would log manually. Rejected
on 2026-09-01: **any second thing a rep has to type is friction that
competes with the logging habit itself** — the risk isn't that reps
document too little context, it's that a new mandatory-feeling step makes
them stop logging entirely. Verified conclusion from that discussion:
*"I don't want to give reps more things to enter... I want to give
something back for what they enter."*

**Chosen design:** read back Activity + Next Action (Reminder) data reps
already enter, and synthesize it into a standing "where does this account
stand" summary. No new field, no new Activity type, no new habit.

## 2. Proof of concept

Built by hand on 2026-09-01 against real UAT data (58 of 79 accounts, 120
activities, 64 open Next Actions) — not a mockup. Demonstrated concretely:

- **Nuance across departments** (Ramaiah Memorial Hospital) — two different
  truths in one account, invisible from any single log entry.
- **Contradiction-catching** (IQRAA Community Hospital) — a CMAC-rate
  dispute logged "cleared," then "need more follow up" nine days later with
  no resolution recorded — only visible reading the full history at once.
- **Real-time freshness** (G&F Medicine) — a same-day delivery reflected
  immediately, not on the next reporting cycle.
- **Compression** (Pragathi Hospital) — three activities of approval
  politics reduced to one operational fact and a date.
- **Gap-detection by cross-referencing two tables** (Sapthagiri Medical
  College) — a won deal with an outstanding payment and *nothing scheduled*
  to chase it, invisible in either the Activity log or the Next Actions
  list alone.

Leadership-facing writeups from this prototype: `docs/Engagement-History-
UAT-Preview-2026-09-01.md` (full 58-account detail), `docs/Engagement-
History-Leadership-Slides-2026-09-01.html`/`.pdf` (5-slide deck).

## 3. What gets built

Two consumer surfaces, one generation engine:

1. **Engagement History tab** — Account 360 and Opportunity 360. Shows the
   current summary for that account, labeled "as of `<date>`, based on
   `<N>` activities," with the existing raw Activity tab one click away.
   Falls back to "not enough activity yet" rather than a fake-confident
   summary when data is thin (proven necessary by IQRAA Community Hospital
   in the prototype — thin source data must produce an honest thin result,
   not an invented one).
2. **Account Engagement Report** — manager dashboard, filterable rollup of
   the same synthesis across the team. Fulfills the "Activities" dimension
   of PRD §5.12's Customer Portfolio Report; distinct from "Rep/Team
   Activity Levels" (PRD §5.4/A.2.2, an aggregate count) and the separately
   planned Daily Activity Report (`docs/Daily-Activity-Report-Technical-
   Design.md`, a chronological per-day log) — neither of those synthesizes
   "where does this account stand."

## 4. Generation architecture

**One core service, two triggers.** `generate_engagement_summary(account_id)`
is the only place the LLM call, prompt, and storage logic live. Both
callers below invoke it — no duplicated logic to drift out of sync.

**On-demand:** `GET /accounts/{id}/engagement-summary`. Returns the cached
row if its watermark (§5) matches current data. If stale or missing,
generates synchronously (~2-4s at this data volume — no job queue needed
at 79 accounts) and returns the result. A manual "Refresh" control on the
tab forces regeneration for a rep about to walk into a meeting who doesn't
want to wait for the weekly run.

**Weekly batch:** a Render Cron Job — the same hosting platform the
backend already runs on (`docs/Deployment-Topology.md`: Render Web
Service, Starter tier), so this is a new service on infrastructure already
paid for, not a new platform. This is **the first scheduled job this
codebase has ever run** — `docs/Backlog.md` already documents "no job
scheduler exists yet" as a standing gap (from the BR-OP-06 Stalled-status
decision); this is the item that finally needs one. Logic: select accounts
where no summary row exists or the live watermark has moved past the
stored one, regenerate only those (incremental, not a full sweep — bounded
cost as the account book grows), continue past individual failures rather
than aborting the run.

## 5. Storage

```sql
CREATE TABLE account_engagement_summary (
  account_id             uuid PRIMARY KEY REFERENCES account(id),
  summary_json           jsonb NOT NULL,   -- structured, not free markdown
  generated_at           timestamptz NOT NULL,
  source_activity_count  int NOT NULL,     -- watermark
  source_max_activity_at timestamptz,      -- watermark
  prompt_version         text NOT NULL     -- bump to force a regen wave later
);
```

One row per account, upserted — never an appended log. `summary_json`
carries fixed fields (`status`, `key_people`, `cares_about`, `blocking`,
`next_step`) via Claude's structured-output/tool-use mode, giving the
frontend a stable contract instead of parsing prose. Staleness check is a
plain comparison of `source_activity_count`/`source_max_activity_at`
against the account's live Activity/Reminder counts — no diffing needed.

## 6. Data privacy — open decision, needs sign-off before build starts

Raised 2026-09-01: this data isn't patient health information, but it is
business-confidential (pricing, named competitor losses, individual doctor
preferences) and includes personal names of hospital staff — the latter is
plausibly in scope for India's DPDP Act 2023 if processed by a party
outside Cabio's control, though that's worth an actual compliance check,
not an engineering assumption.

Four options, ranked by fit for Cabio's scale (one internal team, ~79
accounts):

| Option | Data leaves Cabio's infra? | Quality | Ongoing cost |
|---|---|---|---|
| **A. Provider under enterprise/zero-retention terms** (Anthropic commercial terms, or AWS Bedrock/Azure OpenAI within Cabio's own cloud tenant) | Yes, contractually bound not to retain/train on it | Full reasoning — matches the prototype | Per-call API cost only (negligible at this volume) |
| B. Self-hosted open-weight LLM (Llama/Mistral/Qwen via Ollama, on a server Cabio controls) | No | Workable, below Claude-tier | Real ongoing burden — model serving infra, updates, tuning, for a small team |
| C. Locally-run small transformer summarizer (Hugging Face `transformers`, offline) | No | Extractive/generic — won't reliably catch contradictions or cross-table gaps | Low, but weaker product |
| D. Local rule-based NLP (`spaCy`, `sumy`, keyword rules) | No | Entities/dates/amounts only — **not** the synthesis that made the prototype land (see §2's contradiction-catching and gap-detection examples, which are reasoning tasks, not extraction) | Lowest |

**Recommendation:** Option A, contingent on confirming the provider's
actual zero-retention/no-training terms at whatever tier Cabio would use —
standing up and maintaining self-hosted model infrastructure (B) is hard to
justify against the size of this problem. Options C/D are the fallback if
leadership's answer is "no data leaves our infrastructure, full stop" — go
in understanding that fallback delivers a materially weaker product than
what was demonstrated, not a like-for-like substitute.

**Optional add-on regardless of provider choice:** a redaction pass
(strip/replace names before the call, restore after) reduces but doesn't
eliminate exposure — the competitive fact itself ("lost to Biolight") is
often the sensitive part, not just the name attached to it. Not in initial
scope; revisit if Option A is approved but partial mitigation is still
wanted.

## 7. What this touches (once §6 is resolved)

**Backend:**
- New migration: `account_engagement_summary` table (§5).
- New dependency + secret: LLM SDK (provider per §6 decision) +
  `{PROVIDER}_API_KEY` in `.env`/`.env.uat` — no AI/LLM dependency exists
  in this codebase today (confirmed by inspection 2026-09-01).
- New domain: `backend/app/domains/engagement_summary/` — service
  (`generate_engagement_summary`), repository (upsert + watermark read),
  router (`GET /accounts/{id}/engagement-summary`, `POST .../regenerate`).
- New Render Cron Job service — first scheduled job in this codebase; see
  `docs/Deployment-Topology.md` for the existing Render setup it slots
  into.

**Frontend:**
- Engagement History tab on `Customer360Screen.tsx` and
  `OpportunityDetailScreen.tsx` — staleness label, Refresh control, empty
  state for thin data, fallback link to the existing Activity tab.
- Account Engagement Report screen on the manager dashboard — filterable
  rollup, per §3.

**Docs:**
- `docs/Business-Rules.md` — no new BR needed (no new Activity type, no
  validation change); note the read-only report's data source instead.
- `docs/Backlog.md` — update the "Relationship Notes + Activity type
  filter" entry to point here instead (superseded).

## 8. Explicitly not in scope

- **Stakeholder-level notes** — same conclusion as the superseded plan:
  Activity has no `stakeholder_id`, real schema work, lower priority than
  Account/Opportunity coverage. Revisit only if a real need surfaces.
- **A manual Engagement Note Activity type** — the whole point of this
  design is that reps type nothing extra. Not reintroducing it.
- **Redaction/anonymization pipeline** — see §6's optional add-on note;
  not initial scope.

## 9. Sequencing

Not competing with in-flight work — `active_progress.md`'s queue (Auth
Session Resilience → Audit Trail → Lead Management) is unaffected. This
is a new candidate for that queue, not a reprioritization of it; where it
slots in relative to the others is Basheer's call once §6 resolves.
