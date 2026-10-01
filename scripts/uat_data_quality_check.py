#!/usr/bin/env python3
"""Read-only UAT data-quality check. Uses the app-role (RLS-enforced)
connection from backend/.env.uat -- never ADMIN_DATABASE_URL. Impersonates
a real Admin/GM user's RLS context (session-local, not a real login) so
results reflect full company-wide data rather than silently-empty RLS
denials on an unauthenticated connection.

`--env dev` runs the same checks against Dev (backend/.env) as a trial
before a UAT run; it doesn't write the UAT run log.
"""

import argparse
import difflib
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras

sys.stdout.reconfigure(encoding="utf-8")
ENV_FILES = {
    "uat": Path(__file__).resolve().parent.parent / "backend" / ".env.uat",
    "dev": Path(__file__).resolve().parent.parent / "backend" / ".env",
}
# Above ₹20 Cr for one person's quarter (or one brand's vendor target) is
# almost certainly a Rupees-for-Lakhs slip; the largest real annual brand
# target is ~₹14 Cr (Basheer, 2026-09-29).
TARGET_LIMIT_LAKHS = 2000
# One line per completed run, next to backup_log.txt. The SessionStart hook in
# .claude/settings.json reads the last line to remind when a run is due
# (every alternate day, run under Basheer's supervision).
RUN_LOG = Path(r"C:\Backups\CabioUAT\data_consistency_reports\data_quality_log.txt")


def load_env(path: Path) -> dict[str, str]:
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env", choices=["uat", "dev"], default="uat")
    args = parser.parse_args()
    print(f"Environment: {args.env.upper()}\n")

    env = load_env(ENV_FILES[args.env])
    dsn = env["DATABASE_URL"]

    conn = psycopg2.connect(dsn)
    # One read-only transaction for the whole run, rolled back at the end.
    # UAT connects through Supabase's transaction pooler (port 6543), which
    # may hand each transaction to a different server connection; with
    # autocommit, every statement was its own transaction, so a
    # session-level RLS setting could be missing for a later query (which
    # then silently returned too few rows) or linger for other clients.
    # Found 2026-10-01: a UAT run printed a count, then an empty list for the
    # same rows. Dev uses the session pooler (5432), so it never showed.
    conn.set_session(readonly=True, autocommit=False)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Find one active Admin/GM to impersonate for RLS context (unrestricted
    # visibility, same as those roles get in the real app). user_profile
    # itself is broadly readable (picker use cases), so this needs no
    # context of its own.
    cur.execute("""
        SELECT up.id, up.sbu_id, up.role_id, up.display_name, r.role_name
        FROM user_profile up JOIN role r ON r.id = up.role_id
        WHERE r.role_name IN ('Admin', 'General Manager') AND up.is_active = true
        LIMIT 1
    """)
    admin = cur.fetchone()
    if not admin:
        print("No active Admin/GM found -- cannot establish unrestricted RLS context. Aborting.")
        return
    print(f"Impersonating RLS context: {admin['display_name']} ({admin['role_name']})\n")

    # is_local=true (the third arg), same as the app's own set_rls_context():
    # the settings live exactly as long as this script's single transaction.
    # (2026-09-15 used session-scoped settings under autocommit, because a
    # transaction-local setting vanished after each autocommitted statement;
    # replaced 2026-10-01, see the connection comment above.)
    #
    # Admin/GM's sbu_id is a NOT-NULL placeholder in the app's own schema
    # convention, but this particular admin row has it as SQL NULL -- guard
    # against Python's None stringifying to the literal text "None" (not a
    # valid uuid) by passing empty string instead, same as the app's own
    # NULLIF(..., '') handling in cabio_app_sbu_id().
    cur.execute(
        "SELECT set_config('app.current_user_id', %s, true), "
        "set_config('app.current_sbu_id', %s, true), "
        "set_config('app.current_role_id', %s, true)",
        (
            str(admin["id"]),
            str(admin["sbu_id"]) if admin["sbu_id"] else "",
            str(admin["role_id"]),
        ),
    )
    cur.execute("SELECT cabio_app_uid() AS uid, cabio_app_role_name() AS role_name")
    verify = cur.fetchone()
    if verify["uid"] is None or verify["role_name"] not in ("Admin", "General Manager"):
        print(f"RLS context did not take effect: {verify}. Aborting rather than report wrong data.")
        return
    print(f"RLS context verified live: uid={verify['uid']}, role={verify['role_name']}\n")

    cur.execute("""
        SELECT (SELECT COUNT(*) FROM account) AS accounts,
               (SELECT COUNT(*) FROM opportunity) AS opportunities,
               (SELECT COUNT(*) FROM activity) AS activities,
               (SELECT COUNT(*) FROM reminder) AS reminders,
               (SELECT COUNT(*) FROM target_plan) AS target_plans,
               (SELECT COUNT(*) FROM product) AS products,
               (SELECT COUNT(*) FROM marketing_lead_comment) AS lead_comments
    """)
    print(f"Sanity totals (should all be >0 and match known scale): {cur.fetchone()}")

    def section(title: str) -> None:
        print(f"\n{'=' * 70}\n{title}\n{'=' * 70}")

    counts: list[tuple[str, int]] = []

    def run(sql: str, label: str, limit: int = 40) -> list[dict]:
        cur.execute(sql)
        rows = cur.fetchall()
        counts.append((label, len(rows)))
        print(f"\n-- {label} ({len(rows)} found)")
        for r in rows[:limit]:
            print(f"   {dict(r)}")
        if len(rows) > limit:
            print(f"   ... and {len(rows) - limit} more")
        return rows

    # 1. Duplicate account names
    section("1. Duplicate hospital/account names")
    run("""
        SELECT name, COUNT(*) AS cnt, array_agg(id) AS ids
        FROM account GROUP BY name HAVING COUNT(*) > 1 ORDER BY cnt DESC
    """, "Duplicate names")

    # 2. Implausible indicative_value (Lakhs/Rupees mixup pattern)
    section("2. Opportunities with implausible values (possible Lakhs/Rupees mixup)")
    run("""
        SELECT o.name, a.name AS account_name, o.indicative_value
        FROM opportunity o JOIN account a ON a.id = o.account_id
        WHERE o.indicative_value > 1000
        ORDER BY o.indicative_value DESC
    """, "indicative_value > 1000 Lakhs (Rs 10 Cr+)")

    # 3. Accounts with zero Opportunities and zero Activity
    section("3. Accounts with zero Opportunities and zero Activity")
    run("""
        SELECT a.name, z.name AS zone_name, a.customer_type, a.created_at::date AS created
        FROM account a
        LEFT JOIN zone z ON z.id = a.zone_id
        WHERE NOT EXISTS (SELECT 1 FROM opportunity o WHERE o.account_id = a.id)
          AND NOT EXISTS (SELECT 1 FROM activity act WHERE act.account_id = a.id)
        ORDER BY a.name
    """, "Dead accounts")

    # 4. Opportunities with zero Activity logged
    section("4. Opportunities with zero Activity logged")
    run("""
        SELECT o.name, a.name AS account_name, ost.stage_name, os.status_code,
               up.display_name AS owner, o.created_at::date AS created
        FROM opportunity o
        JOIN account a ON a.id = o.account_id
        JOIN opportunity_status os ON os.id = o.status_id
        JOIN opportunity_stage ost ON ost.id = o.stage_id
        JOIN user_profile up ON up.id = o.owner_id
        WHERE NOT EXISTS (SELECT 1 FROM activity act WHERE act.opportunity_id = o.id)
        ORDER BY o.created_at DESC
    """, "Opportunities with no Activity", limit=100)

    # 5. Splits not summing to 100%
    section("5. Opportunities whose splits don't sum to 100%")
    run("""
        SELECT o.id, o.name, SUM(s.split_percentage) AS total_pct
        FROM opportunity o JOIN split s ON s.opportunity_id = o.id
        GROUP BY o.id, o.name
        HAVING SUM(s.split_percentage) <> 100
    """, "Bad splits")

    # 6. WON/LOST opportunities whose line items changed *after* the deal
    # closed. Edits made before closing are normal and ignored. Close time
    # is opportunity.closed_at where that column exists (on UAT since
    # 2026-09-27, but empty for deals closed before then -- see section 15),
    # else the latest audit_log row that moved the deal to its
    # current status. Deals with no knowable close time are listed separately
    # as information, not as problems.
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'opportunity' AND column_name = 'closed_at'
    """)
    audit_close = """(SELECT MAX(al.changed_at) FROM audit_log al
                      WHERE al.table_name = 'opportunity' AND al.record_id = o.id
                        AND al.new_data->>'status_id' = o.status_id::text
                        AND al.old_data->>'status_id' IS DISTINCT FROM al.new_data->>'status_id')"""
    close_expr = f"COALESCE(o.closed_at, {audit_close})" if cur.fetchone() else audit_close
    edits_6 = f"""
        WITH closed AS (
            SELECT o.id, o.name, a.name AS account_name, os.status_code, {close_expr} AS closed_at
            FROM opportunity o
            JOIN opportunity_status os ON os.id = o.status_id
            JOIN account a ON a.id = o.account_id
            WHERE os.status_code IN ('WON', 'LOST')
        ), edits AS (
            SELECT c.*, al.changed_at AS edited_at, al.changed_by AS edited_by
            FROM closed c
            JOIN opportunity_item oi ON oi.opportunity_id = c.id
            JOIN audit_log al ON al.record_id = oi.id AND al.table_name = 'opportunity_item'
            UNION ALL
            SELECT c.*, oi.created_at, oi.created_by
            FROM closed c
            JOIN opportunity_item oi ON oi.opportunity_id = c.id
            WHERE oi.created_at > c.closed_at
        )
        SELECT e.name, e.account_name, e.status_code, e.closed_at::date AS closed,
               COUNT(*) AS edits, MAX(e.edited_at)::date AS last_edit,
               string_agg(DISTINCT up.display_name, ', ') AS edited_by
        FROM edits e
        LEFT JOIN user_profile up ON up.id = e.edited_by
        WHERE {{cond}}
        GROUP BY e.name, e.account_name, e.status_code, e.closed_at
        ORDER BY last_edit DESC
    """
    section("6. WON/LOST opportunities with line items changed after the deal closed")
    run(edits_6.format(cond="e.edited_at > e.closed_at"), "Closed deals edited after closing")
    run(edits_6.format(cond="e.closed_at IS NULL"),
        "Closed deals with item edits, close time unknown (information only)")

    # 7. Activities not following best practice
    section("7a. Non-Manager-Note Activities missing a mandatory next action (BR-ACT-04, via reminder table)")
    rows_7a = run("""
        SELECT act.activity_type, a.name AS account_name, up.display_name AS rep,
               act.created_at::date AS logged
        FROM activity act
        LEFT JOIN account a ON a.id = act.account_id
        JOIN user_profile up ON up.id = act.user_id
        WHERE act.activity_type <> 'MANAGER_NOTE'
          AND NOT EXISTS (SELECT 1 FROM reminder r WHERE r.activity_id = act.id)
        ORDER BY act.created_at DESC
    """, "Missing next action", limit=100)
    if rows_7a:
        by_rep = Counter(r["rep"] for r in rows_7a)
        print(f"\n   By rep: {dict(by_rep.most_common())}")

    # A short note is fine when it closes a clearly worded next action
    # ("PO follow up" -> "Done"): the next action carries the context
    # (BR-ACT-05). Flag only notes that leave a reader with nothing: no real
    # words at all, a generic standalone note, or a short answer to a vague
    # next action ("Follow up" -> "Done"). Reviewed with Basheer 2026-09-26.
    section("7b. Activity notes that don't say what happened")
    run("""
        WITH n AS (
            SELECT act.id, act.user_id, act.account_id, act.activity_type, act.notes, act.created_at,
                   r.reminder_text AS closes_next_action,
                   lower(regexp_replace(trim(act.notes), '[.!]+$', '')) IN
                       ('done', 'ok', 'okay', 'finished', 'completed', 'visited', 'called',
                        'follow up', 'followed up', 'follow up done', 'done follow up',
                        'done meeting') AS is_generic,
                   length(trim(act.notes)) < 15 AS is_short,
                   length(regexp_replace(coalesce(act.notes, ''), '[^A-Za-z]', '', 'g')) < 3 AS no_words,
                   lower(trim(r.reminder_text)) ~ '^fol+(ow)?([ -]?up)?\\.?$' AS vague_next_action
            FROM activity act
            LEFT JOIN reminder r ON r.closing_activity_id = act.id
        )
        SELECT up.display_name AS rep, a.name AS account_name, n.activity_type, n.notes,
               n.closes_next_action, n.created_at::date AS logged
        FROM n
        JOIN user_profile up ON up.id = n.user_id
        LEFT JOIN account a ON a.id = n.account_id
        WHERE n.no_words
           OR (n.closes_next_action IS NULL AND n.is_generic)
           OR (n.vague_next_action AND (n.is_short OR n.is_generic))
        ORDER BY n.created_at DESC
    """, "Notes that don't say what happened", limit=50)

    section("7c. Likely accidental double-submits (same opportunity, <5 min apart, same type)")
    cur.execute("""
        SELECT a.name AS account_name, up.display_name AS rep, a1.activity_type,
               a1.notes AS note1, a1.created_at AS t1, a2.notes AS note2, a2.created_at AS t2
        FROM activity a1
        JOIN activity a2 ON a2.opportunity_id = a1.opportunity_id
                         AND a2.activity_type = a1.activity_type
                         AND a2.id > a1.id
                         -- must compare by absolute time gap, not raw subtraction --
                         -- a naive "a2.created_at - a1.created_at < interval '5 minutes'"
                         -- also matches when a2 is *earlier* than a1 by any amount, since
                         -- a large negative interval still compares as "less than" 5 minutes.
                         -- (found live 2026-09-15: without ABS(), this matched pairs days/
                         -- weeks apart -- 122 false positives instead of the real 14.)
                         AND ABS(EXTRACT(EPOCH FROM (a2.created_at - a1.created_at))) < 300
        LEFT JOIN account a ON a.id = a1.account_id
        JOIN user_profile up ON up.id = a1.user_id
        WHERE a1.opportunity_id IS NOT NULL
        ORDER BY a1.created_at DESC
    """)
    pairs = cur.fetchall()
    print(f"\n-- Possible double-submits ({len(pairs)} candidates)")
    # Timing alone can't tell an accidental duplicate from a rep logging two
    # real, distinct updates in quick succession (found live 2026-09-15,
    # Basheer's catch) -- classify by note-text similarity instead of just
    # listing timestamps. High similarity + short text = likely a genuine
    # duplicate; anything else is probably a real sequential update and
    # shouldn't be reported as a problem.
    genuine = []
    for p in pairs:
        n1, n2 = (p["note1"] or "").strip().lower(), (p["note2"] or "").strip().lower()
        similarity = difflib.SequenceMatcher(None, n1, n2).ratio()
        if similarity > 0.85:
            genuine.append(p)
    print(f"   Of those, {len(genuine)} are near-identical text (likely genuine duplicates):")
    for p in genuine:
        print(f"   {p['rep']} -- {p['account_name']} ({p['activity_type']}): "
              f"\"{p['note1']}\" / \"{p['note2']}\" [{p['t1']} vs {p['t2']}]")
    if len(pairs) > len(genuine):
        print(f"   ({len(pairs) - len(genuine)} more candidates below the similarity threshold "
              f"-- most are real sequential updates, not duplicates, but the threshold (0.85) "
              f"is a heuristic, not a certainty: a near-identical-but-reworded note (e.g. the "
              f"same update restated with one new detail added) can sit just under it and get "
              f"missed here. Not printed by default -- drop the `if similarity > 0.85` filter "
              f"above to see every candidate's note text if doing a fully manual review.)")

    # 8. Order-stage/Won opportunities with a PO but zero Activity logged
    section("8. Order-stage/Won deals with a PO Number but zero Activity")
    run("""
        SELECT o.name, a.name AS account_name, o.po_number, ost.stage_name, os.status_code
        FROM opportunity o
        JOIN account a ON a.id = o.account_id
        JOIN opportunity_stage ost ON ost.id = o.stage_id
        JOIN opportunity_status os ON os.id = o.status_id
        WHERE o.po_number IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM activity act WHERE act.opportunity_id = o.id)
        ORDER BY o.created_at DESC
    """, "PO set, no Activity logged")

    # 9-15 cover what reached UAT in the 2026-09-27 move
    # (docs/UAT-Promotion-2026-09-Plan.md, migrations 0042-0054). Exact
    # duplicates (one target per person/SBU/quarter, one brand/category/model
    # name) are already blocked by unique constraints, so aren't checked.
    section("9. Target amounts that look wrong (Lakhs/Rupees mixup, or ₹0 submitted)")
    run(f"""
        SELECT up.display_name AS planner, tp.planning_period, tp.status, tp.target_amount_lakhs
        FROM target_plan tp JOIN user_profile up ON up.id = tp.user_id
        WHERE tp.target_amount_lakhs > {TARGET_LIMIT_LAKHS}
           OR (tp.target_amount_lakhs = 0 AND tp.status <> 'DRAFT')
        ORDER BY tp.planning_period DESC, up.display_name
    """, f"Targets above {TARGET_LIMIT_LAKHS} Lakhs or submitted at 0")
    run(f"""
        SELECT b.name AS brand, bvt.planning_period, bvt.vendor_target_amount_lakhs
        FROM brand_vendor_target bvt JOIN brand b ON b.id = bvt.brand_id
        WHERE bvt.vendor_target_amount_lakhs > {TARGET_LIMIT_LAKHS}
        ORDER BY bvt.planning_period DESC, b.name
    """, f"Brand vendor targets above {TARGET_LIMIT_LAKHS} Lakhs")

    section("10. Submitted/approved targets whose brand split doesn't add up to the total")
    run("""
        SELECT up.display_name AS planner, tp.planning_period, tp.status,
               tp.target_amount_lakhs, SUM(s.split_amount_lakhs) AS brand_split_total
        FROM target_plan tp
        JOIN target_plan_brand_split s ON s.target_plan_id = tp.id
        JOIN user_profile up ON up.id = tp.user_id
        WHERE tp.status IN ('PENDING_APPROVAL', 'APPROVED')
        GROUP BY tp.id, up.display_name, tp.planning_period, tp.status, tp.target_amount_lakhs
        HAVING SUM(s.split_amount_lakhs) <> tp.target_amount_lakhs
        ORDER BY tp.planning_period DESC, up.display_name
    """, "Brand split total differs from target")

    # planning_period "YYYY-Qn": YYYY is the fiscal year's start year, so Q1
    # starts 1 April YYYY and Q4 starts 1 January YYYY+1
    # (sales-os-app/src/utils/formatter.ts getCurrentPlanningPeriod).
    section("11. Targets still pending approval after their quarter began")
    run("""
        SELECT up.display_name AS planner, tp.planning_period, tp.target_amount_lakhs,
               tp.updated_at::date AS last_changed
        FROM target_plan tp JOIN user_profile up ON up.id = tp.user_id
        WHERE tp.status = 'PENDING_APPROVAL'
          AND make_date(left(tp.planning_period, 4)::int, 4, 1)
              + (right(tp.planning_period, 1)::int - 1) * interval '3 months' <= current_date
        ORDER BY tp.planning_period, up.display_name
    """, "Pending after quarter start")

    section("12. Catalogue names that differ only in capitals or spaces")
    run("""
        SELECT 'brand' AS kind, s.name AS scope, array_agg(b.name ORDER BY b.name) AS names
        FROM brand b JOIN sbu s ON s.id = b.sbu_id
        GROUP BY s.name, lower(regexp_replace(b.name, '\\s+', '', 'g')) HAVING COUNT(*) > 1
        UNION ALL
        SELECT 'category', s.name, array_agg(c.name ORDER BY c.name)
        FROM category c JOIN sbu s ON s.id = c.sbu_id
        GROUP BY s.name, lower(regexp_replace(c.name, '\\s+', '', 'g')) HAVING COUNT(*) > 1
        UNION ALL
        SELECT 'model', b.name, array_agg(m.name ORDER BY m.name)
        FROM model m JOIN brand b ON b.id = m.brand_id
        GROUP BY b.name, lower(regexp_replace(m.name, '\\s+', '', 'g')) HAVING COUNT(*) > 1
    """, "Look-alike catalogue names")

    section("13. Active products under a switched-off brand or model")
    run("""
        SELECT p.name AS product, b.name AS brand, b.is_active AS brand_active,
               m.name AS model, m.is_active AS model_active
        FROM product p
        JOIN brand b ON b.id = p.brand_id
        JOIN model m ON m.id = p.model_id
        WHERE p.is_active AND (NOT b.is_active OR NOT m.is_active)
        ORDER BY b.name, p.name
    """, "Active product, inactive brand/model")

    section("14. Marketing-lead comments with no real words")
    run("""
        SELECT up.display_name AS author, c.body, c.created_at::date AS written
        FROM marketing_lead_comment c JOIN user_profile up ON up.id = c.created_by
        WHERE length(regexp_replace(c.body, '[^A-Za-z]', '', 'g')) < 3
        ORDER BY c.created_at DESC
    """, "Empty-ish lead comments")

    # Before 2026-09-27 closed_at didn't exist on UAT: a known gap with a fix
    # planned (docs/Backlog.md "UAT: fill in missing \"date closed\" on closed
    # deals"). From then on the app stamps it on closing, so a deal the change
    # history shows closing on/after 27 Sep with no closed_at is an app fault.
    # Split by when the deal closed (audit_log, as in section 6), not when it
    # was last edited -- a pre-27-Sep close edited later is still the known gap.
    missing_close = f"""
        SELECT o.name, a.name AS account_name, os.status_code,
               ({audit_close})::date AS closed_per_history
        FROM opportunity o
        JOIN account a ON a.id = o.account_id
        JOIN opportunity_status os ON os.id = o.status_id
        WHERE os.status_code IN ('WON', 'LOST') AND o.closed_at IS NULL
          AND {{cond}}
        ORDER BY o.name
    """
    section("15. Closed (Won/Lost) deals with no close date")
    run(missing_close.format(cond=f"COALESCE({audit_close}, '2000-01-01') < '2026-09-27'"),
        "No close date, closed before 27 Sep or before history began (known gap)", limit=10)
    run(missing_close.format(cond=f"{audit_close} >= '2026-09-27'"),
        "No close date, closed on/after 27 Sep (app fault?)")

    # A hospital filed at region level (zone_level ZONE, or STATE above it)
    # is invisible to every district- or cluster-level rep, so they can't
    # plan or work it. Re-filing into districts was chosen 2026-09-30
    # (Option A, pending Haroon); this tracks the count as it falls.
    section("16. Hospitals filed at region level instead of a district")
    cur.execute("""
        SELECT COALESCE(z.zone_level, '(none)') AS level, COUNT(*) AS cnt
        FROM account a LEFT JOIN zone z ON z.id = a.zone_id
        GROUP BY 1 ORDER BY cnt DESC
    """)
    spread = " · ".join(f"{r['level']}: {r['cnt']}" for r in cur.fetchall())
    print(f"\n-- All hospitals by filing level (information only): {spread}")
    rows_16 = run("""
        SELECT a.name, z.name AS region, z.zone_level, a.customer_type
        FROM account a JOIN zone z ON z.id = a.zone_id
        WHERE z.zone_level IN ('ZONE', 'STATE')
        ORDER BY z.name, a.name
    """, "Filed at region level", limit=100)
    if rows_16:
        by_region = Counter(r["region"] for r in rows_16)
        print(f"\n   By region: {dict(by_region.most_common())}")

    # Every result above came from the same transaction; confirm the RLS
    # context was still in place for the last query before trusting them.
    cur.execute("SELECT cabio_app_uid() AS uid")
    if cur.fetchone()["uid"] is None:
        print("\nRLS context was lost during the run -- results NOT trusted, run log not written.")
        conn.rollback()
        conn.close()
        return
    conn.rollback()
    cur.close()
    conn.close()

    if args.env != "uat":
        print(f"\nDone ({args.env.upper()} trial -- UAT run log not written).")
        return
    RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
    summary = "; ".join(f"{label}={n}" for label, n in counts)
    with RUN_LOG.open("a", encoding="utf-8") as f:
        f.write(f"{datetime.now():%Y-%m-%d %H:%M} | {summary}\n")
    print(f"\nDone. Run logged to {RUN_LOG}")


if __name__ == "__main__":
    main()
