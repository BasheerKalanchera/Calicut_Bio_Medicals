# UAT: where the 44 "Never contacted" customers came from — 10 Nov 2026

Asked by Basheer, 10 Nov 2026: the Customer with No Activity report on UAT
shows 44 never-contacted customers and none has a "Logged by" name. Why, and
how did these customers get into the Accounts table without someone entering
them?

Source: one read-only query on UAT (migration 0065), run 10 Nov 2026 with
Basheer's go-ahead, in a single transaction that was rolled back. Nothing was
changed. Counts below are from that query.

## Answer in plain words

1. **"Logged by" is empty on purpose.** That column shows who recorded a
   customer's last visit, call, meeting or email. A never-contacted customer
   has no such record, so there is no name to show; the screen prints
   "Never contacted" and "—".
2. **Nobody entered them unseen.** All 44 were added through the app by named
   reps, one at a time, between 3 Aug and 6 Nov 2026. There is no bulk load.
   Only one of the 44 has no creator recorded ("Aster DM", 3 Aug).
3. **The person who added a hospital is not the person who logs contact.** A
   hospital added by a rep stays "never contacted" until someone logs a visit,
   call, meeting or email against it.

## Numbers (UAT, 10 Nov 2026)

- Hospitals in total: 800. Never contacted (Admin view, all SBUs): 44.
- Never-contacted customers by creator:

| Creator | Count |
|---|---|
| Gopika pv | 23 |
| Shruthi | 4 |
| Arun Adarsh | 3 |
| Basheer K | 3 |
| Rudrappa Deevatagi | 3 |
| Naeem | 2 |
| Nishad K V | 1 |
| Om Hiremath | 1 |
| Ravi Kumar | 1 |
| Dhanushma | 1 |
| Haroon Sidheeq | 1 |
| no creator recorded | 1 |

- Gopika pv's 23 are mostly Wayanad and Malappuram hospitals added on 7–9 Sep;
  Gopika pv added 119 hospitals in total.
- Hospitals with no creator recorded, whole table: 2 (one of them is in the 44).

## Things noticed in the list

- **Test or duplicate entries:** "Duplicate" (Naeem, 10 Sep); "Radians health
  care Thrissur" twice, one second apart (Arun Adarsh, 5 Oct), which looks like
  a double submit; "Koyilandy New project" (Nishad K V) and "Soiicon 2026"
  (Shruthi) look like non-hospital entries.
- **Activities that do not count as contact:** "Soiicon 2026" has 4
  activities; it is a conference (Basheer), not a hospital, and none of them
  is a visit, call, meeting or email. "Chalukya hospital" has 1 activity, a
  Meeting, but it is dated 28 Nov 2026 (entered 6 Nov by Ravi Kumar). A
  future-dated activity doesn't count (Exception Report D12), so the hospital
  shows as never contacted. The note text reads like a past meeting, and
  Basheer confirmed the date was typed wrongly. The app allowed it: the date
  picker has no latest date, the server does not check, and an activity can't
  be edited. Open decision: correct this one date on UAT and/or block future
  dates (see the Build & Test handover and Progress-Archive 10 Nov).
- **Opportunities with no contact logged:** Triveni Diagnostic Bagalakunte,
  Chiraag Diagnostics Devanahalli and Cochin surgicals (1 each).
- The report has no "Created by" column.

## The 44 customers

Creation date is the UTC date. "Act." = activities of any type; "Opp." =
Opportunities.

| # | Created | Creator | Zone | Hospital | Act. | Opp. |
|---|---|---|---|---|---|---|
| 1 | 2026-08-03 | (none) | Bangalore | Aster DM | 0 | 0 |
| 2 | 2026-08-03 | Shruthi | Bangalore North | Ramaiah Medical College Hospital | 0 | 0 |
| 3 | 2026-08-30 | Basheer K | Malappuram | al shifa | 0 | 0 |
| 4 | 2026-09-02 | Om Hiremath | Bangalore North | Triveni Diagnostic, Bagalakunte | 0 | 1 |
| 5 | 2026-09-03 | Shruthi | Bangalore North | Chiraag  Diagnostics,Devanahalli | 0 | 1 |
| 6 | 2026-09-03 | Shruthi | Tumakuru | Rangaswamy | 0 | 0 |
| 7 | 2026-09-03 | Rudrappa Deevatagi | Bangalore East | Archish Fertility Centre & IVF Centre Kundalahalli | 0 | 0 |
| 8 | 2026-09-05 | Rudrappa Deevatagi | Bangalore East | Forever Women’s Clinic | 0 | 0 |
| 9 | 2026-09-05 | Dhanushma | Bangalore South | Sparsh Hospital | 0 | 0 |
| 10 | 2026-09-07 | Gopika pv | Wayanad | Arogya scan centre | 0 | 0 |
| 11 | 2026-09-07 | Gopika pv | Wayanad | K J medical trust hospital | 0 | 0 |
| 12 | 2026-09-07 | Gopika pv | Wayanad | Karuna diagnostics clinic | 0 | 0 |
| 13 | 2026-09-07 | Gopika pv | Wayanad | FATIMA MATA  MISSION HOSPITAL | 0 | 0 |
| 14 | 2026-09-08 | Basheer K | Bangalore East | Sanjeevini Clinic, Panthur | 0 | 0 |
| 15 | 2026-09-08 | Basheer K | Bangalore East | The Nurture MultiSpeciality Clinic | 0 | 0 |
| 16 | 2026-09-08 | Nishad K V | Kozhikode | Koyilandy New project | 0 | 0 |
| 17 | 2026-09-09 | Gopika pv | Wayanad | IQRAA Hospital Sulthan Bathery | 0 | 0 |
| 18 | 2026-09-09 | Gopika pv | Wayanad | Vinayaka hospital Sulthan Bathery | 0 | 0 |
| 19 | 2026-09-09 | Gopika pv | Wayanad | Victory Hospital | 0 | 0 |
| 20 | 2026-09-09 | Gopika pv | Wayanad | Health wave diagnostics and lab (HDL) | 0 | 0 |
| 21 | 2026-09-09 | Gopika pv | Wayanad | Meera speciality clinic and diagnostic centre | 0 | 0 |
| 22 | 2026-09-09 | Gopika pv | Wayanad | St:Joseph's Mission hospital | 0 | 0 |
| 23 | 2026-09-09 | Gopika pv | Wayanad | Vinayaka jyothi hospital | 0 | 0 |
| 24 | 2026-09-09 | Gopika pv | Wayanad | Spectra diagnostics | 0 | 0 |
| 25 | 2026-09-09 | Gopika pv | Wayanad | Micro health laboratories | 0 | 0 |
| 26 | 2026-09-09 | Gopika pv | Wayanad | Govt: Medical college wayanad | 0 | 0 |
| 27 | 2026-09-09 | Gopika pv | Wayanad | St Vincent's hospital | 0 | 0 |
| 28 | 2026-09-09 | Gopika pv | Wayanad | MDC XRAY AND LAB | 0 | 0 |
| 29 | 2026-09-10 | Naeem | Malappuram | Duplicate | 0 | 0 |
| 30 | 2026-09-11 | Gopika pv | Wayanad | DW WIMS | 0 | 0 |
| 31 | 2026-09-15 | Gopika pv | Malappuram | Nahas Hospital, parappanangadi | 0 | 0 |
| 32 | 2026-09-15 | Gopika pv | Malappuram | Janamaithri medical lab | 0 | 0 |
| 33 | 2026-09-18 | Gopika pv | Malappuram | Gov taluk head quarter hospital | 0 | 0 |
| 34 | 2026-09-19 | Shruthi | Bangalore | Soiicon 2026 | 4 | 0 |
| 35 | 2026-09-19 | Gopika pv | Malappuram | Your Center radiology and diagnostics centre, tirur | 0 | 0 |
| 36 | 2026-09-30 | Arun Adarsh | Ernakulam | Cochin surgicals | 0 | 1 |
| 37 | 2026-10-05 | Arun Adarsh | Thrissur | Radians health care Thrissur | 0 | 0 |
| 38 | 2026-10-05 | Arun Adarsh | Thrissur | Radians health care Thrissur | 0 | 0 |
| 39 | 2026-10-07 | Gopika pv | Kannur | Medical Laboratories | 0 | 0 |
| 40 | 2026-10-13 | Gopika pv | Kasaragod | Newlife hospital, kanhangad | 0 | 0 |
| 41 | 2026-10-16 | Haroon Sidheeq | Malappuram | Rajagiri Hospital Edavanna | 0 | 0 |
| 42 | 2026-10-23 | Naeem | Malappuram | Al Salama Hospital Kalikavu | 0 | 0 |
| 43 | 2026-10-26 | Rudrappa Deevatagi | Bangalore East | Global Health Diagnostics KS | 0 | 0 |
| 44 | 2026-11-06 | Ravi Kumar | Tumakuru | Chalukya hospital | 1 | 0 |

## Technical addendum

- "Logged by" is `last_contact_by` from `cabio_app_account_last_contact()`
  (migration 0065), which returns NULL when no activity of type VISIT, CALL,
  MEETING or EMAIL exists. The screen shows `row.last_contact_by ?? "—"`
  (`sales-os-app/src/screens/NoActivityCustomersReportScreen.tsx:243`); the
  "never contacted" split is in `reporting/service.py` `no_activity_customers`.
- Creator is `account.created_by` joined to `user_profile.display_name`;
  creation time is `account.created_at`. The `account` table has no column for
  how a row was created.
- The query impersonated an active Admin through transaction-local
  `app.current_*` settings (verified via `cabio_app_uid()`,
  `cabio_app_role_name()`), with `p_sbu_id` NULL, matching the Admin/GM
  all-SBU view. UAT script kept in the session scratchpad, not in the repo.
- No import script or migration in the repo inserts real accounts; the only
  `INSERT INTO account` hit is `docs/Seed-Data-Demo.sql`.
