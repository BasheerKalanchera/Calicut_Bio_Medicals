"""Read-only UAT scan for the Opportunity data-habits case studies (Backlog
"Opportunity data habits"). First run 19 Nov 2026 (Plan & Chore scratchpad
script); copied here 26 Nov with Basheer's yes.

Finds non-Lost Opportunities that show the traces from the two 19 Nov case
studies, marks which traces are new since the case studies went out, and lists
good-example candidates (at most one small gap; a passed closing date doesn't
count). One read-only transaction, Admin context, all three settings verified at
start and end, rolled back (UAT pooler pattern: scripts/uat_data_quality_check.py).
Ask Basheer before every UAT run. The output names customers: keep it in the
session scratchpad, never in the repo.

Usage: python -I -X utf8 scripts/uat_case_study_scan.py OUT_FILE [TODAY] [SINCE]
  TODAY, SINCE as YYYY-MM-DD; defaults 2026-11-26 and 2026-11-19.
"""
import re
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

import psycopg2
import psycopg2.extras

REPO = Path(__file__).resolve().parent.parent
ADMIN_ID = "14f3413b-ddb1-48a7-986f-55075b562421"  # Basheer K, Admin
TODAY = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else date(2026, 11, 26)
SINCE = date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else date(2026, 11, 19)  # case studies shared
SILENT_DAYS = 30          # no activity for this long at Negotiation or later
LATE_DAYS = 3             # activity typed in this many days after it happened
CLOSING = "7 closing date passed"  # ignored by the good-example test
PAY_WORDS = re.compile(r"\b(emi|emis|instal+ments?|advance|cheque|loan|neft|rtgs|token amount)\b", re.I)
out = open(sys.argv[1], "w", encoding="utf-8")


def p(*a):
    print(*a, file=out)


def load_env(path):
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


conn = psycopg2.connect(load_env(REPO / "backend" / ".env.uat")["DATABASE_URL"])
conn.set_session(readonly=True, autocommit=False)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
cur.execute("SELECT id, sbu_id, role_id FROM user_profile WHERE id = %s", (ADMIN_ID,))
a = cur.fetchone()
cur.execute("SELECT set_config('app.current_user_id', %s, true), set_config('app.current_sbu_id', %s, true), "
            "set_config('app.current_role_id', %s, true)",
            (str(a["id"]), str(a["sbu_id"]) if a["sbu_id"] else "", str(a["role_id"])))


def check_ctx(when):
    cur.execute("SELECT cabio_app_uid() uid, cabio_app_role_name() role, cabio_app_sbu_id() sbu")
    v = cur.fetchone()
    p(f"Context {when}: {v['role']} uid={v['uid']} sbu={v['sbu']}")
    if str(v["uid"]) != ADMIN_ID or v["role"] != "Admin":
        conn.rollback()
        out.close()
        sys.exit("STOP: context not set")


check_ctx("start")
cur.execute("SELECT version_num FROM alembic_version")
p("UAT alembic:", cur.fetchone()["version_num"])
p(f"Today {TODAY}; 'new' = evidence dated after {SINCE}")

# Stage order: rank among active stages by display_order
cur.execute("SELECT id, stage_code, stage_name, display_order FROM opportunity_stage WHERE is_active ORDER BY display_order")
stages = cur.fetchall()
rank = {str(s["id"]): i for i, s in enumerate(stages)}
stage_name = {str(s["id"]): s["stage_name"] for s in stages}
# display_order 50 = Negotiation, 80 = Payment Pending (backend/app/domains/opportunity/validators.py)
nego_rank = next(i for i, s in enumerate(stages) if s["display_order"] == 50)
pp_rank = next(i for i, s in enumerate(stages) if s["display_order"] == 80)
p("Stages:", ", ".join(f"{s['display_order']} {s['stage_name']}" for s in stages))
cur.execute("SELECT id, status_code FROM opportunity_status")
status_code = {str(r["id"]): r["status_code"] for r in cur.fetchall()}

cur.execute("""SELECT o.id, o.name, o.account_id, acc.name AS account, u.display_name AS owner, o.stage_id,
                      st.status_code, o.indicative_value, o.expected_closure_date, o.po_number, o.po_date,
                      o.full_payment_confirmed_at, o.created_at
               FROM opportunity o JOIN opportunity_status st ON st.id = o.status_id
               JOIN account acc ON acc.id = o.account_id
               LEFT JOIN user_profile u ON u.id = o.owner_id
               WHERE st.status_code <> 'LOST'""")
opps = {str(o["id"]): o for o in cur.fetchall()}
ids = list(opps)

cur.execute("""SELECT i.opportunity_id, i.product_id, pr.name AS product, i.quantity, i.extended_value_lakhs
               FROM opportunity_item i LEFT JOIN product pr ON pr.id = i.product_id
               WHERE i.opportunity_id = ANY(%s::uuid[])""", (ids,))
items = defaultdict(list)
for r in cur.fetchall():
    items[str(r["opportunity_id"])].append(r)

cur.execute("""SELECT opportunity_id, activity_date, created_at, notes, outcome_notes FROM activity
               WHERE opportunity_id = ANY(%s::uuid[])""", (ids,))
acts = defaultdict(list)
for r in cur.fetchall():
    acts[str(r["opportunity_id"])].append(r)

cur.execute("""SELECT record_id, changed_at, old_data->>'stage_id' old_stage, new_data->>'stage_id' new_stage,
                      old_data->>'status_id' old_status, new_data->>'status_id' new_status
               FROM audit_log WHERE table_name = 'opportunity' AND action = 'UPDATE'
                 AND record_id = ANY(%s::uuid[])
                 AND ((old_data->>'stage_id') IS DISTINCT FROM (new_data->>'stage_id')
                      OR (old_data->>'status_id') IS DISTINCT FROM (new_data->>'status_id'))""", (ids,))
jumps = defaultdict(list)   # opp id -> [(text, changed date)]
won_on = {}                 # opp id -> date of the latest save that marked it Won
for r in cur.fetchall():
    oid, when = str(r["record_id"]), r["changed_at"].date()
    became_won = r["old_status"] != r["new_status"] and status_code.get(r["new_status"]) == "WON"
    if became_won and (oid not in won_on or when > won_on[oid]):
        won_on[oid] = when
    if r["old_stage"] == r["new_stage"]:
        continue
    o, n = rank.get(r["old_stage"]), rank.get(r["new_stage"])
    if o is not None and n is not None and (n - o > 1 or became_won):
        jumps[oid].append((f"{r['changed_at']:%d %b}: {stage_name[r['old_stage']]} -> {stage_name[r['new_stage']]}"
                           + (" + marked Won in the same save" if became_won else ""), when))

check_ctx("end")
conn.rollback()
conn.close()


def model_tokens(s):
    return {t.upper().replace("-", "") for t in re.findall(r"[A-Za-z]*\d[\w-]*", s or "")}


def created_new(o):
    return o["created_at"].date() > SINCE


flags = defaultdict(list)   # opp id -> list of (trace, detail, new since SINCE)
by_acct = defaultdict(list)
for oid, o in opps.items():
    by_acct[str(o["account_id"])].append(oid)

# 1. Possible duplicates: same customer, 2+ non-Lost Opportunities sharing a product or the same value
for acct, oids in by_acct.items():
    if len(oids) < 2:
        continue
    for i, x in enumerate(oids):
        for y in oids[i + 1:]:
            px = {r["product_id"] for r in items[x] if r["product_id"]}
            py = {r["product_id"] for r in items[y] if r["product_id"]}
            vx, vy = opps[x]["indicative_value"], opps[y]["indicative_value"]
            if (px & py) or (vx and vx == vy):
                why = "same product" if px & py else f"same value {vx} L"
                new = created_new(opps[x]) or created_new(opps[y])
                flags[x].append(("1 possible duplicate", f"with \"{opps[y]['name']}\" ({why})", new))
                flags[y].append(("1 possible duplicate", f"with \"{opps[x]['name']}\" ({why})", new))

for oid, o in opps.items():
    its, ac = items[oid], acts[oid]
    r = rank.get(str(o["stage_id"]))
    cnew = created_new(o)
    # 2. Won without full payment confirmed
    if o["status_code"] == "WON" and not o["full_payment_confirmed_at"]:
        w = won_on.get(oid)
        flags[oid].append(("2 Won, no full payment confirmed", f"marked Won {w:%d %b}" if w else "",
                           cnew or bool(w and w > SINCE)))
    # 3. Stage skipped, or Won in the same save as a stage change
    for j, when in jumps[oid]:
        flags[oid].append(("3 stage skipped / Won in same save", j, when > SINCE))
    # 4. Name vs product lines
    if o["name"].strip().lower() == o["account"].strip().lower():
        flags[oid].append(("4 name is just the customer's name", "", cnew))
    nt = model_tokens(o["name"])
    pt = set().union(*[model_tokens(i["product"]) for i in its]) if its else set()
    if nt and pt and not any(a.startswith(b) or b.startswith(a) for a in nt for b in pt):
        flags[oid].append(("4 name's model not in product lines",
                           f"name {sorted(nt)} vs lines {sorted(pt)}", cnew))
    # 5. Value differs from product-line total
    if its and o["indicative_value"] is not None:
        tot = sum(i["extended_value_lakhs"] or 0 for i in its)
        if abs(tot - o["indicative_value"]) > 0.5:
            flags[oid].append(("5 value differs from product lines",
                               f"value {o['indicative_value']} vs lines {tot}", cnew))
    # 6. Payment talk in notes, stage still before Payment Pending (and not Won)
    pay = [x for x in ac if PAY_WORDS.search((x["notes"] or "") + " " + (x["outcome_notes"] or ""))]
    if pay and o["status_code"] != "WON" and r is not None and r < pp_rank:
        flags[oid].append(("6 payment talk, stage before Payment Pending",
                           f"{len(pay)} notes mention advance/EMI/cheque/loan; stage {stage_name.get(str(o['stage_id']))}",
                           cnew or any(x["created_at"].date() > SINCE for x in pay)))
    # 7. Expected Closure Date passed, still open
    if o["status_code"] != "WON" and o["expected_closure_date"] and o["expected_closure_date"] < TODAY:
        flags[oid].append((CLOSING, f"{o['expected_closure_date']:%d %b %Y}",
                           o["expected_closure_date"] > SINCE))
    # 8. Negotiation or later, silent 30+ days
    last = max((x["activity_date"].date() for x in ac), default=None)
    cutoff = TODAY - timedelta(SILENT_DAYS)
    if o["status_code"] != "WON" and r is not None and r >= nego_rank and (last is None or last < cutoff):
        # new = it crossed the 30-day line after SINCE
        flags[oid].append(("8 silent 30+ days at Negotiation or later", f"last activity {last or 'none'}",
                           cnew or bool(last and last >= SINCE - timedelta(SILENT_DAYS))))
    # 9. Activities typed in late
    late = [x for x in ac if (x["created_at"] - x["activity_date"]).days >= LATE_DAYS]
    if len(late) >= 2:
        late_new = [x for x in late if x["created_at"].date() > SINCE]
        flags[oid].append(("9 activities typed in late",
                           f"{len(late)} of {len(ac)} entered {LATE_DAYS}+ days after ({len(late_new)} since {SINCE:%d %b})",
                           len(late_new) > 0))


def head(o):
    return (f"\"{o['name']}\" | {o['account']} | {o['owner']} | {stage_name.get(str(o['stage_id']), '?')} / "
            f"{o['status_code']} | {o['indicative_value']} L | {len(acts[str(o['id'])])} activities")


new_opps = sum(1 for o in opps.values() if created_new(o))
p(f"\nNon-Lost Opportunities read: {len(opps)} (created after {SINCE}: {new_opps})\n")
p(f"== Counts per trace (Opportunities): all / new since {SINCE:%d %b}")
traces = defaultdict(list)
for oid, fl in flags.items():
    for t, d, new in fl:
        traces[t].append((oid, d, new))
for t in sorted(traces):
    p(f"  {t}: {len({x for x, _, _ in traces[t]})} / {len({x for x, _, n in traces[t] if n})}")

p("\n== Top candidates (most different traces)")
ranked = sorted(flags, key=lambda x: -len({t for t, _, _ in flags[x]}))
for oid in ranked[:25]:
    p(f"\n[{len({t for t, _, _ in flags[oid]})} traces] {head(opps[oid])}  id={oid}")
    for t, d, new in flags[oid]:
        p(f"    - {t}{': ' + d if d else ''}{'  [NEW]' if new else ''}")

p("\n== Good examples (at most one gap, a passed closing date not counted; 8+ activities, "
  "last activity within 14 days, Negotiation or later)")
good = 0
for oid, o in opps.items():
    ac = acts[oid]
    last = max((x["activity_date"].date() for x in ac), default=None)
    r = rank.get(str(o["stage_id"]))
    gaps = {t for t, _, _ in flags[oid] if t != CLOSING}
    if len(gaps) <= 1 and len(ac) >= 8 and last and last >= TODAY - timedelta(14) and r is not None and r >= nego_rank:
        good += 1
        tip = "; ".join(f"{t}{': ' + d if d else ''}" for t, d, _ in flags[oid]) or "none"
        p(f"  {head(o)}  last {last}  id={oid}\n      gap(s): {tip}")
p(f"  ({good} found)")

p("\n== Full list per trace")
for t in sorted(traces):
    p(f"\n-- {t}")
    for oid, d, new in traces[t]:
        p(f"  {head(opps[oid])}{' — ' + d if d else ''}{'  [NEW]' if new else ''}")
p("\nRolled back; read-only.")
out.close()
