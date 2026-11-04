# Discussion: Bringing overdue next actions under control — 2026-11-03

**Status:** Discussion — for Haroon to agree the team routine (Q1–Q3) and
for Haroon and Basheer to decide Q4 and Q5 (Q6 answered, section 6). Nothing built.
**Participants:** Basheer (decisions), Haroon / Cabio leadership (business
sign-off), Claude (options and analysis).
**Origin:** UAT data-quality report, 3 Nov 2026. Basheer: "Why did overdue
next actions go from 536 to 572? The next-action rules were put in to
reduce this number, right?"

## 1. In plain terms

A next action is the follow-up a rep promises after a call or visit ("Demo
on Monday", "Submit quotation"). It is overdue once its date has passed and
it isn't closed. On 3 Nov there were **572** overdue next actions across
the team, up from **536** on 30 Oct.

The rules that went live on 25 Oct don't lower this number by themselves.
They make reps work from the follow-up they promised and make sure nothing
is left without a next step. Closing a next action always needs a new one,
so the number only falls when reps meet their dates.

Between 30 Oct and 3 Nov reps closed **216** of the old overdue items, but
**252** new ones fell due in the same days. So the team is working through
them, just not fast enough yet.

## 2. What the numbers show (UAT, 3 Nov 2026, approved read-only check)

| | Count |
|---|---|
| Overdue today | 572 |
| Due today (reps still have until tonight) | 80 |
| Already overdue before the rules went live (25 Oct) | 222 |
| On a hospital, not on an Opportunity | 440, across 282 hospitals |
| Of those, overdue before 25 Oct | 169 |
| Of those, a month or more late | 71 |

People with the most: Dhanushma 87, Ravi Kumar 81, Arun Adarsh 69 (data-
quality report, 3 Nov, section 12).

Three causes stand out:

1. **Old follow-ups nobody goes back to.** Most are on a hospital rather than
   an Opportunity. Today a rep can log a new visit at that hospital and leave
   the old follow-up open. If they stop visiting the hospital, it stays
   overdue forever.
2. **Dates that don't match the text.** 9 recent ones say "Follow up after 6
   months" but were dated within days. 61 just say "Follow up".
3. **Nobody can see or review the full list yet.** My Work and the Overdue
   tab are built but not on UAT, and no routine says who looks at the list
   and when.

## 3. What is already in place, and what isn't

| Piece | What it does | State |
|---|---|---|
| My Work screen | Each rep sees their own overdue next actions and their planned hospitals, never-visited first | Built and tested on Dev, not yet on UAT |
| Insights → Overdue tab | Managers see overdue next actions per person, and open any rep's list | Built on Dev, not yet on UAT |
| Hospital next-action rule | A rep can't log a new visit at a hospital while their own follow-up there is open; they close it instead | Built and tested on Dev, not yet on UAT |

So today the team has no screen that shows a rep or a manager the full
overdue list. The figures in section 2 come from the data-quality check,
not from the app. All three pieces need the next move to UAT.
| Hospital-wise plans | Each rep's quarterly plan lists the hospitals they cover, with a planned visit frequency | Live on UAT; not yet set up properly. Plans can be made for this quarter (Oct–Dec) |
| Exception report | Lists every hospital with no sales activity in the last 3 months; small accessory sales don't take a hospital off the list | Not built; in the signed Phase 1 requirements (11.1, product document 5.7) |
| Visit compliance | Shows planned hospitals visited less often than planned | Not built; out of Phase 1 scope (Basheer, 28 Sep) |

The hospital rule clears old follow-ups only when the rep visits that
hospital again (decided 28 Oct: no bulk closing). Old follow-ups at hospitals
the rep no longer visits need a one-time clean-up.

## 4. The proposal

1. **Proper hospital-wise plans, starting this quarter** — the plan says
   which hospitals each rep is responsible for.
2. **My Work, the Overdue tab and the hospital next-action rule on UAT** —
   reps and managers can see the overdue list, and no more logging around an
   open follow-up.
3. **A one-time clean-up** of the old overdue follow-ups, by each rep from
   My Work.
4. **A weekly manager review** of the Overdue tab.
5. **The exception report** — every hospital with no sales activity in 3
   months, whether or not it is on a plan, so managers see the hospitals
   that have gone quiet.
6. **Visit compliance**, so managers see planned hospitals visited less
   often than planned.

## 5. Questions

**Q1. The one-time clean-up — who and by when?**
Dhanushma has 87 overdue follow-ups. Some are at hospitals she still covers
and should be rescheduled to a real date; some may be at hospitals she no
longer works and should be closed with a reason ("No requirement this
year").
*Suggested:* once My Work and the hospital rule are on UAT, every rep clears their own
list from My Work within two weeks. A follow-up at a hospital they no longer
cover is closed with a reason, not rescheduled. Managers check progress on
the Overdue tab at the end of each week.

**Q2. The weekly review — who looks at the Overdue tab, and when?**
Today nobody is named, and the tab isn't on UAT yet. Without a routine, the
number grows back.
*Suggested:* each Area Manager every Monday for their team; Haroon sees the
team total in the same tab.

**Q3. Realistic dates — is a team instruction enough?**
"Follow up after 6 months" dated this week shows up overdue in days and
hides the follow-ups that really are late.
*Suggested:* Haroon tells the team to set the real date when they set the
follow-up. No change to the app for now; the data-quality check will show
whether it improves.

**Q4. Visit compliance — bring it into Phase 1?**
Each hospital on a plan has a planned visit frequency (Weekly, Monthly …).
Visit compliance would compare that with visits actually logged, for
example "planned monthly, last visit 21 Jul". Basheer put it out of Phase 1
scope on 28 Sep; the product document lists it on the salesperson dashboard.
*Suggested:* decide after the exception report (Q6) is in use. The
exception report already catches hospitals nobody visits; visit compliance
adds the finer check (visited, but less often than planned) and is only
useful once plans are set up properly.

**Q5. Should a follow-up due today count as overdue?**
The Overdue tab (built on Dev) and the data-quality check count follow-ups due today
(80 on 3 Nov), though the rep still has the rest of the day.
*Suggested:* count only from the next day, so the number shows only what is
really late. A small change on the Overdue tab, My Work and the check.

**Q6. The exception report — what counts as activity, and who sees it?**
It is in the signed requirements but not built. Two choices shape it:
whether a phone call counts, or only a visit; and whether reps see their
own list or only managers see it. For example, a hospital where the rep
only phoned in the last 3 months would be on the list if only visits
count.
*Suggested:* visits, calls, meetings and emails all count, the same as the
"Not visited" list on My Work; managers see their team's list and each rep
sees their own. Build it before visit compliance, since it is already in
scope.

## 6. Answers

**Q6, what counts as activity (Basheer, 2026-11-04):** visits, calls,
meetings and emails all count.

**Q6, who sees it (Basheer, 2026-11-04):** each rep sees their own list;
managers see their own and their team's.
