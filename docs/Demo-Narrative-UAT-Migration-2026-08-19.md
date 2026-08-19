# What's Shipped Since the Last UAT Migration

**Internal briefing · Cabio Sales OS · 2026-08-19**

Twelve days of work sitting on `main`, not yet promoted to UAT — 24
distinct capabilities and fixes across 7 areas, including Referral
Credit (built and manually verified, not yet committed — added to this
narrative because it directly answers a standing ask from leadership and
the sales team: how to actually track a referral). The story below is
what to tell in the demo; the reference list under it is backup for
anything a question digs into.

| | |
|---|---|
| **Development window** | Aug 7–19, 2026 |
| **Code commits** | 25 (34 total incl. planning docs), plus Referral Credit — verified, not yet committed |
| **Capabilities & fixes** | 24, across 7 areas |
| **Regression pass** | Clean, Aug 17 |

---

## The Story

A traditional CRM asks: *"Did you log your activity?"* This system asks:
*"Will this help you achieve your target?"*

We never called this a CRM. From the day the architecture was written
down, it was designed as a Sales Operating System — Target, then
Coverage, then Opportunity, then Revenue. A CRM logs what happened. An
operating system runs the business. The last two weeks weren't about
adding items to a list — they were about closing the gap between what we
said this system would be and what it actually does, in three places, in
order.

### I — Territory & Organization: The org itself became real data

Start with the org. Six weeks ago the territory map lived in
conversations with Adarsh, Shruthi, Fazal — real and current, but not
something the app actually knew. Every visibility rule in the Pipeline
ran off a flat zone list that didn't match how the field is actually run.
That gap is closed: territory is now a real hierarchy, Zone down to
Taluk, that an Admin edits directly and live, with the impact shown
before anything moves. The Sales Manager tier that no longer exists in
practice is gone from the system too, not just the org chart. And
offboarding a rep is no longer a choice between deleting their history or
leaving a stale login active — it's one reversible toggle. None of this
is a new screen bolted onto the side. It's the map that's been quietly
deciding who sees what in the Pipeline you already use every day — only
now it's actually true.

> **Show:** Say it's mid-quarter and a district needs to move to a
> different manager. Watch what happens when I move it — *[Territory
> Admin, live]* — before anything commits, the system shows the exact
> blast radius: who and what's affected. No engineering ticket, no
> guessing. Now the flip side — *[User Directory]* — a rep leaves,
> deactivate them, and watch them vanish from the owner picker instantly.
> Reactivate, and every deal, every note, comes back exactly as it was.

### II — The Deal Itself: A deal became the whole deal

Now look at what a deal actually is. You already close deals in that same
Pipeline — what's changed is what's allowed inside one. A real capital
equipment sale was never "one machine, one price." It's a trade-in
against an old unit, a bundle of accessories, sometimes a straight
buyback with nothing in the catalog to match it against. The product
model finally admits that. And the paperwork that used to live in a
WhatsApp thread — a site photo, a signed quotation — now lives on the
deal itself, previewable inside the app, not a forced download. The
record finally looks like the deal actually looked.

> **Show:** Say a hospital wants to trade in their old ultrasound machine
> for a new one, plus a probe and a service accessory. Watch it all go on
> one opportunity — a new-equipment line, an accessory, a free-text
> buyback for the trade-in, no catalog match needed. Now attach the site
> photo from the visit and the signed quotation — open both right here,
> in-app, no download.

### III — Referral Credit: Who gets the thank-you, on the record

This one's a direct answer to something leadership and the sales team
have been asking for: how do we actually track a referral? Until now, a
referral was a conversation, maybe a WhatsApp message — never a fact in
the system. Now, the moment a deal's Lead Source is set to Referral, you
name exactly who gets credit: any Cabio colleague, in any SBU, any
territory — no restriction on who can refer a lead into someone else's
patch. If the referral came from outside Cabio entirely — a customer
contact, a hospital administrator — there's a free-text note for that
instead. Never both, enforced right down to the database, and it clears
itself automatically the moment the Lead Source changes away from
Referral, so it never sits there stale or misleading. It's a pure credit
record, on purpose — no split percentage, no revenue impact, nothing to
game. Just an honest, permanent answer to "who do we say thank you to."

> **Show:** Say a Critical Care rep in Bangalore refers a lead to an
> Imaging colleague in Kerala she's never even met. Set Lead Source to
> Referral on a new opportunity, name the colleague — any SBU, any
> territory — and save. That credit is now on permanent record.

### IV — Data You Can Stand Behind: Numbers you don't have to double-check

None of that matters if you can't trust what's on the screen. A new
opportunity can only be created Active now — closing a deal Won or Lost
is a deliberate step taken later, never a shortcut at creation. Notes
save exactly as typed, multi-line, no more silent truncation. And before
any of this was even considered for UAT, the full regression plan ran
end-to-end — every tier, every rule, clean. Every report you already pull
from this system — Daily Activity, Pipeline by stage — inherits that,
without anyone touching the report itself. Cleaner data in, the same
trustworthy numbers out.

### The Wider Picture: Where this is actually going

`Target → Coverage → Opportunity → Revenue`

Here's the part worth leaving the room thinking about.

The architecture was written on day one around four rungs: Target,
Coverage, Opportunity, Revenue.

Set a number for a rep or a territory, for a quarter. Decide,
strategically, which accounts deserve the coverage to actually hit it.
Work the pipeline. Watch revenue land against the plan — not just
accumulate in a list.

Right now, you're standing on the bottom two rungs: Opportunity and
Revenue.

Everything in this build was about making sure those two rungs can
actually bear weight — real territory ownership underneath, real deal
composition, data you can trust.

The Target and Coverage tables already exist in the schema, built for
exactly this hierarchy, not a guess at one. There's no screen yet —
that's the next chapter, not this one. But when we build it, it snaps
onto the pipeline you're looking at right now. Nothing gets rebuilt to
make room for it.

And it isn't a promise that needs new infrastructure to become real.

You've already seen the shape of it twice today. The Pipeline view and
the Daily Activity Report are both, quietly, dashboards — live reads
over the same opportunity and activity data every rep enters as a normal
part of their day.

The moment Target and Coverage plans exist, the same pattern extends one
layer up: a target-versus-actual view, by rep, by territory, by SBU, per
quarter. Green where coverage and pipeline genuinely support the number.
Red where they don't. Checked any day inside the quarter — not
discovered after it closes.

Nobody builds a second system to get that report. It's the same data,
read a different way.

Which is exactly why insisting on clean territory ownership and honest
deal data today isn't overhead. It's the only way that report is ever
worth looking at.

We have a foundation that finally reflects reality. It's clean, it's
tested, and it's ready.

**Close with:** none of what you've just seen — including Referral
Credit — is in UAT yet. That's the ask today.

---

## Reference Detail

*Organized by area — useful if a question goes deeper than the demo.*

### Territory & Coverage

Sales territory used to be a flat list. It's now a real hierarchy — Zone
→ District → Taluk — that an Admin can restructure directly in the app:
add a district, move it under a different manager, retire one that's no
longer active. No engineering ticket required to reflect a field
reorganization.

- **Territory Admin screen** — add, rename, and re-parent territory
  nodes; the app shows the blast radius (who and what is affected)
  before a move is confirmed.
- **Coverage view** — see every manager's assigned territory on one
  tree, toggleable on/off so the map stays readable by default.
- **Shared zone picker** rolled out to Customer 360, Customer Directory,
  the Pipeline filter, and User Directory — defaults to your own
  territory, type-ahead to override, replacing four separate flat
  dropdowns.
- **Zone filtering** everywhere it matters — Pipeline, Customer
  Directory, Account Management — now understands the full territory
  tree, not just a single flat zone.
- **Multi-zone assignment** — a rep or manager covering more than one
  territory is now assigned to all of them, with pipeline and account
  visibility across the full set, not just a primary zone.
- **Zones can be deactivated and reactivated**, same reversible pattern
  as user offboarding below — a retired territory disappears from new
  assignments without erasing anything already tied to it.
- **Split participant picker widened** — a colleague from any territory
  in the same business unit can now be credited on a split deal, not
  just the same territory.

> **Show:** Open Territory Admin, move a district to a different branch
> live, and point at the coverage view updating to match.

### Sales Organization

The reporting structure now matches how the team actually runs today,
and offboarding a rep no longer means choosing between deleting their
record or leaving stale logins active.

- **Sales Manager tier retired** into Area Manager — one fewer layer in
  the reporting chain, reflected consistently in every visibility rule,
  not just the org chart.
- **Deactivate / reactivate** for any user — an inactive rep disappears
  from assignment pickers and login, but every deal, note, and report
  they touched stays exactly where it was. Fully reversible.
- **Admin and GM confirmed fully unrestricted** — leadership sees every
  deal across both Imaging and Critical Care and every territory, with
  no gap in that visibility introduced by any of the territory or org
  changes above.

> **Show:** Deactivate a test user in User Directory, show them vanish
> from the owner picker, then reactivate and show history intact.

### Deal & Product Lifecycle

A real deal is rarely just "sell one machine." It's a trade-in, a
refurbished unit, a bundle of accessories — all on the same opportunity.
The product model now reflects that.

- **Trade-ins, refurbished stock, and accessories** are now first-class
  line items alongside new equipment on any opportunity.
- **Buyback entries** no longer require a catalog match — a free-text
  description covers the trade-in item on the spot.

> **Show:** On one opportunity, add a new-equipment line, an accessory,
> and a free-text buyback.

### Referral Credit

A direct answer to a standing ask from leadership and the sales team:
track who referred a lead, on the record, without touching revenue.

- **Colleague picker** — any active Cabio user, any SBU, any territory —
  credited as the referrer when Lead Source is Referral.
- **External referral note** — free-text field for a non-Cabio referrer
  (a customer contact), used instead of the colleague picker, never
  both — enforced at the schema level and backed by a database
  constraint.
- **Purely a credit record** — no split percentage, no revenue rollup
  impact, no new visibility grant. Nothing to game.
- **Self-clearing** — if Lead Source changes away from Referral, the
  credit clears automatically so it never goes stale or misleading.
- **Live at all four opportunity entry points** — Quick Lead, Customer
  360 (New + Edit), Project Directory (Add + Edit), Opportunity Detail
  edit.

> **Show:** Set Lead Source to Referral on a new opportunity, name a
> colleague from a different SBU or territory as the referrer, and save.
> Reload and show the credit round-tripped exactly as entered.

### Documents

Site photos, quotations, PO copies — previously these lived nowhere
inside the system. Opportunities now take real file attachments, kept
securely and viewable without forcing a download.

- **Upload** photos (JPEG/PNG) or PDFs, up to 4MB, directly on an
  Opportunity.
- **In-app preview** — PDFs and images open inline; download is still
  one click away, just not the only option.

> **Show:** Attach a site photo or a PDF quotation to a live opportunity
> and preview it without leaving the app.

### Data Integrity

A couple of guardrails, in service of the same thing: what the pipeline
reports should match what's actually true in the field.

- A new opportunity can only start life as **Active** — closing a deal
  Won or Lost is a deliberate step taken later, not a status you can
  pick at creation.
- Multi-line activity notes and item descriptions save exactly as
  typed.

### Workflow

A few conveniences that add up across a full day of use, without
changing how anything works underneath.

- **Landing screen** now opens on Pipeline instead of Account
  Management — the screen the team actually starts the day on.
- Editing a Project **saves in place**, reflecting the change
  immediately instead of returning to the full list.
- The global **"+ Lead" button pre-fills** Account and Project from
  wherever you clicked it, instead of starting blank every time.

> **Show:** Click "+ Lead" from inside an account or project and point
> out it's already pre-filled.
