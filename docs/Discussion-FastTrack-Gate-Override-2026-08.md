# Discussion Paper: Manager-Attested Stage-Gate Override for First-Time Fast-Tracked Deals

**Prepared for:** Discussion with Haroon Sidheeq (General Manager & Sales Head) and the
Cabio leadership team.
**Prepared:** 2026-08-20.
**Status:** DECIDED — 2026-08-25 (Basheer/Haroon). Not yet built.

---

## 1. Where this came from

Only one issue came out of the 2026-08-19 leadership demo, and it isn't a bug: the team
needs to enter Opportunities that skip stage gates even when the deal **isn't** a
`REPEAT_ORDER`. The example raised: a brand-new customer, reached via referral, who
declines a demo outright and wants to go straight to negotiation/order. There is no
prior equipment relationship to reference — it's a first-time sale — so `REPEAT_ORDER`
(BR-OP-13) does not apply and should not be stretched to cover it.

This is not a new problem. It's the exact case `docs/Discussion-FastTrack-Opportunity-
Creation.md` (2026-08-05) called **Option C** — "a deliberate, visible 'skip this
requirement' action restricted to a role like Admin/GM, requiring a typed reason" — and
explicitly declined to build:

> "Decided not needed — the repeat order volume (~40%) is fully covered by Option D, and
> the remaining true one-off case ... wasn't judged common enough to justify building a
> separate override mechanism for. **Revisit only if that case actually starts recurring
> in practice.**"

Leadership surfacing it at the very next demo is that revisit trigger.

## 2. Why `REPEAT_ORDER` can't be reused for this

`BR-OP-13` defines `REPEAT_ORDER` narrowly and deliberately: *the customer is buying the
exact same equipment they already have from Cabio, price pre-negotiated off a prior PO*.
That definition already survived one correction — an earlier draft tried to key the
exception off the existing `Existing Customer` lead source and was rejected because a
hospital already using Imaging equipment could still need a full demo for a new Critical
Care pitch. The fix was to make `REPEAT_ORDER` a distinct, narrow value rather than
overload an existing one.

The referral case is the mirror image of that same mistake: fresh customer, fresh
equipment, fresh price — the opposite of what `REPEAT_ORDER` means — but still no demo,
for a deal-specific reason (the customer declined one) rather than a lead-source-driven
one. Tagging it `REPEAT_ORDER` would corrupt the ~40% repeat-order pipeline rollups
`BR-OP-13` exists to keep clean. This needs its own field, orthogonal to `lead_source`,
not a reuse of that one.

## 3. What's staying the same vs. what's different from `REPEAT_ORDER`

| | REPEAT_ORDER (BR-OP-13) | This proposal |
|---|---|---|
| Trigger | `lead_source = REPEAT_ORDER` | A separate, per-Opportunity override field |
| Gates waived | Demo Date; Expected Closure Date | Same two — no reason to touch Negotiation→Order or Order→Delivery |
| Order Value / Product Details / PO Number | Still mandatory | Still mandatory — unchanged principle |
| Who can invoke | Any rep, no approval | Rep sets it themselves, attesting to their own immediate manager's approval (Area Manager tier, via `manager_id` — see §5.1/§5.2). REPEAT_ORDER's "any rep, no approval" design is safe *because* it's gated on a structural fact (lead source), not a judgment call — this case is a judgment call, which is exactly what the original paper's §3 flagged as the risk of an ungated skip, hence the named-approver requirement. |
| Volume | ~40% of pipeline, predictable | Expected to be rare/occasional (your framing: "occasionally") — doesn't need REPEAT_ORDER's high-volume, frictionless design |

## 4. Proposed mechanism: Manager-Attested Gate Override

Rather than a full request/approve workflow (a new state machine with no precedent
elsewhere in the app — On-Hold and Lost are both self-service reason-codes, not
approvals), the proposed shape is an **attestation**: the rep sets the override
themselves but must name a real approving manager and a reason at the same time,
creating an auditable record without a separate wait-for-approval step.

**New fields on `Opportunity`:**
- `gate_override_approver_id` — FK to `user_profile`, must equal the rep's own
  `manager_id` and hold the Area Manager role (see §5.1/§5.2).
- `gate_override_reason_id` — FK to a new `GateOverrideReason` master-data list (see
  §5.3), plus:
- `gate_override_note` — optional free-text, alongside the reason.
- `gate_override_set_at` / `gate_override_set_by` — captured automatically, not
  user-entered (who actually clicked the button and when, distinct from who approved).

**Effect (mirrors `BR-OP-13`'s effect exactly):** when `gate_override_approver_id` is
set, the Qualified→Demo (Demo Date) and Clinical Evaluation→Negotiation (Expected
Closure Date) gates in `BR-OP-01` are not enforced. Negotiation→Order and Order→Delivery
gates are unaffected.

**Audit:** visible on the Opportunity detail record itself (who set it, who approved it,
why, when) — no new audit-history mechanism needed beyond what already exists for other
guarded fields (BR-OP-02, BR-OP-03).

**Reporting:** because this is a distinct field (not folded into `lead_source`), it's
independently queryable — leadership can see override frequency, by whom, approved by
whom. This is what makes the "over-use risk" from the original paper's §3 addressable
after the fact, without needing a blocking approval step up front.

## 5. Decisions (2026-08-25)

### 5.1 Who qualifies as approver? — DECIDED: the rep's immediate manager (Area Manager)

Corrects this paper's original framing: the Sales Manager Tier Collapse did *not* leave
the system with only `Sales Staff`/`General Manager`/`Admin` — `Area Manager` is a real,
active first-line manager tier (migration `0008`, folded further in migration `0021` so
every rep reports directly to one). `user_profile.manager_id` already models the
rep→manager reporting line and is already used exactly this way by
`opportunity_tier_visibility`'s RLS policy. So the approver is not GM/Admin (this paper's
earlier fallback assumption) but the rep's own immediate manager.

### 5.2 Does the approver need to be the rep's *own* reporting line, or any qualifying role? — DECIDED: own reporting line

Validated against the existing `manager_id` FK, not "any Area Manager." Simpler to build
than assumed — no new hierarchy modeling needed, since `manager_id` already exists and is
already load-bearing for the equivalent RLS check.

### 5.3 Reason: free text or a master-data reason list? — DECIDED: dropdown + optional note

`BR-OP-02`/`BR-OP-03` both use master-data reason codes (`hold_reason_id`,
`loss_reason_id`) rather than free text, for consistent reporting. Same pattern here — a
small `GateOverrideReason` master list (e.g. "Customer declined demo," "Deal closed
outside normal process, entered after the fact," "Other — see notes") plus an optional
free-text note.

### 5.4 Does this need a volume/overuse safeguard from day one, or monitor-then-decide? — DECIDED: monitor-then-decide

Given the expected volume is "occasional," ship the attestation + reporting visibility
only. No cap, threshold, or second-approval trigger at launch — revisit only if usage
patterns suggest it's becoming a shortcut rather than a genuine exception, same posture
the original paper took toward REPEAT_ORDER's volume before committing to Option D.

## 6. Recommendation (decided)

- Build the Manager-Attested Gate Override as scoped in §4.
- Approver: rep's immediate manager (Area Manager tier), validated against
  `user_profile.manager_id` (§5.1/§5.2).
- Reason: master-data list + optional note (§5.3).
- No overuse safeguard beyond reporting visibility at launch (§5.4).
- Record as `BR-OP-14` once built, amending `BR-OP-01`'s gate table the same way
  `BR-OP-13` did.
- No new ADR needed — this extends the existing stage-gate exception pattern
  (`ADR-015`), doesn't change pipeline/stage modeling (`ADR-013`, `ADR-028`).

## 7. Reference

- `docs/Business-Rules.md` — `BR-OP-01` (gate table this would amend), `BR-OP-13`
  (REPEAT_ORDER, the sibling exception this is modeled on and deliberately distinct
  from).
- `docs/Discussion-FastTrack-Opportunity-Creation.md` — Option C, the original proposal
  this revives, and its §3 risk analysis on ungated judgment-call skips.
- `docs/ADR.md` — ADR-015 (Opportunity Creation at Any Sales Stage).
- `docs/Seed-Data.sql` §7 — current `role` values (post Sales Manager Tier Collapse).
