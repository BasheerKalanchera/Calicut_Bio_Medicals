#!/usr/bin/env python3
"""Read-only UAT report: Expected Closure Dates and Lead-stage win probability
on open Opportunities. Run alongside uat_data_quality_check.py (CLAUDE.md
"UAT data-quality check").

Builds a four-step report for the sales team (first issued 2026-10-01):
  1. open Opportunities whose Expected Closure Date has passed;
  2. Demo stage or later (or High Priority) with no date;
  3. Lead stage with a win probability above the stage default;
  4. Lead/Qualified with no date (counts per owner only, no action yet).

Writes HTML and PDF to --out for review. The PDF goes to
C:\\Backups\\CabioUAT\\data_consistency_reports\\ only after Basheer approves
it (CLAUDE.md). UAT runs append one "closure:" line to the data-quality run
log; the next report compares against it.

Connects with the app-role (RLS-enforced) DATABASE_URL, never
ADMIN_DATABASE_URL, inside ONE read-only transaction with transaction-local
RLS settings: UAT goes through the transaction pooler (port 6543), where
session-level settings can be lost between statements (2026-10-01).

Usage: uat_closure_date_report.py --out <folder> [--env dev]
"""

import argparse
import html
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
ENV_FILES = {"uat": ROOT / "backend" / ".env.uat", "dev": ROOT / "backend" / ".env"}
RUN_LOG = Path(r"C:\Backups\CabioUAT\data_consistency_reports\data_quality_log.txt")
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

OPEN_SQL = """
    WITH d AS (
        SELECT up.display_name AS owner, o.name AS opp, a.name AS hosp,
               ost.stage_name AS stage, ost.display_order AS so,
               ost.default_win_probability AS dflt, o.win_probability AS pct,
               -- BR-OP-15: High Priority = past Demo, or ticked by hand
               (ost.display_order > 30 OR o.high_priority_manual) AS hp,
               o.expected_closure_date AS ecd,
               -- net value as in the pipeline reports (buyback lines subtract)
               COALESCE((SELECT SUM(CASE WHEN oi.line_type = 'BUYBACK' THEN -oi.extended_value_lakhs
                                         ELSE oi.extended_value_lakhs END)
                         FROM opportunity_item oi WHERE oi.opportunity_id = o.id), 0) AS value
        FROM opportunity o
        JOIN opportunity_status os ON os.id = o.status_id
        JOIN opportunity_stage ost ON ost.id = o.stage_id
        JOIN account a ON a.id = o.account_id
        JOIN user_profile up ON up.id = o.owner_id
        WHERE os.status_code = 'ACTIVE'
    )
    SELECT *, CASE
        WHEN ecd IS NOT NULL AND ecd < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'passed'
        WHEN ecd IS NULL AND (so >= 30 OR hp) THEN 'step2'
        WHEN ecd IS NULL THEN 'step4'
        ELSE 'future' END AS bucket
    FROM d
"""


def load_env(path: Path) -> dict[str, str]:
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def fetch(env_name: str):
    conn = psycopg2.connect(load_env(ENV_FILES[env_name])["DATABASE_URL"])
    conn.set_session(readonly=True, autocommit=False)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT up.id, up.sbu_id, up.role_id FROM user_profile up JOIN role r ON r.id = up.role_id
            WHERE r.role_name IN ('Admin', 'General Manager') AND up.is_active LIMIT 1
        """)
        a = cur.fetchone()
        if not a:
            sys.exit("No active Admin/GM found -- cannot establish RLS context. Aborting.")
        # sbu_id may be SQL NULL for Admin; pass '' (see uat_data_quality_check.py)
        cur.execute(
            "SELECT set_config('app.current_user_id', %s, true), "
            "set_config('app.current_sbu_id', %s, true), "
            "set_config('app.current_role_id', %s, true)",
            (str(a["id"]), str(a["sbu_id"]) if a["sbu_id"] else "", str(a["role_id"])),
        )
        cur.execute("SELECT cabio_app_uid() AS uid, cabio_app_role_name() AS role")
        v = cur.fetchone()
        if v["uid"] is None or v["role"] not in ("Admin", "General Manager"):
            sys.exit(f"RLS context did not take effect: {v}. Aborting.")
        cur.execute("SELECT stage_name, default_win_probability FROM opportunity_stage ORDER BY display_order")
        stages = cur.fetchall()
        cur.execute(OPEN_SQL)
        rows = cur.fetchall()
        cur.execute("SELECT cabio_app_uid() AS uid")
        if cur.fetchone()["uid"] is None:
            sys.exit("RLS context was lost during the run -- results not trusted. Aborting.")
    finally:
        conn.rollback()
        conn.close()
    return stages, rows


def previous_counts() -> dict[str, int] | None:
    if not RUN_LOG.exists():
        return None
    lines = [ln for ln in RUN_LOG.read_text(encoding="utf-8").splitlines() if "| closure:" in ln]
    if not lines:
        return None
    body = lines[-1].split("| closure:", 1)[1]
    return {k.strip(): int(v) for k, v in (p.split("=") for p in body.split(";") if "=" in p)}


def build_html(stages, rows, today: str, prev: dict[str, int] | None) -> tuple[str, dict[str, int]]:
    e = html.escape
    by = defaultdict(list)
    for r in rows:
        by[r["bucket"]].append(r)
    lead_high = [r for r in rows if r["stage"] == "Lead" and r["pct"] > r["dflt"]]
    s1 = sorted(by["passed"], key=lambda r: (r["owner"], r["ecd"]))
    s2 = sorted(by["step2"], key=lambda r: (r["owner"], -r["value"]))
    s4 = by["step4"]
    fut = by["future"]
    nodate = s2 + s4
    lead_high.sort(key=lambda r: (r["owner"], -r["pct"]))
    counts = {"future": len(fut), "passed": len(s1), "step2": len(s2),
              "lead_high_chance": len(lead_high), "step4": len(s4)}

    def tot(rs):
        return float(sum(r["value"] for r in rs))

    def fmt_l(v):
        return f"₹{v:,.1f} L" if v else "—"

    def fmt_d(d):
        return d.strftime("%d %b") if d else "—"

    def table(head, body):
        h = "".join(f"<th>{x}</th>" for x in head)
        b = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in body)
        return f"<table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>"

    progress = ""
    if prev:
        def chg(key, label, good_if_up):
            before, now = prev.get(key), counts[key]
            if before is None or before == now:
                return None
            good = (now > before) == good_if_up
            return f"{label}: {before} → {now}" + (" ✓" if good else "")
        items = [x for x in (
            chg("future", "with a realistic date", True),
            chg("passed", "date passed", False),
            chg("step2", "Demo stage or later with no date", False),
            chg("lead_high_chance", "Lead stage with a higher chance", False),
        ) if x]
        if items:
            progress = ("<div class=why><b>Since the last check:</b> " + " · ".join(items)
                        + ". Thank you to everyone who updated their Opportunities.</div>")

    defaults = ", ".join(f"{s['stage_name']} {s['default_win_probability']:.0f}%" for s in stages
                         if s["stage_name"] not in ("Lead", "Delivery & Installation"))
    lead_default = next((s["default_win_probability"] for s in stages if s["stage_name"] == "Lead"), 5)
    s4_by = Counter(r["owner"] for r in s4)
    s4_val = defaultdict(float)
    for r in s4:
        s4_val[r["owner"]] += float(r["value"])

    page = f"""<!doctype html><html><head><meta charset=utf-8><title>Expected Closure Dates — {today}</title><style>
body{{font-family:'Segoe UI',Arial,sans-serif;color:#222;font-size:10.5pt;line-height:1.45;margin:0 8mm}}
h1{{color:#1f4e79;font-size:20pt;margin:0 0 4px}}
h2{{color:#1f4e79;font-size:13.5pt;border-bottom:1px solid #ccc;padding-bottom:3px;margin-top:22px}}
.sub{{color:#666;margin:0 0 12px}}
.why{{background:#f3f4f6;border-radius:6px;padding:10px 14px;margin:10px 0}}
.act{{background:#fdf1e7;border-left:4px solid #a0461b;padding:10px 14px;margin:10px 0}}
.note{{color:#666;font-size:9pt}}
table{{border-collapse:collapse;width:100%;margin:8px 0;font-size:9.5pt}}
th{{background:#f3f4f6;text-align:left;padding:6px}}
td{{border-bottom:1px solid #e5e5e5;padding:5px 6px;vertical-align:top}}
td:last-child{{white-space:nowrap}} tr{{page-break-inside:avoid}} thead{{display:table-header-group}}
@page{{size:A4;margin:14mm 10mm}}
</style></head><body>
<h1>Expected Closure Dates</h1>
<p class=sub>Open Opportunities in Sales OS · checked {today}</p>
<div class=why><b>Why this matters:</b> leadership wants to use Sales OS to plan <b>cash flow</b> (“which
Opportunities are expected by a certain date?”) and the <b>next quarterly vendor order</b> (“which machines are
likely to sell in the next six months?”). That only works when each open Opportunity has a realistic
<b>Expected Closure Date</b>. A rough month is fine, and it can be changed at any time as things move.</div>
{progress}
<h2>Where we are today</h2>
{table(["", "Opportunities", "Value"], [
    ("Open Opportunities", f"<b>{len(rows)}</b>", fmt_l(tot(rows))),
    ("Expected Closure Date in the future", f"<b>{len(fut)}</b>", fmt_l(tot(fut))),
    ("Expected Closure Date already passed", f"<b>{len(s1)}</b>", fmt_l(tot(s1))),
    ("No Expected Closure Date", f"<b>{len(nodate)}</b>", fmt_l(tot(nodate))),
])}
<p>We don't need all of these fixed at once. Below are four small steps, starting with the ones that matter most
for planning.</p>

<h2>Step 1 — please update now: dates that have passed ({len(s1)} Opportunities, {fmt_l(tot(s1))})</h2>
<p>These Opportunities had an Expected Closure Date that has now gone by, and they are still open.</p>
<div class=act><b>Action (owner):</b> if the Opportunity is still going, move the date to when you now expect it
to close. If it has been won or lost, please mark it Won or Lost.</div>
{table(["Owner", "Opportunity", "Hospital", "Stage", "Date entered", "Value"],
       [(e(r["owner"]), e(r["opp"]), e(r["hosp"]), e(r["stage"]), fmt_d(r["ecd"]), fmt_l(r["value"])) for r in s1])}

<h2>Step 2 — next: Opportunities at Demo stage or later with no date ({len(s2)} Opportunities, {fmt_l(tot(s2))})</h2>
<p>These are the Opportunities closest to an order (Demo stage or later, or marked High Priority), but they have
no Expected Closure Date yet.</p>
<div class=act><b>Action (owner):</b> add your best guess of the month it will close. It can be changed later.</div>
{table(["Owner", "Opportunity", "Hospital", "Stage", "Value"],
       [(e(r["owner"]), e(r["opp"]), e(r["hosp"]), e(r["stage"]), fmt_l(r["value"])) for r in s2])}

<h2>Step 3 — Lead-stage Opportunities with a higher chance of winning ({len(lead_high)} Opportunities)</h2>
<p>Every new Opportunity starts at <b>{lead_default:.0f}%</b> at Lead stage, and the chance rises as it moves
through the stages ({defaults}). These Opportunities are still at Lead stage but have a higher chance entered by
hand. The weighted forecast uses that number, so a high chance at Lead stage makes the forecast look bigger than
it really is.</p>
<div class=act><b>Action (owner):</b> if the Opportunity has moved on (need confirmed, demo done, quote sent),
please <b>move it to the right stage</b>, and the chance follows. If it is still an early lead, please set the
chance back to {lead_default:.0f}%. If you feel strongly about an Opportunity, tick <b>High Priority</b>
instead.</div>
{table(["Owner", "Opportunity", "Hospital", "Chance entered", "Value"],
       [(e(r["owner"]), e(r["opp"]), e(r["hosp"]), f"{r['pct']:.0f}%", fmt_l(r["value"])) for r in lead_high])}

<h2>Step 4 — later: early-stage Opportunities with no date ({len(s4)} Opportunities)</h2>
<p><b>No action needed yet.</b> These are at Lead or Qualified stage. We'll come back to them once Steps 1 to 3
are done. For information, by owner:</p>
{table(["Owner", "Opportunities", "Value"], [(e(o), n, fmt_l(s4_val[o])) for o, n in sorted(s4_by.items())])}

<p class=note>Prepared from Sales OS data (read-only) on {today}. Questions: contact Basheer.</p>
</body></html>"""
    return page, counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--env", choices=["uat", "dev"], default="uat")
    parser.add_argument("--out", required=True, type=Path, help="folder for the review copy (HTML + PDF)")
    args = parser.parse_args()
    print(f"Environment: {args.env.upper()}")

    stages, rows = fetch(args.env)
    now = datetime.now()
    prev = previous_counts() if args.env == "uat" else None
    page, counts = build_html(stages, rows, f"{now.day} {now:%B %Y}", prev)

    args.out.mkdir(parents=True, exist_ok=True)
    stem = f"Expected-Closure-Dates-{now:%Y-%m-%d}{'' if args.env == 'uat' else '-DEV'}"
    html_path = args.out / f"{stem}.html"
    pdf_path = args.out / f"{stem}.pdf"
    html_path.write_text(page, encoding="utf-8")
    if EDGE.exists():
        subprocess.run([str(EDGE), "--headless", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={pdf_path}", html_path.resolve().as_uri()], check=False)
    print(f"Open Opportunities: {len(rows)} | " + " | ".join(f"{k}={v}" for k, v in counts.items()))
    print(f"Review copy: {pdf_path if pdf_path.exists() else html_path}")

    if args.env != "uat":
        print("Dev trial -- run log not written.")
        return
    RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with RUN_LOG.open("a", encoding="utf-8") as f:
        f.write(f"{now:%Y-%m-%d %H:%M} | closure: " + "; ".join(f"{k}={v}" for k, v in counts.items()) + "\n")
    print(f"Run logged to {RUN_LOG}")


if __name__ == "__main__":
    main()
