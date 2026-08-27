# Sales Development Activities — Discussion & Draft Reply to Haroon

**Date:** 2026-08-26
**Status:** Draft reply prepared, not yet sent / not yet scoped as an implementation plan.
**Context:** Haroon asked whether Cabio Sales OS should track sales-team activities
that aren't tied to a hospital/account or an opportunity — conferences, OEM/product
training, certifications, sales training, seminars — which have long-term benefit but
no direct revenue link. Open questions: should this live in Sales OS or HR/Timesheet,
should logging be mandatory, and what do comparable CRMs (Zoho, Salesforce, Dynamics)
do here.

## The Whole Solution, in Plain Language

**The problem:** reps do things that help them sell better long-term — going to a
conference, doing a product training, getting certified — but none of it is tied to
a specific hospital or deal. Today, the system has nowhere to record that at all.

**The fix:** add a few new options to the "Log Activity" screen reps already use
every day. Nothing new to learn, no new screen, no new app section.

- A rep picks one of six new activity types: Conference/Expo, OEM/Product Training,
  Certification, Sales Training, Seminar/Trade Show, or a general "Other Development"
  catch-all.
- Unlike every other activity today, these ones don't need a hospital/account picked
  — because they genuinely aren't about one.
- The rep writes a short description, plus one required field: **what did you get out
  of it** (the "Outcome/Learning" note). That field is the one thing we insist on —
  if someone logs an entry, it has to say something real, not just tick a box.

**What we're deliberately NOT building:**
- No "how many hours did this take" field — that starts turning this into a
  productivity tracker, which defeats the point.
- No proof-of-attendance or roster checking — chasing reps to prove they actually
  sat through a session is an HR/training-department job, not a Sales OS job.
- No link to HR attendance, leave, or payroll.
- No automatic connection between a logged conference and any new leads it produces
  — if a rep picks up a contact at a conference, they log that as an ordinary new
  Lead and tag its source as "Conference," same as any other lead.

**The one real technical change needed:** today, every activity a rep logs is forced
to be linked to a hospital account — there's no way to log something unattached. This
feature needs a small database change to relax that rule just for these new types.
Small, contained, low-risk.

**Where it'll show up once logged:** see "Reporting & Visibility" below — this wasn't
originally worked out and is worth reading before this ships.

**Effort:** small. A handful of new dropdown options, one relaxed database rule, no
new screens, no new security model.

## Conclusion

- **Lives in Sales OS**, as a few new options on the Activity log reps already use —
  not a new module, not an HR timesheet. No major CRM (Salesforce, Zoho, Dynamics) has
  a dedicated feature for this either — they all handle it the same way, as a generic
  activity/task entry that's allowed to have nothing else attached to it, with real
  attendance/timesheet tracking left to a separate HR product.
- **Not mandatory in the compliance sense** — we won't require proof that someone
  actually attended (no roster reconciliation; that's an HR/training-department
  feature, out of scope here). What *is* required: if a rep logs one of these, they
  have to fill in the "what did you get out of it" field — cheap to build, and it's
  what keeps an entry meaningful instead of a rubber stamp.
- **One real, but small, technical change was found during review:** today, every
  single activity a rep logs — no exceptions — must be linked to a hospital account
  in the database. To allow these new unattached activity types, that rule has to be
  loosened (a database migration), and a couple of related screens need to be told
  it's now OK for an activity to show up with no account name attached.
- We'll also need a place to store that required "what did you get out of it" note —
  either a new field, or repurposing the existing free-text notes field for it.
- **Deliberately left out**, on purpose: a duration/hours field (turns this into a
  productivity tracker, the opposite of the intent), any link to HR
  attendance/leave/payroll, and any automatic linking between a logged conference and
  the leads it produces (tagging a new Lead's source as "Conference" covers that
  without building a real link).

## Reporting & Visibility

This wasn't worked out in the original discussion — worth settling before this ships,
since Haroon's original ask was as much about *seeing* this activity as about logging
it.

- **Where it shows up automatically, for free:** the existing "Daily Activity Report"
  — the day-by-day feed of everyone's logged activity that managers (and reps, for
  their own entries) already use. It doesn't require an activity to be tied to a
  hospital, so these new entries will just appear there once logged, no extra work
  needed.
- **Where it will NOT show up:** any hospital or deal page (Customer 360, an
  Opportunity's detail page). Those pages only show activity tied to *that specific*
  hospital or deal — since these entries are deliberately unattached, they're
  invisible there. That's expected, not a bug — just worth knowing so nobody goes
  looking for a training entry on a hospital's page and assumes it's missing.
- **Decided with Haroon, 2026-08-27: yes, these count in the Insights Dashboard's
  activity report.** The report (planned, not yet built) shows a number for "how
  active is each rep" — Haroon confirmed development activities should be included in
  that count, not excluded or split out. (Exactly how they're broken out within that
  count — blended in vs. shown as a labeled sub-line — is a small display detail to
  settle when that report is actually built, not a decision that needs to happen now.)
- **A second, bigger thing Haroon wants: an actual annual target for this, not just a
  count.** He'd like managers to be able to set a yearly goal for a rep (e.g. "4
  trainings this year") and see progress against it — the same idea as a revenue
  target in Target Planning, but for development activities instead of money. This is
  real new work, tracked as its own item: `docs/Backlog.md`'s "Annual
  Development-Activity KPI" entry. Decided design: it gets its own table later, not
  bolted onto Target Planning's revenue table — see that entry for why. Sequenced
  after both Target Planning and this feature ship; not part of this build.
- **A privacy note, inherited from an existing gap, not a new one:** normally, an
  activity a rep logs is only visible to that rep and their manager chain (their
  manager, GM, etc.) — nobody outside that chain. There's an existing bug where any
  activity that isn't tied to a specific deal falls outside that protection and
  becomes visible to *everyone* logged into the system, any role, any zone. Since
  these new activity types are never tied to a deal, every one of them will fall into
  that gap. Low-stakes information (just "so-and-so went to a training"), but it's a
  real gap that's getting wider as more of these unattached activity types get added.
  Logged separately in `docs/Backlog.md` as its own item to fix properly later — not
  blocking this feature, just flagged so it's a deliberate, known tradeoff rather than
  a surprise.

## Draft reply to Haroon

Hi Haroon,

Thought this through — here's where we landed.

**Yes, this fits in Sales OS**, but as a lightweight addition to the activity logging we already have, not as a new module and not as a timesheet. We'll add a few new activity types reps can log: Conference/Expo, OEM/Product Training, Certification, Sales Training, Seminar/Trade Show, and a general "Other Development" catch-all.

**How it'll work:**
- Same "Log Activity" flow reps already use — just a few new type options.
- No hospital/account/deal needs to be attached, since these aren't tied to a specific customer. This is a genuine small backend change (today, every logged activity requires picking an Account), but it's contained — a small, low-risk database update.
- Each entry captures: Date, Type, a short Description, and an **Outcome/Learning** note (what came out of it) — that last field is deliberate, it keeps this framed as capability-building, not clock-punching.

**On "mandatory":** we'll make the Outcome/Learning field *required* when someone logs one of these — so if they bother to log it, it's a real entry, not a rubber stamp. What we won't do is chase reps to prove they attended every sponsored session — that would mean tracking a training calendar/roster and reconciling attendance, which is a genuinely different (and much bigger) project, more HR/L&D territory than Sales OS. If that kind of compliance tracking is actually what you need, let's scope it separately and deliberately — happy to talk through it, just don't want it to sneak in as a side effect of this smaller ask.

**Two things we're intentionally leaving out:**
- No hours/duration field. It's the first step toward turning this into a productivity tracker, which is the opposite of what we want reps to feel logging it.
- No connection to HR attendance, leave, or payroll — if that's ever needed, it belongs in an HR system, not here.

**For conferences specifically**, if a rep picks up a new contact there, they'll log it as a Lead the normal way and tag its source as "Conference" — so we can see which leads came from expos. That's independent of the activity log entry itself, not a linked report — just flagging so expectations are set.

**Where you'll see this data:** it'll show up in the existing Daily Activity Report automatically. It won't appear on a hospital's own page, since it's deliberately not tied to one. If you want a rollup — say, "how many training/conference entries has each rep logged this quarter" — that's a small addition we can fold into the Insights Dashboard we're building next, rather than something this first version needs to include.

**Effort-wise:** this is a small, contained backend change (a couple of new fields/relaxed constraint) plus a handful of new labels in the UI — not a new module, no new screens, no new security model. Let me know if the above works and I'll get it scheduled.

## Next step, if Haroon agrees

Not yet scoped as a formal implementation plan (no migration number claimed, no
`Business-Rules.md` entry drafted). When this gets picked up, write it up as its own
plan doc following the codebase's usual pattern (see
`Manager-Attested-Gate-Override-Implementation-Plan.md` or
`Referral-Credit-And-Relationship-Support-Implementation-Plan.md` for shape), re-check
migration/BR numbering at build time, and confirm whether this lands before or after
Referral Credit Part 2 (Relationship-Support Activity), which is already queued. Also
carry forward the "Reporting & Visibility" decisions above (Insights Dashboard
counting treatment) into that plan doc — don't let them get dropped between this
discussion doc and the eventual build.
