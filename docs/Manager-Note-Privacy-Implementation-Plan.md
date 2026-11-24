# Manager Notes: only the rep and their managers can see them — Implementation Plan

**Status:** Approved 2026-11-20 (Basheer). Built and on Dev — `dac003f` (21 Nov 2026, migration 0067), automated check `d7defb0` (22 Nov), fixes `ee5be3f` and `320981e` (23 Nov). Manual E2E run on Dev 23 Nov: 26 of 27 Pass, 0 Fail, step 22 not applicable (`docs/Manager-Note-Privacy-Manual-E2E-Test-Plan.md`). UAT with the next full move (D9).
**Traceability rows:** none — no Traceability row covers this fix (checked 23 Nov), so no scorecard change.
**Design / discussion:** Build & Test's write-up of 20 Nov and Plan & Chore's review of it
(Progress-Archive-2026-11, 20 Nov); the earlier notes-privacy work this builds on:
`docs/Opportunity-Notes-Privacy-Implementation-Plan.md` (built `552c0ee`, 5 Sep).

## Decisions

- D1. Only Manager Notes become private. Visits, calls, meetings, emails and
  ordinary notes stay visible as they are today — Haroon's ask, relayed by Basheer, 2026-11-20
- D2. A Manager Note is seen only by the rep it is about, the manager who wrote
  it, Admin, General Manager and the rep's managers — Basheer, 2026-11-20
- D3. This covers Manager Notes linked to an Opportunity as well as those that
  aren't — Basheer, 2026-11-20
- D4. "The rep's managers" means, for every Manager Note, linked or not: the SBU
  Manager of the rep's business unit, and any Area Manager who is above the
  rep in the reporting line or whose area covers the customer's zone. One rule
  for both kinds of note, so a linked note doesn't follow different viewers
  from an unlinked one — Basheer, 2026-11-20
- D5. People holding a split or an assigned reminder on an Opportunity no
  longer see the Manager Notes on it. This narrows, for Manager Notes only,
  Haroon's 5 Sep decision that split and reminder holders see every note on
  that Opportunity; all other notes keep that carve-out — Basheer, 2026-11-20
  (Haroon to be told, since it narrows his 5 Sep decision)
- D6. The 5 Sep rule stays for Manager Notes too: an Area Manager never sees a
  note about an SBU Manager, General Manager or Admin, and an SBU Manager
  never sees one about a General Manager or Admin — Basheer, 2026-11-20
- D7. No screen changes. A note someone may not see simply isn't in their
  list; no "private" label is added — Basheer, 2026-11-20
- D8. Before approval, a read-only check of who has a manager filled in and
  which zones each Area Manager covers, on Dev, and on UAT only after
  Basheer's yes. D4 depends on that data — Basheer, 2026-11-20. Dev done
  20 Nov (see Figures); UAT still to run, after his yes, before the UAT move
- D9. Dev first. UAT gets it with the next full move from `main`, not a
  separate hotfix (Basheer to settle with Haroon, since one of the three open
  notes on UAT is his) — Basheer, 2026-11-20 (next full move unless Haroon
  wants it sooner)
- D10. An Area Manager who sees a Manager Note only because their area covers
  the customer's zone must also be in the rep's business unit, as Opportunities
  already require. An Area Manager above the rep in the reporting line sees it
  whatever their business unit — Basheer, 2026-11-21
- D11. How the rule is tested: a read-only check on Dev of the 24 existing
  Manager Notes against all 12 active users (done 21 Nov, 0 mismatches), not
  temporary test notes. The zone-only Area Manager case, which Dev's existing
  notes don't cover, is tested in the Dev E2E by logging a Manager Note on the
  real screens; if that proves impossible, fall back to one temporary note in a
  rolled-back transaction, with his approval — Basheer, 2026-11-21

## Figures and sources

- 3 Manager Notes not linked to an Opportunity, open to every user on UAT —
  Plan & Chore's UAT read-only check, 20 Nov (`uat_activity_privacy_check.py`, rolled back)
- The 8 Sep note to Dhanushma, Secure Hospital, Hubli, written by Haroon — same check
- 1,786 of 2,809 UAT activities not linked to an Opportunity — same check
- Dev people data: 12 active users; every Sales Staff, Area Manager and SBU
  Manager has a manager filled in (Sales Staff → their Area Manager, Area
  Managers and the SBU Manager → Haroon); all 4 Area Managers have zones
  (Arun Adarsh: South Kerala plus Ernakulam, Palakkad, Thrissur; Nishad K V:
  North Kerala; Fazal: Kannur, Kasaragod, Kozhikode, Mangalore; Shruthi:
  Bangalore, Mandya); only one SBU Manager (Basheer K, Imaging); 24 Manager
  Notes, 10 unlinked, 18 written about someone else — Dev read-only query,
  20 Nov (`dev_manager_note_people_check.py`, Alembic 0066, rolled back)
- "Last contact" counts only visits, calls, meetings and emails —
  `backend/app/domains/reporting/repository.py:87`
- Every Manager Note is on a customer — `docs/Business-Rules.md` BR-ACT-03
  (customer required for every type except the six development types)

## 1. In plain terms

Today a Manager Note that isn't linked to an Opportunity shows on the
customer's Activity tab to everyone with a login, in both business units. A
linked one shows to everyone who can see that Opportunity, including
colleagues holding a split or a reminder on it.

After this change a Manager Note shows only to:
- the rep it is about;
- the manager who wrote it;
- Admin and the General Manager;
- the SBU Manager of the rep's business unit;
- an Area Manager who is above the rep in the reporting line, or who covers
  the customer's zone and is in the rep's business unit. For example, the Area
  Manager covering Hubli would see the note to Dhanushma at Secure Hospital
  even if Dhanushma doesn't report to them, provided they are in
  Dhanushma's business unit.

Everyone else no longer sees it, on the customer's Activity tab or on the
Opportunity's timeline. Comments on the note follow the note automatically:
whoever can't see the note can't see its comments. Nothing else changes —
visits, calls and ordinary notes stay exactly as visible as today.

A colleague working the same Opportunity will stop seeing Manager Notes on
it. That is intended, but reps may notice.

This lands on Dev first. UAT keeps today's behaviour until the next full
move, so the three open notes there stay visible until then.

### On a phone

No screen changes.

## 2. Build order

1. **Data check (read-only).** Dev: how many active reps have no manager
   filled in, and which zones each Area Manager covers. UAT: the same, only
   after Basheer's yes. If many reps have no manager, D4 still works through
   the zone path, but say so before building.
2. **Database rule.** One migration replacing the activity visibility rule:
   Manager Notes get the D2–D6 rule; every other type keeps today's rule
   unchanged. Basheer runs the upgrade himself:
   `! cmd //c "cd /d C:\Users\Basheer\GitHub\Calicut_Bio_Medicals\backend && .venv\Scripts\alembic.exe upgrade head"`.
   Then regenerate `docs/Physical-Schema.sql`.
3. **Check and tests.** Who sees what, checked on Dev against the existing
   Manager Notes (D11, done 21 Nov; matrix in section 6), plus a visit staying
   visible as today. Full backend tests, type check and lint. Commit (shown
   first, own approval).
4. **E2E on Dev.** Test plan written with the `cabio-e2e-testing` skill
   before this step.
5. **UAT** with the next full move (D9), its own approval.

Nothing stops working between steps: until step 2 lands, Dev behaves as today.

## 3. What could be affected

Every way the app reads activities, found by a code search of
`backend/app/domains`. All go through the database visibility rule except
where noted.
- (a) Customer's Activity tab (activity list by customer) — check before and after.
- (a) Opportunity's Activity timeline (activity list by Opportunity) — check before and after.
- (a) Activity list by project and the by-date activity list — check before
  and after; the screens that call them are named in step 1's code search.
- (c) Comments on an activity and reminders on an activity — follow the
  activity's visibility automatically; check one comment on a private note.
- (c) Notification list — only ever shown to the person notified and the
  person who caused it; no change, one check that the rep's bell still opens
  the note.
- Not reached: "last contact" on customer lists reads activities around the
  visibility rule, but counts only visits, calls, meetings and emails, never
  Manager Notes — no check.

## 4. Not in this plan (with reasons)

- Making visits, calls and ordinary notes private per business unit (option B)
  or per rep (option C) — Haroon chose only Manager Notes (D1).
- A "private" label on Manager Notes — not needed for the rule to work (D7).
- Documents and photos on an Opportunity — not part of Haroon's ask.

## 5. Business rules and records to update

- `docs/Business-Rules.md` BR-ACT-02 "Visibility": add who can see a Manager Note (D2–D6).
- `docs/Opportunity-Notes-Privacy-Implementation-Plan.md`: one line under its
  carve-out decision saying Manager Notes are narrowed by this plan (D5).
- `docs/Physical-Schema.sql` regenerated (step 2).
- Backlog: remove the "Activity log privacy hole" entry's Manager Note part
  once built; the rest of it (option A for other types) is recorded as decided.

## 6. Technical addendum

- Today's rule, `activity_select` (`docs/Physical-Schema.sql`:3398):
  `opportunity_id IS NULL OR user_id = uid OR cabio_app_has_split(opportunity_id)
  OR cabio_app_assigned_reminder(opportunity_id) OR (opportunity visible AND NOT
  tier-hidden)`.
- New rule (migration 0067, applied to Dev 21 Nov): `(activity_type <>
  'MANAGER_NOTE' AND <today's expression>) OR (activity_type = 'MANAGER_NOTE'
  AND (user_id = uid OR created_by = uid OR role IN ('Admin','General Manager')
  OR (NOT tier-hidden(user_id) AND ((role = 'SBU Manager' AND my SBU = the rep's
  SBU) OR (role = 'Area Manager' AND (cabio_app_is_above(user_id) OR (my SBU =
  the rep's SBU AND the note's account zone is under one of my user_zone rows
  via zone_closure)))))))` — the "my SBU = the rep's SBU" test on the zone path
  is D10; the reporting-line path has no SBU test. The rep is `activity.user_id`,
  the writer `created_by` (`activity/service.py:220`). No helper function was
  needed: `user_profile`, `account`, `user_zone` and `zone_closure` carry no
  row-level security, so the rule reads them inline. The tier-hidden test
  (D6) applies only to the SBU Manager and Area Manager branches, so the rep
  and the writer always see their own note.
- `cabio_app_is_above` (Physical-Schema:236) already walks the whole `manager_id` chain.
- Inherit automatically: `activity_comment_select` (3382), `reminder_select`
  (3804), `reminder_update` (3812). `notification_select` (3651) is
  recipient/creator only.
- `cabio_app_account_last_contact` (137) is SECURITY DEFINER but is called
  with `_CONTACT_ACTIVITY_TYPES` (`reporting/repository.py:87`), which excludes `MANAGER_NOTE`.
- Test matrix, linked and unlinked note: sees — rep, writer, Admin, GM, own-SBU
  SBU Manager, Area Manager above the rep, Area Manager covering the
  customer's zone and in the rep's business unit (D10); doesn't see — another
  rep, split holder, reminder holder, other SBU's SBU Manager, Area Manager in
  another zone not above the rep, Area Manager covering the zone but in the
  other business unit (D10), Area Manager when the note is about an SBU
  Manager. A visit stays visible as today.
- Result, Dev read-only check 21 Nov (D11), all 12 active users against the 24
  existing Manager Notes: 0 mismatches against the matrix worked out from the
  data; the 38 unlinked other activities still visible to everyone; no comment
  visible on a note the viewer can't see. Not covered by Dev's existing notes:
  the zone-only Area Manager grant (0 pairs) — to be covered in the E2E (D11).
