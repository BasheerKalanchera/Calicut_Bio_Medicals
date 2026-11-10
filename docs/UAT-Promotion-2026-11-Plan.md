# UAT Promotion — November 2026 — Plan

**Status:** Done 2026-11-10 — UAT on `0756234`, database at 0065; outcome
in section 7. Every decision answered 2026-11-09 (Basheer); was Draft.
**Traceability rows:** none change status by the move itself; each
feature's own row already records it.
**Design / discussion:** model `docs/UAT-Promotion-2026-10-Plan.md`;
procedure `docs/Deployment-Topology.md`; reason for the move:
`docs/Target-Plan-Training-Implementation-Plan.md` (Haroon practises brand
targets and sets his Area Managers' targets on UAT).

## Decisions

- D1. **What goes:** `main` up to `0756234`, without `2ac7f25` (the
  temporary name in the app header, training only) — Basheer, 2026-11-08
- D2. **The four target fixes and Haroon's screen suggestions** are not in
  this move; they go in a second, smaller move before Session 3. Managers
  don't save next-quarter plans until then — Basheer, 2026-11-08
- D3. **When:** an early weekday morning, before the team starts; day not
  yet chosen (Basheer told Haroon "early morning, weekdays") — Basheer,
  2026-11-09. Day: **Tuesday 10 Nov, 07:00 IST** — Basheer, 2026-11-09
- D4. **Backup:** a fresh backup on the morning of the move, after both
  services are switched off — the rollback point (replaces the 8 Nov idea
  of reusing that day's 16:48 backup). It is also that day's daily UAT
  backup; no second one — Basheer, 2026-11-09
- D5. **Practice run on a copy:** skip it; instead a read-only check that
  UAT is at 0063, the tables and columns 0065 reads exist, and the 0065
  lookup doesn't already exist. Only 2 database changes, both add-only
  — Basheer, 2026-11-09
- D6. **Downtime:** both Render services switched off for the whole move;
  tell the team **1 hour** (as in October) — Basheer, 2026-11-09
- D7. **New passwords in the same window**, so the team is interrupted
  once: everyone still active gets their own password, in this order:
  Haroon, the five Area Managers (Shruthi, Fazal, Arun Adarsh, Nishad K V,
  Naeem — Basheer, 2026-11-09), then top down from the User Directory;
  each password sent privately before the team starts — Basheer,
  2026-11-09. **Everyone signed out before the password
  changes**, with Render still off: `delete from auth.sessions returning
  user_id;` in the UAT SQL Editor, 14 rows (Basheer ran it 2026-11-10;
  replaces "no sign-outs" decided earlier the same morning). Renewal
  passes go with their session (`auth.refresh_tokens` ON DELETE CASCADE,
  Dev catalog 2026-11-10); a short pass already issued lasts to its
  expiry, about an hour by Supabase's default — Basheer, 2026-11-10.
  The test Marketing User login keeps its old password, no change
  needed — Basheer, 2026-11-10
- D8. **Optional pilot before the day:** Haroon and Latheef Bhai get their
  new passwords first (they sign out first, then test) — Basheer,
  2026-11-09
- D9. **Team message** (Claude drafts once the day is fixed, Haroon sends
  the day before): the hour the app is off; "a new password from Basheer
  that morning"; managers don't save next-quarter plans yet (D2); the app
  now opens on My Work — Basheer, 2026-11-09. Sent 9 Nov by Basheer
  (team WhatsApp group), timing only: app off 7–8 am Tue 10 Nov, asking
  for any issue with the timing. Password, managers' note and what's new
  not in it yet
- D10. **Read-only check for a rejected plan this quarter** before the
  move (fix 4 matters only if there is one), run with the step-2 version
  check — Basheer, 2026-11-09
- D11. **Client scorecard republish** (both pages) after the move, exact
  diff shown first, as in October — Basheer, 2026-11-09

## Figures and sources

- UAT is on `8b2ec8a` — `git rev-parse origin/uat`, 2026-11-09
- 173 commits move (`origin/uat..0756234`), a fast-forward —
  `git rev-list --count`, `git merge-base --is-ancestor`, 2026-11-09
- 2 database changes, 0064 and 0065 — files in `backend/alembic/versions`
  that differ between `origin/uat` and `0756234`, 2026-11-09
- UAT database expected at 0063 — October plan outcome (25 Oct); re-read
  on the day
- No new libraries: `backend/pyproject.toml` and `package-lock.json`
  unchanged; `package.json` differs only in its lint script — `git diff
  origin/uat 0756234`, 2026-11-09
- Feature list in section 1 — `feat:`/`fix:` commit messages in
  `origin/uat..0756234`, 2026-11-09
- 18 sign-ins on UAT — Supabase Authentication → Users, seen 9 Nov
- Basheer's own password changed 9 Nov 07:45 IST — SQL Editor result,
  seen 9 Nov
- App signs out after 1 hour idle — `sales-os-app/src/hooks/useIdleLogout.ts:7`
- People in section 3 — October plan's smoke-test list (UAT User
  Directory, 24 Oct); to re-check against UAT's directory before the day

## 1. In plain terms

UAT runs the app as it was on 25 October. Everything built and tested on
Dev since then moves across in one go:

- **Annual Target Planning, Part 2** — Target vs Actuals Year view, plan
  notifications, Brands Billing to Cabio, typing one brand quarter by hand.
- **Target & Coverage Planning in tabs**, including My Targets and Needs
  Your Approval.
- **Target vs Actuals redesign** — Year and Quarter views, a person's own
  screen, the Overdue tab.
- **My Work** — each person's lists in one place; the app now opens here
  (except for Marketing Users).
- **Hospital and Project next-action rule** — close your own open next
  action before logging a new one there; Project screen in tabs with a
  Next Actions tab.
- **Customer with No Activity** report.
- **Manager Note** — only managers and above can log one.
- **Phone layouts** — many screens moved to the new standard look, so they
  fit a phone.
- Smaller fixes: Stagnant Opportunities, Insights Overdue sort, sign-out.

Three things happen on the morning:
1. **The database gets 2 changes.** One adds a "typed by hand" mark to
   brand quarter targets (all existing ones start as "not typed by hand").
   The other adds a lookup the Customer with No Activity report uses.
   Neither changes an existing Opportunity, hospital or activity.
2. **The app's code is updated**, screens and server.
3. **Everyone gets their own password** (D7).

**Safety net:** a fresh backup that morning (D4). If anything goes wrong, UAT is restored
from it and the old code is put back.

### On a phone

No screen changes beyond what each moved feature already approved.

## 2. Build order

Before the day:
1. Choose the day (D3); Haroon tells the team (D9).
2. Read-only UAT check, with your go-ahead: database version, the 0065
   pre-check (D5), rejected plans this quarter (D10).
3. Claude prepares: the after-move check script (scratchpad), the
   password commands per person (no passwords in them), the team message.
4. Optional pilot: Haroon and Latheef Bhai (D8).

On the day (**B** = Basheer; **C** = Claude, after your go-ahead):

| # | Who | Step | Time |
|---|---|---|---|
| 1 | B | Switch off both Render services (`calicut-bio-medicals`, `cabio-sales-os-uat-frontend`) | 2 min |
| 2 | C | Read-only "before" check: UAT at 0063; saves counts of Opportunities, value total, activities, hospitals, target plans | 2 min |
| 3 | C | Fresh backup (`scripts\backup_uat.ps1`) — the rollback point (D4) | 2 min |
| 4 | B | Run the 2 database changes (commands in section 6) | 1 min |
| 5 | C | After-move checks (read-only): "ALL CHECKS PASSED" or stop | 2 min |
| 6 | B | Push the code (`git push origin 0756234:uat`), switch both services on, confirm both are Live on that commit | 5–10 min |
| 7 | B | New passwords, one person at a time (D7; everyone signed out first); Claude watches each result | 15–20 min |
| 8 | B | Smoke test, look only, nothing saved (section 3), signing in with the new passwords | 15 min |
| 9 | B | Send each person their password privately; tell Haroon UAT is back | — |

**Rollback** (step 4 or 5 fails, or step 8 finds a problem that can't be
fixed forward): restore the backup with `scripts\restore_uat.ps1`; if the
code was already pushed, push `8b2ec8a` back. Passwords are not affected
by a restore of the app's data: the backup holds only the app's tables,
not the sign-in details (`scripts/backup_uat.ps1:117`, `pg_dump
--schema=public`; checked 2026-11-09). Basheer's call on the day.

## 3. What could be affected

Smoke test (step 8), look only (open and **Cancel**, never save):

- **Rudrappa Deevatagi** (Imaging rep):
  1. The app opens on **My Work**.
  2. **Log Activity** on a hospital where he has an open next action:
     the warning and close form show; Cancel. Manager Note isn't offered.
  3. **Target & Coverage Planning:** tabs, My Targets loads.
- **Shruthi** (Imaging Area Manager):
  4. **Target & Coverage Planning:** Team Targets and Team Plans show her
     team.
  5. **Target vs Actuals:** Year and Quarter views load, Imaging only.
- **Basheer K** (Admin):
  6. **Customer with No Activity:** loads with a count.
  7. **Brand Target Tracking:** loads.
  8. **A Project:** opens in tabs, Next Actions tab loads.
- **Haroon Sidheeq** (GM):
  9. **Target vs Actuals:** both SBUs and the company row, Year view.
  10. **Target & Coverage Planning:** opens on Needs Your Approval if
      anything is waiting.

## 4. Not in this plan (with reasons)

- The four target fixes and Haroon's suggestions — second move (D2).
- `2ac7f25`, the header name — training only (D1).
- "Change my password" screen — not built; Backlog entry to add.
- User Manual and in-app help — own move later (User Manual plan D15).

## 5. Business rules and records to update

After the move, same day: this doc records the real outcome; each moved
plan's Status line says "on UAT"; Progress-Archive entry and retro.
Scorecard updated with the moved features, then both pages republished
(D11).

## 6. Technical addendum

- Code: `origin/uat` `8b2ec8a` → `0756234` (fast-forward).
- Migrations:

| Rev | What | Touches existing rows? |
|---|---|---|
| 0064 | `brand_vendor_target.set_by_hand` boolean, not null, default false | Existing rows get false |
| 0065 | `cabio_app_account_last_contact(uuid[], uuid, text[])`, SQL, STABLE, SECURITY DEFINER | No |

- `backend/alembic/env.py` runs both in one transaction: both apply or
  neither.
- D5 pre-check reads: `alembic_version`; columns 0065 uses on `activity`,
  `user_profile`, `opportunity_item`, `product`, `opportunity`,
  `opportunity_status`; functions `cabio_app_role_name()`,
  `cabio_app_sbu_id()`; and that `cabio_app_account_last_contact` doesn't
  exist yet.
- Step 4 commands (Git Bash, repo root):
  ```bash
  set -a; source backend/.env.uat; set +a
  unset CORS_ORIGINS
  cd backend
  .venv/Scripts/python.exe -m alembic upgrade head
  .venv/Scripts/python.exe -m alembic current     # expect: 0065 (head)
  ```
- Step 5 checks: `alembic_version` = 0065; counts and value totals equal
  step 2's; `brand_vendor_target.set_by_hand` all false; the function
  exists.
- Step 7, per person, in the UAT SQL Editor:
  `update auth.users set encrypted_password = extensions.crypt('…',
  extensions.gen_salt('bf', 10)), updated_at = now() where email = '…'
  returning email, updated_at;` — one row each. Sign-ins ended for
  everyone beforehand (D7, 2026-11-10). Delete the saved query afterwards.

## 7. Outcome (2026-11-10)

- Steps 1–9 done the same morning. 9 plans' Status lines say "on UAT
  2026-11-10".
- Rollback point: the daily backup `cabio_uat_2026-11-10_0658.dump`, taken
  before step 1 (Drive copy by Basheer). The step 2 check found nothing
  changed since 06:58, so step 3 was not repeated (Basheer).
- Step 2 before-check: UAT at 0063; 254 Opportunities ₹3,669.24 L; 2,541
  activities; 800 hospitals; 15 target plans ₹2,355.40 L; 24 brand vendor
  targets ₹1,518.25 L.
- Steps 4–5: 0063 → 0065 applied by Basheer; after-check ALL CHECKS
  PASSED, counts and totals unchanged, `set_by_hand` false on every row,
  the function exists.
- Step 6: `uat` 8b2ec8a → 0756234 (fast-forward, 173 commits, `2ac7f25`
  not included); both services Live.
- **Differences from the plan:**
  - Everyone was signed out before the passwords (D7, changed that
    morning): 14 sessions ended.
  - Render was switched back on with about half the passwords done,
    because people began signing in as passwords were shared, so it was
    on before the step 8 check (Basheer).
- Step 7: 13 passwords changed by email (Basheer). Two first tries matched
  no one (capital letters, a missing letter) and changed nothing.
- Step 8: 10 of 10 Pass. Empty My hospitals for Rudrappa and Basheer is
  expected (no approved plan this quarter); nothing waiting for Haroon,
  as Fahad's plan waits for Fazal, his manager.
- Step 9: the team note with the feature list was sent, and each person
  got their password one to one on WhatsApp (Basheer).
