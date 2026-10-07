#!/usr/bin/env python3
"""Query audit: how much database work each screen's GET request does.

Dev only, read-only. Plan: docs/Query-Load-Fixes-Implementation-Plan.md (D4).

Runs GET requests in-process (FastAPI TestClient) against the Dev database in
backend/.env, as real users. Each request gets its own connection inside a
READ ONLY transaction that is always rolled back; any INSERT/UPDATE/DELETE the
request tries is swapped for a no-op before it reaches the database. Refuses
to run if the database URL looks like UAT (transaction pooler port 6543 or
"uat" in the URL).

Per request it records: statements fired, joins (largest statement / total),
largest statement size, planning time (EXPLAIN SUMMARY, not executed) and
response size.

Before/after check for a fix (D5):
  1. before the fix:  --only <screen> --save-responses <folder>
  2. after the fix:   --only <screen> --compare-responses <folder>
  The second run reports any request whose response data changed.

Saves (PUT/PATCH) are not run here; a save's re-read goes through the same
list functions as its GET, so the GET comparison covers its response.

Usage:
  query_audit.py --out <file.json> [--only TEXT ...] [--as NAME ...]
                 [--id key=value ...] [--save-responses DIR | --compare-responses DIR]

  --only   keep routes whose path contains TEXT (e.g. "/opportunities/{opportunity_id}")
  --as     display names of users to run as (default: Admin, SBU Manager and
           Sales Staff test users below)
  --id     override a path id (e.g. --id opportunity_id=<uuid>)

Run with backend/.venv/Scripts/python.exe. Write --out and the response
folders to the session scratchpad, never inside the repo.
"""

import argparse
import json
import os
import re
import sys
import uuid
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)  # app settings read .env from the working directory

from dotenv import dotenv_values  # noqa: E402

ENV = dotenv_values(BACKEND / ".env")
_url = ENV.get("DATABASE_URL") or ""
if "uat" in _url.lower() or ":6543" in _url:
    sys.exit("refusing: DATABASE_URL looks like UAT; this script is Dev only")

from fastapi import Depends  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event, text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.api.dependencies import get_current_user  # noqa: E402
from app.db.session import get_db, set_rls_context  # noqa: E402
from app.domains.organization.models import UserProfile  # noqa: E402
from app.main import app  # noqa: E402

P = "/api/v1"
DEFAULT_USERS = ["Abdul Latheef P", "Basheer K", "Vivek"]  # Admin, SBU Manager, Sales Staff
SKIP = {P + "/health", P + "/version", P + "/documents/{document_id}/download-url"}

# Dev test data the audit of 2026-10-06 used (override with --id).
IMG = "88888888-8888-8888-8888-800000000001"  # Imaging SBU
BRAND = "16953418-d885-4c43-9a18-da71ed8c1620"
ACC = "dddddddd-dddd-dddd-dddd-020000000002"
FIXED_IDS = {
    # "usg m/c" (Imaging): 1 product line, 2 splits, 1 stakeholder.
    "opportunity_id": "c6c45c4a-05c7-4b60-8f72-8cd10217f8ba",
}
# Sales Staff can't see "usg m/c"; Vivek's own "New USG m/c" (Critical Care,
# 1 product line, 2 splits, no stakeholder or documents) is the richest Sales
# Staff Opportunity on Dev (2026-10-06). --id overrides these too.
PER_USER_IDS = {
    "Vivek": {"opportunity_id": "5bb6f4f8-f39d-4685-a79a-66176b5661da"},
}
ID_QUERIES = {
    "account_id": "SELECT id FROM account WHERE name='Aster MIMS Calicut' LIMIT 1",
    "project_id": "SELECT project_id FROM opportunity WHERE project_id IS NOT NULL "
    "GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "product_id": "SELECT product_id FROM opportunity_item GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "lead_id": "SELECT marketing_lead_id FROM marketing_lead_comment GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "stakeholder_id": "SELECT stakeholder_id FROM opportunity_stakeholder GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "activity_id": "SELECT activity_id FROM activity_comment GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "zone_id": "SELECT id FROM zone WHERE name='North Kerala' LIMIT 1",
    # Not a path id: the Pipeline's stage filter (VARIANTS below).
    "stage_id": "SELECT stage_id FROM opportunity GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
    "user_id": "SELECT id FROM user_profile WHERE display_name='Basheer K' LIMIT 1",
    # Not a path id: the Daily Activity Report's day (busiest on Dev, so the
    # before/after comparison has rows to compare); fills QUERY_PARAMS below.
    "report_date": "SELECT (activity_date AT TIME ZONE 'Asia/Kolkata')::date FROM activity "
    "GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1",
}
QUERY_PARAMS = {
    P + "/master-data/zones/search": {"q": "Ker"},
    P + "/master-data/zones/search-for-hospital": {"q": "Ker"},
    P + "/accounts/counts": {"ids": ACC},
    P + "/stakeholders/counts": {"ids": "a3d390a7-40c0-43a5-9eee-79edd08f3188"},
    P + "/opportunities/pipeline": {"page_size": 500},  # the screen's own size (listPipeline)
    P + "/activities": {},  # report_date: busiest day, set from ID_QUERIES in main()
    P + "/admin/zones/name-check": {"name": "Calicut"},
    P + "/reference/brands": {"sbu_id": IMG},
    P + "/reference/categories": {"sbu_id": IMG},
    P + "/reference/models": {"brand_id": BRAND},
    P + "/reporting/activity-levels": {"start_date": "2026-07-01", "end_date": "2026-09-30"},
    P + "/planning/targets/team": {"sbu_id": IMG, "planning_period": "2026-Q3"},
    P + "/planning/targets/target-vs-actuals": {"sbu_id": IMG, "planning_period": "2026-Q3"},
    P + "/planning/targets/overlaps": {"sbu_id": IMG, "planning_period": "2026-Q3", "account_ids": [ACC]},
    P + "/planning/targets/brand-rollups": {"brand_ids": [BRAND], "planning_period": "2026-Q3"},
    P + "/planning/brand-vendor-targets": {"planning_period": "2026-Q3"},
}
# Extra runs of a route with filters that take a different path through the
# database (Query Load Fixes fix 3). "{key}" values are filled from the ids
# above. Results and saved responses are keyed "<user> GET <path> [<label>]".
VARIANTS = {
    P + "/opportunities/pipeline": {
        "zone": {"zone_id": "{zone_id}"},
        "stage": {"stage_id": "{stage_id}"},
        "team only": {"owner_team_only": "true"},  # every report drill-down
        "product": {"product_id": "{product_id}"},
    },
}

engine = create_engine(ENV["DATABASE_URL"], pool_size=1, max_overflow=0)
admin_engine = create_engine(ENV["ADMIN_DATABASE_URL"], pool_size=1, max_overflow=0)

WRITE_RE = re.compile(r"^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE)\b", re.I)
captured: list[tuple[str, object]] = []
blocked: list[str] = []
planning_ms: list[float] = []
current_user_id: dict[str, uuid.UUID | None] = {"id": None}


@event.listens_for(engine, "before_cursor_execute", retval=True)
def _capture(conn, cursor, statement, parameters, context, executemany):
    if WRITE_RE.match(statement):
        blocked.append(statement[:120])
        return "SELECT 1 WHERE false", {}
    if statement.lstrip().upper().startswith("SELECT") and "set_config(" not in statement:
        captured.append((statement, parameters))
    return statement, parameters


def _explain_captured(conn) -> None:
    raw = conn.connection.dbapi_connection
    for stmt, params in list(captured):
        cur = raw.cursor()
        try:
            cur.execute("SAVEPOINT audit_explain")
            cur.execute("EXPLAIN (SUMMARY ON, FORMAT JSON) " + stmt, params or None)
            planning_ms.append(float(cur.fetchone()[0][0].get("Planning Time", 0.0)))
            cur.execute("RELEASE SAVEPOINT audit_explain")
        except Exception:
            cur.execute("ROLLBACK TO SAVEPOINT audit_explain")
            planning_ms.append(-1.0)
        finally:
            cur.close()


def _db_override():
    conn = engine.connect()
    trans = conn.begin()
    conn.exec_driver_sql("SET TRANSACTION READ ONLY")
    sess = Session(bind=conn, join_transaction_mode="create_savepoint", autoflush=False)
    try:
        yield sess
        _explain_captured(conn)
    finally:
        sess.close()
        trans.rollback()  # always: nothing is ever kept
        conn.close()


def _user_override(db: Session = Depends(get_db)) -> UserProfile:
    user = db.get(UserProfile, current_user_id["id"])
    set_rls_context(db, user)
    return user


def _lookup_ids(user_names: list[str]) -> tuple[dict[str, str], dict[str, str]]:
    ids: dict[str, str] = dict(FIXED_IDS)
    with admin_engine.connect() as c:
        c.exec_driver_sql("SET TRANSACTION READ ONLY")
        for key, sql in ID_QUERIES.items():
            row = c.execute(text(sql)).first()
            if row:
                ids[key] = str(row[0])
        rows = c.execute(
            text("SELECT display_name, id FROM user_profile WHERE display_name = ANY(:n)"),
            {"n": user_names},
        ).all()
        c.rollback()
    users = {name: str(uid) for name, uid in rows}
    missing = [n for n in user_names if n not in users]
    if missing:
        sys.exit(f"users not found on Dev: {missing}")
    return ids, users


def _diff(a, b, path="") -> str | None:
    """First difference between two JSON values, as a readable path."""
    if type(a) is not type(b):
        return f"{path or '/'}: type {type(a).__name__} -> {type(b).__name__}"
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                return f"{path}/{k}: {'added' if k not in a else 'removed'}"
            d = _diff(a[k], b[k], f"{path}/{k}")
            if d:
                return d
        return None
    if isinstance(a, list):
        if len(a) != len(b):
            return f"{path or '/'}: {len(a)} -> {len(b)} items"
        for i, (x, y) in enumerate(zip(a, b, strict=True)):
            d = _diff(x, y, f"{path}[{i}]")
            if d:
                return d
        return None
    return None if a == b else f"{path or '/'}: {a!r} -> {b!r}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True, type=Path, help="results JSON file (session scratchpad)")
    ap.add_argument("--only", nargs="*", default=[], help="keep routes whose path contains any of these")
    ap.add_argument("--as", dest="users", nargs="*", default=DEFAULT_USERS)
    ap.add_argument("--id", nargs="*", default=[], help="key=value path id overrides")
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--save-responses", type=Path)
    group.add_argument("--compare-responses", type=Path)
    args = ap.parse_args()

    repo = BACKEND.parent.resolve()
    for p in (args.out, args.save_responses, args.compare_responses):
        if p and repo in p.resolve().parents:
            sys.exit(f"refusing: {p} is inside the repo; use the session scratchpad")

    base_ids, users = _lookup_ids(args.users)
    overrides = dict(kv.partition("=")[::2] for kv in args.id)
    QUERY_PARAMS[P + "/activities"]["report_date"] = overrides.get("report_date", base_ids["report_date"])

    routes = [
        path
        for path, ops in app.openapi()["paths"].items()
        if "get" in ops and path not in SKIP and (not args.only or any(o in path for o in args.only))
    ]
    if not routes:
        sys.exit(f"no GET routes match {args.only}")

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _user_override
    client = TestClient(app, raise_server_exceptions=False)

    saved: dict[str, object] = {}
    if args.compare_responses:
        saved = json.loads((args.compare_responses / "responses.json").read_text(encoding="utf-8"))
    responses: dict[str, object] = {}
    results = []
    changed = 0

    for name, uid in users.items():
        current_user_id["id"] = uuid.UUID(uid)
        ids = {**base_ids, **PER_USER_IDS.get(name, {}), **overrides}
        for path in routes:
            missing = [k for k in re.findall(r"{(\w+)}", path) if not ids.get(k)]
            if missing:
                results.append({"user": name, "path": path, "status": "no-id:" + ",".join(missing)})
                continue
            url = re.sub(r"{(\w+)}", lambda m, ids=ids: ids[m.group(1)], path)
            runs = [("", QUERY_PARAMS.get(path, {}))] + [
                (label, {**QUERY_PARAMS.get(path, {}), **extra}) for label, extra in VARIANTS.get(path, {}).items()
            ]
            for label, raw_params in runs:
                params = {
                    k: re.sub(r"{(\w+)}", lambda m, ids=ids: ids[m.group(1)], v) if isinstance(v, str) else v
                    for k, v in raw_params.items()
                }
                changed += _run(client, name, path, label, url, params, saved, responses, results, args)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(results, indent=1), encoding="utf-8")
    if args.save_responses:
        args.save_responses.mkdir(parents=True, exist_ok=True)
        (args.save_responses / "responses.json").write_text(
            json.dumps(responses, indent=1, default=str), encoding="utf-8"
        )
    if args.compare_responses:
        print(f"\nResponses compared: {len(responses)}, changed: {changed}")
        return 1 if changed else 0
    return 0


def _run(client, name, path, label, url, params, saved, responses, results, args) -> int:
    """One request: measure it, record it, compare it. Returns 1 if changed."""
    captured.clear()
    planning_ms.clear()
    blocked.clear()
    resp = client.get(url, params=params, headers={"Authorization": "Bearer x"})
    joins = [s.upper().count(" JOIN ") for s, _ in captured]
    shown = f"{path} [{label}]" if label else path
    row = {
        "user": name,
        "path": shown,
        "status": resp.status_code,
        "detail": resp.text[:160] if resp.status_code >= 400 else "",
        "statements": len(captured),
        "max_joins": max(joins, default=0),
        "total_joins": sum(joins),
        "max_chars": max((len(s) for s, _ in captured), default=0),
        "plan_ms_max": round(max(planning_ms, default=0.0), 1),
        "plan_ms_total": round(sum(p for p in planning_ms if p > 0), 1),
        "explain_failed": sum(1 for p in planning_ms if p < 0),
        "resp_bytes": len(resp.content),
        "blocked_writes": list(blocked),
    }
    key = f"{name} GET {shown}"
    body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
    responses[key] = {"status": resp.status_code, "body": body}
    changed = 0
    if args.compare_responses:
        before = saved.get(key)
        diff = "not in saved responses" if before is None else _diff(before, responses[key])
        row["same_as_before"] = diff is None
        if diff:
            row["difference"] = diff
            changed = 1
    results.append(row)
    print(
        f"{name[:12]:12} {resp.status_code} {row['statements']:3} st {row['max_joins']:3} j "
        f"{row['plan_ms_max']:7.1f} ms  {shown}"
        + ("" if row.get("same_as_before", True) else f"  CHANGED: {row['difference']}")
    )
    return changed


if __name__ == "__main__":
    sys.exit(main())
