# Zone Hierarchy — Territory Data (South Kerala & Karnataka)

**Status:** Working document — raw field input, still converging. Not a
design/policy record (that's `docs/Discussion-Zone-Hierarchy-2026-08.md`,
which this doc feeds open decision #2 of, but stays out of otherwise so
that doc doesn't churn every time this list changes).
**Date:** 2026-08-11
**Sources so far:** Adarsh (South Kerala districts), Vivek (South Kerala
sub-district splits — reports to Adarsh, confirmed 2026-08-11), Shruthi
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

| State | Zone | District / Cluster | Taluk | Assignee | Manager | Flag |
|---|---|---|---|---|---|---|
| Karnataka | Bangalore | Zone 1: Central + East Bangalore | — | Rudrappa | Shruthi | |
| Karnataka | Bangalore | Zone 2: North + Rural North Bangalore | — | Om Hiremath | Shruthi | |
| Karnataka | Bangalore | Zone 3: West | — | Om Hiremath | Shruthi | |
| Karnataka | Bangalore | Zone 4: South Bangalore Core | — | Dhanushma | Shruthi | |
| Karnataka | Bangalore | *Zone 5 — missing* | — | — | — | ⚠ gap in Shruthi's numbering |
| Karnataka | Bangalore | Zone 6: South-West + Rural South | — | Dhanushma | Shruthi | |
| Karnataka | Karnataka South | Mysore / Mandya / Ramnagara / Chamrajnagar | — | Nagesh Ninganoor | Shruthi | resolved 2026-08-11 — Coorg moved out, now under Karnataka Coastal below |
| Karnataka | Karnataka Central | Tumkur / Chitradurga / Hassan | — | Ravikumar | Shruthi | ⚠ informal label, not Karnataka's official revenue division — Hassan officially belongs to the Mysore Division (with the South cluster above), not Bangalore Division (Tumkur/Chitradurga's actual division); Basheer's call 2026-08-11, kept informal |
| Karnataka | Karnataka Coastal | Mangalore | — | Fahad (interim) | Fazal | ⚠ already a live top-level zone — nesting TBD |
| Karnataka | Karnataka Coastal | Dakshin Kannada | — | Fahad (interim) | Fazal | |
| Karnataka | Karnataka Coastal | Coorg | — | Fahad (interim) | Fazal | resolved 2026-08-11 — Basheer's call; formerly transcribed "Kodak" |
| Karnataka | Karnataka Coastal | Udupi | — | Fahad (interim, until backfilled) | Fazal | |
| Karnataka | Karnataka Coastal | Shimoga | — | Fahad (interim, until backfilled) | Fazal | ⚠ not geographically coastal |
| Karnataka | Karnataka Coastal | Bhatkal | — | Fahad (interim, until backfilled) | Fazal | genuinely coastal |
| Karnataka | — | Dharwad | — | Subdealer | Shruthi | ⚠ not an internal rep — open question |
| Kerala | North Kerala | Kasaragod | — | Irfan | Fazal | ⚠ reporting line presumed, not confirmed |
| Kerala | North Kerala | Kannur | — | Irfan | Fazal | ⚠ reporting line presumed, not confirmed |
| Kerala | North Kerala | Kozhikode | — | Irfan | Fazal | resolved — was shared, now Irfan's alone; reporting line still presumed |
| Kerala | North Kerala | Malappuram | — | "Staff New" | Fazal | ⚠ name/status pending; reporting line presumed |
| Kerala | North Kerala | Wayanad | — | "Staff New" | Fazal | ⚠ name/status pending; reporting line presumed |
| Kerala | South Kerala | Palakkad | — | Adarsh | Adarsh | ⚠ Adarsh's role as South Kerala lead is inferred, not an explicitly stated title |
| Kerala | South Kerala | Thrissur | — | Adarsh | Adarsh | ⚠ same as above |
| Kerala | South Kerala | Ernakulam | — | Adarsh | Adarsh | ⚠ same as above, plus boundary vs. Central Kerala unconfirmed |
| Kerala | South Kerala | Alappuzha | Rest of Alappuzha | Adarsh | Adarsh | ⚠ exact taluk boundary not given |
| Kerala | South Kerala | Alappuzha | Chengannur / Harippad / Kayamkulam | Vivek | Adarsh | |
| Kerala | South Kerala | Idukki | Rest of Idukki | Adarsh | Adarsh | ⚠ exact taluk boundary not given |
| Kerala | South Kerala | Idukki | Thodupuzha | Vivek | Adarsh | |
| Kerala | South Kerala | Kottayam | — | Vivek | Adarsh | |
| Kerala | South Kerala | Pathanamthitta | — | Vivek | Adarsh | |
| Kerala | South Kerala | Kollam | — | Vivek | Adarsh | |
| Kerala | South Kerala | Trivandrum | — | Vivek | Adarsh | |

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

**Irfan** (whole districts, presumed reporting to Fazal — confirmed
elsewhere that Fazal is North Kerala's Area Manager, but Irfan's own direct
reporting line to him specifically isn't explicitly stated, unlike
Vivek/Adarsh; see open question below):
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
2. **Do Irfan and "Staff New" report to Fazal?** Given as North Kerala
   assignments under his list, presumed yes — but not stated explicitly
   the way Vivek's reporting to Adarsh was confirmed. Worth getting the
   same explicit confirmation.
3. **"Staff New"** — is this a specific new hire whose name just wasn't
   given yet, or literally an unfilled/open position with no person to
   assign? Affects whether this territory should show as "assigned,
   name pending" or "vacant" in the system.
4. This list (Kasaragod, Kannur, Kozhikode, Malappuram, Wayanad) is North
   Kerala's first district breakdown gathered so far — worth confirming
   with Fazal/Haroon that it's the *complete* list of North Kerala's
   districts, not a partial one.
5. **New, 2026-08-11 (later): whose list is this, exactly — Fazal's or
   Fahad's?** Raised by the Fahad/Fazal correction above. Doesn't change
   the district facts themselves, but affects who to go back to for
   corrections/confirmations on this section specifically.

## South Kerala — Adarsh & Vivek

Raw input, as given 2026-08-11:

**Adarsh** (whole districts):
- Palakkad
- Thrissur
- Ernakulam
- Alappuzha *(shared with Vivek — see below)*
- Idukki *(shared with Vivek — see below)*

**Vivek** (reports to Adarsh — sub-district splits within two of Adarsh's
districts, plus whole districts of his own):
- Idukki — Thodupuzha (taluk-level slice; remainder of Idukki presumed
  Adarsh's, exact boundary not yet given)
- Alappuzha — Chengannur, Harippad, Kayamkulam (taluk-level slice;
  remainder of Alappuzha presumed Adarsh's, exact boundary not yet given)
- Kottayam (whole district)
- Pathanamthitta (whole district)
- Kollam (whole district)
- Trivandrum (whole district)

**Tentative tree implied by this data** (South Kerala → District →
[Taluk, only where a district is actually split):
```
South Kerala
 ├── Palakkad                                  (Adarsh)
 ├── Thrissur                                  (Adarsh)
 ├── Ernakulam                                 (Adarsh)
 ├── Alappuzha                                 (Adarsh — "Rest of Alappuzha")
 │    └── Chengannur / Harippad / Kayamkulam   (Vivek)
 ├── Idukki                                    (Adarsh — "Rest of Idukki")
 │    └── Thodupuzha                           (Vivek)
 ├── Kottayam                                  (Vivek)
 ├── Pathanamthitta                            (Vivek)
 ├── Kollam                                    (Vivek)
 └── Trivandrum                                (Vivek)
```
This is real, useful confirmation that the tree needs **four levels** in at
least two places (Zone → District → Taluk), not the three shown in the main
discussion doc's illustrative example — supports the "flexible depth, no
fixed levels" design decision rather than requiring a change to it.

**Open questions on this list:**
1. **Ernakulam under South Kerala** — worth confirming this matches how
   Cabio's *existing* South Kerala zone is actually used today. Ernakulam
   (Kochi) is more commonly grouped with Central Kerala in general usage —
   if any existing customers/deals are already tagged South Kerala but sit
   in Ernakulam, or vice versa, that's a data question to check, not
   something to silently reclassify based on this list.
2. **"Remainder of Alappuzha" / "remainder of Idukki"** — Adarsh's actual
   share once Vivek's taluks are carved out needs the real taluk names, not
   an implicit "whatever's left" bucket — the tree needs named nodes on
   both sides of a split, not one named node and one default.
3. **Does Vivek reporting to Adarsh also grant Adarsh visibility into
   Vivek's patches, or is that already covered by the existing Sales
   Manager reporting-line rule alone** (see `Discussion-Zone-Hierarchy-2026-
   08.md`'s role table — Sales Manager already sees "deals belonging to
   people who report to them")? If the reporting-line rule already covers
   this, Adarsh doesn't need Vivek's specific patches listed as his own
   territory responsibility too — worth not double-modeling the same fact
   two ways.

## Bangalore + wider Karnataka — Shruthi

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
8. **"Karnataka Coastal" as the formal cluster name** — worth confirming
   this is the name Shruthi and Fahad both want in the system, since
   Shruthi's own table left this cluster unnamed.
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

Draft, still converging — actively revised several times in one day
already, including one **correction, not just an addition**: "Fahad" and
"Fazal" were wrongly treated as the same person through several earlier
revisions of this doc (misreading Shruthi's "Fahad Manager (Fazal)" label);
confirmed 2026-08-11 (later) they're two different people — Fahad reports
to Fazal. The Manager column is now nearly fully populated: **Shruthi
covers every Karnataka cluster except Karnataka Coastal, which is Fazal's**
(Nagesh Ninganoor, Ravikumar, and Dharwad's subdealer relationship all
confirmed reporting to her same day). Not yet reviewed by Haroon. Not yet
extended to Central Kerala (dropped from scope entirely, not just "not yet
gathered" — Kerala runs North/South zones only per Basheer). **13 open
questions logged across the three sections above, 5 resolved** (North
Kerala's Kozhikode overlap; Karnataka's "Fahad 1"/"Fahad 2" identity;
Shruthi's management scope; and the Coorg conflict — Basheer's call,
2026-08-11: Coorg stays under Karnataka Coastal/Fazal, removed from Nagesh
Ninganoor's Mysore cluster/Shruthi; "Kodak" no longer used anywhere in
this doc). Feeds open decision #2 in `docs/Discussion-Zone-Hierarchy-2026-
08.md`; that doc's other open items (5, 6, 7) are independent of this data
and still pending Haroon separately.
