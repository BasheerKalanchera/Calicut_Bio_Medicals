# UAT Data Quality Findings — 2026-09-15

**Correction notice:** the first version of this report (same day) had a
real bug — the RLS impersonation used to get full company-wide visibility
silently stopped working after the first query, so every check touching
`opportunity` or `reminder` (checks 2, 3, 4, 7a, 7c, 8) was wrong, not just
the one row Basheer caught ("ALOHA HOSPITAL Kizshery" showing as dead
despite having an opportunity). Root cause and the corrected numbers below;
see `scripts/uat_data_quality_check.py`'s comments for the technical fix.

**Scope:** read-only, UAT's app-role connection (`backend/.env.uat`),
impersonating an active Admin/GM's RLS context so results cover the whole
company. No writes, no admin/superuser connection used. Totals sanity-
checked against real table counts (286 accounts, 128 opportunities, 516
activities, 431 reminders) before trusting any result this time.

## Summary — corrected

| # | Check | First report (wrong) | **Corrected** |
| :---: | :--- | :---: | :---: |
| 1 | Duplicate account names | 0 | 0 — clean |
| 2 | Lakhs/Rupees value mixup | 0 | **24** |
| 3 | Dead accounts (zero Opportunities, zero Activity) | 81 | **34** |
| 4 | Opportunities with zero Activity | 0 | **56** |
| 5 | Splits not summing to 100% | 0 | 0 — clean |
| 6 | WON/LOST deals edited after close | 0 | 0 — clean |
| 7a | Missing mandatory next action (BR-ACT-04) | 22 | **82** |
| 7b | Short/generic notes | 9 | **20** |
| 7c | Likely double-submits | 0 | 14 candidates, **~4 genuine** after reading the actual note text — see below |
| 8 | Order-stage/Won deal, PO set, no Activity | 0 | **5** |

Checks 1, 5, 6 didn't depend on the broken table and were correct both
times.

## What actually broke

`set_config('app.current_user_id', ..., true)` sets the value **local to
one transaction**. The script ran under `autocommit=True`, so every
`cur.execute()` after the one that set the context started a brand-new
transaction — the impersonated identity was gone before the very next
query ran. `cabio_app_uid()` returned `NULL` for the rest of the session,
so any RLS policy keyed on it (the `opportunity` table's own policy
explicitly grants Admin/GM unrestricted access, but only once the identity
resolves at all) fell through to nothing. Fixed by using `false`
(session-scoped) instead of `true`, and the script now verifies
`cabio_app_uid()` actually resolves before running anything, aborting
loudly instead of silently reporting zero.

Also fixed a second, independent bug found while re-verifying check 7c:
the double-submit query compared timestamps with plain subtraction
(`a2.created_at - a1.created_at < interval '5 minutes'`), which is also
true for a large *negative* interval — so it matched activities days or
weeks apart, not just minutes. Fixed with `ABS(EXTRACT(EPOCH FROM ...))`.

---

## 2. Opportunities with implausible values (possible Lakhs/Rupees mixup) — 24

Same pattern as the 12 found 2026-09-11 (`docs/Backlog.md`) — a Rupee
amount typed directly into the Lakhs field. All 24 below are suspiciously
round and divide cleanly by 100,000 into a sensible equipment price.

| # | Product | Account | Value (as entered) |
| :---: | :--- | :--- | ---: |
| 1 | SonoScape S50-ELITE | Kanachur Institute of Medical Science | 4,200,000.00 |
| 2 | SonoScape S70I | ULLAL DIAGNOSTIC CENTRE | 4,000,000.00 |
| 3 | SonoScape S70I | Mangala Hospital Manglore | 3,800,000.00 |
| 4 | SonoScape S70I | Ambalpadi Diagnostic Centre UDUPI | 3,800,000.00 |
| 5 | City Nursing Home | City Nursing Home | 2,700,000.00 |
| 6 | SonoScape P40-ELITE | Benaka Health Centre | 2,500,000.00 |
| 7 | 30 Bed Hospital | NIMS Medicity , Neyyattinkara | 1,700,000.00 |
| 8 | Critical care products | EMS cooperative hospital Cherpulassery | 1,685,000.00 |
| 9 | SonoScape E2 | Benaka Health Centre | 1,500,000.00 |
| 10 | SonoScape S11PLUS | Dhanvantri Hospital | 1,200,000.00 |
| 11 | OT & ICU products | Care Land hospital poovattuparambu | 1,110,000.00 |
| 12 | SonoScape S11PLUS | Hitha Multi-speciality Hospital | 1,100,000.00 |
| 13 | Anesthesia machine & ix etco2 monitor | Malabar Medical College ulliyeri (MMC) | 1,050,000.00 |
| 14 | Magnamed Oxymag | Tiruvalla Medical Mission Hospital (TMM), Thiruvalla | 800,000.00 |
| 15 | SonoScape E1 Exp | Pragathi Hospital Puttur | 800,000.00 |
| 16 | SonoScape S50-ELITE | Yenepoya Medical College Hospital | 300,000.00 |
| 17 | Edan CTG machine | PMSA Cooperative hospital Malappuram | 140,000.00 |
| 18 | ICU products | KMC hospital kuttiyadi | 128,000.00 |
| 19 | Anesthesia boyles | Eranad hospital manjeri | 120,000.00 |
| 20 | Edan se1200 ECG machine | Cooperative hospital vadakara | 110,000.00 |
| 21 | Edan Ecg machine | Kmct Medical college Hospital | 105,000.00 |
| 22 | Edan Ecg machine | Aster Mims Mother Areekode | 105,000.00 |
| 23 | Edan H100B Pulseoxymeter | Malabar Hospital Erinchipalam Kozhikode | 28,000.00 |
| 24 | Edan H100B Pulseoxymeter | St. James' Hospital, Chalakudy | 25,000.00 |

## 3. Dead accounts (zero Opportunities, zero Activity) — 34

**"ALOHA HOSPITAL Kizshery" no longer appears here** — confirmed it does
have an opportunity, exactly as Basheer flagged.

| # | Account | Zone | Type | Created |
| :---: | :--- | :--- | :--- | :--- |
| 1 | al shifa | Malappuram | MULTISPECIALITY_HOSPITAL | 2026-08-30 |
| 2 | Archish Fertility Centre & IVF Centre Kundalahalli | Bangalore East | SPECIALTY_HOSPITAL | 2026-09-03 |
| 3 | Arogya scan centre | Wayanad | DIAGNOSTIC_CENTER | 2026-09-07 |
| 4 | Aster DM | Bangalore | MULTISPECIALITY_HOSPITAL | 2026-08-03 |
| 5 | DMS Hospital chelari | Malappuram | MULTISPECIALITY_HOSPITAL | 2026-09-15 |
| 6 | Duplicate | Malappuram | SPECIALTY_HOSPITAL | 2026-09-10 |
| 7 | DW WIMS | Wayanad | MEDICAL_COLLEGE_HOSPITAL | 2026-09-11 |
| 8 | FATIMA MATA  MISSION HOSPITAL | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-07 |
| 9 | Forever Women's Clinic | Bangalore East | CLINIC | 2026-09-05 |
| 10 | Ganga hospital | Tumakuru | — | 2026-09-02 |
| 11 | Govt: Medical college wayanad | Wayanad | MEDICAL_COLLEGE_HOSPITAL | 2026-09-09 |
| 12 | Health wave diagnostics and lab (HDL) | Wayanad | DIAGNOSTIC_CENTER | 2026-09-09 |
| 13 | IQRAA Hospital Sulthan Bathery | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-09 |
| 14 | Iqraa Hospital Vazhakkad | North Kerala | MULTISPECIALITY_HOSPITAL | 2026-08-06 |
| 15 | Janaseva mission hospital | Malappuram | MULTISPECIALITY_HOSPITAL | 2026-09-15 |
| 16 | K J medical trust hospital | Wayanad | SPECIALTY_HOSPITAL | 2026-09-07 |
| 17 | Karuna diagnostics clinic | Wayanad | DIAGNOSTIC_CENTER | 2026-09-07 |
| 18 | Koyilandy New project | North Kerala | CLINIC | 2026-09-08 |
| 19 | MDC XRAY AND LAB | Wayanad | DIAGNOSTIC_CENTER | 2026-09-09 |
| 20 | Meera speciality clinic and diagnostic centre | Wayanad | DIAGNOSTIC_CENTER | 2026-09-09 |
| 21 | Micro health laboratories | Wayanad | DIAGNOSTIC_CENTER | 2026-09-09 |
| 22 | Nahas Hospital, parappanangadi | Malappuram | MULTISPECIALITY_HOSPITAL | 2026-09-15 |
| 23 | Ramaiah Medical College Hospital | Bangalore | MEDICAL_COLLEGE_HOSPITAL | 2026-08-03 |
| 24 | Rangaswamy | Tumakuru | DIAGNOSTIC_CENTER | 2026-09-03 |
| 25 | Sanjeevini Clinic, Panthur | Bangalore East | CLINIC | 2026-09-08 |
| 26 | Siddhartha medical College | Tumakuru | MEDICAL_COLLEGE_HOSPITAL | 2026-09-09 |
| 27 | Sparsh Hospital | Bangalore South | MULTISPECIALITY_HOSPITAL | 2026-09-05 |
| 28 | Spectra diagnostics | Wayanad | DIAGNOSTIC_CENTER | 2026-09-09 |
| 29 | St Vincent's hospital | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-09 |
| 30 | St:Joseph's Mission hospital | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-09 |
| 31 | The Nurture MultiSpeciality Clinic | Bangalore East | MULTISPECIALITY_HOSPITAL | 2026-09-08 |
| 32 | Victory Hospital | Wayanad | SPECIALTY_HOSPITAL | 2026-09-09 |
| 33 | Vinayaka hospital Sulthan Bathery | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-09 |
| 34 | Vinayaka jyothi hospital | Wayanad | MULTISPECIALITY_HOSPITAL | 2026-09-09 |

Row 6 ("Duplicate") is almost certainly a placeholder/test record, same
pattern as the 2 junk "Duplicate" rows Basheer deleted live 2026-09-05.

## 4. Opportunities with zero Activity logged — 56

Heavily concentrated on one rep: **Om Hiremath owns 15 of the 56** (all
fresh "New USG Machine requirement" Leads created 2026-09-01/02 — looks
like a batch import or bulk-entry session that never got individual
follow-up activity logged). Full list, 56 rows:

| # | Opportunity | Account | Stage | Status | Owner | Created |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | OT & ICU products | Care Land hospital poovattuparambu | Negotiation | ACTIVE | Nishad K V | 2026-09-15 |
| 2 | SonoScape E10 | Father Muller Medical College Hospital | Lead | ACTIVE | Fahad | 2026-09-15 |
| 3 | SonoScape E3 | Tejaswini Hospital | Lead | ACTIVE | Fahad | 2026-09-12 |
| 4 | Edan se1200 ECG machine | Cooperative hospital vadakara | Qualified | ACTIVE | Nishad K V | 2026-09-12 |
| 5 | SurgiDerma hospital | Surgi Derma  Kalyan Nagar | Negotiation | ACTIVE | Dhanushma | 2026-09-11 |
| 6 | New USG Machine | Madhu Super speciality Hospital, Vijaynagar | Lead | ACTIVE | Om Hiremath | 2026-09-11 |
| 7 | P9 Elite | Swasthya Multi Speciality and Cardiac Centre, Tavarakere | Lead | ACTIVE | Om Hiremath | 2026-09-09 |
| 8 | SM Diagnostic laboratory | SM Diagnostic laboratory JP Nagar | Lead | ACTIVE | Dhanushma | 2026-09-09 |
| 9 | Portable monitor IM20 | EMC Palarivatom | Lead | ACTIVE | Arun Adarsh | 2026-09-08 |
| 10 | S50elite | Dr.Sanjeev Gowda, Bangalore | Order | ACTIVE | Shruthi | 2026-09-08 |
| 11 | OXYMAG,EDAN MONITORS | FELLOWSHIP MISSION HOSPITAL,KUMBANAD | Lead | ACTIVE | Vivek | 2026-09-08 |
| 12 | EDAN IM50 MONITOR | VPS LAKESHORE HOSPITAL | Lead | ACTIVE | Arun Adarsh | 2026-09-07 |
| 13 | Anesthesia machine & ix etco2 monitor | Malabar Medical College ulliyeri (MMC) | Lead | ACTIVE | Nishad K V | 2026-09-07 |
| 14 | Chikkaballapur tender | Bangalore Medical System | Lead | ACTIVE | Shruthi | 2026-09-04 |
| 15 | Max300 | SP FORT HOSPITAL, TRIVANDRUM | Demo | ACTIVE | Vivek | 2026-09-04 |
| 16 | Sonoscape E2 | Secure Hospital ,Hubli | Demo | ACTIVE | Dhanushma | 2026-09-03 |
| 17 | SonoScape S70I | Ambalpadi Diagnostic Centre UDUPI | Negotiation | ACTIVE | Fahad | 2026-09-03 |
| 18 | Sonoscape P25 Elite | KMCT Hospital Kasaragode | Lead | ACTIVE | Haroon Sidheeq | 2026-09-03 |
| 19 | P40elite usg machine | Chiraag  Diagnostics,Devanahalli | Demo | ACTIVE | Shruthi | 2026-09-03 |
| 20 | P9elite and S11plus | Bangalore Medical System | Order | ACTIVE | Shruthi | 2026-09-03 |
| 21 | New USG Machine requirement | Sri Ram hospital, sunkadakatte | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 22 | New USG Machine requirement | Sri Hanuradha Hospital, Yelahanka new town | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 23 | New USG Machine requirement | Sahara diagnostic, Nagavara | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 24 | New USG Machine requirement | ChanRe diagnostic, Malleswaram | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 25 | New USG Machine requirement | Sumukha diagnostic, srirampura | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 26 | New USG Machine requirement | Bangalore multi-speciality hospital, HBR Layout | Qualified | ACTIVE | Om Hiremath | 2026-09-02 |
| 27 | New USG Machine requirement | Triveni Diagnostic, Bagalakunte | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 28 | New USG Machine requirement | Narmada multi-speciality hospital, yelahanka | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 29 | New USG Machine requirement | Rajmahal Vilas Hospital, Sanjaynagar | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 30 | New USG Machine requirement | Vivek scan centre, dasarahalli | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 31 | New USG Machine requirement | Ganesh Diagnostic, yeahvanthpur | Lead | ACTIVE | Om Hiremath | 2026-09-02 |
| 32 | New USG Machine requirement | Sanjeevni Hospital, Mahalaxmi layout | Qualified | ACTIVE | Om Hiremath | 2026-09-02 |
| 33 | Magnamed max 300 icu ventilator | Jubilee mission medical college Thrissur | Qualified | ACTIVE | Arun Adarsh | 2026-09-02 |
| 34 | New USG Machine requirement | DMS Multi-speciality hospital | Lead | ACTIVE | Om Hiremath | 2026-09-01 |
| 35 | New USG Machine requirement | Swasya health care and diagnostic | Lead | ACTIVE | Om Hiremath | 2026-09-01 |
| 36 | New USG Machine requirement | Pristine Hospital, rajaji nagar | Lead | ACTIVE | Om Hiremath | 2026-09-01 |
| 37 | Oxymag Transport Ventilator | KIMS Alshifa Super Speciality Hospital- Perinthalmanna | Order | **WON** | Nishad K V | 2026-09-01 |
| 38 | Transport Incubator | KIMS Alshifa Super Speciality Hospital- Perinthalmanna | Order | **WON** | Haroon Sidheeq | 2026-09-01 |
| 39 | New USG Machine requirement | Aditya multi specialty hospital | Lead | ACTIVE | Rudrappa Deevatagi | 2026-08-31 |
| 40 | Critical care products | EMS cooperative hospital Cherpulassery | Qualified | ACTIVE | Nishad K V | 2026-08-30 |
| 41 | Edan CX10 | PMSA Cooperative hospital Malappuram | Lead | ACTIVE | Nishad K V | 2026-08-30 |
| 42 | 30 Bed Hospital | NIMS Medicity , Neyyattinkara | Qualified | ACTIVE | Vivek | 2026-08-29 |
| 43 | EDAN CTG F6 DUAL FHR | ASTER PMF KOLLAM | Qualified | ACTIVE | Arun Adarsh | 2026-08-18 |
| 44 | ICU VENTILATOR SLE 5000 (REFURBISHED) | LAKSHMI HOSPITAL ERNAKULAM | Lead | ACTIVE | Arun Adarsh | 2026-08-18 |
| 45 | EDAN IX 12 MONITOR | ST JOHNS HOSPITAL, KATTAPPANA | Order | **WON** | Arun Adarsh | 2026-08-18 |
| 46 | Labour room product | Mihras Hospital, Markaz Knowledge City Rd, | Order | **WON** | Haroon Sidheeq | 2026-08-17 |
| 47 | Sonoscape S80 | Star Care Hospital Thondayad | Order | ACTIVE | Fazal | 2026-08-14 |
| 48 | Sonoscape S70 | V Care Scan Centre | Lead | ACTIVE | Shruthi | 2026-08-13 |
| 49 | Edan F3 CTG machine | IQRAA Community Hospital Padne Kassargod | Qualified | ACTIVE | Haroon Sidheeq | 2026-08-10 |
| 50 | ICU products | KMC hospital kuttiyadi | Lead | ON_HOLD | Nishad K V | 2026-08-07 |
| 51 | ADVANCED MOBILE ICU EQUIPMENTS | ROTARY CARDAMAMCITY NEDUMKANDAM | Lead | ACTIVE | Arun Adarsh | 2026-08-06 |
| 52 | NEW PROJECT | Dr Raju davis international school (oke hospital) | Lead | ACTIVE | Arun Adarsh | 2026-08-06 |
| 53 | Edan H100B Pulseoxymeter | St. James' Hospital,Chalakudy | Order | **WON** | Haroon Sidheeq | 2026-08-05 |
| 54 | Portable E1 exp | Coperative Hospital Thalassery | Lead | ACTIVE | Fazal | 2026-08-04 |
| 55 | MAGNAMED FLEXIMAG PLUS MAX300 | VPS LAKESHORE HOSPITAL | Qualified | ACTIVE | Arun Adarsh | 2026-08-04 |
| 56 | EDAN COLPOSCOPE | MEDICAL TRUST HOSPITAL | Qualified | ACTIVE | Arun Adarsh | 2026-08-04 |

Rows 37/38/45/46/53 are **WON** deals with zero Activity ever logged — the
same 5 rows overlap with check 8 below (PO set, no Activity).

## 7a. Activities missing the mandatory next action (BR-ACT-04) — 82

Heavily concentrated on two reps: **Haroon Sidheeq (40) and Fazal (25)
together account for 65 of the 82 (79%)**. Everyone else is in single
digits.

| Rep | Count |
| :--- | ---: |
| Haroon Sidheeq | 40 |
| Fazal | 25 |
| Naeem | 5 |
| Fahad | 5 |
| Shruthi | 5 |
| Rudrappa Deevatagi | 1 |
| Nishad K V | 1 |

<details>
<summary>Full 82-row list (date, rep, type, account)</summary>

| # | Date | Rep | Type | Account |
| :---: | :--- | :--- | :--- | :--- |
| 1 | 2026-09-15 | Haroon Sidheeq | CALL | Moulana Hospital- Perinthalmanna |
| 2 | 2026-09-14 | Naeem | RELATIONSHIP_SUPPORT | KIMS Alshifa Super Speciality Hospital- Perinthalmanna |
| 3 | 2026-09-14 | Naeem | VISIT | Blue Moon Hospital Kavanoor |
| 4 | 2026-09-14 | Haroon Sidheeq | CALL | KIMS Alshifa Super Speciality Hospital- Perinthalmanna |
| 5 | 2026-09-14 | Haroon Sidheeq | CALL | AMS Medical Systems - Kochi |
| 6 | 2026-09-12 | Haroon Sidheeq | CALL | Aster CMI ,Hebbal |
| 7 | 2026-09-12 | Haroon Sidheeq | CALL | New Centre - Dr.Sudhir Pai |
| 8 | 2026-09-11 | Haroon Sidheeq | CALL | Life Line Health Care BC Road Manglore |
| 9 | 2026-09-11 | Haroon Sidheeq | CALL | EMC Hospital Edavanna |
| 10 | 2026-09-11 | Haroon Sidheeq | CALL | Kmct Medical college Hospital |
| 11 | 2026-09-10 | Fazal | CALL | AKG Memorial Co-operative Hospital- Kannur |
| 12 | 2026-09-10 | Fazal | CALL | AKG Memorial Co-operative Hospital- Kannur |
| 13 | 2026-09-10 | Fazal | CALL | Indhira Gandhi Coperative Hospital |
| 14 | 2026-09-10 | Fazal | MEETING | Star Care Hospital Thondayad |
| 15 | 2026-09-10 | Fazal | CALL | Dr. Supriya Sonologist Home clinic Kozhikode |
| 16 | 2026-09-09 | Naeem | VISIT | Al Abeer Hospital Kizhissery |
| 17 | 2026-09-09 | Naeem | VISIT | Moulana Hospital- Perinthalmanna |
| 18 | 2026-09-09 | Haroon Sidheeq | MEETING | Sachi's Tumkur kidney care |
| 19 | 2026-09-09 | Rudrappa Deevatagi | VISIT | Vital Care Hospital |
| 20 | 2026-09-09 | Haroon Sidheeq | CALL | Moulana Hospital- Perinthalmanna |
| 21 | 2026-09-08 | Naeem | CALL | Neyyans Diagnostic Centre Parambil Peedika |
| 22 | 2026-09-08 | Fahad | VISIT | Mangala Hospital Manglore |
| 23 | 2026-09-08 | Haroon Sidheeq | CALL | IQRAA International Hospital & Research Centre Malaparamba Kozhikode |
| 24 | 2026-09-08 | Haroon Sidheeq | CALL | Kmct Medical college Hospital |
| 25 | 2026-09-08 | Nishad K V | RELATIONSHIP_SUPPORT | Dr. Supriya Sonologist Home clinic Kozhikode |
| 26 | 2026-09-07 | Fazal | MEETING | AKG Memorial Co-operative Hospital- Kannur |
| 27 | 2026-09-07 | Haroon Sidheeq | MEETING | SABA Hospital - Payyannur |
| 28 | 2026-09-07 | Fazal | CALL | KIMS Hospital Koduvally |
| 29 | 2026-09-07 | Fazal | CALL | KIMS Hospital Koduvally |
| 30 | 2026-09-07 | Fazal | CALL | Life Line Health Care BC Road Manglore |
| 31 | 2026-09-07 | Fazal | CALL | Mangala Hospital Manglore |
| 32 | 2026-09-07 | Fazal | CALL | Nucleus Hospital Nadapuram |
| 33 | 2026-09-07 | Fazal | CALL | KIMS Hospital Koduvally |
| 34 | 2026-09-07 | Fazal | CALL | Ma Hospital Manglore |
| 35 | 2026-09-07 | Fazal | CALL | Nucleus Hospital Nadapuram |
| 36 | 2026-09-07 | Fazal | CALL | KIMS Hospital Koduvally |
| 37 | 2026-09-07 | Fazal | CALL | SABA Hospital - Payyannur |
| 38 | 2026-09-07 | Fazal | CALL | KIMS Hospital Koduvally |
| 39 | 2026-09-07 | Haroon Sidheeq | CALL | ALOHA HOSPITAL Kizshery |
| 40 | 2026-09-05 | Fahad | MEETING | ULLAL DIAGNOSTIC CENTRE |
| 41 | 2026-09-04 | Fahad | CALL | Dhanvantri Hospital |
| 42 | 2026-09-04 | Haroon Sidheeq | CALL | Dr.Moopen's Medical College |
| 43 | 2026-09-04 | Haroon Sidheeq | CALL | Dr.Moopen's Medical College |
| 44 | 2026-09-04 | Haroon Sidheeq | EMAIL | Santhi Hospital Omesseey |
| 45 | 2026-09-03 | Fazal | CALL | EMS Cooperative Hospital Perambra |
| 46 | 2026-09-03 | Fazal | CALL | SABA Hospital - Payyannur |
| 47 | 2026-09-03 | Haroon Sidheeq | CALL | Malabar Hospital, Manjeri |
| 48 | 2026-09-03 | Haroon Sidheeq | CALL | IQRAA Community Hospital Padne Kassargod |
| 49 | 2026-09-03 | Haroon Sidheeq | CALL | IQRAA Community Hospital Padne Kassargod |
| 50 | 2026-09-03 | Haroon Sidheeq | CALL | Life Line Health Care BC Road Manglore |
| 51 | 2026-09-03 | Haroon Sidheeq | CALL | Life Line Health Care BC Road Manglore |
| 52 | 2026-09-02 | Fazal | CALL | EMS Cooperative Hospital Perambra |
| 53 | 2026-09-02 | Fazal | CALL | Appolo Scanning and Xray Koyilandi |
| 54 | 2026-09-02 | Fazal | CALL | SABA Hospital - Payyannur |
| 55 | 2026-09-02 | Fazal | MEETING | Coperative Hospital Thalassery |
| 56 | 2026-09-02 | Fazal | CALL | SABA Hospital - Payyannur |
| 57 | 2026-09-02 | Fazal | CALL | Nucleus Hospital Nadapuram |
| 58 | 2026-09-02 | Haroon Sidheeq | MEETING | G&F MEDICINE(SURGICALS)  Kozhikode |
| 59 | 2026-09-01 | Shruthi | MEETING | Aarvi Diagnostics |
| 60 | 2026-09-01 | Fahad | CALL | ULLAL DIAGNOSTIC CENTRE |
| 61 | 2026-09-01 | Haroon Sidheeq | CALL | IQRAA Community Hospital Padne Kassargod |
| 62 | 2026-09-01 | Haroon Sidheeq | CALL | Life Line Health Care BC Road Manglore |
| 63 | 2026-09-01 | Haroon Sidheeq | MEETING | G&F MEDICINE(SURGICALS)  Kozhikode |
| 64 | 2026-09-01 | Haroon Sidheeq | MEETING | G&F MEDICINE(SURGICALS)  Kozhikode |
| 65 | 2026-08-31 | Haroon Sidheeq | CALL | Metro Malabar Cardiac Center Manjeri |
| 66 | 2026-08-31 | Haroon Sidheeq | CALL | Aster Mims Mother Areekode |
| 67 | 2026-08-31 | Fahad | MEETING | Pragathi Hospital Puttur |
| 68 | 2026-08-31 | Haroon Sidheeq | CALL | Aster MIMS Calicut |
| 69 | 2026-08-28 | Haroon Sidheeq | CALL | IQRAA International Hospital & Research Centre Malaparamba Kozhikode |
| 70 | 2026-08-28 | Haroon Sidheeq | CALL | Aster MIMS Calicut |
| 71 | 2026-08-28 | Haroon Sidheeq | CALL | Metro Malabar Cardiac Center Manjeri |
| 72 | 2026-08-28 | Haroon Sidheeq | CALL | MK Haji Orphanage Hospital Tirurangadi |
| 73 | 2026-08-28 | Haroon Sidheeq | CALL | Malabar Hospital Erinchipalam Kozhikode |
| 74 | 2026-08-22 | Haroon Sidheeq | CALL | St. James' Hospital,Chalakudy |
| 75 | 2026-08-22 | Haroon Sidheeq | MEETING | Aster Mims Mother Areekode |
| 76 | 2026-08-22 | Haroon Sidheeq | CALL | Metromed International Cardiac Centre Kozhikode |
| 77 | 2026-08-22 | Haroon Sidheeq | CALL | IQRAA Fertility- Address Mall Calicut |
| 78 | 2026-08-22 | Haroon Sidheeq | CALL | IQRAA Community Hospital Padne Kassargod |
| 79 | 2026-08-19 | Shruthi | MEETING | Sapthagiri Medical College and Hospital |
| 80 | 2026-08-19 | Shruthi | MEETING | Ramaiah Memorial Hospital |
| 81 | 2026-08-13 | Shruthi | CALL | Sapthagiri Medical College and Hospital |
| 82 | 2026-08-05 | Shruthi | MEETING | Ramaiah Memorial Hospital |

</details>

## 7b. Very short/generic Activity notes — 20

18 of 20 are Haroon Sidheeq's; the other 2 are Shruthi's.

| # | Date | Rep | Type | Note |
| :---: | :--- | :--- | :--- | :--- |
| 1 | 2026-09-14 | Haroon Sidheeq | CALL | "Done" |
| 2 | 2026-09-12 | Haroon Sidheeq | CALL | "Done" |
| 3 | 2026-09-11 | Haroon Sidheeq | CALL | "Done" |
| 4 | 2026-09-08 | Haroon Sidheeq | CALL | "Done" |
| 5 | 2026-09-04 | Haroon Sidheeq | CALL | "Done" |
| 6 | 2026-09-04 | Haroon Sidheeq | CALL | "Done" |
| 7 | 2026-09-04 | Haroon Sidheeq | EMAIL | "Po collected" |
| 8 | 2026-09-03 | Haroon Sidheeq | CALL | "Done" |
| 9 | 2026-09-03 | Haroon Sidheeq | CALL | "Done" |
| 10 | 2026-09-03 | Haroon Sidheeq | CALL | "Done" |
| 11 | 2026-09-03 | Haroon Sidheeq | CALL | "Done follow up" |
| 12 | 2026-09-02 | Haroon Sidheeq | MEETING | "Installed" |
| 13 | 2026-08-28 | Haroon Sidheeq | CALL | "Finished" |
| 14 | 2026-08-28 | Haroon Sidheeq | CALL | "Po received" |
| 15 | 2026-08-28 | Haroon Sidheeq | CALL | "Done" |
| 16 | 2026-08-24 | Haroon Sidheeq | EMAIL | "Oder confirmed" |
| 17 | 2026-08-22 | Haroon Sidheeq | CALL | "Done" |
| 18 | 2026-08-22 | Haroon Sidheeq | MEETING | "Done meeting" |
| 19 | 2026-08-19 | Shruthi | MEETING | "Demo completed" |
| 20 | 2026-08-13 | Shruthi | CALL | "Follow up done" |

## 7c. Likely accidental double-submits — 14 candidates, ~4 genuine

Timing alone can't tell duplicate from legitimate rapid follow-up — pulled
the actual note text for all 14 pairs to judge properly.

**Genuine likely duplicates (4)** — same one-word/near-identical note,
logged twice within seconds to a few minutes, no new information added the
second time:

| # | Rep | Account | Note (both times) | Gap |
| :---: | :--- | :--- | :--- | :--- |
| 10 | Haroon Sidheeq | Dr.Moopen's Medical College | "Done" / "Done" | 20 sec |
| 11 | Haroon Sidheeq | IQRAA Community Hospital Padne Kassargod | "Done" / "Done" | 3.5 min |
| 14 | Haroon Sidheeq | G&F MEDICINE(SURGICALS) Kozhikode | "Done the delivery" / "Done the delivery" | 24 sec |
| 13 | Fahad | ULLAL DIAGNOSTIC CENTRE | Near-identical two-paragraph note, second version adds "to collect payment" — reads like an edit/resubmit rather than a new call | 2.5 min |

**Not duplicates — genuine sequential updates (10)** — a rep documenting
several real, distinct steps of one active follow-up in a short burst.
Fazal's cluster on KIMS Hospital Koduvally (rows 4-9, spanning two days) is
the clearest example: "installation done Saturday" → "application support
also done" → "installation successfully completed" is someone logging each
step as it happens, not resubmitting the same entry. Same pattern for row
1 (Fazal, AKG — "called biomedical and secretary" then "he said he'll
contact after comparison"), row 2 (Fahad — two notes on the same Monday-
demo conversation, each adding detail), and row 3 (Fazal, AKG — "planning
demo" then "after-demo follow-up").

Net: the real finding here is much smaller than the raw count suggests —
4 rows, all Haroon or Fahad, all a generic one-line note repeated verbatim
with zero elapsed context. Worth a quick word with Haroon specifically
(3 of the 4).

## 8. Order-stage/Won deals with a PO Number but zero Activity — 5

All five are **WON** — same 5 rows also appear in check 4's list (rows
37/38/45/46/53).

| # | Opportunity | Account | PO Number |
| :---: | :--- | :--- | :--- |
| 1 | Oxymag Transport Ventilator | KIMS Alshifa Super Speciality Hospital- Perinthalmanna | 01 |
| 2 | Transport Incubator | KIMS Alshifa Super Speciality Hospital- Perinthalmanna | 01 |
| 3 | EDAN IX 12 MONITOR | ST JOHNS HOSPITAL, KATTAPPANA | SJ/BME/65/AUG/2026 |
| 4 | Labour room product | Mihras Hospital, Markaz Knowledge City Rd, | 001 |
| 5 | Edan H100B Pulseoxymeter | St. James' Hospital,Chalakudy | 01 |

This is the exact pattern Basheer flagged this week ("a few Order-stage
deals had a confirmed PO but nothing logged about the call/conversation
that led to it") — the first report's "0 found" for this check was wrong;
these 5 are real.
