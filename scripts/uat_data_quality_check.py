#!/usr/bin/env python3
"""Read-only UAT data-quality check. Uses the app-role (RLS-enforced)
connection from backend/.env.uat -- never ADMIN_DATABASE_URL. Impersonates
a real Admin/GM user's RLS context (session-local, not a real login) so
results reflect full company-wide data rather than silently-empty RLS
denials on an unauthenticated connection.
"""

import difflib
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import psycopg2
import psycopg2.extras

sys.stdout.reconfigure(encoding="utf-8")
ENV_FILE = Path(__file__).resolve().parent.parent / "backend" / ".env.uat"
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
    env = load_env(ENV_FILE)
    dsn = env["DATABASE_URL"]

    conn = psycopg2.connect(dsn)
    conn.set_session(readonly=True, autocommit=True)
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

    # is_local=false (the third arg) -- the app's own set_rls_context() uses
    # true (transaction-local) because it runs inside one request's own
    # transaction. This script runs under autocommit, so each cur.execute()
    # is its own transaction; a transaction-local setting would vanish
    # before the next query ever saw it. false makes it session-scoped
    # instead, so it survives across every subsequent autocommit statement
    # on this same connection. (Found the hard way, 2026-09-15 -- the first
    # run of this script silently reported zero on every opportunity/
    # reminder-dependent check because of exactly this.)
    #
    # Admin/GM's sbu_id is a NOT-NULL placeholder in the app's own schema
    # convention, but this particular admin row has it as SQL NULL -- guard
    # against Python's None stringifying to the literal text "None" (not a
    # valid uuid) by passing empty string instead, same as the app's own
    # NULLIF(..., '') handling in cabio_app_sbu_id().
    cur.execute(
        "SELECT set_config('app.current_user_id', %s, false), "
        "set_config('app.current_sbu_id', %s, false), "
        "set_config('app.current_role_id', %s, false)",
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
               (SELECT COUNT(*) FROM reminder) AS reminders
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
    # is opportunity.closed_at where that column exists (not yet on UAT as of
    # 2026-09-26), else the latest audit_log row that moved the deal to its
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

    cur.close()
    conn.close()

    RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
    summary = "; ".join(f"{label}={n}" for label, n in counts)
    with RUN_LOG.open("a", encoding="utf-8") as f:
        f.write(f"{datetime.now():%Y-%m-%d %H:%M} | {summary}\n")
    print(f"\nDone. Run logged to {RUN_LOG}")


if __name__ == "__main__":
    main()
