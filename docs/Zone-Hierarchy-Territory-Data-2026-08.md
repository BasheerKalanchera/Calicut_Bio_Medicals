# Zone Hierarchy — Territory Data (South Kerala & Karnataka)

**Status:** Working document — raw field input, still converging. Not a
design/policy record (that's `docs/Discussion-Zone-Hierarchy-2026-08.md`,
which this doc feeds open decision #2 of, but stays out of otherwise so
that doc doesn't churn every time this list changes).
**Date:** 2026-08-11
**Sources so far:** Adarsh (South Kerala districts), Vivek (South Kerala
districts — reports to Adarsh, confirmed 2026-08-11; originally recorded
as sub-district splits within Adarsh's districts, corrected 2026-08-16 to
full-district assignment, see the South Kerala section below), Shruthi
(Bangalore + wider Karnataka, and confirmed 2026-08-11 later as **Bangalore's
own Manager**), Fazal/Fahad (North Kerala + Karnataka Coastal data,
2026-08-11).

**Correction, 2026-08-11 (later): "Fahad" and "Fazal" are two different
people, not one — Fahad reports to Fazal.** Every earlier mention in this
doc treating them as the same individual (based on reading Shruthi's table
label "Fahad Manager (Fazal)" as an alias) was wrong — the more likely
reading, now confirmed, is "Fahad [is the territory] Manager, [reporting
to] (Fazal)." This is a real correction, not a rename — see the open
question logged in the Karnataka section below for what's still unclear
about exactly which of the North Kerala / Karnataka Coastal data came from
which of the two.
**Kerala operational zones — clarified by Basheer, 2026-08-11 (later):**
Kerala is divided into **North and South only, for now** — not the three
(North/Central/South) the live `zone` table currently has rows for. Worth
a separate, explicit clarification before this feeds any technical design:
does the existing Central Kerala zone row need to be deprecated/merged, or
does it just sit unused/dormant today? Not resolved here — flagged, not
acted on.

**Resolved 2026-08-21:** Central Kerala is deprecated, not merely dormant.
The hospital accounts that were incorrectly assigned to it in UAT were
moved to South Kerala, and the Central Kerala zone itself was deactivated
in UAT's Territory Admin screen once confirmed empty. `CLAUDE.md`'s Zones
line updated to match (South Kerala + North Kerala only for Kerala).

**Decided 2026-08-21 — tree shape differs by state, deliberately not
uniform:** Kerala keeps its existing 3-level shape (Kerala → North/South
Kerala → District) — the North/South split is a real, durable operational
boundary (see the 2026-08-11 note above), not just a UI grouping.
Karnataka flattens to 2 levels (Karnataka → District) **except Bangalore**,
which keeps its own node with the numbered Zone 1-6 children beneath it —
Bangalore already sits at the same tree depth as the cluster nodes being
removed (South Karnataka, Central Karnataka, Coastal Karnataka, North
Karnataka), so this isn't a special case structurally, just the one
Karnataka cluster that survives.
**Why:** the cluster level's only real value is letting a manager whose
coverage is a whole region be assigned once and automatically inherit any
district added to it later (via `zone_closure` tree-membership) — worth
keeping where a manager's true boundary is the whole cluster (Adarsh = all
of South Kerala, Nishad = all of North Kerala for Critical Care), not
worth keeping where nobody relies on it.
**Known cost — Shruthi:** covers Bangalore + South/Central/North Karnataka
(all of Karnataka except Fazal's Coastal cluster). Once those three
non-Bangalore clusters are flattened, she needs an explicit district-level
`user_zone` row for each of their districts (Mysore, Mandya, Ramnagara,
Chamrajnagar, Tumkur, Chitradurga, Hassan, Dharwad) instead of 3 cluster-
level rows — and **any new Karnataka district added later outside
Bangalore will not automatically fall under her coverage**; whoever adds
it must remember to also assign Shruthi to it explicitly. Fazal's Coastal
Karnataka districts were already being assigned individually regardless
(no change there).

---

## Consolidated territory table

Rolls up every row from the sections below into one view. **Reflects the
doc's state as of 2026-08-11 (later) — must be re-synced by hand whenever
a source section changes**, same as the tentative tree diagrams below it;
not auto-generated. "⚠" marks a row tied to an unresolved open question
(see the numbered list in that row's section for detail).

**"Manager" column** — the Area/Zone Manager responsible for that
territory overall (distinct from "Assignee," the specific salesperson
working that district/taluk day to day). As of 2026-08-11 (later), nearly
fully populated: Shruthi covers all of Karnataka except the Karnataka
Coastal cluster (Fazal). Plain names only, no parenthetical caveats — see
each row's Flag column for anything still uncertain about that row.

**"SBU" column** — added 2026-08-12, once it became clear territory
coverage splits by Strategic Business Unit (Imaging vs Critical Care —
SBUs are also RLS security boundaries in the live system, see CLAUDE.md).
Confirmed 2026-08-12: **Shruthi's entire cluster (all of Bangalore +
wider Karnataka) is Imaging**; **Adarsh's entire cluster (all of South
Kerala) is Critical Care**; North Kerala has both — Fahad (Imaging) and
Nishad (Critical Care, new this update, with Adydev reporting to him).

Neither state has a genuine missing-SBU gap after all — both are business
scope, confirmed directly by their managers, not data not yet gathered:
**South Kerala sells Critical Care products only** (Adarsh's cluster has
no Imaging counterpart to find), and **Karnataka sells Imaging products
only** (Shruthi confirmed for her whole cluster, and per Basheer "same is
the case with Fazal" — his Karnataka Coastal territory too, which also
retires the ⚠-inferred SBU flags on those rows below; Fazal's Kerala-side
territory, North Kerala, is unaffected and still has both SBUs). Kerala
is the only state confirmed to run both SBUs side by side.

| State | Zone | District / Cluster | Assignee | Manager | SBU | Notes |
|---|---|---|---|---|---|---|
| Karnataka | Bangalore | Zone 1: central + East | Rudrappa | Shruthi | Imaging | MG Road, Indiranagar, Ulsoor, Koramangala, Domlur, Richmond Town, Shantinagar, Marathahalli, Whitefield, KR Puram, Mahadevapura, Brookefield, CV Raman Nagar, Jeevanbheema Nagar,Vasanth Nagar, Majestic |
| Karnataka | Bangalore | Zone 2: North + Rural North | Om Hiremath | Shruthi | Imaging | Hebbal, Yelahanka, RT Nagar, Jakkur, Sahakar Nagar, Hennur, Thanisandra, Frazer Town, Kammanahalli, Vidyaranyapura, Tindlu, Sanjay Nagar, Ganganagar,Rajajinagar, Vijayanagar, Magadi Road, Peenya, Malleshwaram, Yeshwanthpur, Rural - Devanahalli, Doddaballapur, Hesaraghatta, Chikkaballapur |
| Karnataka | Bangalore | Zone 3: West | Om Hiremath | Shruthi | Imaging | Nagarbhavi, Basaveshwaranagar, Kamakshipalya, Nandini Layout,Kengeri |
| Karnataka | Bangalore | Zone 4: South Core | Dhanushma | Shruthi | Imaging | Jayanagar, JP Nagar, Banashankari, BTM Layout, Padmanabhanagar, Basavanagudi, Girinagar, Kumaraswamy Layout, Uttarahalli, Chikkalasandra, Konanakunte,HSR Layout,Madiwala, Kudlu Gate, Devarachikkanahalli, Arekere, Bilekahalli, Rural: Hoskote,Anekal,Attibele,Hosur Border |
| Karnataka | Bangalore | Zone 5 South East | Dhanushma | Shruthi | Imaging | HSR Layout, Bommanahalli, Electronic City, Begur, Bannerghatta Road |
| Karnataka | Bangalore | Zone 6: South-West + Rural South | Dhanushma | Shruthi | Imaging | Kanakapura Road, Kumaraswamy Layout, Vasanthapura, Subramanyapura, ISRO Layout |
| Karnataka | South Karnataka | Mysore | Nagesh Ninganoor | Shruthi | Imaging | |
| Karnataka | South Karnataka | Mandya | Nagesh Ninganoor | Shruthi | Imaging | |
| Karnataka | South Karnataka | Ramnagara | Nagesh Ninganoor | Shruthi | Imaging | |
| Karnataka | South Karnataka | Chamrajnagar | Nagesh Ninganoor | Shruthi | Imaging | |
| Karnataka | South Karnataka | Tumkur | Ravikumar | Shruthi | Imaging | |
| Karnataka | Central Karnataka | Chitradurga | Ravikumar | Shruthi | Imaging | |
| Karnataka | Central Karnataka | Hassan | Ravikumar | Shruthi | Imaging | |
| Karnataka | Coastal Karnataka | Mangalore | Fahad | Fazal | Imaging | |
| Karnataka | Coastal Karnataka | Dakshin Kannada | Fahad | Fazal | Imaging | |
| Karnataka | Coastal Karnataka | Coorg | Fahad | Fazal | Imaging | |
| Karnataka | Coastal Karnataka | Udupi | Fahad | Fazal | Imaging | |
| Karnataka | Coastal Karnataka | Shimoga | Fahad | Fazal | Imaging | |
| Karnataka | Coastal Karnataka | Bhatkal | Fahad | Fazal | Imaging | |
| Karnataka | North Karnataka | Dharwad | Shruthi | Shruthi | Imaging | Subdealer gives the leads and Shruthi enters into the system |
| Kerala | North Kerala | Kasaragod | Irfan | Fazal | Imaging | |
| Kerala | North Kerala | Kannur | Irfan | Fazal | Imaging | |
| Kerala | North Kerala | Kozhikode | Irfan | Fazal | Imaging | |
| Kerala | North Kerala | Malappuram | "Staff New" | Naeem | Imaging | |
| Kerala | North Kerala | Wayanad | "Staff New" | Naeem | Imaging | |
| Kerala | North Kerala | Kozhikode | Adydev | Nishad | Critical Care | |
| Kerala | North Kerala | Malappuram | Adydev | Nishad | Critical Care | |
| Kerala | North Kerala | Wayanad | Nishad | Nishad | Critical Care | |
| Kerala | North Kerala | Kannur | Adydev | Nishad | Critical Care | |
| Kerala | North Kerala | Kasaragod | Adydev | Nishad | Critical Care | |
| Kerala | South Kerala | Palakkad | Adarsh | Adarsh | Critical Care | |
| Kerala | South Kerala | Thrissur | Adarsh | Adarsh | Critical Care | |
| Kerala | South Kerala | Ernakulam | Adarsh | Adarsh | Critical Care | |
| Kerala | South Kerala | Alappuzha | Vivek | Adarsh | Critical Care | |
| Kerala | South Kerala | Idukki | Vivek | Adarsh | Critical Care | |
| Kerala | South Kerala | Kottayam | Vivek | Adarsh | Critical Care | |
| Kerala | South Kerala | Pathanamthitta | Vivek | Adarsh | Critical Care | |
| Kerala | South Kerala | Kollam | Vivek | Adarsh | Critical Care | |
| Kerala | South Kerala | Trivandrum | Vivek | Adarsh | Critical Care | |

**Central Kerala dropped from this table, 2026-08-11 (later)** — per
Basheer, Kerala operates with North and South zones only for now; see the
note above. No row carried forward for it, rather than leaving a
perpetually-empty placeholder.

## North Kerala — Fazal's zone; Irfan & a new hire

Raw input, as given 2026-08-11. **Correction, 2026-08-11 (later): "Fahad"
and "Fazal" are two different people — Fahad reports to Fazal** (see the
intro correction above). Fazal is the established North Kerala Area
Manager (`Multi-Zone-Assignment-Technical-Design.md`); Fahad is a separate
person, confirmed below to be Fazal's report covering (part of) the
Karnataka Coastal cluster. **Still open: was this North Kerala list
(Irfan, "Staff New") actually relayed by Fazal himself, or by Fahad on his
behalf, or does Fahad have some direct role in North Kerala too?** The
original messages describing this data said "the list from Fahad" for
both North Kerala and Karnataka Coastal together — worth a direct
confirmation now that they're known to be different people, rather than
assuming which of the two this section's data actually came from.

**Irfan** (whole districts, reports to Fazal — confirmed 2026-08-16, see
open question 2's resolution below):
- Kasaragod
- Kannur
- Kozhikode

**"Staff New"** (an as-yet-unnamed new hire or an unfilled open position —
not clear which; see open question below):
- Malappuram
- Wayanad

**Tentative tree implied by this data:**
```
North Kerala
 ├── Kasaragod      (Irfan)
 ├── Kannur         (Irfan)
 ├── Kozhikode      (Irfan)
 ├── Malappuram     ("Staff New")
 └── Wayanad        ("Staff New")
```

### Update 2026-08-11 (later) — revised list from Fahad

Kozhikode no longer appears under "Staff New" — Irfan now holds it
outright, no split. **Resolves the earlier Kozhikode overlap** (was open
question 1 below); no taluk-level detail was ever needed after all, since
there's no longer a shared district here.

**Open questions on this list (renumbered after the update above):**
1. ~~Kozhikode overlap between Irfan and "Staff New"~~ — **resolved**,
   see the update above.
2. ~~Do Irfan and "Staff New" report to Fazal?~~ — **partially resolved
   2026-08-16 (Basheer): Irfan reports to Fazal, confirmed.** "Staff
   New"'s reporting line is different, not Fazal — see the Naeem note
   below and open question 3's resolution.
3. ~~"Staff New" — specific new hire or vacant position?~~ — **resolved
   2026-08-16 (Basheer): it's a specific new hire Cabio is actively
   recruiting for, not a vacant/unassigned position — name not yet
   confirmed.** Should show as "assigned, name pending" once the system
   models that state, not "vacant." **Also resolved: "Naeem," the
   consolidated table's Manager for the Malappuram/Wayanad Imaging rows,
   is a real, confirmed new manager** — not the data-entry anomaly this
   doc originally flagged it as, since every other North Kerala Imaging
   row lists Fazal. "Staff New" reports to **Naeem**, not Fazal — Naeem
   is being onboarded as a distinct manager over this specific
   Malappuram/Wayanad Imaging territory, separate from Fazal's chain.
   This sharpens open question 6 below: the Imaging/Critical Care split
   isn't the only fragmentation of Fazal's original single-manager North
   Kerala Imaging territory — Naeem is a second, narrower one within
   Imaging itself.
4. This list (Kasaragod, Kannur, Kozhikode, Malappuram, Wayanad) is North
   Kerala's first district breakdown gathered so far — worth confirming
   with Fazal/Haroon that it's the *complete* list of North Kerala's
   districts, not a partial one.
5. ~~Whose list is this, exactly — Fazal's or Fahad's?~~ — **partially
   resolved 2026-08-12:** Fahad is confirmed to hold the North Kerala
   **Imaging** SBU charge directly (see the Critical Care update below),
   so this Imaging-side list plausibly came from Fahad rather than
   Fazal. Not independently confirmed which of the two actually relayed
   it, but Fahad having a direct North Kerala role is no longer in doubt.
6. ~~Is Fazal still the overall North Kerala Area Manager across both
   SBUs, or does the Imaging/Critical Care split run all the way to the
   top?~~ — **resolved 2026-08-16 (Basheer, confirmed with Haroon): no
   single cross-SBU/cross-territory North Kerala manager exists.** Fazal,
   Naeem, and Nishad each report directly to Haroon as independent peers
   — not a hierarchy with Fazal at the top of North Kerala. See the
   correction immediately below for what this means for Fazal's own
   charge specifically.

**Correction, 2026-08-16 (Basheer, confirmed with Haroon): Fazal's North
Kerala Imaging charge is narrower than originally recorded, and North
Kerala Imaging now has two peer managers, not one.** Malappuram and
Wayanad are carved out to **Naeem**, a new Imaging Area Manager hired
specifically for those two districts, reporting directly to **Haroon**
(not to Fazal). Fazal's own North Kerala Imaging charge narrows to just
Kasaragod, Kannur, and Kozhikode (Irfan's districts) — his Mangalore/
Karnataka Coastal charge is unaffected. Live Dev's `user_zone` already
reflects this (Fazal: Kannur, Kasaragod, Kozhikode, Mangalore — the old
"North Kerala" zone-level assignment removed to avoid overlapping with
Naeem's territory). "Staff New," reporting to Naeem, is still an
unconfirmed future hire — see open question 3's resolution above.

### Update 2026-08-12 — Critical Care SBU split (Nishad & Adydev)

Raw input, as given 2026-08-12: **Nishad** handles the North Kerala
**Critical Care** SBU charge; **Fahad** handles the North Kerala
**Imaging** SBU charge (confirming, per open question 5 above, that Fahad
does have a direct North Kerala role, not just the Karnataka Coastal one
already on record). **Adydev** reports to Nishad within Critical Care and
handles Kannur and Kasaragod specifically.

This is the first time SBU has been recorded as a distinct axis in this
doc — see the new SBU column in the consolidated table above. It means
every North Kerala district now has *two* independent assignments, one
per SBU, not one:

**Nishad** (Critical Care, whole districts, direct):
- Kozhikode
- Malappuram
- Wayanad

**Adydev** (Critical Care, reports to Nishad):
- Kannur
- Kasaragod

**Tentative tree, revised for the SBU split — corrected 2026-08-16
(Basheer, confirmed with Haroon) to show Imaging's own internal
fragmentation (two peer managers, both reporting to Haroon directly, not
one flat "Manager: Fahad" block and not Naeem under Fazal):**
```
North Kerala
 ├── Imaging
 │    ├── Manager: Fazal (reports to Haroon) — Kasaragod, Kannur,
 │    │   Kozhikode (Irfan, confirmed reporting to Fazal 2026-08-16)
 │    └── Manager: Naeem (reports to Haroon, peer of Fazal, not his
 │        report) — Malappuram, Wayanad ("Staff New," a specific new
 │        hire Cabio is actively recruiting for, not yet named or
 │        confirmed, reports to Naeem)
 └── Critical Care (Manager: Nishad)
      ├── Kozhikode      (Nishad, direct)
      ├── Malappuram     (Nishad, direct)
      ├── Wayanad        (Nishad, direct)
      ├── Kannur         (Adydev, reports to Nishad)
      └── Kasaragod      (Adydev, reports to Nishad)
```

**Open questions on this update:**
1. **Does Nishad also report to Fazal**, the same way Fahad's Imaging
   line does (presumed, per open question 2 above), or is Critical Care
   North Kerala organizationally separate from Fazal's chain entirely?
   Not stated either way yet.
2. **District list mismatch** — Nishad/Adydev's five Critical Care
   districts (Kozhikode, Malappuram, Wayanad, Kannur, Kasaragod) match
   the Imaging side's five exactly. Worth confirming this is deliberate
   (Critical Care mirrors Imaging's district boundaries in North Kerala)
   rather than coincidental, especially before assuming the same mirror
   holds for other zones.
3. Same completeness question as open question 4 above, but for Critical
   Care: is this the *complete* North Kerala Critical Care district list,
   or partial?

## South Kerala — Adarsh & Vivek

**Confirmed 2026-08-12: Adarsh's entire cluster is Critical Care SBU —
and, per Basheer the same day, this isn't just an unfilled reporting gap:
Cabio sells Critical Care products only in South Kerala.** No Imaging
manager is missing here; there's no Imaging business in this zone to
assign one to. This is a real business-scope fact, distinct from
Bangalore/Karnataka's missing-Critical-Care-manager row below, which *is*
still an open gap (Imaging clearly is sold there; the Critical Care side
of that region just hasn't been gathered yet).

Raw input, as given 2026-08-11 — **superseded 2026-08-16, see correction
below the tree diagram.**

**Adarsh** (whole districts):
- Palakkad
- Thrissur
- Ernakulam

**Vivek** (reports to Adarsh — whole districts, all six):
- Alappuzha
- Idukki
- Kottayam
- Pathanamthitta
- Kollam
- Trivandrum

**Tree** (South Kerala → District — no taluk level needed here after all,
see correction below):
```
South Kerala
 ├── Palakkad                                  (Adarsh)
 ├── Thrissur                                  (Adarsh)
 ├── Ernakulam                                 (Adarsh)
 ├── Alappuzha                                 (Vivek)
 ├── Idukki                                    (Vivek)
 ├── Kottayam                                  (Vivek)
 ├── Pathanamthitta                            (Vivek)
 ├── Kollam                                    (Vivek)
 └── Trivandrum                                (Vivek)
```

**Correction, 2026-08-16 (Basheer):** the taluk-level split originally
recorded here (Vivek holding only Chengannur/Harippad/Kayamkulam within
Alappuzha and Thodupuzha within Idukki, with Adarsh holding "the rest" of
each) was wrong — **Alappuzha and Idukki are fully assigned to Vivek**,
same as his other four districts, not split. No taluk level needed for
South Kerala after all; the four-level (Zone → District → Taluk) case
this section originally cited as validating the flexible-depth design no
longer applies here — that design decision stands on its own merits
regardless. Adarsh may still work accounts directly in any South Kerala
district including Alappuzha/Idukki, Vivek's included — that's a
function of being **overall in-charge of South Kerala**, not a specific
territory carve-out the way "Rest of Alappuzha" implied. This live
Dev's `user_zone` assignments (Vivek: all 6 districts; Adarsh: the
zone-level "South Kerala" row, not itemized per-district) already reflect
this corrected version, done 2026-08-16 as part of setting up Vivek's real
account — this doc was the one that had gone stale, not the data.

**Open questions on this list:**
1. **Ernakulam under South Kerala** — worth confirming this matches how
   Cabio's *existing* South Kerala zone is actually used today. Ernakulam
   (Kochi) is more commonly grouped with Central Kerala in general usage —
   if any existing customers/deals are already tagged South Kerala but sit
   in Ernakulam, or vice versa, that's a data question to check, not
   something to silently reclassify based on this list.
2. ~~"Remainder of Alappuzha" / "remainder of Idukki"~~ — **moot as of the
   2026-08-16 correction above**; there's no split to name a boundary for.
3. **Does Vivek reporting to Adarsh also grant Adarsh visibility into
   Vivek's patches, or is that already covered by the existing Sales
   Manager reporting-line rule alone** (see `Discussion-Zone-Hierarchy-2026-
   08.md`'s role table — Sales Manager already sees "deals belonging to
   people who report to them")? If the reporting-line rule already covers
   this, Adarsh doesn't need Vivek's specific patches listed as his own
   territory responsibility too — worth not double-modeling the same fact
   two ways.

## Bangalore + wider Karnataka — Shruthi

**Confirmed 2026-08-12: Shruthi's entire cluster is Imaging SBU — and,
per Shruthi directly the same day, this is business scope, not a gap:
Cabio sells Imaging products only across the whole Karnataka hierarchy
under her.** Basheer separately confirmed the same holds for Fazal's
Karnataka territory (Karnataka Coastal). No Critical Care manager is
missing here; there's no Critical Care business in Karnataka to assign
one to.

Raw input, as given 2026-08-11 (verbatim table):

| Zone | Urban Areas | Rural Areas | Salesperson |
|---|---|---|---|
| Zone 1: Central + East Bangalore | MG Road, Indiranagar, Ulsoor, Koramangala, Domlur, Richmond Town, Shantinagar, Marathahalli, Whitefield, KR Puram, Mahadevapura, Brookefield, CV Raman Nagar, Jeevanbheema Nagar, Vasanth Nagar, Majestic | — | Rudrappa |
| Zone 2: North + Rural North Bangalore | Hebbal, Yelahanka, RT Nagar, Jakkur, Sahakar Nagar, Hennur, Thanisandra, Frazer Town, Kammanahalli, Vidyaranyapura, Tindlu, Sanjay Nagar, Ganganagar, Rajajinagar, Vijayanagar, Magadi Road, Peenya, Malleshwaram, Yeshwanthpur | Devanahalli, Doddaballapur, Hesaraghatta, Chikkaballapur | Om Hiremath |
| Zone 3: West | Nagarbhavi, Basaveshwaranagar, Kamakshipalya, Nandini Layout, Kengeri | — | Om Hiremath |
| Zone 4: South Bangalore Core | Jayanagar, JP Nagar, Banashankari, BTM Layout, Padmanabhanagar, Basavanagudi, Girinagar, Kumaraswamy Layout, Uttarahalli, Chikkalasandra, Konanakunte, HSR Layout, Madiwala, Kudlu Gate, Devarachikkanahalli, Arekere, Bilekahalli, Bommanahalli, Electronic City, Begur, Bannerghatta Road | Hoskote, Anekal, Attibele, Hosur Border | Dhanushma |
| *(Zone 5 — not present in input; see open question 1 below)* | | | |
| Zone 6: South-West + Rural South | Kanakapura Road, Kumaraswamy Layout, Vasanthapura, Subramanyapura, ISRO Layout | — | Dhanushma |
| Mysore, Mandya, Ramnagara | Mysore, Mandya, Chamrajnagar, Coorg, Ramnagara | — | Nagesh Ninganoor |
| Tumkur, Chitradurga, Hassan | | | Ravikumar |
| Mangalore, Dakshin Kannada, Udupi | | | Fahad Manager (Fazal) |
| Dharwad | | | Subdealer |

**Re-read, 2026-08-11 (later):** "Fahad Manager (Fazal)" in Shruthi's
original table almost certainly means "Fahad [is the territory] Manager,
[reporting to] (Fazal)" — **not** "Fahad, also known as Fazal," as this
doc previously assumed throughout. Fahad and Fazal are two different
people; see the correction at the top of this doc.
**Also confirmed by Basheer, 2026-08-11 (later): Shruthi herself is
Bangalore's own Manager** — the five Bangalore zones (1–4, 6) all report
to her. Not stated whether she also covers the Mysore/Tumkur/Karnataka
Coastal/Dharwad rows below, or just Bangalore proper — flagged as its own
open question rather than assumed either way.

**Tentative tree implied by this data:**
```
Karnataka
 ├── Bangalore                                    (Manager: Shruthi)
 │    ├── Zone 1: Central + East Bangalore       (Rudrappa)
 │    ├── Zone 2: North + Rural North Bangalore  (Om Hiremath)
 │    ├── Zone 3: West                           (Om Hiremath)
 │    ├── Zone 4: South Bangalore Core           (Dhanushma)
 │    └── Zone 6: South-West + Rural South       (Dhanushma)
 ├── Karnataka South                              (Manager: Shruthi)
 │    └── Mysore / Mandya / Ramnagara / Chamrajnagar   (Nagesh Ninganoor)
 ├── Karnataka Central                            (Manager: Shruthi)
 │    └── Tumkur / Chitradurga / Hassan           (Ravikumar)
 ├── Karnataka Coastal                            (Manager: Fazal)
 │    ├── Mangalore / Dakshin Kannada / Coorg     (Fahad — interim)
 │    └── Udupi / Shimoga / Bhatkal               (Fahad — interim, until backfilled)
 └── Dharwad                                      (Subdealer)
```
(Coorg moved here from the Mysore cluster, resolved 2026-08-11 — Basheer's
call. "Kodak" was the original mis-transcription of Coorg; no longer used.)
("Fahad 1"/"Fahad 2" confirmed 2026-08-11 as one person (Fahad) covering
both groupings temporarily, not two people or a permanent split — see the
resolved question below. Fahad himself reports to Fazal, per the
correction above — not the same person, as this doc previously assumed.)

### Update 2026-08-11 (later) — Fahad's own list for this cluster

Raw input, as given directly by Fahad, **revised again 2026-08-11 (later
still)**:

- **"Fahad 1"**: Mangalore, Dakshin Kannada, **"Kodak"**
- **"Fahad 2"**: Udupi, Shimoga, **Bhatkal**

This confirms Mangalore/Dakshin Kannada/Udupi (matches Shruthi's row for
this cluster) and gives it an actual name — **"Karnataka Coastal"** — where
Shruthi's table just listed the districts with no cluster name. It also
splits the cluster into two groupings and adds one new place (Bhatkal) that
wasn't in the first version of this list.

**Open questions on this list:**
1. **Zone 5 is missing** — the table jumps Zone 4 → Zone 6, no Zone 5
   anywhere. Typo/renumbering artifact, or deliberately skipped/merged
   into another zone? Confirm with Shruthi before treating the numbering
   as meaningful.
2. **Several rows have no listed Rural Areas** (Zone 1, Zone 3, Zone 6,
   and the three outer-district rows) — confirmed genuinely urban-only /
   not applicable, or just not filled in yet?
3. **Om Hiremath covers both Zone 2 and Zone 3; Dhanushma covers both
   Zone 4 and Zone 6** — same one-person-multiple-territories pattern
   already confirmed for Fazal (North Kerala + Mangalore) in `Multi-Zone-
   Assignment-Technical-Design.md`. Good independent confirmation that
   the "list of territory responsibilities per person" mechanism is a
   general need, not a one-off accommodation for Fazal's case.
4. **Mangalore is already a separate, existing top-level Zone in the live
   system** (added 2026-08-07) — and Fazal already covers it, per Multi-
   Zone Assignment. Does Shruthi's table mean Mangalore/Dakshin Kannada/
   Udupi should become a *child* of a new "Karnataka" parent (alongside
   Bangalore), which would mean restructuring today's flat top-level
   Mangalore zone under a new node — or should Mangalore stay top-level,
   with "Karnataka" introduced only as a parent for Bangalore's own zones
   (and the Mysore/Tumkur/Dharwad clusters left as their own top-level
   entries, or under Karnataka too)? This decides whether any
   already-live Mangalore-tagged records need to move under a new tree
   node, or stay exactly where they are.
5. **Dharwad → "Subdealer," not a named individual.** Is a subdealer a
   real `user_profile` row in the system (an actual login with an
   assigned territory), or purely informational / out of scope for the
   territory-assignment mechanism for now? If a subdealer isn't a system
   user, Dharwad may need to exist as a territory with no current
   assignee, rather than being force-fit into the same assignment
   mechanism used for internal staff.
6. ~~"Kodak" / Coorg — which cluster actually covers it?~~ — **fully
   resolved 2026-08-11, Basheer's call: Coorg stays under Karnataka
   Coastal (Fahad/Fazal), removed from Nagesh Ninganoor's Mysore cluster
   (Shruthi).** "Kodak" was the original mis-transcription of Coorg — no
   longer used anywhere in this doc; the plain name "Coorg" is used
   throughout instead.
7. **Shimoga** — not in Shruthi's table at all, and geographically it's
   central Karnataka, not coastal (unlike Bhatkal, added in the same
   update, which genuinely is a coastal town — supports "Karnataka
   Coastal" as the right name for the rest of the cluster). Confirm
   Shimoga is intentionally part of Fahad's coverage rather than a
   transcription slip, and if so, whether it belongs in this cluster at
   all given the name.
8. ~~"Karnataka Coastal" as the formal cluster name~~ — **resolved
   2026-08-15.** Confirmed intentional as built live — the system's zone is
   named "Coastal Karnataka" (word order reversed from this doc's working
   name), deliberately: Basheer's call, to keep the `[Descriptor] [State]`
   word order consistent with "North Kerala"/"South Kerala" rather than
   `[State] [Descriptor]`. This doc's "Karnataka Coastal" references
   throughout are the informal/planning name for the same cluster, not a
   mismatch to fix in the system.
9. ~~"Fahad 1" and "Fahad 2" — same person or two people?~~ — **resolved
   2026-08-11.** Same person — **Fahad** (correction, 2026-08-11 later:
   originally recorded here as "Fazal," which was this doc's mistaken
   Fahad=Fazal assumption; Fahad and Fazal are two different people —
   Fahad reports to Fazal, per the correction at the top of this doc). He's
   temporarily covering both groupings himself **until a new sales rep is
   hired to take over one of them.** Not a permanent two-way split; "Fahad
   1"/"Fahad 2" is a snapshot of an interim state, not two distinct
   standing territory assignments.
   **The interim state itself needs no new mechanism** — it's an ordinary
   case of one person holding two territory-list entries, the same
   mechanism already built for Fazal's own original North Kerala +
   Mangalore case (and for Om Hiremath/Dhanushma above) — Fazal being the
   pattern's original example doesn't make him the one holding the two
   Karnataka Coastal groupings here; that's Fahad, his report. **Confirmed
   by Basheer 2026-08-11: when the new rep is eventually hired and takes
   over the second grouping, that transition uses the existing handover
   mechanism from the main Discussion doc** (the "staying at Cabio, moved
   to a different area" case, since Fahad himself isn't leaving or moving
   — he's just shedding a patch he was covering on top of his own) — not a
   new case requiring new design. This is a real, concrete instance to
   keep in mind once open decision #6 in the main Discussion doc (Split
   share vs. clean transfer for the "stayed at Cabio" case) is actually
   settled with Haroon.
10. ~~Does Shruthi's management extend past Bangalore proper?~~ —
    **resolved 2026-08-11 (later): yes.** Confirmed by Basheer — Nagesh
    Ninganoor, Ravikumar, and the Dharwad subdealer relationship all
    report to Shruthi too. She now covers every Karnataka cluster in this
    doc except Karnataka Coastal (Fazal's).

## Status

Draft, still converging — actively revised several times across two days
now, including one **correction, not just an addition**: "Fahad" and
"Fazal" were wrongly treated as the same person through several earlier
revisions of this doc (misreading Shruthi's "Fahad Manager (Fazal)" label);
confirmed 2026-08-11 (later) they're two different people — Fahad reports
to Fazal. The Manager column is now nearly fully populated: **Shruthi
covers every Karnataka cluster except Karnataka Coastal, which is Fazal's**
(Nagesh Ninganoor, Ravikumar, and Dharwad's subdealer relationship all
confirmed reporting to her same day). Not yet reviewed by Haroon. Not yet
extended to Central Kerala (dropped from scope entirely, not just "not yet
gathered" — Kerala runs North/South zones only per Basheer).

**New 2026-08-12: SBU (Imaging vs Critical Care) added as a distinct axis**
to the consolidated table, after confirmation that territory coverage
splits by SBU. Confirmed: Shruthi's whole cluster = Imaging, Adarsh's
whole cluster = Critical Care, North Kerala has both (Fahad = Imaging,
Nishad = Critical Care with Adydev reporting to him on Kannur/Kasaragod).
**No open SBU gaps remain** — both single-SBU states turned out to be
business scope, not missing data: **Karnataka sells Imaging products
only** (confirmed by Shruthi for her cluster and by Basheer for Fazal's
Karnataka Coastal territory) and **South Kerala sells Critical Care
products only** (confirmed by Basheer). Kerala as a whole still runs both
SBUs side by side, via its North/South split.

**17 open questions logged across the three sections above, 6 resolved**
(North Kerala's Kozhikode overlap; Karnataka's "Fahad 1"/"Fahad 2"
identity; Shruthi's management scope; the Coorg conflict — Basheer's call,
2026-08-11: Coorg stays under Karnataka Coastal/Fazal, removed from Nagesh
Ninganoor's Mysore cluster/Shruthi, "Kodak" no longer used anywhere in
this doc; and, partially, whose North Kerala Imaging list this was —
Fahad's direct North Kerala role is now confirmed via the SBU update,
though which of Fazal/Fahad literally relayed the list is still open).
Feeds open decision #2 in `docs/Discussion-Zone-Hierarchy-2026-
08.md`; that doc's other open items (5, 6, 7) are independent of this data
and still pending Haroon separately.
