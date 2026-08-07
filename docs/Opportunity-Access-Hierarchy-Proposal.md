# Opportunity Access Hierarchy — Proposal for Leadership Review

**Status:** Draft — for Cabio leadership review and decision
**Date:** 2026-07-24
**Prepared by:** Basheer Kalanchera

---

## 1. Why This Matters

Today, in the Sales OS, every person who logs in can see every sales
opportunity in the system — regardless of who is working on it or which
region it belongs to. During the July 21 demo, it was requested that
opportunity visibility be restricted so each person only sees what's
relevant to them: their own deals, their team's deals, or their region's
deals, depending on where they sit in the sales organization.

This document proposes how that access should work, based on the reporting
structure discussed. It's written for your review and decision — no
technical detail, just what changes for each role and what we need you to
confirm before it gets built.

---

## 2. Proposed Reporting Structure

| Level | Role | What they can see |
|---|---|---|
| 1 (top) | **Admin** | Everything, across both business units (Imaging and Critical Care) |
| 2 | **General Manager** | Everything, across both business units |
| 3 | **SBU Manager** *(today called "Sales Manager")* | Everything within their own business unit |
| 4 | **Area Manager** *(new)* | Everything within their business unit **and** their region |
| 5 | **Sales Manager** *(repositioned — see Section 3)* | Only the opportunities belonging to their own team |
| 6 (bottom) | **Sales Staff** | Only their own opportunities |

**"Area" = the regions you already use** (North Kerala, South Kerala,
Central Kerala, Bangalore). We're not introducing a new geography — just
using the regions already in the system.

> **2026-08-07 update:** a 5th region, Mangalore, has since been added. Same
> mechanism applies — no change to this proposal.

---

## 3. A Naming Note

Today there is one "Sales Manager" per business unit, and that person
effectively runs the whole business unit. Under this proposal, that role is
renamed to **"SBU Manager"** to reflect what they actually do.

The title "Sales Manager" is then reused for a new, more junior position —
someone managing a smaller team within a region. This is a one-time renaming
to make titles match actual responsibility as the team grows — **not** a
demotion of anyone currently in the role.

---

## 4. What Changes, Role by Role

- **Sales Staff** — no change day to day. They already only work their own
  deals.
- **Today's Sales Manager (→ SBU Manager)** — no change to what they can
  see (still everything in their business unit); only the title changes.
- **Area Manager** *(new position)* — once someone is appointed to this role
  for a region, they'll see all deals in that business unit and region.
- **Sales Manager** *(new, repositioned)* — once someone is appointed,
  they'll see only their own team's deals.
- **General Manager / Admin** — no change.

---

## 5. What Does NOT Change

- No change to how the app looks or works day to day — same screens, same
  data entry.
- No change to the sales process, approvals, or deal stages.
- This only affects **who can see which opportunities** — nothing about how
  deals are managed or approved.
- Only Opportunities are affected — not Accounts, Projects, or other
  records, matching what was originally requested at the demo.

---

## 6. Rollout — No Disruption Today

Because there is currently only one Sales Manager per business unit, this
structure can be built into the system now with **zero visible change to
anyone**, until people are actually appointed into the new Area Manager and
Sales Manager roles. Nobody's access changes on day one — it only takes
effect as the team grows into the new structure.

---

## 7. Decisions Needed From Leadership

1. **Does each Area Manager's territory line up exactly with one region**
   (North Kerala, South Kerala, Central Kerala, Bangalore, Mangalore)? Or
   could a territory span parts of more than one region, or be shared
   between more than one Area Manager?
2. **Is "SBU Manager" the right title** for the renamed role, or would you
   prefer something else (e.g. "Divisional Manager," "Business Unit Head")?
3. **Is the roughly one-year timeline** for growing into this structure
   still accurate? Which role do you expect to fill first — Area Manager or
   the new Sales Manager tier?

---

## 8. Next Steps

Once this structure is confirmed (or adjusted) by leadership, the technical
design and build will follow — tracked separately, and will not begin until
this document is signed off.
